import { describe, expect, it } from 'vitest';

import {
  readDevicePushPlatform,
  readDevicePushTokenString,
} from '../src/lib/notifications/devicePushTokenParse';

describe('devicePushToken parsers', () => {
  it('reads token string from device push response', () => {
    expect(readDevicePushTokenString({ type: 'android', data: '  fcm-token  ' })).toBe('fcm-token');
  });

  it('returns null when token is missing', () => {
    expect(readDevicePushTokenString({ type: 'android' })).toBeNull();
  });

  it('returns null when token is empty after trim', () => {
    expect(readDevicePushTokenString({ type: 'android', data: '   ' })).toBeNull();
  });

  it('reads platform from device push response', () => {
    expect(readDevicePushPlatform({ type: 'ios', data: 'apns-token' })).toBe('ios');
  });

  it('returns null for invalid platform', () => {
    expect(readDevicePushPlatform({ type: 'web', data: 'token' })).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(readDevicePushTokenString(null)).toBeNull();
    expect(readDevicePushPlatform('android')).toBeNull();
  });
});
