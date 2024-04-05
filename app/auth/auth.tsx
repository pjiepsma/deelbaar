import { createContext, useContext, useEffect, useState } from "react";
import { ID, Models, OAuthProvider } from "appwrite";
import {
  Authentication,
  ProviderProps,
  SignInResponse,
  SignOutResponse,
} from "@/interfaces/authentication";
import { appwrite } from "@/app/auth/appwrite-service";

const AuthContext = createContext<Authentication | undefined>(undefined);

export function Provider(props: ProviderProps) {
  const [user, setAuth] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [isLoaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await appwrite.account.get();
        setAuth(user);
      } catch (error) {
        setAuth(null);
      }

      setLoaded(true);
    })();
  }, []);

  const signOut = async (): Promise<SignOutResponse> => {
    try {
      const response = await appwrite.account.deleteSession("current");
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
      const response = await appwrite.account.createEmailPasswordSession(
        email,
        password,
      );

      const user = await appwrite.account.get();
      setAuth(user);
      return { data: user, error: undefined };
    } catch (error) {
      setAuth(null);
      return { error: error as Error, data: undefined };
    }
  };

  const signInGoogle = async (): Promise<SignInResponse> => {
    try {
      const uri = appwrite.account.createOAuth2Session(OAuthProvider.Google);
      console.log(uri);
      const user = await appwrite.account.get();
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
      await appwrite.account.create(ID.unique(), email, password, username);

      // create the session by logging in
      await appwrite.account.createEmailPasswordSession(email, password);

      // get Account information for the user / TODO: Could use create User response
      const user = await appwrite.account.get();
      setAuth(user);
      return { data: user, error: undefined };
    } catch (error) {
      setAuth(null);
      return { error: error as Error, data: undefined };
    }
  };

  const context: Authentication = {
    signIn,
    signOut,
    signUp,
    signInGoogle,
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
