FROM node:16-bullseye-slim

RUN mkdir -p /usr/local/share/app/

RUN apt update && apt install tesseract-ocr tesseract-ocr-eng curl -y && apt clean

RUN useradd -m app

ADD --chown=app:app . /usr/local/share/app/

WORKDIR /usr/local/share/app/

RUN chmod -R 777 /usr/local/share/app/

RUN chown -R app:app /usr/local/share/app/

USER app

RUN echo '{"name":"ocr","private":true,"type":"module"}' > package.json

RUN yarn add xxhashjs@0.2.2 lowdb@^3.0.0 && \
  yarn add -D typescript@^4.4.4 @types/node@^16 &&\ 
  yarn add fastify fastify-allow \
  consola sharp @sapphire/fetch && \ 
  yarn cache clean --all

RUN ./node_modules/.bin/tsc --module esnext --moduleResolution node --target esnext --esModuleInterop index.ts

CMD ["node", "index.js"]
