#!/usr/bin/env bash
#
# sandstorm-capnp-schemas.sh - regenerate the JavaScript that WeKan uses to
# talk to sandstorm-http-bridge over Cap'n Proto RPC, and build the C++ test
# peer that checks it.
#
# WeKan reaches the bridge's /tmp/sandstorm-api socket with
# @wekanteam/capnp-es (npm-packages/capnp-es), a pure-JavaScript Cap'n Proto
# implementation, instead of the native node-capnp addon (capnp.node), which
# is built for Node 14 and cannot load on Node 26. The classes it needs are
# generated from Sandstorm's own .capnp schemas by the fork's compiler:
#
#   imports/sandstorm/capnp/*.mjs          the Sandstorm schemas WeKan uses
#   tests/fixtures/capnp-rpc/rpc-fixture.mjs   the RPC conformance fixture
#
# Both are committed, so neither a build nor a grain runs this. Run it when
# the Sandstorm schemas, the fork's compiler or the fixture change.
#
#   releases/sandstorm-capnp-schemas.sh            regenerate the .mjs files
#   releases/sandstorm-capnp-schemas.sh --mock     also build the C++ peer at
#                                                  .tools/capnp-rpc/mock-bridge
#
# Everything it downloads or builds goes under .tools/ (see CLAUDE.md):
#   .tools/capnproto   Cap'n Proto 1.2.0, built from its release source - the
#                      `capnp` schema compiler and the C++ RPC libraries
#   .tools/sandstorm   sandstorm-io/sandstorm at the commit pinned below
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp
# Older macOS has no sha256sum; shasum -a 256 prints the same "hash  file" lines and takes -c.
command -v sha256sum >/dev/null 2>&1 || sha256sum() { shasum -a 256 "$@"; }

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS="$REPO/.tools"
mkdir -p "$TOOLS/tmp"
export TMPDIR="$TOOLS/tmp"
FETCH="$REPO/releases/fetch.sh"

CAPNP_VERSION=1.2.0
CAPNP_SHA256=ed00e44ecbbda5186bc78a41ba64a8dc4a861b5f8d4e822959b0144ae6fd42ef
SANDSTORM_COMMIT=a97cf3ee19d3bf2761cd597583ca5d998de425d8
TYPESCRIPT_VERSION=5.9.3

# The schemas WeKan's bridge client loads, and every file they import.
SCHEMAS="sandstorm-http-bridge package grain identity powerbox util api-session activity ip email hack-session"
# What the C++ peer is compiled from.
MOCK_SCHEMAS="sandstorm-http-bridge grain identity powerbox util activity"

CAPNP_PREFIX="$TOOLS/capnproto"
if [ ! -x "$CAPNP_PREFIX/bin/capnp" ] || [ ! -f "$CAPNP_PREFIX/lib/libcapnp-rpc.a" ]; then
  echo "==> Building Cap'n Proto $CAPNP_VERSION into $CAPNP_PREFIX"
  work="$(mktemp -d "$TMPDIR/wekan.XXXXXX")"
  bash "$FETCH" -o "$work/capnproto.tar.gz" "https://capnproto.org/capnproto-c++-$CAPNP_VERSION.tar.gz"
  echo "$CAPNP_SHA256  $work/capnproto.tar.gz" | sha256sum -c -
  tar -xzf "$work/capnproto.tar.gz" -C "$work"
  (cd "$work/capnproto-c++-$CAPNP_VERSION" &&
    ./configure --prefix="$CAPNP_PREFIX" --disable-shared >/dev/null &&
    make -j"$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 2)" install >/dev/null)
  rm -rf "$work"
fi
export PATH="$CAPNP_PREFIX/bin:$PATH"
# The fork's compiler runs `capnpc`, which is `capnp compile` by another name.
ln -sfn capnp "$CAPNP_PREFIX/bin/capnpc"

if [ ! -d "$TOOLS/sandstorm/.git" ]; then
  git clone https://github.com/sandstorm-io/sandstorm.git "$TOOLS/sandstorm"
fi
if [ "$(git -C "$TOOLS/sandstorm" rev-parse HEAD)" != "$SANDSTORM_COMMIT" ]; then
  git -C "$TOOLS/sandstorm" fetch --depth 1 origin "$SANDSTORM_COMMIT"
  git -C "$TOOLS/sandstorm" checkout --quiet "$SANDSTORM_COMMIT"
fi
SRC="$TOOLS/sandstorm/src"

# The fork's compiler emits JavaScript by way of TypeScript, which is only an
# optional peer dependency of the package. Run it from a scratch copy with
# TypeScript beside it, so nothing is added to the repository's dependencies.
# Its type check cannot see the other generated files (it resolves imports in
# memory only), so its diagnostics are reported but do not stop the emit; the
# load check at the end is what decides whether the output is usable.
gen="$(mktemp -d "$TMPDIR/wekan.XXXXXX")"
trap 'rm -rf "$gen"' EXIT
cp -r "$REPO/npm-packages/capnp-es" "$gen/capnp-es"
(cd "$gen/capnp-es" && npm install --no-save --no-package-lock --ignore-scripts \
  "typescript@$TYPESCRIPT_VERSION" >/dev/null)
compiler="$gen/capnp-es/dist/shared/$(grep -l 'GEN_TS_EMIT_FAILED);' "$gen"/capnp-es/dist/shared/*.mjs | xargs -n1 basename)"
# -i.bak, not a bare -i: GNU and BSD sed differ there; the backup is removed.
sed -i.bak 's|    throw new Error(GEN_TS_EMIT_FAILED);|    /* generation only: diagnostics reported above */|' "$compiler" && rm -f "$compiler.bak"

compile() { # <out-dir> <src-prefix> <files...>
  local out="$1" prefix="$2"; shift 2
  mkdir -p "$out"
  node "$gen/capnp-es/dist/compiler/capnpc-js.mjs" "-ojs:$out" \
    "-I$CAPNP_PREFIX/include" "-I$SRC" "--src-prefix=$prefix" "$@" \
    < /dev/null > "$gen/compile.log" 2>&1 || { cat "$gen/compile.log"; exit 1; }
}

# capnp-es writes `.js` that imports "capnp-es"; WeKan names the fork
# @wekanteam/capnp-es, and `.mjs` keeps Node from having to guess that these
# are ES modules when the plain-Node test suites import them.
finish() { # <out-dir> <dest-dir> <header>
  local out="$1" dest="$2" header="$3"
  mkdir -p "$dest"
  for f in "$out"/*.js; do
    name="$(basename "$f" .js)"
    { echo "// GENERATED by releases/sandstorm-capnp-schemas.sh - do not edit."
      echo "// $header"
      sed -e '1{/automatically generated by capnp-es/d}' \
          -e 's|from "capnp-es"|from "@wekanteam/capnp-es"|' \
          -e 's|from "capnp-es/|from "@wekanteam/capnp-es/|' \
          -e 's|from "\./\([^"]*\)\.js"|from "./\1.mjs"|' "$f"
    } > "$dest/$name.mjs"
  done
}

echo "==> Sandstorm schemas -> imports/sandstorm/capnp/"
files=(); for s in $SCHEMAS; do files+=("$SRC/sandstorm/$s.capnp"); done
compile "$gen/sandstorm" "$SRC/sandstorm" "${files[@]}"
rm -f "$REPO"/imports/sandstorm/capnp/*.mjs
finish "$gen/sandstorm" "$REPO/imports/sandstorm/capnp" \
  "From sandstorm-io/sandstorm $SANDSTORM_COMMIT src/sandstorm/<name>.capnp."

echo "==> RPC fixture -> tests/fixtures/capnp-rpc/rpc-fixture.mjs"
compile "$gen/fixture" "$REPO/tests/fixtures/capnp-rpc" "$REPO/tests/fixtures/capnp-rpc/rpc-fixture.capnp"
finish "$gen/fixture" "$REPO/tests/fixtures/capnp-rpc" "From tests/fixtures/capnp-rpc/rpc-fixture.capnp."

# Every generated module must load, imports and all: the type check above is
# blind to the other files, so this is the check that counts.
# They resolve @wekanteam/capnp-es from the checkout's node_modules, which
# `npm install` links to npm-packages/capnp-es.
[ -e "$REPO/node_modules/@wekanteam/capnp-es" ] || { echo "run npm install first" >&2; exit 1; }
for f in "$REPO"/imports/sandstorm/capnp/*.mjs "$REPO/tests/fixtures/capnp-rpc/rpc-fixture.mjs"; do
  node --input-type=module -e "await import(process.argv[1])" "$f" < /dev/null ||
    { echo "does not load: $f" >&2; exit 1; }
done
echo "    all generated modules load"

if [ "${1:-}" = "--mock" ]; then
  echo "==> C++ peer -> .tools/capnp-rpc/mock-bridge"
  build="$TOOLS/capnp-rpc"
  rm -rf "$build"; mkdir -p "$build/sandstorm"
  for s in $MOCK_SCHEMAS; do cp "$SRC/sandstorm/$s.capnp" "$build/sandstorm/"; done
  cp "$REPO/tests/fixtures/capnp-rpc/rpc-fixture.capnp" "$build/"
  (cd "$build" &&
    capnp compile "-I$CAPNP_PREFIX/include" -I. -oc++ sandstorm/*.capnp rpc-fixture.capnp &&
    g++ -std=c++20 -O1 "-I$CAPNP_PREFIX/include" -I. -o mock-bridge \
      "$REPO/tests/fixtures/capnp-rpc/mock-bridge.c++" sandstorm/*.capnp.c++ rpc-fixture.capnp.c++ \
      "$CAPNP_PREFIX/lib/libcapnp-rpc.a" "$CAPNP_PREFIX/lib/libcapnp.a" \
      "$CAPNP_PREFIX/lib/libkj-async.a" "$CAPNP_PREFIX/lib/libkj.a" -lpthread)
  echo "    built $build/mock-bridge"
fi
