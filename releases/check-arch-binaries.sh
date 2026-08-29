#!/bin/bash
#
# check-arch-binaries.sh - before building a bundle for some CPU, check that
# every binary the bundle needs from somewhere else actually exists.
#
# A WeKan bundle for an architecture other than amd64 is assembled out of files
# that other projects publish: a Node.js build (official nodejs.org, then
# unofficial-builds, then wekan/node-patches - see §2), a FerretDB binary
# (wekan/FerretDB), and the MongoDB Database Tools (wekan/mongo-tools-patches). Any of
# them can be absent - a build that has not finished, a release that skipped an
# architecture - and when one is, the build should stop HERE, saying which file
# is missing and where it should be published, rather than an hour later inside
# an emulated container with a 404 in the middle of an npm install.
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
# Prints, on stdout, the lines the caller reads:
#   node_full=vX.Y.Z                        the version that was found
#   node_from=official|unofficial|node-patches   which of the three sources has it
#   node_url=https://...                    the exact file to download
#   node_kind=tar.xz|zip|binary             what that file is
#   node_member=node-vX.Y.Z-linux-x64/bin/node   the node inside an archive
#   node_sha256=<hex>                       the SHA256 that source published
#
# or, when NO source has a Node.js for this CPU:
#   skip=true                               do not build this platform this time
#
# The version is the NEWEST that exists FOR THIS CPU, which is not always the
# newest that exists - see resolve-node-source.sh's walk.
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
# best-effort: this CPU may have no BASE IMAGE for its own architecture
# (loong64), so there is no userland to rebuild the native modules in. Such an
# arch is skipped rather than failing the whole matrix.
#
# It no longer governs the NODE.JS answer: an arch whose Node.js exists at none
# of the three sources is skipped whether or not it is marked optional, because
# not building a platform nobody publishes a runtime for is the intended
# behaviour and not a degraded one.
optional="${7:-}"

missing=0
skip=0

# -I: ask for the headers only. A release binary is tens of megabytes and this
# runs for every architecture; there is nothing in the body worth downloading to
# answer "does it exist".
# Three outcomes: 0 present, 1 absent, 2 the server would not say. The third
# used to be indistinguishable from the second, so a github.com 503 read as "no
# Node.js is published for riscv64 yet" and skipped an architecture that was
# fine. `have` keeps its two answers for the callers below; `have_or_unknown`
# stops the job when nobody could tell.
have_or_unknown() { bash "$(dirname "$0")/fetch.sh" --check "$1"; }
have() {
  have_or_unknown "$1"
  case $? in
    0) return 0 ;;
    1) return 1 ;;
    *) echo "::error::Could not tell whether $1 exists - the server did not answer. That is an outage, not a missing binary: re-run this job rather than skip this architecture." >&2
       exit 1 ;;
  esac
}

# ── 1. The base image has to publish this platform ───────────────────────────
#
# Without this the job dies 400 lines in, with docker saying "no matching
# manifest for linux/386 in the manifest list entries" - which is true of
# ubuntu:26.04 and was how the i386 and loong64 jobs failed.
#
# The VARIANT is part of the platform, and leaving it out is not a near miss: on
# 32-bit ARM it turns a clean "this image does not exist" into a bundle built in
# the WRONG userland. `docker manifest inspect debian:trixie` lists arm/v5 and
# arm/v7 and no arm/v6 - Debian has no ARMv6 port - but an architecture-only
# grep for "arm" matches, so the check passed and `docker run --platform
# linux/arm/v6` then resolved DOWNWARDS to arm/v5, Debian armel: ARMv5,
# SOFT-float, with no /lib/ld-linux-armhf.so.3 in it. The hard-float node-armv6
# cannot start there, and that is how the armv6 job died in v10.80:
#
#   qemu-arm: Could not open '/lib/ld-linux-armhf.so.3': No such file or directory
#
# 400 lines in, after the whole apt install. Comparing architecture AND variant
# is what makes "publishes no linux/arm/v6" the answer at the top instead.
if [ -n "$image" ] && [ -n "$platform" ]; then
    want_arch="$(printf '%s' "$platform" | cut -d/ -f2)"
    want_variant="$(printf '%s' "$platform" | cut -d/ -f3-)"
    # Docker Hub occasionally refuses one unauthenticated manifest request
    # while all binary hosts answer normally. One attempt made that transient
    # registry response fail an otherwise complete architecture matrix. Retry
    # into a temporary file so a partial response can never be parsed as the
    # manifest. The bounded loop still fails closed when the registry remains
    # unavailable.
    manifest_ok=false
    manifest_tmp="/tmp/manifest.$$.json"
    for attempt in 1 2 3 4 5; do
        if docker manifest inspect "$image" >"$manifest_tmp" 2>/dev/null; then
            mv "$manifest_tmp" /tmp/manifest.json
            manifest_ok=true
            break
        fi
        [ "$attempt" -eq 5 ] || sleep "$((attempt * 2))"
    done
    rm -f "$manifest_tmp"
    if [ "$manifest_ok" = true ]; then
        if ! WANT_ARCH="$want_arch" WANT_VARIANT="$want_variant" python3 - <<'PYEOF'
import json, os, sys

want_arch    = os.environ["WANT_ARCH"]
want_variant = os.environ["WANT_VARIANT"]

with open("/tmp/manifest.json", encoding="utf-8") as fh:
    doc = json.load(fh)

# A single-platform image has no "manifests" list; its own config names the
# architecture. Both shapes are answered the same way.
if "manifests" in doc:
    plats = [m.get("platform", {}) for m in doc["manifests"]]
else:
    plats = [{"architecture": doc.get("architecture", ""),
              "variant": doc.get("variant", "")}]

for p in plats:
    if p.get("architecture") != want_arch:
        continue
    # arm64 is published as arm64/v8 and everyone writes it linux/arm64, so an
    # unrequested variant matches anything; a REQUESTED one must be exact,
    # because arm/v6 and arm/v5 are different userlands, not near neighbours.
    if not want_variant or p.get("variant", "") == want_variant:
        sys.exit(0)
sys.exit(1)
PYEOF
        then
            if [ "$optional" = "true" ]; then
                # A best-effort arch with no base image for its own CPU (loong64:
                # node-loong64 and ferretdb-loong64 exist, but no debian/ubuntu
                # image publishes linux/loong64, so there is no userland to
                # rebuild the native modules in) is SKIPPED, not failed - exactly
                # like a best-effort arch with no Node.js. Failing it fails the
                # whole build-extra-arches matrix job, which SKIPS every job that
                # needs it (docker, and through docker the charts/ucs/nextcloud
                # jobs) - so one unbuildable CPU took the Docker image down with
                # it. It returns on its own when a ${platform} base image exists.
                echo "::warning::${arch} is skipped this release: ${image} publishes no ${platform} image, so there is no ${arch} userland to build the bundle in. It is best-effort - build node-${arch} exists, but the container does not; it returns when a ${platform} base image is published."
                skip=1
            else
                echo "::error::${image} publishes no ${platform} image, so a ${arch} bundle cannot be built in a container of its own architecture. Either use a base image that has this platform - debian:trixie covers 386, amd64, arm/v5, arm/v7, arm64, ppc64le, riscv64 and s390x - or drop ${arch} from the matrix."
                missing=1
            fi
        else
            echo "base image ${image}: has ${platform}"
        fi
    else
        echo "::error::Cannot read the manifest of ${image}. Check the image name; without it there is no way to know whether ${platform} exists."
        missing=1
    fi
fi

# ── 2. Node.js - official, then unofficial-builds, then wekan/node-patches ───
#
# WeKan takes its Node.js from three sources, in this order:
#
#   1. Official Node.js          https://nodejs.org/dist/
#   2. Unofficial Node.js builds https://unofficial-builds.nodejs.org/download/release/
#   3. wekan/node-patches        https://github.com/wekan/node-patches/releases
#
# Where nodejs.org publishes a build, that is the one WeKan ships - it is the
# build everyone else runs and verifies. unofficial-builds covers the CPUs
# nodejs.org does not release (riscv64, loong64); node-patches covers what
# NEITHER publishes (32-bit x86, 32-bit ARM, 32-bit Windows) by building upstream
# plus this project's patches.
#
# AND WHEN NO SOURCE HAS THIS CPU, the platform is simply NOT BUILT this release
# - which is why this is a skip and not an error, for every arch here and not
# only the ones marked optional. There is nothing a run can do about a CPU nobody
# publishes a Node.js for, and a red job every release for it is noise. It comes
# back by itself the first release after a Node.js for it appears anywhere.
#
# releases/resolve-node-source.sh is the ONE place that order and the
# platform-name mapping live; it also walks back through older releases of the
# pinned major when the newest has nothing for this CPU, and returns the
# published SHA256 of whatever it found. This just asks it.
node_found=false
node_full=""
node_from=""
node_url=""
node_kind=""
node_member=""
node_sha256=""
resolved="$(bash "$(dirname "${BASH_SOURCE[0]}")/resolve-node-source.sh" "$arch" "$node_version")"
resolve_rc=$?
if [ "$resolve_rc" -eq 0 ]; then
    eval "$(printf '%s\n' "$resolved" | grep -E '^node_[a-z0-9]+=')"
fi

if [ "$node_found" != "true" ]; then
    if [ "$resolve_rc" -eq 3 ]; then
        # No source has this CPU. A skip, not a failure - see above. (The
        # resolver already printed a ::warning:: naming what would fix it.)
        echo "::warning::${arch} is not built this time. No Node.js for it at nodejs.org, unofficial-builds.nodejs.org or wekan/node-patches; it returns by itself when one is published."
        skip=1
    else
        # A resolver that could not ASK - no network, nodejs.org down - is a
        # different thing from an answer of "nobody builds it", and must not be
        # read as one: skipping every platform because the index was unreachable
        # would publish a release with no bundles and call it normal.
        echo "::error::Could not work out where ${arch}'s Node.js comes from (resolve-node-source.sh failed). This is not the same as 'no source has it'; re-run when nodejs.org is reachable."
        missing=1
    fi
else
    echo "Node.js ${node_full} for ${arch}: ${node_from} (${node_url})"
    echo "  SHA256 published by ${node_from}: ${node_sha256}"
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
mt="https://github.com/wekan/mongo-tools-patches/releases/latest/download"
absent=""
for t in bsondump mongodump mongoexport mongofiles mongoimport mongorestore mongostat mongotop; do
    have "${mt}/${t}-${ferretdb_arch}" || absent="${absent} ${t}"
done
if [ -n "$absent" ]; then
    echo "::warning::wekan/mongo-tools-patches has no${absent} for ${ferretdb_arch}. The bundle ships without them rather than with the amd64 ones; FerretDB is the database and the launcher does not need them to start."
else
    echo "MongoDB Database Tools for ${ferretdb_arch}: all present"
fi

# A best-effort arch with no Node.js port: report it and stop cleanly, so the
# build steps are skipped (they read skip=true) instead of running with no
# Node.js. This is exit 0 - a platform nobody publishes a runtime for is a
# notice, not a failure - and it takes precedence over the FerretDB/mongo checks
# above, which have nothing to add once there is no Node.js to build with.
if [ "$skip" -ne 0 ]; then
    # Set when this arch cannot be built this release - no Node.js for it at any
    # of the three sources, or (best-effort arches only) no base image for its
    # CPU. The ::warning:: above says which; this is the machine-readable signal
    # the workflow gates its build steps on.
    echo "${arch}: not built this release (the warning above says why)."
    printf 'skip=true\n'
    exit 0
fi

if [ "$missing" -ne 0 ]; then
    echo "::error::${arch}: stopped before building, because something the bundle needs does not exist yet. The ::error:: lines above name each missing file and where it should be published."
    exit 1
fi

printf 'node_full=%s\n' "$node_full"
printf 'node_from=%s\n' "$node_from"
printf 'node_url=%s\n' "$node_url"
# What the file at node_url IS - tar.xz/zip from nodejs.org and
# unofficial-builds, a bare binary from node-patches - and, for an archive, the
# path inside it that is the node executable. install-node-for-arch.sh unpacks
# by these rather than guessing from the URL.
printf 'node_kind=%s\n' "$node_kind"
printf 'node_member=%s\n' "$node_member"
printf 'node_sha256=%s\n' "$node_sha256"
