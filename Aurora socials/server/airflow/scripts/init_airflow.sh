#!/bin/bash
# Aurora Social - Airflow Setup Script
# Run this from the airflow/ directory

set -e

echo "=== Aurora Social Airflow Setup ==="

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Copy env template if .env doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.airflow.example .env
    echo "WARNING: Edit .env with your actual database password and API keys before proceeding!"
    echo "Press Enter to continue after editing, or Ctrl+C to abort."
    read
fi

echo "Building Airflow image..."
docker compose -f docker-compose.airflow.yml build

echo "Starting services..."
docker compose -f docker-compose.airflow.yml up -d

echo ""
echo "=== Airflow is starting up ==="
echo "Web UI:  http://localhost:8080"
echo "Login:   admin / admin"
echo ""
echo "It may take 30-60 seconds for the web UI to become available."
echo ""
echo "Useful commands:"
echo "  docker compose -f docker-compose.airflow.yml logs -f    # View logs"
echo "  docker compose -f docker-compose.airflow.yml down        # Stop"
echo "  docker compose -f docker-compose.airflow.yml down -v     # Stop + delete data"
