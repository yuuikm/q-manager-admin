import { API_BASE_URL } from 'constants/endpoints';

export interface ApplicationUser {
  id: number;
  username: string;
  email: string;
}

export interface Application {
  id: number;
  type: 'course' | 'document';
  item_title: string;
  item_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  company: string | null;
  notes: string | null;
  price: number;
  payment_status: 'created' | 'contract' | 'paid';
  created_at: string;
  user: ApplicationUser | null;
}

export interface ApplicationsResponse {
  applications: Application[];
  total: number;
}

export const applicationsAPI = {
  async getApplications(params?: {
    payment_status?: string;
    type?: string;
    search?: string;
  }): Promise<ApplicationsResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No token found');

    const url = new URL(`${API_BASE_URL}/admin/applications`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
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

    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }

    return response.json();
  },

  async updateStatus(type: 'course' | 'document', id: number, status: string): Promise<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/admin/applications/${type}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payment_status: status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Update failed');
    }

    return response.json();
  }
};
