import { ADMIN_ENDPOINTS } from '@/constants/endpoints';

export interface Faq {
  id: number;
  parent_id: number | null;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  parent?: {
    id: number;
    question: string;
    parent_id?: number | null;
  } | null;
  children?: Faq[];
  all_children?: Faq[];
  children_count?: number;
}

export interface FaqFormData {
  question: string;
  answer: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

export const faqAPI = {
  async getFaqs(params?: { search?: string; parent_id?: string | number | null; flat?: boolean }): Promise<Faq[]> {
    const url = new URL(ADMIN_ENDPOINTS.FAQS);
    if (params) {
      if (params.search) url.searchParams.append('search', params.search);
      if (params.parent_id !== undefined && params.parent_id !== null) {
        url.searchParams.append('parent_id', String(params.parent_id));
      }
      if (params.flat) url.searchParams.append('flat', '1');
    }

    const response = await fetch(url.toString(), {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Не удалось загрузить список вопросов');
    }

    return response.json();
  },

  async getFaqsTree(): Promise<Faq[]> {
    const response = await fetch(ADMIN_ENDPOINTS.FAQS_TREE, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Не удалось загрузить дерево вопросов');
    }

    return response.json();
  },

  async getFaq(id: number): Promise<Faq> {
    const response = await fetch(`${ADMIN_ENDPOINTS.FAQS}/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Не удалось загрузить данные вопроса');
    }

    return response.json();
  },

  async createFaq(data: FaqFormData): Promise<Faq> {
    const response = await fetch(ADMIN_ENDPOINTS.FAQS, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || 'Ошибка при создании вопроса');
    }

    return response.json();
  },

  async updateFaq(id: number, data: FaqFormData): Promise<Faq> {
    const response = await fetch(`${ADMIN_ENDPOINTS.FAQS}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || 'Ошибка при обновлении вопроса');
    }

    return response.json();
  },

  async deleteFaq(id: number): Promise<void> {
    const response = await fetch(`${ADMIN_ENDPOINTS.FAQS}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || 'Ошибка при удалении вопроса');
    }
  },

  async toggleStatus(id: number): Promise<Faq> {
    const response = await fetch(`${ADMIN_ENDPOINTS.TOGGLE_FAQ_STATUS}/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || 'Ошибка при изменении статуса');
    }

    return response.json();
  },
};
