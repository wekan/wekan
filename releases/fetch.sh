#!/usr/bin/env bash
# Download a file, or ask whether one exists, with an outage in mind.
#
#     bash releases/fetch.sh -o bundle/ferretdb "$FERRET_URL"   # download
#     bash releases/fetch.sh -o - "$URL"                        # to stdout
#     bash releases/fetch.sh --check "$URL"                     # does it exist?
#     bash releases/fetch.sh --optional -o f "$URL"              # 404 is allowed
#
# Why this exists. `curl --retry 5 --retry-delay 10` is fifty seconds of
# patience, and github.com 503s for minutes at a time. The v10.86 release was
# lost twice in one afternoon that way - the second time here, downloading the
# FerretDB binary in build-amd64:
#
#     curl: (22) The requested URL returned error: 503
#     Warning: Problem : HTTP error. Will retry in 10 seconds. 5 retries left.
#     ...
#     curl: (56) Connection died, tried 5 times before giving up
#     Error: Process completed with exit code 56.
#
# Every Linux bundle is repacked from the amd64 one, so those fifty seconds
# skipped eleven architectures, the Docker images and the snap.
#
# The distinction that matters is 503 versus 404, and it is why this is a script
# and not a longer --retry:
#
#   * 5xx, 429, 408 and the connection errors are the far end having a bad
#     minute. Retried, with a backoff that adds up to about eight minutes.
#   * 404 (and 401/403) means the file is NOT PUBLISHED. That is an answer, not
#     an outage: several callers here are `if fetch ...; then ... else skip this
#     architecture`, and retrying it for eight minutes would turn a correct
#     "riscv64 has no Node.js build yet" into eight wasted minutes per job.
#
# --check answers the existence question with THREE outcomes rather than two,
# for the same reason: 0 it is there, 1 it is definitively absent, 2 nobody
# could tell (the server was down). A preflight that treats "the server was
# down" as "the binary is missing" cancels an architecture that is fine.
#
# Tunables (env): FETCH_ATTEMPTS (default 7), FETCH_SLEEPS (default
# "15 30 60 120 240 480"; set to "0" in tests), FETCH_CONNECT_TIMEOUT (30).
set -uo pipefail

attempts=${FETCH_ATTEMPTS:-7}
sleeps=${FETCH_SLEEPS:-"15 30 60 120 240 480"}
connect_timeout=${FETCH_CONNECT_TIMEOUT:-30}

mode=download
out=""
optional=no
while [ "$#" -gt 0 ]; do
    case "$1" in
        --check) mode=check; shift ;;
        # For a file that is allowed not to exist - the .sha256sum a source may
        # or may not publish. A 404 is then silent and exit 1, so the caller's
        # `if ... then verify else say no checksum published` reads correctly
        # and the log does not carry an ::error:: for a working release.
        --optional) optional=yes; shift ;;
        -o) out="$2"; shift 2 ;;
        --) shift; break ;;
        *) break ;;
    esac
done

url=${1:-}
shift 2>/dev/null || true
if [ -z "$url" ] || { [ "$mode" = download ] && [ -z "$out" ]; }; then
    echo "fetch.sh: usage: fetch.sh -o OUT URL | fetch.sh --check URL" >&2
    exit 2
fi

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

attempt=1
while : ; do
    if [ "$mode" = check ]; then
        code=$(curl -sSL -I -o /dev/null -w '%{http_code}' \
            --connect-timeout "$connect_timeout" "$@" "$url" 2>/dev/null)
    else
        code=$(curl -sSL -o "$tmp" -w '%{http_code}' \
            --connect-timeout "$connect_timeout" "$@" "$url")
    fi
    rc=$?

    # 000 is curl's "no HTTP response at all" - DNS, TLS, a dropped connection.
    case "$code" in
        2??)
            if [ "$mode" = check ]; then exit 0; fi
            if [ "$out" = "-" ]; then cat "$tmp"; else mv "$tmp" "$out"; fi
            exit 0
            ;;
        401|403|404|410)
            if [ "$mode" = check ]; then exit 1; fi
            if [ "$optional" = yes ]; then exit 1; fi
            echo "::error::$url is not published (HTTP $code). This is not an outage: the file has to be built and uploaded before this job can use it." >&2
            exit 22
            ;;
    esac

    if [ "$attempt" -ge "$attempts" ]; then
        [ "$mode" = check ] && exit 2
        echo "::error::$url could not be downloaded in $attempts attempts (last HTTP $code, curl exit $rc). The server is having an outage, not WeKan: re-run this job when it is over." >&2
        exit "${rc:-1}"
    fi

    delay=$(printf '%s\n' $sleeps | sed -n "${attempt}p")
    [ -n "$delay" ] || delay=$(printf '%s\n' $sleeps | tail -n 1)
    echo "::warning::$url answered HTTP ${code} (attempt $attempt/$attempts). Retrying in ${delay}s." >&2
    [ "$delay" -gt 0 ] && sleep "$delay"
    attempt=$((attempt + 1))
done
