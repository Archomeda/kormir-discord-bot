FROM node:7-alpine

LABEL maintainer "Archomeda (https://github.com/Archomeda/kormir-discord-bot)"

# Remove the excessive output from npm kthxbye
ENV NPM_CONFIG_LOGLEVEL warn

RUN mkdir /bot
WORKDIR /bot
COPY . /bot
RUN npm install

VOLUME /bot/config
CMD npm start
