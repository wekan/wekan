
#!/bin/bash

# Portable sedi function for macOS/Linux compatibility
sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

# --- Version bump logic from release-all.yml ---

# Auto-detect versions from CHANGELOG.md if not provided as arguments
if [ -z "$1" ] || [ -z "$2" ]; then
  RELEASE_LINES=( $(grep -E '^# v[0-9]+\.[0-9]+(\.[0-9]+)?[ -]+[0-9]{4}-[0-9]{2}-[0-9]{2}' CHANGELOG.md | head -2) )
  NEW_VERSION=$(echo "${RELEASE_LINES[0]}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
  OLD_VERSION=$(echo "${RELEASE_LINES[1]}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
  if [ -z "$NEW_VERSION" ] || [ -z "$OLD_VERSION" ]; then
    echo "Could not determine both latest and previous version from CHANGELOG.md" >&2
    exit 1
  fi
else
  OLD_VERSION="$1"
  NEW_VERSION="$2"
fi

version_bump_logic() {
  # expects OLD_VERSION and NEW_VERSION to be set

  # Detect latest MongoDB 7.x version and update snapcraft.yaml and Offline.md
  MONGO_LINE=$(curl -fsSL https://www.mongodb.com/try/download/community | grep -o 'mongodb-linux-x86_64-ubuntu[0-9]\+-7\.[0-9][0-9]*\.[0-9][0-9]*\.tgz' | sort -u | sort -t- -k4,4nr | head -1)
  if [ -z "$MONGO_LINE" ]; then
    echo "Error: could not determine latest MongoDB 7.x version." >&2
    exit 1
  fi
  UBUNTU_VER=$(echo "$MONGO_LINE" | sed -E 's/.*ubuntu([0-9]+)-7\..*/\1/')
  MONGO_VER=$(echo "$MONGO_LINE" | sed -E 's/.*-7/7/' | sed 's/\.tgz$//')
  echo "Detected latest MongoDB 7.x: $MONGO_VER for Ubuntu $UBUNTU_VER"
  sedi "s|mongodb-linux-x86_64-ubuntu[0-9]\+-7\.[0-9][0-9]*\.[0-9][0-9]*|mongodb-linux-x86_64-ubuntu${UBUNTU_VER}-$MONGO_VER|g" snapcraft.yaml
  sedi "s|mongodb-linux-x86_64-ubuntu[0-9]\+-7\.[0-9][0-9]*\.[0-9][0-9]*|mongodb-linux-x86_64-ubuntu${UBUNTU_VER}-$MONGO_VER|g" docs/Platforms/Propietary/Windows/Offline.md

  # Update Node.js version in Dockerfile and snapcraft.yaml
  NEW_NODE=$(curl -fsSL https://nodejs.org/dist/latest-v24.x/ \
    | grep -o 'node-v24\.[0-9][0-9]*\.[0-9][0-9]*-linux-x64\.tar\.gz' \
    | head -1 \
    | sed 's/node-v\(.*\)-linux-x64\.tar\.gz/\1/')
  if [ -z "$NEW_NODE" ]; then
    echo "Error: could not determine latest Node.js 24.x version." >&2
    exit 1
  fi
  sedi "s|NODE_VERSION=v24\.[0-9][0-9]*\.[0-9][0-9]*|NODE_VERSION=v${NEW_NODE}|g" Dockerfile
  sedi "s|npm-node-version: 24\.[0-9][0-9]*\.[0-9][0-9]*|npm-node-version: ${NEW_NODE}|g" snapcraft.yaml
  sedi "s|NODE_VERSION=\"24\.[0-9][0-9]*\.[0-9][0-9]*\"|NODE_VERSION=\"${NEW_NODE}\"|g" snapcraft.yaml
  sedi "s|Node\.js 24\.[0-9][0-9]*\.[0-9][0-9]* binary|Node.js ${NEW_NODE} binary|g" snapcraft.yaml

  # Update version numbers in release files
  OLD_NO_DOTS=$(echo "$OLD_VERSION" | tr -d '.')
  NEW_NO_DOTS=$(echo "$NEW_VERSION" | tr -d '.')
  sedi "0,/\"version\": \"[^\"]*\"/s//\"version\": \"v${NEW_VERSION}\"/" package.json
  sedi "0,/\"version\": \"[^\"]*\"/s//\"version\": \"v${NEW_VERSION}\"/" package-lock.json
  sedi "0,/appVersion: \"[^\"]*\"/s/appVersion: \"[^\"]*\"/appVersion: \"v${NEW_VERSION}\"/" Stackerfile.yml
  sedi "0,/appVersion = [0-9]\+/s/appVersion = [0-9]\+/appVersion = ${NEW_NO_DOTS}/" sandstorm-pkgdef.capnp
  sedi "0,/appMarketingVersion = (defaultText = \"[^\"]*\")/s/appMarketingVersion = (defaultText = \"[^\"]*\")/appMarketingVersion = (defaultText = \"${NEW_VERSION}\")/" sandstorm-pkgdef.capnp
  sedi "0,/^version: '[^']*'/s/^version: '[^']*'/version: '${NEW_VERSION}'/" snapcraft.yaml
  sedi "s|v[0-9]\+\.[0-9]\+|v${NEW_VERSION}|g" snapcraft.yaml
  sedi "s|[0-9]\+\.[0-9]\+-amd64|${NEW_VERSION}-amd64|g" snapcraft.yaml
  sedi "s|[0-9]\+\.[0-9]\+\.zip|${NEW_VERSION}.zip|g" snapcraft.yaml
  sedi "s|[0-9]\+\.[0-9]\+\.[0-9]\+-amd64|${NEW_VERSION}.0-amd64|g" snapcraft.yaml
  sedi "s|[0-9]\+\.[0-9]\+\.[0-9]\+|${NEW_VERSION}.0|g" snapcraft.yaml
  sedi "s|ARG VERSION=$OLD_VERSION|ARG VERSION=$NEW_VERSION|g" Dockerfile
  sedi "s|wekan-$OLD_VERSION-|wekan-$NEW_VERSION-|g" docs/Platforms/Propietary/Windows/Offline.md
  sedi "s|/v$OLD_VERSION/|/v$NEW_VERSION/|g" docs/Platforms/Propietary/Windows/Offline.md
  sedi "s|appVersion = $OLD_NO_DOTS,|appVersion = $NEW_NO_DOTS,|g" sandstorm-pkgdef.capnp
  sedi "s|\"$OLD_VERSION.0~|\"$NEW_VERSION.0~|g" sandstorm-pkgdef.capnp

  # Update website install/index.html versions
  MONGO_LINE=$(grep -o 'mongodb-linux-x86_64-ubuntu[0-9]\+-7\.[0-9][0-9]*\.[0-9][0-9]*' snapcraft.yaml | head -1)
  if [ -n "$MONGO_LINE" ]; then
    UBUNTU_VER=$(echo "$MONGO_LINE" | sed -E 's/.*ubuntu([0-9]+)-7\..*/\1/')
    MONGODB_VERSION=$(echo "$MONGO_LINE" | sed -E 's/.*-7/7/')
    sedi "s|MongoDB 7\\.x|MongoDB $MONGODB_VERSION Ubuntu $UBUNTU_VER|g" docs/install/index.html
  fi
  METEOR_VERSION=$(grep -o 'METEOR@[^ "\\]*' .meteor/release | head -1)
  NODE_VERSION=$(grep -o 'NODE_VERSION=[^ "\\]*' Dockerfile | head -1 | cut -d= -f2 | tr -d '"')
  NPM_VERSION=$(grep -o 'NPM_VERSION=[^ "\\]*' Dockerfile | head -1 | cut -d= -f2 | tr -d '"')
  sedi "s|<span id=\"meteor-version\">[^<]*</span>|<span id=\"meteor-version\">$METEOR_VERSION</span>|g" docs/install/index.html
  sedi "s|<span id=\"node-version\">[^<]*</span>|<span id=\"node-version\">$NODE_VERSION</span>|g" docs/install/index.html
  sedi "s|<span id=\"npm-version\">[^<]*</span>|<span id=\"npm-version\">$NPM_VERSION</span>|g" docs/install/index.html
  sedi "s|<span class=\"version-number\">v${OLD_VERSION}</span>|<span class=\"version-number\">v${NEW_VERSION}</span>|g" docs/install/index.html
  sedi "s|\(Meteor \)[^,]*,|\1${METEOR_VERSION},|g" docs/install/index.html
  sedi "s|\(Node\.js \)[0-9][0-9]*\.[x0-9a-zA-Z.-]*|\1${NODE_VERSION}|g" docs/install/index.html
}

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
