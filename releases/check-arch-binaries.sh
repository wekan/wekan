#!/bin/bash
#
# check-arch-binaries.sh - before building a bundle for some CPU, check that
# every binary the bundle needs from somewhere else actually exists.
#
# A WeKan bundle for an architecture other than amd64 is assembled out of files
# that other projects publish: a Node.js build (the wekan/node fork, and ONLY the
# fork - see §2), a FerretDB binary (wekan/FerretDB), and the MongoDB Database
# Tools (wekan/mongo-tools). Any of them can be absent - a fork build that has not
# finished, a release that skipped an architecture - and when one is, the build
# should stop HERE, saying which file is missing and where it should be published,
# rather than an hour later inside an emulated container with a 404 in the middle
# of an npm install.
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
# Prints, on stdout, four lines for the caller to read:
#   node_full=vX.Y.Z                        the fork tag that was found
#   node_from=fork                          always the fork - there is no other source
#   node_url=https://...                    the exact file to download
#   node_sha256=<hex>                       its published SHA256, empty only if a
#                                           very old fork release published none
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

# ── 2. Node.js - the wekan/node fork, and ONLY the fork ──────────────────────
#
# WeKan takes its Node.js from the wekan/node fork for EVERY platform, and from
# nowhere else. The reason is control: the fork is Node built from source, so a
# Node bug can be PATCHED and rebuilt - which cannot be done with nodejs.org's or
# unofficial-builds' opaque binaries - and one source means a set of bundles is
# never half built on one Node.js and half on another depending on the CPU. The
# fork also already covers the CPUs the other two do not build at all (32-bit
# x86/ARM, loong64, win32), so it is the only source that fits every platform.
# There is no official/unofficial fallback here on purpose: a binary this project
# cannot rebuild from source is exactly the one it will not ship.
#
# The fork publishes one BARE binary per arch - node-${arch} - plus a
# node-${arch}.sha256sum beside it, per release tag (v24.19.0, ...). The rule is
# "the NEWEST fork build that exists FOR THIS CPU", which is not always the
# newest fork release: the fork builds each CPU on its own schedule, so an exotic
# arch's newest build can be a tag or two behind. This lists the fork's own
# ${node_version}.x releases, newest first, and takes the first that carries
# node-${arch}; the SHA256 comes from that release's node-${arch}.sha256sum and
# is handed to the download step, which refuses a file that does not match.
#
# The walk stops after MAX_VERSIONS_BACK. A CPU whose newest fork build is a
# dozen releases old is not "slightly behind", it is unmaintained, and saying so
# is more use than silently shipping something from last year.
MAX_VERSIONS_BACK=12

# Ask the fork's own release list which tags carry node-${arch}, newest first.
# The API needs no auth for a public repo, but CI passes GITHUB_TOKEN to dodge
# the low unauthenticated rate limit; use it when it is set.
gh_auth=()
[ -n "${GITHUB_TOKEN:-}" ] && gh_auth=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
releases_json="$(curl -fsSL "${gh_auth[@]}" \
    "https://api.github.com/repos/wekan/node/releases?per_page=100" 2>/dev/null || true)"

if [ -z "$releases_json" ]; then
    echo "::error::Could not list wekan/node releases from the GitHub API, so there is no way to find the newest fork build of Node.js ${node_version} for ${arch}."
    exit 1
fi

# Tags for this major that actually have a node-${arch} asset, newest first by
# semver. python3 sorts them; asset presence is read straight from the release.
fork_tags="$(printf '%s' "$releases_json" | python3 -c "
import json,sys
major='v${node_version}.'
asset='node-${arch}'
def key(t):
    try: return [int(x) for x in t.lstrip('v').split('.')[:3]]
    except Exception: return [0,0,0]
tags=[r['tag_name'] for r in json.load(sys.stdin)
      if r.get('tag_name','').startswith(major)
      and any(a.get('name')==asset for a in r.get('assets',[]))]
print('\n'.join(sorted(set(tags), key=key, reverse=True)))
" 2>/dev/null || true)"

# The newest fork tag for this major at all (whether or not it has this arch),
# for the "behind" message below.
node_full_wanted="$(printf '%s' "$releases_json" | python3 -c "
import json,sys
major='v${node_version}.'
def key(t):
    try: return [int(x) for x in t.lstrip('v').split('.')[:3]]
    except Exception: return [0,0,0]
tags=[r['tag_name'] for r in json.load(sys.stdin) if r.get('tag_name','').startswith(major)]
print(sorted(set(tags), key=key, reverse=True)[0] if tags else '')
" 2>/dev/null || true)"

node_from=""
node_full=""
node_url=""
tried=0
for v in $fork_tags; do
    tried=$((tried + 1))
    [ "$tried" -gt "$MAX_VERSIONS_BACK" ] && break
    f="https://github.com/wekan/node/releases/download/${v}/node-${arch}"
    if have "$f"; then node_from=fork; node_url="$f"; node_full="$v"; break; fi
done

if [ -z "$node_from" ]; then
    if [ "$optional" = "true" ]; then
        # A best-effort arch whose fork build has not landed yet is SKIPPED, not
        # failed: there is nothing this run can do until wekan/node publishes
        # node-${arch}, and a red job every release is noise, not news. It comes
        # back on its own the first release after the fork publishes it.
        echo "::warning::${arch} is skipped this release: the wekan/node fork has no 'node-${arch}' for any ${node_version}.x release yet. It is best-effort - build node-${arch} in wekan/node (the release-all-missing workflow) to bring it back."
        skip=1
    else
        echo "::error::The wekan/node fork has no 'node-${arch}' for any ${node_version}.x release. WeKan takes its Node.js only from the fork, so this bundle cannot be built until the fork publishes it: build node-${arch} in wekan/node (the release-all-missing workflow) and attach it to a release, then re-run this job."
        missing=1
    fi
elif [ -n "$node_full_wanted" ] && [ "$node_full" != "$node_full_wanted" ]; then
    # Behind, but the newest fork build that exists - the best this CPU can have.
    echo "::warning::${arch} gets Node.js ${node_full} from the wekan/node fork, not the newest ${node_full_wanted}: the fork has no node-${arch} for ${node_full_wanted} yet. This is the newest fork build for this CPU. To bring it in line, build node-${arch} for ${node_full_wanted} in wekan/node."
    echo "Node.js ${node_full} for ${arch}: fork (${node_url})"
else
    echo "Node.js ${node_full} for ${arch}: fork (${node_url})"
fi

# The expected SHA256, from the fork's node-${arch}.sha256sum beside the binary.
# The fork publishes one .sha256sum per binary - one file per asset is the shape
# the rest of its release already has.
node_sha256=""
if [ -n "$node_from" ]; then
    sums="https://github.com/wekan/node/releases/download/${node_full}/node-${arch}.sha256sum"
    want_file="node-${arch}"
    if sums_body="$(curl -fsSL "${gh_auth[@]}" "$sums" 2>/dev/null)"; then
        # "<sum>  node-<arch>", or just the bare sum on its own line.
        node_sha256="$(printf '%s\n' "$sums_body" |
            awk -v f="$want_file" '$2 == f || $2 == "./" f { print $1; exit } NF==1 { print $1; exit }')"
        if [ -n "$node_sha256" ]; then
            echo "  SHA256 published for ${want_file}: ${node_sha256}"
        else
            echo "::warning::the fork publishes ${sums} but it has no line for ${want_file}, so the download cannot be checked against it."
        fi
    else
        echo "::warning::the fork publishes no checksum file at ${sums}, so this download cannot be verified. This means the release predates node.yml publishing .sha256sum files beside its binaries."
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
