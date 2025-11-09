import { type FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import { ADMIN_ENDPOINTS } from 'constants/endpoints';
import DataTable from '@/components/shared/DataTable';
import Actions from '@/components/shared/Actions';
import HeaderActions from '@/components/shared/HeaderActions';
import { LINKS } from '@/constants/routes';
import {
  internalDocumentColumns,
  internalDocumentActions,
  formatFileSize,
  formatDate,
  type InternalDocument,
} from './config';

const InternalDocumentList: FC = () => {
  const navigate = useNavigate();
  const { token } = useAppSelector((state: any) => state.auth);
  const [documents, setDocuments] = useState<InternalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    
    // Event listeners for actions
    const handleEditDocument = (event: CustomEvent) => {
      handleEditDocumentAction(event.detail);
    };
    
    const handleViewDocument = (event: CustomEvent) => {
      handleViewDocumentAction(event.detail.id);
    };
    
    const handleDeleteDocument = (event: CustomEvent) => {
      handleDeleteDocumentAction(event.detail);
    };

    window.addEventListener('editInternalDocument', handleEditDocument as EventListener);
    window.addEventListener('viewInternalDocument', handleViewDocument as EventListener);
    window.addEventListener('deleteInternalDocument', handleDeleteDocument as EventListener);

    return () => {
      window.removeEventListener('editInternalDocument', handleEditDocument as EventListener);
      window.removeEventListener('viewInternalDocument', handleViewDocument as EventListener);
      window.removeEventListener('deleteInternalDocument', handleDeleteDocument as EventListener);
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      const response = await fetch(ADMIN_ENDPOINTS.INTERNAL_DOCUMENTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both paginated and non-paginated responses
        setDocuments(data.data || data || []);
        setError(null);
      } else if (response.status === 401) {
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

      const response = await fetch(`${ADMIN_ENDPOINTS.INTERNAL_DOCUMENTS}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDocuments(prevDocuments => prevDocuments.filter(doc => doc.id !== id));
        alert('Документ успешно удален');
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

  const handleEditDocumentAction = (document: InternalDocument) => {
    navigate(LINKS.internalDocumentsUploadLink, { 
      state: { 
        editMode: true, 
        documentData: document 
      } 
    });
  };

  const handleViewDocumentAction = (id: number) => {
    navigate(LINKS.internalDocumentsViewLink.replace(':id', id.toString()));
  };

  const headerActions = (
    <HeaderActions
      onUpload={() => navigate(LINKS.internalDocumentsUploadLink)}
      uploadLabel="Загрузить документ"
    />
  );

  const renderDocumentColumn = (document: InternalDocument) => (
    <div>
      <div className="text-sm font-medium text-gray-900 mb-1">
        {document.title}
      </div>
    </div>
  );

  const renderFileInfoColumn = (document: InternalDocument) => (
    <div className="text-sm text-gray-900">
      <div className="mb-1">📁 {document.file_name}</div>
      <div className="text-xs text-gray-500">{formatFileSize(document.file_size)}</div>
      <div className="text-xs text-gray-500">{document.file_type}</div>
    </div>
  );

  const renderAuthorColumn = (document: InternalDocument) => (
    <div className="text-sm text-gray-900">
      {document.author?.username || 'Неизвестно'}
    </div>
  );

  const renderCreatedAtColumn = (document: InternalDocument) => (
      <div className="text-sm text-gray-500">
        {formatDate(document.created_at)}
    </div>
  );

  const renderActionsColumn = (document: InternalDocument) => (
    <Actions
      onEdit={() => {
        window.dispatchEvent(
          new CustomEvent("editInternalDocument", { detail: document }),
        );
      }}
      onView={() => {
        window.dispatchEvent(
          new CustomEvent("viewInternalDocument", { detail: { id: document.id } }),
        );
      }}
      onDelete={() => {
        window.dispatchEvent(
          new CustomEvent("deleteInternalDocument", { detail: document.id }),
        );
      }}
      editLabel="Редактировать документ"
      viewLabel="Просмотреть документ"
      deleteLabel="Удалить документ"
      showToggle={false}
      showView={true}
    />
  );

  const enhancedColumns = internalDocumentColumns.map(column => ({
    ...column,
    render: column.key === 'document' ? renderDocumentColumn :
            column.key === 'file_info' ? renderFileInfoColumn :
            column.key === 'author' ? renderAuthorColumn :
            column.key === 'created_at' ? renderCreatedAtColumn :
            undefined
  }));

  const enhancedActions = internalDocumentActions.map(action => ({
    ...action,
    render: action.key === 'actions' ? renderActionsColumn : undefined
  }));

  return (
    <DataTable
      title="Внутренние документы"
      description="Список всех внутренних документов"
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

export default InternalDocumentList;

