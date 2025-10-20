import { type FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import { ADMIN_ENDPOINTS } from 'constants/endpoints';
import DataTable from '@/components/shared/DataTable';
import HeaderActions from '@/components/shared/HeaderActions';
import { documentColumns, documentActions, formatFileSize, formatDate } from './config';
import Actions from '@/components/shared/Actions';
import { LINKS } from '@/constants/routes';

interface Document {
  id: number;
  title: string;
  description: string;
  category: {
    id: number;
    name: string;
  } | null;
  price: number;
  file_name: string;
  file_type: string;
  file_size: number;
  buy_number: number;
  is_active: boolean;
  created_at: string;
  creator: {
    id: number;
    username: string;
    email: string;
  };
}

const DocumentList: FC = () => {
  const navigate = useNavigate();
  const { token } = useAppSelector((state: any) => state.auth);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    
    // Event listeners for actions
    const handleEditDocument = (event: CustomEvent) => {
      handleEditDocumentAction(event.detail);
    };
    
    const handleToggleStatus = (event: CustomEvent) => {
      handleToggleStatusAction(event.detail.id, event.detail.currentStatus);
    };
    
    const handleDeleteDocument = (event: CustomEvent) => {
      handleDeleteDocumentAction(event.detail);
    };

    window.addEventListener('editDocument', handleEditDocument as EventListener);
    window.addEventListener('toggleDocumentStatus', handleToggleStatus as EventListener);
    window.addEventListener('deleteDocument', handleDeleteDocument as EventListener);

    return () => {
      window.removeEventListener('editDocument', handleEditDocument as EventListener);
      window.removeEventListener('toggleDocumentStatus', handleToggleStatus as EventListener);
      window.removeEventListener('deleteDocument', handleDeleteDocument as EventListener);
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      const response = await fetch(ADMIN_ENDPOINTS.GET_DOCUMENTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
        setError(null);
      } else if (response.status === 401) {
        // Handle unauthorized - token expired
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Не удалось загрузить документы');
      }
    } catch (error) {
      console.error('Ошибка загрузки документов:', error);
      setError('Произошла ошибка при загрузке документов');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocumentAction = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) {
      return;
    }

    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.DELETE_DOCUMENT}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Use functional update to avoid stale closure
        setDocuments(prevDocuments => prevDocuments.filter(doc => doc.id !== id));
        alert('Документ успешно удален');
      } else if (response.status === 401) {
        // Handle unauthorized - token expired
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

  const handleToggleStatusAction = async (id: number, currentStatus: boolean) => {
    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.TOGGLE_DOCUMENT_STATUS}/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Use functional update to avoid stale closure
        setDocuments(prevDocuments => 
          prevDocuments.map(doc => 
            doc.id === id ? { ...doc, is_active: !currentStatus } : doc
          )
        );
        alert(`Документ ${!currentStatus ? 'активирован' : 'деактивирован'} успешно`);
      } else if (response.status === 401) {
        // Handle unauthorized - token expired
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Не удалось изменить статус документа');
      }
    } catch (error) {
      console.error('Ошибка изменения статуса документа:', error);
      alert('Произошла ошибка при изменении статуса документа');
    }
  };

  const handleEditDocumentAction = (document: Document) => {
    // Navigate to upload page with document data for editing
    navigate(LINKS.documentsUploadLink, { 
      state: { 
        editMode: true, 
        documentData: document 
      } 
    });
  };

  const headerActions = (
    <HeaderActions
      onUpload={() => navigate(LINKS.documentsUploadLink)}
      onCategories={() => navigate(LINKS.documentsCategoryLink)}
      uploadLabel="Загрузить документ"
      categoriesLabel="Управление категориями"
    />
  );

  // Custom render functions for columns
  const renderDocumentColumn = (document: Document) => (
    <div>
      <div className="text-sm font-medium text-gray-900 mb-1">
        {document.title}
      </div>
      <div className="text-sm text-gray-500 mb-2">{document.description}</div>
      <div className="text-xs text-gray-400">
        📁 {document.file_name} • {formatFileSize(document.file_size)}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        💰 {document.buy_number} покупок • от {document.creator.username}
      </div>
    </div>
  );

  const renderCategoryColumn = (document: Document) => (
    <div className="text-sm text-gray-900">
      {document.category ? document.category.name : "Без категории"}
    </div>
  );

  const renderPriceColumn = (document: Document) => (
    <div className="text-sm font-medium text-gray-900">{document.price} ₸</div>
  );

  const renderStatusColumn = (document: Document) => (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        document.is_active
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {document.is_active ? "Активен" : "Неактивен"}
    </span>
  );

  const renderCreatedAtColumn = (document: Document) => (
    <div className="text-sm text-gray-500">
      {formatDate(document.created_at)}
    </div>
  );

  const renderActionsColumn = (document: Document) => (
    <Actions
      onEdit={() => {
        window.dispatchEvent(
          new CustomEvent("editDocument", { detail: document }),
        );
      }}
      onToggleStatus={() => {
        window.dispatchEvent(
          new CustomEvent("toggleDocumentStatus", {
            detail: { id: document.id, currentStatus: document.is_active },
          }),
        );
      }}
      onDelete={() => {
        window.dispatchEvent(
          new CustomEvent("deleteDocument", { detail: document.id }),
        );
      }}
      isActive={document.is_active}
      editLabel="Редактировать документ"
      deleteLabel="Удалить документ"
    />
  );

  // Enhanced columns with render functions
  const enhancedColumns = documentColumns.map(column => ({
    ...column,
    render: column.key === 'document' ? renderDocumentColumn :
            column.key === 'category' ? renderCategoryColumn :
            column.key === 'price' ? renderPriceColumn :
            column.key === 'status' ? renderStatusColumn :
            column.key === 'created_at' ? renderCreatedAtColumn :
            undefined
  }));

  // Enhanced actions with render function
  const enhancedActions = documentActions.map(action => ({
    ...action,
    render: action.key === 'actions' ? renderActionsColumn : undefined
  }));

  return (
    <DataTable
      title="Управление документами"
      description="Список всех загруженных документов"
      data={documents}
      columns={enhancedColumns}
      actions={enhancedActions}
      loading={loading}
      error={error}
      emptyMessage="Документы не найдены"
      emptyDescription="Загрузите первый документ для начала работы"
      totalCount={documents.length}
      headerActions={headerActions}
    />
  );
};

export default DocumentList;
