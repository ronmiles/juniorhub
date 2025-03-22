FROM node:23-alpine

# Add build dependencies and utilities
RUN apk add --no-cache python3 make g++ dumb-init

# Set working directory
WORKDIR /app

# Copy package.json and related files
COPY package.json package-lock.json* ./
COPY nx.json tsconfig.base.json ./

# Set higher memory limit for Node
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production

# Install dependencies first (for better caching)
RUN npm install --prefer-offline --no-audit --force

# Force rebuild of bcrypt to ensure architecture compatibility
RUN npm rebuild bcrypt --build-from-source

# Copy the entire workspace (needed for Nx)
COPY . .

# Now build and prune
RUN npx nx build backend --skip-nx-cache && \
    npm prune --production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejsuser && \
    chown -R nodejsuser:nodejs /app/dist && \
    chown -R nodejsuser:nodejs /app/node_modules

# Set proper permissions
RUN chmod -R 755 /app/dist
RUN chmod -R 755 /app/node_modules

# Switch to non-root user
USER nodejsuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init as PID 1 to properly handle signals
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Change working directory to the built app
WORKDIR /app/dist/apps/backend

# Run the backend
CMD ["node", "main.js"] 