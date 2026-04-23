import AsyncStorage from '@react-native-async-storage/async-storage';
import { PayloadSDKError } from '@payloadcms/sdk';

import type { User } from '~/lib/types/payload-generated';
import type {
  CreateStripePaymentParams,
  StripeConnectResponse,
  StripeDisconnectResponse,
  StripePaymentIntentResponse,
  StripeStatusResponse,
} from '~/lib/types/stripe';

import { getPayloadSdkLoose } from './payloadSdk';
import {
  clearPayloadRuntimeAuth,
  getPayloadRuntimeAuthHeaders,
  getPayloadRuntimeBaseUrl,
  getPayloadRuntimeToken,
  getPayloadRuntimeUser,
  setPayloadRuntimeAuth,
  setPayloadRuntimeBaseUrl,
} from './payloadRuntime';

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

/** Log once when fetch fails before any HTTP response (offline, wrong LAN, CMS down, bad URL). */
function logBackendUnreachable(fullUrl: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.toLowerCase();
  let hint =
    'No HTTP response — phone may be offline, not on the same network as the CMS host, CMS not running, or EXPO_PUBLIC_PAYLOAD_URL wrong for this device.';
  if (m.includes('network request failed')) {
    hint =
      'React Native "Network request failed" — host unreachable from this device (common: CMS on LAN IP while phone is on cellular, or dev server stopped).';
  } else if (m.includes('aborted') || m.includes('timeout')) {
    hint = 'Request timed out or was aborted — server may be down or network unstable.';
  }
  console.warn(`[PayloadClient] BACKEND UNAVAILABLE\n  ${hint}\n  URL: ${fullUrl}\n  Error: ${msg}`);
}

class PayloadAPIClient {
  async init(baseUrl?: string) {
    if (baseUrl) {
      setPayloadRuntimeBaseUrl(baseUrl);
      console.log('[PayloadClient.init] Base URL set to:', getPayloadRuntimeBaseUrl());
    } else {
      console.warn('[PayloadClient.init] No base URL provided!');
    }

    const storedToken = await AsyncStorage.getItem('auth_token');
    const storedUser = await AsyncStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setPayloadRuntimeAuth(storedToken, JSON.parse(storedUser));
    }
  }

  getBaseUrl() {
    return getPayloadRuntimeBaseUrl();
  }

  getAuthHeaders(): Record<string, string> {
    return getPayloadRuntimeAuthHeaders();
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit & { suppressErrorLogging?: number[] } = {}
  ): Promise<{ data?: T; error?: any }> {
    const { suppressErrorLogging = [], ...fetchOptions } = options;
    const fullUrl = `${getPayloadRuntimeBaseUrl()}${endpoint}`;

    if (!getPayloadRuntimeBaseUrl()?.trim()) {
      console.warn('[PayloadClient.request] Base URL is empty — set EXPO_PUBLIC_PAYLOAD_URL before calling the API.');
    }

    try {
      console.log('[PayloadClient.request] URL:', fullUrl);
      console.log('[PayloadClient.request] Method:', fetchOptions.method || 'GET');
      console.log('[PayloadClient.request] Body:', fetchOptions.body);

      const headers: HeadersInit = {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      };

      const response = await fetch(fullUrl, {
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

      const preview =
        typeof data === 'string' ? data.slice(0, 200) : JSON.stringify(data).slice(0, 200);
      console.log('[PayloadClient.request] Response data (preview):', preview);

      if (!response.ok) {
        // Only log error if status code is not in suppressErrorLogging array
        if (!suppressErrorLogging.includes(response.status)) {
          console.error(
            `[PayloadClient.request] HTTP error ${response.status} for ${fullUrl}`,
            typeof data === 'object' ? data : preview
          );
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
    } catch (error: unknown) {
      logBackendUnreachable(fullUrl, error);
      const message = error instanceof Error ? error.message : 'Network error';
      return {
        error: {
          message,
          networkError: true,
          backendUnavailable: true,
        },
      };
    }
  }

  // Authentication
  async login(email: string, password: string) {
    console.log('[PayloadClient] Login request to:', `${getPayloadRuntimeBaseUrl()}/api/users/login`);
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
    console.log('[PayloadClient] Google login request to:', `${getPayloadRuntimeBaseUrl()}/api/users/google`);

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

  private sdkLoose() {
    return getPayloadSdkLoose();
  }

  private async sdkFindDocs404Empty(opts: {
    collection: string;
    where?: unknown;
    limit?: number;
    depth?: number;
    sort?: string;
    page?: number;
  }): Promise<any[]> {
    try {
      const r = await this.sdkLoose().find(opts as any);
      return r.docs ?? [];
    } catch (e) {
      if (e instanceof PayloadSDKError && e.status === 404) {
        return [];
      }
      console.warn('[PayloadClient] collection find failed', e);
      return [];
    }
  }

  // Wishlist / book flows (collection slugs may not be in generated Config yet)
  async getBookWishes(): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }
      return this.sdkFindDocs404Empty({
        collection: 'book-wishes',
        limit: 1000,
        depth: 2,
      });
    } catch {
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
      radius: number;
    };
  }): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    try {
      return await this.sdkLoose().create({
        collection: 'book-wishes',
        data: wishData,
      });
    } catch (e: any) {
      console.warn('[PayloadClient.createBookWish] Error:', e);
      throw e instanceof PayloadSDKError ? new Error(e.message || 'Failed to create book wish') : e;
    }
  }

  async deleteBookWish(wishId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    try {
      await this.sdkLoose().delete({ collection: 'book-wishes', id: wishId });
    } catch (e: any) {
      console.warn('[PayloadClient.deleteBookWish] Error:', e);
      throw e instanceof PayloadSDKError ? new Error(e.message || 'Failed to delete book wish') : e;
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
      const where: Record<string, unknown> = {};
      if (bookData.title) {
        where.title = { contains: bookData.title };
      }
      if (bookData.author) {
        where.author = { contains: bookData.author };
      }
      if (bookData.isbn) {
        where.isbn = { equals: bookData.isbn };
      }
      return this.sdkFindDocs404Empty({
        collection: 'book-wishes',
        where,
        limit: 100,
        depth: 2,
      });
    } catch {
      return [];
    }
  }

  async getProductOfferings(listingId?: string): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }
      const where = listingId ? { listing: { equals: listingId } } : undefined;
      return this.sdkFindDocs404Empty({
        collection: 'product-offerings',
        where,
        limit: 1000,
        depth: 2,
      });
    } catch {
      return [];
    }
  }

  async createProductOffering(offeringData: {
    listingId: string;
    productName: string;
    description?: string;
    quantity?: number;
    unit?: string;
    price?: number;
    availableUntil?: string;
    category?: string;
    usageInstructions?: string;
    photos?: string[];
  }): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    try {
      return await this.sdkLoose().create({
        collection: 'product-offerings',
        data: offeringData,
      });
    } catch (e: any) {
      console.warn('[PayloadClient.createProductOffering] Error:', e);
      throw e instanceof PayloadSDKError ? new Error(e.message || 'Failed to create product offering') : e;
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
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    try {
      return await this.sdkLoose().update({
        collection: 'product-offerings',
        id: offeringId,
        data: updates,
      });
    } catch (e: any) {
      console.warn('[PayloadClient.updateProductOffering] Error:', e);
      throw e instanceof PayloadSDKError ? new Error(e.message || 'Failed to update product offering') : e;
    }
  }

  async deleteProductOffering(offeringId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    try {
      await this.sdkLoose().delete({ collection: 'product-offerings', id: offeringId });
    } catch (e: any) {
      console.warn('[PayloadClient.deleteProductOffering] Error:', e);
      throw e instanceof PayloadSDKError ? new Error(e.message || 'Failed to delete product offering') : e;
    }
  }

  async getProductFavorites(): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }
      return this.sdkFindDocs404Empty({
        collection: 'product-favorites',
        limit: 1000,
        depth: 2,
      });
    } catch {
      return [];
    }
  }

  async toggleProductFavorite(offeringId: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    try {
      const uid = getPayloadRuntimeUser()?.id;
      const existing = await this.sdkLoose().find({
        collection: 'product-favorites',
        where: {
          offering: { equals: offeringId },
          user: { equals: uid },
        },
        limit: 1,
      });

      if (existing.docs?.length > 0) {
        await this.sdkLoose().delete({
          collection: 'product-favorites',
          id: existing.docs[0].id,
        });
        return { favorited: false };
      }

      const data = await this.sdkLoose().create({
        collection: 'product-favorites',
        data: { offering: offeringId },
      });
      return { favorited: true, data };
    } catch (e: any) {
      console.warn('[PayloadClient.toggleProductFavorite] Error:', e);
      throw e;
    }
  }

  async reportOutOfStock(offeringId: string, reporterNote?: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    const updateData: Record<string, unknown> = {
      status: 'out_of_stock',
    };
    if (reporterNote) {
      updateData.notes = reporterNote;
    }
    try {
      return await this.sdkLoose().update({
        collection: 'product-offerings',
        id: offeringId,
        data: updateData,
      });
    } catch (e: any) {
      console.warn('[PayloadClient.reportOutOfStock] Error:', e);
      throw e instanceof PayloadSDKError ? new Error(e.message || 'Failed to report out of stock') : e;
    }
  }

  async createToolReservation(reservationData: {
    toolId: string;
    startDate: string;
    duration: number;
    notes?: string;
  }): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    try {
      return await this.sdkLoose().create({
        collection: 'tool-reservations',
        data: reservationData,
      });
    } catch (e: any) {
      console.warn('[PayloadClient.createToolReservation] Error:', e);
      throw e instanceof PayloadSDKError ? new Error(e.message || 'Failed to create tool reservation') : e;
    }
  }

  async getToolReservations(toolId?: string): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }
      const where = toolId ? { tool: { equals: toolId } } : undefined;
      return this.sdkFindDocs404Empty({
        collection: 'tool-reservations',
        where,
        limit: 1000,
        depth: 2,
      });
    } catch {
      return [];
    }
  }

  async approveProductOffering(
    offeringId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    const updateData: Record<string, unknown> = {
      status: approved ? 'approved' : 'rejected',
    };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    try {
      return await this.sdkLoose().update({
        collection: 'product-offerings',
        id: offeringId,
        data: updateData,
      });
    } catch (e: any) {
      console.warn('[PayloadClient.approveProductOffering] Error:', e);
      throw e instanceof PayloadSDKError
        ? new Error(e.message || 'Failed to approve/reject product offering')
        : e;
    }
  }

  async getPendingProductOfferings(listingId: string): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        return [];
      }
      return this.sdkFindDocs404Empty({
        collection: 'product-offerings',
        where: {
          listing: { equals: listingId },
          status: { equals: 'pending' },
        },
        limit: 1000,
        depth: 2,
      });
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
    console.log('[PayloadClient] Register request to:', `${getPayloadRuntimeBaseUrl()}/api/users`);
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
    clearPayloadRuntimeAuth();
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
      setPayloadRuntimeAuth(data.token, data.user);
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
    }

    return { data, error: null };
  }

  async me() {
    return this.request<PayloadUser>('/api/users/me');
  }

  getToken() {
    return getPayloadRuntimeToken();
  }

  getUser() {
    return getPayloadRuntimeUser();
  }

  private async persistSession(session: LoginResponse) {
    setPayloadRuntimeAuth(session.token, session.user);
    await AsyncStorage.setItem('auth_token', session.token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(session.user));
  }

  isAuthenticated() {
    return !!getPayloadRuntimeToken();
  }

  // File upload
  async uploadFile(file: any, alt: string = 'Uploaded file') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', alt);

    try {
      const headers: HeadersInit = {};
      const t = getPayloadRuntimeToken();
      if (t) {
        headers['Authorization'] = `JWT ${t}`;
      }

      const response = await fetch(`${getPayloadRuntimeBaseUrl()}/api/media`, {
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
    return `${getPayloadRuntimeBaseUrl()}/api/media/file/${mediaId}`;
  }
}

export const payloadClient = new PayloadAPIClient();
