FROM golang:1-alpine AS build
WORKDIR /build/
RUN apk add wget
RUN wget https://git.sly-little-fox.ru/Sly-Little-Fox/canvas-server/archive/master.tar.gz
RUN tar -xf master.tar.gz && rm master.tar.gz
WORKDIR /build/canvas-server
RUN go build -o canvas-server

FROM alpine
WORKDIR /app/
COPY --from=build /build/canvas-server/canvas-server /app/canvas-server
CMD ["./canvas-server"]