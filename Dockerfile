FROM node:18.19.0-alpine3.18

WORKDIR /opt/jsdl/

RUN apk add --no-cache ffmpeg

COPY index.ts package.json tsconfig.json yarn.lock /opt/jsdl/
COPY lib /opt/jsdl/lib

RUN yarn

CMD ["yarn", "run", "start"]
