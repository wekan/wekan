#!/usr/bin/env bash
#
# resolve-node-source.sh - where does WeKan's Node.js for one platform come from?
#
# WeKan ships a Node.js inside every bundle .zip, every Docker image and every
# snap, and it takes that Node.js from THREE sources, in this order:
#
#   1. Official Node.js          https://nodejs.org/dist/<version>/
#   2. Unofficial Node.js builds https://unofficial-builds.nodejs.org/download/release/<version>/
#   3. wekan/node-patches        https://github.com/wekan/node-patches/releases
#
# The order is a preference, not a fallback of last resort: where nodejs.org
# publishes a build, that is the one WeKan ships, because it is the build the
# rest of the world runs and its checksums are the ones everyone else verifies
# against. unofficial-builds covers the CPUs nodejs.org does not release
# (riscv64, loong64, musl); wekan/node-patches covers what NEITHER publishes -
# 32-bit x86 (i386), 32-bit ARM (armhf/armv7), 32-bit Windows - by building
# upstream Node.js plus this project's patches.
#
# AND WHEN NO SOURCE HAS IT, the platform is simply not built this release. That
# is the fourth rule and it is why this script answers "not found" rather than
# failing: a CPU nobody publishes a Node.js for cannot have a WeKan bundle, and a
# red job every release for it is noise. Nothing has to be edited when that
# changes - the next run resolves again, and the platform comes back by itself
# the day a Node.js for it appears at any of the three.
#
# Usage:
#   resolve-node-source.sh <platform> <major|version>
#
#   platform   what WeKan calls the CPU: amd64/x64, arm64, i386, armhf, armv7,
#              armv6, ppc64le, s390x, riscv64, loong64, win64, win32, win-arm64,
#              mac-x64,
#              mac-arm64. A node-patches asset name (node-x64, node-win64.exe)
#              is accepted too, so callers that already hold one need not
#              translate it.
#   major      the pinned Node MAJOR, e.g. 24 - then the NEWEST version any
#              source has FOR THIS PLATFORM is chosen, walking back at most
#              MAX_VERSIONS_BACK releases. A full version (v24.19.0) pins that
#              exact one and does not walk.
#
# Prints to STDOUT, on success, the lines a caller reads with `eval` or grep:
#
#   node_found=true
#   node_full=v24.19.0                 the version that was found
#   node_from=nodejs.org               nodejs.org | unofficial-builds.nodejs.org |
#                                      wekan/node-patches - the source's NAME, and
#                                      exactly the string the provenance table
#                                      shows, so the two cannot drift
#   node_url=https://...               the exact file to download
#   node_kind=tar.xz                   tar.xz | zip | binary - what that file IS
#   node_member=node-v24.19.0-linux-x64/bin/node
#                                      the path INSIDE the archive that is the
#                                      node executable; empty when kind=binary
#   node_sha256=<hex>                  the published SHA256 OF THE FILE AT
#                                      node_url (the archive for 1 and 2, the
#                                      binary itself for 3)
#
# and, when no source has this platform:
#
#   node_found=false
#
# Exit status: 0 found, 3 not found anywhere (not an error - the caller decides
# whether that means "skip this platform" or "fail"), 1 something went wrong.
#
# Everything explanatory goes to STDERR, so stdout stays machine-readable.
#
# No python, no jq: this runs on the GitHub runners, inside emulated containers
# and inside the Dockerfile, and the only things all three are guaranteed to have
# are curl, grep, sed and awk.

set -uo pipefail

platform="${1:?usage: resolve-node-source.sh <platform> <major|version>}"
want="${2:?usage: resolve-node-source.sh <platform> <major|version>}"

# How far back to look when the caller pinned only a MAJOR. A platform whose
# newest Node.js is a dozen releases old is not "slightly behind", it is
# unmaintained, and saying so is more use than silently shipping last year's.
MAX_VERSIONS_BACK="${MAX_VERSIONS_BACK:-12}"

DIST="https://nodejs.org/dist"
UNOFFICIAL="https://unofficial-builds.nodejs.org/download/release"
PATCHES="https://github.com/wekan/node-patches/releases/download"

log() { printf '%s\n' "$*" >&2; }

# A platform name, however the caller spells it, reduced to the one this script
# uses. node-x64 / node-win64.exe are the node-patches asset names.
platform="${platform#node-}"
platform="${platform%.exe}"
[ "$platform" = "amd64" ] && platform="x64"

# ── The one mapping table ─────────────────────────────────────────────────────
#
# nodejs.org and unofficial-builds name a build <os>-<arch>, and they use the
# SAME spelling as each other, so one column covers both: what differs is which
# of them actually publishes it, and that is answered by looking in the
# SHASUMS256.txt rather than by guessing here. Node's spelling is not WeKan's -
# Node says x86 where Debian, snap and FerretDB all say i386, and armv7l where
# they say armhf - which is exactly why this table exists.
#
# node-patches names its assets after the platform, WeKan-style, plus .exe on
# Windows.
case "$platform" in
  x64)       nodename="linux-x64"     ; asset="node-x64"          ; ext="tar.xz" ;;
  arm64)     nodename="linux-arm64"   ; asset="node-arm64"        ; ext="tar.xz" ;;
  i386)      nodename="linux-x86"     ; asset="node-i386"         ; ext="tar.xz" ;;
  armhf)     nodename="linux-armv7l"  ; asset="node-armhf"        ; ext="tar.xz" ;;
  # ARMv6 (Raspberry Pi 1, Zero). nodejs.org dropped its ARMv6 binaries after
  # Node 11 and unofficial-builds has none, so the linux-armv6l name below will
  # never match there - it is given so the search is honest, and wekan/node-patches'
  # node-armv6 is what actually answers.
  armv6)     nodename="linux-armv6l"  ; asset="node-armv6"        ; ext="tar.xz" ;;
  armv7)     nodename="linux-armv7l"  ; asset="node-armv7"        ; ext="tar.xz" ;;
  ppc64le)   nodename="linux-ppc64le" ; asset="node-ppc64le"      ; ext="tar.xz" ;;
  s390x)     nodename="linux-s390x"   ; asset="node-s390x"        ; ext="tar.xz" ;;
  riscv64)   nodename="linux-riscv64" ; asset="node-riscv64"      ; ext="tar.xz" ;;
  loong64)   nodename="linux-loong64" ; asset="node-loong64"      ; ext="tar.xz" ;;
  win64)     nodename="win-x64"       ; asset="node-win64.exe"    ; ext="zip"    ;;
  win32)     nodename="win-x86"       ; asset="node-win32.exe"    ; ext="zip"    ;;
  # Windows on ARM. nodejs.org publishes node-<version>-win-arm64.zip itself, so
  # this resolves from the official source like win64 does and never needs a
  # node-patches build - the asset name is given anyway, for the day it does.
  win-arm64) nodename="win-arm64"     ; asset="node-win-arm64.exe"; ext="zip"    ;;
  mac-x64)   nodename="darwin-x64"    ; asset="node-mac-x64"      ; ext="tar.xz" ;;
  mac-arm64) nodename="darwin-arm64"  ; asset="node-mac-arm64"    ; ext="tar.xz" ;;
  *)
    log "::error::resolve-node-source.sh does not know the platform '${1}'. Add it to the mapping table if WeKan builds for it now."
    exit 1
    ;;
esac

# Inside a tarball the node executable is bin/node under a directory named after
# the build; a Windows zip has node.exe at the top of that directory instead.
case "$ext" in
  zip) member_tail="node.exe" ;;
  *)   member_tail="bin/node" ;;
esac

# ── Which versions to try ─────────────────────────────────────────────────────
#
# A full version pins itself. A bare major is resolved against nodejs.org's own
# index.json, which lists every release newest first - so "the newest v24.x" is
# whatever upstream says it is, and this needs no editing when 24.20.0 lands.
# node-patches tags its releases with the exact upstream version it patched, so
# one list of versions serves all three sources.
case "$want" in
  v[0-9]*.[0-9]*.[0-9]*) versions="$want" ;;
  [0-9]*.[0-9]*.[0-9]*)  versions="v$want" ;;
  [0-9]*)
    index="$(bash "$(dirname "$0")/fetch.sh" -o - "$DIST/index.json" 2>/dev/null)"
    if [ -z "$index" ]; then
      log "::error::Could not read ${DIST}/index.json, so there is no list of Node.js ${want}.x releases to choose from."
      exit 1
    fi
    # index.json is one object per release, newest first; the version is the
    # first field of each. grep keeps that order.
    versions="$(printf '%s' "$index" \
      | grep -o "\"version\":\"v${want}\.[0-9]*\.[0-9]*\"" \
      | sed 's/.*"\(v[0-9.]*\)"/\1/')"
    if [ -z "$versions" ]; then
      log "::error::nodejs.org lists no v${want}.x release at all."
      exit 1
    fi
    ;;
  *)
    log "::error::'${want}' is not a Node major (24) or a version (v24.19.0)."
    exit 1
    ;;
esac

# ── Looking in one published checksum file ────────────────────────────────────
#
# Both nodejs.org and unofficial-builds publish a SHASUMS256.txt listing every
# file of that release with its SHA256. That file answers BOTH questions at once
# - does this build exist, and what should it hash to - so there is no HEAD
# request and no separate checksum fetch, and a build that is listed but not yet
# uploaded cannot be mistaken for a good one.
#
# It is fetched at most once per version per source; the cache matters because a
# platform nobody publishes (i386, armhf, win32) would otherwise re-fetch both
# files for every version it walks back through.
cache="$(mktemp -d)"
trap 'rm -rf "$cache"' EXIT

shasums() {   # <base-url> <version> <tag-for-the-cache-file>
  f="${cache}/$3-$2"
  if [ ! -e "$f" ]; then
    bash "$(dirname "$0")/fetch.sh" --optional -o "$f" "$1/$2/SHASUMS256.txt" 2>/dev/null \
      || : > "$f"
  fi
  cat "$f"
}

# The SHA256 of <file> as that SHASUMS256.txt records it, or nothing.
sum_of() {    # <sums-body> <filename>
  printf '%s\n' "$1" | awk -v f="$2" '$2 == f || $2 == "./" f { print $1; exit }'
}

emit() {      # <version> <from> <url> <kind> <member> <sha256>
  printf 'node_found=true\n'
  printf 'node_full=%s\n'   "$1"
  printf 'node_from=%s\n'   "$2"
  printf 'node_url=%s\n'    "$3"
  printf 'node_kind=%s\n'   "$4"
  printf 'node_member=%s\n' "$5"
  printf 'node_sha256=%s\n' "$6"
}

# ── The walk ──────────────────────────────────────────────────────────────────
#
# VERSION is the outer loop and SOURCE the inner one, which is the whole
# ordering decision and worth being explicit about: within one version the three
# sources are tried in the order at the top of this file, and only when NO source
# has that version for this platform does it look at an older one. The other way
# round - all versions of source 1, then all of source 2 - would prefer an
# official build from six releases ago over a current node-patches one, which is
# not what "newest Node.js for this platform" means.
tried=0
for V in $versions; do
  [ "$tried" -ge "$MAX_VERSIONS_BACK" ] && break
  tried=$((tried + 1))

  # 1. Official.
  file="node-${V}-${nodename}.${ext}"
  sha="$(sum_of "$(shasums "$DIST" "$V" official)" "$file")"
  if [ -n "$sha" ]; then
    log "Node.js ${V} for ${platform}: nodejs.org (${DIST}/${V}/${file})"
    emit "$V" nodejs.org "$DIST/$V/$file" "$ext" "node-${V}-${nodename}/${member_tail}" "$sha"
    exit 0
  fi

  # 2. Unofficial builds. Same file naming, different publisher - so the same
  #    lookup, and no assumption here about WHICH CPUs it covers: it covers the
  #    ones its SHASUMS256.txt lists, today, whatever that is.
  sha="$(sum_of "$(shasums "$UNOFFICIAL" "$V" unofficial)" "$file")"
  if [ -n "$sha" ]; then
    log "Node.js ${V} for ${platform}: unofficial-builds.nodejs.org (${UNOFFICIAL}/${V}/${file})"
    emit "$V" unofficial-builds.nodejs.org "$UNOFFICIAL/$V/$file" "$ext" "node-${V}-${nodename}/${member_tail}" "$sha"
    exit 0
  fi

  # 3. wekan/node-patches. It publishes a BARE binary per platform plus a
  #    <asset>.sha256sum beside it, at a release tagged with the upstream version
  #    it patched - so the URL is predictable and the checksum sidecar answers
  #    "does it exist" the same way SHASUMS256.txt does above. (An asset with no
  #    checksum beside it is not taken: the whole point of these three sources is
  #    that what is shipped can be verified.)
  url="${PATCHES}/${V}/${asset}"
  sums_body="$(bash "$(dirname "$0")/fetch.sh" --optional -o - "${url}.sha256sum" 2>/dev/null)"
  if [ -n "$sums_body" ]; then
    sha="$(printf '%s\n' "$sums_body" \
      | awk -v f="$asset" '$2 == f || $2 == "./" f { print $1; exit } NF == 1 { print $1; exit }')"
    if [ -n "$sha" ]; then
      log "Node.js ${V} for ${platform}: wekan/node-patches (${url})"
      emit "$V" wekan/node-patches "$url" binary "" "$sha"
      exit 0
    fi
  fi
done

# Nothing, anywhere, for this platform. Not an error - see the header.
log "::warning::No Node.js for ${platform} at any of the three sources (nodejs.org, unofficial-builds.nodejs.org, wekan/node-patches) in the ${tried} newest ${want} release(s). WeKan does not build ${platform} this release; it comes back by itself when a Node.js for it is published - build ${asset} in wekan/node-patches to make that happen now."
printf 'node_found=false\n'
exit 3
