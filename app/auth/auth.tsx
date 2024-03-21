import { createContext, useContext, useEffect, useState } from "react";
import { Account, Client, ID, Models } from "appwrite";
import {
  AuthContextValue,
  ProviderProps,
  SignInResponse,
  SignOutResponse,
} from "@/app/auth/interfaces";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function Provider(props: ProviderProps) {
  // TODO Add context from parenet to inject to envs

  const client = new Client();
  client
    .setEndpoint(process.env.EXPO_PUBLIC_API_URL!)
    .setProject(process.env.EXPO_PUBLIC_API_KEY!);
  const account = new Account(client);

  const [user, setAuth] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [isLoaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await account.get();
        setAuth(user);
      } catch (error) {
        setAuth(null);
      }

      setLoaded(true);
    })();
  }, []);

  const signOut = async (): Promise<SignOutResponse> => {
    try {
      const response = await account.deleteSession("current");
      return { error: undefined, data: response };
    } catch (error) {
      return { error, data: undefined };
    } finally {
      setAuth(null);
    }
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<SignInResponse> => {
    try {
      console.log(email, password);
      const response = await account.createEmailPasswordSession(
        email,
        password,
      );

      const user = await account.get();
      setAuth(user);
      return { data: user, error: undefined };
    } catch (error) {
      setAuth(null);
      return { error: error as Error, data: undefined };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
  ): Promise<SignInResponse> => {
    try {
      console.log(email, password, username);

      // create the user
      await account.create(ID.unique(), email, password, username);

      // create the session by logging in
      await account.createEmailPasswordSession(email, password);

      // get Account information for the user / TODO: Could use create User response
      const user = await account.get();
      setAuth(user);
      return { data: user, error: undefined };
    } catch (error) {
      setAuth(null);
      return { error: error as Error, data: undefined };
    }
  };

  const context: AuthContextValue = {
    signIn,
    signOut,
    signUp,
    user,
    isLoaded,
  };

  return (
    <AuthContext.Provider value={context}>
      {props.children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }

  return authContext;
};
