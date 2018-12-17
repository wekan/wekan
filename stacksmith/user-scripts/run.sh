#!/bin/bash
set -euo pipefail

readonly CONF=/build/env.config

source ${CONF}

# wait for DB
check_db() {
    mongo $MONGO_URL --eval "db.runCommand( { connectionStatus: 1} )" --quiet |  python -c 'import json,sys;obj=json.load(sys.stdin);code = 0 if obj["ok"]==1 else 1; sys.exit(code);'
}
until check_db; do
    period=5
    echo "Cannot connect to db, waiting ${period} seconds before trying again..."
    sleep ${period}
done

cd /build
echo "starting the wekan service..."
node main.js
