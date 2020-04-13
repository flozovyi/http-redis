FROM node:10.13.0-alpine
WORKDIR /usr/src/app
COPY ./package.json .
# Install all Packages
RUN npm ci
ADD . /src
EXPOSE 3000
CMD [ "npm", "start" ]
