import { type FC, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/shared/DataTable';
import HeaderActions from '@/components/shared/HeaderActions';
import { managerHelpColumns, managerHelpActions, formatDate } from './config';
import Actions from '@/components/shared/Actions';
import { LINKS } from '@/constants/routes';
import { managerHelpAPI, ManagerHelp } from '@/api/managerHelp';
import { adminAPI } from '@/api/admin';

const ManagerHelpList: FC = () => {
    const navigate = useNavigate();
    const [helps, setHelps] = useState<ManagerHelp[]>([]);
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

    const fetchHelps = useCallback(async () => {
        try {
            setLoading(true);
            const response = await managerHelpAPI.getHelps(filters);
            console.log('fetchHelps response:', response);
            let helpsData: ManagerHelp[] = [];
            if (Array.isArray(response)) {
                helpsData = response;
            } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
                helpsData = (response as any).data;
            }
            setHelps(helpsData);
            if (response.current_page) {
                setPagination({
                    current_page: response.current_page,
                    last_page: response.last_page || 0,
                    total: response.total || 0,
                    per_page: response.per_page || 0
                });
            } else {
                setPagination(undefined);
            }
            setError(null);
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных';
            console.error('Error fetching manager helps:', err);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAuthors();
    }, [fetchAuthors]);

    useEffect(() => {
        fetchHelps();
    }, [fetchHelps]);

    useEffect(() => {
        const handleEditHelp = (event: CustomEvent) => {
            handleEditHelpAction(event.detail);
        };

        const handleToggleStatus = (event: CustomEvent) => {
            handleToggleStatusAction(event.detail.id);
        };

        const handleDeleteHelp = (event: CustomEvent) => {
            handleDeleteHelpAction(event.detail);
        };

        window.addEventListener('editHelp', handleEditHelp as EventListener);
        window.addEventListener('toggleHelpStatus', handleToggleStatus as EventListener);
        window.addEventListener('deleteHelp', handleDeleteHelp as EventListener);

        return () => {
            window.removeEventListener('editHelp', handleEditHelp as EventListener);
            window.removeEventListener('toggleHelpStatus', handleToggleStatus as EventListener);
            window.removeEventListener('deleteHelp', handleDeleteHelp as EventListener);
        };
    }, []);

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

    const handleDeleteHelpAction = useCallback(async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;

        try {
            await managerHelpAPI.deleteHelp(id);
            setHelps(prev => prev.filter(item => item.id !== id));
            alert('Запись успешно удалена');
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Ошибка удаления';
            console.error('Error deleting help:', err);
            alert(errorMsg);
        }
    }, []);

    const handleToggleStatusAction = useCallback(async (id: number) => {
        try {
            const updatedHelp = await managerHelpAPI.toggleStatus(id);
            setHelps(prev =>
                prev.map(item => item.id === id ? updatedHelp : item)
            );
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Ошибка обновления статуса';
            console.error('Error toggling status:', err);
            alert(errorMsg);
        }
    }, []);

    const handleEditHelpAction = useCallback((helpItem: ManagerHelp) => {
        navigate(LINKS.managerHelpUploadLink, {
            state: {
                editMode: true,
                helpData: helpItem
            }
        });
    }, [navigate]);

    useEffect(() => {
        const handleEditHelp = (event: CustomEvent) => {
            handleEditHelpAction(event.detail);
        };

        const handleToggleStatus = (event: CustomEvent) => {
            handleToggleStatusAction(event.detail.id);
        };

        const handleDeleteHelp = (event: CustomEvent) => {
            handleDeleteHelpAction(event.detail);
        };

        window.addEventListener('editHelp', handleEditHelp as EventListener);
        window.addEventListener('toggleHelpStatus', handleToggleStatus as EventListener);
        window.addEventListener('deleteHelp', handleDeleteHelp as EventListener);

        return () => {
            window.removeEventListener('editHelp', handleEditHelp as EventListener);
            window.removeEventListener('toggleHelpStatus', handleToggleStatus as EventListener);
            window.removeEventListener('deleteHelp', handleDeleteHelp as EventListener);
        };
    }, [handleEditHelpAction, handleToggleStatusAction, handleDeleteHelpAction]);

    const headerActions = useMemo(() => (
        <HeaderActions
            onUpload={() => navigate(LINKS.managerHelpUploadLink)}
            onCategories={() => navigate(LINKS.managerHelpCategoryLink)}
            uploadLabel="Создать"
            categoriesLabel="Категории"
        />
    ), [navigate]);

    const renderHelpColumn = useCallback((item: ManagerHelp) => (
        <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-900">{item.title}</div>
            {item.description && (
                <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
            )}
        </div>
    ), []);

    const renderCategoryColumn = useCallback((item: ManagerHelp) => (
        <div className="text-sm text-gray-900">
            {item.category?.name || "Без категории"}
        </div>
    ), []);

    const renderFilesColumn = useCallback((item: ManagerHelp) => (
        <div className="flex flex-col gap-1">
            {item.file_path && (
                <div className="text-xs text-blue-600 flex items-center gap-1">
                    📄 {item.file_name}
                </div>
            )}
            {item.youtube_url && (
                <div className="text-xs text-red-600 flex items-center gap-1">
                    🎬 YouTube Видео
                </div>
            )}
            {!item.file_path && !item.youtube_url && (
                <div className="text-xs text-gray-400">Нет файлов</div>
            )}
        </div>
    ), []);

    const renderStatusColumn = useCallback((item: ManagerHelp) => (
        <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.is_active
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
                }`}
        >
            {item.is_active ? "Активно" : "Неактивно"}
        </span>
    ), []);

    const renderCreatedAtColumn = useCallback((item: ManagerHelp) => (
        <div className="text-sm text-gray-500">
            {formatDate(item.created_at)}
        </div>
    ), []);

    const renderActionsColumn = useCallback((item: ManagerHelp) => (
        <Actions
            onEdit={() => {
                window.dispatchEvent(new CustomEvent("editHelp", { detail: item }));
            }}
            onToggleStatus={() => {
                window.dispatchEvent(
                    new CustomEvent("toggleHelpStatus", {
                        detail: { id: item.id, currentStatus: item.is_active },
                    }),
                );
            }}
            onDelete={() => {
                window.dispatchEvent(
                    new CustomEvent("deleteHelp", { detail: item.id }),
                );
            }}
            isPublished={item.is_active}
            editLabel="Редактировать"
            deleteLabel="Удалить"
        />
    ), []);

    const memoizedColumns = useMemo(() => managerHelpColumns.map(column => ({
        ...column,
        render: column.key === 'help' ? renderHelpColumn :
            column.key === 'category' ? renderCategoryColumn :
                column.key === 'files' ? renderFilesColumn :
                    column.key === 'status' ? renderStatusColumn :
                        column.key === 'created_at' ? renderCreatedAtColumn :
                            undefined
    })), [renderHelpColumn, renderCategoryColumn, renderFilesColumn, renderStatusColumn, renderCreatedAtColumn]);

    const memoizedActions = useMemo(() => managerHelpActions.map(action => ({
        ...action,
        render: action.key === 'actions' ? renderActionsColumn : undefined
    })), [renderActionsColumn]);

    return (
        <DataTable
            title="В помощь менеджеру"
            description="Управление материалами для помощи менеджерам"
            data={helps}
            columns={memoizedColumns}
            actions={memoizedActions}
            loading={loading}
            error={error}
            emptyMessage="Записи не найдены"
            emptyDescription="Добавьте первую запись"
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

export default ManagerHelpList;
