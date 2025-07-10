# Use Node.js 20 as the base image
FROM node:20-slim AS builder

# Install pnpm
RUN npm install -g pnpm

# Install system dependencies required for Prisma and bcrypt
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN pnpm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN pnpm prisma generate

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy built assets and dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client in production
RUN pnpm prisma generate

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodejs \
    && chown -R nodejs:nodejs /app

USER nodejs

# Expose the port the app runs on
EXPOSE 8787

# Start the application
CMD ["pnpm", "start"] 