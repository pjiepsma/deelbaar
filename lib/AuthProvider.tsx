import { Session, User } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { useSystem } from '~/lib/powersync/PowerSync';

export const AuthContext = createContext<{
  session: Session | null;
  user: User | null;
  signIn: ({ session, user }: { session: Session | null; user: User | null }) => void;
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  const segments = useSegments();
  const router = useRouter();

  const { connector } = useSystem();
  const system = useSystem();

  useEffect(() => {
    const initSystem = async () => {
      await system.init();
    };

    initSystem().then(() => setIsLoading(false));
  }, [system]);

  useEffect(() => {
    const { data } = connector.client.auth.onAuthStateChange((event, session) => {
      setInitialized(true);
      setIsLoading(false);
      setSession(session);

      if (session && session.user && !session.user.is_anonymous) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [connector]);

  useEffect(() => {
    if (!initialized || isLoading || isSigningOut) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && initialized) {
      const signInAnonymously = async () => {
        const { error } = await connector.client.auth.signInAnonymously();
        if (error) {
          console.error('Anonymous sign-in error:', error.message);
        }
      };

      signInAnonymously();
    }
    if (inAuthGroup && !user) {
      router.replace('/(modals)/login');
    }
  }, [session, initialized, isLoading, isSigningOut]);

  async function signIn({ session, user }: { session: Session | null; user: User | null }) {
    console.log('Signing in with session and user', session, user);
    setSession(session);
    setUser(user);
  }

  async function signOut() {
    // setIsLoading(true);
    setIsSigningOut(true);

    try {
      const { error } = await connector.client.auth.signOut();
      setSession(null);
      setUser(null);

      if (error) {
        console.error('Error during sign-out:', error.message);
      }
    } catch (e) {
      console.error('Sign-out error:', e);
    } finally {
      setIsLoading(false);
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
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
