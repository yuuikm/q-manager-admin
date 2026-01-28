import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {LINKS} from '@/constants/routes';
import {sliderAPI, Slider} from '@/api/slider';
import DataTable from '@/components/shared/DataTable';
import {BASE_URL} from "constants/endpoints.ts";

const SliderList: React.FC = () => {
    const [sliders, setSliders] = useState<Slider[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<{
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    } | undefined>(undefined);
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
    });
    const navigate = useNavigate();

    const fetchSliders = useCallback(async () => {
        try {
            setLoading(true);
            const data = await sliderAPI.getSliders(filters);
            setSliders(data.data || []);
            if (data.current_page) {
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    total: data.total,
                    per_page: data.per_page,
                });
            } else {
                setPagination(undefined);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки слайдов');
            console.error('Error fetching sliders:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchSliders();
    }, [fetchSliders]);

    const handleSearch = useCallback((value: string) => {
        setFilters((prev) => {
            if (prev.search === value) return prev;
            return {...prev, search: value, page: 1};
        });
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFilters((prev) => {
            if (prev.page === page) return prev;
            return {...prev, page};
        });
    }, []);

    const handleDeleteSlider = useCallback(async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить этот слайд?')) return;
        try {
            await sliderAPI.deleteSlider(id);
            setSliders((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            console.error('Error deleting slider:', err);
            alert('Ошибка при удалении слайда');
        }
    }, []);

    const handleToggleStatus = useCallback(async (id: number) => {
        try {
            await sliderAPI.toggleStatus(id);
            setSliders((prev) =>
                prev.map((s) => (s.id === id ? {...s, is_active: !s.is_active} : s))
            );
        } catch (err) {
            console.error('Error toggling slider status:', err);
            alert('Ошибка при изменении статуса');
        }
    }, []);

    const handleEditSlider = useCallback((slider: Slider) => {
        navigate(LINKS.sliderUploadLink, {state: {editMode: true, sliderData: slider}});
    }, [navigate]);

    const sliderColumns = useMemo(() => [
        {
            key: 'image',
            label: 'Изображение',
            render: (slider: Slider) => (
                <div className="w-32 h-20 bg-gray-100 rounded overflow-hidden">
                    <img
                        src={`${BASE_URL}/storage/${slider.image_path}`}
                        alt={slider.title || 'Slide'}
                        className="w-full h-full object-cover"
                    />
                </div>
            ),
        },
        {
            key: 'content',
            label: 'Контент',
            render: (slider: Slider) => (
                <div>
                    <div className="font-semibold text-gray-900">{slider.title || 'Без заголовка'}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{slider.description}</div>
                    {slider.link_url && (
                        <div className="text-xs text-blue-600 truncate max-w-xs">{slider.link_url}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'order',
            label: 'Порядок',
            render: (slider: Slider) => <span>{slider.order}</span>,
        },
        {
            key: 'status',
            label: 'Статус',
            render: (slider: Slider) => (
                <button
                    onClick={() => handleToggleStatus(slider.id)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${slider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                >
                    {slider.is_active ? 'Активен' : 'Неактивен'}
                </button>
            ),
        },
        {
            key: 'author',
            label: 'Автор',
            render: (slider: Slider) => (
                <div className="text-sm text-gray-500">
                    {slider.author?.username || 'Система'}
                    <div className="text-xs">{new Date(slider.created_at).toLocaleDateString()}</div>
                </div>
            ),
        },
    ], [handleToggleStatus]);

    const sliderActions = useMemo(() => [
        {
            key: 'actions',
            label: 'Действия',
            render: (slider: Slider) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleEditSlider(slider)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Редактировать"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => handleDeleteSlider(slider.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Удалить"
                    >
                        🗑️
                    </button>
                </div>
            ),
        },
    ], [handleEditSlider, handleDeleteSlider]);

    return (
        <DataTable<Slider>
            title="Слайдер"
            description="Управление баннерами на главной странице"
            data={sliders}
            columns={sliderColumns}
            actions={sliderActions}
            pagination={pagination}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            loading={loading}
            error={error}
            initialSearchValue={filters.search}
            headerActions={
                <button
                    onClick={() => navigate(LINKS.sliderUploadLink)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Добавить слайд
                </button>
            }
        />
    );
};

export default SliderList;
