FROM node:18.7.0-alpine3.15

WORKDIR /opt/jsdl/

RUN apk add --no-cache ffmpeg

COPY index.ts package.json tsconfig.json yarn.lock /opt/jsdl/
COPY lib /opt/jsdl/lib

RUN yarn

CMD ["yarn", "run", "start"]
