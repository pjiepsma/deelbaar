import type { User } from '~/lib/types/payload-generated';

/** Process-wide Payload REST base URL (no trailing slash) and JWT session. */
let baseUrl = '';
let token: string | null = null;
let user: User | null = null;

export function setPayloadRuntimeBaseUrl(url: string): void {
  baseUrl = url.replace(/\/$/, '');
}

export function getPayloadRuntimeBaseUrl(): string {
  return baseUrl;
}

export function setPayloadRuntimeAuth(nextToken: string | null, nextUser: User | null): void {
  token = nextToken;
  user = nextUser;
}

export function clearPayloadRuntimeAuth(): void {
  token = null;
  user = null;
}

export function getPayloadRuntimeToken(): string | null {
  return token;
}

export function getPayloadRuntimeUser(): User | null {
  return user;
}

export function getPayloadRuntimeAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `JWT ${token}`;
  }
  return headers;
}
