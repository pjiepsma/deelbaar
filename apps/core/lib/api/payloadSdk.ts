import { PayloadSDK, PayloadSDKError } from '@payloadcms/sdk';
import type { ErrorResult } from 'payload';

import type { Config } from '~/lib/types/payload-generated';

import { getPayloadRuntimeAuthHeaders, getPayloadRuntimeBaseUrl } from './payloadRuntime';

/** Non-throwing SDK result — API failures use Payload `ErrorResult['errors']`. */
export type PayloadSdkTryError = {
  message: string;
  status?: number;
  networkError?: boolean;
  backendUnavailable?: boolean;
  errors?: ErrorResult['errors'];
};

export async function payloadSdkTry<T>(
  op: () => Promise<T>
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: PayloadSdkTryError }> {
  try {
    const data = await op();
    return { data };
  } catch (e) {
    if (e instanceof PayloadSDKError) {
      return {
        error: {
          message: e.message,
          status: e.status,
          errors: e.errors,
        },
      };
    }
    const message = e instanceof Error ? e.message : String(e);
    const m = message.toLowerCase();
    const networkish =
      m.includes('network request failed') ||
      m.includes('failed to fetch') ||
      m.includes('network error') ||
      m.includes('aborted') ||
      m.includes('timeout');
    return {
      error: {
        message,
        networkError: networkish,
        backendUnavailable: networkish,
      },
    };
  }
}

/**
 * Typed Payload REST client (`PayloadSDK` + custom `fetch` merging JWT from `payloadRuntime`).
 * Call `payloadClient.init()` first so base URL (and restored session) are set.
 */
export function getPayloadSdk(): PayloadSDK<Config> {
  const base = getPayloadRuntimeBaseUrl();
  if (!base) {
    throw new Error(
      '[getPayloadSdk] Base URL empty — call payloadClient.init(EXPO_PUBLIC_PAYLOAD_URL) first.'
    );
  }

  const baseURL = `${base}/api`;

  return new PayloadSDK<Config>({
    baseURL,
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      for (const [key, value] of Object.entries(getPayloadRuntimeAuthHeaders())) {
        headers.set(key, value);
      }
      const target: RequestInfo = typeof url === 'string' ? url : (url as Request);
      return fetch(target, { ...init, headers });
    },
  });
}

/** Collections not yet on generated `Config` — use only where CMS slugs are dynamic/legacy. */
export function getPayloadSdkLoose(): PayloadSDK<any> {
  return getPayloadSdk() as PayloadSDK<any>;
}
