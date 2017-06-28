FROM node:8-alpine

LABEL maintainer "Archomeda (https://github.com/Archomeda/kormir-discord-bot)"

# Remove the excessive output from npm kthxbye
ENV NPM_CONFIG_LOGLEVEL warn

RUN mkdir /bot
WORKDIR /bot
COPY . /bot
RUN yarn install

VOLUME /bot/config
CMD node server.js
