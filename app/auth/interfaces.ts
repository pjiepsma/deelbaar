// ---- (2) ----
// Define the AuthContextValue interface
import { Models } from "appwrite";
import { ReactNode } from "react";

export interface SignInResponse {
  data: Models.User<Models.Preferences> | undefined;
  error: Error | undefined;
}

export interface SignOutResponse {
  error: any | undefined;
  data: {} | undefined;
}

export interface AuthContextValue {
  signIn: (e: string, p: string) => Promise<SignInResponse>;
  signUp: (e: string, p: string, n: string) => Promise<SignInResponse>;
  signOut: () => Promise<SignOutResponse>;
  user: Models.User<Models.Preferences> | null;
  isLoaded: boolean;
}

// Define the Provider component
export interface ProviderProps {
  children: ReactNode;
}
