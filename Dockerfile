# debian:trixie (Debian 13), not ubuntu:26.04: Ubuntu publishes no linux/386
# image, which stopped the image from ever building for i386. Debian ships every
# arch this image targets - amd64, arm64, 386, arm/v7, ppc64le, riscv64, s390x -
# so ONE base covers them all, and it is the same base WeKan's per-arch .zip
# bundles are already built in (releases/... build-extra-arches).
#
# The ONE it does not ship is arm/v6: debian:trixie's manifest list has arm/v5
# and arm/v7 and nothing between them. That matters because containerd treats a
# LOWER ARM variant as compatible, so a linux/arm/v6 request does not fail - it
# quietly resolves to the arm/v5 (armel, SOFT-float) image, whose loader and
# glibc cannot run the hard-float node-armv6 in the armv6 bundle. The docker job
# therefore asks this base what it publishes and drops a platform it lacks; see
# docs/Platforms/FOSS/Container/Docker/CPU-platforms.md.
FROM debian:trixie
LABEL maintainer="wekan"
LABEL org.opencontainers.image.ref.name="debian"
LABEL org.opencontainers.image.version="trixie"
LABEL org.opencontainers.image.source="https://github.com/wekan/wekan"

# TARGETARCH and TARGETVARIANT are automatically provided by Docker Buildx
ARG TARGETARCH
ARG TARGETVARIANT
ARG VERSION=11.52
ARG DEBIAN_FRONTEND=noninteractive

ENV BUILD_DEPS="apt-utils gnupg wget bzip2 g++ curl libarchive-tools build-essential git ca-certificates python3 unzip"

ENV \
    DEBUG=false \
    DDP_TRANSPORT=sockjs \
    NODE_VERSION=v24.20.0 \
    METEOR_RELEASE=METEOR@3.5.2-rc.0 \
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

# Where this image's Node.js comes from is decided by the SAME script the .zip
# bundles and the snap use - official nodejs.org, then unofficial-builds, then
# wekan/node-patches - so the image and the bundle of the same architecture can
# never end up on Node.js from different places. It is copied in rather than
# reimplemented here; a second copy of that order would drift from the first.
COPY --chmod=755 releases/resolve-node-source.sh /tmp/resolve-node-source.sh
# It asks nodejs.org and github.com which builds exist, through releases/fetch.sh
# - which retries a 503 instead of reading it as "that build does not exist".
# The two travel together: without this line the resolve step dies on the first
# lookup. tests/releaseDownloads.test.cjs pins the pair.
COPY --chmod=755 releases/fetch.sh /tmp/fetch.sh
# The bundle's `npm install` leaves node-gyp's whole tree - 83 of the 120
# packages in programs/server/node_modules - in a bundle that compiles nothing at
# run time, and a scan of the published image reads it as what it is. The same
# script runs in every per-arch leg of release-all.yml, so the .zip bundles and
# this image are pruned identically. tests/imageBuildOnlyModules.test.cjs pins it.
COPY --chmod=755 releases/prune-build-only-modules.mjs /tmp/prune-build-only-modules.mjs
# Its companion, and its manifest: the npm packages Meteor's own packages bundle,
# which nothing in package.json can reach. The .zip is built with these already
# applied; what this run has to redo is the part `npm install` puts back.
COPY --chmod=755 releases/bump-bundle-npm-deps.mjs /tmp/bump-bundle-npm-deps.mjs
COPY --chmod=644 releases/bundle-npm-security-bumps.json /tmp/bundle-npm-security-bumps.json
# And the third of the same kind: WeKan talks DDP over sockjs on every platform,
# so no bundle carries uWebSockets.js. ddp-server requires that module only
# inside the uws transport's setup(), which a sockjs server never calls, and it
# is 121M of prebuilt binaries for OS/CPU/ABI combinations one machine cannot
# use. The entrypoint coerces DDP_TRANSPORT=uws to sockjs, so an existing
# compose file that asks for uws keeps working rather than crash-looping.
COPY --chmod=755 releases/bundle-trim.mjs /tmp/bundle-trim.mjs
# Its companion: the same idea applied to programs/server/npm/node_modules.
COPY --chmod=755 releases/prune-unreachable-npm.mjs /tmp/prune-unreachable-npm.mjs

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

# Multi-arch mapping: Docker TARGETARCH -> WeKan's own platform name, which is
# both the bundle .zip's name and what resolve-node-source.sh is asked about.
# amd64/arm64 have MongoDB Community; ppc64le/s390x/riscv64 have no MongoDB
# server and ship FerretDB v1 instead (the ferretdb binary is baked into their
# .zip and started by wekan-entrypoint.sh). Debian's 32-bit ARM port is armhf
# (ARMv7, VFPv3-D16), which is what linux/arm/v7 runs.
case "${TARGETARCH}" in
    "amd64")   WEKAN_ARCH="amd64"   ;;
    "arm64")   WEKAN_ARCH="arm64"   ;;
    "ppc64le") WEKAN_ARCH="ppc64le" ;;
    "s390x")   WEKAN_ARCH="s390x"   ;;
    "riscv64") WEKAN_ARCH="riscv64" ;;
    "386")     WEKAN_ARCH="i386"    ;;
    # BOTH linux/arm/v6 and linux/arm/v7 arrive here as TARGETARCH=arm - the CPU
    # generation is in TARGETVARIANT, not in TARGETARCH - so this branch MUST read
    # the variant. Mapping "arm" straight to armhf, as it did, would hand an ARMv6
    # board (Raspberry Pi 1, Zero) the armhf bundle, which is built to Debian's
    # ARMv7-A baseline and whose instructions that board cannot execute.
    "arm")
        case "${TARGETVARIANT}" in
            "v6")    WEKAN_ARCH="armv6" ;;
            # v7, and an unset variant, are Debian's armhf port: ARMv7-A,
            # VFPv3-D16 hard-float. That is what linux/arm/v7 runs.
            "v7"|"") WEKAN_ARCH="armhf" ;;
            # v5 is armel: FerretDB and the MongoDB tools publish it (they are Go),
            # but Node.js does not exist for ARMv5 at all, so there is no bundle to
            # put in an image and refusing is the only honest answer.
            *) echo "Unsupported 32-bit ARM variant: ${TARGETVARIANT} (only v6 and v7 have a WeKan bundle)"; exit 1 ;;
        esac ;;
    *) echo "Unsupported architecture: ${TARGETARCH}${TARGETVARIANT:+/${TARGETVARIANT}}"; exit 1 ;;
esac

# Node.js installation - official nodejs.org, then unofficial-builds.nodejs.org,
# then wekan/node-patches, in that order, for EVERY architecture.
#
# The choice is made by releases/resolve-node-source.sh, copied in above and used
# by the .zip bundles and the snap as well, so the image and the bundle of one
# architecture always carry the same Node.js from the same place. It is asked
# about the MAJOR, so a CPU whose newest build lags a release still gets its
# newest: it answers with the exact file, what shape that file is, and the
# SHA256 the source published for it.
#
# npm is arch-independent JavaScript, so it is grafted from the official amd64
# tarball of the version that was resolved - a build-time tool, not the shipped
# node. (node-patches publishes a bare node binary and no npm at all, which is
# why npm is fetched separately rather than taken from the archive above.)
cd /tmp
NODE_MAJOR="${NODE_VERSION#v}"; NODE_MAJOR="${NODE_MAJOR%%.*}"
if ! NODE_META="$(bash /tmp/resolve-node-source.sh "${WEKAN_ARCH}" "${NODE_MAJOR}")"; then
    echo "No Node.js ${NODE_MAJOR}.x for ${WEKAN_ARCH} at nodejs.org, unofficial-builds.nodejs.org or wekan/node-patches, so this image cannot be built for it. Build node-${WEKAN_ARCH} in wekan/node-patches, or drop ${TARGETARCH} from the image's platform list." >&2
    exit 1
fi
eval "${NODE_META}"
echo "Node.js ${node_full} for ${WEKAN_ARCH}: ${node_from} (${node_url})"
wget --tries=20 --waitretry=20 --retry-on-http-error=403,500,502,503 -O node-download "${node_url}"
echo "${node_sha256}  node-download" | sha256sum -c -
case "${node_kind}" in
    binary)
        cp node-download /usr/local/bin/node
        ;;
    tar.xz|tar.gz|tar)
        # bsdtar (libarchive-tools) is installed below for the bundle; plain tar
        # here, letting it detect the compression rather than naming it.
        tar -xf node-download --no-same-owner "${node_member}"
        cp "${node_member}" /usr/local/bin/node
        ;;
    *)
        echo "resolve-node-source.sh returned an unknown kind '${node_kind}'." >&2
        exit 1
        ;;
esac
chmod +x /usr/local/bin/node
# npm + npx from the official amd64 tarball of the SAME version; extract only
# those paths, not the amd64 node binary.
# Same flags as the download above: a bare wget treats a 503 as fatal, and
# nodejs.org has them.
wget --tries=20 --waitretry=20 --retry-on-http-error=403,500,502,503 \
  "https://nodejs.org/dist/${node_full}/node-${node_full}-linux-x64.tar.gz"
wget --tries=20 --waitretry=20 --retry-on-http-error=403,500,502,503 \
  "https://nodejs.org/dist/${node_full}/SHASUMS256.txt"
grep " node-${node_full}-linux-x64.tar.gz\$" SHASUMS256.txt | sha256sum -c -
tar xzf "node-${node_full}-linux-x64.tar.gz" -C /usr/local --strip-components=1 --no-same-owner \
    "node-${node_full}-linux-x64/lib/node_modules/npm" \
    "node-${node_full}-linux-x64/bin/npm" \
    "node-${node_full}-linux-x64/bin/npx"
rm -rf node-download "node-${node_full}-linux-x64.tar.gz" "node-${node_full}-linux-x64" SHASUMS256.txt
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
# node-gyp and @mapbox/node-pre-gyp compiled nothing here - every native module
# in the bundle is a prebuilt .node - and nothing in boot.js reaches them. Their
# tree is what shipped `tar` 6.2.1 (CRITICAL) and npm's networking stack to the
# published image, so it goes now that the install is done.
node /tmp/prune-build-only-modules.mjs ./bundle
# The .zip already carries the bumped meteor/ tree; this install put back
# meteor-dev-bundle's own underscore 1.13.7 pin (CVE-2026-27601) over it, so the
# same pass runs here.
node /tmp/bump-bundle-npm-deps.mjs ./bundle
# No uWebSockets.js, no legacy client, no source maps: this image runs sockjs,
# serves web.browser to every browser, and has no debugger attached to it.
node /tmp/bundle-trim.mjs ./bundle --transport sockjs --drop-legacy-client
# And the npm tree rspack cannot tree-shake, because Atmosphere packages load it
# through Npm.require(). Only what it can prove nothing requires.
node /tmp/prune-unreachable-npm.mjs ./bundle
mv /home/wekan/app/bundle /build

# The .zip bundle now ships a self-contained launcher + its own Node.js for the
# offline downloads; the Docker image installs its own Node and uses
# wekan-entrypoint.sh, so drop the redundant bundled node + launchers. Keeps
# /build/ferretdb (used by the entrypoint) and the per-arch MongoDB Database Tools
# (bsondump, mongodump, mongorestore, … from wekan/mongo-tools-patches, embedded in the
# bundle) for backup/restore inside the container. Saves ~80 MB per arch.
rm -f /build/node /build/start-wekan.sh /build/start-wekan.bat

# Restore original tar
mv $(which tar)~ $(which tar)

# Cleanup
# npm is a BUILD tool in this image and nothing else: the only thing it does is
# the `npm install` above, and the container starts bash + wekan-entrypoint.sh,
# which never calls it. Shipping it shipped npm's own bundled dependencies - its
# `tar` (CRITICAL), `sigstore`, `@sigstore/*`, `ip-address`, `brace-expansion` -
# as image content that no code path can reach. node itself stays, because that
# is what runs WeKan.
rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
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
# #6492: standalone "recovering data" page the entrypoint serves as a brief bridge on
# the web port while a just-restored FerretDB comes back up during a data recovery.
COPY --chmod=644 releases/ferretdb/recovery-bridge.mjs /build/recovery-bridge.mjs
# #6595: the entrypoint asks this whether the database answers yet, so it can
# serve the "waiting for database" page instead of leaving the web port unbound
# for a reverse proxy to time out on.
COPY --chmod=644 releases/ferretdb/db-ready.mjs /build/db-ready.mjs

USER wekan
ENV PORT=8080
EXPOSE $PORT
STOPSIGNAL SIGKILL
WORKDIR /build

CMD ["bash", "/build/wekan-entrypoint.sh"]
