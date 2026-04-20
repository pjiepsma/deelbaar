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

type LoginResponse = {
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
    options: RequestInit & { suppressErrorLogging?: number[] } = {}
  ): Promise<{ data?: T; error?: any }> {
    const { suppressErrorLogging = [], ...fetchOptions } = options;

    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('[PayloadClient.request] URL:', url);
      console.log('[PayloadClient.request] Method:', fetchOptions.method || 'GET');
      console.log('[PayloadClient.request] Body:', fetchOptions.body);

      const headers: HeadersInit = {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      };

      const response = await fetch(url, {
        ...fetchOptions,
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
        // Only log error if status code is not in suppressErrorLogging array
        if (!suppressErrorLogging.includes(response.status)) {
          console.error('[PayloadClient.request] Request failed!', response.status);
        }
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

    const { data, error } = await this.request<LoginResponse>(
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
      await this.persistSession(data);
    }

    return { data, error: null };
  }

  async loginWithGoogle(idToken: string) {
    console.log('[PayloadClient] Google login request to:', `${this.baseUrl}/api/users/google`);

    const { data, error } = await this.request<LoginResponse>('/api/users/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    console.log('[PayloadClient] Google login response - data:', data, 'error:', error);

    if (error) {
      console.error('[PayloadClient] Google login error:', error);
      return { data: null, error };
    }

    if (data) {
      console.log('[PayloadClient] Google login successful, storing token');
      await this.persistSession(data);
    }

    return { data, error: null };
  }

  // Wishlist/Book requests methods - using standard Payload collection API
  async getBookWishes(): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }

      // Suppress 404 error logging since collection may not exist yet
      const { data, error } = await this.findMany('book-wishes', {
        limit: 1000,
        depth: 2, // Include user and other relations
        suppressErrorLogging: [404], // Don't log 404 errors
      });

      if (error) {
        // Handle 404 gracefully (collection doesn't exist yet) - silently return empty array
        if (error.status === 404) {
          return [];
        }
        // Only log non-404 errors
        console.warn('[PayloadClient.getBookWishes] Error fetching book wishes:', error);
        return [];
      }

      return data?.docs || [];
    } catch {
      // Silently handle errors - collection may not exist
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
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await this.create('book-wishes', wishData);

      if (error) {
        throw new Error(error.message || 'Failed to create book wish');
      }

      return data;
    } catch (error: any) {
      console.warn('[PayloadClient.createBookWish] Error:', error);
      throw error;
    }
  }

  async deleteBookWish(wishId: string): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const { error } = await this.delete('book-wishes', wishId);

      if (error) {
        throw new Error(error.message || 'Failed to delete book wish');
      }
    } catch (error: any) {
      console.warn('[PayloadClient.deleteBookWish] Error:', error);
      throw error;
    }
  }

  async getMatchingWishes(bookData: {
    title: string;
    author?: string;
    isbn?: string;
  }): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }

      // Build where clause for matching
      const where: any = {};

      if (bookData.title) {
        where.title = { contains: bookData.title };
      }

      if (bookData.author) {
        where.author = { contains: bookData.author };
      }

      if (bookData.isbn) {
        where.isbn = { equals: bookData.isbn };
      }

      // Suppress 404 error logging since collection may not exist yet
      const { data, error } = await this.findMany('book-wishes', {
        where,
        limit: 100,
        depth: 2, // Include user and other relations
        suppressErrorLogging: [404], // Don't log 404 errors
      });

      if (error) {
        // Handle 404 gracefully (collection doesn't exist yet) - silently return empty array
        if (error.status === 404) {
          return [];
        }
        // Only log non-404 errors
        console.warn('[PayloadClient.getMatchingWishes] Error:', error);
        return [];
      }

      return data?.docs || [];
    } catch {
      // Silently handle errors - collection may not exist
      return [];
    }
  }

  // Product offerings methods (for farm stands, repair cafes, etc.) - using standard Payload collection API
  async getProductOfferings(listingId?: string): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }

      const where = listingId ? { listing: { equals: listingId } } : undefined;

      const { data, error } = await this.findMany('product-offerings', {
        where,
        limit: 1000,
        depth: 2, // Include listing and other relations
        suppressErrorLogging: [404], // Don't log 404 errors if collection doesn't exist
      });

      if (error) {
        if (error.status === 404) {
          return [];
        }
        console.warn('[PayloadClient.getProductOfferings] Error:', error);
        return [];
      }

      return data?.docs || [];
    } catch {
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
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await this.create('product-offerings', offeringData);

      if (error) {
        throw new Error(error.message || 'Failed to create product offering');
      }

      return data;
    } catch (error: any) {
      console.warn('[PayloadClient.createProductOffering] Error:', error);
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
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await this.update('product-offerings', offeringId, updates);

      if (error) {
        throw new Error(error.message || 'Failed to update product offering');
      }

      return data;
    } catch (error: any) {
      console.warn('[PayloadClient.updateProductOffering] Error:', error);
      throw error;
    }
  }

  async deleteProductOffering(offeringId: string): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const { error } = await this.delete('product-offerings', offeringId);

      if (error) {
        throw new Error(error.message || 'Failed to delete product offering');
      }
    } catch (error: any) {
      console.warn('[PayloadClient.deleteProductOffering] Error:', error);
      throw error;
    }
  }

  // Product favorites/following - using standard Payload collection API
  async getProductFavorites(): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }

      const { data, error } = await this.findMany('product-favorites', {
        limit: 1000,
        depth: 2, // Include offering and user relations
        suppressErrorLogging: [404], // Don't log 404 errors if collection doesn't exist
      });

      if (error) {
        if (error.status === 404) {
          return [];
        }
        console.warn('[PayloadClient.getProductFavorites] Error:', error);
        return [];
      }

      return data?.docs || [];
    } catch {
      return [];
    }
  }

  async toggleProductFavorite(offeringId: string): Promise<any> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      // Check if favorite already exists
      const { data: existing } = await this.findMany('product-favorites', {
        where: {
          offering: { equals: offeringId },
          user: { equals: this.user?.id },
        },
        limit: 1,
      });

      if (existing?.docs && existing.docs.length > 0) {
        // Delete existing favorite
        const { error } = await this.delete('product-favorites', existing.docs[0].id);
        if (error) {
          throw new Error(error.message || 'Failed to remove product favorite');
        }
        return { favorited: false };
      } else {
        // Create new favorite
        const { data, error } = await this.create('product-favorites', {
          offering: offeringId,
        });
        if (error) {
          throw new Error(error.message || 'Failed to add product favorite');
        }
        return { favorited: true, data };
      }
    } catch (error: any) {
      console.warn('[PayloadClient.toggleProductFavorite] Error:', error);
      throw error;
    }
  }

  // Report product as out of stock - using standard Payload collection API
  async reportOutOfStock(offeringId: string, reporterNote?: string): Promise<any> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      // Update the offering status to out_of_stock
      const updateData: any = {
        status: 'out_of_stock',
      };

      if (reporterNote) {
        // If there's a notes field or we need to store the reporter note
        // This might need to be adjusted based on your schema
        updateData.notes = reporterNote;
      }

      const { data, error } = await this.update('product-offerings', offeringId, updateData);

      if (error) {
        throw new Error(error.message || 'Failed to report out of stock');
      }

      return data;
    } catch (error: any) {
      console.warn('[PayloadClient.reportOutOfStock] Error:', error);
      throw error;
    }
  }

  // Tool reservations for Repair Cafés - using standard Payload collection API
  async createToolReservation(reservationData: {
    toolId: string;
    startDate: string; // ISO string
    duration: number; // in hours
    notes?: string;
  }): Promise<any> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await this.create('tool-reservations', reservationData);

      if (error) {
        throw new Error(error.message || 'Failed to create tool reservation');
      }

      return data;
    } catch (error: any) {
      console.warn('[PayloadClient.createToolReservation] Error:', error);
      throw error;
    }
  }

  async getToolReservations(toolId?: string): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }

      const where = toolId ? { tool: { equals: toolId } } : undefined;

      const { data, error } = await this.findMany('tool-reservations', {
        where,
        limit: 1000,
        depth: 2, // Include tool and user relations
        suppressErrorLogging: [404], // Don't log 404 errors if collection doesn't exist
      });

      if (error) {
        if (error.status === 404) {
          return [];
        }
        console.warn('[PayloadClient.getToolReservations] Error:', error);
        return [];
      }

      return data?.docs || [];
    } catch {
      return [];
    }
  }

  // Product offering approval system - using standard Payload collection API
  async approveProductOffering(
    offeringId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<any> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const updateData: any = {
        status: approved ? 'approved' : 'rejected',
      };

      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      const { data, error } = await this.update('product-offerings', offeringId, updateData);

      if (error) {
        throw new Error(error.message || 'Failed to approve/reject product offering');
      }

      return data;
    } catch (error: any) {
      console.warn('[PayloadClient.approveProductOffering] Error:', error);
      throw error;
    }
  }

  async getPendingProductOfferings(listingId: string): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }

      const { data, error } = await this.findMany('product-offerings', {
        where: {
          listing: { equals: listingId },
          status: { equals: 'pending' },
        },
        limit: 1000,
        depth: 2,
        suppressErrorLogging: [404],
      });

      if (error) {
        if (error.status === 404) {
          return [];
        }
        console.warn('[PayloadClient.getPendingProductOfferings] Error:', error);
        return [];
      }

      return data?.docs || [];
    } catch {
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

  async unlockSearchScope(scope: 'province' | 'country' | 'world') {
    return this.request<{ ok: boolean; searchAccess?: Record<string, boolean> }>(
      '/api/search-access/unlock',
      {
        method: 'POST',
        body: JSON.stringify({ scope }),
      }
    );
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

    // For new email verification flow, don't auto-login
    // The user needs to verify email first
    return { data, error: null };
  }

  async registerAndLogin(email: string, password: string, additionalData?: any) {
    console.log('[PayloadClient] Register and login request');

    const { data: registerData, error: registerError } = await this.register(email, password, additionalData);
    if (registerError) {
      return { data: null, error: registerError };
    }

    // Auto-login after successful registration (for legacy compatibility)
    console.log('[PayloadClient] Registration successful, auto-logging in');
    return this.login(email, password);
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

  async resendVerificationEmail() {
    console.log('[PayloadClient] Resend verification email');
    const { data, error } = await this.request('/api/users/resend-verification', {
      method: 'POST',
    });

    console.log('[PayloadClient] Resend verification email response:', { data, error });
    if (error) {
      console.error('[PayloadClient] Resend verification email error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  // Email verification methods

  async verifyEmail(token: string) {
    console.log('[PayloadClient] Verify email with token');
    const { data, error } = await this.request(`/api/users/verify/${token}`, {
      method: 'POST',
    });

    console.log('[PayloadClient] Verify email response:', { data, error });
    if (error) {
      console.error('[PayloadClient] Verify email error:', error);
      return { data: null, error };
    }

    if (data) {
      console.log('[PayloadClient] Email verification successful');
    }

    return { data, error: null };
  }

  // Password reset methods
  async forgotPassword(email: string) {
    console.log('[PayloadClient] Forgot password for email:', email);
    const { data, error } = await this.request('/api/users/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    console.log('[PayloadClient] Forgot password response:', { data, error });
    if (error) {
      console.error('[PayloadClient] Forgot password error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  async resetPassword(token: string, password: string) {
    console.log('[PayloadClient] Reset password with token');
    const { data, error } = await this.request('/api/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });

    console.log('[PayloadClient] Reset password response:', { data, error });
    if (error) {
      console.error('[PayloadClient] Reset password error:', error);
      return { data: null, error };
    }

    if (data) {
      console.log('[PayloadClient] Password reset successful, storing token');
      this.token = data.token;
      this.user = data.user;
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
    }

    return { data, error: null };
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

  private async persistSession(session: LoginResponse) {
    this.token = session.token;
    this.user = session.user;
    await AsyncStorage.setItem('auth_token', session.token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(session.user));
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
      select?: any;
      suppressErrorLogging?: number[]; // Allow suppressing error logging for specific status codes
    }
  ) {
    const { suppressErrorLogging, ...queryParams } = params || {};
    const urlParams = new URLSearchParams();
    if (queryParams.where) urlParams.append('where', JSON.stringify(queryParams.where));
    if (queryParams.limit) urlParams.append('limit', queryParams.limit.toString());
    if (queryParams.page) urlParams.append('page', queryParams.page.toString());
    if (queryParams.sort) urlParams.append('sort', queryParams.sort);
    if (queryParams.depth !== undefined) urlParams.append('depth', queryParams.depth.toString());
    if (queryParams.select) urlParams.append('select', JSON.stringify(queryParams.select));

    const query = urlParams.toString();
    return this.request<{ docs: T[]; totalDocs: number; limit: number; page: number }>(
      `/api/${collection}${query ? `?${query}` : ''}`,
      { suppressErrorLogging }
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
