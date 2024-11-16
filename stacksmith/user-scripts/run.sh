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
#---------------------------------------------------------------------
# https://github.com/wekan/wekan/issues/3585#issuecomment-1021522132
# Add more Node heap:
#export NODE_OPTIONS="--max_old_space_size=4096"
# Add more stack:
#bash -c "ulimit -s 65500; exec node --stack-size=65500 main.js"
#bash -c "ulimit -s 65500; exec --stack-size=65500 --max-old-space-size=8192 node main.js"
bash -c "ulimit -s 65500; exec node main.js"
#---------------------------------------------------------------------
#node main.js
