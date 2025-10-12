# Multi-stage build for Next.js Frontend in Monorepo

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json ./apps/frontend/

# Configure npm for slow/unstable connections + use local cache
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 600000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set maxsockets 3

# Install dependencies with better error handling
RUN npm ci --prefer-offline --no-audit --loglevel=verbose || \
    (npm cache clean --force && npm ci --loglevel=verbose)

# Stage 2: Builder
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependencies from deps stage (workspaces install tutto in root)
COPY --from=deps /app/node_modules ./node_modules

# Copy root workspace config
COPY package.json package-lock.json* ./

# Copy frontend source code
COPY apps/frontend ./apps/frontend

WORKDIR /app/apps/frontend

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Pass NEXT_PUBLIC_* environment variables at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js app
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/frontend/server.js"]
