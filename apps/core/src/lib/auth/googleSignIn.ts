type GoogleAuthScopesShape = {
  EMAIL?: string;
  PROFILE?: string;
};

type GoogleAuthResponse = {
  type?: 'success' | 'cancelled' | 'configuration_error';
  message?: string;
  errorCode?: string;
  data?: {
    idToken?: string;
  };
};

type GoogleAuthApi = {
  configure: (config: {
    webClientId?: string;
    androidClientId?: string;
    iosClientId?: string;
    credentialManagerMode?: 'silent' | 'interactive' | 'auto';
    scopes?: string[];
  }) => Promise<void>;
  signIn: () => Promise<GoogleAuthResponse>;
};

type GoogleAuthModuleShape = {
  GoogleAuth?: GoogleAuthApi;
  GoogleAuthScopes?: GoogleAuthScopesShape;
};

/** Matches react-native-google-auth README: androidClientId = Web OAuth client ID on Android. */
export type GoogleSignInClientIds = {
  iosClientId?: string;
  androidClientId?: string;
};

let didConfigure = false;

function getGoogleAuthModule(): GoogleAuthModuleShape {
  try {
    return require('react-native-google-auth') as GoogleAuthModuleShape;
  } catch {
    throw new Error('react-native-google-auth is not available in this build');
  }
}

function assertGoogleSignInResponse(response: GoogleAuthResponse | undefined): string {
  if (response?.type === 'configuration_error') {
    throw new Error(
      response.message ??
        'Google Sign-In is misconfigured. Check Web + Android OAuth clients and SHA-1 in Google Cloud Console.',
    );
  }

  if (response?.type === 'cancelled') {
    const detail = response.message ?? '';
    if (detail.includes('reauth failed') || detail.includes('[16]')) {
      throw new Error(
        'Google could not verify this app. In Google Cloud Console: Android OAuth client with package com.deelbaar.app + debug SHA-1, and your Google account under OAuth consent screen → Test users.',
      );
    }
    throw new Error(
      detail ||
        'Google Sign-In was cancelled. If you picked an account, check Android OAuth SHA-1 and test users on the consent screen.',
    );
  }

  const idToken = response?.data?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an idToken');
  }

  return idToken;
}

export async function requestGoogleIdToken(clientIds: GoogleSignInClientIds): Promise<string> {
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
      iosClientId: clientIds.iosClientId,
      androidClientId: clientIds.androidClientId,
      credentialManagerMode: 'interactive',
      scopes: [emailScope, profileScope],
    });
    didConfigure = true;
  }

  const response = await GoogleAuth.signIn();
  return assertGoogleSignInResponse(response);
}
