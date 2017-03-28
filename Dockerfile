FROM debian:wheezy
MAINTAINER wekan

# Declare Arguments
ARG NODE_VERSION
ARG METEOR_RELEASE
ARG NPM_VERSION
ARG ARCHITECTURE
ARG SRC_PATH

# Set the environment variables (defaults where required)
ENV BUILD_DEPS="wget curl bzip2 build-essential python git ca-certificates"
ENV GOSU_VERSION=1.10
ENV NODE_VERSION ${NODE_VERSION:-v0.10.48}
ENV METEOR_RELEASE ${METEOR_RELEASE:-1.3.5.1}
ENV NPM_VERSION ${NPM_VERSION:-4.2.0}
ENV ARCHITECTURE ${ARCHITECTURE:-linux-x64}
ENV SRC_PATH ${SRC_PATH:-./}

# Copy the app to the image
COPY ${SRC_PATH} /home/wekan/app

RUN \
    # Add non-root user wekan
    useradd --user-group --system --home-dir /home/wekan wekan && \
    \
    # OS dependencies
    apt-get update -y && apt-get install -y --no-install-recommends ${BUILD_DEPS} && \
    \
    # Gosu installation
    GOSU_ARCHITECTURE="$(dpkg --print-architecture | awk -F- '{ print $NF }')" && \
    wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/${GOSU_VERSION}/gosu-${GOSU_ARCHITECTURE}" && \
    wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/${GOSU_VERSION}/gosu-${GOSU_ARCHITECTURE}.asc" && \
    export GNUPGHOME="$(mktemp -d)" && \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4 && \
    gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu && \
    rm -R "$GNUPGHOME" /usr/local/bin/gosu.asc && \
    chmod +x /usr/local/bin/gosu && \
    \
    # Download nodejs
    wget https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz && \
    wget https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt.asc && \
    \
    # Verify nodejs authenticity
    grep ${NODE_VERSION}-${ARCHITECTURE}.tar.gz SHASUMS256.txt.asc | shasum -a 256 -c - && \
    export GNUPGHOME="$(mktemp -d)" && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys 9554F04D7259F04124DE6B476D5A82AC7E37093B && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys 94AE36675C464D64BAFA68DD7434390BDBE9B9C5 && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys FD3A5288F042B6850C66B31F09FE44734EB7990E && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys 71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys DD8F2338BAE7501E3DD5AC78C273792F7D83545D && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys B9AE9905FFD7803F25714661B63B535A4C206CA9 && \
    gpg --refresh-keys pool.sks-keyservers.net && \
    gpg --verify SHASUMS256.txt.asc && \
    rm -R "$GNUPGHOME" SHASUMS256.txt.asc && \
    \
    # Install Node
    tar xvzf node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz && \
    rm node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz && \
    mv node-${NODE_VERSION}-${ARCHITECTURE} /opt/nodejs && \
    ln -s /opt/nodejs/bin/node /usr/bin/node && \
    ln -s /opt/nodejs/bin/npm /usr/bin/npm && \
    \
    # Install Node dependencies
    npm install npm@${NPM_VERSION} -g && \
    npm install -g node-gyp && \
    npm install -g fibers && \
    \
    # Change user to wekan and install meteor
    cd /home/wekan/ && \
    chown wekan:wekan --recursive /home/wekan && \
    curl https://install.meteor.com -o ./install_meteor.sh && \
    sed -i "s|RELEASE=.*|RELEASE=${METEOR_RELEASE}\"\"|g" ./install_meteor.sh && \
    echo "Starting meteor ${METEOR_RELEASE} installation...   \n" && \
    chown wekan:wekan ./install_meteor.sh && \
    gosu wekan:wekan sh ./install_meteor.sh && \
    \
    # Build app
    source /home/wekan/app/app.env && \
    cd /home/wekan/app && \
    gosu wekan /home/wekan/.meteor/meteor npm install --save xss && \
    gosu wekan /home/wekan/.meteor/meteor build --directory /home/wekan/app_build && \
    cd /home/wekan/app_build/bundle/programs/server/ && \
    gosu wekan npm install && \
    mv /home/wekan/app_build/bundle /build && \
    \
    # Cleanup
    apt-get remove --purge -y ${BUILD_DEPS} && \
    apt-get autoremove -y && \
    rm -R /var/lib/apt/lists/* && \
    rm -R /home/wekan/.meteor && \
    rm -R /home/wekan/app && \
    rm -R /home/wekan/app_build && \
    rm /home/wekan/install_meteor.sh

ENV PORT=80
EXPOSE $PORT

CMD ["node", "/build/main.js"]
