import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import { ADMIN_ENDPOINTS } from 'constants/endpoints';
import DataTable from '@/components/shared/DataTable';
import HeaderActions from '@/components/shared/HeaderActions';
import { documentColumns, documentActions, formatFileSize, formatDate } from './config';
import Actions from '@/components/shared/Actions';
import { LINKS } from '@/constants/routes';
import { adminAPI, Document as ApiDocument } from '@/api/admin';

// Extend ApiDocument to include properties used in this view if they are missing
interface ViewDocument extends ApiDocument {
  buy_number?: number;
  category_name?: string;
  subcategory?: { id: number; name: string } | string | null;
  document_type?: string | null;
}

const DocumentList = () => {
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);
  const [documents, setDocuments] = useState<ViewDocument[]>([]);
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
      const response = await adminAPI.getDocuments(filters);
      // Explicitly cast to ViewDocument[] because we know the response has these extra properties
      setDocuments((response.data || []) as ViewDocument[]);
      if (response.current_page) {
        setPagination({
          current_page: response.current_page,
          last_page: response.last_page,
          total: response.total,
          per_page: response.per_page
        });
      } else {
        setPagination(undefined);
      }
      setError(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Произошла ошибка при загрузке документов';
      console.error('Ошибка загрузки документов:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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

  const handleToggleStatusAction = useCallback(async (id: number, currentStatus: boolean) => {
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
        setDocuments(prevDocuments =>
          prevDocuments.map(doc =>
            doc.id === id ? { ...doc, is_active: !currentStatus } : doc
          )
        );
        alert(`Документ ${!currentStatus ? 'активирован' : 'деактивирован'} успешно`);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Не удалось изменить статус документа');
      }
    } catch (err) {
      console.error('Ошибка изменения статуса документа:', err);
      alert('Произошла ошибка при изменении статуса документа');
    }
  }, [token, navigate]);

  const handleDeleteDocumentAction = useCallback(async (id: number) => {
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
        setDocuments(prevDocuments => prevDocuments.filter(doc => doc.id !== id));
        alert('Документ успешно удален');
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Не удалось удалить документ');
      }
    } catch (err) {
      console.error('Ошибка удаления документа:', err);
      alert('Произошла ошибка при удалении документа');
    }
  }, [token, navigate]);

  const handleEditDocumentAction = useCallback((document: ViewDocument) => {
    navigate(LINKS.documentsUploadLink, {
      state: {
        editMode: true,
        documentData: document
      }
    });
  }, [navigate]);

  useEffect(() => {
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
  }, [handleEditDocumentAction, handleToggleStatusAction, handleDeleteDocumentAction]);

  const headerActions = (
    <HeaderActions
      onUpload={() => navigate(LINKS.documentsUploadLink)}
      onCategories={() => navigate(LINKS.documentsCategoryLink)}
      uploadLabel="Загрузить документ"
      categoriesLabel="Управление категориями"
    />
  );

  const renderDocumentColumn = useCallback((document: ViewDocument) => (
    <div>
      <div className="text-sm font-medium text-gray-900 mb-1">
        {document.title}
      </div>
      <div className="text-sm text-gray-500 mb-2">{document.description}</div>
      <div className="text-xs text-gray-400">
        📁 {document.file_name} • {formatFileSize(document.file_size)}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        💰 {document.buy_number || 0} покупок • от {document.creator?.username || 'Системы'}
      </div>
    </div>
  ), []);

  const renderCategoryColumn = useCallback((document: ViewDocument) => (
    <div>
      <div className="text-sm font-medium text-gray-900">
        {typeof document.category === 'object' && document.category !== null
          ? (document.category as { name: string }).name
          : (document.category || "Без категории")}
      </div>
      {document.subcategory && (
        <div className="text-xs text-gray-500 mt-1">
          📂 {typeof document.subcategory === 'object' && document.subcategory !== null
            ? (document.subcategory as { name: string }).name
            : document.subcategory}
        </div>
      )}
      {document.document_type && (
        <div className="text-xs text-blue-600 mt-1">
          📄 {document.document_type}
        </div>
      )}
    </div>
  ), []);

  const renderPriceColumn = useCallback((document: ViewDocument) => (
    <div className="text-sm font-medium text-gray-900">{document.price}₸</div>
  ), []);

  const renderStatusColumn = useCallback((document: ViewDocument) => (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${document.is_active
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"
        }`}
    >
      {document.is_active ? "Активен" : "Неактивен"}
    </span>
  ), []);

  const renderCreatedAtColumn = useCallback((document: ViewDocument) => (
    <div className="text-sm text-gray-500">
      {formatDate(document.created_at)}
    </div>
  ), []);

  const renderActionsColumn = useCallback((document: ViewDocument) => (
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
  ), []);

  const enhancedColumns = useMemo(() => documentColumns.map(column => ({
    ...column,
    render: column.key === 'document' ? renderDocumentColumn :
      column.key === 'category' ? renderCategoryColumn :
        column.key === 'price' ? renderPriceColumn :
          column.key === 'status' ? renderStatusColumn :
            column.key === 'created_at' ? renderCreatedAtColumn :
              undefined
  })), [renderDocumentColumn, renderCategoryColumn, renderPriceColumn, renderStatusColumn, renderCreatedAtColumn]);

  const enhancedActions = useMemo(() => documentActions.map(action => ({
    ...action,
    render: action.key === 'actions' ? renderActionsColumn : undefined
  })), [renderActionsColumn]);

  return (
    <DataTable<ViewDocument>
      title="Управление документами"
      description="Список всех загруженных документов"
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

export default DocumentList;
