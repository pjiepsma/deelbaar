import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PayloadUser {
  id: string;
  email?: string;
  isAnonymous?: boolean;
  collection: string;
}

export interface PayloadSession {
  token: string;
  user: PayloadUser;
  exp: number;
}

class PayloadAPIClient {
  private baseUrl: string = '';
  private token: string | null = null;
  private user: PayloadUser | null = null;

  constructor() {
    // This will be set during init or can be configured
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  async init(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
      console.log('[PayloadClient.init] Base URL set to:', this.baseUrl);
    } else {
      console.warn('[PayloadClient.init] No base URL provided!');
    }

    const storedToken = await AsyncStorage.getItem('auth_token');
    const storedUser = await AsyncStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      this.token = storedToken;
      this.user = JSON.parse(storedUser);
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data?: T; error?: any }> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('[PayloadClient.request] URL:', url);
      console.log('[PayloadClient.request] Method:', options.method || 'GET');
      console.log('[PayloadClient.request] Body:', options.body);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.token) {
        headers['Authorization'] = `JWT ${this.token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('[PayloadClient.request] Response status:', response.status);
      console.log('[PayloadClient.request] Response ok:', response.ok);

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log('[PayloadClient.request] Response data:', JSON.stringify(data).substring(0, 200));

      if (!response.ok) {
        console.error('[PayloadClient.request] Request failed!', response.status);
        return {
          error: {
            message: data?.errors?.[0]?.message || data?.message || 'Request failed',
            status: response.status,
            data,
          },
        };
      }

      return { data };
    } catch (error: any) {
      console.error('[PayloadClient.request] Exception:', error);
      return {
        error: {
          message: error.message || 'Network error',
          networkError: true,
        },
      };
    }
  }

  // Authentication
  async login(email: string, password: string) {
    console.log('[PayloadClient] Login request to:', `${this.baseUrl}/api/users/login`);
    console.log('[PayloadClient] Login email:', email);
    
    const { data, error } = await this.request<{ token: string; user: PayloadUser }>(
      '/api/users/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    console.log('[PayloadClient] Login response - data:', data, 'error:', error);

    if (error) {
      console.error('[PayloadClient] Login error:', error);
      return { data: null, error };
    }

    if (data) {
      console.log('[PayloadClient] Login successful, storing token');
      this.token = data.token;
      this.user = data.user;
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
    }

    return { data, error: null };
  }

  async loginAnonymously() {
    // Create anonymous user
    const randomEmail = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@anonymous.local`;
    const randomPassword = Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);

    const { data: userData, error: createError } = await this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: randomEmail,
        password: randomPassword,
        isAnonymous: true,
      }),
    });

    if (createError) return { data: null, error: createError };

    // Login with created credentials
    return this.login(randomEmail, randomPassword);
  }

  async logout() {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    this.token = null;
    this.user = null;
  }

  async me() {
    return this.request<PayloadUser>('/api/users/me');
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.token;
  }

  // Generic CRUD operations
  async findMany<T = any>(collection: string, params?: {
    where?: any;
    limit?: number;
    page?: number;
    sort?: string;
    depth?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.where) queryParams.append('where', JSON.stringify(params.where));
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.depth !== undefined) queryParams.append('depth', params.depth.toString());

    const query = queryParams.toString();
    return this.request<{ docs: T[]; totalDocs: number; limit: number; page: number }>(
      `/api/${collection}${query ? `?${query}` : ''}`
    );
  }

  async findById<T = any>(collection: string, id: string, depth?: number) {
    const query = depth !== undefined ? `?depth=${depth}` : '';
    return this.request<T>(`/api/${collection}/${id}${query}`);
  }

  async create<T = any>(collection: string, data: any) {
    return this.request<T>(`/api/${collection}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update<T = any>(collection: string, id: string, data: any) {
    return this.request<T>(`/api/${collection}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(collection: string, id: string) {
    return this.request(`/api/${collection}/${id}`, {
      method: 'DELETE',
    });
  }

  // File upload
  async uploadFile(file: any, alt: string = 'Uploaded file') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', alt);

    try {
      const headers: HeadersInit = {};
      if (this.token) {
        headers['Authorization'] = `JWT ${this.token}`;
      }

      const response = await fetch(`${this.baseUrl}/api/media`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  getFileUrl(mediaId: string) {
    return `${this.baseUrl}/api/media/file/${mediaId}`;
  }
}

export const payloadClient = new PayloadAPIClient();

