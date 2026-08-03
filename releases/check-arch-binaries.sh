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
# Prints, on stdout, three lines for the caller to read:
#   node_full=vX.Y.Z                        the version that was found
#   node_from=official|unofficial|fork      where it was found
#   node_url=https://...                    the exact file to download
#
# The version is the NEWEST that exists FOR THIS CPU, which is not always the
# newest that exists - see the walk below.
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
#
# THE FORK FIRST, for every CPU. wekan/node is not just "the architectures
# nobody else builds" any more - it builds all of them, and it carries fixes
# upstream does not (CHANGELOG-fork.md: the ICU genccode architecture name, the
# x86 /SAFESEH opt-out, the zlib SSE2 and NEON flags, the V8 template
# disambiguator). Those are build-configuration fixes that any platform
# benefits from, and a set of bundles should not be half built on one Node.js
# and half on another depending on which CPU it is for.
#
# nodejs.org and unofficial-builds stay as fallbacks, in that order, for the
# case the fork has not published a version yet.
#
# And the rule is still "the NEWEST Node.js that exists for this CPU", not "the
# newest Node.js". Those are the same thing on amd64 and arm64 and regularly are
# not anywhere else - each source builds on its own schedule, so the further a
# CPU is off the beaten path the further behind its newest build tends to be.
# This walks the 24.x versions from newest down and asks all three sources at
# each one; the first hit wins, which is by construction the newest build that
# exists anywhere for this CPU.
#
# The walk stops after MAX_VERSIONS_BACK. A CPU whose newest build is a dozen
# releases old is not "slightly behind", it is unmaintained, and saying so is
# more use than silently shipping something from last year.
MAX_VERSIONS_BACK=12

versions="$(curl -fsSL https://nodejs.org/dist/index.json |
    python3 -c "
import json,sys
major='v${node_version}.'
print('\n'.join(r['version'] for r in json.load(sys.stdin) if r['version'].startswith(major)))
")"

if [ -z "$versions" ]; then
    echo "::error::Could not list Node.js ${node_version}.x versions from https://nodejs.org/dist/index.json ."
    exit 1
fi

node_full_wanted="$(printf '%s\n' "$versions" | head -n 1)"

node_from=""
node_full=""
node_url=""
tried=0

for v in $versions; do
    tried=$((tried + 1))
    [ "$tried" -gt "$MAX_VERSIONS_BACK" ] && break

    o="https://nodejs.org/dist/${v}/node-${v}-linux-${node_arch}.tar.xz"
    u="https://unofficial-builds.nodejs.org/download/release/${v}/node-${v}-linux-${node_arch}.tar.xz"
    f="https://github.com/wekan/node/releases/download/${v}/node-${arch}"

    # The fork first - see the note above.
    if   have "$f"; then node_from=fork;       node_url="$f"; node_full="$v"; break
    elif have "$o"; then node_from=official;   node_url="$o"; node_full="$v"; break
    elif have "$u"; then node_from=unofficial; node_url="$u"; node_full="$v"; break
    fi
done

if [ -z "$node_from" ]; then
    newest="$node_full_wanted"
    oldest="$(printf '%s\n' "$versions" | head -n "$MAX_VERSIONS_BACK" | tail -n 1)"
    echo "::error::No Node.js for ${arch} exists anywhere. Checked every ${node_version}.x release from ${newest} back to ${oldest} at the wekan/node fork (asset 'node-${arch}'), nodejs.org and unofficial-builds (node_arch '${node_arch}'). The fork is the one to fix: build node-${arch} with the node.yml workflow in wekan/node and attach it to a release, then re-run this job."
    missing=1
elif [ "$node_full" != "$node_full_wanted" ]; then
    # Behind, but the newest that exists - which is the best this CPU can have.
    echo "::warning::${arch} gets Node.js ${node_full} from ${node_from}, not the newest ${node_full_wanted}: no source has node-${arch} (or ${node_arch}) for ${node_full_wanted} yet. This is the newest build that exists for this CPU. To bring it in line, build node-${arch} for ${node_full_wanted} in wekan/node."
    echo "Node.js ${node_full} for ${arch}: ${node_from} (${node_url})"
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
