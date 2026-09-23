#!/bin/bash
# Wrap an already built macOS release bundle in a Finder-launchable .app ZIP.
set -euo pipefail

if [ "$#" -ne 4 ]; then
  echo "Usage: $0 BUNDLE_DIR VERSION arm64|amd64 OUTPUT_DIR" >&2
  exit 2
fi
source_bundle="$(cd "$1" && pwd -P)"
version="$2"
arch="$3"
output="$4"

[[ "$version" =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]] || { echo "Invalid version: $version" >&2; exit 2; }
case "$arch" in arm64) machine=arm64 ;; amd64) machine=x86_64 ;; *) echo "Unsupported Mac architecture: $arch" >&2; exit 2 ;; esac
for file in main.js node ferretdb start-wekan.sh; do
  [ -f "$source_bundle/$file" ] || { echo "Missing bundle/$file" >&2; exit 1; }
done
for file in node ferretdb; do
  [ -x "$source_bundle/$file" ] || { echo "bundle/$file is not executable" >&2; exit 1; }
  lipo -archs "$source_bundle/$file" | grep -Eq "(^| )${machine}( |$)" || {
    echo "bundle/$file does not contain $machine code" >&2; exit 1;
  }
done

python3 "$(dirname "$0")/../check-telemetry.py" --bundle "$source_bundle"

mkdir -p "$output"
output="$(cd "$output" && pwd -P)"
name="WeKan-${version}-mac-${arch}"
app="$output/$name.app"
rm -rf "$app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"
ditto "$source_bundle" "$app/Contents/Resources/bundle"
cp "$(dirname "$0")/launch-wekan.command" "$app/Contents/Resources/"
chmod +x "$app/Contents/Resources/launch-wekan.command" \
  "$app/Contents/Resources/bundle/node" \
  "$app/Contents/Resources/bundle/ferretdb" \
  "$app/Contents/Resources/bundle/start-wekan.sh"

clang -O2 -arch "$machine" "$(dirname "$0")/WeKanLauncher.c" -o "$app/Contents/MacOS/WeKan"
lipo -archs "$app/Contents/MacOS/WeKan" | grep -Eq "(^| )${machine}( |$)" || {
  echo "The app launcher was compiled for the wrong Mac architecture" >&2; exit 1;
}
sips -s format icns "$(dirname "$0")/../../public/android-chrome-512x512.png" \
  --out "$app/Contents/Resources/WeKan.icns" >/dev/null

cat > "$app/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleDevelopmentRegion</key><string>en</string>
  <key>CFBundleDisplayName</key><string>WeKan</string>
  <key>CFBundleExecutable</key><string>WeKan</string>
  <key>CFBundleIconFile</key><string>WeKan</string>
  <key>CFBundleIdentifier</key><string>org.wekan.wekan</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>WeKan</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$version</string>
  <key>CFBundleVersion</key><string>$version</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
plutil -lint "$app/Contents/Info.plist"

# Ad hoc signing keeps the app structurally valid on Apple Silicon. A public
# download still needs Developer ID signing and notarization to avoid Gatekeeper.
codesign --force --sign - --timestamp=none "$app"
codesign --verify --strict "$app"

zip="$output/$name.app.zip"
ditto -c -k --sequesterRsrc --keepParent "$app" "$zip"
( cd "$output" && shasum -a 256 "$(basename "$zip")" > "$(basename "$zip").sha256sum" )
echo "$zip"
