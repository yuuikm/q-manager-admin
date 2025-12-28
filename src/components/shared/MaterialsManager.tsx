import { type FC, useState, useEffect, useCallback } from 'react';
import { type FormikProps } from 'formik';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';
import Button from './Button';

export interface Material {
  id?: number;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'doc' | 'link' | 'text';
  file?: File | null;
  external_url?: string;
  content?: string;
  duration_minutes?: number;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

interface MaterialsManagerProps<V extends Record<string, any>> {
  form: FormikProps<V>;
  courseId?: number;
  editMode?: boolean;
  onMaterialsChange?: (materials: Material[]) => void;
}

const MaterialsManager = <V extends Record<string, any>>({
  form,
  courseId,
  editMode = false,
  onMaterialsChange
}: MaterialsManagerProps<V>) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const fetchMaterials = useCallback(async () => {
    console.log('MaterialsManager: fetchMaterials called with courseId:', courseId);
    if (!courseId) {
      console.log('MaterialsManager: No courseId, skipping fetch');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      console.log('MaterialsManager: Fetching materials for course:', courseId);
      const response = await fetch(`${ADMIN_ENDPOINTS.COURSE_MATERIALS}?course_id=${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('MaterialsManager: Fetch response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('MaterialsManager: Fetched materials:', data);
        const uniqueById = Array.isArray(data)
          ? Object.values(
            (data as Material[]).reduce<Record<string, Material>>((acc, item) => {
              const key = String(item.id ?? `tmp-${item.title}-${item.sort_order}`);
              acc[key] = item;
              return acc;
            }, {})
          )
          : [];
        setMaterials(uniqueById as Material[]);
      } else {
        console.error('MaterialsManager: Failed to fetch materials:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (editMode && courseId) {
      fetchMaterials();
    }
  }, [editMode, courseId, fetchMaterials]);

  useEffect(() => {
    console.log('MaterialsManager: materials changed:', materials);
    if (onMaterialsChange) {
      console.log('MaterialsManager: calling onMaterialsChange with:', materials);
      onMaterialsChange(materials);
    }
    // Update the form's materials field for validation
    if (form.setFieldValue) {
      console.log('MaterialsManager: updating form materials field with:', materials);
      form.setFieldValue('materials', materials);
    }
  }, [materials, onMaterialsChange, form]);

  const addMaterial = () => {
    console.log('MaterialsManager: addMaterial called');
    const newMaterial: Material = {
      title: '',
      description: '',
      type: 'text',
      sort_order: materials.length,
      is_required: false,
      is_active: true,
    };
    console.log('MaterialsManager: Creating new material:', newMaterial);
    setEditingMaterial(newMaterial);
    setShowAddForm(true);
  };

  const editMaterial = (material: Material) => {
    // Use a shallow copy to avoid mutating list item by reference
    setEditingMaterial({ ...material });
    setShowAddForm(true);
  };

  const saveMaterial = async (materialData: Material) => {
    console.log('MaterialsManager: saveMaterial called with:', materialData);
    console.log('MaterialsManager: courseId:', courseId, 'editMode:', editMode);
    console.log('MaterialsManager: courseId type:', typeof courseId, 'editMode type:', typeof editMode);

    if (!courseId) {
      // Local-only save (new course): update existing by temp id or add new
      console.log('MaterialsManager: Saving material locally (new course)');
      setMaterials(prevMaterials => {
        const hasId = materialData.id != null;
        if (hasId) {
          const updated = prevMaterials.map(m => (m.id === materialData.id ? { ...materialData } : m));
          console.log('MaterialsManager: Updated existing local material by id:', materialData.id, updated);
          return updated;
        }
        const newMaterial = { ...materialData, id: Date.now(), course_id: null } as Material;
        const updated = [...prevMaterials, newMaterial];
        console.log('MaterialsManager: Added new local material:', newMaterial);
        return updated;
      });
      setShowAddForm(false);
      setEditingMaterial(null);
      return;
    }

    // If we reach here, courseId exists, so save to backend
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();

      formData.append('title', materialData.title);
      formData.append('description', materialData.description);
      formData.append('course_id', courseId.toString());
      formData.append('type', materialData.type);
      formData.append('sort_order', materialData.sort_order.toString());
      formData.append('is_required', materialData.is_required.toString());
      formData.append('is_active', materialData.is_active.toString());

      if (materialData.external_url) {
        formData.append('external_url', materialData.external_url);
      }

      if (materialData.content) {
        formData.append('content', materialData.content);
      }

      // removed duration_minutes

      if (materialData.file) {
        formData.append('file', materialData.file);
      }

      const hasRealId = !!(materialData.id && Number(materialData.id) < 1000000000000);
      const url = hasRealId
        ? `${ADMIN_ENDPOINTS.COURSE_MATERIALS}/${materialData.id}`
        : ADMIN_ENDPOINTS.COURSE_MATERIALS;

      // Use POST with _method override for Laravel compatibility with multipart
      const method = 'POST';

      if (hasRealId) {
        formData.append('_method', 'PUT');
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      });

      if (response.ok) {
        let result: { material?: Material } | null = null;
        try {
          result = await response.json();
        } catch {
          result = null;
        }

        if (hasRealId) {
          const updated = result?.material ?? { ...materialData };
          setMaterials(prev => {
            const next = prev.map(m => (m.id === (updated.id ?? materialData.id) ? updated : m));
            const map: Record<string, Material> = {};
            next.forEach(it => {
              if (it) {
                map[String(it.id ?? `${it.title}-${it.sort_order}`)] = it;
              }
            });
            return Object.values(map) as Material[];
          });
        } else if (result?.material) {
          setMaterials(prev => {
            const next = [...prev, result!.material!];
            const map: Record<string, Material> = {};
            next.forEach(it => {
              if (it) {
                map[String(it.id ?? `${it.title}-${it.sort_order}`)] = it;
              }
            });
            return Object.values(map) as Material[];
          });
        }
        setShowAddForm(false);
        setEditingMaterial(null);
        // Ensure state is in sync with backend
        await fetchMaterials();
      } else {
        console.error('Failed to save material:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Ошибка сохранения материала:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (materialId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот материал?')) return;

    setLoading(true);
    try {
      // If course is not yet created or this looks like a temp id, just remove locally
      if (!courseId || Number(materialId) >= 1000000000000) {
        setMaterials(prev => prev.filter(m => m.id !== materialId));
        return;
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${ADMIN_ENDPOINTS.COURSE_MATERIALS}/${materialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.ok || response.status === 204) {
        setMaterials(prev => prev.filter(m => m.id !== materialId));
      } else {
        console.error('Failed to delete material:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete error details:', errorData);
      }
    } catch (error) {
      console.error('Ошибка удаления материала:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      video: 'Видео',
      pdf: 'PDF',
      doc: 'Документ',
      link: 'Ссылка',
      text: 'Текст',
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (showAddForm && editingMaterial) {
    return (
      <MaterialForm
        material={editingMaterial}
        onSave={saveMaterial}
        onCancel={() => {
          setShowAddForm(false);
          setEditingMaterial(null);
        }}
        loading={loading}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Материалы курса *</h3>
          <p className="text-sm text-gray-600">Необходимо добавить хотя бы один материал</p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={addMaterial}
          disabled={loading}
        >
          Добавить материал
        </Button>
      </div>

      {loading && materials.length === 0 ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка материалов...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Материалы не добавлены</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material, index) => (
            <div key={material.id || index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {getTypeLabel(material.type)}
                    </span>
                    {material.is_required && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        Обязательный
                      </span>
                    )}
                    {!material.is_active && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        Неактивный
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900">{material.title}</h4>
                  {material.description && (
                    <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                  )}
                  {/* removed duration display */}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => editMaterial(material)}
                    disabled={loading}
                  >
                    Редактировать
                  </Button>
                  {material.id && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => deleteMaterial(material.id!)}
                      disabled={loading}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Material Form Component
interface MaterialFormProps {
  material: Material;
  onSave: (material: Material) => void;
  onCancel: () => void;
  loading: boolean;
}

const MaterialForm: FC<MaterialFormProps> = ({ material, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState<Material>(material);

  useEffect(() => {
    setFormData(material);
  }, [material]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Validate required fields
    if (!formData.title.trim()) {
      return;
    }

    onSave(formData);
  };

  const handleChange = <K extends keyof Material>(field: K, value: Material[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h4 className="text-lg font-medium mb-4">
        {material.id ? 'Редактировать материал' : 'Добавить материал'}
      </h4>

      <div
        key={`material-form-${material.id || 'new'}`}
        className="space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип материала *
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value as Material['type'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="text">Текст</option>
            <option value="video">Видео</option>
            <option value="pdf">PDF</option>
            <option value="doc">Документ</option>
            <option value="link">Ссылка</option>
          </select>
        </div>

        {formData.type === 'link' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL ссылки
            </label>
            <input
              type="url"
              value={formData.external_url || ''}
              onChange={(e) => handleChange('external_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {formData.type === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Содержимое
            </label>
            <textarea
              value={formData.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
            />
          </div>
        )}

        {(formData.type === 'video' || formData.type === 'pdf' || formData.type === 'doc') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Файл
            </label>
            <input
              type="file"
              onChange={(e) => handleChange('file', e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              accept={formData.type === 'video' ? 'video/*' : formData.type === 'pdf' ? '.pdf' : '.doc,.docx'}
            />
          </div>
        )}

        {/* removed duration_minutes input */}

        <div className="flex gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_required"
              checked={formData.is_required}
              onChange={(e) => handleChange('is_required', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_required" className="ml-2 text-sm text-gray-700">
              Обязательный материал
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Активный
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="primary"
            disabled={loading || !formData.title}
            onClick={(e) => {
              e?.preventDefault();
              e?.stopPropagation();
              handleSubmit();
            }}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={(e) => {
              e?.preventDefault();
              e?.stopPropagation();
              onCancel();
            }}
            disabled={loading}
          >
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MaterialsManager;
