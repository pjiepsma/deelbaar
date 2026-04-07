import { withSentryConfig } from '@sentry/nextjs'
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/admin/',
        permanent: false,
      },
    ]
  },
  assetPrefix: process.env.NODE_ENV === 'development' ? undefined : '/admin',
  images: {
    path: process.env.NODE_ENV === 'development' ? undefined : '/admin/_next/image',
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  serverRuntimeConfig: {
    PORT: 4000,
  },
}

// Wrap with Sentry only if org and project are provided (optional)
const hasSentryConfig = process.env.SENTRY_ORG && process.env.SENTRY_PROJECT

const configWithSentry = hasSentryConfig
  ? withSentryConfig(
      nextConfig,
      {
        // For all available options, see:
        // https://github.com/getsentry/sentry-webpack-plugin#options

        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
        // This can increase your server load as well as your hosting bill.
        // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
        // side errors will fail.
        tunnelRoute: '/monitoring',

        // Hides source maps from generated client bundles
        hideSourceMaps: true,

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,

        // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
        // See the following for more information:
        // https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: true,
      },
      {
        // For all available options, see:
        // https://github.com/getsentry/sentry-webpack-plugin#options

        // Suppresses source map uploading logs during build
        silent: true,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    )
  : nextConfig

export default withPayload(configWithSentry, { devBundleServerPackages: false })