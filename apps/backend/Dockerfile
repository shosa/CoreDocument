# Multi-stage build for NestJS Backend in Monorepo

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Configure npm for slow/unstable connections
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 600000 && \
    npm config set registry https://registry.npmjs.org/

# Install ALL dependencies (including workspaces)
RUN npm ci --workspace=backend --include-workspace-root --loglevel=verbose

# Stage 2: Build
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy root workspace config
COPY package.json package-lock.json* ./

# Copy backend source code (including prisma schema)
COPY apps/backend ./apps/backend

# Generate Prisma Client for Alpine Linux BEFORE changing to backend directory
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
ENV PRISMA_SCHEMA_PATH=/app/apps/backend/prisma/schema.prisma

# Generate using root prisma binary, pointing to backend schema
WORKDIR /app
RUN node_modules/.bin/prisma generate --schema=./apps/backend/prisma/schema.prisma

# Verify Prisma was generated correctly
RUN ls -la node_modules/.prisma/client/ && ls -la node_modules/@prisma/client/

# Now change to backend directory and build
WORKDIR /app/apps/backend
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files from builder
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./package.json

# Copy node_modules from ROOT (workspace) - includes Prisma Client
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

USER nestjs

EXPOSE 3002

CMD ["node", "dist/main"]
