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
COPY --from=builder /app/.sequelizerc ./.sequelizerc

# Copy migrations and seeders for DB operations
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeders ./seeders

# Copy all source code (needed for tsx and migrations)
COPY --from=builder /app/src ./src

# Copy public assets
COPY --from=builder /app/public ./public

# Copy the entrypoint script
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

# Expose the app port
EXPOSE 3000

# Use the entrypoint script to handle migrations and startup
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
