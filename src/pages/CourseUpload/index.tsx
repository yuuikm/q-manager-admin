import { type FC, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import { LINKS } from 'constants/routes';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';
import FormController from '@/components/shared/FormController';
import MaterialsManager from '@/components/shared/MaterialsManager';
import { 
  courseFormFields, 
  courseValidationSchema, 
  getCourseInitialValues 
} from './config';
import { type FormField, type SelectOption } from '@/components/shared/FormController';

interface Category {
  id: number;
  name: string;
}

const CourseUpload: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAppSelector((state: any) => state.auth);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const typeOptions = [
    { value: 'online', label: 'Онлайн' },
    { value: 'offline', label: 'Оффлайн' },
    { value: 'self_learning', label: 'Дистанционное обучение' },
  ];
  
  // Handle materials change from MaterialsManager
  const handleMaterialsChange = (newMaterials: any[]) => {
    console.log('CourseUpload: handleMaterialsChange called with:', newMaterials);
    setMaterials(newMaterials);
  };
  
  // Edit mode state
  const editMode = location.state?.editMode || false;
  const courseData = location.state?.courseData || null;

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debug materials state changes
  useEffect(() => {
    console.log('CourseUpload: materials state changed to:', materials);
  }, [materials]);


  const fetchCategories = async () => {
    try {
      if (!token) {
        console.error('No auth token found');
        navigate(LINKS.loginLink);
        return;
      }

      const response = await fetch(ADMIN_ENDPOINTS.COURSE_CATEGORIES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    setUploading(true);
    setUploadStatus({ type: null, message: '' });
    
    try {
      if (!token) {
        console.error('No auth token found');
        navigate(LINKS.loginLink);
        return;
      }

      console.log('Submitting course with token:', token.substring(0, 20) + '...');
      console.log('Form values:', values);
      const formData = new FormData();
      
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('content', values.content);
      formData.append('price', values.price.toString());
      const typeValue = Array.isArray(values.type) ? values.type : [values.type].filter(Boolean);
      formData.append('type', JSON.stringify(typeValue));
      const categoryName = (values.category || '').trim();
      if (!categoryName) {
        setUploadStatus({ type: 'error', message: 'Пожалуйста, введите название категории' });
        setUploading(false);
        return;
      }
      formData.append('category', categoryName);
      // Only append optional fields if they have values
      if (values.requirements && values.requirements.trim()) {
        formData.append('requirements', values.requirements);
      }
      if (values.learning_outcomes && values.learning_outcomes.trim()) {
        formData.append('learning_outcomes', values.learning_outcomes);
      }
      if (values.zoom_link && values.zoom_link.trim()) {
        formData.append('zoom_link', values.zoom_link);
      }
      // Laravel boolean validator accepts 1/0 or true/false; with FormData prefer 1/0
      formData.append('is_published', values.is_published ? '1' : '0');
      formData.append('is_featured', values.is_featured ? '1' : '0');
      
      if (values.featured_image) {
        formData.append('featured_image', values.featured_image);
      }

      // Debug FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const url = editMode 
        ? `${ADMIN_ENDPOINTS.COURSES}/${courseData.id}`
        : ADMIN_ENDPOINTS.COURSES;
      
      // Use POST for both create and update, with _method field for updates
      const method = 'POST';
      
      if (editMode) {
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
        const result = await response.json();
        console.log('Course creation response:', result);
        
        // Save materials if this is a new course
        console.log('Edit mode:', editMode, 'Materials length:', materials.length);
        if (!editMode && materials.length > 0) {
          // Try different possible response structures
          const courseId = result.course?.id || result.id || result.data?.id;
          console.log('Using course ID:', courseId);
          console.log('About to save materials:', materials);
          
          if (courseId) {
            await saveMaterials(courseId);
          } else {
            console.error('Could not find course ID in response:', result);
          }
        } else {
          console.log('Skipping materials save - editMode:', editMode, 'materials.length:', materials.length);
        }

        setUploadStatus({ 
          type: 'success', 
          message: editMode ? 'Курс успешно обновлен' : 'Курс успешно создан',
        });
        
        // Redirect to courses list after successful upload
        setTimeout(() => {
          navigate(LINKS.coursesLink);
        }, 2000);
      } else if (response.status === 401) {
        console.error('Unauthorized - token invalid or expired');
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        console.error('Course creation failed:', response.status, response.statusText);
        let errorMessage = 'Ошибка при создании курса';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        }
        
        setUploadStatus({ 
          type: 'error', 
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('Ошибка создания курса:', error);
      setUploadStatus({ 
        type: 'error', 
        message: 'Произошла ошибка при создании курса',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    navigate(LINKS.coursesLink);
  };


  const saveMaterials = async (courseId: number) => {
    console.log('Saving materials for course ID:', courseId);
    console.log('Materials to save:', materials);
    
    if (materials.length === 0) {
      console.log('No materials to save');
      return;
    }

    if (!token) {
      console.error('No auth token found for materials');
      return;
    }
    
    for (const material of materials) {
      console.log('Processing material:', material);
      
      // Skip materials that already have a real ID (from edit mode)
      // Real IDs are small numbers, temporary IDs are large timestamps
      if (material.id && material.id < 1000000000000) {
        console.log('Skipping material with real ID:', material.id);
        continue; // Skip materials that already exist in database
      }
      
      try {
        const formData = new FormData();
        formData.append('title', material.title);
        formData.append('description', material.description);
        formData.append('course_id', courseId.toString());
        formData.append('type', material.type);
        formData.append('sort_order', material.sort_order.toString());
        formData.append('is_required', material.is_required.toString());
        formData.append('is_active', material.is_active.toString());
        
        if (material.external_url) {
          formData.append('external_url', material.external_url);
        }
        
        if (material.content) {
          formData.append('content', material.content);
        }
        
        if (material.duration_minutes) {
          formData.append('duration_minutes', material.duration_minutes.toString());
        }
        
        if (material.file) {
          formData.append('file', material.file);
        }

        // Debug FormData contents
        console.log('Material FormData contents:');
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }

        const response = await fetch(ADMIN_ENDPOINTS.COURSE_MATERIALS, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: formData,
        });

        if (!response.ok) {
          console.error('Failed to save material:', material.title);
          const errorData = await response.json().catch(() => ({}));
          console.error('Material save error:', errorData);
        } else {
          console.log('Material saved successfully:', material.title);
        }
      } catch (error) {
        console.error('Error saving material:', material.title, error);
      }
    }
  };

  // Update category options in form fields
  const categoryOptions: SelectOption[] = categories.map(cat => ({
    value: cat.name,
    label: cat.name,
  }));

  const formFields: FormField[] = courseFormFields.map(field => {
    if (field.name === 'type') {
      return {
        ...field,
        customRender: (_field: FormField, formik: any) => {
          const selectedTypes: string[] = Array.isArray(formik.values.type)
            ? formik.values.type
            : [];

          const handleToggleType = (value: string) => {
            let updatedTypes: string[] = [];

            if (selectedTypes.includes(value)) {
              updatedTypes = selectedTypes.filter((type) => type !== value);
            } else {
              if (selectedTypes.length >= 3) {
                formik.setFieldTouched('type', true, true);
                return;
              }
              updatedTypes = [...selectedTypes, value];
            }

            formik.setFieldValue('type', updatedTypes);
            formik.setFieldTouched('type', true, true);
          };

          const isMaxSelected = selectedTypes.length >= 3;

          return (
            <div className="space-y-2">
              {typeOptions.map((option) => {
                const isChecked = selectedTypes.includes(option.value);
                const isDisabled = !isChecked && isMaxSelected;

                return (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-2 rounded-md border border-gray-200 px-3 py-2 transition ${
                      isDisabled
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer hover:border-blue-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleType(option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isDisabled}
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                );
              })}
              <p className="text-xs text-gray-500">
                Можно выбрать до трёх типов.
              </p>
            </div>
          );
        },
      };
    }

     if (field.name === 'category') {
      return {
        ...field,
        options: categoryOptions,
      };
    }
    if (field.name === 'materials') {
      return {
        ...field,
        customRender: (_field: FormField, formik: any) => {
          return <MaterialsManager 
            form={formik} 
            courseId={formik.values.editMode ? formik.values.id : null} 
            editMode={formik.values.editMode}
            onMaterialsChange={formik.values.onMaterialsChange}
          />;
        },
      };
    }
    return field;
  });

  const formConfig = {
    title: editMode ? 'Редактирование курса' : 'Создание курса',
    description: editMode 
      ? 'Измените данные курса' 
      : 'Создайте новый курс',
    fields: formFields,
    submitButtonText: editMode ? 'Обновить курс' : 'Создать курс',
    cancelButtonText: 'Отмена',
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    initialValues: getCourseInitialValues(editMode, courseData, handleMaterialsChange),
    validationSchema: courseValidationSchema,
    loading: uploading,
  };


  return (
    <div className="p-6">
      {uploadStatus.type && (
        <div
          className={`mb-4 p-4 rounded-md ${
          uploadStatus.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {uploadStatus.message}
        </div>
      )}
      
      <FormController {...formConfig} />
    </div>
  );
};

export default CourseUpload;
