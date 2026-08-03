#!/bin/bash
#
# check-arch-binaries.sh - before building a bundle for some CPU, check that
# every binary the bundle needs from somewhere else actually exists.
#
# A WeKan bundle for an architecture other than amd64 is assembled out of files
# that other projects publish: a Node.js build (nodejs.org, unofficial-builds, or
# the wekan/node fork), a FerretDB binary (wekan/FerretDB), and the MongoDB
# Database Tools (wekan/mongo-tools). Any of them can be absent - a fork build
# that has not finished, a release that skipped an architecture - and when one is,
# the build should stop HERE, saying which file is missing and where it should be
# published, rather than an hour later inside an emulated container with a 404 in
# the middle of an npm install.
#
# Usage:
#   check-arch-binaries.sh <arch> <node_arch> <ferretdb_arch> <node_version> [image] [platform]
#
#   arch           what WeKan calls this CPU        i386, armhf, loong64, ...
#   node_arch      what Node.js calls it            x86, armv7l, loong64, ...
#   ferretdb_arch  what wekan/FerretDB calls it     i386, armhf, ...
#   node_version   the Node.js major, e.g. 24
#   image          base image, e.g. debian:trixie   (optional; checked if given)
#   platform       docker platform, e.g. linux/386  (optional; needs image)
#
# Prints, on stdout, two lines for the caller to read:
#   node_full=vX.Y.Z
#   node_from=official|unofficial|fork
#
# Exits non-zero, having printed a ::error:: line per missing piece, if anything
# the bundle cannot be built without is absent. The MongoDB tools are the one
# exception: they are a convenience, FerretDB is the database, so a missing tool
# is a warning.

set -uo pipefail

arch="${1:?arch is required}"
node_arch="${2:?node_arch is required}"
ferretdb_arch="${3:?ferretdb_arch is required}"
node_version="${4:?node_version is required}"
image="${5:-}"
platform="${6:-}"

missing=0

# -I: ask for the headers only. A release binary is tens of megabytes and this
# runs for every architecture; there is nothing in the body worth downloading to
# answer "does it exist".
have() { curl -fsSLI -o /dev/null --retry 3 --retry-delay 5 "$1"; }

# ── 1. The base image has to publish this platform ───────────────────────────
#
# Without this the job dies 400 lines in, with docker saying "no matching
# manifest for linux/386 in the manifest list entries" - which is true of
# ubuntu:26.04 and was how the i386 and loong64 jobs failed.
if [ -n "$image" ] && [ -n "$platform" ]; then
    want_arch="$(printf '%s' "$platform" | cut -d/ -f2)"
    if docker manifest inspect "$image" >/tmp/manifest.json 2>/dev/null; then
        if ! grep -q "\"architecture\": *\"${want_arch}\"" /tmp/manifest.json; then
            echo "::error::${image} publishes no ${platform} image, so a ${arch} bundle cannot be built in a container of its own architecture. Either use a base image that has this platform - debian:trixie covers 386, amd64, arm/v5, arm/v7, arm64, ppc64le, riscv64 and s390x - or drop ${arch} from the matrix."
            missing=1
        else
            echo "base image ${image}: has ${platform}"
        fi
    else
        echo "::error::Cannot read the manifest of ${image}. Check the image name; without it there is no way to know whether ${platform} exists."
        missing=1
    fi
fi

# ── 2. Node.js ───────────────────────────────────────────────────────────────
node_full="$(curl -fsSL https://nodejs.org/dist/index.json |
    python3 -c "import json,sys; print(next(r['version'] for r in json.load(sys.stdin) if r['version'].startswith('v${node_version}.')))")"

node_full_wanted="$node_full"

if [ -z "$node_full" ]; then
    echo "::error::Could not resolve the newest Node.js ${node_version}.x from https://nodejs.org/dist/index.json ."
    exit 1
fi

official="https://nodejs.org/dist/${node_full}/node-${node_full}-linux-${node_arch}.tar.xz"
unofficial="https://unofficial-builds.nodejs.org/download/release/${node_full}/node-${node_full}-linux-${node_arch}.tar.xz"
fork="https://github.com/wekan/node/releases/download/${node_full}/node-${arch}"

node_from=""
node_url=""
if have "$official"; then
    node_from=official
    node_url="$official"
elif have "$unofficial"; then
    node_from=unofficial
    node_url="$unofficial"
elif have "$fork"; then
    node_from=fork
    node_url="$fork"
else
    # The fork lags nodejs.org: it builds the architectures nobody else does,
    # one release at a time, so the newest Node.js is often a version the fork
    # has not reached yet. Falling back to the fork's newest release that HAS
    # this CPU is better than failing - the alternative is no bundle at all for
    # that architecture until the fork catches up - but it is a DIFFERENT patch
    # version from the one the rest of the release was built against, so it is
    # said out loud rather than slipped in.
    fork_tag="$(curl -fsSL "https://api.github.com/repos/wekan/node/releases" 2>/dev/null |
        python3 -c "
import json,sys
want='node-${arch}'
try:
    for rel in json.load(sys.stdin):
        if any(a['name'] == want for a in rel.get('assets', [])):
            print(rel['tag_name']); break
except Exception:
    pass
" 2>/dev/null)"
    if [ -n "$fork_tag" ]; then
        node_from=fork
        node_full="$fork_tag"
        node_url="https://github.com/wekan/node/releases/download/${fork_tag}/node-${arch}"
        echo "::warning::The wekan/node fork has no node-${arch} for ${node_full_wanted:-the newest Node.js}, so ${fork_tag} is used instead - the newest release of the fork that has this CPU. The bundle therefore carries a Node.js one or more patch versions behind the other architectures. Build node-${arch} for the newer version in wekan/node to bring it back in line."
    fi
fi

if [ -z "$node_from" ]; then
    echo "::error::No Node.js for ${arch} exists anywhere yet. Looked at nodejs.org (${official}), unofficial-builds (${unofficial}), the wekan/node fork at that exact version (${fork}), and every wekan/node release for a node-${arch} asset. The fork is the one to fix: build node-${arch} with the node.yml workflow in wekan/node and attach it to a release, then re-run this job."
    missing=1
else
    echo "Node.js ${node_full} for ${arch}: ${node_from} (${node_url})"
fi

# ── 3. FerretDB ──────────────────────────────────────────────────────────────
#
# These architectures have no MongoDB server, so FerretDB is the database the
# bundle defaults to. Without it the bundle starts and then has nothing to talk
# to, which is a worse failure than not shipping it.
ferret="https://github.com/wekan/FerretDB/releases/latest/download/ferretdb-${ferretdb_arch}"
if have "$ferret"; then
    echo "FerretDB for ${ferretdb_arch}: present"
else
    echo "::error::No FerretDB binary for ${ferretdb_arch} at ${ferret} . FerretDB is the database this bundle defaults to, so the bundle would start with nothing to connect to. Build it in wekan/FerretDB and attach ferretdb-${ferretdb_arch} to its newest release, then re-run this job."
    missing=1
fi

# ── 4. MongoDB Database Tools - a convenience, not a requirement ─────────────
mt="https://github.com/wekan/mongo-tools/releases/latest/download"
absent=""
for t in bsondump mongodump mongoexport mongofiles mongoimport mongorestore mongostat mongotop; do
    have "${mt}/${t}-${ferretdb_arch}" || absent="${absent} ${t}"
done
if [ -n "$absent" ]; then
    echo "::warning::wekan/mongo-tools has no${absent} for ${ferretdb_arch}. The bundle ships without them rather than with the amd64 ones; FerretDB is the database and the launcher does not need them to start."
else
    echo "MongoDB Database Tools for ${ferretdb_arch}: all present"
fi

if [ "$missing" -ne 0 ]; then
    echo "::error::${arch}: stopped before building, because something the bundle needs does not exist yet. The ::error:: lines above name each missing file and where it should be published."
    exit 1
fi

printf 'node_full=%s\n' "$node_full"
printf 'node_from=%s\n' "$node_from"
printf 'node_url=%s\n' "$node_url"
