# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
# Copy migrations, seeders, and config for DB operations
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeders ./seeders
COPY --from=builder /app/src/server/config ./src/server/config
COPY --from=builder /app/src/server/model ./src/server/model
# Copy public assets
COPY --from=builder /app/public ./public
# Copy the built server code (assuming build outputs to dist/server or similar)
# Since the project is a ViteExpress app, the build usually bundles both
COPY --from=builder /app/src/server ./src/server

# Copy the entrypoint script
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

# Expose the app port
EXPOSE 3000

# Use the entrypoint script to handle migrations and startup
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
