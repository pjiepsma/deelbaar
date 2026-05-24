import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { getCurrentUser, logout, type AuthResponse, type AuthUser } from '../lib/api/auth/authClient';
import { payloadClient } from '../lib/api/PayloadClient';
import { authConfig } from '../config/auth.config';

type ExpoSecureStoreModule = typeof import('expo-secure-store');

type ApplyAuthResponseOptions = {
  markPendingNotificationsAfterLogin?: boolean;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isBootstrapping: boolean;
  pendingNotificationsAfterLogin: boolean;
  applyAuthResponse: (response: AuthResponse, options?: ApplyAuthResponseOptions) => Promise<AuthUser | null>;
  refreshUser: () => Promise<AuthUser | null>;
  markPendingNotificationsAfterLogin: () => Promise<void>;
  clearPendingNotificationsAfterLogin: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let secureStoreLoadPromise: Promise<ExpoSecureStoreModule | null> | null = null;

async function loadSecureStoreModule(): Promise<ExpoSecureStoreModule | null> {
  if (!secureStoreLoadPromise) {
    secureStoreLoadPromise = (async () => {
      try {
        return await import('expo-secure-store');
      } catch {
        return null;
      }
    })();
  }
  return secureStoreLoadPromise;
}

async function readStoredToken(): Promise<string | null> {
  const SecureStore = await loadSecureStoreModule();
  if (!SecureStore) {
    return null;
  }
  return SecureStore.getItemAsync(authConfig.secureStorageKeys.authToken);
}

async function persistToken(token?: string): Promise<void> {
  const SecureStore = await loadSecureStoreModule();
  if (!SecureStore) {
    return;
  }
  if (token) {
    await SecureStore.setItemAsync(authConfig.secureStorageKeys.authToken, token);
    return;
  }
  await SecureStore.deleteItemAsync(authConfig.secureStorageKeys.authToken);
}

async function readPendingNotificationsFlag(): Promise<boolean> {
  const SecureStore = await loadSecureStoreModule();
  if (!SecureStore) {
    return false;
  }
  const value = await SecureStore.getItemAsync(authConfig.secureStorageKeys.pendingNotificationsAfterLogin);
  return value === '1';
}

async function persistPendingNotificationsFlag(value: boolean): Promise<void> {
  const SecureStore = await loadSecureStoreModule();
  if (!SecureStore) {
    return;
  }
  if (value) {
    await SecureStore.setItemAsync(authConfig.secureStorageKeys.pendingNotificationsAfterLogin, '1');
    return;
  }
  await SecureStore.deleteItemAsync(authConfig.secureStorageKeys.pendingNotificationsAfterLogin);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [pendingNotificationsAfterLogin, setPendingNotificationsAfterLogin] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [storedToken, storedPendingFlag] = await Promise.all([
          readStoredToken(),
          readPendingNotificationsFlag(),
        ]);
        setPendingNotificationsAfterLogin(storedPendingFlag);
        payloadClient.setToken(storedToken ?? undefined);
        if (!storedToken) {
          setUser(null);
          return;
        }
        const me = await getCurrentUser();
        if (!me) {
          await persistToken(undefined);
          payloadClient.setToken(undefined);
          setUser(null);
          return;
        }
        setUser(me);
      } catch {
        setUser(null);
        payloadClient.setToken(undefined);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const me = await getCurrentUser();
    setUser(me);
    return me;
  }, []);

  const markPendingNotificationsAfterLogin = useCallback(async (): Promise<void> => {
    setPendingNotificationsAfterLogin(true);
    await persistPendingNotificationsFlag(true);
  }, []);

  const clearPendingNotificationsAfterLogin = useCallback(async (): Promise<void> => {
    setPendingNotificationsAfterLogin(false);
    await persistPendingNotificationsFlag(false);
  }, []);

  const applyAuthResponse = useCallback(
    async (
      response: AuthResponse,
      options?: ApplyAuthResponseOptions,
    ): Promise<AuthUser | null> => {
      if (response.token) {
        await persistToken(response.token);
      }
      if (options?.markPendingNotificationsAfterLogin) {
        await markPendingNotificationsAfterLogin();
      }
      if (response.user) {
        setUser(response.user);
        return response.user;
      }
      const me = await getCurrentUser();
      setUser(me);
      return me;
    },
    [markPendingNotificationsAfterLogin],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await logout();
    } finally {
      setUser(null);
      payloadClient.setToken(undefined);
      await Promise.all([persistToken(undefined), persistPendingNotificationsFlag(false)]);
      setPendingNotificationsAfterLogin(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      pendingNotificationsAfterLogin,
      applyAuthResponse,
      refreshUser,
      markPendingNotificationsAfterLogin,
      clearPendingNotificationsAfterLogin,
      signOut,
    }),
    [
      user,
      isBootstrapping,
      pendingNotificationsAfterLogin,
      applyAuthResponse,
      refreshUser,
      markPendingNotificationsAfterLogin,
      clearPendingNotificationsAfterLogin,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
