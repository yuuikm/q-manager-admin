import { type FC, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import { LINKS } from 'constants/routes';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';
import FormController from '@/components/shared/FormController';
import {
  newsFormFields,
  newsValidationSchema,
  getNewsInitialValues
} from './config';
import { type FormField, type SelectOption } from '@/components/shared/FormController';

interface Category {
  id: number;
  name: string;
}

const NewsUpload: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [categories, setCategories] = useState<Category[]>([]);

  // Edit mode state
  const editMode = location.state?.editMode || false;
  const newsData = location.state?.newsData || null;

  const fetchCategories = useCallback(async () => {
    try {
      if (!token) {
        console.error('No auth token found');
        navigate(LINKS.loginLink);
        return;
      }

      const response = await fetch(ADMIN_ENDPOINTS.NEWS_CATEGORIES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
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
  }, [token, navigate]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
      if (values.description) {
        formData.append('description', values.description);
      }
      if (values.video_link) {
        formData.append('video_link', values.video_link);
      }
      if (values.content) {
        formData.append('content', values.content);
      }

      // Handle category - send the category name directly
      const categoryName = values.category.trim();
      if (!categoryName) {
        setUploadStatus({ type: 'error', message: 'Введите название категории' });
        setUploading(false);
        return;
      }

      formData.append('category', categoryName);
      formData.append('is_published', values.is_published ? '1' : '0');
      formData.append('is_featured', values.is_featured ? '1' : '0');

      if (values.image) {
        formData.append('image', values.image);
      }

      const url = editMode
        ? `${ADMIN_ENDPOINTS.NEWS}/${newsData.id}`
        : ADMIN_ENDPOINTS.NEWS;

      // Always POST; use _method for updates
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
          message: editMode ? 'Новость успешно обновлена' : 'Новость успешно создана',
        });

        // Redirect to news list after successful upload
        setTimeout(() => {
          navigate(LINKS.newsLink);
        }, 2000);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setUploadStatus({
          type: 'error',
          message: errorData.message || 'Ошибка при создании новости',
        });
      }
    } catch (error) {
      console.error('Ошибка создания новости:', error);
      setUploadStatus({
        type: 'error',
        message: 'Произошла ошибка при создании новости',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    navigate(LINKS.newsLink);
  };

  // Update category options in form fields
  const categoryOptions: SelectOption[] = categories.map(cat => ({
    value: cat.name,
    label: cat.name,
  }));

  const formFields: FormField[] = newsFormFields.map(field => {
    if (field.name === 'category') {
      return {
        ...field,
        options: categoryOptions,
      };
    }
    return field;
  });

  const formConfig = {
    title: editMode ? 'Редактирование новости' : 'Создание новости',
    description: editMode
      ? 'Измените данные новости'
      : 'Создайте новую новость',
    fields: formFields,
    submitButtonText: editMode ? 'Обновить новость' : 'Создать новость',
    cancelButtonText: 'Отмена',
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    initialValues: getNewsInitialValues(editMode, newsData),
    validationSchema: newsValidationSchema,
    loading: uploading,
  };

  return (
    <div className="p-6">
      {uploadStatus.type && (
        <div
          className={`mb-4 p-4 rounded-md ${uploadStatus.type === 'success'
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

export default NewsUpload;