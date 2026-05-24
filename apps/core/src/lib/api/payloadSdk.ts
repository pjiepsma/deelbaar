import { PayloadSDK } from '@payloadcms/sdk';

import type { Config } from '../types/payload-generated';
import { getPayloadRuntime } from './payloadRuntime';

const AUTHORIZATION_HEADER = 'Authorization';
const JWT_PREFIX = 'JWT ';
const PAYLOAD_SDK_CACHE_UNAUTHENTICATED = 'unauthenticated';

let payloadSdkInstance: PayloadSDK<Config> | null = null;
let payloadSdkCacheKey: string | null = null;

function getCacheKey(baseURL: string, token?: string): string {
  const segment = token ? token : PAYLOAD_SDK_CACHE_UNAUTHENTICATED;
  return `${baseURL}::${segment}`;
}

function getAuthorizationHeader(token?: string): Record<string, string> | undefined {
  if (!token) {
    return undefined;
  }

  return {
    [AUTHORIZATION_HEADER]: `${JWT_PREFIX}${token}`,
  };
}

export function getPayloadSdk(): PayloadSDK<Config> {
  const runtime = getPayloadRuntime();
  const nextCacheKey = getCacheKey(runtime.baseURL, runtime.token);

  if (!payloadSdkInstance || payloadSdkCacheKey !== nextCacheKey) {
    payloadSdkInstance = new PayloadSDK<Config>({
      baseURL: runtime.baseURL,
      fetch: globalThis.fetch.bind(globalThis),
      baseInit: {
        headers: getAuthorizationHeader(runtime.token),
      },
    });
    payloadSdkCacheKey = nextCacheKey;
  }

  return payloadSdkInstance;
}
