# The image is DISTROLESS: gcr.io/distroless/base-nossl-debian13 - glibc, CA
# certificates and tzdata - plus the C++ runtime node needs (libstdc++6,
# libgcc-s1, libatomic1), and nothing else. Not distroless cc-debian13: that
# adds libssl3t64 and libgomp1, which nothing here loads - node links OpenSSL
# statically, and no native module needs either - and which were 20 of its 55
# scanner findings. No shell, no apt, no
# coreutils, util-linux, login, tar or systemd libraries. Those were most of
# Artifact Hub's Trivy report of the image (218 findings in v13.30, 214 of them
# Debian packages WeKan never runs, none with a fix to update to). What runs is
# node, WeKan, and the static Go binaries FerretDB and the MongoDB tools; the
# entrypoint is Node.js (releases/ferretdb/wekan-entrypoint.mjs) because there
# is no bash to run a shell script with.
#
# Distroless publishes amd64, arm64, arm/v7, ppc64le, s390x and riscv64. It
# publishes no linux/386, so for 386 the same root - the same Debian 13
# packages, each with its dpkg record so a scanner still sees them - is
# assembled from debian:trixie into scratch (the runtime-root stage). That is
# also where every platform gets the C++ runtime, the same way.
#
# arm/v6 has neither: debian:trixie's manifest list has arm/v5 and arm/v7 and
# nothing between them, and containerd treats a LOWER ARM variant as compatible,
# so a linux/arm/v6 request would quietly resolve to the arm/v5 (armel,
# SOFT-float) userland the hard-float node-armv6 cannot run on. The docker job
# therefore asks the bases what they publish and drops a platform they lack; see
# docs/Platforms/FOSS/Container/Docker/CPU-platforms.md.

# FROM runtime-${TARGETARCH} below needs the platform in the global scope.
ARG TARGETARCH

# ── Stage 1: the release bundle, prepared ON THE BUILD MACHINE ───────────────
#
# Everything a release bundle needs is already done when this runs: each
# wekan-<version>-<arch>.zip was built by its own release-all.yml leg, with
# programs/server installed, its native modules built for that CPU, the
# security bumps applied, the tree trimmed and pruned, the telemetry check
# passed, and the Node.js for that CPU embedded as bundle/node - resolved by
# releases/resolve-node-source.sh and verified against the SHA256 its source
# published (embed-verified-node.sh / install-node-for-arch.sh).
#
# This image used to do all of it AGAIN, inside the target platform: apt-get
# a compiler toolchain, resolve and download Node.js, npm install, prune, bump,
# trim, prune, and purge the toolchain - seven times, six of them under QEMU.
# That was 27 of the docker job's 29 minutes in v12.32, for a result the .zip
# already was. So this stage runs with --platform=$BUILDPLATFORM, natively on
# the runner, for whichever TARGET it is building: it downloads that target's
# .zip, checks it against the release's own .sha256sum, re-runs the telemetry
# check, and checks that bundle/node really is a binary for the target CPU.
# Nothing in it executes target code, so nothing is emulated.
#
# The image's node is the bundle's own node: the same file the .zip ships,
# rather than a second download that had to agree with it.
FROM --platform=$BUILDPLATFORM debian:trixie AS bundle

ARG TARGETARCH
ARG TARGETVARIANT
ARG VERSION=13.30
ARG DEBIAN_FRONTEND=noninteractive

COPY --chmod=755 releases/check-telemetry.py /tmp/check-telemetry.py
COPY releases/risk-baseline.json /tmp/risk-baseline.json

RUN <<EOR
set -o xtrace
# Fail hard on any error so a missing release zip / failed download can never
# produce a "successful" image with an empty /build (Cannot find /build/main.js).
set -eo pipefail

apt-get update --assume-yes
apt-get install --assume-yes --no-install-recommends ca-certificates wget unzip python3

# Multi-arch mapping: Docker TARGETARCH -> WeKan's own platform name, which is
# the bundle .zip's name. amd64/arm64 have MongoDB Community;
# ppc64le/s390x/riscv64 have no MongoDB server and ship FerretDB v1 instead (the
# ferretdb binary is baked into their .zip and started by wekan-entrypoint.sh).
# Debian's 32-bit ARM port is armhf (ARMv7, VFPv3-D16), which is what
# linux/arm/v7 runs. ELF_MACHINE is the e_machine the bundle's node must carry.
case "${TARGETARCH}" in
    "amd64")   WEKAN_ARCH="amd64";   ELF_MACHINE=62  ;;
    "arm64")   WEKAN_ARCH="arm64";   ELF_MACHINE=183 ;;
    "ppc64le") WEKAN_ARCH="ppc64le"; ELF_MACHINE=21  ;;
    "s390x")   WEKAN_ARCH="s390x";   ELF_MACHINE=22  ;;
    "riscv64") WEKAN_ARCH="riscv64"; ELF_MACHINE=243 ;;
    "386")     WEKAN_ARCH="i386";    ELF_MACHINE=3   ;;
    # BOTH linux/arm/v6 and linux/arm/v7 arrive here as TARGETARCH=arm - the CPU
    # generation is in TARGETVARIANT, not in TARGETARCH - so this branch MUST read
    # the variant. Mapping "arm" straight to armhf, as it did, would hand an ARMv6
    # board (Raspberry Pi 1, Zero) the armhf bundle, which is built to Debian's
    # ARMv7-A baseline and whose instructions that board cannot execute.
    "arm")
        ELF_MACHINE=40
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

mkdir -p /work
cd /work
# Retry the release-asset download: even though the CI `docker` job needs the
# `release` job (so the asset is already uploaded), GitHub's
# releases/download/<tag>/<asset> URL can briefly return 404 right after upload
# (CDN/propagation lag). A plain wget treats 404 as fatal, which failed the
# build; retry on transient HTTP errors so propagation lag no longer breaks it.
WEKAN_ZIP="wekan-${VERSION}-${WEKAN_ARCH}.zip"
WEKAN_ZIP_URL="https://github.com/wekan/wekan/releases/download/v${VERSION}/${WEKAN_ZIP}"
wget --tries=20 --waitretry=20 --retry-on-http-error=404,403,500,502,503 "${WEKAN_ZIP_URL}" \
  || { echo "Failed to download ${WEKAN_ZIP_URL} after retries"; exit 8; }
wget --tries=20 --waitretry=20 --retry-on-http-error=404,403,500,502,503 "${WEKAN_ZIP_URL}.sha256sum" \
  || { echo "Failed to download ${WEKAN_ZIP_URL}.sha256sum after retries"; exit 8; }
# The file the image is built from is the file the release published.
sha256sum -c "${WEKAN_ZIP}.sha256sum"
unzip -q "${WEKAN_ZIP}"
rm "${WEKAN_ZIP}" "${WEKAN_ZIP}.sha256sum"
python3 /tmp/check-telemetry.py --bundle ./bundle

# The bundle's own node is the image's node, so it must be FOR the target CPU:
# a .zip of the wrong architecture would otherwise become an image whose node
# cannot start, and nothing here runs it to find out.
test -s bundle/node || { echo "${WEKAN_ZIP} has no bundle/node"; exit 1; }
python3 - "${ELF_MACHINE}" bundle/node <<'EOP'
import struct, sys
want, path = int(sys.argv[1]), sys.argv[2]
head = open(path, 'rb').read(20)
if head[:4] != b'\x7fELF':
    sys.exit(f'{path} is not an ELF binary')
got = struct.unpack('>H' if head[5] == 2 else '<H', head[18:20])[0]
if got != want:
    sys.exit(f'{path} is for ELF machine {got}, not {want}: the bundle is for another CPU')
print(f'{path}: ELF machine {got}, as expected')
EOP

# /out is laid out as the image's root: the app at /build, node on PATH, and
# the accounts. The image has no useradd, so /etc/passwd and /etc/group are
# written here: distroless's own root, nonroot and nobody, and wekan as
# 999:999 - the uid every earlier image's `useradd --system` gave it, which
# existing volumes are owned by and the Helm chart's init container chowns to.
# /owned holds what the wekan user must own: /data and its home.
mkdir -p /out/usr/local/bin /out/etc /owned/data /owned/home/wekan
cat > /out/etc/passwd <<'EOP'
root:x:0:0:root:/root:/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/sbin/nologin
nonroot:x:65532:65532:nonroot:/home/nonroot:/sbin/nologin
wekan:x:999:999:WeKan:/home/wekan:/sbin/nologin
EOP
cat > /out/etc/group <<'EOP'
root:x:0:
nogroup:x:65534:
nonroot:x:65532:
wekan:x:999:
EOP
mv bundle/node /out/usr/local/bin/node
chmod 755 /out/usr/local/bin/node
ln -s "/usr/local/bin/node" "/out/usr/local/bin/nodejs"
# The .zip's self-contained launchers start its bundled node; the image starts
# wekan-entrypoint.mjs instead. cpu-exec is a bash script, and the image has no
# bash: the entrypoint makes cpu-exec's decision itself, with the qemu-user that
# stays beside it. /build/ferretdb (used by the entrypoint) and the per-arch
# MongoDB Database Tools stay, for backup/restore inside the container.
rm -f bundle/start-wekan.sh bundle/start-wekan.bat bundle/cpu-exec
# The bundle's MongoDB tool launchers (mongodump, mongorestore, ...) are #!/bin/sh
# scripts that run the one program mongo-tools beside them (fetch-mongo-tools.sh).
# The image has no sh, but mongo-tools also picks the tool by the name it is run
# as, so here each launcher becomes a symlink to it: `docker exec wekan-app
# /build/mongodump ...` still works. Found by the line every launcher carries,
# so the list of tools is not written a second time here.
for launcher in $(grep -l 'mongo-tools beside this file' bundle/* 2>/dev/null); do
  ln -sf mongo-tools "$launcher"
done
mv bundle /out/build
EOR

# ── Stage 2: what the distroless root lacks, for the TARGET platform ─────────
#
# The only work that runs as the target CPU (under QEMU for all but amd64):
# fetch the newest Debian 13 packages and unpack them. Nothing of this stage is
# in the image except what is copied out of /extra and /rootfs. Each package
# also leaves its dpkg record in var/lib/dpkg/status.d/, the way distroless
# records its own, so Trivy and the other scanners list it rather than miss it.
FROM debian:trixie AS runtime-root
ARG TARGETARCH
ARG DEBIAN_FRONTEND=noninteractive
RUN <<EOR
set -o xtrace
set -eo pipefail
apt-get update --assume-yes
apt-get upgrade --assume-yes
unpack() {
  dest="$1"; shift
  mkdir -p "$dest/var/lib/dpkg/status.d" /work
  apt-get install --assume-yes --no-install-recommends "$@"
  (cd /work && apt-get download "$@")
  for pkg in "$@"; do
    dpkg-deb --extract /work/"${pkg}"_*.deb "$dest"
    dpkg-query --status "$pkg" > "$dest/var/lib/dpkg/status.d/$pkg"
  done
  rm -rf /work
}
# Every platform: the C++ runtime node needs (libstdc++.so.6, libgcc_s.so.1,
# libatomic.so.1), which distroless base-nossl does not have.
unpack /extra gcc-14-base libgcc-s1 libstdc++6 libatomic1
mkdir -p /rootfs
if [ "$TARGETARCH" = "386" ]; then
  # distroless base-nossl-debian13's packages, for the one platform it does not publish.
  unpack /rootfs base-files netbase tzdata ca-certificates libc6
  for d in bin sbin lib; do [ -e "/rootfs/$d" ] || ln -s "usr/$d" "/rootfs/$d"; done
  mkdir -p /rootfs/etc/ssl/certs /rootfs/tmp /rootfs/root /rootfs/home/nonroot
  chmod 1777 /rootfs/tmp
  chmod 700 /rootfs/root
  # The certificate bundle update-ca-certificates made; the package's sources
  # and its shell-script updater are not needed beside it.
  cp /etc/ssl/certs/ca-certificates.crt /rootfs/etc/ssl/certs/ca-certificates.crt
  rm -rf /rootfs/usr/share/ca-certificates /rootfs/usr/sbin/update-ca-certificates
  printf 'passwd: files\ngroup: files\nhosts: files dns\n' > /rootfs/etc/nsswitch.conf
fi
rm -rf /var/lib/apt/lists/*
EOR

# ── Stage 3: the runtime root, per platform ──────────────────────────────────
#
# Not pinned to a digest, for the same reason debian:trixie is not: distroless
# rebuilds it whenever Debian publishes a security update, and every release
# should get those. A platform not listed here has no runtime root, and the
# build for it stops at FROM runtime-${TARGETARCH}.
FROM gcr.io/distroless/base-nossl-debian13:nonroot AS distroless
FROM distroless AS runtime-amd64
FROM distroless AS runtime-arm64
FROM distroless AS runtime-arm
FROM distroless AS runtime-ppc64le
FROM distroless AS runtime-s390x
FROM distroless AS runtime-riscv64
FROM scratch AS runtime-386
COPY --from=runtime-root /rootfs/ /

# ── Stage 4: the image ───────────────────────────────────────────────────────
#
# No RUN from here on: there is no shell to run one with. Everything is COPY.
FROM runtime-${TARGETARCH}
LABEL maintainer="wekan"
LABEL org.opencontainers.image.ref.name="distroless-base-nossl-debian13"
LABEL org.opencontainers.image.version="debian13"
LABEL org.opencontainers.image.source="https://github.com/wekan/wekan"

ENV \
    DEBUG=false \
    DDP_TRANSPORT=sockjs \
    NODE_VERSION=v26.13.1 \
    METEOR_RELEASE=METEOR@3.6.1 \
    USE_EDGE=false \
    NPM_VERSION=12.2.3 \
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
    DEFAULT_AVATAR_URL="" \
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
    ADMIN_PANEL_ALLOWED_IP_ADDRESSES="" \
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
    LDAP_REJECT_UNAUTHORIZED=true \
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
    LDAP_GROUP_FILTER_NESTED=false \
    LDAP_MIGRATION_ALLOW_PASSWORD_LOGIN="" \
    LDAP_USER_ATTRIBUTES="" \
    LDAP_GROUP_BASEDN="" \
    OAUTH2_AVATAR_MAP="" \
    OAUTH2_MERGE_EXISTING_USERS="" \
    OAUTH2_ALLOWED_EMAIL_DOMAINS="" \
    OAUTH2_DEFAULT_ORGANIZATION="" \
    PROPAGATE_OIDC_DATA="" \
    OAUTH2_SECRET_JWT_KEY_PATH="" \
    OAUTH2_SECRET_JWT_ISSUER="" \
    OAUTH2_SECRET_JWT_KEY_ID="" \
    OAUTH2_SECRET_JWT_AUDIENCE="" \
    OAUTH2_SECRET_JWT_SUBJECT="" \
    OAUTH2_SECRET_JWT_EXPIRES_IN="" \
    CAS_MERGE_EXISTING_USERS="" \
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
    USERS_DISABLE_INACTIVE_AFTER_DAYS="" \
    LOGOUT_IDLE_MINUTES="" \
    REQUIRE_2FA="" \
    PASSWORD_MIN_LENGTH="" \
    PASSWORD_MIN_LENGTH_ENFORCE="" \
    PASSWORD_CHECK_PWNED="" \
    HSTS_MAX_AGE="" \
    HSTS_INCLUDE_SUBDOMAINS="" \
    HSTS_PRELOAD="" \
    ATTACHMENTS_RETENTION_DAYS="" \
    ATTACHMENTS_RETENTION_MODE="" \
    ATTACHMENTS_PURGE_DELETED_AFTER_DAYS="" \
    ATTACHMENTS_RETENTION_DRY_RUN="" \
    ATTACHMENTS_RETENTION_MAX_PER_RUN="" \
    BACKUP_KEEP_DAYS="" \
    ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT="" \
    INBOUND_IMAP_POLL_SECONDS="" \
    INBOUND_EMAIL_PER_ADDRESS_PER_HOUR="" \
    INBOUND_EMAIL_WEBHOOK_SECRET="" \
    INBOUND_EMAIL_MAX_BYTES="" \
    INBOUND_EMAIL_MAX_ATTACHMENT_BYTES="" \
    EMAIL_VIEW_SENDS_PER_HOUR="" \
    INBOUND_IMAP_DISABLED="" \
    WEKAN_DISK_MONITOR="" \
    WEKAN_DISK_WATCH_PATHS="" \
    WEKAN_RAM_MONITOR="" \
    CLOUD="" \
    WEKAN_IMPORT_RUN_STALE_MS="" \
    EVENTLOG_RETENTION_DAYS="" \
    LOGIN_ADDRESS_RETENTION_DAYS="" \
    LOGIN_ADDRESS_RECORDED="" \
    USERS_ANONYMIZE_INACTIVE_AFTER_DAYS="" \
    REGISTRATION_MINIMUM_AGE="" \
    BACKUP_PASSPHRASE="" \
    ATTACHMENTS_PASSPHRASE="" \
    ADMIN_AUDIT_RETENTION_DAYS="" \
    AUDIT_LOG_STDOUT="" \
    ACTIVITIES_RETENTION_DAYS="" \
    WORKLOAD_ABSENCE_RETENTION_DAYS="" \
    WORKLOAD_ABSENCE_TYPE_RECORDED="" \
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
    SAML_MERGE_EXISTING_USERS=false \
    SAML_IDP_PROFILE="" \
    SAML_WANT_RESPONSE_SIGNED="" \
    SAML_WANT_ASSERTIONS_SIGNED="" \
    SAML_LOGIN_FLOW="" \
    OAUTH_GOOGLE_ENABLED=false \
    OAUTH_GOOGLE_CLIENT_ID="" \
    OAUTH_GOOGLE_SECRET="" \
    OAUTH_GOOGLE_SECRET_FILE="" \
    OAUTH_GITHUB_ENABLED=false \
    OAUTH_GITHUB_CLIENT_ID="" \
    OAUTH_GITHUB_SECRET="" \
    OAUTH_GITHUB_SECRET_FILE="" \
    OAUTH_FACEBOOK_ENABLED=false \
    OAUTH_FACEBOOK_APP_ID="" \
    OAUTH_FACEBOOK_SECRET="" \
    OAUTH_FACEBOOK_SECRET_FILE="" \
    OAUTH_TWITTER_ENABLED=false \
    OAUTH_TWITTER_CONSUMER_KEY="" \
    OAUTH_TWITTER_SECRET="" \
    OAUTH_TWITTER_SECRET_FILE="" \
    OAUTH_METEOR_DEVELOPER_ENABLED=false \
    OAUTH_METEOR_DEVELOPER_CLIENT_ID="" \
    OAUTH_METEOR_DEVELOPER_SECRET="" \
    OAUTH_METEOR_DEVELOPER_SECRET_FILE="" \
    OAUTH_WEIBO_ENABLED=false \
    OAUTH_WEIBO_CLIENT_ID="" \
    OAUTH_WEIBO_SECRET="" \
    OAUTH_WEIBO_SECRET_FILE="" \
    OAUTH_MEETUP_ENABLED=false \
    OAUTH_MEETUP_CLIENT_ID="" \
    OAUTH_MEETUP_SECRET="" \
    OAUTH_MEETUP_SECRET_FILE="" \
    OAUTH_PROVIDERS_LOGIN_STYLE="redirect" \
    OAUTH_PROVIDERS_MERGE_EXISTING_USERS=false \
    OAUTH_PROVIDERS_ALLOWED_EMAIL_DOMAINS="" \
    PASSWORDLESS_ENABLED=false \
    ORACLE_OIM_ENABLED=false \
    WAIT_SPINNER="" \
    WRITABLE_PATH=/data \
    S3="" \
    MAIL_URL_FILE="" \
    MONGO_URL_FILE="" \
    S3_SECRET_KEY_FILE=""

COPY --from=runtime-root /extra/ /
# The bundle and its node, prepared in stage 1. npm is not in this image at all:
# nothing here installs anything, and the entrypoint never calls it.
COPY --from=bundle /out/ /
# Only /data and wekan's home are the wekan user's; /home itself stays root's.
COPY --from=bundle --chown=999:999 /owned/data /data
COPY --from=bundle --chown=999:999 /owned/home/wekan /home/wekan

# Database-backend selector entrypoint. Every arch's bundle ships a FerretDB
# binary (baked into the .zip and moved to /build/ferretdb above); this starts
# FerretDB v1 (SQLite) or leaves the DB external based on WEKAN_DB and the
# /build/.ferretdb-default marker (present only on MongoDB-less arches). See
# releases/ferretdb/wekan-entrypoint.mjs.
COPY --chmod=644 releases/ferretdb/wekan-entrypoint.mjs /build/wekan-entrypoint.mjs
# #6492: standalone "recovering data" page the entrypoint serves as a brief bridge on
# the web port while a just-restored FerretDB comes back up during a data recovery.
COPY --chmod=644 releases/ferretdb/recovery-bridge.mjs /build/recovery-bridge.mjs
# #6595: the entrypoint asks this whether the database answers yet, so it can
# serve the "waiting for database" page instead of leaving the web port unbound
# for a reverse proxy to time out on.
COPY --chmod=644 releases/ferretdb/db-ready.mjs /build/db-ready.mjs

# UCS runs this same image with an explicit migration command,
# `/usr/local/bin/node /opt/ucs-migration/start.mjs`. Only that temporary
# container receives the Docker socket; normal startup is unchanged.
COPY releases/ucs-migration /opt/ucs-migration
COPY --chmod=755 releases/ucs-migration/tools /opt/ucs-migration/tools

COPY releases/nextcloud/capability.json /build/nextcloud-exapp-capability.json

USER wekan
ENV PORT=8080
EXPOSE $PORT
STOPSIGNAL SIGKILL
WORKDIR /build

CMD ["/usr/local/bin/node", "/build/wekan-entrypoint.mjs"]
