import { payloadClient } from '../PayloadClient';

/** Paths are relative to runtime baseURL, which already ends with `/api`. */
const USERS_BASE_PATH = '/users';
const LOGIN_PATH = `${USERS_BASE_PATH}/login`;
const LOGOUT_PATH = `${USERS_BASE_PATH}/logout`;
const FORGOT_PASSWORD_PATH = `${USERS_BASE_PATH}/forgot-password`;
const RESET_PASSWORD_PATH = `${USERS_BASE_PATH}/reset-password`;
const GOOGLE_AUTH_PATH = `${USERS_BASE_PATH}/google`;
const USERS_ME_PATH = `${USERS_BASE_PATH}/me`;
const EMAIL_LOOKUP_PATH = `${USERS_BASE_PATH}/email-lookup`;
const VERIFY_EMAIL_CODE_PATH = `${USERS_BASE_PATH}/verify-email-code`;
const RESEND_VERIFICATION_CODE_PATH = `${USERS_BASE_PATH}/resend-verification-code`;

export type AuthUser = {
  id: number | string;
  email: string;
  name?: string | null;
  surname?: string | null;
  role?: string;
};

export type AuthResponse = {
  token?: string;
  user?: AuthUser;
};

type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
  surname?: string;
  username?: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type ForgotPasswordPayload = {
  email: string;
};

type ResetPasswordPayload = {
  token: string;
  password: string;
};

type GoogleAuthPayload = {
  idToken: string;
};

type UserPatchPayload = {
  pushToken?: string | null;
};

type EmailLookupPayload = {
  email: string;
};

type EmailLookupResponse = {
  exists: boolean;
};

type VerifyEmailCodePayload = {
  email: string;
  password: string;
  code: string;
};

type ResendVerificationCodePayload = {
  email: string;
};

function updateTokenFromAuthResponse(payload: AuthResponse): void {
  if (payload.token) {
    payloadClient.setToken(payload.token);
  }
}

export async function registerWithEmail(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await payloadClient.request<AuthResponse>(USERS_BASE_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  updateTokenFromAuthResponse(response);
  return response;
}

export async function loginWithEmail(payload: LoginPayload): Promise<AuthResponse> {
  const response = await payloadClient.request<AuthResponse>(LOGIN_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  updateTokenFromAuthResponse(response);
  return response;
}

export async function loginWithGoogleIdToken(payload: GoogleAuthPayload): Promise<AuthResponse> {
  const response = await payloadClient.request<AuthResponse>(GOOGLE_AUTH_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  updateTokenFromAuthResponse(response);
  return response;
}

export async function requestPasswordReset(payload: ForgotPasswordPayload): Promise<void> {
  await payloadClient.request(FORGOT_PASSWORD_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<AuthResponse> {
  const response = await payloadClient.request<AuthResponse>(RESET_PASSWORD_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  updateTokenFromAuthResponse(response);
  return response;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await payloadClient.request<{ user?: AuthUser | null }>(USERS_ME_PATH, {
      method: 'GET',
    });
    return response.user ?? null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await payloadClient.request(LOGOUT_PATH, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  } finally {
    payloadClient.setToken(undefined);
  }
}

export async function updateUser(userId: AuthUser['id'], payload: UserPatchPayload): Promise<AuthUser> {
  const response = await payloadClient.request<AuthUser>(`${USERS_BASE_PATH}/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return response;
}

export async function lookupEmailRegistered(payload: EmailLookupPayload): Promise<EmailLookupResponse> {
  const response = await payloadClient.request<EmailLookupResponse>(EMAIL_LOOKUP_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response;
}

export async function verifyEmailWithCode(payload: VerifyEmailCodePayload): Promise<AuthResponse> {
  const response = await payloadClient.request<AuthResponse>(VERIFY_EMAIL_CODE_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  updateTokenFromAuthResponse(response);
  return response;
}

export async function resendVerificationCode(payload: ResendVerificationCodePayload): Promise<void> {
  await payloadClient.request<{ ok?: boolean }>(RESEND_VERIFICATION_CODE_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
