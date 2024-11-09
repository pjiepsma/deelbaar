// ---- (2) ----
// Define the AuthContextValue interface
import { Models } from "react-native-appwrite";
import { ReactNode } from "react";

export interface SignInResponse {
  data: Models.User<Models.Preferences> | undefined;
  error: Error | undefined;
}

export interface SignOutResponse {
  error: any | undefined;
  data: {} | undefined;
}

export interface Authentication {
  signIn: (e: string, p: string) => Promise<SignInResponse>;
  signUp: (e: string, p: string, n: string) => Promise<SignInResponse>;
  signOut: () => Promise<SignOutResponse>;
  signInGoogle: () => Promise<SignInResponse>;
  user: Models.User<Models.Preferences> | null;
  isLoaded: boolean;
}

// Define the Provider component
export interface ProviderProps {
  children: ReactNode;
}
