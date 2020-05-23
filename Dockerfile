FROM node:14-alpine as base

WORKDIR /var/build

#---------- PRE-REQS ----------
FROM base as prereq

COPY package*.json ./
COPY build-web-workers.sh ./

RUN npm install --quiet --unsafe-perm --no-progress --no-audit --only=production

#---------- DEVELOPMENT ----------
FROM prereq as development

RUN npm install --quiet --unsafe-perm --no-progress --no-audit --only=development

# copying these to avoid having to mount the project root in the volume directly
COPY tsconfig.json ./
RUN mkdir -p ./dist/{client,server}
RUN npm run build-web-workers
RUN mkdir src/

## All files will be volume mounted into the container
EXPOSE 1234
EXPOSE 1235