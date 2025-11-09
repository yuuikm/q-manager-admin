import { type FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';
import { LINKS } from '@/constants/routes';
import Button from '@/components/shared/Button';

interface InternalDocument {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  author: {
    id: number;
    username: string;
    email: string;
  };
}

const InternalDocumentView: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAppSelector((state: any) => state.auth);
  const [document, setDocument] = useState<InternalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.INTERNAL_DOCUMENTS}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocument(data);
        setError(null);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        setError('Документ не найден');
      }
    } catch (error) {
      console.error('Ошибка загрузки документа:', error);
      setError('Произошла ошибка при загрузке документа');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document || !token) return;

    setDownloading(true);
    try {
      const response = await fetch(`${ADMIN_ENDPOINTS.INTERNAL_DOCUMENTS}/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const linkElement = window.document.createElement('a');
        linkElement.href = url;
        linkElement.download = document.file_name;
        window.document.body.appendChild(linkElement);
        linkElement.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(linkElement);
      } else {
        alert('Ошибка при загрузке файла');
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      alert('Произошла ошибка при загрузке файла');
    } finally {
      setDownloading(false);
    }
  };

  const handleEdit = () => {
    if (document) {
      navigate(LINKS.internalDocumentsUploadLink, {
        state: {
          editMode: true,
          documentData: document,
        },
      });
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    if (!confirm('Вы уверены, что хотите удалить этот документ?')) {
      return;
    }

    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.INTERNAL_DOCUMENTS}/${document.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Документ успешно удален');
        navigate(LINKS.internalDocumentsLink);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Не удалось удалить документ');
      }
    } catch (error) {
      console.error('Ошибка удаления документа:', error);
      alert('Произошла ошибка при удалении документа');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                {error || 'Документ не найден'}
              </h1>
              <button
                onClick={() => navigate(LINKS.internalDocumentsLink)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Вернуться к списку документов
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const doc = document; // Alias to avoid conflict with global document object

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate(LINKS.internalDocumentsLink)}
            className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            ← Назад к списку документов
          </button>

          <article className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {doc.title}
                </h1>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Файл</p>
                  <p className="text-lg text-gray-900">📁 {doc.file_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Размер</p>
                  <p className="text-lg text-gray-900">{formatFileSize(doc.file_size)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Тип файла</p>
                  <p className="text-lg text-gray-900">{doc.file_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Дата загрузки</p>
                  <p className="text-lg text-gray-900">{formatDate(doc.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Автор</p>
                  <p className="text-lg text-gray-900">{doc.author?.username || 'Неизвестно'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-8 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? 'Загрузка...' : 'Скачать документ'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleEdit}
                  >
                    Редактировать
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                >
                  Удалить
                </Button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default InternalDocumentView;

