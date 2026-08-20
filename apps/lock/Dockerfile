FROM node:24-alpine AS alpine

# ------------------------- BASE -------------------------
FROM alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm
RUN pnpm install turbo --global
RUN pnpm install next --global

# ------------------------- BUILDER -------------------------
FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY . .
RUN turbo prune lock --docker

# ------------------------- INSTALLER -------------------------
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./
COPY --from=builder /app/out/pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

RUN pnpm build

# ------------------------- RUNNER -------------------------
FROM base AS runner
WORKDIR /app

ARG GIT_TAG
ENV GIT_TAG=$GIT_TAG

ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

USER nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/lock/.next/standalone/ .
COPY --from=installer --chown=nextjs:nodejs /app/apps/lock/.next/static /app/apps/lock/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/lock/public /app/apps/lock/public

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD node /app/apps/lock/server.js