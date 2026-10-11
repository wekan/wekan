#!/usr/bin/env bash
# Assemble a modernized meteor-spk.deps for the WeKan Sandstorm .spk:
#   Node 26 + FerretDB v1 + Mongo 3.x CLIs + the migration launcher/importer,
#   on top of upstream meteor-spk 0.6.0 (which already has mongod 3.0 + niscud).
#
# See docs/Platforms/FOSS/Container/Sandstorm/Meteor3/Migration.md.
#
# NOT tested end-to-end. Run on ubuntu-24.04 (amd64). The result is at
# $OUT/meteor-spk-0.6.0 ; add its dir to PATH and run `meteor-spk pack`.
#
# No dependency on releases.wekan.team (gone) or the old projects.7z: the base is
# fetched from dl.sandstorm.io and the extra binaries from GitHub releases.
#
# Env (override as needed):
#   OUT             work/output dir                    [$HOME/projects/meteor-spk]
#   SANDSTORM_NODE_VERSION  exact Node to bundle   [the Dockerfile's NODE_VERSION]
#   FERRETDB_TAG    wekan/FerretDB release to bundle   [newest release]
#   FERRETDB_URL    URL of the ferretdb-amd64 binary   [that release's asset]
#
# The grain gets the SAME Node.js and FerretDB as every other platform: the exact
# Node the Dockerfile pins and the FerretDB release ferretdb-latest-tag.sh names,
# which are the versions https://wekan.fi/version.txt advertises (written by
# releases/update-website-version-info.sh from those same two sources). npm is
# not bundled - a grain never runs it - but the workflows that pack the .spk
# install the Dockerfile's NPM_VERSION through releases/use-release-npm.sh.
#   MIGRATEMONGO    git URL of the Mongo 3.x CLIs      [github.com/wekan/migratemongo]
set -euo pipefail


# Every download here goes through releases/fetch.sh, which waits out a 5xx or a
# dropped connection (about fifteen minutes) and still fails at once on a 404.
# github.com spent an afternoon returning 503 and this script died on
#
#   curl: (56) Connection died, tried 5 times before giving up
#
# at "[4/7] FerretDB v1 (amd64)", taking the whole Sandstorm build with it.
FETCH="$(cd "$(dirname "$0")/.." && pwd)/releases/fetch.sh"

REPO="$(cd "$(dirname "$0")/.." && pwd)"     # wekan repo root
OUT="${OUT:-$HOME/projects/meteor-spk}"
# Not $NODE_VERSION: the workflows set that to the bare major ('26') for
# setup-node, and the grain must get the exact patch release, not "newest 26.x".
NODE_PIN="${SANDSTORM_NODE_VERSION:-$(sed -n 's/.*NODE_VERSION=\(v[0-9][0-9.]*\).*/\1/p' "$REPO/Dockerfile" | head -1)}"
[[ "$NODE_PIN" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "no exact NODE_VERSION in $REPO/Dockerfile (got '$NODE_PIN')" >&2; exit 1; }
MIGRATEMONGO="${MIGRATEMONGO:-https://github.com/wekan/migratemongo.git}"
SPK_URL="https://dl.sandstorm.io/meteor-spk-0.6.0.tar.xz"

DEPS="$OUT/meteor-spk-0.6.0/meteor-spk.deps"
mkdir -p "$OUT"

echo "==> [1/7] Base: meteor-spk 0.6.0 (has mongod 3.0 + niscud + old node_modules)"
if [ ! -d "$OUT/meteor-spk-0.6.0" ]; then
  bash "$FETCH" -o "$OUT/meteor-spk-0.6.0.tar.xz" "$SPK_URL"
  tar -xJf "$OUT/meteor-spk-0.6.0.tar.xz" -C "$OUT"
fi
[ -x "$DEPS/bin/mongod" ] && [ -x "$DEPS/bin/niscud" ] || { echo "base deps missing mongod/niscud"; exit 1; }

echo "==> [2/7] Node ${NODE_PIN} (replaces bundled Node 14)"
# The exact Node the Dockerfile pins, from the source releases/resolve-node-source.sh
# picks for linux-x64 and verified against the SHA256 that source publishes - the
# same helper the zip bundles embed their Node with. Not Meteor's dev-bundle node:
# that follows the Meteor release rather than version.txt.
mkdir -p "$DEPS/bin"
bash "$REPO/releases/embed-verified-node.sh" "$DEPS/bin/node" node-x64 "$NODE_PIN"
GOT="$("$DEPS/bin/node" --version)" || { echo "bundled node does not run on this host"; exit 1; }
[ "$GOT" = "$NODE_PIN" ] || { echo "bundled node is $GOT, expected $NODE_PIN" >&2; exit 1; }

echo "==> [3/7] Refresh runtime libs for Node 26 + FerretDB (host glibc 2.35 on ubuntu-24.04)"
# Node 26 needs a newer libstdc++/glibc than 0.6.0's (2.31). Copy the host's from
# ubuntu-24.04. mongod 3.0 / niscud (built for older glibc) still run (glibc is
# backward-compatible). The Mongo 3.x CLIs get their OWN old libs (step 5).
HOSTLIB=/usr/lib/x86_64-linux-gnu
mkdir -p "$DEPS/lib/x86_64-linux-gnu"
for so in libstdc++.so.6 libgcc_s.so.1 libc.so.6 libm.so.6 libdl.so.2 \
          libpthread.so.0 librt.so.1 libz.so.1 libatomic.so.1; do
  src="$(readlink -f "$HOSTLIB/$so" 2>/dev/null || true)"
  # --remove-destination: the meteor-spk 0.6.0 base ships some of these as
  # DANGLING symlinks (e.g. libstdc++.so.6 -> a lib that no longer exists), and
  # plain `cp -fL` refuses with "not writing through dangling symlink". Remove the
  # existing destination (symlink included) first, then copy the host's real lib.
  [ -f "$src" ] && cp -fL --remove-destination "$src" "$DEPS/lib/x86_64-linux-gnu/$so"
done
# libatomic is mandatory for Node 26, even when it was present only on the host.
[ -f "$DEPS/lib/x86_64-linux-gnu/libatomic.so.1" ] || { echo "missing libatomic1" >&2; exit 1; }
mkdir -p "$DEPS/usr/share/doc/libatomic1"
cp -L /usr/share/doc/libatomic1/copyright "$DEPS/usr/share/doc/libatomic1/"
# CRITICAL: the dynamic loader (ld-linux) MUST come from the SAME glibc as the
# libc.so.6 copied above. libc and ld.so share a GLIBC_PRIVATE ABI: a glibc 2.39
# libc.so.6 asks the loader for `_dl_audit_symbind_alt` (added to ld.so in glibc
# 2.35). The meteor-spk 0.6.0 base ships an OLD ld-linux (glibc 2.31) at
# /lib64/ld-linux-x86-64.so.2, so without this step node dies at startup with
#   "libc.so.6: undefined symbol: _dl_audit_symbind_alt, version GLIBC_PRIVATE"
# (HTTP-BRIDGE exit 127) and the grain never boots. Node's PT_INTERP is
# /lib64/ld-linux-x86-64.so.2, so overwrite the base's loader with the host's.
LOADER="$(readlink -f /lib64/ld-linux-x86-64.so.2 2>/dev/null || \
          readlink -f "$HOSTLIB/ld-linux-x86-64.so.2")"
[ -f "$LOADER" ] || { echo "host dynamic loader not found"; exit 1; }
mkdir -p "$DEPS/lib64"
cp -fL --remove-destination "$LOADER" "$DEPS/lib64/ld-linux-x86-64.so.2"
# Also mirror it under lib/x86_64-linux-gnu in case anything resolves it there.
cp -fL --remove-destination "$LOADER" "$DEPS/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2"
# NOTE: if `meteor-spk pack` / `spk dev` later reports a missing library for node
# or ferretdb, add it here (or use `spk dev` tracing to regenerate the tree).

echo "==> [4/7] FerretDB v1 (amd64) at deps root"
# Download only the amd64 binary (per-arch assets, no ferretdb.zip) of the newest
# wekan/FerretDB release, named by its TAG so the log says which version the grain
# got. That is the version version.txt shows. If the tag cannot be looked up,
# /releases/latest/download/ is the same release, just unnamed.
FERRETDB_TAG="${FERRETDB_TAG:-$(bash "$REPO/releases/ferretdb-latest-tag.sh")}"
if [ -n "$FERRETDB_TAG" ]; then
  FERRETDB_URL="${FERRETDB_URL:-https://github.com/wekan/FerretDB/releases/download/$FERRETDB_TAG/ferretdb-amd64}"
else
  FERRETDB_URL="${FERRETDB_URL:-https://github.com/wekan/FerretDB/releases/latest/download/ferretdb-amd64}"
fi
echo "    FerretDB ${FERRETDB_TAG:-latest}: $FERRETDB_URL"
bash "$FETCH" -o "$DEPS/ferretdb" "$FERRETDB_URL"
chmod +x "$DEPS/ferretdb"
python3 "$REPO/releases/check-telemetry.py" --kind ferretdb "$DEPS/ferretdb"

# NOTE: the modern MongoDB Database Tools (wekan/mongo-tools-patches: mongodump, mongorestore,
# …) are intentionally NOT bundled in the Sandstorm .spk. They are ~300 MB and are
# not used here — Sandstorm backs up/restores whole grains itself, and the one-time
# MongoDB 3 -> FerretDB migration below uses the legacy migratemongo CLIs + the .mjs
# importer (which talks to FerretDB via the bundle's own `mongodb` driver). Leaving
# them out keeps the .spk small enough to upload (Cloudflare caps uploads at 100 MB).
# They ARE embedded in the WeKan .zip bundle / Docker / Snap, which do use them.

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
# start-memory.js, not .sh: the grain has no shell (see the file's header).
cp -f "$REPO/sandstorm-src/start-memory.js"                "$DEPS/start-memory.js"
rm -f "$DEPS/start-memory.sh"
cp -f "$REPO/sandstorm-src/migration-bridge.js"            "$DEPS/migration-bridge.js"
cp -f "$REPO/snap-src/bin/migrate-mongo3-to-ferretdb.mjs"  "$DEPS/migrate-mongo3-to-ferretdb.mjs"
# #6458: cpu-exec + qemu-user — run any binary that needs CPU features the
# grain host lacks (e.g. AVX for MongoDB 5+) through qemu-user emulation.
# The bundled mongod 3.0/niscud need no special features, so this is
# future-proofing; tolerant when qemu-user-static is not installed.
cp -f "$REPO/snap-src/bin/cpu-exec" "$DEPS/bin/cpu-exec"
chmod +x "$DEPS/bin/cpu-exec"
if [ -x /usr/bin/qemu-x86_64-static ]; then
  cp -f /usr/bin/qemu-x86_64-static "$DEPS/bin/qemu-x86_64"
  chmod +x "$DEPS/bin/qemu-x86_64"
  echo "    bundled qemu-x86_64 for cpu-exec"
else
  echo "    qemu-user-static not installed; spk ships cpu-exec without a bundled qemu-user"
fi

# The meteor-spk base's node-capnp (33.6 MB capnp.node, built for Node 14, so it
# cannot load on Node 26). WeKan speaks Cap'n Proto to the bridge through
# @wekanteam/capnp-es (imports/sandstorm/bridgeClient.mjs), which needs no
# native code, so nothing loads it - and it counts toward Sandstorm's 1 GiB.
rm -rf "$DEPS/programs/server/node_modules/capnp.node" "$DEPS/programs/server/node_modules/capnp.js"

echo "==> [7/7] niscud + old node_modules kept for the niscu->3.0 stage:"
ls -la "$DEPS/bin/niscud" "$DEPS/node_modules/mongodb" >/dev/null 2>&1 \
  && echo "    ok (present)" || echo "    WARNING: niscud/node_modules missing from base"

echo "==> [bridge] Replace the ancient bundled sandstorm-http-bridge with a modern one"
# The meteor-spk 0.6.0 base bundles a ~2016 sandstorm-http-bridge (pkgdef argv
# "/sandstorm-http-bridge"). Old bridges mangle some responses - e.g. they always
# advertise "Accept-Encoding: gzip" to the app and mishandle redirect/encoding, so
# the grain boots but the page fails with a browser "Corrupted Content Error"
# (NS_ERROR_NET_CORRUPTED_CONTENT) on WeKan's "/" redirect. Overwrite the bundled
# bridge with the modern one from a Sandstorm install (Sandstorm is amd64-only, so
# a single binary covers it). Set SANDSTORM_HTTP_BRIDGE to override the source path.
BRIDGE_SRC=""
for p in "${SANDSTORM_HTTP_BRIDGE:-}" \
         /opt/sandstorm/latest/bin/sandstorm-http-bridge \
         /opt/sandstorm/sandstorm-http-bridge; do
  [ -n "$p" ] && [ -x "$p" ] && BRIDGE_SRC="$p" && break
done
if [ -n "$BRIDGE_SRC" ]; then
  # Replace every bundled copy under the deps, wherever meteor-spk sourced it, and
  # ensure the one at the deps root (which maps to the grain's /sandstorm-http-bridge).
  found=0
  while IFS= read -r b; do
    cp -fL --remove-destination "$BRIDGE_SRC" "$b"; chmod +x "$b"; found=1
    echo "    replaced $b"
  done < <(find "$DEPS" -name sandstorm-http-bridge -type f 2>/dev/null)
  cp -fL --remove-destination "$BRIDGE_SRC" "$DEPS/sandstorm-http-bridge"
  chmod +x "$DEPS/sandstorm-http-bridge"
  echo "    installed modern bridge from $BRIDGE_SRC (existing copies replaced: $found)"
else
  echo "    WARNING: no modern sandstorm-http-bridge found (looked in /opt/sandstorm)."
  echo "    Install Sandstorm on the build host, or set SANDSTORM_HTTP_BRIDGE=/path/to/sandstorm-http-bridge."
  echo "    Keeping the base's ancient bridge - the grain may show 'Corrupted Content Error'."
fi

echo "==> [verify] glibc: bundled libc.so.6 and ld-linux must match, and node must run under them"
# Guards against the glibc drift that otherwise only surfaces as a grain
# crash-loop ("undefined symbol: _dl_audit_symbind_alt, version GLIBC_PRIVATE").
# glibc_ver extracts "X.Y" from a glibc .so run as an executable. libc.so.6 prints
# "... stable release version X.Y." when run bare; ld-linux only prints its banner
# with --version (bare it prints usage to stderr). Try --version first, fall back to
# bare, and never fail the pipeline (|| true) so `set -e` + an empty match can't
# abort the script — an empty result is handled explicitly by the check below.
glibc_ver() {
  { "$1" --version 2>/dev/null || "$1" 2>/dev/null || true; } \
    | grep -oE 'version [0-9]+\.[0-9]+' | head -1 | awk '{print $2}' || true
}
LIBC_SO="$DEPS/lib/x86_64-linux-gnu/libc.so.6"
LD_SO="$DEPS/lib64/ld-linux-x86-64.so.2"
[ -f "$LIBC_SO" ] || { echo "    FAIL: $LIBC_SO missing"; exit 1; }
[ -f "$LD_SO" ]   || { echo "    FAIL: $LD_SO missing (loader not bundled)"; exit 1; }
LIBC_V="$(glibc_ver "$LIBC_SO")"
LD_V="$(glibc_ver "$LD_SO")"
echo "    libc.so.6 = glibc ${LIBC_V:-?} ; ld-linux = glibc ${LD_V:-?}"
if [ -z "$LIBC_V" ] || [ -z "$LD_V" ] || [ "$LIBC_V" != "$LD_V" ]; then
  echo "    FAIL: bundled libc.so.6 (${LIBC_V:-?}) and ld-linux (${LD_V:-?}) glibc versions differ."
  echo "          The grain would crash-loop at node startup. Fix step [3/7] so both come"
  echo "          from the same host glibc."
  exit 1
fi
# Definitive check: run the bundled node THROUGH the bundled loader + libs, exactly
# as the grain will. Catches any remaining missing/mismatched .so before packing.
if ! "$LD_SO" --library-path "$DEPS/lib/x86_64-linux-gnu" "$DEPS/bin/node" --version >/dev/null 2>&1; then
  echo "    FAIL: bundled node does not run under the bundled loader/libs:"
  "$LD_SO" --library-path "$DEPS/lib/x86_64-linux-gnu" "$DEPS/bin/node" --version || true
  exit 1
fi
echo "    ok: node runs under bundled glibc ${LIBC_V} (matches loader)"

echo
echo "Done. meteor-spk.deps assembled at: $DEPS"
echo "Next:  export PATH=\"$OUT/meteor-spk-0.6.0:\$PATH\"  &&  cd $REPO  &&  meteor-spk pack wekan.spk"
