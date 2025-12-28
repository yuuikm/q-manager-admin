import { ADMIN_ENDPOINTS } from '@/constants/endpoints';

export interface Slider {
    id: number;
    title: string | null;
    description: string | null;
    image_path: string;
    link_url: string | null;
    order: number;
    is_active: boolean;
    created_by: number;
    created_at: string;
    updated_at: string;
    author?: {
        id: number;
        username: string;
        first_name?: string;
        last_name?: string;
    };
}

export interface SliderFilters {
    search?: string;
    page?: number;
}

export const sliderAPI = {
    getSliders: async (filters: SliderFilters = {}) => {
        const token = localStorage.getItem('auth_token');
        const url = new URL(ADMIN_ENDPOINTS.SLIDERS);

        if (filters.search) url.searchParams.append('search', filters.search);
        if (filters.page) url.searchParams.append('page', filters.page.toString());

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Failed to fetch sliders');
        return response.json();
    },

    getSlider: async (id: number) => {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${ADMIN_ENDPOINTS.SLIDERS}/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Failed to fetch slider');
        return response.json();
    },

    createSlider: async (formData: FormData) => {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(ADMIN_ENDPOINTS.SLIDERS, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        });

        if (!response.ok) throw new Error('Failed to create slider');
        return response.json();
    },

    updateSlider: async (id: number, formData: FormData) => {
        const token = localStorage.getItem('auth_token');
        // Laravel doesn't handle multipart/form-data with PUT easily if we don't spoof the method
        formData.append('_method', 'PUT');

        const response = await fetch(`${ADMIN_ENDPOINTS.SLIDERS}/${id}`, {
            method: 'POST', // Use POST with _method=PUT for multipart support
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        });

        if (!response.ok) throw new Error('Failed to update slider');
        return response.json();
    },

    deleteSlider: async (id: number) => {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${ADMIN_ENDPOINTS.SLIDERS}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Failed to delete slider');
        return response.json();
    },

    toggleStatus: async (id: number) => {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${ADMIN_ENDPOINTS.SLIDERS}/${id}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Failed to toggle slider status');
        return response.json();
    }
};
