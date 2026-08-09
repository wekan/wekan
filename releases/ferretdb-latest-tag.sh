#!/bin/bash
#
# ferretdb-latest-tag.sh - which version `latest` is right now.
#
# WeKan fetches FerretDB from .../releases/latest/download/ferretdb-<arch>, so a
# security fix published in wekan/FerretDB reaches the next bundle without a
# commit here. The cost of that is that the URL does not say WHICH version was
# fetched, and the release notes have to say it: "which FerretDB did v10.77
# ship" must be answerable a year later, when `latest` is something else.
#
# The extra-architecture job already asked the API and recorded the answer. The
# amd64, arm64, win64, win32, mac-arm64 and mac-x64 jobs passed the literal
# string `latest` instead, so six rows of the v10.77 table - including amd64,
# the platform most people download - had "latest" in the Version column, which
# is the one question the column exists to answer.
#
# Usage:  ferretdb-latest-tag.sh
#
# Prints the tag (e.g. v1.48.0) and exits 0. Prints NOTHING and still exits 0
# when it cannot find out: this is for a release note, and no caller should fail
# a build over it. Callers write "${TAG:-latest}", which degrades to exactly
# what they had before.
#
# The answer is cached for the life of the job, so six callers in one job make
# one request rather than six.

set -uo pipefail

cache="${FERRETDB_TAG_CACHE:-${RUNNER_TEMP:-${TMPDIR:-/tmp}}/ferretdb-latest-tag}"

if [ -s "$cache" ]; then
    cat "$cache"
    exit 0
fi

api="https://api.github.com/repos/wekan/FerretDB/releases/latest"

# -f so an HTTP error is a failure rather than an error page parsed as JSON.
# The token is used when there is one - an unauthenticated runner shares a
# 60/hour limit with every other job on that IP, and this is the failure that
# put "latest" in the table.
auth=()
if [ -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]; then
    auth=(-H "Authorization: Bearer ${GH_TOKEN:-$GITHUB_TOKEN}")
fi

body="$(curl -fsSL --retry 3 --retry-delay 2 "${auth[@]}" "$api" 2>/dev/null || true)"
[ -n "$body" ] || exit 0

# Prefer python3 - it is on every runner that builds a bundle - and fall back to
# sed, so a container without it still answers instead of silently saying
# "latest".
tag=""
if command -v python3 >/dev/null 2>&1; then
    tag="$(printf '%s' "$body" \
        | python3 -c 'import json,sys
try:
    print(json.load(sys.stdin).get("tag_name", ""))
except Exception:
    pass' 2>/dev/null || true)"
fi
if [ -z "$tag" ]; then
    tag="$(printf '%s' "$body" \
        | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
        | head -1)"
fi

# A tag, not a sentence. Anything else means the shape of the answer changed,
# and printing it into a markdown table cell would be worse than printing
# nothing - the caller's ${TAG:-latest} is the honest fallback.
case "$tag" in
    v[0-9]*) ;;
    *) exit 0 ;;
esac

mkdir -p "$(dirname "$cache")" 2>/dev/null || true
printf '%s' "$tag" > "$cache" 2>/dev/null || true
printf '%s' "$tag"
