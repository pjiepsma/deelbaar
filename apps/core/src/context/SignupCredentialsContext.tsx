import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

export type SignupCredentials = {
  email: string;
  password: string;
};

type SignupCredentialsContextValue = {
  credentials: SignupCredentials | null;
  setSignupCredentials: (next: SignupCredentials | null) => void;
};

const SignupCredentialsContext = createContext<SignupCredentialsContextValue | null>(null);

export function SignupCredentialsProvider({ children }: PropsWithChildren) {
  const [credentials, setSignupCredentials] = useState<SignupCredentials | null>(null);

  const value = useMemo<SignupCredentialsContextValue>(
    () => ({
      credentials,
      setSignupCredentials,
    }),
    [credentials],
  );

  return <SignupCredentialsContext.Provider value={value}>{children}</SignupCredentialsContext.Provider>;
}

export function useSignupCredentials(): SignupCredentialsContextValue {
  const ctx = useContext(SignupCredentialsContext);
  if (!ctx) {
    throw new Error('useSignupCredentials must be used within SignupCredentialsProvider');
  }
  return ctx;
}

export function useClearSignupCredentials(): () => void {
  const { setSignupCredentials } = useSignupCredentials();
  return useCallback(() => {
    setSignupCredentials(null);
  }, [setSignupCredentials]);
}
