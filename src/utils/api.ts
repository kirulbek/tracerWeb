const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiError {
  error: string;
  errors?: Array<{ msg: string; path: string }>;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Токен недействителен или истек
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Не авторизован');
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
      throw new Error(error.error || error.errors?.[0]?.msg || 'Ошибка запроса');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Auth functions
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    fullName?: string;
    isAdmin: boolean;
    createdAt: string;
  };
}

export interface UserResponse {
  id: string;
  username: string;
  fullName?: string;
  isAdmin: boolean;
  createdAt: string;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { username, password });
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    return response;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  getMe: async (): Promise<{ userId: string; username: string; fullName?: string; isAdmin: boolean }> => {
    return api.get('/auth/me');
  },

  register: async (username: string, password: string, fullName?: string, isAdmin?: boolean): Promise<UserResponse> => {
    return api.post<UserResponse>('/auth/register', { username, password, fullName, isAdmin });
  },
};


