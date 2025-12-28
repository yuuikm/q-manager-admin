import { ADMIN_ENDPOINTS } from 'constants/endpoints';

export interface ManagerHelpCategory {
    id: number;
    name: string;
    slug: string;
}

export interface ManagerHelp {
    id: number;
    title: string;
    slug: string;
    category_id: number;
    description: string | null;
    file_path: string | null;
    file_name: string | null;
    youtube_url: string | null;
    is_active: boolean;
    category?: ManagerHelpCategory;
    created_at: string;
    updated_at: string;
}

export interface ManagerHelpsResponse {
    data: ManagerHelp[];
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
}

export const managerHelpAPI = {
    async getHelps(params?: {
        category_id?: number;
        is_active?: boolean;
        search?: string;
        author_id?: number | string;
        start_date?: string;
        end_date?: string;
        page?: number;
    }): Promise<ManagerHelpsResponse> {
        const token = localStorage.getItem('auth_token');
        const url = new URL(ADMIN_ENDPOINTS.MANAGER_HELP);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== "") {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to fetch manager helps');
        return response.json();
    },

    async getHelp(id: number | string): Promise<ManagerHelp> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${ADMIN_ENDPOINTS.MANAGER_HELP}/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to fetch manager help');
        return response.json();
    },

    async createHelp(formData: FormData): Promise<ManagerHelp> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(ADMIN_ENDPOINTS.MANAGER_HELP, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create manager help');
        }
        return response.json();
    },

    async updateHelp(id: number, formData: FormData): Promise<ManagerHelp> {
        const token = localStorage.getItem('auth_token');
        // Using POST with _method=PUT because of Laravel's file upload restriction in PUT
        formData.append('_method', 'PUT');
        const response = await fetch(`${ADMIN_ENDPOINTS.MANAGER_HELP}/${id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update manager help');
        }
        return response.json();
    },

    async deleteHelp(id: number): Promise<void> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${ADMIN_ENDPOINTS.MANAGER_HELP}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) throw new Error('Failed to delete manager help');
    },

    async toggleStatus(id: number): Promise<ManagerHelp> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${ADMIN_ENDPOINTS.MANAGER_HELP}/${id}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to toggle status');
        return response.json().then(data => data.help);
    },

    async getCategories(): Promise<ManagerHelpCategory[]> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(ADMIN_ENDPOINTS.MANAGER_HELP_CATEGORIES, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    },

    async createCategory(name: string): Promise<ManagerHelpCategory> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(ADMIN_ENDPOINTS.MANAGER_HELP_CATEGORIES, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create category');
        }
        return response.json();
    },

    async updateCategory(id: number, name: string): Promise<ManagerHelpCategory> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${ADMIN_ENDPOINTS.MANAGER_HELP_CATEGORIES}/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update category');
        }
        return response.json();
    },

    async deleteCategory(id: number): Promise<void> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${ADMIN_ENDPOINTS.MANAGER_HELP_CATEGORIES}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete category');
        }
    },
};
