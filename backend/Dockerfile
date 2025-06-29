FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY wrangler.toml ./

# Install dependencies (including dev dependencies for wrangler)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 8787

# Start the application in development mode for Docker
CMD ["npm", "run", "dev"] 