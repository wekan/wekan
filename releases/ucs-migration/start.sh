#!/bin/bash
# Explicit UCS-only command. The image's normal WeKan CMD never invokes this.
set -euo pipefail
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if [ "${1:-}" = --check ]; then
    command -v node >/dev/null
    docker --version
    for script in run.mjs importer.mjs verify.mjs; do node --check "$root/$script"; done
    test -x "$root/tools/mongo"
    test -x "$root/tools/mongoexport"
    node -e 'const {createRequire}=require("node:module"); const r=createRequire("/build/programs/server/npm/node_modules/meteor/npm-mongo/node_modules/_.cjs"); if(typeof r("mongodb").MongoClient !== "function" || typeof r("mongodb").BSON.EJSON.parse !== "function") process.exit(1)'
    exit 0
fi
export BUNDLE_ROOT=/build MONGO_BIN_DIR="$root/tools" SRC_PORT=27017 SRC_DB=wekan
export TARGET_MONGO_URL=mongodb://127.0.0.1:27017/wekan
export WRITABLE_PATH="${WRITABLE_PATH:-/data}" MIGRATION_PORT=8099
exec node "$root/run.mjs"
