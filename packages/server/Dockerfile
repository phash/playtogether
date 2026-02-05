# PlayTogether Server - Production Dockerfile
FROM node:20-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install --workspace=@playtogether/server --workspace=@playtogether/shared

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./

# Copy source files
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Generate Prisma client
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

# Build shared package first, then server
RUN npm run build --workspace=@playtogether/shared
RUN npm run build --workspace=@playtogether/server

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 playtogether

# Copy built files
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/server/package.json ./packages/server/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/package.json ./

# Copy public directory (APK download)
COPY --from=builder /app/packages/server/public ./packages/server/public

# Copy Prisma files
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install production dependencies only
RUN npm install --workspace=@playtogether/server --workspace=@playtogether/shared --omit=dev

# Re-generate Prisma client for production
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

USER playtogether

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma && node packages/server/dist/index.js"]
