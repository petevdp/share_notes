FROM node:14 as base

WORKDIR /var/build

RUN npm install

## All files will be volume mounted into the container
EXPOSE 1234
EXPOSE 1235