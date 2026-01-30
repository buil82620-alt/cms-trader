FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files (for Prisma)
COPY package*.json ./
COPY yarn.lock* ./

# Copy CMS package files
COPY cms/package*.json ./cms/

# Install root dependencies (for Prisma CLI)
RUN yarn install --frozen-lockfile || npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Install CMS dependencies
WORKDIR /app/cms
RUN yarn install --frozen-lockfile || npm install

# Copy CMS application files
COPY cms/ .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package.json for Prisma Client runtime
COPY package*.json ./
COPY yarn.lock* ./

# Install only Prisma Client runtime dependencies
RUN yarn install --production --frozen-lockfile --ignore-scripts || npm ci --only=production --ignore-scripts

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy CMS package.json
COPY cms/package*.json ./cms/

# Install CMS production dependencies
WORKDIR /app/cms
RUN yarn install --production --frozen-lockfile || npm ci --only=production

# Copy built CMS application
COPY --from=builder /app/cms/dist ./dist

# Copy public assets if any
COPY --from=builder /app/cms/public ./public || true

# Expose port
EXPOSE 4322

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/server/entry.mjs"]
