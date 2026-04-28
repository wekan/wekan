
#!/bin/bash
echo "SCRIPT TOP"
set -x
set +e

# Portable sedi function for macOS/Linux compatibility
sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

# --- Version bump logic from release-all.yml ---


version_bump_logic() {
  set +e
  echo "[DEBUG] Entered version_bump_logic"
  echo "[DEBUG] NEW_VERSION='$NEW_VERSION', OLD_VERSION='$OLD_VERSION'"
  echo "[DEBUG] Starting curl for Node.js v24.x..."
  set -x
  echo "[DEBUG] Fetching Node.js v24.x directory listing..."
  curl -fsSL https://nodejs.org/dist/latest-v24.x/ > /tmp/nodejs24.html
  CURL_EXIT=$?
  echo "[DEBUG] curl exit code: $CURL_EXIT"
  if [ $CURL_EXIT -ne 0 ]; then
    echo "[DEBUG] curl failed to fetch Node.js directory listing!"
    echo "[DEBUG] Check your network connection or the URL."
    exit 1
  fi
  echo "[DEBUG] curl succeeded, file size: $(stat -c%s /tmp/nodejs24.html 2>/dev/null || wc -c < /tmp/nodejs24.html) bytes"
  echo "[DEBUG] First 20 lines of HTML:"
  head -20 /tmp/nodejs24.html
  echo "[DEBUG] Grep for node-v24.*-linux-x64.tar.gz (three segments):"
  grep -oE 'node-v24\.[0-9]+\.[0-9]+-linux-x64\.tar\.gz' /tmp/nodejs24.html | head -10
  FIRST_MATCH=$(grep -oE 'node-v24\.[0-9]+\.[0-9]+-linux-x64\.tar\.gz' /tmp/nodejs24.html | head -1)
  echo "[DEBUG] FIRST_MATCH='$FIRST_MATCH'"
  SED_RESULT=$(echo "$FIRST_MATCH" | sed -E 's/node-v([0-9]+)\.([0-9]+)\.([0-9]+)-linux-x64\.tar\.gz/\1.\2.\3/')
  echo "[DEBUG] SED_RESULT='$SED_RESULT'"
  NEW_NODE="$SED_RESULT"
  NEW_NODE=$(echo "$NEW_NODE" | tr -d '[:space:]')
  echo "[DEBUG] (function, after trim) NEW_NODE='$NEW_NODE'"
  echo "[DEBUG] (function, after trim) Length: ${#NEW_NODE}"
  echo "[DEBUG] (function) od -c of NEW_NODE:"
  printf '%s' "$NEW_NODE" | od -c
  if [[ -z "$NEW_NODE" ]]; then
    echo "[DEBUG] (function) NEW_NODE is EMPTY"
    echo "[DEBUG] (function) FIRST_MATCH was: '$FIRST_MATCH'"
    echo "[DEBUG] (function) SED_RESULT was: '$SED_RESULT'"
    echo "[DEBUG] (function) File /tmp/nodejs24.html contains:"
    head -40 /tmp/nodejs24.html
    echo "Error: could not determine latest Node.js 24.x version." >&2
    exit 1
  else
    echo "[DEBUG] (function) NEW_NODE is NOT EMPTY"
  fi

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
  # Only update MongoDB version in snapcraft.yaml and docs if detected, not with app version
  if [[ -n "$MONGO_VER" && -n "$UBUNTU_VER" ]]; then
    sedi "s|mongodb-linux-x86_64-ubuntu[0-9]\+-7\.[0-9][0-9]*\.[0-9][0-9]*|mongodb-linux-x86_64-ubuntu${UBUNTU_VER}-$MONGO_VER|g" snapcraft.yaml
    # All lines that start with wget or unzip or rm
    sedi -E "/(wget|unzip|rm).*wekan/s/[0-9]+\.[0-9]+(\.[0-9]+)?/$NEW_VERSION/g" snapcraft.yaml
    sedi "s|mongodb-linux-x86_64-ubuntu[0-9]\+-7\.[0-9][0-9]*\.[0-9][0-9]*|mongodb-linux-x86_64-ubuntu${UBUNTU_VER}-$MONGO_VER|g" docs/Platforms/Propietary/Windows/Offline.md
  fi

  # Only update mongosh and mongotools if detected (do not use app version)
  # Detect current mongosh version in snapcraft.yaml
  MONGOSH_LINE=$(grep -o 'mongosh-[0-9]\+\.[0-9]\+\.[0-9]\+-linux-x64\.tgz' snapcraft.yaml | head -1)
  if [[ -n "$MONGOSH_LINE" ]]; then
    MONGOSH_VER=$(echo "$MONGOSH_LINE" | sed -E 's/mongosh-([0-9]+\.[0-9]+\.[0-9]+)-linux-x64\.tgz/\1/')
    sedi "s|mongosh-[0-9]\+\.[0-9]\+\.[0-9]\+-linux-x64\.tgz|mongosh-${MONGOSH_VER}-linux-x64.tgz|g" snapcraft.yaml
  fi
  # Detect current mongotools version in snapcraft.yaml
  MONGOTOOLS_LINE=$(grep -o 'mongodb-database-tools-ubuntu[0-9]\+-x86_64-[0-9]\+\.[0-9]\+\.[0-9]\+\.tgz' snapcraft.yaml | head -1)
  if [[ -n "$MONGOTOOLS_LINE" ]]; then
    MONGOTOOLS_VER=$(echo "$MONGOTOOLS_LINE" | sed -E 's/mongodb-database-tools-ubuntu[0-9]+-x86_64-([0-9]+\.[0-9]+\.[0-9]+)\.tgz/\1/')
    sedi "s|mongodb-database-tools-ubuntu[0-9]\+-x86_64-[0-9]\+\.[0-9]\+\.[0-9]\+\.tgz|mongodb-database-tools-ubuntu2404-x86_64-${MONGOTOOLS_VER}.tgz|g" snapcraft.yaml
  fi

  # Update Node.js version in Dockerfile and snapcraft.yaml
    echo "[DEBUG] (function) NEW_NODE='$NEW_NODE'"
    echo "[DEBUG] (function) Length: ${#NEW_NODE}"
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
  # Ensure package.json version is always vX.Y.Z format
  if [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+$ ]]; then
    PKG_VERSION="v${NEW_VERSION}.0"
  elif [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    PKG_VERSION="v${NEW_VERSION}"
  else
    PKG_VERSION="v${NEW_VERSION}"
  fi
  sedi "0,/\"version\": \"[^\"]*\"/s//\"version\": \"${PKG_VERSION}\"/" package.json
  # Ensure package-lock.json version is always vX.Y.Z format
  if [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+$ ]]; then
    PKGLOCK_VERSION="v${NEW_VERSION}.0"
  elif [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    PKGLOCK_VERSION="v${NEW_VERSION}"
  else
    PKGLOCK_VERSION="v${NEW_VERSION}"
  fi
  sedi "0,/\"version\": \"[^\"]*\"/s//\"version\": \"${PKGLOCK_VERSION}\"/" package-lock.json
  # Ensure appVersion is always vX.Y.Z format for Stackerfile.yml
  if [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+$ ]]; then
    STACKER_VERSION="v${NEW_VERSION}.0"
  elif [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    STACKER_VERSION="v${NEW_VERSION}"
  else
    STACKER_VERSION="v${NEW_VERSION}"
  fi
  sedi "0,/appVersion: \"[^\"]*\"/s/appVersion: \"[^\"]*\"/appVersion: \"${STACKER_VERSION}\"/" Stackerfile.yml
  sedi "0,/appVersion = [0-9]\+/s/appVersion = [0-9]\+/appVersion = ${NEW_NO_DOTS}/" sandstorm-pkgdef.capnp
  # Ensure sandstorm-pkgdef.capnp appMarketingVersion includes date: X.Y.Z~YYYY-MM-DD
  TODAY=$(date +%Y-%m-%d)
  if [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+$ ]]; then
    SANDSTORM_MARKETING="${NEW_VERSION}.0~${TODAY}"
  elif [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    SANDSTORM_MARKETING="${NEW_VERSION}~${TODAY}"
  else
    SANDSTORM_MARKETING="${NEW_VERSION}~${TODAY}"
  fi
  sedi "0,/appMarketingVersion = (defaultText = \"[^\"]*\")/s/appMarketingVersion = (defaultText = \"[^\"]*\")/appMarketingVersion = (defaultText = \"${SANDSTORM_MARKETING}\")/" sandstorm-pkgdef.capnp
  # Only update the 2nd line (version) in snapcraft.yaml with the app version
  sedi "2s/^version: '[^']*'/version: '${NEW_VERSION}'/" snapcraft.yaml

  # Only update Node.js version fields in snapcraft.yaml with detected Node.js version (NEW_NODE)
  if [[ -n "$NEW_NODE" ]]; then
    sedi "s|npm-node-version: 24\.[0-9][0-9]*\.[0-9][0-9]*|npm-node-version: ${NEW_NODE}|g" snapcraft.yaml
    sedi "s|NODE_VERSION=\"24\.[0-9][0-9]*\.[0-9][0-9]*\"|NODE_VERSION=\"${NEW_NODE}\"|g" snapcraft.yaml
    sedi "s|Node\.js 24\.[0-9][0-9]*\.[0-9][0-9]* binary|Node.js ${NEW_NODE} binary|g" snapcraft.yaml
  fi

  # Only update MongoDB download URL if a new MongoDB 7.x version is detected
  if [[ -n "$MONGO_VER" && -n "$UBUNTU_VER" ]]; then
    sedi "s|mongodb-linux-x86_64-ubuntu[0-9]\+-7\.[0-9][0-9]*\.[0-9][0-9]*|mongodb-linux-x86_64-ubuntu${UBUNTU_VER}-$MONGO_VER|g" snapcraft.yaml
    sedi "s|mongodb-linux-x86_64-ubuntu[0-9]\+-7\.[0-9][0-9]*\.[0-9][0-9]*|mongodb-linux-x86_64-ubuntu${UBUNTU_VER}-$MONGO_VER|g" docs/Platforms/Propietary/Windows/Offline.md
  fi

  # Only update mongosh if a new version is detected
  MONGOSH_LINE=$(grep -o 'mongosh-[0-9]\+\.[0-9]\+\.[0-9]\+-linux-x64\.tgz' snapcraft.yaml | head -1)
  if [[ -n "$MONGOSH_LINE" ]]; then
    MONGOSH_VER=$(echo "$MONGOSH_LINE" | sed -E 's/mongosh-([0-9]+\.[0-9]+\.[0-9]+)-linux-x64\.tgz/\1/')
    sedi "s|mongosh-[0-9]\+\.[0-9]\+\.[0-9]\+-linux-x64\.tgz|mongosh-${MONGOSH_VER}-linux-x64.tgz|g" snapcraft.yaml
  fi

  # Only update mongotools if a new version is detected
  MONGOTOOLS_LINE=$(grep -o 'mongodb-database-tools-ubuntu[0-9]\+-x86_64-[0-9]\+\.[0-9]\+\.[0-9]\+\.tgz' snapcraft.yaml | head -1)
  if [[ -n "$MONGOTOOLS_LINE" ]]; then
    MONGOTOOLS_VER=$(echo "$MONGOTOOLS_LINE" | sed -E 's/mongodb-database-tools-ubuntu[0-9]+-x86_64-([0-9]+\.[0-9]+\.[0-9]+)\.tgz/\1/')
    sedi "s|mongodb-database-tools-ubuntu[0-9]\+-x86_64-[0-9]\+\.[0-9]\+\.[0-9]\+\.tgz|mongodb-database-tools-ubuntu2404-x86_64-${MONGOTOOLS_VER}.tgz|g" snapcraft.yaml
  fi
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
    sedi "s|MongoDB 7\\.x|MongoDB $MONGODB_VERSION Ubuntu $UBUNTU_VER|g" ../w/wekan.fi/install/index.html
  fi
  METEOR_VERSION=$(grep -o 'METEOR@[^ "\\]*' .meteor/release | head -1)
  NODE_VERSION=$(grep -o 'NODE_VERSION=[^ "\\]*' Dockerfile | head -1 | cut -d= -f2 | tr -d '"')
  NPM_VERSION=$(grep -o 'NPM_VERSION=[^ "\\]*' Dockerfile | head -1 | cut -d= -f2 | tr -d '"')
  sedi "s|<span id=\"meteor-version\">[^<]*</span>|<span id=\"meteor-version\">$METEOR_VERSION</span>|g" ../w/wekan.fi/install/index.html
  sedi "s|<span id=\"node-version\">[^<]*</span>|<span id=\"node-version\">$NODE_VERSION</span>|g" ../w/wekan.fi/install/index.html
  sedi "s|<span id=\"npm-version\">[^<]*</span>|<span id=\"npm-version\">$NPM_VERSION</span>|g" ../w/wekan.fi/install/index.html
  sedi "s|<span class=\"version-number\">v${OLD_VERSION}</span>|<span class=\"version-number\">v${NEW_VERSION}</span>|g" ../w/wekan.fi/install/index.html
  sedi "s|\(Meteor \)[^,]*,|\1${METEOR_VERSION},|g" ../w/wekan.fi/install/index.html
  sedi "s|\(Node\.js \)[0-9][0-9]*\.[x0-9a-zA-Z.-]*|\1${NODE_VERSION}|g" ../w/wekan.fi/install/index.html
}

# Auto-detect versions from CHANGELOG.md if not provided as arguments
if [ -z "$1" ] || [ -z "$2" ]; then
  mapfile -t RELEASE_LINES < <(grep -E '^# v[0-9]+\.[0-9]+(\.[0-9]+)?[ -]+[0-9]{4}-[0-9]{2}-[0-9]{2}' CHANGELOG.md | head -2)
  NEW_VERSION=$(echo "${RELEASE_LINES[0]}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
  OLD_VERSION=$(echo "${RELEASE_LINES[1]}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
  echo "[DEBUG] After version detection: NEW_VERSION='$NEW_VERSION', OLD_VERSION='$OLD_VERSION'"
  if [ -z "$NEW_VERSION" ] || [ -z "$OLD_VERSION" ]; then
    echo "[DEBUG] Entered error block: Could not determine both latest and previous version from CHANGELOG.md" >&2
    exit 1
  fi
  echo "[DEBUG] Passed version detection if block."
  version_bump_logic
  echo "SCRIPT END"
  exit 0
else
  OLD_VERSION="$1"
  NEW_VERSION="$2"
  version_bump_logic
  echo "SCRIPT END"
  exit 0
fi

version_bump_logic() {
  set +e
  echo "[DEBUG] Entered version_bump_logic"
  echo "[DEBUG] NEW_VERSION='$NEW_VERSION', OLD_VERSION='$OLD_VERSION'"
  echo "[DEBUG] Starting curl for Node.js v24.x..."

  set -x
  echo "[DEBUG] Fetching Node.js v24.x directory listing..."
  curl -fsSL https://nodejs.org/dist/latest-v24.x/ > /tmp/nodejs24.html
  CURL_EXIT=$?
  echo "[DEBUG] curl exit code: $CURL_EXIT"
  if [ $CURL_EXIT -ne 0 ]; then
    echo "[DEBUG] curl failed to fetch Node.js directory listing!"
    echo "[DEBUG] Check your network connection or the URL."
    exit 1
  fi
  echo "[DEBUG] curl succeeded, file size: $(stat -c%s /tmp/nodejs24.html 2>/dev/null || wc -c < /tmp/nodejs24.html) bytes"
  echo "[DEBUG] First 20 lines of HTML:"
  head -20 /tmp/nodejs24.html
  echo "[DEBUG] Grep for node-v24.*-linux-x64.tar.gz (three segments):"
  grep -oE 'node-v24\.[0-9]+\.[0-9]+\.[0-9]+-linux-x64\.tar\.gz' /tmp/nodejs24.html | head -10
  FIRST_MATCH=$(grep -oE 'node-v24\.[0-9]+\.[0-9]+\.[0-9]+-linux-x64\.tar\.gz' /tmp/nodejs24.html | head -1)
  echo "[DEBUG] FIRST_MATCH='$FIRST_MATCH'"
  SED_RESULT=$(echo "$FIRST_MATCH" | sed -E 's/node-v([0-9]+)\.([0-9]+)\.([0-9]+)-linux-x64\.tar\.gz/\1.\2.\3/')
  echo "[DEBUG] SED_RESULT='$SED_RESULT'"
  NEW_NODE="$SED_RESULT"
  NEW_NODE=$(echo "$NEW_NODE" | tr -d '[:space:]')
  echo "[DEBUG] (function, after trim) NEW_NODE='$NEW_NODE'"
  echo "[DEBUG] (function, after trim) Length: ${#NEW_NODE}"
  echo "[DEBUG] (function) od -c of NEW_NODE:"
  printf '%s' "$NEW_NODE" | od -c
  if [[ -z "$NEW_NODE" ]]; then
    echo "[DEBUG] (function) NEW_NODE is EMPTY"
    echo "[DEBUG] (function) FIRST_MATCH was: '$FIRST_MATCH'"
    echo "[DEBUG] (function) SED_RESULT was: '$SED_RESULT'"
    echo "[DEBUG] (function) File /tmp/nodejs24.html contains:"
    head -40 /tmp/nodejs24.html
    exit 1
  else
    echo "[DEBUG] (function) NEW_NODE is NOT EMPTY"
  fi

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
    echo "[DEBUG] (function) NEW_NODE='$NEW_NODE'"
    echo "[DEBUG] (function) Length: ${#NEW_NODE}"
  if [ -z "$NEW_NODE" ]; then
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
    sedi "s|MongoDB 7\\.x|MongoDB $MONGODB_VERSION Ubuntu $UBUNTU_VER|g" ../w/wekan.fi/install/index.html
  fi
  METEOR_VERSION=$(grep -o 'METEOR@[^ "\\]*' .meteor/release | head -1)
  NODE_VERSION=$(grep -o 'NODE_VERSION=[^ "\\]*' Dockerfile | head -1 | cut -d= -f2 | tr -d '"')
  NPM_VERSION=$(grep -o 'NPM_VERSION=[^ "\\]*' Dockerfile | head -1 | cut -d= -f2 | tr -d '"')
  sedi "s|<span id=\"meteor-version\">[^<]*</span>|<span id=\"meteor-version\">$METEOR_VERSION</span>|g" ../w/wekan.fi/install/index.html
  sedi "s|<span id=\"node-version\">[^<]*</span>|<span id=\"node-version\">$NODE_VERSION</span>|g" ../w/wekan.fi/install/index.html
  sedi "s|<span id=\"npm-version\">[^<]*</span>|<span id=\"npm-version\">$NPM_VERSION</span>|g" ../w/wekan.fi/install/index.html
  sedi "s|<span class=\"version-number\">v${OLD_VERSION}</span>|<span class=\"version-number\">v${NEW_VERSION}</span>|g" ../w/wekan.fi/install/index.html
  sedi "s|\(Meteor \)[^,]*,|\1${METEOR_VERSION},|g" ../w/wekan.fi/install/index.html
  sedi "s|\(Node\.js \)[0-9][0-9]*\.[x0-9a-zA-Z.-]*|\1${NODE_VERSION}|g" ../w/wekan.fi/install/index.html
}
  # Removed unconditional error/exit after version detection
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
  }

version_bump_logic
echo "SCRIPT END"
