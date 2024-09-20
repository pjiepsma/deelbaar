import { Session, User } from '@supabase/supabase-js'; // Corrected import types
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
  const [isLoading, setIsLoading] = useState(true); // Initialize loading state
  const [initialized, setInitialized] = useState<boolean>(false);

  const segments = useSegments();
  const router = useRouter();

  const { connector } = useSystem();
  const system = useSystem();

  useEffect(() => {
    // Asynchronous initialization of the system
    const initSystem = async () => {
      await system.init(); // Assuming `init()` is asynchronous and returns a promise
    };

    initSystem().then(() => setIsLoading(false)); // Set loading to false after initialization
  }, [system]);

  useEffect(() => {
    // Listen for changes to authentication state
    const { data } = connector.client.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setInitialized(true); // Mark initialization as complete
      setIsLoading(false); // Set loading state to false once auth state is checked
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    // Cleanup subscription on component unmount
    return () => {
      data.subscription.unsubscribe();
    };
  }, [connector]);

  useEffect(() => {
    if (!initialized || isLoading) return; // Avoid routing until initialization is complete

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)/');
    } else if (!session && !inAuthGroup) {
      router.replace('/(modals)/login');
    }
  }, [session, initialized]);

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
        signIn,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
