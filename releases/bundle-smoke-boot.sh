#!/usr/bin/env bash
# bundle-smoke-boot.sh — does this bundle actually start?
#
# Usage: bash releases/bundle-smoke-boot.sh <bundle-dir> [node-binary]
#
# WHY. Two releases shipped a bundle that could not boot, and both times the
# reasoning was "nothing at runtime needs that, I read the code":
#
#   v10.96  Error: ENOENT ... programs/server/packages/ecmascript.js.map
#           at programs/server/boot.js:101:29
#           - boot.js reads every source map NAMED in program.json, at boot.
#
#   v10.97  Error: Cannot find module ".../nodemailer-openpgp/lib/nodemailer-openpgp.js"
#           at packages/email.js:347
#           - Meteor compiles an ESM import to module.link('nodemailer-openpgp',...),
#             which a scan for require() does not see.
#
# Reading the code is how both mistakes were made. Starting the server is how
# either would have been caught in seconds, so it is no longer optional: the
# bundle is started with a database address that cannot answer, and it has to get
# as far as trying to reach it. That proves the whole server image loaded - every
# package linked, every map read - because the database is the first thing WeKan
# needs that this check does not give it.
#
# It is deliberately NOT a full run: no database, no port binding worth the name,
# a few seconds. What it answers is only "does this bundle load", which is exactly
# the question the two crashes above were.

set -uo pipefail

BUNDLE="${1:?usage: bundle-smoke-boot.sh <bundle-dir> [node-binary]}"
NODE_BIN="${2:-node}"
TIMEOUT="${WEKAN_SMOKE_TIMEOUT:-90}"
# A port nothing listens on, so the connection is refused at once rather than
# hanging: the point is to reach the attempt, not to wait for a timeout.
DEAD_DB="mongodb://127.0.0.1:1/wekan"
PORT_UNDER_TEST="${WEKAN_SMOKE_PORT:-31313}"

if [ ! -f "$BUNDLE/main.js" ]; then
    echo "::error::bundle-smoke-boot: $BUNDLE has no main.js, so it is not a bundle."
    exit 2
fi

log="$(mktemp)"
trap 'rm -f "$log"' EXIT

echo "--- smoke: starting the bundle with a database that cannot answer"
(
    cd "$BUNDLE" || exit 1
    PORT="$PORT_UNDER_TEST" \
    ROOT_URL="http://localhost:$PORT_UNDER_TEST" \
    MONGO_URL="$DEAD_DB" \
    MONGO_OPLOG_URL="" \
    timeout "$TIMEOUT" "$NODE_BIN" main.js
) > "$log" 2>&1
rc=$?

# The server got far enough to want its database: everything before that loaded.
if grep -qE 'MongoServerSelectionError|MongoTopologyClosedError|ECONNREFUSED 127\.0\.0\.1:1|connect ECONNREFUSED' "$log"; then
    echo "--- smoke: OK - the bundle loaded and reached its database connection."
    exit 0
fi

# The two shapes that have actually shipped. Named separately because the fix for
# each is a different one, and a build log should say which.
if grep -q 'Cannot find module' "$log"; then
    echo "::error::bundle-smoke-boot: this bundle is missing a module it links at startup. Something removed a package that IS reachable - see the 'Cannot find module' line below. releases/prune-unreachable-npm.mjs is what removes packages; its graph must count Meteor's module.link() calls, not only require()."
    grep -m3 -A2 'Cannot find module' "$log" >&2
    exit 1
fi
if grep -qE "ENOENT.*\.map'|ENOENT: no such file" "$log"; then
    echo "::error::bundle-smoke-boot: this bundle is missing a file it opens at startup. If it is a .map, boot.js reads every map NAMED in programs/server/program.json - releases/bundle-trim.mjs has to remove the name with the file."
    grep -m3 -B1 -A2 'ENOENT' "$log" >&2
    exit 1
fi

if [ "$rc" -eq 124 ]; then
    echo "::error::bundle-smoke-boot: the bundle neither failed nor reached its database within ${TIMEOUT}s. That is not a pass - it means this check could not tell whether the bundle loads."
else
    echo "::error::bundle-smoke-boot: the bundle exited ($rc) without reaching its database. The last lines of its output are below."
fi
tail -30 "$log" >&2
exit 1
