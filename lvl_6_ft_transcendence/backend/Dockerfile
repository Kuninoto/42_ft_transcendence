FROM node:current-alpine3.17

WORKDIR /app

COPY . .
RUN npm i -y

# TODO
# Change npm script to prod
CMD [ "npm", "run", "start:dev"]
