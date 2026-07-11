#!/usr/bin/env bash
# Assemble a modernized meteor-spk.deps for the WeKan Sandstorm .spk:
#   Node 24 + FerretDB v1 + Mongo 3.x CLIs + the migration launcher/importer,
#   on top of upstream meteor-spk 0.6.0 (which already has mongod 3.0 + niscud).
#
# See docs/Platforms/FOSS/Sandstorm/Meteor3/Migration.md.
#
# NOT tested end-to-end. Run on ubuntu-24.04 (amd64). The result is at
# $OUT/meteor-spk-0.6.0 ; add its dir to PATH and run `meteor-spk pack`.
#
# No dependency on releases.wekan.team (gone) or the old projects.7z: the base is
# fetched from dl.sandstorm.io and the extra binaries from GitHub releases.
#
# Env (override as needed):
#   OUT             work/output dir                    [$HOME/projects/meteor-spk]
#   NODE_VERSION    Node major/exact to bundle         [24]  (match Meteor 3.5's node)
#   FERRETDB_URL    URL of the ferretdb-amd64 binary   [newest wekan/FerretDB release]
#   MIGRATEMONGO    git URL of the Mongo 3.x CLIs      [github.com/wekan/migratemongo]
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"     # wekan repo root
OUT="${OUT:-$HOME/projects/meteor-spk}"
NODE_VERSION="${NODE_VERSION:-24}"
MIGRATEMONGO="${MIGRATEMONGO:-https://github.com/wekan/migratemongo.git}"
SPK_URL="https://dl.sandstorm.io/meteor-spk-0.6.0.tar.xz"

DEPS="$OUT/meteor-spk-0.6.0/meteor-spk.deps"
mkdir -p "$OUT"

echo "==> [1/7] Base: meteor-spk 0.6.0 (has mongod 3.0 + niscud + old node_modules)"
if [ ! -d "$OUT/meteor-spk-0.6.0" ]; then
  curl -fsSL "$SPK_URL" -o "$OUT/meteor-spk-0.6.0.tar.xz"
  tar -xJf "$OUT/meteor-spk-0.6.0.tar.xz" -C "$OUT"
fi
[ -x "$DEPS/bin/mongod" ] && [ -x "$DEPS/bin/niscud" ] || { echo "base deps missing mongod/niscud"; exit 1; }

echo "==> [2/7] Node ${NODE_VERSION} (replaces bundled Node 14)"
# Prefer the EXACT node from Meteor 3.5's dev bundle (ABI match with the WeKan
# bundle's native addons); fall back to the newest ${NODE_VERSION}.x from nodejs.org.
NODE_BIN=""
if command -v meteor >/dev/null 2>&1; then
  DEVBUNDLE="$(meteor node -e 'console.log(process.execPath)' 2>/dev/null || true)"
  [ -x "$DEVBUNDLE" ] && NODE_BIN="$DEVBUNDLE"
fi
if [ -z "$NODE_BIN" ]; then
  NV="$(curl -fsSL https://nodejs.org/dist/index.json | \
        node -e 'const v=JSON.parse(require("fs").readFileSync(0)).find(x=>x.version.startsWith("v'"$NODE_VERSION"'."));console.log(v.version)')"
  curl -fsSL "https://nodejs.org/dist/${NV}/node-${NV}-linux-x64.tar.xz" -o "$OUT/node.tar.xz"
  tar -xJf "$OUT/node.tar.xz" -C "$OUT"
  NODE_BIN="$OUT/node-${NV}-linux-x64/bin/node"
fi
cp -f "$NODE_BIN" "$DEPS/bin/node"
"$DEPS/bin/node" --version || { echo "bundled node does not run on this host"; exit 1; }

echo "==> [3/7] Refresh runtime libs for Node 24 + FerretDB (host glibc 2.35 on ubuntu-24.04)"
# Node 24 needs a newer libstdc++/glibc than 0.6.0's (2.31). Copy the host's from
# ubuntu-24.04. mongod 3.0 / niscud (built for older glibc) still run (glibc is
# backward-compatible). The Mongo 3.x CLIs get their OWN old libs (step 5).
HOSTLIB=/usr/lib/x86_64-linux-gnu
mkdir -p "$DEPS/lib/x86_64-linux-gnu"
for so in libstdc++.so.6 libgcc_s.so.1 libc.so.6 libm.so.6 libdl.so.2 \
          libpthread.so.0 librt.so.1 libz.so.1; do
  src="$(readlink -f "$HOSTLIB/$so" 2>/dev/null || true)"
  [ -f "$src" ] && cp -fL "$src" "$DEPS/lib/x86_64-linux-gnu/$so"
done
# NOTE: if `meteor-spk pack` / `spk dev` later reports a missing library for node
# or ferretdb, add it here (or use `spk dev` tracing to regenerate the tree).

echo "==> [4/7] FerretDB v1 (amd64) at deps root"
# Download only the amd64 binary from the newest wekan/FerretDB release (per-arch
# assets, no ferretdb.zip). /releases/latest/download/<asset> resolves to the
# newest non-prerelease release.
FERRETDB_URL="${FERRETDB_URL:-https://github.com/wekan/FerretDB/releases/latest/download/ferretdb-amd64}"
curl -fsSL "$FERRETDB_URL" -o "$DEPS/ferretdb"
chmod +x "$DEPS/ferretdb"

echo "==> [4b/7] MongoDB Database Tools (amd64) at deps root"
# Modern MongoDB Database Tools (backup/restore against FerretDB v1 / MongoDB 7),
# per-arch from the wekan/mongo-tools fork — not from the MongoDB website. These
# are separate from the legacy MongoDB 3.2 CLIs in migratemongo/ used for the
# one-time MongoDB 3 -> FerretDB migration below.
MONGOTOOLS_BASE="${MONGOTOOLS_BASE:-https://github.com/wekan/mongo-tools/releases/latest/download}"
for t in bsondump mongodump mongoexport mongofiles mongoimport mongorestore mongostat mongotop; do
  curl -fsSL "$MONGOTOOLS_BASE/$t-amd64" -o "$DEPS/$t"
  chmod +x "$DEPS/$t"
done

echo "==> [5/7] Mongo 3.x CLIs (mongo + mongoexport) + their old libs -> migratemongo/"
if [ ! -d "$OUT/migratemongo" ]; then
  git clone --depth 1 "$MIGRATEMONGO" "$OUT/migratemongo"
fi
mkdir -p "$DEPS/migratemongo/bin" "$DEPS/migratemongo/lib"
cp -f "$OUT/migratemongo/bin/mongo" "$OUT/migratemongo/bin/mongoexport" "$DEPS/migratemongo/bin/"
cp -af "$OUT/migratemongo/lib/x86_64-linux-gnu/." "$DEPS/migratemongo/lib/"
chmod +x "$DEPS/migratemongo/bin/"*

echo "==> [6/7] Launcher + importer"
cp -f "$REPO/sandstorm-src/start.js"                       "$DEPS/start.js"
cp -f "$REPO/snap-src/bin/migrate-mongo3-to-ferretdb.mjs"  "$DEPS/migrate-mongo3-to-ferretdb.mjs"

echo "==> [7/7] niscud + old node_modules kept for the niscu->3.0 stage:"
ls -la "$DEPS/bin/niscud" "$DEPS/node_modules/mongodb" >/dev/null 2>&1 \
  && echo "    ok (present)" || echo "    WARNING: niscud/node_modules missing from base"

echo
echo "Done. meteor-spk.deps assembled at: $DEPS"
echo "Next:  export PATH=\"$OUT/meteor-spk-0.6.0:\$PATH\"  &&  cd $REPO  &&  meteor-spk pack wekan.spk"
