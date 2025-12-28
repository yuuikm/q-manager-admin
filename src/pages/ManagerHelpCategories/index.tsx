import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LINKS } from 'constants/routes';
import { managerHelpAPI, ManagerHelpCategory } from '@/api/managerHelp';

const ManagerHelpCategories = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<ManagerHelpCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ManagerHelpCategory | null>(null);
    const [formData, setFormData] = useState({
        name: '',
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await managerHelpAPI.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await managerHelpAPI.updateCategory(editingCategory.id, formData.name);
            } else {
                await managerHelpAPI.createCategory(formData.name);
            }
            await fetchCategories();
            setShowModal(false);
            setEditingCategory(null);
            setFormData({ name: '' });
        } catch (error: any) {
            console.error('Ошибка сохранения категории:', error);
            alert(error.message || 'Ошибка сохранения');
        }
    };

    const handleEdit = (category: ManagerHelpCategory) => {
        setEditingCategory(category);
        setFormData({ name: category.name });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;
        try {
            await managerHelpAPI.deleteCategory(id);
            await fetchCategories();
        } catch (error: any) {
            console.error('Ошибка удаления категории:', error);
            alert(error.message || 'Ошибка удаления. Возможно, категория используется.');
        }
    };

    const openModal = () => {
        setEditingCategory(null);
        setFormData({ name: '' });
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800">Категории "В помощь менеджеру"</h2>
                        <p className="text-gray-600 mt-1">Управление категориями</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => navigate(LINKS.managerHelpLink)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            ← Назад
                        </button>
                        <button
                            onClick={openModal}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Добавить категорию
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.slug}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleEdit(category)} className="text-blue-600 hover:text-blue-900 mr-3">Редактировать</button>
                                        <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900">Удалить</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Введите название"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md">Отмена</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                    {editingCategory ? 'Обновить' : 'Создать'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerHelpCategories;
