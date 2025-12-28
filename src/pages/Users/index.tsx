import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/constants/routes';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';
import DataTable from '@/components/shared/DataTable';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'admin' | 'subscriber';
  created_at: string;
  updated_at: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUsers, setUpdatingUsers] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState<{
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  } | undefined>(undefined);
  const [filters, setFilters] = useState({
    search: "",
    page: 1
  });
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const url = new URL(ADMIN_ENDPOINTS.USERS);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
        return;
      }

      if (!response.ok) {
        throw new Error('Ошибка загрузки пользователей');
      }

      const data = await response.json();
      setUsers(data.data || data);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = useCallback((value: string) => {
    setFilters((prev) => {
      if (prev.search === value) return prev;
      return { ...prev, search: value, page: 1 };
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => {
      if (prev.page === page) return prev;
      return { ...prev, page };
    });
  }, []);

  const handleToggleAdminStatus = useCallback(async (userId: number) => {
    try {
      setUpdatingUsers(prev => new Set(prev).add(userId));

      const token = localStorage.getItem('auth_token');
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newRole = user.role === 'admin' ? 'subscriber' : 'admin';

      const response = await fetch(`${ADMIN_ENDPOINTS.TOGGLE_USER_ADMIN}/${userId}/toggle-admin`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
        return;
      }

      if (!response.ok) {
        throw new Error('Ошибка изменения роли пользователя');
      }

      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения роли пользователя');
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [users, navigate]);

  const handleDeleteUser = useCallback(async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${ADMIN_ENDPOINTS.USERS}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
        return;
      }

      if (!response.ok) {
        throw new Error('Ошибка удаления пользователя');
      }

      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления пользователя');
    }
  }, [navigate]);

  const userColumns = useMemo(() => [
    {
      key: 'username',
      label: 'Имя пользователя',
      render: (user: User) => (
        <div>
          <div className="font-medium text-gray-900">{user.username}</div>
          {user.first_name && user.last_name && (
            <div className="text-sm text-gray-500">
              {user.first_name} {user.last_name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (user: User) => (
        <div>
          <div className="text-gray-900">{user.email}</div>
          {user.phone && (
            <div className="text-sm text-gray-500">{user.phone}</div>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Текущая роль',
      render: (user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
          ? 'bg-green-100 text-green-800'
          : 'bg-blue-100 text-blue-800'
          }`}>
          {user.role === 'admin' ? 'Администратор' : 'Подписчик'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Дата регистрации',
      render: (user: User) => new Date(user.created_at).toLocaleDateString('ru-RU'),
    },
  ], []);

  const userActions = useMemo(() => [
    {
      key: 'role-dropdown',
      label: 'Роль',
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          <select
            value={user.role}
            onChange={(e) => {
              const newRole = e.target.value as 'admin' | 'subscriber';
              if (newRole !== user.role) {
                handleToggleAdminStatus(user.id);
              }
            }}
            disabled={updatingUsers.has(user.id)}
            className={`px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${updatingUsers.has(user.id) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <option value="subscriber">Подписчик</option>
            <option value="admin">Администратор</option>
          </select>
          {updatingUsers.has(user.id) && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          <button
            onClick={() => handleDeleteUser(user.id)}
            className="px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            title="Удалить пользователя"
          >
            🗑️
          </button>
        </div>
      ),
    },
  ], [handleDeleteUser, handleToggleAdminStatus, updatingUsers]);

  // No early return for loading/error to keep component mounted

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <DataTable
          title="Пользователи"
          description="Управление пользователями системы"
          data={users}
          columns={userColumns}
          actions={userActions}
          emptyMessage="Пользователи не найдены"
          emptyDescription="В системе пока нет пользователей"
          pagination={pagination}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          showFilters={false}
          loading={loading}
          error={error}
          initialSearchValue={filters.search}
        />
      </div>
    </div>
  );
};

export default Users;
