FROM node:9

ARG NPMAccessToken

WORKDIR /usr/src/secret-shield

COPY . .

RUN wget https://s3.amazonaws.com/watchbot-binaries/linux/v4.8.1/watchbot -O /usr/local/bin/watchbot
RUN chmod +x /usr/local/bin/watchbot

RUN echo "//registry.npmjs.org/:_authToken=$NPMAccessToken" > ./.npmrc
RUN npm install --production
RUN npm link

RUN rm -f ./.npmrc
