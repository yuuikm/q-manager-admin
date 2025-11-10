import { type FC, useState, useEffect } from 'react';
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

const NewsList: FC = () => {
  const navigate = useNavigate();
  const { token } = useAppSelector((state: any) => state.auth);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
    
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
  }, []);

  const fetchNews = async () => {
    try {
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      const [publishedResponse, draftsResponse] = await Promise.all([
        fetch(`${ADMIN_ENDPOINTS.NEWS}?published=1`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${ADMIN_ENDPOINTS.NEWS}?published=0`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (publishedResponse.status === 401 || draftsResponse.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
        return;
      }

      if (publishedResponse.ok || draftsResponse.ok) {
        const [publishedData, draftsData] = await Promise.all([
          publishedResponse.ok ? publishedResponse.json() : Promise.resolve({ data: [] }),
          draftsResponse.ok ? draftsResponse.json() : Promise.resolve({ data: [] }),
        ]);

        const publishedList = (publishedData?.data ?? publishedData ?? []) as News[];
        const draftsList = (draftsData?.data ?? draftsData ?? []) as News[];

        const map: Record<number, News> = {};
        [...publishedList, ...draftsList].forEach(item => {
          map[item.id] = item;
        });

        setNews(Object.values(map));
        setError(null);
      } else {
        const errorData = publishedResponse.ok
          ? await draftsResponse.json().catch(() => ({}))
          : await publishedResponse.json().catch(() => ({}));
        setError(errorData.message || 'Не удалось загрузить новости');
      }
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error);
      setError('Произошла ошибка при загрузке новостей');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNewsAction = async (id: number) => {
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
        // Use functional update to avoid stale closure
        setNews(prevNews => prevNews.filter(item => item.id !== id));
        alert('Новость успешно удалена');
      } else if (response.status === 401) {
        // Handle unauthorized - token expired
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
  };

  const handleTogglePublishStatusAction = async (id: number, currentStatus: boolean) => {
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
        // Use functional update to avoid stale closure
        setNews(prevNews => 
          prevNews.map(item => 
            item.id === id ? { ...item, is_published: !currentStatus } : item
          )
        );
        alert(`Новость ${!currentStatus ? 'опубликована' : 'снята с публикации'} успешно`);
      } else if (response.status === 401) {
        // Handle unauthorized - token expired
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
  };

  const handleEditNewsAction = (newsItem: News) => {
    // Navigate to upload page with news data for editing
    navigate(LINKS.newsUploadLink, { 
      state: { 
        editMode: true, 
        newsData: newsItem 
      } 
    });
  };

  const headerActions = (
    <HeaderActions
      onUpload={() => navigate(LINKS.newsUploadLink)}
      onCategories={() => navigate(LINKS.newsCategoryLink)}
      uploadLabel="Создать новость"
      categoriesLabel="Управление категориями"
    />
  );

  // Custom render functions for columns
  const renderNewsColumn = (newsItem: News) => (
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
  );

  const renderCategoryColumn = (newsItem: News) => (
    <div className="text-sm text-gray-900">
      {newsItem.category ? newsItem.category.name : "Без категории"}
    </div>
  );

  const renderStatisticsColumn = (newsItem: News) => (
    <div className="space-y-1">
      <div className="text-sm text-gray-900">
        👁️ {newsItem.views_count} просмотров
      </div>
      <div className="text-sm text-gray-500">
        ❤️ {newsItem.likes_count} • 💬 {newsItem.comments_count}
      </div>
    </div>
  );

  const renderStatusColumn = (newsItem: News) => (
    <div className="space-y-1">
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          newsItem.is_published
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
  );

  const renderCreatedAtColumn = (newsItem: News) => (
    <div className="text-sm text-gray-500">
      {formatDate(newsItem.created_at)}
    </div>
  );

  const renderActionsColumn = (newsItem: News) => (
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
  );

  // Enhanced columns with render functions
  const enhancedColumns = newsColumns.map(column => ({
    ...column,
    render: column.key === 'news' ? renderNewsColumn :
            column.key === 'category' ? renderCategoryColumn :
            column.key === 'statistics' ? renderStatisticsColumn :
            column.key === 'status' ? renderStatusColumn :
            column.key === 'created_at' ? renderCreatedAtColumn :
            undefined
  }));

  // Enhanced actions with render function
  const enhancedActions = newsActions.map(action => ({
    ...action,
    render: action.key === 'actions' ? renderActionsColumn : undefined
  }));

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
      totalCount={news.length}
      headerActions={headerActions}
    />
  );
};

export default NewsList;
