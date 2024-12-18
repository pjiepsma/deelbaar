import { Session, User } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { GetFavoriteListings, SelectProfile } from './powersync/Queries';

import { useSystem } from '~/lib/powersync/PowerSync';

export const AuthContext = createContext<{
  session: Session | null;
  user: User | null;
  profile: any | null;
  signIn: ({ session, user }: { session: Session | null; user: User | null }) => void;
  signOut: () => void;
}>({
  session: null,
  user: null,
  profile: null,
  signIn: () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [error, setError] = useState([]);
  const segments = useSegments();
  const router = useRouter();

  const { connector, powersync, attachmentQueue } = useSystem();
  const system = useSystem();

  useEffect(() => {
    if (isLoading || isSigningOut) return;

    if (!session) {
      const signInAnonymously = async () => {
        const { error } = await connector.client.auth.signInAnonymously();
        if (error) {
          console.error('Anonymous sign-in error:', error.message);
        }
      };

      signInAnonymously();
    }
  }, [session, isLoading, segments, router, user, connector]);

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await connector.client.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error.message);
      } else {
        setSession(data.session);
      }
    };

    fetchSession();

    const { data: authListener } = connector.client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && session.user && !session.user.is_anonymous) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [connector]);

  useEffect(() => {
    if (user) {
      powersync
        .get(SelectProfile, [user.id])
        .then((profile: any) => {
          const uri = attachmentQueue?.getLocalUri(profile.local_uri);
          setProfile({ ...profile, local_uri: uri });
        })
        .catch((error) => setError(error.message));
    }
  }, [user]);

  useEffect(() => {
    const initSystem = async () => {
      await system.init();
      setIsLoading(false);
    };

    initSystem();
  }, [system]);

  async function signIn({ session, user }: { session: Session | null; user: User | null }) {
    setSession(session);
    setUser(user);
  }

  async function signOut() {
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
      setProfile(null);
      setIsLoading(false);
      setIsSigningOut(false);
    }
  }

  // if (isLoading) { TODO
  //   return <ActivityIndicator size="large" color="#0000ff" />;
  // }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        signIn,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
