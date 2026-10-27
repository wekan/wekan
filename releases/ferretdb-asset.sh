#!/bin/bash
#
# ferretdb-asset.sh - which wekan/FerretDB binary a platform gets, and
# downloading and verifying it.
#
# wekan/FerretDB publishes two binaries per platform:
#
#   ferretdb-sqlite-<platform>[.exe]   the SQLite handler only - smaller, and
#                                      what every WeKan platform runs
#   ferretdb-<platform>[.exe]          every handler (SQLite, PostgreSQL,
#                                      MySQL/MariaDB, SAP HANA)
#
# Every WeKan bundle, image, snap and .spk runs FerretDB on SQLite and nothing
# else, so each takes the SQLite-only binary. It is PREBUILT: no release
# workflow here compiles FerretDB.
#
# THE FALLBACK. ferretdb-sqlite-<platform> appeared in a FerretDB release
# later than ferretdb-<platform>, and wekan/FerretDB is released separately
# from WeKan. So the newest release that HAS ferretdb-sqlite-<platform> is
# taken, and when no recent release has it, the full ferretdb-<platform> of
# the newest release is - which has the SQLite handler too, so the bundle
# works either way, only larger. The log says which one was taken and why.
#
# Usage:
#   ferretdb-asset.sh <platform>              resolve; print the KEY=VALUE lines
#   ferretdb-asset.sh --url <platform>        resolve; print only the URL
#   ferretdb-asset.sh <platform> -o <file>    resolve, download, verify against
#                                             the published .sha256sum; print
#                                             the KEY=VALUE lines
#
# <platform> is the FerretDB asset's platform: amd64, arm64, armhf, i386,
# win64, win-arm64, win32, mac-arm64, mac-amd64, freebsd-amd64, ... A Windows
# platform (win*) gets the .exe name.
#
# The KEY=VALUE lines, for `eval "$(ferretdb-asset.sh ...)"` and the
# provenance table (every value is checked to be a plain token first):
#   FERRET_ASSET    ferretdb-sqlite-amd64 or ferretdb-amd64
#   FERRET_VARIANT  sqlite or full
#   FERRET_TAG      the release, e.g. v1.99.0 (empty when it could not be told)
#   FERRET_URL      the download URL of that asset in that release
#   FERRET_SHA      (download only) the published SHA256 the download matched;
#                   empty when the release publishes no checksum
# When $GITHUB_ENV is set they are appended there as well, so the later steps
# of the job (the provenance record in the zip step) see the same answer.
#
# Exit codes: 0 ok; 1 no release publishes a FerretDB for this platform;
# 2 the download does not match its published SHA256; 3 the download failed
# (an outage - releases/fetch.sh already retried it).
#
# Environment:
#   FERRETDB_VARIANT   sqlite (default) or full - a platform that needs another
#                      handler takes the full binary
#   FERRETDB_TAG       use this release instead of the newest one
#   FERRETDB_RELEASES  how many of the newest releases are looked through for
#                      the SQLite-only binary (default 10)
#   GH_TOKEN / GITHUB_TOKEN  used for the one API call that lists the releases
#
# The answer is cached for the life of the job (one file per platform under
# $FERRETDB_ASSET_CACHE, default $RUNNER_TEMP or $TMPDIR), so the job's check
# step and its embed step agree and only one of them asks.

set -uo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_SLUG="wekan/FerretDB"
BASE="https://github.com/$REPO_SLUG/releases"
API="https://api.github.com/repos/$REPO_SLUG/releases"

say() { echo "$*" >&2; }

mode=meta
out=""
platform=""
while [ "$#" -gt 0 ]; do
    case "$1" in
        --url) mode=url; shift ;;
        -o) out="${2:-}"; mode=download; shift 2 ;;
        -*) say "ferretdb-asset.sh: unknown option $1"; exit 64 ;;
        *) platform="$1"; shift ;;
    esac
done
if [ -z "$platform" ] || { [ "$mode" = download ] && [ -z "$out" ]; }; then
    say "usage: ferretdb-asset.sh [--url] <platform> [-o <file>]"
    exit 64
fi
case "$platform" in
    *[!a-z0-9-]*|-*) say "ferretdb-asset.sh: '$platform' is not a FerretDB platform name"; exit 64 ;;
esac

variant="${FERRETDB_VARIANT:-sqlite}"
case "$variant" in
    sqlite|full) ;;
    *) say "ferretdb-asset.sh: FERRETDB_VARIANT must be sqlite or full, not '$variant'"; exit 64 ;;
esac

ext=""
case "$platform" in win*) ext=".exe" ;; esac
sqlite_asset="ferretdb-sqlite-${platform}${ext}"
full_asset="ferretdb-${platform}${ext}"

valid_tag() { case "$1" in v[0-9]*) case "$1" in *[!A-Za-z0-9._+-]*) return 1 ;; esac; return 0 ;; *) return 1 ;; esac; }

cache_dir="${FERRETDB_ASSET_CACHE:-${RUNNER_TEMP:-$TMPDIR}}"
cache="$cache_dir/ferretdb-asset-${variant}-${platform}${FERRETDB_TAG:+-$FERRETDB_TAG}"

# url_for <tag> <asset>: that release's asset, or /latest/ when the tag is not
# known (which is still the newest release, only unnamed).
url_for() {
    if [ -n "$1" ]; then echo "$BASE/download/$1/$2"; else echo "$BASE/latest/download/$2"; fi
}

# exists <url>: 0 published, 1 not published, 2 nobody could tell.
exists() { FETCH_ATTEMPTS="${FETCH_ATTEMPTS:-3}" bash "$here/fetch.sh" --check "$1"; }

# The newest releases' tags, newest first - one API call. Only tags are read,
# so a sed is enough and no JSON tool has to be on the runner (the Windows and
# macOS bundle jobs run this too).
recent_tags() {
    local auth=() body
    if [ -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]; then
        auth=(-H "Authorization: Bearer ${GH_TOKEN:-$GITHUB_TOKEN}")
    fi
    body="$(curl -fsSL --retry 3 --retry-delay 2 ${auth[@]+"${auth[@]}"} \
        "$API?per_page=${FERRETDB_RELEASES:-10}" 2>/dev/null || true)"
    printf '%s\n' "$body" | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' \
        | sed 's/.*"\([^"]*\)"$/\1/' | while IFS= read -r t; do
            valid_tag "$t" && printf '%s\n' "$t"
        done
}

resolve() {
    local latest="" tag="" asset="" chosen_variant="" t rc unknown=0 why=""
    if [ -n "${FERRETDB_TAG:-}" ]; then
        valid_tag "$FERRETDB_TAG" || { say "ferretdb-asset.sh: FERRETDB_TAG '$FERRETDB_TAG' is not a release tag"; return 64; }
        latest="$FERRETDB_TAG"
    else
        latest="$(bash "$here/ferretdb-latest-tag.sh" 2>/dev/null || true)"
        valid_tag "$latest" || latest=""
    fi

    if [ "$variant" = sqlite ]; then
        # 1. the newest release (or the pinned one).
        exists "$(url_for "$latest" "$sqlite_asset")"; rc=$?
        if [ "$rc" = 0 ]; then
            tag="$latest"; asset="$sqlite_asset"; chosen_variant=sqlite
        else
            [ "$rc" = 2 ] && unknown=1
            # 2. the newest release before it that has one. Not for a pinned
            #    tag: pinning means that release, whatever it carries.
            if [ -z "${FERRETDB_TAG:-}" ]; then
                for t in $(recent_tags); do
                    [ "$t" = "$latest" ] && continue
                    exists "$(url_for "$t" "$sqlite_asset")"; rc=$?
                    if [ "$rc" = 0 ]; then
                        tag="$t"; asset="$sqlite_asset"; chosen_variant=sqlite
                        why=" (the newest release ${latest:-?} has none for $platform)"
                        break
                    fi
                    [ "$rc" = 2 ] && unknown=1
                done
            fi
        fi
    fi

    if [ -z "$asset" ]; then
        tag="$latest"; asset="$full_asset"; chosen_variant=full
    fi
    local url; url="$(url_for "$tag" "$asset")"

    if [ "$chosen_variant" = sqlite ]; then
        say "FerretDB for $platform: $asset from wekan/FerretDB ${tag:-latest} - the SQLite-only build${why}."
    elif [ "$variant" = full ]; then
        say "FerretDB for $platform: $asset from wekan/FerretDB ${tag:-latest} - the full build (FERRETDB_VARIANT=full)."
    else
        local reason="no recent wekan/FerretDB release publishes $sqlite_asset yet"
        [ "$unknown" = 1 ] && reason="it could not be told whether a wekan/FerretDB release publishes $sqlite_asset (GitHub did not answer)"
        say "::notice::FerretDB for $platform: $reason, so this uses the full $asset from ${tag:-the newest release}, which has the SQLite handler too (and the PostgreSQL, MySQL and SAP HANA ones)."
    fi

    printf 'FERRET_ASSET=%s\nFERRET_VARIANT=%s\nFERRET_TAG=%s\nFERRET_URL=%s\n' \
        "$asset" "$chosen_variant" "$tag" "$url"
}

meta=""
if [ -s "$cache" ] && grep -q '^FERRET_URL=https://' "$cache"; then
    meta="$(cat "$cache")"
    case "$(sed -n 's/^FERRET_VARIANT=//p' "$cache")" in
        sqlite) build="the SQLite-only build" ;;
        *)      build="the full build (no SQLite-only one for $platform)" ;;
    esac
    [ "$variant" = full ] && build="the full build (FERRETDB_VARIANT=full)"
    say "FerretDB for $platform: $(sed -n 's/^FERRET_ASSET=//p' "$cache") from wekan/FerretDB $(sed -n 's/^FERRET_TAG=//p' "$cache") - $build, as decided earlier in this job."
else
    meta="$(resolve)" || exit $?
    mkdir -p "$cache_dir" 2>/dev/null || true
    printf '%s\n' "$meta" > "$cache" 2>/dev/null || true
fi

get() { printf '%s\n' "$meta" | sed -n "s/^$1=//p" | head -1; }
FERRET_ASSET="$(get FERRET_ASSET)"
FERRET_VARIANT="$(get FERRET_VARIANT)"
FERRET_TAG="$(get FERRET_TAG)"
FERRET_URL="$(get FERRET_URL)"
FERRET_SHA=""

# Every value goes through eval in the callers and into a markdown table, so
# each must be a plain token.
case "$FERRET_ASSET" in "$sqlite_asset"|"$full_asset") ;; *) say "ferretdb-asset.sh: bad asset '$FERRET_ASSET'"; exit 70 ;; esac
case "$FERRET_VARIANT" in sqlite|full) ;; *) say "ferretdb-asset.sh: bad variant"; exit 70 ;; esac
[ -z "$FERRET_TAG" ] || valid_tag "$FERRET_TAG" || { say "ferretdb-asset.sh: bad tag '$FERRET_TAG'"; exit 70; }
case "$FERRET_URL" in
    "$BASE"/*) case "$FERRET_URL" in *[!A-Za-z0-9._:/+-]*) say "ferretdb-asset.sh: bad URL"; exit 70 ;; esac ;;
    *) say "ferretdb-asset.sh: bad URL '$FERRET_URL'"; exit 70 ;;
esac

if [ "$mode" = url ]; then
    printf '%s\n' "$FERRET_URL"
    exit 0
fi

sha_of() {
    if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'
    else shasum -a 256 "$1" | awk '{print $1}'; fi
}

if [ "$mode" = download ]; then
    mkdir -p "$(dirname "$out")"
    bash "$here/fetch.sh" --optional -o "$out" "$FERRET_URL"
    case $? in
        0) ;;
        1) rm -f "$out"
           say "No $FERRET_ASSET in wekan/FerretDB ${FERRET_TAG:-latest} ($FERRET_URL)."
           exit 1 ;;
        *) rm -f "$out"
           say "::error::$FERRET_URL could not be downloaded; the lines above say why."
           exit 3 ;;
    esac
    # fetch.sh can end an outage with exit 0 and no file; an empty or absent
    # file is never a FerretDB.
    if [ ! -s "$out" ]; then
        rm -f "$out"
        say "::error::$FERRET_URL could not be downloaded (nothing was written); re-run when GitHub answers."
        exit 3
    fi
    chmod +x "$out" 2>/dev/null || true
    sumfile="$(mktemp "$TMPDIR/ferretdb-sha.XXXXXX")"
    if bash "$here/fetch.sh" --optional -o "$sumfile" "${FERRET_URL}.sha256sum"; then
        want="$(awk '{print $1; exit}' "$sumfile")"
        got="$(sha_of "$out")"
        rm -f "$sumfile"
        case "$want" in
            *[!0-9a-f]*|"") say "::error::${FERRET_ASSET}.sha256sum in ${FERRET_TAG:-latest} is not a SHA256."; rm -f "$out"; exit 2 ;;
        esac
        if [ "$got" != "$want" ]; then
            say "::error::FerretDB $FERRET_ASSET does not match its published SHA256 (published $want, got $got)."
            rm -f "$out"
            exit 2
        fi
        FERRET_SHA="$want"
        say "FerretDB SHA256 verified: $got"
    else
        rm -f "$sumfile"
        say "::warning::wekan/FerretDB publishes no checksum for $FERRET_ASSET in ${FERRET_TAG:-latest}, so it is unverified."
    fi
fi

lines="FERRET_ASSET=$FERRET_ASSET
FERRET_VARIANT=$FERRET_VARIANT
FERRET_TAG=$FERRET_TAG
FERRET_URL=$FERRET_URL"
[ "$mode" = download ] && lines="$lines
FERRET_SHA=$FERRET_SHA"
printf '%s\n' "$lines"
if [ -n "${GITHUB_ENV:-}" ]; then
    printf '%s\n' "$lines" >> "$GITHUB_ENV" 2>/dev/null || true
fi
exit 0
