FROM debian:buster-slim
LABEL maintainer="wekan"

# Declare Arguments
ARG NODE_VERSION
ARG METEOR_RELEASE
ARG METEOR_EDGE
ARG USE_EDGE
ARG NPM_VERSION
ARG FIBERS_VERSION
ARG ARCHITECTURE
ARG SRC_PATH
ARG WITH_API
ARG MATOMO_ADDRESS
ARG MATOMO_SITE_ID
ARG MATOMO_DO_NOT_TRACK
ARG MATOMO_WITH_USERNAME
ARG BROWSER_POLICY_ENABLED
ARG TRUSTED_URL
ARG WEBHOOKS_ATTRIBUTES
ARG OAUTH2_ENABLED
ARG OAUTH2_CLIENT_ID
ARG OAUTH2_SECRET
ARG OAUTH2_SERVER_URL
ARG OAUTH2_AUTH_ENDPOINT
ARG OAUTH2_USERINFO_ENDPOINT
ARG OAUTH2_TOKEN_ENDPOINT
ARG LDAP_ENABLE
ARG LDAP_PORT
ARG LDAP_HOST
ARG LDAP_BASEDN
ARG LDAP_LOGIN_FALLBACK
ARG LDAP_RECONNECT
ARG LDAP_TIMEOUT
ARG LDAP_IDLE_TIMEOUT
ARG LDAP_CONNECT_TIMEOUT
ARG LDAP_AUTHENTIFICATION
ARG LDAP_AUTHENTIFICATION_USERDN
ARG LDAP_AUTHENTIFICATION_PASSWORD
ARG LDAP_LOG_ENABLED
ARG LDAP_BACKGROUND_SYNC
ARG LDAP_BACKGROUND_SYNC_INTERVAL
ARG LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED
ARG LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS
ARG LDAP_ENCRYPTION
ARG LDAP_CA_CERT
ARG LDAP_REJECT_UNAUTHORIZED
ARG LDAP_USER_SEARCH_FILTER
ARG LDAP_USER_SEARCH_SCOPE
ARG LDAP_USER_SEARCH_FIELD
ARG LDAP_SEARCH_PAGE_SIZE
ARG LDAP_SEARCH_SIZE_LIMIT
ARG LDAP_GROUP_FILTER_ENABLE
ARG LDAP_GROUP_FILTER_OBJECTCLASS
ARG LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE
ARG LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE
ARG LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT
ARG LDAP_GROUP_FILTER_GROUP_NAME
ARG LDAP_UNIQUE_IDENTIFIER_FIELD
ARG LDAP_UTF8_NAMES_SLUGIFY
ARG LDAP_USERNAME_FIELD
ARG LDAP_MERGE_EXISTING_USERS
ARG LDAP_SYNC_USER_DATA
ARG LDAP_SYNC_USER_DATA_FIELDMAP
ARG LDAP_SYNC_GROUP_ROLES
ARG LDAP_DEFAULT_DOMAIN

# Set the environment variables (defaults where required)
# DOES NOT WORK: paxctl fix for alpine linux: https://github.com/wekan/wekan/issues/1303
# ENV BUILD_DEPS="paxctl"
ENV BUILD_DEPS="apt-utils bsdtar gnupg gosu wget curl bzip2 build-essential python git ca-certificates gcc-7" \
    NODE_VERSION=v8.12.0 \
    METEOR_RELEASE=1.8.1-beta.0 \
    USE_EDGE=false \
    METEOR_EDGE=1.5-beta.17 \
    NPM_VERSION=latest \
    FIBERS_VERSION=2.0.0 \
    ARCHITECTURE=linux-x64 \
    SRC_PATH=./ \
    WITH_API=true \
    MATOMO_ADDRESS="" \
    MATOMO_SITE_ID="" \
    MATOMO_DO_NOT_TRACK=true \
    MATOMO_WITH_USERNAME=false \
    BROWSER_POLICY_ENABLED=true \
    TRUSTED_URL="" \
    WEBHOOKS_ATTRIBUTES="" \
    OAUTH2_ENABLED=false \
    OAUTH2_CLIENT_ID="" \
    OAUTH2_SECRET="" \
    OAUTH2_SERVER_URL="" \
    OAUTH2_AUTH_ENDPOINT="" \
    OAUTH2_USERINFO_ENDPOINT="" \
    OAUTH2_TOKEN_ENDPOINT="" \
    LDAP_ENABLE=false \
    LDAP_PORT=389 \
    LDAP_HOST="" \
    LDAP_BASEDN="" \
    LDAP_LOGIN_FALLBACK=false \
    LDAP_RECONNECT=true \
    LDAP_TIMEOUT=10000 \
    LDAP_IDLE_TIMEOUT=10000 \
    LDAP_CONNECT_TIMEOUT=10000 \
    LDAP_AUTHENTIFICATION=false \
    LDAP_AUTHENTIFICATION_USERDN="" \
    LDAP_AUTHENTIFICATION_PASSWORD="" \
    LDAP_LOG_ENABLED=false \
    LDAP_BACKGROUND_SYNC=false \
    LDAP_BACKGROUND_SYNC_INTERVAL=100 \
    LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=false \
    LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=false \
    LDAP_ENCRYPTION=false \
    LDAP_CA_CERT="" \
    LDAP_REJECT_UNAUTHORIZED=false \
    LDAP_USER_SEARCH_FILTER="" \
    LDAP_USER_SEARCH_SCOPE="" \
    LDAP_USER_SEARCH_FIELD="" \
    LDAP_SEARCH_PAGE_SIZE=0 \
    LDAP_SEARCH_SIZE_LIMIT=0 \
    LDAP_GROUP_FILTER_ENABLE=false \
    LDAP_GROUP_FILTER_OBJECTCLASS="" \
    LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE="" \
    LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE="" \
    LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT="" \
    LDAP_GROUP_FILTER_GROUP_NAME="" \
    LDAP_UNIQUE_IDENTIFIER_FIELD="" \
    LDAP_UTF8_NAMES_SLUGIFY=true \
    LDAP_USERNAME_FIELD="" \
    LDAP_MERGE_EXISTING_USERS=false \
    LDAP_SYNC_USER_DATA=false \
    LDAP_SYNC_USER_DATA_FIELDMAP="" \
    LDAP_SYNC_GROUP_ROLES="" \
    LDAP_DEFAULT_DOMAIN=""

# Copy the app to the image
COPY ${SRC_PATH} /home/wekan/app

RUN \
    # Add non-root user wekan
    useradd --user-group --system --home-dir /home/wekan wekan && \
    \
    # OS dependencies
    apt-get update -y && apt-get install -y --no-install-recommends ${BUILD_DEPS} && \
    \
    # Meteor installer doesn't work with the default tar binary, so using bsdtar while installing.
    # https://github.com/coreos/bugs/issues/1095#issuecomment-350574389
    cp $(which tar) $(which tar)~ && \
    ln -sf $(which bsdtar) $(which tar) && \
    \
    # Download nodejs
    wget https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz && \
    wget https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt.asc && \
    #---------------------------------------------------------------------------------------------
    # Node Fibers 100% CPU usage issue:
    # https://github.com/wekan/wekan-mongodb/issues/2#issuecomment-381453161
    # https://github.com/meteor/meteor/issues/9796#issuecomment-381676326
    # https://github.com/sandstorm-io/sandstorm/blob/0f1fec013fe7208ed0fd97eb88b31b77e3c61f42/shell/server/00-startup.js#L99-L129
    # Also see beginning of wekan/server/authentication.js
    #   import Fiber from "fibers";
    #   Fiber.poolSize = 1e9;
    # OLD: Download node version 8.12.0 prerelease that has fix included, => Official 8.12.0 has been released 
    # Description at https://releases.wekan.team/node.txt
    #wget https://releases.wekan.team/node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz && \
    #echo "1ed54adb8497ad8967075a0b5d03dd5d0a502be43d4a4d84e5af489c613d7795  node-v8.12.0-linux-x64.tar.gz" >> SHASUMS256.txt.asc && \
    \
    # Verify nodejs authenticity
    grep ${NODE_VERSION}-${ARCHITECTURE}.tar.gz SHASUMS256.txt.asc | shasum -a 256 -c - && \
    #export GNUPGHOME="$(mktemp -d)" && \
    #\
    # Try other key servers if ha.pool.sks-keyservers.net is unreachable
    # Code from https://github.com/chorrell/docker-node/commit/2b673e17547c34f17f24553db02beefbac98d23c
    # gpg keys listed at https://github.com/nodejs/node#release-team
    # and keys listed here from previous version of this Dockerfile
    #for key in \
    #9554F04D7259F04124DE6B476D5A82AC7E37093B \
    #94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    #FD3A5288F042B6850C66B31F09FE44734EB7990E \
    #71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    #DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    #C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    #B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    #; do \
    #gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key" || \
    #gpg --keyserver pgp.mit.edu --recv-keys "$key" || \
    #gpg --keyserver keyserver.pgp.com --recv-keys "$key" ; \
    #done && \
    #gpg --verify SHASUMS256.txt.asc && \
    # Ignore socket files then delete files then delete directories
    #find "$GNUPGHOME" -type f | xargs rm -f && \
    #find "$GNUPGHOME" -type d | xargs rm -fR && \
    rm -f SHASUMS256.txt.asc && \
    \
    # Install Node
    tar xvzf node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz && \
    rm node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz && \
    mv node-${NODE_VERSION}-${ARCHITECTURE} /opt/nodejs && \
    ln -s /opt/nodejs/bin/node /usr/bin/node && \
    ln -s /opt/nodejs/bin/npm /usr/bin/npm && \
    \
    #DOES NOT WORK: paxctl fix for alpine linux: https://github.com/wekan/wekan/issues/1303
    #paxctl -mC `which node` && \
    \
    # Install Node dependencies
    npm install -g npm@${NPM_VERSION} && \
    npm install -g node-gyp && \
    npm install -g fibers@${FIBERS_VERSION} && \
    \
    # Change user to wekan and install meteor
    cd /home/wekan/ && \
    chown wekan:wekan --recursive /home/wekan && \
    curl "https://install.meteor.com" -o /home/wekan/install_meteor.sh && \
    #curl "https://install.meteor.com/?release=${METEOR_RELEASE}" -o /home/wekan/install_meteor.sh && \
    # OLD: sed -i "s|RELEASE=.*|RELEASE=${METEOR_RELEASE}\"\"|g" ./install_meteor.sh && \
    # Install Meteor forcing its progress
    sed -i 's/VERBOSITY="--silent"/VERBOSITY="--progress-bar"/' ./install_meteor.sh && \
    echo "Starting meteor ${METEOR_RELEASE} installation...   \n" && \
    chown wekan:wekan /home/wekan/install_meteor.sh && \
    \
    # Check if opting for a release candidate instead of major release
    if [ "$USE_EDGE" = false ]; then \
      gosu wekan:wekan sh /home/wekan/install_meteor.sh; \
    else \
      gosu wekan:wekan git clone --recursive --depth 1 -b release/METEOR@${METEOR_EDGE} git://github.com/meteor/meteor.git /home/wekan/.meteor; \
    fi; \
    \
    # Get additional packages
    mkdir -p /home/wekan/app/packages && \
    chown wekan:wekan --recursive /home/wekan && \
    cd /home/wekan/app/packages && \
    gosu wekan:wekan git clone --depth 1 -b master git://github.com/wekan/flow-router.git kadira-flow-router && \
    gosu wekan:wekan git clone --depth 1 -b master git://github.com/meteor-useraccounts/core.git meteor-useraccounts-core && \
    gosu wekan:wekan git clone --depth 1 -b master git://github.com/wekan/meteor-accounts-cas.git && \
    gosu wekan:wekan git clone --depth 1 -b master git://github.com/wekan/wekan-ldap.git && \
    sed -i 's/api\.versionsFrom/\/\/api.versionsFrom/' /home/wekan/app/packages/meteor-useraccounts-core/package.js && \
    cd /home/wekan/.meteor && \
    gosu wekan:wekan /home/wekan/.meteor/meteor -- help; \
    \
    # Build app
    cd /home/wekan/app && \
    gosu wekan:wekan /home/wekan/.meteor/meteor add standard-minifier-js && \
    gosu wekan:wekan /home/wekan/.meteor/meteor npm install && \
    gosu wekan:wekan /home/wekan/.meteor/meteor build --directory /home/wekan/app_build && \
    cp /home/wekan/app/fix-download-unicode/cfs_access-point.txt /home/wekan/app_build/bundle/programs/server/packages/cfs_access-point.js && \
    chown wekan:wekan /home/wekan/app_build/bundle/programs/server/packages/cfs_access-point.js && \
    #Removed binary version of bcrypt because of security vulnerability that is not fixed yet.
    #https://github.com/wekan/wekan/commit/4b2010213907c61b0e0482ab55abb06f6a668eac
    #https://github.com/wekan/wekan/commit/7eeabf14be3c63fae2226e561ef8a0c1390c8d3c
    #cd /home/wekan/app_build/bundle/programs/server/npm/node_modules/meteor/npm-bcrypt && \
    #gosu wekan:wekan rm -rf node_modules/bcrypt && \
    #gosu wekan:wekan npm install bcrypt && \
    cd /home/wekan/app_build/bundle/programs/server/ && \
    gosu wekan:wekan npm install && \
    #gosu wekan:wekan npm install bcrypt && \
    mv /home/wekan/app_build/bundle /build && \
    \
    # Put back the original tar
    mv $(which tar)~ $(which tar) && \
    \
    # Cleanup
    apt-get remove --purge -y ${BUILD_DEPS} && \
    apt-get autoremove -y && \
    rm -R /var/lib/apt/lists/* && \
    rm -R /home/wekan/.meteor && \
    rm -R /home/wekan/app && \
    rm -R /home/wekan/app_build && \
    rm /home/wekan/install_meteor.sh

ENV PORT=8080
EXPOSE $PORT
USER wekan

CMD ["node", "/build/main.js"]
