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
#   node_sha256=<hex>                       its published SHA256, empty if the
#                                           source publishes none
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
# best-effort: this CPU has no Node.js port yet (32-bit x86/ARM: Node has no
# linux-x86 build at all, and no source builds armv7l for this major). When
# such an arch's Node.js is absent EVERYWHERE, skip it this release rather than
# failing the run - it builds automatically once wekan/node publishes node-<arch>.
# A required arch whose Node.js is missing is still fatal, as before.
optional="${7:-}"

missing=0
skip=0

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

# ── 2. Node.js ───────────────────────────────────────────────────────────────
#
# THE ORDER IS BY HOW VERIFIABLE THE BUILD IS. The three sources do not offer
# the same assurances, and this checked rather than assumed it:
#
#   nodejs.org          SHASUMS256.txt, and SHASUMS256.txt.sig / .asc
#                       signed with the Node.js release keys
#   unofficial-builds   SHASUMS256.txt, no signature
#   wekan/node fork     neither
#
# So official first, then unofficial, then the fork - descending verifiability,
# and the fork as the backstop for what the other two do not build. A binary
# somebody else signed is worth more than one this project built, and the
# fork's own fixes are build-configuration fixes that upstream's builds do not
# need in the first place: they are what makes the CPUs upstream does NOT build
# compile at all.
#
# The expected SHA256 is looked up here, from the source's own SHASUMS256.txt,
# and handed to the download step, which refuses a file that does not match.
# Preferring a source because it is verifiable and then not verifying it would
# be preferring it for nothing.
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

    # Most verifiable first - see the note above.
    if   have "$o"; then node_from=official;   node_url="$o"; node_full="$v"; break
    elif have "$u"; then node_from=unofficial; node_url="$u"; node_full="$v"; break
    elif have "$f"; then node_from=fork;       node_url="$f"; node_full="$v"; break
    fi
done

if [ -z "$node_from" ]; then
    newest="$node_full_wanted"
    oldest="$(printf '%s\n' "$versions" | head -n "$MAX_VERSIONS_BACK" | tail -n 1)"
    if [ "$optional" = "true" ]; then
        # A best-effort arch (32-bit x86/ARM) with no Node.js port anywhere is
        # SKIPPED, not failed: there is no Node ${node_version} for this CPU to
        # build against yet, so there is nothing this run can do about it, and a
        # red job every release is noise, not news. It comes back on its own the
        # first release after wekan/node publishes node-${arch}.
        echo "::warning::${arch} is skipped this release: no Node.js ${node_version} build exists for it anywhere (nodejs.org and unofficial-builds have no '${node_arch}', and the wekan/node fork has no 'node-${arch}'). It is best-effort - build node-${arch} in wekan/node to bring it back."
        skip=1
    else
        echo "::error::No Node.js for ${arch} exists anywhere. Checked every ${node_version}.x release from ${newest} back to ${oldest} at nodejs.org and unofficial-builds (node_arch '${node_arch}') and at the wekan/node fork (asset 'node-${arch}'). The fork is the one to fix: build node-${arch} with the node.yml workflow in wekan/node and attach it to a release, then re-run this job."
        missing=1
    fi
elif [ "$node_full" != "$node_full_wanted" ]; then
    # Behind, but the newest that exists - which is the best this CPU can have.
    echo "::warning::${arch} gets Node.js ${node_full} from ${node_from}, not the newest ${node_full_wanted}: no source has node-${arch} (or ${node_arch}) for ${node_full_wanted} yet. This is the newest build that exists for this CPU. To bring it in line, build node-${arch} for ${node_full_wanted} in wekan/node."
    echo "Node.js ${node_full} for ${arch}: ${node_from} (${node_url})"
else
    echo "Node.js ${node_full} for ${arch}: ${node_from} (${node_url})"
fi

# The expected SHA256, from the source's own SHASUMS256.txt. Empty for the fork,
# which publishes none - the download step says so out loud rather than quietly
# skipping a check the log implies was made.
node_sha256=""
if [ -n "$node_from" ]; then
    case "$node_from" in
        official)   sums="https://nodejs.org/dist/${node_full}/SHASUMS256.txt" ;;
        unofficial) sums="https://unofficial-builds.nodejs.org/download/release/${node_full}/SHASUMS256.txt" ;;
        # The fork publishes one .sha256sum per binary, beside it, rather than
        # a single SHASUMS256.txt - one file per asset is the shape the rest of
        # its release already has.
        fork)       sums="https://github.com/wekan/node/releases/download/${node_full}/node-${arch}.sha256sum" ;;
        *)          sums="" ;;
    esac
    if [ -n "$sums" ]; then
        want_file="${node_url##*/}"
        if sums_body="$(curl -fsSL "$sums" 2>/dev/null)"; then
            # nodejs.org and unofficial-builds publish "<sum>  <filename>" for
            # every file of the release; the fork publishes one file per binary,
            # holding just that binary's line. Same format either way.
            node_sha256="$(printf '%s\n' "$sums_body" |
                awk -v f="$want_file" '$2 == f || $2 == "./" f { print $1; exit }')"
            if [ -n "$node_sha256" ]; then
                echo "  SHA256 published for ${want_file}: ${node_sha256}"
            else
                echo "::warning::${node_from} publishes ${sums} but it has no line for ${want_file}, so the download cannot be checked against it."
            fi
        else
            echo "::warning::${node_from} publishes no checksum file at ${sums}, so the download cannot be verified. For the fork this means the release predates node.yml publishing .sha256sum files beside its binaries."
        fi
    else
        echo "::warning::No checksum file for ${node_from}, so this download cannot be verified."
    fi
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

# A best-effort arch with no Node.js port: report it and stop cleanly, so the
# build steps are skipped (they read skip=true) instead of running with no
# Node.js. This is exit 0 - a skipped best-effort arch is a notice, not a
# failure - and it takes precedence over the FerretDB/mongo checks above, which
# have nothing to add once there is no Node.js to build with.
if [ "$skip" -ne 0 ]; then
    # Set by a best-effort arch that cannot be built this release - no base image
    # for its CPU (loong64) or no Node.js for it anywhere (i386, armhf). The
    # ::warning:: above says which; this is the machine-readable signal the
    # workflow gates its build steps on.
    echo "${arch}: skipped (best-effort; the warning above says why)."
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
printf 'node_sha256=%s\n' "$node_sha256"
