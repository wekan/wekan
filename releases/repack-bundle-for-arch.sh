#!/bin/bash
#
# repack-bundle-for-arch.sh - turn the amd64 bundle in ./bundle into one
# architecture's release zip, and check the result is a bundle that can start.
#
# ONE copy of this, used by both release-all.yml (which unpacks the bundle it
# just built) and release-all-missing.yml (which downloads the amd64 zip already
# on the release). Only build-amd64 runs Meteor; every other bundle WeKan ships
# - arm64, win64, mac-arm64 and the six extra architectures - is this same amd64
# bundle with its native modules rebuilt, its Node.js swapped and its database
# binaries replaced. So "build the ones a release is missing" is this script,
# run for those architectures, and it had better be the same script or the
# bundle added later would differ from the ones beside it.
#
# Environment:
#   ARCH           what WeKan calls the platform (s390x, i386, armhf, ...)
#   NODE_ARCH      what the Node.js download calls it (x86 for i386, armv7l for armhf)
#   FERRETDB_ARCH  what the wekan/FerretDB release calls it
#   IMAGE          base image for the emulated container (debian:trixie)
#   PLATFORM       docker platform (linux/386, linux/s390x, ...)
#   VERSION        WeKan version, no leading v
#   NODE_VERSION   Node.js major version
#
# Expects ./bundle (the unpacked amd64 bundle) and ./releases to exist, and
# docker with QEMU already set up by the caller.
#
# Produces  wekan-$VERSION-$ARCH.zip, its .sha256sum, and provenance/$ARCH.tsv.

set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp
# Older macOS has no sha256sum; shasum -a 256 prints the same "hash  file" lines and takes -c.
command -v sha256sum >/dev/null 2>&1 || sha256sum() { shasum -a 256 "$@"; }

: "${ARCH:?ARCH is required}"
: "${NODE_ARCH:?NODE_ARCH is required}"
: "${FERRETDB_ARCH:?FERRETDB_ARCH is required}"
: "${IMAGE:?IMAGE is required}"
: "${PLATFORM:?PLATFORM is required}"
: "${VERSION:?VERSION is required}"
: "${NODE_VERSION:?NODE_VERSION is required}"

[ -d bundle ] || { echo "::error::no ./bundle to repack for $ARCH"; exit 1; }

# ── Everything this bundle needs from another project's releases, checked
# BEFORE any of it is used: a base image for this CPU, a Node.js build for it,
# the FerretDB binary, the MongoDB tools. Any of them can be absent - a fork
# build that has not finished, a release that skipped an architecture - and when
# one is, stop HERE naming which file is missing and where it should be
# published, rather than an hour later inside an emulated container with a 404
# in the middle of an npm install.
bash releases/check-arch-binaries.sh \
  "$ARCH" "$NODE_ARCH" "$FERRETDB_ARCH" "$NODE_VERSION" "$IMAGE" "$PLATFORM" \
  | tee "$TMPDIR/preflight.txt"

NODE_FULL="$(sed -n 's/^node_full=//p'   "$TMPDIR/preflight.txt")"
NODE_FROM="$(sed -n 's/^node_from=//p'   "$TMPDIR/preflight.txt")"
NODE_URL="$(sed -n 's/^node_url=//p'     "$TMPDIR/preflight.txt")"
NODE_SHA256="$(sed -n 's/^node_sha256=//p' "$TMPDIR/preflight.txt")"

bash releases/record-provenance.sh "$ARCH" 'Node.js' \
  "$NODE_FROM" "$NODE_FULL" "$NODE_URL" "${NODE_SHA256:-}"

# ── Native modules, rebuilt for the target under emulation ───────────────────
# bcrypt 5.0.1 (Meteor accounts-password) ships node-addon-api@3 which fails to
# compile on Node 26; the npm install inside the container compiles it (and any
# other native module) for the target arch.
BCRYPT_DIR="$(pwd)/bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt"
if [ -d "$BCRYPT_DIR" ]; then
  (cd "$BCRYPT_DIR" && npm install --no-save node-addon-api@^8 >/dev/null 2>&1 || true)
fi

echo "Using Node ${NODE_FULL} (${NODE_ARCH}) for ${ARCH}, from ${NODE_FROM}"

# The official node:${NODE_VERSION} image publishes only amd64 and arm64, so
# `docker run --platform linux/s390x node:24-slim` fails with "no matching
# manifest". Run a plain distribution image that does publish this architecture
# and install Node.js inside it.
#
# The container script is a FILE, mounted in. It used to be an inline
# `bash -c '...'` and it contains apostrophes - which a single-quoted shell
# argument cannot hold. The first one ENDED the string, the rest became separate
# words, and ${NODE_ARCH} was left to the RUNNER's shell, which does not have
# it. So every one of these jobs asked nodejs.org for
# "node-v24.18.1-linux-.tar.xz", with an empty architecture, and died on the 404
# - four of the six failures in the v10.57 run. A file has no quoting layer to
# get wrong, and `bash -n` can check it.
# The container's own /tmp is a small part of its writable layer: its /tmp is
# this repository's .tools/tmp/repack-<arch>-tmp, where the Node.js download
# and its unpacking happen (releases/install-node-for-arch.sh uses $TMPDIR).
CONTAINER_TMP="$TMPDIR/repack-$ARCH-tmp"
mkdir -p "$CONTAINER_TMP" && chmod 1777 "$CONTAINER_TMP"
docker run --rm --platform "$PLATFORM" \
  -e NODE_FULL="$NODE_FULL" \
  -e NODE_FROM="$NODE_FROM" \
  -e NODE_URL="$NODE_URL" \
  -e NODE_SHA256="$NODE_SHA256" \
  -e ARCH="$ARCH" \
  -e NODE_ARCH="$NODE_ARCH" \
  -e TMPDIR=/tmp \
  -v "$CONTAINER_TMP:/tmp" \
  -v "$(pwd)/bundle:/bundle" \
  -v "$(pwd)/releases:/releases:ro" \
  -w /bundle/programs/server \
  "$IMAGE" \
  bash /releases/install-node-for-arch.sh
rmdir "$CONTAINER_TMP" 2>/dev/null || true

# ── FerretDB, this architecture's own ────────────────────────────────────────
# These arches have no MongoDB server, so FerretDB is their default DB. The
# launcher (start-wekan.sh) is inherited from the amd64 base bundle; download
# only this arch's binary. A marker file makes FerretDB the default backend at
# runtime (see the launcher + Docker entrypoint).
#
# FERRETDB_ARCH, not ARCH: FerretDB names the 32-bit ARM asset armhf and the
# 32-bit x86 one i386, which is what we call them too - but the two names are
# kept separate so a platform whose Node.js name, FerretDB name and our own name
# disagree cannot silently download the wrong CPU's binary.
#
# The prebuilt SQLite-only ferretdb-sqlite-<arch> from the newest wekan/FerretDB
# release that has it - the full ferretdb-<arch> of the newest release until one
# does - verified against its .sha256sum (a mismatch stops the repack; a release
# that publishes no checksum is recorded as unverified). releases/ferretdb-asset.sh
# says in the log which one it took, and hands back the tag, URL and checksum
# the provenance table records.
ferret_meta="$(bash releases/ferretdb-asset.sh "$FERRETDB_ARCH" -o bundle/ferretdb)" \
  || { echo "::error::FerretDB for ${FERRETDB_ARCH} could not be put in the bundle; the lines above say why."; exit 1; }
eval "$ferret_meta"
bash releases/record-provenance.sh "$ARCH" 'FerretDB' \
  'wekan/FerretDB' "${FERRET_TAG:-latest}" "$FERRET_URL" "$FERRET_SHA"

# ── MongoDB Database Tools, this architecture's own ──────────────────────────
# Replace the inherited amd64 tools. Tolerant: wekan/mongo-tools-patches does
# not publish every arch this bundle is built for, and a missing mongodump is a
# missing convenience, not a broken bundle - FerretDB is the database and the
# launcher does not need these to start. A silently-amd64 tool would be worse,
# so fetch-mongo-tools.sh removes the inherited ones before anything else.
rc=0; bash "$(dirname "${BASH_SOURCE[0]}")/fetch-mongo-tools.sh" bundle "${FERRETDB_ARCH}" || rc=$?
[ "$rc" != 2 ] || exit 1
[ "$rc" = 0 ] || echo "::warning::No MongoDB Database Tools for ${FERRETDB_ARCH} in wekan/mongo-tools-patches; the bundle ships without them rather than with the wrong CPU's."
touch bundle/.ferretdb-default

# ── The zip, and whether it is one that works ────────────────────────────────
zip="wekan-${VERSION}-${ARCH}.zip"
rm -f "$zip"
python3 "$(dirname "${BASH_SOURCE[0]}")/check-telemetry.py" --bundle bundle || exit 1
zip -r "$zip" bundle

# A zip that EXISTS is not a zip that WORKS, and the log should say which of the
# two this is. The size answers "was the bundle directory empty when it was
# zipped"; the entries answer "can this bundle start at all" - bundle/main.js is
# what the launcher runs, bundle/node is the runtime the zip promises to carry.
if [ ! -f "$zip" ]; then
  echo "::error::$zip was not created. The repack above produced no bundle - its log says why."
  exit 1
fi
bytes=$(wc -c < "$zip")
if [ "$bytes" -lt 10000000 ]; then
  echo "::error::$zip is only $bytes bytes; a whole bundle is tens of megabytes. The bundle directory was empty or nearly so."
  exit 1
fi
# Listing to a FILE first: `unzip -l "$zip" | grep -q` ends unzip with SIGPIPE
# the moment grep matches, and `set -o pipefail` then reports 141 for the
# pipeline - so a found file reads as a missing one. It is what broke the win64
# verify twice; these have only been lucky about the size of the pipe buffer.
unzip -l "$zip" > zip-listing.txt
for want in bundle/main.js bundle/node; do
  if ! grep -q " $want$" zip-listing.txt; then
    echo "::error::$zip has no $want, so it cannot start WeKan. The embed step above did not put it into the bundle."
    exit 1
  fi
done
echo "OK: $zip is $((bytes/1024/1024)) MiB and contains bundle/main.js and bundle/node."

sha256sum "$zip" > "${zip}.sha256sum"
cat "${zip}.sha256sum"

mkdir -p provenance
[ -f provenance.tsv ] && mv provenance.tsv "provenance/${ARCH}.tsv" || true
