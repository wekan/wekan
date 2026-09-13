#!/usr/bin/env bash
# Run an npm command, retrying it when - and ONLY when - it failed for a reason
# that is somebody else's server having a bad minute.
#
#     bash releases/npm-retry.sh npm install
#     bash releases/npm-retry.sh meteor npm install
#
# Why this exists. Every download in the release workflow is a curl with
# `--retry 5 --retry-delay 10`; the npm installs had nothing, and npm's own
# `fetch-retries` defaults to 2 quick attempts. So the v10.86 release died here:
#
#     npm error code E503
#     npm error 503 Service Unavailable - GET
#     https://github.com/meteor/node-source-map-support/tarball/81bce1f9...
#
# github.com was returning 503 for a few minutes. build-amd64 failed, and
# because every other bundle is derived from the amd64 one, the whole release -
# eleven architectures, the Docker images, the snap - was skipped and had to be
# started again by hand. Nothing was wrong with WeKan.
#
# ONLY transient failures are retried. A build error, a missing package, a
# version conflict fails on the FIRST attempt, immediately: retrying a real
# error five times over an emulated arm64 npm install wastes half an hour and
# then reports the same thing. What counts as transient is the list below -
# HTTP 5xx and 429, and the socket errors that mean the connection, not the
# request, went wrong.
#
# Tunables (env): NPM_RETRY_ATTEMPTS (default 5), NPM_RETRY_SLEEPS (the backoff,
# default "15 30 60 120" seconds; set to "0" in tests).
set -uo pipefail

if [ "$#" -eq 0 ]; then
    echo "npm-retry.sh: give it a command to run, e.g. npm install" >&2
    exit 2
fi

attempts=${NPM_RETRY_ATTEMPTS:-5}
sleeps=${NPM_RETRY_SLEEPS:-"15 30 60 120"}

# npm's own retrying, turned up from its default of 2 attempts over ~30 seconds.
# It covers the registry requests inside one npm run; the loop below covers the
# whole command, including the git tarball fetches that are not registry
# requests at all.
export npm_config_fetch_retries="${npm_config_fetch_retries:-5}"
export npm_config_fetch_retry_mintimeout="${npm_config_fetch_retry_mintimeout:-20000}"
export npm_config_fetch_retry_maxtimeout="${npm_config_fetch_retry_maxtimeout:-120000}"

# A failure is transient when the output says the network or the far end broke.
# Kept as one grep -E so it can be read as the list it is.
TRANSIENT='E(50[0-9]|429)|"?(429|50[0-24])"? ?(Too Many Requests|Internal Server Error|Bad Gateway|Service Unavailable|Gateway Time-?out)|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ESOCKETTIMEDOUT|ERR_SOCKET_TIMEOUT|EAI_AGAIN|ENOTFOUND|EPROTO|socket hang up|network socket disconnected|network timeout|Could not resolve host|TLS connection|remote end hung up|early EOF|RPC failed'

log=$(mktemp)
trap 'rm -f "$log"' EXIT

attempt=1
while : ; do
    "$@" 2>&1 | tee "$log"
    status=${PIPESTATUS[0]}
    [ "$status" -eq 0 ] && exit 0

    if ! grep -Eqi "$TRANSIENT" "$log"; then
        echo "::error::\`$*\` failed (exit $status), and not for a network reason - so it is not retried. The npm error above is the failure to fix."
        exit "$status"
    fi

    if [ "$attempt" -ge "$attempts" ]; then
        echo "::error::\`$*\` failed $attempts times with a network error (exit $status). The registry or github.com is having an outage, not WeKan: re-run this job when it is over."
        exit "$status"
    fi

    # The nth sleep, or the last one over again once the list runs out.
    delay=$(printf '%s\n' $sleeps | sed -n "${attempt}p")
    [ -n "$delay" ] || delay=$(printf '%s\n' $sleeps | tail -n 1)
    echo "::warning::\`$*\` failed with a network error (attempt $attempt/$attempts). Retrying in ${delay}s."
    [ "$delay" -gt 0 ] && sleep "$delay"
    attempt=$((attempt + 1))
done
