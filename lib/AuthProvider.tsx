import type { AuthSession, AuthUser } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';

import { supabase } from '~/lib/powersync/SupabaseConnector';

export const AuthContext = createContext<{
  session: AuthSession | null;
  user: AuthUser | null;
  signIn: ({ session, user }: { session: AuthSession | null; user: AuthUser | null }) => void;
  signOut: () => void;
}>({
  session: null,
  user: null,
  signIn: () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function signIn({ session, user }: { session: AuthSession | null; user: AuthUser | null }) {
    console.log('signIn');
    setSession(session);
    setUser(user);
  }

  async function signOut() {
    console.log('signOut');
    const { error } = await supabase.auth.signOut();

    setSession(null);
    setUser(null);

    if (error) {
      console.error(error);
    }
  }

  async function getSession() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    if (!session) getSession();
    // if (session && !user) getUser();
  }, [session, user]);

  if (isLoading) {
    return <View />; // spinner
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signIn,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
