import { ADMIN_ENDPOINTS } from '@/constants/endpoints';

export interface Lead {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  question: string;
  source: string;
  status: 'new' | 'in_progress' | 'contacted' | 'closed';
  is_faq_added: boolean;
  faq_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  faq?: {
    id: number;
    question: string;
  } | null;
}

export interface LeadsFilterParams {
  status?: string;
  search?: string;
  is_faq_added?: boolean | string;
}

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

export const leadsAPI = {
  async getLeads(params?: LeadsFilterParams): Promise<Lead[]> {
    const url = new URL(ADMIN_ENDPOINTS.LEADS);
    if (params) {
      if (params.status) url.searchParams.append('status', params.status);
      if (params.search) url.searchParams.append('search', params.search);
      if (params.is_faq_added !== undefined) {
        url.searchParams.append('is_faq_added', String(params.is_faq_added));
      }
    }

    const response = await fetch(url.toString(), {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Не удалось загрузить список лидов');
    }

    return response.json();
  },

  async getLead(id: number): Promise<Lead> {
    const response = await fetch(`${ADMIN_ENDPOINTS.LEADS}/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Не удалось загрузить данные лида');
    }

    return response.json();
  },

  async updateStatus(id: number, status: string, notes?: string): Promise<Lead> {
    const response = await fetch(`${ADMIN_ENDPOINTS.LEADS}/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, notes }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || 'Ошибка обновления статуса');
    }

    return response.json();
  },

  async convertFaq(
    id: number,
    data?: { faq_id?: number; answer?: string; parent_id?: number | null; sort_order?: number }
  ): Promise<{ lead: Lead; faq?: any }> {
    const response = await fetch(`${ADMIN_ENDPOINTS.LEADS}/${id}/convert-faq`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || 'Ошибка добавления в FAQ');
    }

    return response.json();
  },

  async deleteLead(id: number): Promise<void> {
    const response = await fetch(`${ADMIN_ENDPOINTS.LEADS}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || 'Ошибка удаления лида');
    }
  },
};
