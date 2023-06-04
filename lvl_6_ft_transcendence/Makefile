COMPOSE_FILE_PATH=./docker-compose.yml

all: build up_detached ps

build:
	@if ! [ -f "./.env" ]; then \
		echo "ft_transcendence: error: .env file not found, please provide one like the example \".env.example\""; \
		exit 1; \
	fi

	@if ! [ -d "./data/db" ]; then \
		mkdir -p ./data; \
		mkdir -p ./data/db; \
	fi

	docker compose -f $(COMPOSE_FILE_PATH) build --progress=plain

up_detached:
	docker compose -f $(COMPOSE_FILE_PATH) up -d
#	sudo bash ./srcs/requirements/tools/manage_hosts.sh

down:
	docker compose -f $(COMPOSE_FILE_PATH) down
#	sudo bash ./srcs/requirements/tools/manage_hosts.sh --delete

start:
	docker compose -f $(COMPOSE_FILE_PATH) start
#	sudo bash ./srcs/requirements/tools/manage_hosts.sh

stop:
	docker compose -f $(COMPOSE_FILE_PATH) stop
#	sudo bash ./srcs/requirements/tools/manage_hosts.sh --delete

ps:
	docker compose -f $(COMPOSE_FILE_PATH) ps

rm: stop
	docker compose -f $(COMPOSE_FILE_PATH) rm

rmi: stop
	docker compose -f $(COMPOSE_FILE_PATH) down --rmi all

delete_volumes:
	docker compose -f $(COMPOSE_FILE_PATH) down --volumes
	sudo rm -rf ./data

system_prune:
	docker system prune

re: fclean all ps

fclean: stop rm delete_volumes rmi

.PHONY: all build up_detached down start stop ps rm delete_volumes