import 'dotenv/config'
// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { getSelectedEmailAdapter } from './lib/email-adapters/selectEmailAdapter'
import path from 'path'
import { buildConfig, type PayloadHandler } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { config } from './config/config'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Kiosks } from './collections/Kiosks'
import { Markets } from './collections/Markets'
import { Taps } from './collections/Taps'
import { Reviews } from './collections/Reviews'
import { Requests } from './collections/Requests'
import { Wishes } from './collections/Wishes'
import { Notifications } from './collections/Notifications'
import { Follows } from './collections/Follows'
import { Entitlements } from './collections/Entitlements'
import { Reports } from './collections/Reports'
import { Mail } from './globals/Mail/mail'
import { listingsNearby } from './endpoints/listingsNearby'
import { listingsInBounds } from './endpoints/listingsInBounds'
import { googleAuthEndpoint } from './endpoints/googleAuth'
import { listingsImportExport } from './lib/listings-import-export'
import { geocodeListingsEndpoint } from './endpoints/geocodeListings'
import { geocodeListings } from './tasks/geocodeListings'
import { unlockSearchScope } from './endpoints/unlockSearchScope'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)


export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Kiosks,
    Markets,
    Taps,
    Reviews,
    Requests,
    Wishes,
    Notifications,
    Follows,
    Entitlements,
    Reports,
  ],
  globals: [Mail],
  cors: ['*'], // Allow all origins in development
  csrf: config.corsCsrfUrls.filter((url): url is string => typeof url === 'string'),
  editor: lexicalEditor(),
  email: getSelectedEmailAdapter(),
  secret: config.secret,
  telemetry: false,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
    declare: false,
  },
  db: postgresAdapter({
    pool: {
      connectionString:
        config.databaseURI ||
        process.env.DATABASE_URI ||
        process.env.DATABASE_URL ||
        undefined,
    },
  }),
  endpoints: [
    {
      path: '/listings/nearby',
      method: 'get',
      handler: listingsNearby as PayloadHandler,
    },
    {
      path: '/listings/bounds',
      method: 'get',
      handler: listingsInBounds as PayloadHandler,
    },
    {
      path: '/search-access/unlock',
      method: 'post',
      handler: unlockSearchScope,
    },
    googleAuthEndpoint,
    geocodeListingsEndpoint,
  ],
  sharp,
  plugins: [
    payloadCloudPlugin(),
    listingsImportExport(),
    // storage-adapter-placeholder
  ],
  jobs: {
    tasks: [geocodeListings],
    schedules: [
      {
        cron: '0 2 * * *', // Run nightly at 02:00
        task: 'geocodeListings',
      },
    ],
  },
})
