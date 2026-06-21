import { type FC, useState, useEffect } from 'react';
import { applicationsAPI, type Application } from 'api/applications';
import ErrorBoundary from 'components/ErrorBoundary';

const ApplicationsContent: FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await applicationsAPI.getApplications({
        payment_status: statusFilter,
        type: typeFilter,
        search: search,
      });
      setApplications(data.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заявок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter, typeFilter]);

  const handleStatusChange = async (app: Application, newStatus: string) => {
    try {
      await applicationsAPI.updateStatus(app.type, app.id, newStatus);
      // Reload to ensure list is updated
      loadApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка обновления статуса');
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'created') return { text: 'Создана', color: 'bg-yellow-100 text-yellow-800' };
    if (status === 'contract') return { text: 'Договор', color: 'bg-blue-100 text-blue-800' };
    if (status === 'paid') return { text: 'Оплачено', color: 'bg-green-100 text-green-800' };
    return { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Управление заявками</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Поиск по имени, email, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadApplications()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Все типы</option>
          <option value="course">Курсы</option>
          <option value="document">Документы</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Все статусы</option>
          <option value="created">Создана</option>
          <option value="contract">Договор</option>
          <option value="paid">Оплачено</option>
        </select>
        <button
          onClick={loadApplications}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          Найти
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Загрузка заявок...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
          <p className="text-gray-500 text-lg">Заявки не найдены</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип / Товар</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Контакты</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => {
                  const statusInfo = getStatusLabel(app.payment_status);
                  return (
                    <tr key={`${app.type}-${app.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.created_at).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">{app.type === 'course' ? '🎓' : '📄'}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{app.item_title}</p>
                            <p className="text-xs text-gray-500">{app.price} ₸</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{app.first_name} {app.last_name}</div>
                        <div className="text-sm text-gray-500">{app.phone}</div>
                        <div className="text-sm text-gray-500">{app.email}</div>
                        {app.company && <div className="text-xs text-gray-400 mt-1">Компания: {app.company}</div>}
                        {app.notes && <div className="text-xs text-gray-400 mt-1 italic">"{app.notes}"</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {app.user ? (
                          <div>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Авторизован</span>
                            <div className="text-xs text-gray-500 mt-1">{app.user.username}</div>
                          </div>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Гость</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={app.payment_status}
                          onChange={(e) => handleStatusChange(app, e.target.value)}
                          className={`text-sm font-medium rounded-full px-3 py-1 border-0 ring-1 ring-inset focus:ring-2 focus:ring-blue-600 ${
                            app.payment_status === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                            app.payment_status === 'contract' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 
                            'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                          }`}
                        >
                          <option value="created">Создана</option>
                          <option value="contract">Договор</option>
                          <option value="paid">Оплачено</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const Applications: FC = () => (
  <ErrorBoundary>
    <ApplicationsContent />
  </ErrorBoundary>
);

export default Applications;
