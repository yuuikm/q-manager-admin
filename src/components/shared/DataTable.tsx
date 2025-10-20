import { type FC, ReactNode } from "react";

export interface TableColumn {
  key: string;
  label: string;
  render?: (item: any) => ReactNode;
}

export interface TableAction {
  key: string;
  label: string;
  icon?: string;
  onClick?: (item: any) => void;
  render?: (item: any) => ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
}

export interface DataTableProps {
  title: string;
  description: string;
  data: any[];
  columns: TableColumn[];
  actions: TableAction[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyDescription?: string;
  totalCount?: number;
  headerActions?: ReactNode;
}

const DataTable: FC<DataTableProps> = ({
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
}) => {
  if (loading) {
    return (
      <div className="admin-card">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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

        {data.length === 0 ? (
          <div className="text-center py-8">
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
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4">
                        {column.render ? column.render(item) : item[column.key]}
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
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                                </svg>
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
      </div>
    </div>
  );
};

export default DataTable;
