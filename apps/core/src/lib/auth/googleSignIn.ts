type GoogleAuthScopesShape = {
  EMAIL?: string;
  PROFILE?: string;
};

type GoogleAuthResponse = {
  type?: 'success' | 'cancelled';
  data?: {
    idToken?: string;
  };
};

type GoogleAuthApi = {
  configure: (config: {
    webClientId?: string;
    androidClientId?: string;
    iosClientId?: string;
    scopes?: string[];
  }) => Promise<void>;
  signIn: () => Promise<GoogleAuthResponse>;
};

type GoogleAuthModuleShape = {
  GoogleAuth?: GoogleAuthApi;
  GoogleAuthScopes?: GoogleAuthScopesShape;
};

let didConfigure = false;

function getGoogleAuthModule(): GoogleAuthModuleShape {
  try {
    return require('react-native-google-auth') as GoogleAuthModuleShape;
  } catch {
    throw new Error('react-native-google-auth is not available in this build');
  }
}

export async function requestGoogleIdToken(webClientId: string): Promise<string> {
  const { GoogleAuth, GoogleAuthScopes } = getGoogleAuthModule();

  if (!GoogleAuth?.configure || !GoogleAuth?.signIn) {
    throw new Error('GoogleAuth API is unavailable in react-native-google-auth');
  }

  if (!didConfigure) {
    if (!GoogleAuthScopes) {
      throw new Error('react-native-google-auth did not export GoogleAuthScopes');
    }
    const emailScope = GoogleAuthScopes.EMAIL;
    const profileScope = GoogleAuthScopes.PROFILE;
    if (!emailScope || !profileScope) {
      throw new Error(
        'react-native-google-auth must expose GoogleAuthScopes.EMAIL and GoogleAuthScopes.PROFILE',
      );
    }

    await GoogleAuth.configure({
      androidClientId: webClientId,
      webClientId,
      scopes: [emailScope, profileScope],
    });
    didConfigure = true;
  }

  const response = await GoogleAuth.signIn();
  if (response?.type === 'cancelled') {
    throw new Error('Google sign-in was cancelled');
  }

  const idToken = response?.data?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an idToken');
  }

  return idToken;
}
