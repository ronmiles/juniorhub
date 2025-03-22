#!/bin/bash

echo "Building Docker containers for JuniorHub..."
echo "This may take a few minutes for the first build."

# Make sure containers are down before building
docker-compose down

# Build with increased Docker memory and specific platform
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Use docker buildx for multi-platform builds
docker buildx create --use
docker-compose --env-file .env.docker build

# Start the containers
echo "Starting containers..."
docker-compose up -d

# Check container status
echo "Checking container status..."
docker-compose ps

echo ""
echo "Setup complete! Your application should be available at:"
echo "- Frontend: http://localhost:4200"
echo "- Backend API: http://localhost:3000"
echo "- MongoDB Dashboard: http://localhost:8081 (login with root/rootpassword)"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down" 