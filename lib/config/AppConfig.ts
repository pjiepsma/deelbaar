export const AppConfig = {
  PAYLOAD_URL: process.env.EXPO_PUBLIC_PAYLOAD_URL || 'http://192.168.1.186:4000',
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};
