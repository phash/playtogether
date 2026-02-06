# PlayTogether - Makefile
# Einfache Befehle für Docker-Management auf Linux

PROD_COMPOSE = docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production

.PHONY: help build up down logs dev clean restart status prod-build prod-up prod-down prod-logs prod-restart prod-status prod-health

# Default target
help:
	@echo "PlayTogether - Docker Commands"
	@echo ""
	@echo "Local (default ports):"
	@echo "  make build     - Build Docker images"
	@echo "  make up        - Start containers"
	@echo "  make down      - Stop containers"
	@echo "  make restart   - Restart containers"
	@echo "  make logs      - View logs (follow mode)"
	@echo "  make status    - Show container status"
	@echo ""
	@echo "VPS Production (playtogether.musikersuche.org):"
	@echo "  make prod-build   - Build production images"
	@echo "  make prod-up      - Start production containers"
	@echo "  make prod-down    - Stop production containers"
	@echo "  make prod-restart - Restart production containers"
	@echo "  make prod-logs    - View production logs"
	@echo "  make prod-status  - Show production container status"
	@echo "  make prod-health  - Check production health"
	@echo ""
	@echo "Development:"
	@echo "  make dev       - Start development containers with hot-reload"
	@echo "  make dev-build - Build development images"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean     - Remove containers, volumes, and images"
	@echo "  make prune     - Remove all unused Docker resources"

# ===========================================
# Local Commands (default ports)
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
# VPS Production Commands
# ===========================================

prod-build:
	$(PROD_COMPOSE) build

prod-up:
	$(PROD_COMPOSE) up -d
	@echo ""
	@echo "PlayTogether Production is running!"
	@echo "  Client: http://127.0.0.1:18080 (via NPM: https://playtogether.musikersuche.org)"
	@echo "  Server: http://127.0.0.1:13001 (internal, proxied via client nginx)"

prod-down:
	$(PROD_COMPOSE) down

prod-restart:
	$(PROD_COMPOSE) restart

prod-logs:
	$(PROD_COMPOSE) logs -f

prod-status:
	$(PROD_COMPOSE) ps

prod-health:
	@echo "Server health:"
	@curl -s http://127.0.0.1:13001/api/health | jq . 2>/dev/null || echo "Server not reachable"
	@echo ""
	@echo "Client health:"
	@curl -s http://127.0.0.1:18080/health || echo "Client not reachable"

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

prod-clean:
	$(PROD_COMPOSE) down -v --rmi local

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
