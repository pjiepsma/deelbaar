import { Platform } from 'react-native';

const DEFAULT_PAYLOAD_URL = 'http://localhost:4000';

/** Raw URL from env (or default). Prefer setting EXPO_PUBLIC_PAYLOAD_URL for physical devices. */
const rawPayloadUrl = process.env.EXPO_PUBLIC_PAYLOAD_URL || DEFAULT_PAYLOAD_URL;

/**
 * Android emulator: `localhost` is the emulator itself, not the host machine.
 * Rewrite to 10.0.2.2 so the dev CMS running on the PC is reachable.
 * Only applied in __DEV__ mode on Android (emulators always report android platform
 * and we only run this code path in development).
 */
function resolvePayloadUrl(url: string): string {
  if (!__DEV__ || Platform.OS !== 'android') {
    return url;
  }
  return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
}

export const AppConfig = {
  // Backend API URL
  // - iOS Simulator: http://localhost:4000 works
  // - Android Emulator: localhost is rewritten to 10.0.2.2 in dev (see resolvePayloadUrl)
  // - Physical device: set EXPO_PUBLIC_PAYLOAD_URL to your PC's LAN IP, e.g. http://192.168.0.63:4000
  PAYLOAD_URL: resolvePayloadUrl(rawPayloadUrl),

  // Stripe Publishable Key (from Stripe Dashboard)
  // Required for Stripe Connect onboarding
  // Get from: https://dashboard.stripe.com/apikeys
  // Format: pk_test_... or pk_live_...
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};
