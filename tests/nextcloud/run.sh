#!/bin/sh
# Repository-local native Nextcloud acceptance matrix (Linux x86_64).
set -eu
cd "$(dirname "$0")/../.."
mkdir -p .tools/tmp
export TMPDIR="$PWD/.tools/tmp"
if [ "${1:-}" = "--help" ]; then
  echo 'Usage: bash build.sh nextcloud-tests [32|33|34|35 ...]'
  echo 'First: python3 tests/nextcloud/bootstrap.py --version VERSION'
  exit 0
fi
[ "$#" -gt 0 ] || set -- 32 33 34 35
node_version=$(python3 -c 'import re; from pathlib import Path; print(re.search(r"NODE_VERSION[=:]([^\s]+)", Path("Dockerfile").read_text()).group(1).lstrip("v"))')
node="${NODE_BINARY:-$PWD/.tools/node-v${node_version}-linux-x64/bin/node}"
"$node" tests/run-node-suites.cjs nextcloud Nextcloud
"$node" --test .tools/nextcloud/tests/*.test.mjs
export PATH="$(dirname "$node"):$PWD/.tools/.meteor:$PATH"
export METEOR_WAREHOUSE_DIR="$PWD/.tools/.meteor"
export npm_config_cache="$PWD/.tools/nextcloud-runtime/npm-cache"
logdir="$PWD/.tools/log/nextcloud-build/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$logdir"
echo "Building current source for upgrade tests; log: $logdir/source-build.log"
meteor build .tools/nextcloud-runtime/source --directory --server-only > "$logdir/source-build.log" 2>&1
npm install --prefix .tools/nextcloud-runtime/source/bundle/programs/server > "$logdir/server-dependencies.log" 2>&1
candidate_version=$(python3 -c 'import json; from pathlib import Path; v=list(map(int,json.loads(Path(".tools/nextcloud-runtime/versions.json").read_text())["wekan"].split("."))); v += [0]*(3-len(v)); v[2]+=1; print(".".join(map(str,v)))')
for major in "$@"; do
  python3 tests/nextcloud/native.py --major "$major" \
    --upgrade-from .tools/nextcloud-runtime/wekan/bundle \
    --candidate-bundle .tools/nextcloud-runtime/source/bundle --candidate-version "$candidate_version"
done
# Exercise the production Unix-socket tunnel with mutual TLS below a URL prefix.
python3 tests/nextcloud/native.py --major "$major" --subpath /cloud --frp-tls \
  --upgrade-from .tools/nextcloud-runtime/wekan/bundle \
  --candidate-bundle .tools/nextcloud-runtime/source/bundle --candidate-version "$candidate_version"
