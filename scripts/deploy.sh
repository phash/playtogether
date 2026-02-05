#!/bin/bash
# PlayTogether - Deployment Script for Linux
# Usage: ./scripts/deploy.sh [environment]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV="${1:-production}"

echo "=========================================="
echo "PlayTogether Deployment"
echo "Environment: $ENV"
echo "=========================================="

cd "$PROJECT_DIR"

# Check for .env file
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "Please review and update .env before continuing."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Pull latest changes (if in git repo)
if [ -d ".git" ]; then
    echo ""
    echo "Pulling latest changes..."
    git pull origin main || true
fi

# Build and deploy based on environment
if [ "$ENV" = "development" ]; then
    echo ""
    echo "Starting development environment..."
    docker compose -f docker-compose.dev.yml up --build
else
    echo ""
    echo "Building production images..."
    docker compose build

    echo ""
    echo "Stopping existing containers..."
    docker compose down

    echo ""
    echo "Starting new containers..."
    docker compose up -d

    echo ""
    echo "Waiting for services to be healthy..."
    sleep 5

    # Check health
    echo ""
    echo "Checking service health..."

    SERVER_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${SERVER_PORT:-3001}/api/health || echo "000")
    CLIENT_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${CLIENT_PORT:-80}/health || echo "000")

    if [ "$SERVER_HEALTH" = "200" ]; then
        echo "✓ Server is healthy"
    else
        echo "✗ Server health check failed (HTTP $SERVER_HEALTH)"
    fi

    if [ "$CLIENT_HEALTH" = "200" ]; then
        echo "✓ Client is healthy"
    else
        echo "✗ Client health check failed (HTTP $CLIENT_HEALTH)"
    fi

    echo ""
    echo "=========================================="
    echo "Deployment complete!"
    echo ""
    echo "Services:"
    echo "  Client: http://localhost:${CLIENT_PORT:-80}"
    echo "  Server: http://localhost:${SERVER_PORT:-3001}"
    echo ""
    echo "Commands:"
    echo "  View logs: docker compose logs -f"
    echo "  Status:    docker compose ps"
    echo "  Stop:      docker compose down"
    echo "=========================================="
fi
