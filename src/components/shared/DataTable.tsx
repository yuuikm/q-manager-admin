import { ReactNode, useState, useEffect, useRef } from "react";
import Button from "./Button";

export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

export interface TableAction<T = unknown> {
  key: string;
  label: string;
  icon?: string;
  onClick?: (item: T) => void;
  render?: (item: T) => ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
}

export interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface DataTableProps<T = unknown> {
  title: string;
  description: string;
  data: T[];
  columns: TableColumn<T>[];
  actions: TableAction<T>[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyDescription?: string;
  totalCount?: number;
  headerActions?: ReactNode;

  // Pagination
  pagination?: PaginationData;
  onPageChange?: (page: number) => void;

  // Filtering
  onSearch?: (value: string) => void;
  onFilterChange?: (filters: Record<string, string | number | boolean | null | undefined>) => void;
  initialSearchValue?: string;
  showFilters?: boolean;
  authors?: { id: number; name: string }[];
}

const DataTable = <T extends { id?: string | number | null | undefined }>({
  title,
  description,
  data,
  columns,
  actions,
  loading = false,
  error = null,
  emptyMessage = "Данные не найдены",
  emptyDescription = "Создайте первый элемент для начала работы",
  totalCount,
  headerActions,
  pagination,
  onPageChange,
  onSearch,
  onFilterChange,
  showFilters = true,
  authors = [],
  initialSearchValue = "",
}: DataTableProps<T>) => {
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [authorId, setAuthorId] = useState("");
  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(initialSearchValue);

  // Sync internal search value with prop if it changes externally
  useEffect(() => {
    if (initialSearchValue !== searchValue) {
      setSearchValue(initialSearchValue);
      prevSearchRef.current = initialSearchValue;
    }
  }, [initialSearchValue, searchValue]);

  // Debounced search
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only trigger if searchValue is different from what we last notified the parent about
    if (searchValue === prevSearchRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      prevSearchRef.current = searchValue;
      onSearch?.(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, onSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchValue);
  };

  const handleFilterClick = () => {
    onFilterChange?.({
      start_date: startDate,
      end_date: endDate,
      author_id: authorId,
    });
  };

  const handleResetFilters = () => {
    setSearchValue("");
    setStartDate("");
    setEndDate("");
    setAuthorId("");
    onSearch?.("");
    onFilterChange?.({
      start_date: "",
      end_date: "",
      author_id: "",
    });
  };

  if (error) {
    return (
      <div className="admin-card">
        <div className="text-center py-8">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  const getActionVariantClasses = (variant: string = 'primary') => {
    const variants = {
      primary: 'text-blue-600 hover:text-blue-900 hover:bg-blue-50',
      secondary: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
      danger: 'text-red-600 hover:text-red-900 hover:bg-red-50',
      warning: 'text-orange-600 hover:text-orange-900 hover:bg-orange-50',
      success: 'text-green-600 hover:text-green-900 hover:bg-green-50',
    };
    return variants[variant as keyof typeof variants] || variants.primary;
  };

  return (
    <div className="space-y-6">
      <div className="admin-card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
          <div className="flex space-x-3">
            {totalCount !== undefined && (
              <div className="text-sm text-gray-600 flex items-center">
                Всего: {totalCount} элементов
              </div>
            )}
            {headerActions}
          </div>
        </div>

        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Поиск</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Поиск по названию..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="submit">Найти</Button>
                </div>
              </form>

              <div className="w-40">
                <label className="block text-xs font-medium text-gray-700 mb-1">C даты</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-40">
                <label className="block text-xs font-medium text-gray-700 mb-1">По дату</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-48">
                <label className="block text-xs font-medium text-gray-700 mb-1">Автор</label>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все авторы</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2">
                <Button variant="primary" onClick={handleFilterClick}>Применить</Button>
                <Button variant="secondary" onClick={handleResetFilters}>Сбросить</Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg mb-4">{emptyMessage}</p>
            <p className="text-gray-500">{emptyDescription}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4">
                        {column.render ? column.render(item) : String((item as Record<string, unknown>)[column.key] ?? '')}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {actions.map((action) => (
                            action.render ? (
                              <div key={action.key}>
                                {action.render(item)}
                              </div>
                            ) : (
                              <button
                                key={action.key}
                                onClick={() => action.onClick?.(item)}
                                className={`p-2 rounded-lg transition-colors ${getActionVariantClasses(action.variant)} ${action.className || ''}`}
                                title={action.label}
                              >
                                {action.icon && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                                  </svg>
                                )}
                                {!action.icon && action.label}
                              </button>
                            )
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between mt-6 border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-700">
              Показано {(pagination.current_page - 1) * pagination.per_page + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} из {pagination.total}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={() => onPageChange?.(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
              >
                Назад
              </Button>
              <div className="flex items-center space-x-1">
                {[...Array(pagination.last_page)].map((_, i) => {
                  const page = i + 1;
                  // Show current page, first, last, and pages around current
                  if (
                    page === 1 ||
                    page === pagination.last_page ||
                    (page >= pagination.current_page - 2 && page <= pagination.current_page + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange?.(page)}
                        className={`px-3 py-1 rounded-md text-sm ${pagination.current_page === page
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === pagination.current_page - 3 ||
                    page === pagination.current_page + 3
                  ) {
                    return <span key={page}>...</span>;
                  }
                  return null;
                })}
              </div>
              <Button
                variant="secondary"
                onClick={() => onPageChange?.(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
              >
                Вперед
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
