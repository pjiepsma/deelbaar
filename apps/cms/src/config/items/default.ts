const parseCsvEnv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

export const defaultConfig = {
  secret: process.env.PAYLOAD_SECRET || '',
  url: 'http://localhost:4000',
  databaseURI: process.env.DATABASE_URI || 'mongodb://127.0.0.1/payload',
  title: 'Title',
  googleClientIds: parseCsvEnv(process.env.GOOGLE_CLIENT_IDS),
  corsCsrfUrls: [
    'http://localhost:4000',
    'http://localhost:3000',
    'http://localhost:4001',
    'http://localhost:3001',
    // Allow any local network IP for development (192.168.0.x, 192.168.1.x, etc.)
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  ],
  frontendUrl: 'http://localhost:3000',
  publicServerUrl: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:4000',
  sentry: {
    enabled: false,
    dsn: process.env.SENTRY_DSN || '',
    org: process.env.SENTRY_ORG || '',
    project: process.env.SENTRY_PROJECT || '',
    environment: 'development',
  },
}

