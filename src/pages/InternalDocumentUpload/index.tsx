import { type FC, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import { LINKS } from 'constants/routes';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';
import FormController from '@/components/shared/FormController';
import { 
  internalDocumentFormFields, 
  internalDocumentValidationSchema, 
  getInternalDocumentInitialValues 
} from './config';

const InternalDocumentUpload: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAppSelector((state: any) => state.auth);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  // Edit mode state
  const editMode = location.state?.editMode || false;
  const documentData = location.state?.documentData || null;

  const handleSubmit = async (values: any) => {
    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      if (!token) {
        console.error('No auth token found');
        navigate(LINKS.loginLink);
        return;
      }

      const formData = new FormData();
      
      formData.append('title', values.title);
      
      // File is required for new documents, optional for edits
      if (values.file) {
        formData.append('file', values.file);
      } else if (!editMode) {
        setUploadStatus({ type: 'error', message: 'Файл обязателен' });
        setUploading(false);
        return;
      }

      const url = editMode 
        ? `${ADMIN_ENDPOINTS.INTERNAL_DOCUMENTS}/${documentData.id}`
        : ADMIN_ENDPOINTS.INTERNAL_DOCUMENTS;
      
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
          navigate(LINKS.internalDocumentsLink);
        }, 2000);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setUploadStatus({
          type: 'error',
          message: errorData.message || errorData.error || 'Ошибка при загрузке документа',
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
    navigate(LINKS.internalDocumentsLink);
  };

  const formConfig = {
    title: editMode ? 'Редактирование документа' : 'Загрузка внутреннего документа',
    description: editMode 
      ? 'Измените данные документа' 
      : 'Загрузите новый внутренний документ в систему',
    fields: internalDocumentFormFields,
    submitButtonText: editMode ? 'Обновить документ' : 'Загрузить документ',
    cancelButtonText: 'Отмена',
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    initialValues: getInternalDocumentInitialValues(editMode, documentData),
    validationSchema: internalDocumentValidationSchema,
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

export default InternalDocumentUpload;

