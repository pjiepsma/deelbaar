const API_PATH_SUFFIX = '/api';

type PayloadRuntimeState = {
  baseURL: string;
  token?: string;
};

let payloadRuntimeState: PayloadRuntimeState | null = null;

function ensureApiBaseURL(serverURL: string): string {
  const trimmedURL = serverURL.trim().replace(/\/+$/, '');
  if (!trimmedURL) {
    throw new Error('Payload runtime init failed: serverURL is empty.');
  }
  return `${trimmedURL}${API_PATH_SUFFIX}`;
}

export function initPayloadRuntime(serverURL: string, token?: string): PayloadRuntimeState {
  payloadRuntimeState = {
    baseURL: ensureApiBaseURL(serverURL),
    token,
  };
  return payloadRuntimeState;
}

export function setPayloadRuntimeToken(token?: string): void {
  if (!payloadRuntimeState) {
    throw new Error('Payload runtime not initialized. Call initPayloadRuntime first.');
  }
  payloadRuntimeState = { ...payloadRuntimeState, token };
}

export function getPayloadRuntime(): PayloadRuntimeState {
  if (!payloadRuntimeState) {
    throw new Error('Payload runtime not initialized. Call initPayloadRuntime first.');
  }
  return payloadRuntimeState;
}
