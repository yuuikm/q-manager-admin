import { useState, useEffect } from 'react';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
}

interface CategorySelectorProps {
  type: 'news' | 'document' | 'course';
  selectedCategoryId?: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  onNewCategory?: (category: Category) => void;
  className?: string;
}

const CategorySelector = ({ 
  type, 
  selectedCategoryId, 
  onCategoryChange, 
  onNewCategory,
  className = '' 
}: CategorySelectorProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#667eea',
    icon: '',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const endpoint = ADMIN_ENDPOINTS[`${type.toUpperCase()}_CATEGORIES` as keyof typeof ADMIN_ENDPOINTS];
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('auth_token');
      const endpoint = ADMIN_ENDPOINTS[`${type.toUpperCase()}_CATEGORIES` as keyof typeof ADMIN_ENDPOINTS];
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });

      if (response.ok) {
        const createdCategory = await response.json();
        setCategories([...categories, createdCategory]);
        onCategoryChange(createdCategory.id);
        onNewCategory?.(createdCategory);
        setShowCreateForm(false);
        setNewCategory({
          name: '',
          description: '',
          color: '#667eea',
          icon: '',
          is_active: true,
          sort_order: 0,
        });
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'news': return 'News';
      case 'document': return 'Document';
      case 'course': return 'Course';
      default: return 'Content';
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {getTypeLabel()} Category
        </label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {getTypeLabel()} Category
      </label>
      
      <div className="space-y-2">
        <div className="flex space-x-2">
          <select
            value={selectedCategoryId || ''}
            onChange={(e) => onCategoryChange(e.target.value ? parseInt(e.target.value) : null)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {getTypeLabel()} Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.name}
              </option>
            ))}
          </select>
          
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showCreateForm ? 'Cancel' : 'New'}
          </button>
        </div>

        {showCreateForm && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Create New {getTypeLabel()} Category</h4>
            
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Category name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="📁"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={2}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Category description"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-8 h-6 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newCategory.is_active}
                    onChange={(e) => setNewCategory({ ...newCategory, is_active: e.target.checked })}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-1 text-xs text-gray-900">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySelector;
