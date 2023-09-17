COMPOSE_FILE_PATH=./docker-compose.yml

all: up_detached ps

build:
	docker-compose -f $(COMPOSE_FILE_PATH) build --progress=plain

up_detached:
	docker-compose -f $(COMPOSE_FILE_PATH) up --build -d

down:
	docker-compose -f $(COMPOSE_FILE_PATH) down

start:
	docker-compose -f $(COMPOSE_FILE_PATH) start

stop:
	docker-compose -f $(COMPOSE_FILE_PATH) stop

ps:
	docker-compose -f $(COMPOSE_FILE_PATH) ps

rm: stop
	docker-compose -f $(COMPOSE_FILE_PATH) rm

rmi: stop
	docker-compose -f $(COMPOSE_FILE_PATH) down --rmi all

delete_volumes:
	docker-compose -f $(COMPOSE_FILE_PATH) down --volumes

fclean: stop rm delete_volumes rmi

re: down all ps

.PHONY: all build up_detached down start stop ps rm delete_volumes
