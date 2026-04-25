import { getPayloadRuntime, initPayloadRuntime, setPayloadRuntimeToken } from './payloadRuntime';
import { getPayloadSdk } from './payloadSdk';

const AUTHORIZATION_HEADER = 'Authorization';
const CONTENT_TYPE_HEADER = 'Content-Type';
const JSON_CONTENT_TYPE = 'application/json';
const JWT_PREFIX = 'JWT ';

type PayloadClientInitOptions = {
  serverURL: string;
  token?: string;
};

function toHeadersObject(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

function buildRequestURL(path: string): string {
  const { baseURL } = getPayloadRuntime();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseURL}${normalizedPath}`;
}

function getAuthHeader(token?: string): Record<string, string> | undefined {
  if (!token) {
    return undefined;
  }

  return {
    [AUTHORIZATION_HEADER]: `${JWT_PREFIX}${token}`,
  };
}

export class PayloadClient {
  init(options: PayloadClientInitOptions): void {
    initPayloadRuntime(options.serverURL, options.token);
  }

  setToken(token?: string): void {
    setPayloadRuntimeToken(token);
  }

  getSdk() {
    return getPayloadSdk();
  }

  async request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
    const runtime = getPayloadRuntime();
    const method = (init?.method ?? 'GET').toUpperCase();
    const shouldSetJsonContentType =
      method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';

    const mergedHeaders: Record<string, string> = {
      ...toHeadersObject(init?.headers),
      ...getAuthHeader(runtime.token),
    };

    if (shouldSetJsonContentType) {
      mergedHeaders[CONTENT_TYPE_HEADER] = JSON_CONTENT_TYPE;
    }

    const response = await fetch(buildRequestURL(path), {
      ...init,
      headers: mergedHeaders,
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`Payload request failed (${response.status}): ${bodyText}`);
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }
}

export const payloadClient = new PayloadClient();
