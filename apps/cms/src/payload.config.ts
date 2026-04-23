// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
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
import { Listings } from './collections/Listings'
import { Reviews } from './collections/Reviews'
import { Requests } from './collections/Requests'
import { Wishes } from './collections/Wishes'
import { Notifications } from './collections/Notifications'
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
  collections: [Users, Media, Listings, Reviews, Requests, Wishes, Notifications],
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
  db: mongooseAdapter({
    url:
      config.databaseURI ||
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      process.env.DATABASE_URI ||
      false,
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
