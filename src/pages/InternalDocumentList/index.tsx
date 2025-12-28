import { type FC, useState, useEffect, useCallback, useMemo } from 'react';
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

import { adminAPI } from '@/api/admin';

const InternalDocumentList: FC = () => {
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);
  const [documents, setDocuments] = useState<InternalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  } | undefined>(undefined);
  const [authors, setAuthors] = useState<{ id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    start_date: "",
    end_date: "",
    author_id: "",
    page: 1
  });

  const fetchAuthors = useCallback(async () => {
    try {
      const data = await adminAPI.getAdmins();
      setAuthors(data);
    } catch (err) {
      console.error('Error fetching authors:', err);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      setLoading(true);
      const url = new URL(ADMIN_ENDPOINTS.INTERNAL_DOCUMENTS);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || data || []);
        if (data.current_page) {
          setPagination({
            current_page: data.current_page,
            last_page: data.last_page,
            total: data.total,
            per_page: data.per_page
          });
        } else {
          setPagination(undefined);
        }
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
  }, [filters, token, navigate]);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // fetch* moved up

  const handleSearch = useCallback((value: string) => {
    setFilters((prev) => {
      if (prev.search === value) return prev;
      return { ...prev, search: value, page: 1 };
    });
  }, []);

  const handleFilterChange = useCallback((newFilters: Record<string, string | number | boolean | null | undefined>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => {
      if (prev.page === page) return prev;
      return { ...prev, page };
    });
  }, []);

  const handleDeleteDocumentAction = useCallback(async (id: number) => {
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
  }, [token, navigate]);

  const handleEditDocumentAction = useCallback((document: InternalDocument) => {
    navigate(LINKS.internalDocumentsUploadLink, {
      state: {
        editMode: true,
        documentData: document
      }
    });
  }, [navigate]);

  const handleViewDocumentAction = useCallback((id: number) => {
    navigate(LINKS.internalDocumentsViewLink.replace(':id', id.toString()));
  }, [navigate]);

  useEffect(() => {
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
  }, [handleEditDocumentAction, handleViewDocumentAction, handleDeleteDocumentAction]);

  const headerActions = (
    <HeaderActions
      onUpload={() => navigate(LINKS.internalDocumentsUploadLink)}
      uploadLabel="Загрузить документ"
    />
  );

  const renderDocumentColumn = useCallback((document: InternalDocument) => (
    <div>
      <div className="text-sm font-medium text-gray-900 mb-1">
        {document.title}
      </div>
    </div>
  ), []);

  const renderFileInfoColumn = useCallback((document: InternalDocument) => (
    <div className="text-sm text-gray-900">
      <div className="mb-1">📁 {document.file_name}</div>
      <div className="text-xs text-gray-500">{formatFileSize(document.file_size)}</div>
      <div className="text-xs text-gray-500">{document.file_type}</div>
    </div>
  ), []);

  const renderAuthorColumn = useCallback((document: InternalDocument) => (
    <div className="text-sm text-gray-900">
      {document.author?.username || 'Неизвестно'}
    </div>
  ), []);

  const renderCreatedAtColumn = useCallback((document: InternalDocument) => (
    <div className="text-sm text-gray-500">
      {formatDate(document.created_at)}
    </div>
  ), []);

  const renderActionsColumn = useCallback((document: InternalDocument) => (
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
  ), []);

  const enhancedColumns = useMemo(() => internalDocumentColumns.map(column => ({
    ...column,
    render: column.key === 'document' ? renderDocumentColumn :
      column.key === 'file_info' ? renderFileInfoColumn :
        column.key === 'author' ? renderAuthorColumn :
          column.key === 'created_at' ? renderCreatedAtColumn :
            undefined
  })), [renderDocumentColumn, renderFileInfoColumn, renderAuthorColumn, renderCreatedAtColumn]);

  const enhancedActions = useMemo(() => internalDocumentActions.map(action => ({
    ...action,
    render: action.key === 'actions' ? renderActionsColumn : undefined
  })), [renderActionsColumn]);

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
      headerActions={headerActions}
      pagination={pagination}
      authors={authors}
      onSearch={handleSearch}
      onFilterChange={handleFilterChange}
      onPageChange={handlePageChange}
      initialSearchValue={filters.search}
    />
  );
};

export default InternalDocumentList;

