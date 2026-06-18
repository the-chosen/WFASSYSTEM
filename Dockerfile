# Multi-stage build for production
FROM node:24-alpine AS builder

WORKDIR /app

# Copy config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json .npmrc ./
COPY lib/db/package.json ./lib/db/package.json
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/package.json
COPY artifacts/wichi-quotation/package.json ./artifacts/wichi-quotation/package.json

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts

# Build the project
RUN pnpm run build

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib/db/package.json ./lib/db/package.json
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json

# Install pnpm
RUN npm install -g pnpm

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts from builder
COPY --from=builder /app/lib/db/dist ./lib/db/dist
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/mockup-sandbox/dist ./artifacts/mockup-sandbox/dist
COPY --from=builder /app/artifacts/wichi-quotation/dist ./artifacts/wichi-quotation/dist

# Expose ports
EXPOSE 5000 8080 8081

# Start the API server
CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
