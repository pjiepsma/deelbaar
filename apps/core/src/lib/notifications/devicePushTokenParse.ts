export type PushPlatform = 'android' | 'ios';

export function readDevicePushTokenString(tokenResult: unknown): string | null {
  if (tokenResult === null || typeof tokenResult !== 'object') {
    return null;
  }
  const data: unknown = Reflect.get(tokenResult, 'data');
  if (typeof data !== 'string') {
    return null;
  }
  const trimmed = data.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readDevicePushPlatform(tokenResult: unknown): PushPlatform | null {
  if (tokenResult === null || typeof tokenResult !== 'object') {
    return null;
  }
  const type: unknown = Reflect.get(tokenResult, 'type');
  if (type === 'android' || type === 'ios') {
    return type;
  }
  return null;
}
