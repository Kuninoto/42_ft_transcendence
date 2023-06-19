COMPOSE_FILE_PATH=./docker-compose.yml

all: build up_detached ps

build:
	@mkdir -p /home/$(SUDO_USER)/data;
	@mkdir -p /home/$(SUDO_USER)/data/transcendence;

	@if ! [ -f ./.env.development ] && ! [ -f ./.env.production ]; then \
		echo "ft_transcendence: error: .env file not found, please provide one like the example \".env.example\""; \
		exit 1; \
	fi

	@if ! [ -d "/home/$(SUDO_USER)/data/transcendence" ]; then \
    	echo "ft_transcendence: error: mandatory directory for Docker Volumes wasn't found"; \
		exit 1; \
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
	sudo rm -rf /home/$(SUDO_USER)/transcendence

system_prune:
	docker system prune

re: fclean all ps

fclean: stop delete_volumes rm rmi

.PHONY: all build up_detached down start stop ps rm delete_volumes