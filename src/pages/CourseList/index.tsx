import { type FC, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import DataTable from '@/components/shared/DataTable';
import HeaderActions from '@/components/shared/HeaderActions';
import { courseColumns, courseActions, getTypeLabel, formatPrice, formatDate } from './config';
import Actions from '@/components/shared/Actions';
import { LINKS } from '@/constants/routes';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  price: number;
  type: ('online' | 'self_learning' | 'offline')[] | 'online' | 'self_learning' | 'offline';
  category: {
    id: number;
    name: string;
  } | null;
  featured_image?: string;
  certificate_template?: string;
  max_students?: number;
  current_students: number;
  duration_hours?: number;
  requirements?: string;
  learning_outcomes?: string;
  zoom_link?: string;
  schedule?: any;
  is_published: boolean;
  is_featured: boolean;
  views_count: number;
  enrollments_count: number;
  completion_rate: number;
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

const CourseList: FC = () => {
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);
  const [courses, setCourses] = useState<Course[]>([]);
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

  const fetchCourses = useCallback(async () => {
    try {
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      setLoading(true);
      const url = new URL(ADMIN_ENDPOINTS.COURSES);
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
        setCourses(data.data || []);
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
      } else {
        const err = await response.json().catch(() => ({}));
        setError(err.message || 'Не удалось загрузить курсы');
      }
    } catch (error) {
      console.error('Ошибка загрузки курсов:', error);
      setError('Произошла ошибка при загрузке курсов');
    } finally {
      setLoading(false);
    }
  }, [filters, token, navigate]);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  useEffect(() => {
    fetchCourses();
  }, [filters, token, fetchCourses]);

  const handleDeleteCourseAction = useCallback(async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот курс?')) return;

    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.COURSES}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Use functional update to avoid stale closure
        setCourses(prevCourses => prevCourses.filter(item => item.id !== id));
        alert('Курс успешно удален');
      } else if (response.status === 401) {
        // Handle unauthorized - token expired
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Ошибка удаления курса');
      }
    } catch (error) {
      console.error('Ошибка удаления курса:', error);
      alert('Произошла ошибка при удалении курса');
    }
  }, [token, navigate]);

  const handleTogglePublishStatusAction = useCallback(async (id: number, currentStatus: boolean) => {
    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.TOGGLE_COURSE_STATUS}/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Use functional update to avoid stale closure
        setCourses(prevCourses =>
          prevCourses.map(item =>
            item.id === id ? { ...item, is_published: !currentStatus } : item
          )
        );
        alert(`Курс ${!currentStatus ? 'опубликован' : 'снят с публикации'} успешно`);
      } else if (response.status === 401) {
        // Handle unauthorized - token expired
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Ошибка обновления статуса курса');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса курса:', error);
      alert('Произошла ошибка при обновлении статуса курса');
    }
  }, [token, navigate]);

  const handleEditCourseAction = useCallback((course: Course) => {
    // Navigate to upload page with course data for editing
    navigate(LINKS.coursesUploadLink, {
      state: {
        editMode: true,
        courseData: course
      }
    });
  }, [navigate]);

  useEffect(() => {
    // Event listeners for actions
    const handleEditCourse = (event: CustomEvent) => {
      handleEditCourseAction(event.detail);
    };

    const handleTogglePublishStatus = (event: CustomEvent) => {
      handleTogglePublishStatusAction(event.detail.id, event.detail.currentStatus);
    };

    const handleDeleteCourse = (event: CustomEvent) => {
      handleDeleteCourseAction(event.detail);
    };

    window.addEventListener('editCourse', handleEditCourse as EventListener);
    window.addEventListener('toggleCoursePublishStatus', handleTogglePublishStatus as EventListener);
    window.addEventListener('deleteCourse', handleDeleteCourse as EventListener);

    return () => {
      window.removeEventListener('editCourse', handleEditCourse as EventListener);
      window.removeEventListener('toggleCoursePublishStatus', handleTogglePublishStatus as EventListener);
      window.removeEventListener('deleteCourse', handleDeleteCourse as EventListener);
    };
  }, [handleEditCourseAction, handleTogglePublishStatusAction, handleDeleteCourseAction]);

  const headerActions = (
    <HeaderActions
      onUpload={() => navigate(LINKS.coursesUploadLink)}
      onCategories={() => navigate(LINKS.coursesCategoryLink)}
      uploadLabel="Создать курс"
      categoriesLabel="Управление категориями"
    />
  );

  // Custom render functions for columns
  const renderCourseColumn = useCallback((course: Course) => (
    <div className="flex items-center">
      <div>
        <div className="text-sm font-medium text-gray-900">
          {course.title}
        </div>
        <div className="text-sm text-gray-500 truncate max-w-xs">
          {course.description}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          👁️ {course.views_count} просмотров • от{" "}
          {course.author.first_name} {course.author.last_name}
        </div>
      </div>
    </div>
  ), []);

  const renderTypeCategoryColumn = useCallback((course: Course) => (
    <div className="space-y-1">
      <div className="text-sm text-gray-900">{getTypeLabel(course.type)}</div>
      <div className="text-sm text-gray-500">
        {course.category ? course.category.name : "Без категории"}
      </div>
    </div>
  ), []);

  const renderStudentsColumn = useCallback((course: Course) => (
    <div className="space-y-1">
      <div className="text-sm text-gray-900">
        {course.current_students} / {course.max_students || "∞"}
      </div>
      <div className="text-sm text-gray-500">
        {course.completion_rate}% завершено
      </div>
    </div>
  ), []);

  const renderPriceColumn = useCallback((course: Course) => (
    <div className="text-sm font-medium text-gray-900">
      {formatPrice(course.price)}
    </div>
  ), []);

  const renderStatusColumn = useCallback((course: Course) => (
    <div className="space-y-1">
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${course.is_published
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800"
          }`}
      >
        {course.is_published ? "Опубликован" : "Черновик"}
      </span>
      {course.is_featured && (
        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Рекомендуемый
        </span>
      )}
    </div>
  ), []);

  const renderCreatedAtColumn = useCallback((course: Course) => (
    <div className="text-sm text-gray-500">{formatDate(course.created_at)}</div>
  ), []);

  const renderActionsColumn = useCallback((course: Course) => (
    <Actions
      onEdit={() => {
        window.dispatchEvent(
          new CustomEvent("editCourse", { detail: course }),
        );
      }}
      onToggleStatus={() => {
        window.dispatchEvent(
          new CustomEvent("toggleCoursePublishStatus", {
            detail: { id: course.id, currentStatus: course.is_published },
          }),
        );
      }}
      onDelete={() => {
        window.dispatchEvent(
          new CustomEvent("deleteCourse", { detail: course.id }),
        );
      }}
      isPublished={course.is_published}
      editLabel="Редактировать курс"
      deleteLabel="Удалить курс"
    />
  ), []);

  // Enhanced columns with render functions
  const enhancedColumns = useMemo(() => courseColumns.map(column => ({
    ...column,
    render: column.key === 'course' ? renderCourseColumn :
      column.key === 'type_category' ? renderTypeCategoryColumn :
        column.key === 'students' ? renderStudentsColumn :
          column.key === 'price' ? renderPriceColumn :
            column.key === 'status' ? renderStatusColumn :
              column.key === 'created_at' ? renderCreatedAtColumn :
                undefined
  })), [renderCourseColumn, renderTypeCategoryColumn, renderStudentsColumn, renderPriceColumn, renderStatusColumn, renderCreatedAtColumn]);

  // Enhanced actions with render function
  const enhancedActions = useMemo(() => courseActions.map(action => ({
    ...action,
    render: action.key === 'actions' ? renderActionsColumn : undefined
  })), [renderActionsColumn]);

  return (
    <DataTable
      title="Управление курсами"
      description="Список всех созданных курсов"
      data={courses}
      columns={enhancedColumns}
      actions={enhancedActions}
      loading={loading}
      error={error}
      emptyMessage="Курсы не найдены"
      emptyDescription="Создайте первый курс для начала работы"
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

export default CourseList;
