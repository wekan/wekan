#!/usr/bin/env bash
# Builds one Bun single file and checks it before it may be published
# (.github/workflows/bun-single-file.yml). Run on the target's own platform:
#   ZIP=<bundle.zip> BUN=<the bundle's own bun> OUT=<file> VERSION=<v> TARGET=<t>
set -euo pipefail
: "${ZIP:?}" "${BUN:?}" "${OUT:?}" "${VERSION:?}" "${TARGET:?}"

"$BUN" releases/single-file/bun/build.mjs --zip "$ZIP" --target "$TARGET" --version "$VERSION" --out "$OUT"

exe="./$OUT"
cache="$(mktemp -d)"
trap 'rm -rf "$cache"' EXIT

# It names itself.
"$exe" --version | grep -F "WeKan $VERSION (Bun single file, $TARGET)"

# It refuses to start without a database, as bundle/start-wekan.sh does.
if env -u MONGO_URL -u ROOT_URL "$exe" >/dev/null 2>&1; then
  echo "::error::$TARGET: started without MONGO_URL"; exit 1
fi

# It extracts the bundle - without a second Bun - and the extraction is reused.
dir="$(WEKAN_SINGLE_FILE_CACHE="$cache" "$exe" --extract-only)"
[ -f "$dir/index.mjs" ] || { echo "::error::$TARGET: no index.mjs in $dir"; exit 1; }
[ -f "$dir/.extracted" ] || { echo "::error::$TARGET: extraction not marked complete"; exit 1; }
if [ -e "$dir/bun" ] || [ -e "$dir/bun.exe" ]; then echo "::error::$TARGET: the bundle's bun was extracted"; exit 1; fi
again="$(WEKAN_SINGLE_FILE_CACHE="$cache" "$exe" --extract-only)"
[ "$again" = "$dir" ] || { echo "::error::$TARGET: a second start extracted again"; exit 1; }

# Its native addons load with the embedded Bun: the bundle's own check, as
# bun.yml runs it on the unpacked bundle.
case "$TARGET" in
  linux-*) plat=linux ;; macos-*) plat=darwin ;; windows-*) plat=win32 ;; *) plat= ;;
esac
case "$TARGET" in *-x64*) arch=x64 ;; *-arm64*) arch=arm64 ;; *) arch= ;; esac
if [ -n "$plat" ] && [ -n "$arch" ] && [ -f "$dir/bun-native-packages.json" ]; then
  BUN_BE_BUN=1 "$exe" releases/bun/check-native.mjs "$dir" "$plat" "$arch" \
    || { echo "::error::$TARGET: native addons do not load under the single file"; exit 1; }
fi

if command -v sha256sum >/dev/null; then sha256sum "$OUT" > "$OUT.sha256sum"; else shasum -a 256 "$OUT" > "$OUT.sha256sum"; fi
ls -la "$OUT" "$OUT.sha256sum"
