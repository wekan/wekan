#!/bin/bash
# =================================================================
# WEKAN VERSION UPDATE SCRIPT
# Supports: Linux (Bash/Zsh) and macOS (Zsh)
# =================================================================

set -e # Exit on any error

# Portable sedi function for macOS/Linux compatibility
sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    # macOS requires an empty string for the -i flag
    sed -i '' "$@"
  else
    # Linux GNU sed
    sed -i "$@"
  fi
}

version_bump_logic() {
  echo "--- Starting version bump logic ---"
  echo "New Version: $NEW_VERSION"
  echo "Old Version: $OLD_VERSION"

  # 1. Fetch latest Node.js 24.x version
  echo "[DEBUG] Fetching Node.js v24.x directory listing..."
  NODE_HTML=$(curl -fsSL https://nodejs.org/dist/latest-v24.x/)
  FIRST_MATCH=$(echo "$NODE_HTML" | grep -oE 'node-v24\.[0-9]+\.[0-9]+-linux-x64\.tar\.gz' | head -1)
  NEW_NODE=$(echo "$FIRST_MATCH" | sed -E 's/node-v([0-9]+\.[0-9]+\.[0-9]+)-linux-x64\.tar\.gz/\1/')

  if [[ -z "$NEW_NODE" ]]; then
    echo "Error: Could not determine latest Node.js version." >&2
    exit 1
  fi
  echo "Latest Node.js detected: $NEW_NODE"

  # 2. Detect latest MongoDB 7.x
  # Locked to Ubuntu 22.04 and using sort -V to ensure 7.0.31 > 7.0.9
  echo "[DEBUG] Detecting latest MongoDB 7.x version for Ubuntu 22.04..."
  MONGO_LINE=$(curl -fsSL https://www.mongodb.com/try/download/community | grep -o 'mongodb-linux-x86_64-ubuntu2204-7\.[0-9]\+\.[0-9]\+\.tgz' | sort -V | tail -1)

  if [ -z "$MONGO_LINE" ]; then
    echo "Error: Could not determine latest MongoDB 7.x version." >&2
    exit 1
  fi

  MONGO_VER=$(echo "$MONGO_LINE" | sed -E 's/.*-7/7/' | sed 's/\.tgz$//')
  UBUNTU_VER="2204"
  echo "Detected MongoDB: $MONGO_VER for Ubuntu $UBUNTU_VER"

  # 3. Update Configuration Files: MongoDB & Tools
  echo "[DEBUG] Updating snapcraft.yaml and documentation..."
  sedi "s|mongodb-linux-x86_64-ubuntu[0-9]\+-7\.[0-9][0-9]*\.[0-9][0-9]*|mongodb-linux-x86_64-ubuntu${UBUNTU_VER}-$MONGO_VER|g" snapcraft.yaml

  # Ensure database tools point to the correct Ubuntu version
  sedi -E "s|mongodb-database-tools-ubuntu[0-9]+-x86_64|mongodb-database-tools-ubuntu2204-x86_64|g" snapcraft.yaml

  # 4. Update Node.js versions
  sedi "s|NODE_VERSION=v24\.[0-9][0-9]*\.[0-9][0-9]*|NODE_VERSION=v${NEW_NODE}|g" Dockerfile
  sedi "s|npm-node-version: 24\.[0-9][0-9]*\.[0-9][0-9]*|npm-node-version: ${NEW_NODE}|g" snapcraft.yaml
  sedi "s|NODE_VERSION=\"24\.[0-9][0-9]*\.[0-9][0-9]*\"|NODE_VERSION=\"${NEW_NODE}\"|g" snapcraft.yaml
  sedi "s|Node\.js 24\.[0-9][0-9]*\.[0-9][0-9]* binary|Node.js ${NEW_NODE} binary|g" snapcraft.yaml

  # 5. Update Application Versions
  NEW_NO_DOTS=$(echo "$NEW_VERSION" | tr -d '.')
  OLD_NO_DOTS=$(echo "$OLD_VERSION" | tr -d '.')
  TODAY=$(date +%Y-%m-%d)

  # Standardize version to vX.Y.Z
  if [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+$ ]]; then PKG_VER="v${NEW_VERSION}.0"; else PKG_VER="v${NEW_VERSION}"; fi

  sedi "0,/\"version\": \"[^\"]*\"/s//\"version\": \"${PKG_VER}\"/" package.json
  sedi "0,/\"version\": \"[^\"]*\"/s//\"version\": \"${PKG_VER}\"/" package-lock.json
  sedi "0,/appVersion: \"[^\"]*\"/s/appVersion: \"[^\"]*\"/appVersion: \"${PKG_VER}\"/" Stackerfile.yml
  sedi "2s/^version: '[^']*'/version: '${NEW_VERSION}'/" snapcraft.yaml
  sedi "s|v$OLD_VERSION/|v$NEW_VERSION/|g" snapcraft.yaml
  sedi "s|wekan-$OLD_VERSION-|wekan-$NEW_VERSION-|g" snapcraft.yaml

  # Sandstorm Specifics
  sedi "0,/appVersion = [0-9]\+/s/appVersion = [0-9]\+/appVersion = ${NEW_NO_DOTS}/" sandstorm-pkgdef.capnp
  sedi "0,/appMarketingVersion = (defaultText = \"[^\"]*\")/s/appMarketingVersion = (defaultText = \"[^\"]*\")/appMarketingVersion = (defaultText = \"${NEW_VERSION}~${TODAY}\")/" sandstorm-pkgdef.capnp
  sedi "s|appVersion = $OLD_NO_DOTS,|appVersion = $NEW_NO_DOTS,|g" sandstorm-pkgdef.capnp

  # Docker and Documentation
  sedi "s|ARG VERSION=$OLD_VERSION-|ARG VERSION=$NEW_VERSION-|g" Dockerfile
  sedi "s|wekan-$OLD_VERSION|wekan-$NEW_VERSION|g" docs/Platforms/Propietary/Windows/Offline.md
  sedi "s|/v$OLD_VERSION/|/v$NEW_VERSION/|g" docs/Platforms/Propietary/Windows/Offline.md

  # 6. Update Wekan website (if applicable)
  if [ -d "../w/wekan.fi" ]; then
    INSTALL_PAGE="../w/wekan.fi/install/index.html"
    METEOR_VER=$(grep -o 'METEOR@[^ "\\]*' .meteor/release | head -1)
    NPM_VER=$(grep -o 'NPM_VERSION=[^ "\\]*' Dockerfile | head -1 | cut -d= -f2 | tr -d '"')

    (cd ../w/wekan.fi && git pull)
    #sedi "s|MongoDB 7\\.x|MongoDB $MONGO_VER|g" "$INSTALL_PAGE"
    sedi "s|<span id=\"meteor-version\">[^<]*</span>|<span id=\"meteor-version\">$METEOR_VER</span>|g" "$INSTALL_PAGE"
    #sedi "s|<span id=\"node-version\">[^<]*</span>|<span id=\"node-version\">v$NEW_NODE</span>|g" "$INSTALL_PAGE"
    #sedi "s|<span id=\"npm-version\">[^<]*</span>|<span id=\"npm-version\">$NPM_VER</span>|g" "$INSTALL_PAGE"
    sedi "s|<span class=\"version-number\">v${OLD_VERSION}</span>|<span class=\"version-number\">v${NEW_VERSION}</span>|g" "$INSTALL_PAGE"
    (cd ../w/wekan.fi && git add --all && git commit -m "Updates" && git push)
  fi

  echo "--- Version bump complete ---"
}

# --- MAIN BLOCK ---

# If manual arguments are missing, parse CHANGELOG.md
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "No arguments. Detecting versions from CHANGELOG.md..."
  mapfile -t RELEASE_LINES < <(grep -E '^# v[0-9]+\.[0-9]+(\.[0-9]+)?[ -]+[0-9]{4}-[0-9]{2}-[0-9]{2}' CHANGELOG.md | head -2)
  NEW_VERSION=$(echo "${RELEASE_LINES[0]}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
  OLD_VERSION=$(echo "${RELEASE_LINES[1]}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
  if [ -z "$NEW_VERSION" ] || [ -z "$OLD_VERSION" ]; then
    echo "Error: Automatics detection failed." >&2
    exit 1
  fi
else
  OLD_VERSION="$1"
  NEW_VERSION="$2"
fi

version_bump_logic
exit 0
