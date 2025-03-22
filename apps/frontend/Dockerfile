FROM node:23-alpine

# Add build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package.json and related files
COPY package.json package-lock.json* ./
COPY nx.json tsconfig.base.json ./

# Copy the entire workspace (needed for Nx)
COPY . .

# Set higher memory limit for Node
ENV NODE_OPTIONS="--max-old-space-size=4096" 

# Install dependencies with safety flags and build
RUN npm install --prefer-offline --no-audit --force && \
    npx nx build frontend --skip-nx-cache

# Production stage using nginx
FROM nginx:alpine

# Copy built files
COPY --from=0 /app/dist/apps/frontend /usr/share/nginx/html

# Copy nginx config
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 