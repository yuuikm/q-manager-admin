import { ADMIN_ENDPOINTS } from 'constants/endpoints';

export interface MediaFile {
    path: string;
    name: string;
    folder: string;
    size: number;
    last_modified: string;
    mime_type: string;
    type: 'image' | 'pdf' | 'word' | 'excel' | 'video' | 'other';
    url: string;
    is_used: boolean;
}

export interface MediaFilesResponse {
    files: MediaFile[];
    total: number;
    unused_count: number;
    directories: string[];
}

export interface MediaFilesParams {
    search?: string;
    type?: string;
    folder?: string;
    used?: boolean | '';
}

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

export const mediaAPI = {
    async getFiles(params?: MediaFilesParams): Promise<MediaFilesResponse> {
        const url = new URL(ADMIN_ENDPOINTS.MEDIA);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить медиафайлы');
        }

        return response.json();
    },

    async deleteFile(path: string): Promise<{ message: string }> {
        const response = await fetch(ADMIN_ENDPOINTS.MEDIA, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ path }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при удалении файла');
        }

        return response.json();
    },

    async deleteFiles(paths: string[]): Promise<{ deleted: string[]; failed: string[]; message: string }> {
        const response = await fetch(`${ADMIN_ENDPOINTS.MEDIA}/bulk`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ paths }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при удалении файлов');
        }

        return response.json();
    },
};
