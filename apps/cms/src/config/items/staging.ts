import { createConfig } from '../createConfig'
import { defaultConfig } from './default'

export const stagingConfig = createConfig({
  url: 'http://localhost:4000',
  frontendUrl: 'http://localhost:3000',
  corsCsrfUrls: [
    'http://localhost:4000',
    'http://localhost:3000',
    'http://localhost:4001',
    'http://localhost:3001',
  ],
  sentry: {
    ...defaultConfig.sentry,
    enabled: true,
    environment: 'staging',
  },
})

