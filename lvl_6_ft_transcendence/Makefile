COMPOSE_FILE_PATH=./docker-compose.yml

all: build up_detached ps logs

build:
	docker-compose -f $(COMPOSE_FILE_PATH) build --progress=plain

up_detached:
	docker-compose -f $(COMPOSE_FILE_PATH) up -d
#	sudo bash ./manage_hosts.sh

down:
	docker-compose -f $(COMPOSE_FILE_PATH) down
#	sudo bash ./manage_hosts.sh --delete

start:
	docker-compose -f $(COMPOSE_FILE_PATH) start
#	sudo bash ./manage_hosts.sh

stop:
	docker-compose -f $(COMPOSE_FILE_PATH) stop
#	sudo bash ./manage_hosts.sh --delete

ps:
	docker-compose -f $(COMPOSE_FILE_PATH) ps

rm: stop
	docker-compose -f $(COMPOSE_FILE_PATH) rm

rmi: stop
	docker-compose -f $(COMPOSE_FILE_PATH) down --rmi all

delete_volumes:
	docker-compose -f $(COMPOSE_FILE_PATH) down --volumes
#	rm -rf ./data

logs:
	docker logs nest -f

system_prune:
	docker system prune

fclean: stop rm delete_volumes rmi

re: down all ps

.PHONY: all build up_detached down start stop ps rm delete_volumes
