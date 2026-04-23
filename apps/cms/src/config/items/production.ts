import { createConfig } from '../createConfig'
import { defaultConfig } from './default'

export const productionConfig = createConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  url: process.env.BACKEND_URL || 'http://localhost:4000',
  databaseURI:
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_URI ||
    'mongodb://mongo:27017/payload',
  title: process.env.SITE_TITLE || 'Deelbaar API',
  corsCsrfUrls: [
    process.env.BACKEND_URL || 'http://localhost:4000',
    process.env.FRONTEND_URL || 'http://localhost:4000',
    // Add your React Native Expo app URLs here
    // For development: 'http://your-zimaboard-ip:4000', 'exp://your-device-ip:8081'
    // For production: Add your production URLs
    ...(process.env.EXPO_URLS ? process.env.EXPO_URLS.split(',').map(url => url.trim()) : []),
  ],
  frontendUrl: process.env.FRONTEND_URL || process.env.BACKEND_URL || 'http://localhost:4000',
  sentry: {
    ...defaultConfig.sentry,
    enabled: true,
    dsn: process.env.SENTRY_DSN || '',
    org: process.env.SENTRY_ORG || '',
    project: process.env.SENTRY_PROJECT || '',
    environment: 'production',
  },
})

