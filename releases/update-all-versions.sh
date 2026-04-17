#!/bin/bash
# Update versions.
# Usage:
#   ./releases/update-all-versions.sh PREVIOUS_VERSION LATEST_VERSION
#   ./releases/update-all-versions.sh 8.88 8.89

echo "This needs fixing."
exit

set -e

OLD=$1
NEW=$2

set -euo pipefail
if ! command -v curl >/dev/null 2>&1; then
  echo "curl not found. Please install curl."
  exit 1
fi

show_node_version() {
  cat ~/repos/wekan/Dockerfile | grep NODE_VERSION=v | sed 's|\\||g' - | sed 's| ||g' - | sed 's|NODE_VERSION=v||g' -
}

sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}


echo "Please run ./releases/update-all-versions.sh to update all version numbers before release."
LATEST_VERSION_INT=$(echo "$LATEST_VERSION" | tr -d '.')
# Extract release date
RELEASE_DATE=$(echo "$CHANGELOG_LINE" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')
if [ -z "$RELEASE_DATE" ]; then
  RELEASE_DATE=$(date +%Y-%m-%d)
fi
LATEST_VERSION_MARKETING="${LATEST_VERSION}~${RELEASE_DATE}"
# Update all version numbers in key files
sed -i "0,/\"version\": \"[^"]*\"/s//\"version\": \"v${LATEST_VERSION}\"/" package.json
sed -i "0,/\"version\": \"[^"]*\"/s//\"version\": \"v${LATEST_VERSION}\"/" package-lock.json
sed -i "0,/appVersion: \"[^"]*\"/s/appVersion: \"[^"]*\"/appVersion: \"v${LATEST_VERSION}\"/" Stackerfile.yml
sed -i "0,/appVersion = [0-9]\+/s/appVersion = [0-9]\+/appVersion = ${LATEST_VERSION_INT}/" sandstorm-pkgdef.capnp
sed -i "0,/appMarketingVersion = (defaultText = \"[^"]*\")/s/appMarketingVersion = (defaultText = \"[^"]*\")/appMarketingVersion = (defaultText = \"${LATEST_VERSION_MARKETING}\")/" sandstorm-pkgdef.capnp
# snapcraft.yaml
sed -i "0,/^version: '[^']*'/s/^version: '[^']*'/version: '${LATEST_VERSION}'/" snapcraft.yaml
# All URLs, filenames, and commands referencing the version
sed -i "s|v[0-9]\+\.[0-9]\+|v${LATEST_VERSION}|g" snapcraft.yaml
sed -i "s|[0-9]\+\.[0-9]\+-amd64|${LATEST_VERSION}-amd64|g" snapcraft.yaml
sed -i "s|[0-9]\+\.[0-9]\+\.zip|${LATEST_VERSION}.zip|g" snapcraft.yaml
sed -i "s|[0-9]\+\.[0-9]\+\.[0-9]\+-amd64|${LATEST_VERSION}.0-amd64|g" snapcraft.yaml
sed -i "s|[0-9]\+\.[0-9]\+\.[0-9]\+|${LATEST_VERSION}.0|g" snapcraft.yaml
echo "latest_version=$LATEST_VERSION" >> $GITHUB_OUTPUT
# snapcraft.yaml
# version: (top-level)
sed -i "0,/^version: '[^']*'/s/^version: '[^']*'/version: '${NEW_VERSION}'/" snapcraft.yaml
# All URLs, filenames, and commands referencing the version
sed -i "s|v[0-9]\+\.[0-9]\+|v${NEW_VERSION}|g" snapcraft.yaml
sed -i "s|[0-9]\+\.[0-9]\+-amd64|${NEW_VERSION}-amd64|g" snapcraft.yaml
sed -i "s|[0-9]\+\.[0-9]\+\.zip|${NEW_VERSION}.zip|g" snapcraft.yaml
sed -i "s|[0-9]\+\.[0-9]\+\.[0-9]\+-amd64|${NEW_VERSION}.0-amd64|g" snapcraft.yaml
sed -i "s|[0-9]\+\.[0-9]\+\.[0-9]\+|${NEW_VERSION}.0|g" snapcraft.yaml

# -----------------------

OLD_NO_DOTS=$(echo "$OLD" | tr -d '.')
NEW_NO_DOTS=$(echo "$NEW" | tr -d '.')

# package.json and package-lock.json
sedi 's|"version": "v'"$OLD"'\.\([0-9]*\)"|"version": "v'"$NEW"'.\1"|g' \
  package.json package-lock.json

# Stackerfile.yml
sedi 's|appVersion: "v'"$OLD"'\.\([0-9]*\)"|appVersion: "v'"$NEW"'.\1"|g' \
  Stackerfile.yml

# Dockerfile
sedi "s|ARG VERSION=$OLD|ARG VERSION=$NEW|g" Dockerfile

# snapcraft.yaml
sedi "s|^version: '$OLD'|version: '$NEW'|" snapcraft.yaml
sedi "s|wekan-$OLD-|wekan-$NEW-|g" snapcraft.yaml
sedi "s|/v$OLD/|/v$NEW/|g" snapcraft.yaml

# docs/Platforms/Propietary/Windows/Offline.md
sedi "s|wekan-$OLD-|wekan-$NEW-|g" \
  docs/Platforms/Propietary/Windows/Offline.md
sedi "s|/v$OLD/|/v$NEW/|g" \
  docs/Platforms/Propietary/Windows/Offline.md

# sandstorm-pkgdef.capnp
sedi "s|appVersion = $OLD_NO_DOTS,|appVersion = $NEW_NO_DOTS,|g" \
  sandstorm-pkgdef.capnp
sedi 's|"'"$OLD"'\.0~|"'"$NEW"'.0~|g' sandstorm-pkgdef.capnp

# Update node version
NEW_NODE=$(curl -fsSL https://nodejs.org/dist/latest-v24.x/ \
  | grep -o 'node-v24\.[0-9][0-9]*\.[0-9][0-9]*-linux-x64\.tar\.gz' \
  | head -1 \
  | sed 's/node-v\(.*\)-linux-x64\.tar\.gz/\1/')
if [ -z "$NEW_NODE" ]; then
  echo "Error: could not determine latest Node.js 24.x version." >&2
  exit 1
fi
echo "  Latest Node.js 24.x: $NEW_NODE"
# Dockerfile
sedi "s|NODE_VERSION=v24\.[0-9][0-9]*\.[0-9][0-9]*|NODE_VERSION=v${NEW_NODE}|g" Dockerfile
# snapcraft.yaml
sedi "s|npm-node-version: 24\.[0-9][0-9]*\.[0-9][0-9]*|npm-node-version: ${NEW_NODE}|g" snapcraft.yaml
sedi "s|NODE_VERSION=\"24\.[0-9][0-9]*\.[0-9][0-9]*\"|NODE_VERSION=\"${NEW_NODE}\"|g" snapcraft.yaml
sedi "s|Node\.js 24\.[0-9][0-9]*\.[0-9][0-9]* binary|Node.js ${NEW_NODE} binary|g" snapcraft.yaml
# .github/workflows/release-all.yml
WORKFLOW=".github/workflows/release-all.yml"
sedi "s|node-version: '24\.[0-9][0-9]*\.[0-9][0-9]*'|node-version: '${NEW_NODE}'|g" "$WORKFLOW"
sedi "s|node:24\.[0-9][0-9]*\.[0-9][0-9]*-slim|node:${NEW_NODE}-slim|g" "$WORKFLOW"
