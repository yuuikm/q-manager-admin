import { type FC, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import DataTable from '@/components/shared/DataTable';
import HeaderActions from '@/components/shared/HeaderActions';
import { newsColumns, newsActions, formatDate } from './config';
import Actions from '@/components/shared/Actions';
import { LINKS } from '@/constants/routes';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';

interface News {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: {
    id: number;
    name: string;
  } | null;
  image_path?: string;
  featured_image?: string;
  is_published: boolean;
  is_featured: boolean;
  published_at?: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_by: number;
  author: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

import { adminAPI } from '@/api/admin';

const NewsList: FC = () => {
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null); // This can be properly typed as PaginationData
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

  const fetchNews = useCallback(async () => {
    try {
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      setLoading(true);
      const url = new URL(ADMIN_ENDPOINTS.NEWS);
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

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setNews(data.data || []);
        if (data.current_page) {
          setPagination({
            current_page: data.current_page,
            last_page: data.last_page,
            total: data.total,
            per_page: data.per_page
          });
        } else {
          setPagination(null);
        }
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Не удалось загрузить новости');
      }
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error);
      setError('Произошла ошибка при загрузке новостей');
    } finally {
      setLoading(false);
    }
  }, [filters, token, navigate]);



  // fetchNews and fetchAuthors moved up

  const handleSearch = useCallback((value: string) => {
    setFilters((prev) => {
      if (prev.search === value) return prev;
      return { ...prev, search: value, page: 1 };
    });
  }, []);

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => {
      if (prev.page === page) return prev;
      return { ...prev, page };
    });
  }, []);

  const handleDeleteNewsAction = useCallback(async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) return;

    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.NEWS}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNews(prevNews => prevNews.filter(item => item.id !== id));
        alert('Новость успешно удалена');
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Ошибка удаления новости');
      }
    } catch (error) {
      console.error('Ошибка удаления новости:', error);
      alert('Произошла ошибка при удалении новости');
    }
  }, [token, navigate]);

  const handleTogglePublishStatusAction = useCallback(async (id: number, currentStatus: boolean) => {
    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.TOGGLE_NEWS_STATUS}/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNews(prevNews =>
          prevNews.map(item =>
            item.id === id ? { ...item, is_published: !currentStatus } : item
          )
        );
        alert(`Новость ${!currentStatus ? 'опубликована' : 'снята с публикации'} успешно`);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Ошибка обновления статуса новости');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса новости:', error);
      alert('Произошла ошибка при обновлении статуса новости');
    }
  }, [token, navigate]);

  const handleEditNewsAction = useCallback((newsItem: News) => {
    navigate(LINKS.newsUploadLink, {
      state: {
        editMode: true,
        newsData: newsItem
      }
    });
  }, [navigate]);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  useEffect(() => {
    fetchNews();
  }, [filters, token, fetchNews]);

  useEffect(() => {
    // Event listeners for actions
    const handleEditNews = (event: CustomEvent) => {
      handleEditNewsAction(event.detail);
    };

    const handleTogglePublishStatus = (event: CustomEvent) => {
      handleTogglePublishStatusAction(event.detail.id, event.detail.currentStatus);
    };

    const handleDeleteNews = (event: CustomEvent) => {
      handleDeleteNewsAction(event.detail);
    };

    window.addEventListener('editNews', handleEditNews as EventListener);
    window.addEventListener('toggleNewsPublishStatus', handleTogglePublishStatus as EventListener);
    window.addEventListener('deleteNews', handleDeleteNews as EventListener);

    return () => {
      window.removeEventListener('editNews', handleEditNews as EventListener);
      window.removeEventListener('toggleNewsPublishStatus', handleTogglePublishStatus as EventListener);
      window.removeEventListener('deleteNews', handleDeleteNews as EventListener);
    };
  }, [handleEditNewsAction, handleTogglePublishStatusAction, handleDeleteNewsAction]);

  const headerActions = (
    <HeaderActions
      onUpload={() => navigate(LINKS.newsUploadLink)}
      onCategories={() => navigate(LINKS.newsCategoryLink)}
      uploadLabel="Создать новость"
      categoriesLabel="Управление категориями"
    />
  );

  // Custom render functions for columns
  const renderNewsColumn = useCallback((newsItem: News) => (
    <div className="flex items-center">
      <div>
        <div className="text-sm font-medium text-gray-900">
          {newsItem.title}
        </div>
        <div className="text-sm text-gray-500 truncate max-w-xs">
          {newsItem.description}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          от {newsItem.author.first_name} {newsItem.author.last_name}
        </div>
      </div>
    </div>
  ), []);

  const renderCategoryColumn = useCallback((newsItem: News) => (
    <div className="text-sm text-gray-900">
      {newsItem.category ? newsItem.category.name : "Без категории"}
    </div>
  ), []);

  const renderStatisticsColumn = useCallback((newsItem: News) => (
    <div className="space-y-1">
      <div className="text-sm text-gray-900">
        👁️ {newsItem.views_count} просмотров
      </div>
      <div className="text-sm text-gray-500">
        ❤️ {newsItem.likes_count} • 💬 {newsItem.comments_count}
      </div>
    </div>
  ), []);

  const renderStatusColumn = useCallback((newsItem: News) => (
    <div className="space-y-1">
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${newsItem.is_published
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800"
          }`}
      >
        {newsItem.is_published ? "Опубликована" : "Черновик"}
      </span>
      {newsItem.is_featured && (
        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Рекомендуемая
        </span>
      )}
    </div>
  ), []);

  const renderCreatedAtColumn = useCallback((newsItem: News) => (
    <div className="text-sm text-gray-500">
      {formatDate(newsItem.created_at)}
    </div>
  ), []);

  const renderActionsColumn = useCallback((newsItem: News) => (
    <Actions
      onEdit={() => {
        window.dispatchEvent(new CustomEvent("editNews", { detail: newsItem }));
      }}
      onToggleStatus={() => {
        window.dispatchEvent(
          new CustomEvent("toggleNewsPublishStatus", {
            detail: { id: newsItem.id, currentStatus: newsItem.is_published },
          }),
        );
      }}
      onDelete={() => {
        window.dispatchEvent(
          new CustomEvent("deleteNews", { detail: newsItem.id }),
        );
      }}
      isPublished={newsItem.is_published}
      editLabel="Редактировать новость"
      deleteLabel="Удалить новость"
    />
  ), []);

  // Enhanced columns with render functions
  const enhancedColumns = useMemo(() => newsColumns.map(column => ({
    ...column,
    render: column.key === 'news' ? renderNewsColumn :
      column.key === 'category' ? renderCategoryColumn :
        column.key === 'statistics' ? renderStatisticsColumn :
          column.key === 'status' ? renderStatusColumn :
            column.key === 'created_at' ? renderCreatedAtColumn :
              undefined
  })), [renderNewsColumn, renderCategoryColumn, renderStatisticsColumn, renderStatusColumn, renderCreatedAtColumn]);

  // Enhanced actions with render function
  const enhancedActions = useMemo(() => newsActions.map(action => ({
    ...action,
    render: action.key === 'actions' ? renderActionsColumn : undefined
  })), [renderActionsColumn]);

  return (
    <DataTable
      title="Управление новостями"
      description="Список всех созданных новостей"
      data={news}
      columns={enhancedColumns}
      actions={enhancedActions}
      loading={loading}
      error={error}
      emptyMessage="Новости не найдены"
      emptyDescription="Создайте первую новость для начала работы"
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

export default NewsList;
