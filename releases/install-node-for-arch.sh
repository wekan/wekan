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
#   NODE_FULL   the exact version, e.g. v24.18.1
#   NODE_ARCH   what Node.js calls this CPU  (x86, armv7l, ppc64le, ...)
#   ARCH        what WeKan calls it          (i386, armhf, ppc64le, ...)
#   NODE_FROM   which source has it: official | unofficial | fork
#   NODE_URL    the exact URL it is at
#   NODE_SHA256 its published SHA256, or empty when the source publishes none
#               Both are resolved on the HOST by the preflight step, so this
#               does not probe the network three times over an emulated CPU -
#               and so the fork's URL is right even when the fork's newest
#               release is a different version from nodejs.org's newest, which
#               it usually is: the fork builds the CPUs nobody else does, one
#               release at a time, and lags behind.

set -eux

export DEBIAN_FRONTEND=noninteractive

apt-get update -qq
apt-get install -y -q build-essential python3 curl xz-utils ca-certificates

# The first two sources ship a TARBALL - node, npm and the whole runtime. The
# fork ships the BARE BINARY it built, because that is the one thing missing, so
# when the fork serves, npm comes from the official amd64 tarball of the same
# version. npm is JavaScript and runs on whatever node executes it, so an npm
# built for one CPU drives a node built for another.
mkdir -p /opt/node/bin

# Download a file and check it against the SHA256 its source publishes.
#
# nodejs.org and unofficial-builds are preferred over the fork precisely BECAUSE
# they publish a checksum, so not checking it would be preferring them for
# nothing. The fork publishes one now too.
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

case "$NODE_FROM" in
    official|unofficial)
        download_and_verify "$NODE_URL" /tmp/node.tar.xz
        tar -xJf /tmp/node.tar.xz -C /opt/node --strip-components=1
        ;;
    fork)
        download_and_verify "$NODE_URL" /opt/node/bin/node
        chmod +x /opt/node/bin/node
        curl -fsSL -o /tmp/npm.tar.xz \
            "https://nodejs.org/dist/${NODE_FULL}/node-${NODE_FULL}-linux-x64.tar.xz"
        mkdir -p /tmp/npm
        tar -xJf /tmp/npm.tar.xz -C /tmp/npm --strip-components=1
        cp -a /tmp/npm/lib /opt/node/
        cp -a /tmp/npm/bin/npm /tmp/npm/bin/npx /opt/node/bin/
        ;;
    *)
        echo "install-node-for-arch.sh: NODE_FROM is '${NODE_FROM}', which is not" \
             "one of official/unofficial/fork. The preflight step in" \
             "release-all.yml decides this and should have stopped the job" \
             "before here." >&2
        exit 1
        ;;
esac

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
