# build part
FROM node:12 as builder
USER root

# install meteor
RUN apt update && apt install -y curl git && \
    curl -s https://install.meteor.com/ | sh && \
    ln -s /home/node/.meteor/meteor /usr/bin/meteor

# build wekan
USER node
RUN mkdir -p /home/node/wekan
WORKDIR /home/node/wekan
COPY --chown=node:node . .
RUN npm install && \
    meteor build --directory /home/node/build
WORKDIR /home/node/build/bundle/programs/server
RUN npm install

# run part
FROM node:12-buster-slim
COPY --chown=node:node --from=builder /home/node/build/bundle /wekan
COPY --chown=node:node ./entrypoint.sh /entrypoint.sh
USER node
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/bin/bash", "-c", "/entrypoint.sh"]
