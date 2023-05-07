# Build image
FROM golang:bullseye as build-stage

ENV SND_TAGS=LIBUSB
ENV SND_RELEASE_DIR=/app
ENV SND_APP_NAME=snd

WORKDIR /build
RUN mkdir /app

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash
RUN apt-get update -y &&\
    apt-get -y install libusb-1.0-0-dev pkg-config nodejs bzip2

COPY . .
RUN cd /build/frontend && npm i && npm run build

RUN ./build.sh

# Release image
FROM ubuntu:latest
WORKDIR /app

RUN apt-get -y update
RUN apt-get -y install libusb-1.0.0-dev pkg-config curl
RUN curl -LO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb &&\
    apt-get install -y ./google-chrome-stable_current_amd64.deb &&\
    rm google-chrome-stable_current_amd64.deb 
    
COPY --from=build-stage /app /app
EXPOSE 7123
CMD ["/app/snd"]