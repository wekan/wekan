FROM scratch AS downloads

# Download NodeJS bundle
ADD https://static.meteor.com/dev-bundle-node-os/v14.21.4/node-v14.21.4-linux-x64.tar.gz node.tar.gz

# Download Meteor bundle
ADD https://static.meteor.com/packages-bootstrap/2.16/meteor-bootstrap-os.linux.x86_64.tar.gz meteor.tar.gz

FROM ubuntu:24.04 AS build

# Install node from official archive
RUN --mount=type=bind,from=downloads,source=node.tar.gz,target=node.tar.gz \
    tar xzf node.tar.gz --strip-components=1 --keep-old-files --no-same-owner

# Install meteor from official archive
RUN --mount=type=bind,from=downloads,source=meteor.tar.gz,target=meteor.tar.gz \
    tar xzf meteor.tar.gz -C $HOME --no-same-owner

# Update the npm version
RUN npm install -g npm@6.14.17

# Install several build dependencies
RUN apt update && \
    apt install --yes --no-install-suggests --no-install-recommends ssh git g++ curl ca-certificates && \
    rm -r /var/lib/apt/lists

# Change to temporary working directory
WORKDIR /workdir

# Copy package.json and package-lock.json to install application dependencies
COPY package.json .
COPY package-lock.json .

# Install build dependencies
RUN $HOME/.meteor/meteor npm install --production

# Copy meteor application configurations
COPY .meteor .meteor

# Copy application sources
COPY packages packages
COPY imports imports
COPY config config
COPY models models
COPY public public
COPY server server
COPY client client

# Build the application
RUN $HOME/.meteor/meteor build --directory /build --allow-superuser

# Enter server bundle directory
WORKDIR /build/bundle/programs/server

# Install server dependencies
RUN $HOME/.meteor/meteor npm install --production

# Enter installation directory of fibers
WORKDIR /build/bundle/programs/server/node_modules/fibers

# Build fibers integrations
RUN node build.js

FROM ubuntu:24.04 AS wekan

# Add metadata to image
LABEL maintainer="wekan"
LABEL org.opencontainers.image.ref.name="ubuntu"
LABEL org.opencontainers.image.version="24.04"
LABEL org.opencontainers.image.source="https://github.com/wekan/wekan"

# Set default environment variables
ENV WITH_API=true \
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

# Install node and application sources from build stage
RUN --mount=type=bind,from=downloads,source=node.tar.gz,target=node.tar.gz \
    --mount=type=bind,from=build,source=/build,target=/build \
    # Install NodeJS
    tar xzf node.tar.gz --strip-components=1 --keep-old-files --no-same-owner && \
    # Add the wekan user
    useradd --uid 999 --user-group --system wekan && \
    # Copy wekan bundle
    cp -r /build/bundle /wekan && \
    # Remove the web.browser.legacy platform
    rm -r /wekan/programs/web.browser.legacy && \
    # Change ownership of wekan directory
    chown wekan:wekan -R /wekan && \
    # Create the data directory
    mkdir /data && \
    # Change ownership of data directory
    chown wekan:root -R /data

# Change to the wekan user
USER wekan

# Set the port to listen on
ENV PORT=8080
EXPOSE ${PORT}

# Define the stop signal for node
STOPSIGNAL SIGINT

# Declare a volume on /data
VOLUME /data

# Set startup command
CMD ["node", "/wekan/main.js"]
