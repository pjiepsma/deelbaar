# Next.js standalone image for Payload CMS.
# Build from the monorepo root (not from apps/cms):
#   docker build -f apps/cms/Dockerfile .

FROM node:22.17.0-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/cms/package.json ./apps/cms/
RUN corepack enable pnpm && corepack prepare pnpm@10.33.0 --activate \
  && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/cms ./apps/cms

ENV NEXT_TELEMETRY_DISABLED 1

ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_DSN
ARG PAYLOAD_SECRET
ARG SELECTED_CONFIG=production

ENV SENTRY_ORG=${SENTRY_ORG:-}
ENV SENTRY_PROJECT=${SENTRY_PROJECT:-}
ENV SENTRY_DSN=${SENTRY_DSN:-}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN:-}
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET:-dummy-secret-for-build-only}
ENV SELECTED_CONFIG=${SELECTED_CONFIG:-production}

RUN corepack enable pnpm && corepack prepare pnpm@10.33.0 --activate \
  && pnpm --filter @deelbaar/cms build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/cms/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/.next/static ./.next/static

RUN mkdir -p media && chown -R nextjs:nodejs media

USER nextjs

EXPOSE 4000
ENV PORT 4000

CMD HOSTNAME="0.0.0.0" node server.js
