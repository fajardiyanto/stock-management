.PHONY: help build up down logs clean restart ps

help:
	@echo "Available commands:"
	@echo "  make build         - Build all containers"
	@echo "  make up            - Start all services"
	@echo "  make down          - Stop all services"
	@echo "  make logs          - View logs (all services)"
	@echo "  make logs-backend  - View backend logs"
	@echo "  make logs-frontend - View frontend logs"
	@echo "  make logs-db       - View database logs"
	@echo "  make ps            - List running containers"
	@echo "  make restart       - Restart all services"
	@echo "  make clean         - Remove all containers and volumes"
	@echo "  make shell-backend - Open shell in backend container"
	@echo "  make shell-db      - Open shell in database container"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

ps:
	docker-compose ps

restart:
	docker-compose restart

clean:
	docker-compose down -v --rmi all
	docker system prune -f

shell-backend:
	docker-compose exec backend sh

shell-db:
	docker-compose exec postgres psql -U postgres -d stockfish_db

# Database commands
db-backup:
	docker-compose exec postgres pg_dump -U postgres stockfish_db > backup_$(date +%Y%m%d_%H%M%S).sql

db-restore:
	@read -p "Enter backup file name: " file; \
	docker-compose exec -T postgres psql -U postgres stockfish_db < $file

# Development
dev-up:
	docker-compose up

dev-rebuild:
	docker-compose up --build

# Production
prod-build:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d