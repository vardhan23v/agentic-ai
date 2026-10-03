# syntax=docker/dockerfile:1

# ---------------------------------------------------------
# Stage 1: Dependencies
# ---------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies required for native modules (bcrypt, Prisma engines)
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npm cache clean --force

# ---------------------------------------------------------
# Stage 2: Builder
# ---------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci && npm cache clean --force

# Generate Prisma client for the target platform
RUN npx prisma generate

# Compile TypeScript to dist/
RUN npm run build

# ---------------------------------------------------------
# Stage 3: Production
# ---------------------------------------------------------
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production

# Copy compiled application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Prisma engines are already generated in node_modules during builder stage
EXPOSE 5000

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" || exit 1

CMD ["node", "dist/server.js"]
