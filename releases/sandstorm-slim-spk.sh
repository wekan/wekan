#!/usr/bin/env bash
# Build the WeKan Sandstorm .spk with only what a grain runs.
#
#   releases/sandstorm-slim-spk.sh <output.spk> [spk pack options...]
#
# Design and numbers: docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md
#
# It does what `meteor-spk pack` does - `meteor build` into .meteor-spk/bundle,
# `npm install` in its programs/server, then `spk pack` with .meteor-spk/deps
# beside it - with three differences:
#
#   1. the build runs with the Sandstorm package profile
#      (releases/sandstorm-slim.mjs): no password, 2FA, passwordless, OAuth2,
#      OIDC, CAS, LDAP, SAML or social-login packages. .meteor/packages is
#      edited for the build only and put back afterwards, even on failure;
#   2. the bundle is trimmed to a linux/x64 sockjs grain BEFORE packing
#      (bundle-trim, prune-unreachable-npm, prune-build-only-modules), instead
#      of only on a retry after a failed pack;
#   3. `spk pack` packs the trimmed trees directly. `meteor-spk pack` would
#      rebuild the bundle first and throw the trim away.
#
# The deps tree is the one sandstorm-src/build-deps.sh assembles; its FerretDB
# is the prebuilt SQLite-only ferretdb-sqlite-amd64 from wekan/FerretDB
# (releases/ferretdb-asset.sh).
#
# Env:
#   DEPS     the meteor-spk.deps directory   [.tools/projects/meteor-spk/meteor-spk-0.6.0/meteor-spk.deps]
#   SPK      the Sandstorm spk binary        [first of /opt/sandstorm/latest/bin/spk, spk]
#   METEOR   the meteor command              [meteor]
#   SANDSTORM_SLIM_NO_PACK=1  stop after the trimmed bundle is verified
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

OUT="${1:-}"
if [ -z "$OUT" ] && [ "${SANDSTORM_SLIM_NO_PACK:-}" != "1" ]; then
  echo "usage: releases/sandstorm-slim-spk.sh <output.spk> [spk pack options...]" >&2
  exit 2
fi
[ $# -gt 0 ] && shift

DEPS="${DEPS:-$WEKAN_METEOR_SPK_DIR/meteor-spk-0.6.0/meteor-spk.deps}"
METEOR="${METEOR:-meteor}"
SPK_BIN="${SPK:-}"
if [ -z "$SPK_BIN" ]; then
  for candidate in /opt/sandstorm/latest/bin/spk "$(command -v spk 2>/dev/null || true)"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then SPK_BIN="$candidate"; break; fi
  done
fi

restore() {
  node releases/sandstorm-slim.mjs restore .meteor/packages || true
  # meteor build rewrites .meteor/versions for the slimmed list; put it back too.
  if [ -f .meteor/versions.sandstorm-slim-orig ]; then
    mv -f .meteor/versions.sandstorm-slim-orig .meteor/versions
  fi
}
trap restore EXIT

echo "==> [1/5] Sandstorm package profile"
cp -f .meteor/versions .meteor/versions.sandstorm-slim-orig
node releases/sandstorm-slim.mjs apply .meteor/packages

echo "==> [2/5] meteor build (Sandstorm profile)"
rm -rf .meteor-spk/bundle
mkdir -p .meteor-spk
"$METEOR" build --directory .meteor-spk
(cd .meteor-spk/bundle/programs/server && "$METEOR" npm install)

echo "==> [3/5] trim the bundle to a linux/x64 sockjs grain"
# A grain is linux/x64, always, and talks DDP over sockjs (sandstorm-pkgdef.capnp
# pins DDP_TRANSPORT=sockjs) - see bundle-trim.mjs for what each flag drops.
node releases/bundle-trim.mjs .meteor-spk/bundle --platform linux --arch x64 \
  --transport sockjs --drop-legacy-client --trim-prebuilds
node releases/prune-unreachable-npm.mjs .meteor-spk/bundle --sandstorm
node releases/prune-build-only-modules.mjs .meteor-spk/bundle

echo "==> [4/5] verify: no excluded package reached the bundle"
node releases/sandstorm-slim.mjs verify .meteor-spk/bundle
python3 releases/check-telemetry.py --bundle .meteor-spk/bundle
du -sh .meteor-spk/bundle 2>/dev/null || true
[ -e "$DEPS" ] && du -shL "$DEPS" 2>/dev/null || true

if [ "${SANDSTORM_SLIM_NO_PACK:-}" = "1" ]; then
  echo "SANDSTORM_SLIM_NO_PACK=1: stopping before spk pack"
  exit 0
fi

echo "==> [5/5] spk pack (the trimmed trees, no rebuild)"
[ -d "$DEPS" ] || { echo "no meteor-spk.deps at $DEPS - run sandstorm-src/build-deps.sh first" >&2; exit 1; }
[ -n "$SPK_BIN" ] || { echo "no spk binary: install Sandstorm, or set SPK=/path/to/spk" >&2; exit 1; }
# -n (BSD and GNU) replaces an existing link instead of entering it, as -T did.
ln -sfn "$DEPS" .meteor-spk/deps
"$SPK_BIN" pack "$@" "$OUT"
SPK_BYTES=$(wc -c < "$OUT" | tr -d " ")   # wc -c: the same with GNU and BSD tools
echo "Packed $OUT: $((SPK_BYTES/1024/1024)) MiB ($SPK_BYTES bytes)"
