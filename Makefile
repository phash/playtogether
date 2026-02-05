# PlayTogether - Makefile
# Einfache Befehle für Docker-Management auf Linux

.PHONY: help build up down logs dev clean restart status

# Default target
help:
	@echo "PlayTogether - Docker Commands"
	@echo ""
	@echo "Production:"
	@echo "  make build     - Build Docker images"
	@echo "  make up        - Start containers"
	@echo "  make down      - Stop containers"
	@echo "  make restart   - Restart containers"
	@echo "  make logs      - View logs (follow mode)"
	@echo "  make status    - Show container status"
	@echo ""
	@echo "Development:"
	@echo "  make dev       - Start development containers with hot-reload"
	@echo "  make dev-build - Build development images"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean     - Remove containers, volumes, and images"
	@echo "  make prune     - Remove all unused Docker resources"

# ===========================================
# Production Commands
# ===========================================

build:
	docker compose build

up:
	docker compose up -d
	@echo ""
	@echo "PlayTogether is running!"
	@echo "  Client: http://localhost:$${CLIENT_PORT:-80}"
	@echo "  Server: http://localhost:$${SERVER_PORT:-3001}"

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

status:
	docker compose ps

# ===========================================
# Development Commands
# ===========================================

dev:
	docker compose -f docker-compose.dev.yml up

dev-build:
	docker compose -f docker-compose.dev.yml build

dev-down:
	docker compose -f docker-compose.dev.yml down

# ===========================================
# Maintenance Commands
# ===========================================

clean:
	docker compose down -v --rmi local
	docker compose -f docker-compose.dev.yml down -v --rmi local

prune:
	docker system prune -f

# ===========================================
# Utility Commands
# ===========================================

shell-server:
	docker compose exec server sh

shell-client:
	docker compose exec client sh

health:
	@echo "Server health:"
	@curl -s http://localhost:3001/api/health | jq . || echo "Server not reachable"
	@echo ""
	@echo "Client health:"
	@curl -s http://localhost/health || echo "Client not reachable"
