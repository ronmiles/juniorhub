FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json* ./
# Copy nx configuration files
COPY nx.json tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the backend
RUN npx nx build backend

# Production image, copy all the files and run the backend
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy from build image
COPY --from=builder /app/dist/apps/backend ./
COPY --from=builder /app/node_modules ./node_modules

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejsuser
USER nodejsuser

# Expose port and define CMD
EXPOSE 3000
CMD ["node", "main.js"] 