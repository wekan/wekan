#!/bin/bash
#
# install-node-for-arch.sh - install a target-CPU Node.js inside the build
# container, rebuild the bundle's native modules with it, and put that Node.js
# into the bundle.
#
# Run INSIDE the emulated container by the build-extra-arches job of
# .github/workflows/release-all.yml, which mounts the repository at /src and the
# bundle at /bundle.
#
# It lives in a file rather than inline in the workflow because it used to be
# inline, as `bash -c '...'`, and it contained apostrophes. A single-quoted
# shell argument cannot hold an apostrophe: the first one ENDED the string, the
# rest of the script became separate words, and ${NODE_ARCH} was left to be
# expanded by the RUNNER's shell instead of the container's - where it does not
# exist. So every one of these jobs asked nodejs.org for
# "node-v24.18.1-linux-.tar.xz", with an empty architecture, and died on the 404.
# A file has no quoting layer to get wrong, and `bash -n` can check it.
#
# Environment (all set by the workflow):
#   NODE_FULL   the exact fork tag, e.g. v24.19.0
#   NODE_ARCH   what Node.js calls this CPU  (x86, armv7l, ppc64le, ...) - used
#               only to name the amd64 npm tarball; the node binary is the fork's
#   ARCH        what WeKan calls it          (i386, armhf, ppc64le, ...)
#   NODE_FROM   always "fork" - WeKan takes its Node.js only from the wekan/node
#               fork, so it can rebuild it from source (see check-arch-binaries.sh)
#   NODE_URL    the exact fork binary URL it is at
#   NODE_SHA256 its published SHA256, empty only for a very old fork release
#               All resolved on the HOST by the preflight step, so this does not
#               probe the network over an emulated CPU - and so the fork's URL is
#               right even when the fork's newest build for this CPU is an older
#               tag than its newest release: the fork builds the exotic CPUs one
#               at a time, so an arch can lag a tag or two behind.

set -eux

export DEBIAN_FRONTEND=noninteractive

apt-get update -qq
apt-get install -y -q build-essential python3 curl xz-utils ca-certificates

# The fork ships the BARE node BINARY it built - just node, no npm - because the
# node binary is the one thing that has to be for THIS CPU. npm is JavaScript, so
# it runs on whatever node executes it; it comes from the official amd64 tarball
# of the same version and drives the fork's node for this arch all the same. Only
# the node binary WeKan SHIPS is the fork's; the build-time npm need not be.
mkdir -p /opt/node/bin

# Download a file and check it against the SHA256 the fork publishes beside it.
#
# The fork publishes a node-${arch}.sha256sum next to every binary; the preflight
# read it and passed it here as NODE_SHA256, and the download is refused if it
# does not match - a binary this project cannot verify is not one it ships.
#
# A mismatch is retried before it is fatal. The overwhelmingly likely cause is a
# truncated or corrupted transfer - a CDN edge that served a partial file, a
# connection cut mid-stream - and that is fixed by asking again. What retrying
# must NOT do is give up quietly: if the file still does not match after
# DOWNLOAD_ATTEMPTS tries, the build stops, because at that point the file being
# served is not the file that was published and there is no reading of that
# worth continuing on.
DOWNLOAD_ATTEMPTS="${DOWNLOAD_ATTEMPTS:-3}"

download_and_verify() {
    url="$1"
    dest="$2"
    expected="${NODE_SHA256:-}"

    attempt=1
    while :; do
        rm -f "$dest"
        if ! curl -fsSL --retry 3 --retry-delay 5 -o "$dest" "$url"; then
            if [ "$attempt" -lt "$DOWNLOAD_ATTEMPTS" ]; then
                echo "Download of $(basename "$url") failed (attempt ${attempt}/${DOWNLOAD_ATTEMPTS}); retrying."
                attempt=$((attempt + 1))
                sleep 5
                continue
            fi
            echo "install-node-for-arch.sh: could not download ${url} after ${DOWNLOAD_ATTEMPTS} attempts." >&2
            exit 1
        fi

        if [ -z "$expected" ]; then
            echo "No published SHA256 for $(basename "$url") - ${NODE_FROM} publishes none, so this download is unverified."
            return 0
        fi

        got="$(sha256sum "$dest" | cut -d' ' -f1)"
        if [ "$got" = "$expected" ]; then
            echo "SHA256 verified against ${NODE_FROM}: ${got}"
            return 0
        fi

        echo "SHA256 mismatch on $(basename "$url") (attempt ${attempt}/${DOWNLOAD_ATTEMPTS})." >&2
        echo "  published: ${expected}" >&2
        echo "  got:       ${got}" >&2
        if [ "$attempt" -lt "$DOWNLOAD_ATTEMPTS" ]; then
            echo "  Most likely a truncated transfer; downloading again." >&2
            attempt=$((attempt + 1))
            sleep 5
            continue
        fi
        echo "install-node-for-arch.sh: $(basename "$url") still does not match its published SHA256 after ${DOWNLOAD_ATTEMPTS} attempts. The file being served is not the file that was published. Not building." >&2
        exit 1
    done
}

# WeKan's Node.js comes only from the fork, which ships the bare node binary.
# NODE_FROM is always "fork"; anything else means the preflight in release-all.yml
# handed this script a source it no longer supports, and it stops rather than
# guessing.
if [ "${NODE_FROM}" != "fork" ]; then
    echo "install-node-for-arch.sh: NODE_FROM is '${NODE_FROM}', but WeKan takes" \
         "its Node.js only from the wekan/node fork. The preflight step in" \
         "release-all.yml decides this and should have set NODE_FROM=fork." >&2
    exit 1
fi

# The fork's bare node binary for THIS CPU, verified against its .sha256sum.
download_and_verify "$NODE_URL" /opt/node/bin/node
chmod +x /opt/node/bin/node
# npm from the official amd64 tarball of the same version - JavaScript, so it runs
# on the fork's node for this arch. This tarball is a build-time tool, not what
# WeKan ships; the shipped node is the fork's, above.
curl -fsSL -o /tmp/npm.tar.xz \
    "https://nodejs.org/dist/${NODE_FULL}/node-${NODE_FULL}-linux-x64.tar.xz"
mkdir -p /tmp/npm
tar -xJf /tmp/npm.tar.xz -C /tmp/npm --strip-components=1
cp -a /tmp/npm/lib /opt/node/
cp -a /tmp/npm/bin/npm /tmp/npm/bin/npx /opt/node/bin/

export PATH=/opt/node/bin:$PATH

# The binary has to BE for this CPU and it has to RUN. A bundle shipping a node
# that cannot start is the one failure that would otherwise reach the person who
# downloads it, and it is one command to rule out.
if ! node --version; then
    echo "install-node-for-arch.sh: the Node.js binary for ${ARCH} does not run" \
         "in a ${ARCH} container. It came from ${NODE_FROM}; it is either built" \
         "for the wrong CPU or truncated." >&2
    exit 1
fi

npm install

# Bundle the target-arch Node.js for the self-contained launcher. /bundle is the
# host's bundle/ directory, mounted by the workflow.
cp /opt/node/bin/node /bundle/node
chmod +x /bundle/node

# #6458: replace the inherited amd64 qemu-user with this arch's own same-arch
# qemu-user (from the target-arch distribution, so it runs on this arch), used
# by bundle/cpu-exec to emulate CPU features a binary needs but the host CPU
# lacks. Tolerant: if the package is unavailable on this arch, the bundle just
# ships without it - cpu-exec then falls back to a system qemu-user, or reports.
rm -f /bundle/qemu-x86_64
if apt-get install -y -q qemu-user-static >/dev/null 2>&1 &&
   [ -x "/usr/bin/qemu-$(uname -m)-static" ]; then
    cp "/usr/bin/qemu-$(uname -m)-static" "/bundle/qemu-$(uname -m)"
    chmod +x "/bundle/qemu-$(uname -m)"
    echo "Bundled qemu-$(uname -m) for cpu-exec."
else
    echo "qemu-user-static not available for $(uname -m); bundle ships without a bundled qemu-user."
fi
