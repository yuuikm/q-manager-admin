import { ADMIN_ENDPOINTS } from 'constants/endpoints';

export interface Document {
  id: number;
  title: string;
  description: string | null;
  category: string;
  price: number;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface DocumentFormData {
  title: string;
  description: string;
  category: string;
  price: number;
  document: File;
}

export interface UpdateDocumentData {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  is_active?: boolean;
}

export interface DocumentsResponse {
  data: Document[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const adminAPI = {
  async uploadDocument(formData: FormData): Promise<{ message: string; document: Document }> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(ADMIN_ENDPOINTS.UPLOAD_DOCUMENT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  async getDocuments(params?: { page?: number; category?: string; search?: string }): Promise<DocumentsResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token found');
    }

    const url = new URL(ADMIN_ENDPOINTS.GET_DOCUMENTS);
    if (params?.page) url.searchParams.append('page', params.page.toString());
    if (params?.category) url.searchParams.append('category', params.category);
    if (params?.search) url.searchParams.append('search', params.search);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  },


  async updateDocument(id: number, data: UpdateDocumentData): Promise<{ message: string; document: Document }> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${ADMIN_ENDPOINTS.UPDATE_DOCUMENT}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Update failed');
    }

    return response.json();
  },

  async deleteDocument(id: number): Promise<{ message: string }> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${ADMIN_ENDPOINTS.DELETE_DOCUMENT}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }

    return response.json();
  },

  async getCategories(): Promise<string[]> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(ADMIN_ENDPOINTS.CATEGORIES, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return response.json();
  },
};
