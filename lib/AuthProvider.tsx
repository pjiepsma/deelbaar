import { Session, User } from '@supabase/supabase-js'; // Corrected import types
import { useRouter, useSegments } from 'expo-router';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { useSystem } from '~/lib/powersync/PowerSync';

export const AuthContext = createContext<{
  session: Session | null;
  user: User | null;
  isAnonymous: boolean;
  signIn: ({ session, user }: { session: Session | null; user: User | null }) => void;
  signOut: () => void;
}>({
  session: null,
  user: null,
  isAnonymous: false,
  signIn: () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initialize loading state
  const [initialized, setInitialized] = useState<boolean>(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  const { connector } = useSystem();
  const system = useSystem();

  useEffect(() => {
    // Asynchronous initialization of the system
    const initSystem = async () => {
      await system.init(); // Assuming `init()` is asynchronous and returns a promise
    };
    console.log('init');

    initSystem().then(() => setIsLoading(false)); // Set loading to false after initialization
  }, [system]);

  useEffect(() => {
    const { data } = connector.client.auth.onAuthStateChange((event, session) => {
      setInitialized(true);
      setIsLoading(false);
      setSession(session);

      if (session && session.user) {
        setUser(session.user);
        setIsAnonymous(session.user.is_anonymous!);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [connector]);

  useEffect(() => {
    if (!initialized || isLoading) return;

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
    if (inAuthGroup && isAnonymous) {
      router.replace('/(modals)/login');
    }
  }, [session, initialized, isLoading]);

  async function signIn({ session, user }: { session: Session | null; user: User | null }) {
    setSession(session);
    setUser(user);
  }

  async function signOut() {
    setIsLoading(true); // Set loading state to true during sign-out

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
      setIsLoading(false); // Set loading state back to false after sign-out
    }
  }

  if (isLoading) {
    // Show a loading indicator while loading
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAnonymous,
        signIn,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
