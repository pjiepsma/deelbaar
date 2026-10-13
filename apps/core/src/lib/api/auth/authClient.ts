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

export type AuthUserNotificationSettings = {
  photoRequests?: boolean | null;
  statusUpdates?: boolean | null;
  reviews?: boolean | null;
  favorites?: boolean | null;
};

export type AuthUserSearchAccess = {
  province?: boolean | null;
  country?: boolean | null;
  world?: boolean | null;
};

export type AuthUserHomeArea = {
  city?: string | null;
  province?: string | null;
  country?: string | null;
};

export type AuthUser = {
  id: number | string;
  email: string;
  name?: string | null;
  surname?: string | null;
  role?: string;
  _verified?: boolean | null;
  notificationSettings?: AuthUserNotificationSettings | null;
  searchAccess?: AuthUserSearchAccess | null;
  homeArea?: AuthUserHomeArea | null;
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

export type UserPatchPayload = {
  pushToken?: string | null;
  pushPlatform?: 'android' | 'ios' | null;
  name?: string | null;
  surname?: string | null;
  notificationSettings?: AuthUserNotificationSettings | null;
  homeArea?: AuthUserHomeArea | null;
};

function readOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  return value;
}

function readOptionalBoolean(value: unknown): boolean | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'boolean') return undefined;
  return value;
}

function readNotificationSettings(value: unknown): AuthUserNotificationSettings | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  return {
    photoRequests: readOptionalBoolean(record.photoRequests),
    statusUpdates: readOptionalBoolean(record.statusUpdates),
    reviews: readOptionalBoolean(record.reviews),
    favorites: readOptionalBoolean(record.favorites),
  };
}

function readSearchAccess(value: unknown): AuthUserSearchAccess | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  return {
    province: readOptionalBoolean(record.province),
    country: readOptionalBoolean(record.country),
    world: readOptionalBoolean(record.world),
  };
}

function readHomeArea(value: unknown): AuthUserHomeArea | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  return {
    city: readOptionalString(record.city),
    province: readOptionalString(record.province),
    country: readOptionalString(record.country),
  };
}

function parseAuthUser(data: unknown): AuthUser | null {
  if (data === null || typeof data !== 'object') return null;
  if (!('id' in data) || (typeof data.id !== 'number' && typeof data.id !== 'string')) return null;
  if (!('email' in data) || typeof data.email !== 'string' || data.email.trim().length === 0) return null;
  const record = data as Record<string, unknown>;
  return {
    id: data.id,
    email: data.email,
    name: readOptionalString(record.name),
    surname: readOptionalString(record.surname),
    role: typeof record.role === 'string' ? record.role : undefined,
    _verified: readOptionalBoolean(record._verified),
    notificationSettings: readNotificationSettings(record.notificationSettings),
    searchAccess: readSearchAccess(record.searchAccess),
    homeArea: readHomeArea(record.homeArea),
  };
}

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
    const response = await payloadClient.request<unknown>(USERS_ME_PATH, {
      method: 'GET',
    });
    if (response === null || typeof response !== 'object' || !('user' in response)) {
      return null;
    }
    return parseAuthUser((response as { user: unknown }).user);
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
  const response = await payloadClient.request<unknown>(`${USERS_BASE_PATH}/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const parsed = parseAuthUser(response);
  if (!parsed) {
    throw new Error('User update returned an invalid user payload');
  }
  return parsed;
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
