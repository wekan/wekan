FROM ubuntu:26.04
LABEL maintainer="wekan"
LABEL org.opencontainers.image.ref.name="ubuntu"
LABEL org.opencontainers.image.version="26.04"
LABEL org.opencontainers.image.source="https://github.com/wekan/wekan"

# TARGETARCH and TARGETVARIANT are automatically provided by Docker Buildx
ARG TARGETARCH
ARG TARGETVARIANT
ARG VERSION=10.10
ARG DEBIAN_FRONTEND=noninteractive

ENV BUILD_DEPS="apt-utils gnupg wget bzip2 g++ curl libarchive-tools build-essential git ca-certificates python3 unzip"

ENV \
    DEBUG=false \
    NODE_VERSION=v24.18.0 \
    METEOR_RELEASE=METEOR@3.5-rc.2 \
    USE_EDGE=false \
    NPM_VERSION=11.12.1 \
    SRC_PATH=./ \
    WITH_API=true \
    MONGO_OPLOG_URL="" \
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
    NOTIFY_ON_ASSIGN="true" \
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
    OAUTH2_SECRET_FILE="" \
    OAUTH2_SERVER_URL="" \
    OAUTH2_AUTH_ENDPOINT="" \
    OAUTH2_USERINFO_ENDPOINT="" \
    OAUTH2_TOKEN_ENDPOINT="" \
    OAUTH2_LOGOUT_ENDPOINT="" \
    OAUTH2_ID_MAP="" \
    OAUTH2_USERNAME_MAP="" \
    OAUTH2_AUTO_REGISTRATION="true" \
    OAUTH2_ADMIN_GROUPS="" \
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
    LDAP_AUTHENTIFICATION_PASSWORD_FILE="" \
    LDAP_LOG_ENABLED=false \
    LDAP_BACKGROUND_SYNC=false \
    LDAP_BACKGROUND_SYNC_INTERVAL="" \
    LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=false \
    LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=false \
    LDAP_BACKGROUND_SYNC_DISABLE_NONEXISTANT_USERS=false \
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
    LDAP_SYNC_ORGANIZATIONS=false \
    LDAP_SYNC_ORGANIZATIONS_GROUPS="" \
    LDAP_SYNC_TEAMS=false \
    LDAP_SYNC_TEAMS_GROUPS="" \
    HEADER_LOGIN_ID="" \
    HEADER_LOGIN_FIRSTNAME="" \
    HEADER_LOGIN_LASTNAME="" \
    HEADER_LOGIN_EMAIL="" \
    HEADER_LOGIN_TRUSTED_IPS="" \
    HEADER_LOGIN_TRUSTED_PROXIES="" \
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
    S3="" \
    MAIL_SERVICE_PASSWORD_FILE="" \
    MONGO_PASSWORD_FILE="" \
    S3_SECRET_FILE=""

RUN <<EOR
set -o xtrace
# Fail hard on any error so a missing release zip / failed download can never
# produce a "successful" image with an empty /build (Cannot find /build/main.js).
set -eo pipefail

# Create Wekan user. --create-home is required because --system users do not
# get a home directory by default; without it /home/wekan never exists and the
# later `chown ... /home/wekan/` aborts the build (now that set -e is active).
useradd --user-group --system --create-home --home-dir /home/wekan wekan

# OS Updates
apt-get update --assume-yes
apt-get upgrade --assume-yes
apt-get install --assume-yes --no-install-recommends ${BUILD_DEPS}

# Multi-arch mapping: Docker TARGETARCH -> Node.js arch name + WeKan bundle name.
# amd64/arm64 have MongoDB Community; ppc64le/s390x/riscv64 have no MongoDB server
# and ship FerretDB v1 instead (the ferretdb binary is baked into their .zip and
# started by wekan-entrypoint.sh). riscv64's Node.js 24 comes from
# unofficial-builds.nodejs.org (nodejs.org ships no riscv64). armv7l is excluded:
# there is no Node.js 24 build for it anywhere.
NODE_BASE="official"
case "${TARGETARCH}" in
    "amd64")   NODE_ARCH="x64"     WEKAN_ARCH="amd64"   ;;
    "arm64")   NODE_ARCH="arm64"   WEKAN_ARCH="arm64"   ;;
    "ppc64le") NODE_ARCH="ppc64le" WEKAN_ARCH="ppc64le" ;;
    "s390x")   NODE_ARCH="s390x"   WEKAN_ARCH="s390x"   ;;
    "riscv64") NODE_ARCH="riscv64" WEKAN_ARCH="riscv64" NODE_BASE="unofficial" ;;
    *) echo "Unsupported architecture: ${TARGETARCH}"; exit 1 ;;
esac

# Node.js installation. Official nodejs.org builds for amd64/arm64/ppc64le/s390x;
# unofficial-builds.nodejs.org for riscv64 (nodejs.org ships no riscv64 binary).
cd /tmp
if [ "${NODE_BASE}" = "unofficial" ]; then
    NODE_DIST="https://unofficial-builds.nodejs.org/download/release/${NODE_VERSION}"
else
    NODE_DIST="https://nodejs.org/dist/${NODE_VERSION}"
fi
wget "${NODE_DIST}/node-${NODE_VERSION}-linux-${NODE_ARCH}.tar.gz"
wget "${NODE_DIST}/SHASUMS256.txt"
grep " node-${NODE_VERSION}-linux-${NODE_ARCH}.tar.gz\$" SHASUMS256.txt | shasum -a 256 -c -
tar xzf "node-${NODE_VERSION}-linux-${NODE_ARCH}.tar.gz" -C /usr/local --strip-components=1 --no-same-owner
rm -f "node-${NODE_VERSION}-linux-${NODE_ARCH}.tar.gz" SHASUMS256.txt
ln -s "/usr/local/bin/node" "/usr/local/bin/nodejs"

# NPM configuration
npm install -g npm@${NPM_VERSION}
chown --recursive wekan:wekan /home/wekan/

# Temporary Tar swap for Meteor bundle
cp $(which tar) $(which tar)~
ln -sf $(which bsdtar) $(which tar)

# WeKan Bundle Installation
mkdir -p /home/wekan/app
cd /home/wekan/app
# Retry the release-asset download: even though the CI `docker` job needs the
# `release` job (so the asset is already uploaded), GitHub's
# releases/download/<tag>/<asset> URL can briefly return 404 right after upload
# (CDN/propagation lag). A plain wget treats 404 as fatal, which failed the
# build; retry on transient HTTP errors so propagation lag no longer breaks it.
WEKAN_ZIP_URL="https://github.com/wekan/wekan/releases/download/v${VERSION}/wekan-${VERSION}-${WEKAN_ARCH}.zip"
wget --tries=20 --waitretry=20 --retry-on-http-error=404,403,500,502,503 "${WEKAN_ZIP_URL}" \
  || { echo "Failed to download ${WEKAN_ZIP_URL} after retries"; exit 8; }
unzip "wekan-${VERSION}-${WEKAN_ARCH}.zip"
rm "wekan-${VERSION}-${WEKAN_ARCH}.zip"
npm install --prefix ./bundle/programs/server
mv /home/wekan/app/bundle /build

# The .zip bundle now ships a self-contained launcher + its own Node.js for the
# offline downloads; the Docker image installs its own Node and uses
# wekan-entrypoint.sh, so drop the redundant bundled node + launchers. Keeps
# /build/ferretdb (used by the entrypoint) and the per-arch MongoDB Database Tools
# (bsondump, mongodump, mongorestore, … from wekan/mongo-tools, embedded in the
# bundle) for backup/restore inside the container. Saves ~80 MB per arch.
rm -f /build/node /build/start-wekan.sh /build/start-wekan.bat

# Restore original tar
mv $(which tar)~ $(which tar)

# Cleanup
# Remove unused Go-based pebble binary shipped by base image to reduce CVE surface.
apt-get remove --purge --assume-yes pebble || true
rm -f /usr/bin/pebble
apt-get remove --purge --assume-yes ${BUILD_DEPS}
apt-get autoremove --assume-yes
apt-get clean --assume-yes
rm -Rf /tmp/*
rm -Rf /var/lib/apt/lists/*
rm -Rf /home/wekan/app

mkdir -p /data
chown wekan:wekan --recursive /data
EOR

# Database-backend selector entrypoint. Every arch's bundle now ships a FerretDB
# binary (baked into the .zip and moved to /build/ferretdb above); this script
# starts FerretDB v1 (SQLite) or leaves the DB external based on WEKAN_DB and the
# /build/.ferretdb-default marker (present only on MongoDB-less arches). See
# releases/ferretdb/wekan-entrypoint.sh.
COPY --chmod=755 releases/ferretdb/wekan-entrypoint.sh /build/wekan-entrypoint.sh

USER wekan
ENV PORT=8080
EXPOSE $PORT
STOPSIGNAL SIGKILL
WORKDIR /build

CMD ["bash", "/build/wekan-entrypoint.sh"]
