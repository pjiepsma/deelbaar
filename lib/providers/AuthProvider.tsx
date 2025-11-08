import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { payloadClient, PayloadUser } from '../api/PayloadClient';
import { syncManager } from '../storage/SyncManager';
import { AppConfig } from '../config/AppConfig';

export const AuthContext = createContext<{
  user: PayloadUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signInAnonymously: () => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}>({
  user: null,
  token: null,
  isLoading: true,
  signIn: async () => ({}),
  signInAnonymously: async () => ({}),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PayloadUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      // Initialize Payload client
      await payloadClient.init(AppConfig.PAYLOAD_URL);

      const currentToken = payloadClient.getToken();
      const currentUser = payloadClient.getUser();

      if (currentToken && currentUser) {
        setToken(currentToken);
        setUser(currentUser);

        await syncManager.init();
      }
      // No automatic anonymous login - users must sign in explicitly
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('⭐⭐⭐ [AuthProvider v5.0] signIn CALLED - email:', email);
    try {
      console.log('⭐ [AuthProvider] Calling payloadClient.login');
      const { data, error } = await payloadClient.login(email, password);
      console.log('⭐ [AuthProvider] Login response - data:', data, 'error:', error);

      if (error) {
        console.error('[AuthProvider] Login error:', error);
        return { error };
      }

      if (!data) {
        console.error('[AuthProvider] No data returned from login');
        return { error: { message: 'Login failed - no data returned' } };
      }

      console.log('[AuthProvider] Login successful, setting user and token');
      setToken(data.token);
      setUser(data.user);

      await syncManager.init();

      return {};
    } catch (error: any) {
      console.error('[AuthProvider] Login exception:', error);
      return { error: { message: error.message || 'Login failed' } };
    }
  };

  const signInAnonymously = async () => {
    try {
      const { data, error } = await payloadClient.loginAnonymously();

      if (error) {
        console.error('Anonymous login error:', error);
        return { error };
      }

      if (data) {
        setToken(data.token);
        setUser(data.user);

        await syncManager.init();
      }

      return {};
    } catch (error: any) {
      console.error('Anonymous login exception:', error);
      return { error: { message: error.message || 'Anonymous login failed' } };
    }
  };

  const signOut = async () => {
    try {
      await syncManager.reset();

      // Logout from Payload
      await payloadClient.logout();

      setToken(null);
      setUser(null);

      // Local SQLite cache remains for offline-first functionality
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        signIn,
        signInAnonymously,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
