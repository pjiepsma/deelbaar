import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  readDevicePushPlatform,
  readDevicePushTokenString,
  type PushPlatform,
} from './devicePushTokenParse';

export type { PushPlatform } from './devicePushTokenParse';
export { readDevicePushPlatform, readDevicePushTokenString } from './devicePushTokenParse';

const ANDROID_DEFAULT_CHANNEL_ID = 'default';

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_DEFAULT_CHANNEL_ID, {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function fetchDevicePushTokenForPlatform(): Promise<{
  platform: PushPlatform;
  token: string;
}> {
  await ensureAndroidNotificationChannel();
  const tokenResult = await Notifications.getDevicePushTokenAsync();
  const token = readDevicePushTokenString(tokenResult);
  const platform = readDevicePushPlatform(tokenResult);
  if (!token || !platform) {
    throw new Error('Device push token response did not include platform and token string.');
  }
  return { platform, token };
}
