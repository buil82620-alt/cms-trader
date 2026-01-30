FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile || npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package.json
COPY package*.json ./
COPY yarn.lock* ./

# Install production dependencies
RUN yarn install --production --frozen-lockfile --ignore-scripts || npm ci --only=production --ignore-scripts

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma/

# Copy built application
COPY --from=builder /app/dist ./dist/

# Copy public assets (will fail silently if doesn't exist)
RUN mkdir -p ./public
COPY --from=builder /app/public ./public/

# Expose port
EXPOSE 4322

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/server/entry.mjs"]
