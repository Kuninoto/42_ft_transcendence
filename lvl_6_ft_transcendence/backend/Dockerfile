FROM node:current-alpine3.17
LABEL org.opencontainers.image.authors="Kuninoto"
LABEL org.opencontainers.image.description="REST API in NestJS for ft_transcendence"

WORKDIR /app

COPY . .
RUN npm i -y

CMD [ "npm", "run", "start:dev"]

# TODO
# CHANGE TO PROD
# RUN npm i -y && npm build
# ENTRYPOINT [ "npm", "run", "start:prod" ]
