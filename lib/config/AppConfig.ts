export const AppConfig = {
  // Backend API URL
  // Default to localhost for simulator/emulator testing
  // Override with EXPO_PUBLIC_PAYLOAD_URL in .env for physical devices:
  // - Android Emulator: http://10.0.2.2:4000
  // - iOS Simulator: http://localhost:4000
  // - Physical Device: http://192.168.0.63:4000 (current computer IP on 192.168.0.x network)
  PAYLOAD_URL: process.env.EXPO_PUBLIC_PAYLOAD_URL || 'http://localhost:4000',
  
  // Stripe Publishable Key (from Stripe Dashboard)
  // Required for Stripe Connect onboarding
  // Get from: https://dashboard.stripe.com/apikeys
  // Format: pk_test_... or pk_live_...
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};
