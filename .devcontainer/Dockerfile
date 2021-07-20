FROM quay.io/wekan/ubuntu:groovy-20210115
LABEL maintainer="sgr"

ENV BUILD_DEPS="gnupg gosu libarchive-tools wget curl bzip2 g++ build-essential python git ca-certificates iproute2"
ENV DEBIAN_FRONTEND=noninteractive

ENV \
    DEBUG=false \
    NODE_VERSION=v12.22.3 \
    METEOR_RELEASE=1.10.2 \
    USE_EDGE=false \
    METEOR_EDGE=1.5-beta.17 \
    NPM_VERSION=latest \
    FIBERS_VERSION=4.0.1 \
    ARCHITECTURE=linux-x64 \
    SRC_PATH=./ \
    WITH_API=true \
    RESULTS_PER_PAGE="" \
    ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE=3 \
    ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD=60 \
    ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW=15 \
    ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BERORE=3 \
    ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD=60 \
    ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW=15 \
    RICHER_CARD_COMMENT_EDITOR=false \
    CARD_OPENED_WEBHOOK_ENABLED=false \
    ATTACHMENTS_STORE_PATH="" \
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
    BROWSER_POLICY_ENABLED=true \
    TRUSTED_URL="" \
    WEBHOOKS_ATTRIBUTES="" \
    OAUTH2_ENABLED=false \
    OAUTH2_CA_CERT="" \
    OAUTH2_ADFS_ENABLED=false \
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
    LDAP_USER_AUTHENTICATION=false \
    LDAP_USER_AUTHENTICATION_FIELD=uid \
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
    DEFAULT_WAIT_SPINNER=""

# Install OS
RUN set -o xtrace \
  && useradd --user-group -m --system --home-dir /home/wekan wekan \
  && apt-get update \
  && apt-get install --assume-yes --no-install-recommends apt-utils apt-transport-https ca-certificates 2>&1 \
  && apt-get install --assume-yes --no-install-recommends ${BUILD_DEPS}

# Install NodeJS
RUN set -o xtrace \
  && cd /tmp \
  && curl -fsSLO --compressed "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-$ARCHITECTURE.tar.xz" \
  && curl -fsSLO --compressed "https://nodejs.org/dist/$NODE_VERSION/SHASUMS256.txt.asc" \
  && grep " node-$NODE_VERSION-$ARCHITECTURE.tar.xz\$" SHASUMS256.txt.asc | sha256sum -c - \
  && tar -xJf "node-$NODE_VERSION-$ARCHITECTURE.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
  && rm "node-$NODE_VERSION-$ARCHITECTURE.tar.xz" SHASUMS256.txt.asc \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
  && mkdir -p /usr/local/lib/node_modules/fibers/.node-gyp /root/.node-gyp/${NODE_VERSION} /home/wekan/.config \
  && npm install -g npm@${NPM_VERSION} \
  && chown wekan:wekan --recursive /home/wekan/.config

ENV DEBIAN_FRONTEND=dialog

USER wekan

# Install Meteor
RUN set -o xtrace \
  && cd /home/wekan \
  && curl https://install.meteor.com/?release=$METEOR_VERSION --output /home/wekan/install-meteor.sh \
  # Replace tar with bsdtar in the install script; https://github.com/jshimko/meteor-launchpad/issues/39
  && sed --in-place "s/tar -xzf.*/bsdtar -xf \"\$TARBALL_FILE\" -C \"\$INSTALL_TMPDIR\"/g" /home/wekan/install-meteor.sh \
  && sed --in-place 's/VERBOSITY="--silent"/VERBOSITY="--progress-bar"/' /home/wekan/install-meteor.sh \
  && printf "\n[-] Installing Meteor $METEOR_VERSION...\n\n" \
  && sh /home/wekan/install-meteor.sh

ENV PATH=$PATH:/home/wekan/.meteor/

USER root

RUN echo "export PATH=$PATH" >> /etc/environment

USER wekan

# Copy source dir
RUN set -o xtrace \
  && mkdir -p /home/wekan/app/.meteor \
  && mkdir -p /home/wekan/app/packages

COPY \
    .meteor/.finished-upgraders \
    .meteor/.id \
    .meteor/cordova-plugins \
    .meteor/packages \
    .meteor/platforms \
    .meteor/release \
    .meteor/versions \
    /home/wekan/app/.meteor/

COPY \
    package.json \
    settings.json \
    /home/wekan/app/

COPY \
    packages \
    /home/wekan/app/packages/

USER root

RUN set -o xtrace \
  && chown -R wekan:wekan /home/wekan/app /home/wekan/.meteor

USER wekan

RUN \
    set -o xtrace && \
    sed -i 's/api\.versionsFrom/\/\/api.versionsFrom/' /home/wekan/app/packages/meteor-useraccounts-core/package.js && \
    cd /home/wekan/.meteor && \
    /home/wekan/.meteor/meteor -- help;

RUN \
    set -o xtrace && \
    # Build app
    cd /home/wekan/app && \
    /home/wekan/.meteor/meteor add standard-minifier-js && \
    /home/wekan/.meteor/meteor npm install && \
    /home/wekan/.meteor/meteor build --directory /home/wekan/app_build

RUN \
    set -o xtrace && \
    cd /home/wekan/app_build/bundle/programs/server/ && \
    chmod u+w package.json npm-shrinkwrap.json && \
    npm install

ENV PORT=3000
EXPOSE $PORT
WORKDIR /home/wekan/app

CMD ["/home/wekan/.meteor/meteor", "run", "--verbose", "--settings", "settings.json"]
