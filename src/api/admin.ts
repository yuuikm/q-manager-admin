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
  creator?: Creator;
}

export interface Creator {
  id: number;
  username: string;
  email: string;
}

export interface Admin {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
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

  async getDocuments(params?: {
    page?: number;
    category?: string;
    search?: string;
    author_id?: number | string;
    start_date?: string;
    end_date?: string;
  }): Promise<DocumentsResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token found');
    }

    const url = new URL(ADMIN_ENDPOINTS.GET_DOCUMENTS);
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

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  },

  async getAdmins(): Promise<{ id: number; name: string }[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(ADMIN_ENDPOINTS.GET_ADMINS, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admins');
    }

    const admins = await response.json();
    return admins.map((admin: Admin) => ({
      id: admin.id,
      name: admin.first_name && admin.last_name
        ? `${admin.first_name} ${admin.last_name}`
        : admin.username
    }));
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
