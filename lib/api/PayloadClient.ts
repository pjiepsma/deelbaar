import AsyncStorage from '@react-native-async-storage/async-storage';

import type { User } from '~/lib/types/payload-generated';
import type {
  CreateStripePaymentParams,
  StripeAccountStatus,
  StripeConnectResponse,
  StripeDisconnectResponse,
  StripePaymentIntentResponse,
  StripeStatusResponse,
} from '~/lib/types/stripe';

export type PayloadUser = User;

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

  getBaseUrl() {
    return this.baseUrl;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `JWT ${this.token}`;
    }

    return headers;
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
        ...this.getAuthHeaders(),
        ...options.headers,
      };

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

  // Wishlist/Book requests methods
  async getBookWishes(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/book-wishes`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch book wishes');
      }

      const data = await response.json();
      return data.docs || [];
    } catch (error) {
      console.warn('getBookWishes error:', error);
      return [];
    }
  }

  async createBookWish(wishData: {
    title: string;
    author?: string;
    isbn?: string;
    description?: string;
    location?: {
      latitude: number;
      longitude: number;
      radius: number; // km radius for notifications
    };
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/book-wishes`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wishData),
      });

      if (!response.ok) {
        throw new Error('Failed to create book wish');
      }

      return await response.json();
    } catch (error) {
      console.warn('createBookWish error:', error);
      throw error;
    }
  }

  async deleteBookWish(wishId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/book-wishes/${wishId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete book wish');
      }
    } catch (error) {
      console.warn('deleteBookWish error:', error);
      throw error;
    }
  }

  async getMatchingWishes(bookData: {
    title: string;
    author?: string;
    isbn?: string;
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        title: bookData.title,
        ...(bookData.author && { author: bookData.author }),
        ...(bookData.isbn && { isbn: bookData.isbn }),
      });

      const response = await fetch(`${this.baseUrl}/api/book-wishes/match?${params}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to find matching wishes');
      }

      const data = await response.json();
      return data.matches || [];
    } catch (error) {
      console.warn('getMatchingWishes error:', error);
      return [];
    }
  }

  // Product offerings methods (for farm stands, repair cafes, etc.)
  async getProductOfferings(listingId?: string): Promise<any[]> {
    try {
      const url = listingId
        ? `${this.baseUrl}/api/product-offerings?listing=${listingId}`
        : `${this.baseUrl}/api/product-offerings`;

      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product offerings');
      }

      const data = await response.json();
      return data.docs || [];
    } catch (error) {
      console.warn('getProductOfferings error:', error);
      return [];
    }
  }

  async createProductOffering(offeringData: {
    listingId: string;
    productName: string;
    description?: string;
    quantity?: number;
    unit?: string; // kg, stuks, liter, etc.
    price?: number;
    availableUntil?: string;
    category?: string;
    usageInstructions?: string;
    photos?: string[];
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/product-offerings`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offeringData),
      });

      if (!response.ok) {
        throw new Error('Failed to create product offering');
      }

      return await response.json();
    } catch (error) {
      console.warn('createProductOffering error:', error);
      throw error;
    }
  }

  async updateProductOffering(
    offeringId: string,
    updates: {
      quantity?: number;
      status?: 'available' | 'out_of_stock' | 'reserved';
      description?: string;
    }
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/product-offerings/${offeringId}`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update product offering');
      }

      return await response.json();
    } catch (error) {
      console.warn('updateProductOffering error:', error);
      throw error;
    }
  }

  async deleteProductOffering(offeringId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/product-offerings/${offeringId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete product offering');
      }
    } catch (error) {
      console.warn('deleteProductOffering error:', error);
      throw error;
    }
  }

  // Product favorites/following
  async getProductFavorites(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/product-favorites`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product favorites');
      }

      const data = await response.json();
      return data.docs || [];
    } catch (error) {
      console.warn('getProductFavorites error:', error);
      return [];
    }
  }

  async toggleProductFavorite(offeringId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/product-favorites/toggle`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offeringId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle product favorite');
      }

      return await response.json();
    } catch (error) {
      console.warn('toggleProductFavorite error:', error);
      throw error;
    }
  }

  // Report product as out of stock
  async reportOutOfStock(offeringId: string, reporterNote?: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/product-offerings/${offeringId}/report-out-of-stock`,
        {
          method: 'POST',
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reporterNote }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to report out of stock');
      }

      return await response.json();
    } catch (error) {
      console.warn('reportOutOfStock error:', error);
      throw error;
    }
  }

  // Tool reservations for Repair Cafés
  async createToolReservation(reservationData: {
    toolId: string;
    startDate: string; // ISO string
    duration: number; // in hours
    notes?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tool-reservations`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) {
        throw new Error('Failed to create tool reservation');
      }

      return await response.json();
    } catch (error) {
      console.warn('createToolReservation error:', error);
      throw error;
    }
  }

  async getToolReservations(toolId?: string): Promise<any[]> {
    try {
      const url = toolId
        ? `${this.baseUrl}/api/tool-reservations?tool=${toolId}`
        : `${this.baseUrl}/api/tool-reservations`;

      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tool reservations');
      }

      const data = await response.json();
      return data.docs || [];
    } catch (error) {
      console.warn('getToolReservations error:', error);
      return [];
    }
  }

  // Product offering approval system
  async approveProductOffering(
    offeringId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/product-offerings/${offeringId}/approve`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved,
          rejectionReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve/reject product offering');
      }

      return await response.json();
    } catch (error) {
      console.warn('approveProductOffering error:', error);
      throw error;
    }
  }

  async getPendingProductOfferings(listingId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/product-offerings/pending?listing=${listingId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pending product offerings');
      }

      const data = await response.json();
      return data.docs || [];
    } catch (error) {
      console.warn('getPendingProductOfferings error:', error);
      return [];
    }
  }

  // Stripe Connect helpers
  async createStripeAccountSession() {
    return this.request<StripeConnectResponse>('/api/stripe/connect', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getStripeAccountStatus() {
    return this.request<StripeStatusResponse>('/api/stripe/status', {
      method: 'GET',
    });
  }

  async disconnectStripeAccount() {
    return this.request<StripeDisconnectResponse>('/api/stripe/disconnect', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async createStripePaymentIntent(params: CreateStripePaymentParams) {
    return this.request<StripePaymentIntentResponse>('/api/stripe/payments', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async register(email: string, password: string, additionalData?: any) {
    console.log('[PayloadClient] Register request to:', `${this.baseUrl}/api/users`);
    console.log('[PayloadClient] Register email:', email);

    const registerData = {
      email,
      password,
      isAnonymous: false,
      ...additionalData,
    };

    const { data, error } = await this.request<PayloadUser>('/api/users', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });

    console.log('[PayloadClient] Register response - data:', data, 'error:', error);

    if (error) {
      console.error('[PayloadClient] Register error:', error);
      return { data: null, error };
    }

    // Auto-login after successful registration
    if (data) {
      console.log('[PayloadClient] Registration successful, auto-logging in');
      return this.login(email, password);
    }

    return { data, error: null };
  }

  async loginAnonymously() {
    // Create anonymous user
    const randomEmail = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@anonymous.local`;
    const randomPassword =
      Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);

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
  async findMany<T = any>(
    collection: string,
    params?: {
      where?: any;
      limit?: number;
      page?: number;
      sort?: string;
      depth?: number;
    }
  ) {
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
