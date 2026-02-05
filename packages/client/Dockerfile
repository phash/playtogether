# PlayTogether Client - Production Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/client/package.json ./packages/client/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install --workspace=@playtogether/client --workspace=@playtogether/shared

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./

# Copy source files
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/client ./packages/client

# Build arguments for environment variables
ARG VITE_SERVER_URL=http://localhost:3001

# Set environment variable for build
ENV VITE_SERVER_URL=$VITE_SERVER_URL

# Build shared package first, then client
RUN npm run build --workspace=@playtogether/shared
RUN npm run build --workspace=@playtogether/client

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
