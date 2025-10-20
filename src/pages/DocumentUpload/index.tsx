import { type FC, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_ENDPOINTS } from 'constants/endpoints';
import { LINKS } from 'constants/routes';
import FormController from '@/components/shared/FormController';
import { 
  documentFormFields, 
  documentValidationSchema, 
  getDocumentInitialValues 
} from './config';
import { type FormField, type SelectOption } from '@/components/shared/FormController';

interface Category {
  id: number;
  name: string;
}

const DocumentUpload: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Edit mode state
  const editMode = location.state?.editMode || false;
  const documentData = location.state?.documentData || null;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(ADMIN_ENDPOINTS.DOCUMENT_CATEGORIES, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('price', values.price.toString());
      
      // Handle category - send the category name directly
      const categoryName = values.category.trim();
      if (!categoryName) {
        setUploadStatus({ type: 'error', message: 'Введите название категории' });
        setUploading(false);
        return;
      }
      
      formData.append('category', categoryName);
      
      if (values.file) {
        formData.append('file', values.file);
      }

      const url = editMode 
        ? `${ADMIN_ENDPOINTS.UPDATE_DOCUMENT}/${documentData.id}`
        : ADMIN_ENDPOINTS.UPLOAD_DOCUMENT;
      
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
        setUploadStatus({
          type: 'success',
          message: editMode ? 'Документ успешно обновлен' : 'Документ успешно загружен',
        });
        
        // Redirect to documents list after successful upload
        setTimeout(() => {
          navigate(LINKS.documentsLink);
        }, 2000);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setUploadStatus({
          type: 'error',
          message: errorData.message || 'Ошибка при загрузке документа',
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки документа:', error);
      setUploadStatus({
        type: 'error',
        message: 'Произошла ошибка при загрузке документа',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    navigate(LINKS.documentsLink);
  };

  // Update category options in form fields
  const categoryOptions: SelectOption[] = categories.map(cat => ({
    value: cat.name,
    label: cat.name,
  }));

  const formFields: FormField[] = documentFormFields.map(field => {
    if (field.name === 'category') {
      return {
        ...field,
        options: categoryOptions,
      };
    }
    return field;
  });

  const formConfig = {
    title: editMode ? 'Редактирование документа' : 'Загрузка документа',
    description: editMode 
      ? 'Измените данные документа' 
      : 'Загрузите новый документ в систему',
    fields: formFields,
    submitButtonText: editMode ? 'Обновить документ' : 'Загрузить документ',
    cancelButtonText: 'Отмена',
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    initialValues: getDocumentInitialValues(editMode, documentData),
    validationSchema: documentValidationSchema,
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

export default DocumentUpload;