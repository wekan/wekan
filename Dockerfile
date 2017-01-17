FROM debian:wheezy
MAINTAINER wefork

ENV BUILD_DEPS="wget curl bzip2 build-essential python git"
ARG NODE_VERSION=v0.10.48
ARG METEOR_RELEASE=1.3.5.1
ARG NPM_VERSION=3.10.10
ARG ARCHICTECTURE=linux-x64
ARG SRC_PATH=./

# Copy the app to the image
COPY ${SRC_PATH} ./app

# OS dependencies
RUN apt-get update -y && apt-get install -y ${BUILD_DEPS} && \
    \
    # Download nodejs
    wget https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-${ARCHICTECTURE}.tar.gz && \
    wget https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt.asc && \
    \
    # Verify nodejs authenticity
    grep ${NODE_VERSION}-${ARCHICTECTURE}.tar.gz SHASUMS256.txt.asc | shasum -a 256 -c - && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys 9554F04D7259F04124DE6B476D5A82AC7E37093B && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys 94AE36675C464D64BAFA68DD7434390BDBE9B9C5 && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys FD3A5288F042B6850C66B31F09FE44734EB7990E && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys 71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys DD8F2338BAE7501E3DD5AC78C273792F7D83545D && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 && \
    gpg --keyserver pool.sks-keyservers.net --recv-keys B9AE9905FFD7803F25714661B63B535A4C206CA9 && \
    gpg --refresh-keys pool.sks-keyservers.net && \
    gpg --verify SHASUMS256.txt.asc && \
    \
    # Install Node
    tar xvzf node-${NODE_VERSION}-${ARCHICTECTURE}.tar.gz && \
    rm node-${NODE_VERSION}-${ARCHICTECTURE}.tar.gz && \
    mv node-${NODE_VERSION}-${ARCHICTECTURE} /opt/nodejs && \
    ln -s /opt/nodejs/bin/node /usr/bin/node && \
    ln -s /opt/nodejs/bin/npm /usr/bin/npm && \
    \
    # Install Node dependencies
    npm install npm@${NPM_VERSION} -g && \
    npm install -g node-gyp && \
    npm install -g fibers && \
    \
    # Install meteor
    curl https://install.meteor.com -o ./install_meteor.sh && \
    sed -i "s|RELEASE=.*|RELEASE=${METEOR_RELEASE}\"\"|g" ./install_meteor.sh && \
    echo "Starting meteor ${METEOR_RELEASE} installation...   \n" && \
    sh ./install_meteor.sh && \
    \
    # Build app
    cd ./app && \
    meteor npm install --save xss && \
    echo "Starting meteor build of the app...   \n" && \
    meteor build --directory --allow-superuser /opt/app_build && \
    cd /opt/app_build/bundle/programs/server/ && \
    npm install && \
    mv /opt/app_build/bundle /build && \
    cd /build && \
    \
    # Cleanup
    apt-get remove --purge -y ${BUILD_DEPS} && \
    apt-get autoremove -y && \
    rm -R /var/lib/apt/lists/* /app /opt/app_build ~/.meteor && \
    rm /install_meteor.sh

ENV PORT=80

CMD ["node", "/build/main.js"]
