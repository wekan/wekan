#!/usr/bin/env bash
#
# build-release-bundle.sh — turn `meteor build .build --directory` into the
# bundle a WeKan RELEASE ships, for the machine it is run on, without the .zip.
#
# WHY THIS EXISTS. `meteor build` produces a bundle nobody downloads. What a
# release publishes is that bundle plus eleven steps: the server's npm modules
# installed, three trees pruned, the legacy client and the source maps removed,
# a verified Node.js, FerretDB, the MongoDB Database Tools and a launcher
# embedded. Everything WeKan has shipped broken lately broke in the difference
# between the two — v10.96 died on a source map the trim deleted and left named,
# v10.97 on a package the prune's graph could not see, and the Sandstorm pack
# was throwing its own trim away — and none of it was reproducible locally,
# because locally there was only `meteor build`. So the answer to "does this
# bundle start at all" took a release, a workflow run and a download.
#
# It runs the SAME scripts the workflow runs, in the same order, with the same
# arguments. That is the point: not a second implementation of the release, but
# the release's own steps driven from a terminal.
#
#   Usage: bash releases/build-release-bundle.sh [bundle-dir]
#
#     bundle-dir   default .build/bundle
#
#   Environment:
#     WEKAN_BUNDLE_PLATFORM   override the detected platform (amd64, arm64,
#                             mac-arm64, mac-x64, win64, win32, win-arm64)
#     WEKAN_BUNDLE_REFRESH=1  ignore the download cache and fetch again
#     WEKAN_BUNDLE_SKIP_SMOKE=1  skip the boot check (it is the point; do not)
#     NODE_VERSION            the Node MAJOR to embed, default 24 — the same
#                             value .github/workflows/release-all.yml pins
#
# WHAT IT DOES NOT DO, on purpose: no zip, no checksum file, no provenance row,
# no GitHub Release. Those describe a published artifact, and this one is not
# published — it is the directory, ready to start:
#
#     cd .build/bundle && ./start-wekan.sh
#
# The launcher is start-wekan.sh because that is the launcher a release ships;
# a start.sh added here would be the first way this bundle differed from one.
#
# THE DOWNLOAD CACHE. A release job downloads Node.js, FerretDB and eight
# MongoDB tools every run, on a machine that is thrown away afterwards. A
# developer rebuilding all afternoon is not, so the downloads are kept under
# .tools/bundle-binaries/<platform>/ and reused. Each is verified against its
# published SHA256 when it is fetched, and the checksum is kept beside it and
# re-checked on every reuse — a cache hit is not a check skipped.

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
BUNDLE="${1:-$ROOT/.build/bundle}"
BUNDLE="$(cd "$(dirname "$BUNDLE")" 2>/dev/null && pwd)/$(basename "$BUNDLE")"
NODE_VERSION="${NODE_VERSION:-24}"
CACHE_ROOT="${WEKAN_BUNDLE_CACHE:-$ROOT/.tools/bundle-binaries}"

say()  { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[ -f "$BUNDLE/main.js" ] || fail "$BUNDLE has no main.js. Run 'meteor build .build --directory' first (build.sh menu option 2 does)."

# ── Which platform is this? ──────────────────────────────────────────────────
#
# The names are WeKan's own, the ones the release assets use, because every
# script below takes one: resolve-node-source.sh, the FerretDB asset name and
# the mongo-tools suffix all spell the CPU the same way.
detect_platform() {
    local os arch
    os="$(uname -s)"
    arch="$(uname -m)"
    case "$os" in
        Linux)
            case "$arch" in
                x86_64|amd64)  echo amd64 ;;
                aarch64|arm64) echo arm64 ;;
                armv7l)        echo armhf ;;
                ppc64le)       echo ppc64le ;;
                s390x)         echo s390x ;;
                riscv64)       echo riscv64 ;;
                i686|i386)     echo i386 ;;
                *)             echo "" ;;
            esac ;;
        Darwin)
            case "$arch" in
                arm64)  echo mac-arm64 ;;
                x86_64) echo mac-x64 ;;
                *)      echo "" ;;
            esac ;;
        MINGW*|MSYS*|CYGWIN*)
            case "$arch" in
                x86_64) echo win64 ;;
                aarch64|arm64) echo win-arm64 ;;
                i686)   echo win32 ;;
                *)      echo "" ;;
            esac ;;
        *) echo "" ;;
    esac
}

PLATFORM="${WEKAN_BUNDLE_PLATFORM:-$(detect_platform)}"
[ -n "$PLATFORM" ] || fail "cannot tell what platform $(uname -s)/$(uname -m) is. Set WEKAN_BUNDLE_PLATFORM."

# Windows names its binaries with an extension and ships a .bat launcher; every
# other platform does not. One variable each, rather than an `if` per step.
case "$PLATFORM" in
    win64|win32|win-arm64)
        NODE_DEST="node.exe"; FERRET_DEST="ferretdb.exe"
        FERRET_ASSET="ferretdb-${PLATFORM}.exe"
        LAUNCHER="start-wekan.bat"; EXE=".exe" ;;
    *)
        NODE_DEST="node"; FERRET_DEST="ferretdb"
        FERRET_ASSET="ferretdb-${PLATFORM}"
        LAUNCHER="start-wekan.sh"; EXE="" ;;
esac

# qemu-user, for #6458: a bundled binary that needs CPU features this machine
# lacks runs through it. Only the Linux bundles carry one, and only for their
# own arch.
case "$PLATFORM" in
    amd64) QEMU_NAME="qemu-x86_64"; QEMU_SRC="/usr/bin/qemu-x86_64-static" ;;
    arm64) QEMU_NAME="qemu-aarch64"; QEMU_SRC="/usr/bin/qemu-aarch64-static" ;;
    *)     QEMU_NAME=""; QEMU_SRC="" ;;
esac

CACHE="$CACHE_ROOT/$PLATFORM"
mkdir -p "$CACHE"

say "Building the $PLATFORM RELEASE bundle in $BUNDLE"
echo "    the same steps as .github/workflows/release-all.yml, without the zip"

# ── 1. The server's npm modules, and the three prunes ────────────────────────
#
# Verbatim from the workflow's "Install server npm modules" step, in its order.
# The order is not arbitrary: bump-bundle-npm-deps raises what Meteor's own
# packages bundle, and both trims measure the tree the bump left.
say "1/6  npm install + prune-build-only + bump-bundle-npm-deps"
(
    cd "$BUNDLE/programs/server" || exit 1
    bash "$ROOT/releases/npm-retry.sh" npm install
) || fail "npm install in $BUNDLE/programs/server failed."

node "$ROOT/releases/prune-build-only-modules.mjs" "$BUNDLE" || fail "prune-build-only-modules failed."
node "$ROOT/releases/bump-bundle-npm-deps.mjs" "$BUNDLE"     || fail "bump-bundle-npm-deps failed."

# WeKan runs sockjs on every platform, so no bundle ships uWebSockets.js;
# --drop-legacy-client removes the second client build and its name in the two
# manifests that list it; the source maps go with them.
say "2/6  bundle-trim (sockjs, no legacy client, no source maps)"
node "$ROOT/releases/bundle-trim.mjs" "$BUNDLE" --transport sockjs --drop-legacy-client \
    || fail "bundle-trim failed."

say "3/6  prune-unreachable-npm"
node "$ROOT/releases/prune-unreachable-npm.mjs" "$BUNDLE" || fail "prune-unreachable-npm failed."

# ── 2. Does it start? ────────────────────────────────────────────────────────
#
# Before any binary is embedded, because this is the step that answers the
# question the whole script exists for, and it needs nothing but a node.
if [ "${WEKAN_BUNDLE_SKIP_SMOKE:-0}" = "1" ]; then
    say "4/6  smoke boot SKIPPED (WEKAN_BUNDLE_SKIP_SMOKE=1)"
else
    say "4/6  does the bundle actually start?"
    bash "$ROOT/releases/bundle-smoke-boot.sh" "$BUNDLE" \
        || fail "the bundle does not boot. That is the answer this build was for - the output above says what it could not load."
fi

# ── 3. The binaries ──────────────────────────────────────────────────────────
#
# fetch_cached <url> <cache-name> <dest> — download once, verify against the
# .sha256sum the source publishes, keep both, and re-verify on every reuse.
# Returns 1 when the source has no such asset, which some platforms' FerretDB
# legitimately is; 2 when a checksum was published and did NOT match, which is
# never legitimate.
sha_of() {
    if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1
    else shasum -a 256 "$1" | cut -d' ' -f1; fi
}

fetch_cached() {
    local url="$1" name="$2" dest="$3"
    local file="$CACHE/$name" sumfile="$CACHE/$name.sha256"

    if [ "${WEKAN_BUNDLE_REFRESH:-0}" = "1" ]; then rm -f "$file" "$sumfile"; fi

    if [ ! -s "$file" ]; then
        bash "$ROOT/releases/fetch.sh" --optional -o "$file.part" "$url" || { rm -f "$file.part"; return 1; }
        if bash "$ROOT/releases/fetch.sh" --optional -o "$sumfile.part" "${url}.sha256sum"; then
            awk '{print $1; exit}' "$sumfile.part" > "$sumfile"
            rm -f "$sumfile.part"
        else
            rm -f "$sumfile.part" "$sumfile"
            echo "    warning: the source publishes no checksum for $name, so it is unverified."
        fi
        mv "$file.part" "$file"
        echo "    downloaded $name"
    else
        echo "    cached     $name"
    fi

    # A cache hit is checked too. A file on disk for a week is exactly the file
    # worth re-checking, and the check costs a hash of something already read.
    if [ -s "$sumfile" ]; then
        local want got
        want="$(cat "$sumfile")"
        got="$(sha_of "$file")"
        if [ "$want" != "$got" ]; then
            rm -f "$file" "$sumfile"
            echo "    $name does not match its published SHA256 (published $want, got $got); removed from the cache." >&2
            return 2
        fi
    fi

    cp "$file" "$dest"
    chmod +x "$dest" 2>/dev/null || true
    return 0
}

say "5/6  embedding Node.js, FerretDB, the MongoDB tools and the launcher"

# Node.js, through the release's own resolver: nodejs.org, then
# unofficial-builds, then wekan/node-patches, verified against the SHA256 that
# source published. Exit 3 means no source has one for this CPU - which is how
# a platform stops being built - so it is reported as that rather than as a
# failure.
node_meta="$(bash "$ROOT/releases/embed-verified-node.sh" "$BUNDLE/$NODE_DEST" "$PLATFORM" "$NODE_VERSION")"
case $? in
    0) eval "$node_meta"; echo "    node       ${node_full:-v$NODE_VERSION} from ${node_from:-?}" ;;
    3) fail "no source publishes a Node.js $NODE_VERSION for $PLATFORM, so a release would not build this platform either." ;;
    *) fail "embedding Node.js failed." ;;
esac

# FerretDB. Tolerated when the release has no asset for this platform, exactly
# as the workflow tolerates it: the bundle is then MongoDB-only and the launcher
# says so when it cannot find ./ferretdb.
FERRET_URL="https://github.com/wekan/FerretDB/releases/latest/download/$FERRET_ASSET"
fetch_cached "$FERRET_URL" "$FERRET_ASSET" "$BUNDLE/$FERRET_DEST"
case $? in
    0) echo "    ferretdb   $FERRET_ASSET" ;;
    1) rm -f "$BUNDLE/$FERRET_DEST"
       echo "    warning: wekan/FerretDB publishes no $FERRET_ASSET, so this bundle is MongoDB-only." ;;
    2) fail "FerretDB does not match its published SHA256." ;;
esac

# The MongoDB Database Tools, from wekan/mongo-tools-patches - the same eight,
# per arch, that every release bundle carries.
for t in bsondump mongodump mongoexport mongofiles mongoimport mongorestore mongostat mongotop; do
    asset="$t-${PLATFORM}${EXE}"
    fetch_cached "https://github.com/wekan/mongo-tools-patches/releases/latest/download/$asset" \
        "$asset" "$BUNDLE/$t$EXE"
    case $? in
        0) : ;;
        1) echo "    warning: no $asset published; the bundle has no $t." ;;
        2) fail "$asset does not match its published SHA256." ;;
    esac
done

# The launcher, and #6458's cpu-exec + qemu-user beside it.
cp "$ROOT/releases/ferretdb/$LAUNCHER" "$BUNDLE/"
cp "$ROOT/releases/ferretdb/startup-network.cjs" "$BUNDLE/"
chmod +x "$BUNDLE/$LAUNCHER" 2>/dev/null || true
if [ -n "$QEMU_NAME" ]; then
    cp "$ROOT/snap-src/bin/cpu-exec" "$BUNDLE/cpu-exec" && chmod +x "$BUNDLE/cpu-exec"
    if [ -x "$QEMU_SRC" ]; then
        cp "$QEMU_SRC" "$BUNDLE/$QEMU_NAME" && chmod +x "$BUNDLE/$QEMU_NAME"
    else
        echo "    warning: $QEMU_SRC is not installed (apt install qemu-user-static), so this bundle has no $QEMU_NAME."
    fi
fi

# ── 4. Say what is there ─────────────────────────────────────────────────────
say "6/6  done"
size="$(du -sh "$BUNDLE" 2>/dev/null | cut -f1)"
echo "    $BUNDLE  ($size)"
for f in "$NODE_DEST" "$FERRET_DEST" "$LAUNCHER" main.js; do
    if [ -e "$BUNDLE/$f" ]; then echo "    ok      $f"; else echo "    MISSING $f"; fi
done
# The two directories a release does NOT ship, named so their absence is a
# result rather than something to wonder about.
for d in programs/web.browser.legacy programs/server/npm/node_modules/uWebSockets.js; do
    if [ -e "$BUNDLE/$d" ]; then echo "    STILL PRESENT $d - the trim did not run"; else echo "    removed $d"; fi
done
cat <<EOF

    Start it with:

        cd $BUNDLE && ./$LAUNCHER

    It runs on the bundled Node.js against the bundled FerretDB (SQLite),
    storing everything under ./data. No MongoDB and no system Node needed.
EOF
