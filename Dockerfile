FROM ubuntu:24.04
LABEL maintainer="wekan"
LABEL org.opencontainers.image.ref.name="ubuntu"
LABEL org.opencontainers.image.version="24.04"
LABEL org.opencontainers.image.source="https://github.com/wekan/wekan"

# 2022-04-25:
# - gyp does not yet work with Ubuntu 22.04 ubuntu:rolling,
#   so changing to 21.10. https://github.com/wekan/wekan/issues/4488

# 2021-09-18:
# - Above Ubuntu base image copied from Docker Hub ubuntu:hirsute-20210825
#   to Quay to avoid Docker Hub rate limits.
ARG DEBIAN_FRONTEND=noninteractive

ENV BUILD_DEPS="apt-utils gnupg gosu wget bzip2 g++ curl libarchive-tools build-essential git ca-certificates python3"

ENV \
    DEBUG=false \
    NODE_VERSION=v14.21.4 \
    METEOR_RELEASE=METEOR@2.14 \
    USE_EDGE=false \
    METEOR_EDGE=1.5-beta.17 \
    NPM_VERSION=6.14.17 \
    FIBERS_VERSION=4.0.1 \
    ARCHITECTURE=linux-x64 \
    SRC_PATH=./ \
    WITH_API=true \
    RESULTS_PER_PAGE="" \
    DEFAULT_BOARD_ID="" \
    ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE=3 \
    ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD=60 \
    ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW=15 \
    ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BERORE=3 \
    ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD=60 \
    ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW=15 \
    ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS=90 \
    ATTACHMENTS_UPLOAD_EXTERNAL_PROGRAM="" \
    ATTACHMENTS_UPLOAD_MIME_TYPES="" \
    ATTACHMENTS_UPLOAD_MAX_SIZE=0 \
    AVATARS_UPLOAD_EXTERNAL_PROGRAM="" \
    AVATARS_UPLOAD_MIME_TYPES="" \
    AVATARS_UPLOAD_MAX_SIZE=72000 \
    RICHER_CARD_COMMENT_EDITOR=false \
    CARD_OPENED_WEBHOOK_ENABLED=false \
    MAX_IMAGE_PIXEL="" \
    IMAGE_COMPRESS_RATIO="" \
    NOTIFICATION_TRAY_AFTER_READ_DAYS_BEFORE_REMOVE="" \
    BIGEVENTS_PATTERN=NONE \
    NOTIFY_DUE_DAYS_BEFORE_AND_AFTER="" \
    NOTIFY_DUE_AT_HOUR_OF_DAY="" \
    EMAIL_NOTIFICATION_TIMEOUT=30000 \
    MATOMO_ADDRESS="" \
    MATOMO_SITE_ID="" \
    MATOMO_DO_NOT_TRACK=true \
    MATOMO_WITH_USERNAME=false \
    METRICS_ALLOWED_IP_ADDRESSES="" \
    BROWSER_POLICY_ENABLED=true \
    TRUSTED_URL="" \
    WEBHOOKS_ATTRIBUTES="" \
    OAUTH2_ENABLED=false \
    OIDC_REDIRECTION_ENABLED=false \
    OAUTH2_CA_CERT="" \
    OAUTH2_ADFS_ENABLED=false \
    OAUTH2_B2C_ENABLED=false \
    OAUTH2_LOGIN_STYLE=redirect \
    OAUTH2_CLIENT_ID="" \
    OAUTH2_SECRET="" \
    OAUTH2_SERVER_URL="" \
    OAUTH2_AUTH_ENDPOINT="" \
    OAUTH2_USERINFO_ENDPOINT="" \
    OAUTH2_TOKEN_ENDPOINT="" \
    OAUTH2_ID_MAP="" \
    OAUTH2_USERNAME_MAP="" \
    OAUTH2_FULLNAME_MAP="" \
    OAUTH2_ID_TOKEN_WHITELIST_FIELDS="" \
    OAUTH2_REQUEST_PERMISSIONS='openid profile email' \
    OAUTH2_EMAIL_MAP="" \
    LDAP_ENABLE=false \
    LDAP_PORT=389 \
    LDAP_HOST="" \
    LDAP_AD_SIMPLE_AUTH="" \
    LDAP_USER_AUTHENTICATION=false \
    LDAP_USER_AUTHENTICATION_FIELD=uid \
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
    LDAP_BACKGROUND_SYNC_INTERVAL="" \
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
    LDAP_FULLNAME_FIELD="" \
    LDAP_MERGE_EXISTING_USERS=false \
    LDAP_EMAIL_FIELD="" \
    LDAP_EMAIL_MATCH_ENABLE=false \
    LDAP_EMAIL_MATCH_REQUIRE=false \
    LDAP_EMAIL_MATCH_VERIFIED=false \
    LDAP_SYNC_USER_DATA=false \
    LDAP_SYNC_USER_DATA_FIELDMAP="" \
    LDAP_SYNC_GROUP_ROLES="" \
    LDAP_DEFAULT_DOMAIN="" \
    LDAP_SYNC_ADMIN_STATUS="" \
    LDAP_SYNC_ADMIN_GROUPS="" \
    HEADER_LOGIN_ID="" \
    HEADER_LOGIN_FIRSTNAME="" \
    HEADER_LOGIN_LASTNAME="" \
    HEADER_LOGIN_EMAIL="" \
    LOGOUT_WITH_TIMER=false \
    LOGOUT_IN="" \
    LOGOUT_ON_HOURS="" \
    LOGOUT_ON_MINUTES="" \
    CORS="" \
    CORS_ALLOW_HEADERS="" \
    CORS_EXPOSE_HEADERS="" \
    DEFAULT_AUTHENTICATION_METHOD="" \
    PASSWORD_LOGIN_ENABLED=true \
    CAS_ENABLED=false \
    CAS_BASE_URL="" \
    CAS_LOGIN_URL="" \
    CAS_VALIDATE_URL="" \
    SAML_ENABLED=false \
    SAML_PROVIDER="" \
    SAML_ENTRYPOINT="" \
    SAML_ISSUER="" \
    SAML_CERT="" \
    SAML_IDPSLO_REDIRECTURL="" \
    SAML_PRIVATE_KEYFILE="" \
    SAML_PUBLIC_CERTFILE="" \
    SAML_IDENTIFIER_FORMAT="" \
    SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE="" \
    SAML_ATTRIBUTES="" \
    ORACLE_OIM_ENABLED=false \
    WAIT_SPINNER="" \
    WRITABLE_PATH=/data \
    S3=""

#   NODE_OPTIONS="--max_old_space_size=4096"

#---------------------------------------------
# == at docker-compose.yml: AUTOLOGIN WITH OIDC/OAUTH2 ====
# https://github.com/wekan/wekan/wiki/autologin
#- OIDC_REDIRECTION_ENABLED=true
#---------------------------------------------------------------------

# Copy the app to the image
COPY ${SRC_PATH} /home/wekan/app

# Install OS
RUN <<EOR
set -o xtrace

# Add non-root user wekan
useradd --user-group --system --home-dir /home/wekan wekan
# OS dependencies
apt-get update --assume-yes
apt-get install --assume-yes --no-install-recommends ${BUILD_DEPS}

# Meteor installer doesn't work with the default tar binary, so using bsdtar while installing.
# https://github.com/coreos/bugs/issues/1095#issuecomment-350574389
cp $(which tar) $(which tar)~
ln -sf $(which bsdtar) $(which tar)

# Install NodeJS
cd /tmp

# Download nodejs
wget "https://github.com/wekan/node-v14-esm/releases/download/${NODE_VERSION}/node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz"
wget "https://github.com/wekan/node-v14-esm/releases/download/${NODE_VERSION}/SHASUMS256.txt"

# Verify nodejs authenticity
grep "node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz" "SHASUMS256.txt" | shasum -a 256 -c -
rm -f "SHASUMS256.txt"

# Install Node
tar xzf "node-$NODE_VERSION-$ARCHITECTURE.tar.gz" -C /usr/local --strip-components=1 --no-same-owner
rm "node-$NODE_VERSION-$ARCHITECTURE.tar.gz" "SHASUMS256.txt"
ln -s "/usr/local/bin/node" "/usr/local/bin/nodejs"
mkdir -p "/opt/nodejs/lib/node_modules/fibers/.node-gyp" "/root/.node-gyp/${NODE_VERSION} /home/wekan/.config"

# Install node dependencies
npm install -g npm@${NPM_VERSION} --production
chown --recursive wekan:wekan /home/wekan/.config

# Install Meteor
cd /home/wekan
chown --recursive wekan:wekan /home/wekan
echo "Starting meteor ${METEOR_RELEASE} installation...   \n"
gosu wekan:wekan curl https://install.meteor.com/ | /bin/sh
mv /root/.meteor /home/wekan/
chown --recursive wekan:wekan /home/wekan/.meteor

sed -i 's/api\.versionsFrom/\/\/api.versionsFrom/' /home/wekan/app/packages/meteor-useraccounts-core/package.js
cd /home/wekan/.meteor
gosu wekan:wekan /home/wekan/.meteor/meteor -- help

# Build app (Production)
cd /home/wekan/app
mkdir -p /home/wekan/.npm
chown --recursive wekan:wekan /home/wekan/.npm
chmod u+w *.json
gosu wekan:wekan meteor npm install --production
gosu wekan:wekan /home/wekan/.meteor/meteor build --directory /home/wekan/app_build
cd /home/wekan/app_build/bundle/programs/server/
chmod u+w *.json
gosu wekan:wekan meteor npm install --production
cd node_modules/fibers
node build.js
cd ../..
# Remove legacy webbroser bundle, so that Wekan works also at Android Firefox, iOS Safari, etc.
rm -rf /home/wekan/app_build/bundle/programs/web.browser.legacy
mv /home/wekan/app_build/bundle /build

# Put back the original tar
mv $(which tar)~ $(which tar)

# Cleanup
apt-get remove --purge --assume-yes ${BUILD_DEPS}
npm uninstall -g api2html
apt-get autoremove --assume-yes
apt-get clean --assume-yes
rm -Rf /tmp/*
rm -Rf /var/lib/apt/lists/*
rm -Rf /var/cache/apt
rm -Rf /var/lib/apt/lists
rm -Rf /home/wekan/app_build
rm -Rf /home/wekan/app
rm -Rf /home/wekan/.meteor

mkdir /data
chown wekan --recursive /data
EOR

USER wekan

ENV PORT=8080
EXPOSE $PORT

STOPSIGNAL SIGKILL
WORKDIR /home/wekan/app

#---------------------------------------------------------------------
# https://github.com/wekan/wekan/issues/3585#issuecomment-1021522132
# Add more Node heap:
#   NODE_OPTIONS="--max_old_space_size=4096"
# Add more stack:
#   bash -c "ulimit -s 65500; exec node --stack-size=65500 main.js"
#---------------------------------------------------------------------
#
# CMD ["node", "/build/main.js"]
# CMD ["bash", "-c", "ulimit -s 65500; exec node --stack-size=65500 /build/main.js"]
# CMD ["bash", "-c", "ulimit -s 65500; exec node --stack-size=65500 --max-old-space-size=8192 /build/main.js"]
CMD ["bash", "-c", "ulimit -s 65500; exec node /build/main.js"]
