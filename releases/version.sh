#!/usr/bin/env bash
# =================================================================
# WEKAN VERSION + DEPENDENCY UPDATE SCRIPT
# Supports: Linux (Bash/Zsh) and macOS (Zsh)
# =================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Local HTTP cache used by releases/snapcraft-local.yaml.
CACHE_BASE_URL="${CACHE_BASE_URL:-http://192.168.1.47:8000}"
DOWNLOAD_DIR="${DOWNLOAD_DIR:-$HOME/Lataukset}"

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

http_ok() {
  local url="$1"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" -L --head --max-time 30 "$url" || true)
  [[ "$code" == "200" || "$code" == "301" || "$code" == "302" ]]
}

latest_common_version() {
  local listing_url="$1"
  local extract_regex="$2"
  local version_sed="$3"
  local amd64_url_fmt="$4"
  local arm64_url_fmt="$5"
  local found=""

  local listing
  listing=$(curl -fsSL "$listing_url")

  # shellcheck disable=SC2207
  local versions=($(echo "$listing" | grep -oE "$extract_regex" | sed -E "$version_sed" | sort -Vu))
  if [ ${#versions[@]} -eq 0 ]; then
    return 1
  fi

  local i
  for (( i=${#versions[@]}-1; i>=0; i-- )); do
    local v="${versions[$i]}"
    local amd64_url arm64_url
    printf -v amd64_url "$amd64_url_fmt" "$v"
    printf -v arm64_url "$arm64_url_fmt" "$v"
    if http_ok "$amd64_url" && http_ok "$arm64_url"; then
      found="$v"
      break
    fi
  done

  if [ -z "$found" ]; then
    return 1
  fi

  echo "$found"
}

get_current_version_from_file() {
  local file="$1"
  local regex="$2"
  grep -oE "$regex" "$file" | head -1
}

ensure_cache_or_download() {
  local filename="$1"
  local upstream_url="$2"
  local cache_url="${CACHE_BASE_URL}/${filename}"

  if http_ok "$cache_url"; then
    echo "[CACHE] OK: $cache_url"
    return 0
  fi

  mkdir -p "$DOWNLOAD_DIR"

  if [ -f "$DOWNLOAD_DIR/$filename" ]; then
    echo "[DOWNLOAD] Already exists: $DOWNLOAD_DIR/$filename"
    return 0
  fi

  echo "[CACHE] MISSING: $cache_url"
  echo "[DOWNLOAD] Fetching: $upstream_url"
  curl -fL --retry 3 --retry-delay 2 -o "$DOWNLOAD_DIR/$filename" "$upstream_url"
}

version_bump_logic() {
  echo "--- Starting version bump logic ---"
  echo "New Version: $NEW_VERSION"
  echo "Old Version: $OLD_VERSION"

  # 1. Fetch latest Node.js 24.x (shared by amd64+arm64)
  echo "[DEBUG] Fetching latest Node.js 24.x with amd64+arm64 availability..."
  NODE_HTML=$(curl -fsSL https://nodejs.org/dist/latest-v24.x/)
  FIRST_MATCH=$(echo "$NODE_HTML" | grep -oE 'node-v24\.[0-9]+\.[0-9]+-linux-x64\.tar\.xz' | head -1)
  NEW_NODE=$(echo "$FIRST_MATCH" | sed -E 's/node-v([0-9]+\.[0-9]+\.[0-9]+)-linux-x64\.tar\.xz/\1/')

  if [[ -z "$NEW_NODE" ]]; then
    echo "Error: Could not determine latest Node.js 24.x version." >&2
    exit 1
  fi

  if ! http_ok "https://nodejs.org/dist/v${NEW_NODE}/node-v${NEW_NODE}-linux-arm64.tar.xz"; then
    echo "Error: Node.js v${NEW_NODE} does not have linux-arm64 tar.xz." >&2
    exit 1
  fi
  echo "Latest Node.js detected: $NEW_NODE"

  # 2. Detect latest MongoDB 7.x available for both amd64 and arm64
  echo "[DEBUG] Detecting latest MongoDB 7.x for ubuntu2204 on amd64+arm64..."
  MONGO_VER=$(latest_common_version \
    "https://fastdl.mongodb.org/linux/" \
    'mongodb-linux-x86_64-ubuntu2204-7\.[0-9]+\.[0-9]+\.tgz' \
    's/mongodb-linux-x86_64-ubuntu2204-([0-9]+\.[0-9]+\.[0-9]+)\.tgz/\1/' \
    'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-%s.tgz' \
    'https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-ubuntu2204-%s.tgz') || true

  if [ -z "${MONGO_VER:-}" ]; then
    MONGO_VER=$(get_current_version_from_file snapcraft.yaml 'mongodb-linux-\$\{MONGO_ARCH\}-ubuntu2204-[0-9]+\.[0-9]+\.[0-9]+' | sed -E 's/.*-ubuntu2204-//')
  fi

  if [ -z "$MONGO_VER" ]; then
    echo "Error: Could not determine latest/common MongoDB version." >&2
    exit 1
  fi
  echo "Latest common MongoDB detected: $MONGO_VER"

  # 3. Detect latest mongosh available for both amd64 and arm64
  echo "[DEBUG] Detecting latest mongosh for amd64+arm64..."
  MONGOSH_VER=$(latest_common_version \
    "https://downloads.mongodb.com/compass/" \
    'mongosh-[0-9]+\.[0-9]+\.[0-9]+-linux-x64\.tgz' \
    's/mongosh-([0-9]+\.[0-9]+\.[0-9]+)-linux-x64\.tgz/\1/' \
    'https://downloads.mongodb.com/compass/mongosh-%s-linux-x64.tgz' \
    'https://downloads.mongodb.com/compass/mongosh-%s-linux-arm64.tgz') || true

  if [ -z "${MONGOSH_VER:-}" ]; then
    MONGOSH_VER=$(get_current_version_from_file snapcraft.yaml 'mongosh-[0-9]+\.[0-9]+\.[0-9]+-linux-\$\{MONGOSH_ARCH\}\.tgz' | sed -E 's/mongosh-([0-9]+\.[0-9]+\.[0-9]+)-.*/\1/')
  fi

  if [ -z "$MONGOSH_VER" ]; then
    echo "Error: Could not determine latest/common mongosh version." >&2
    exit 1
  fi
  echo "Latest common mongosh detected: $MONGOSH_VER"

  # 4. Detect latest mongodb-database-tools available for both amd64 and arm64
  echo "[DEBUG] Detecting latest mongodb-database-tools for ubuntu2204 on amd64+arm64..."
  TOOLS_VER=$(latest_common_version \
    "https://fastdl.mongodb.org/tools/db/" \
    'mongodb-database-tools-ubuntu2204-x86_64-[0-9]+\.[0-9]+\.[0-9]+\.tgz' \
    's/mongodb-database-tools-ubuntu2204-x86_64-([0-9]+\.[0-9]+\.[0-9]+)\.tgz/\1/' \
    'https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-x86_64-%s.tgz' \
    'https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-arm64-%s.tgz') || true

  if [ -z "${TOOLS_VER:-}" ]; then
    TOOLS_VER=$(get_current_version_from_file snapcraft.yaml 'mongodb-database-tools-ubuntu2204-\$\{TOOLS_ARCH\}-[0-9]+\.[0-9]+\.[0-9]+' | sed -E 's/.*-ubuntu2204-\$\{TOOLS_ARCH\}-//')
  fi

  if [ -z "$TOOLS_VER" ]; then
    echo "Error: Could not determine latest/common mongodb-database-tools version." >&2
    exit 1
  fi
  echo "Latest common mongodb-database-tools detected: $TOOLS_VER"

  # 5. Update dependency versions in snap files and Dockerfile
  echo "[DEBUG] Updating dependency versions in files..."
  sedi -E "s|NODE_VERSION=v24\.[0-9]+\.[0-9]+|NODE_VERSION=v${NEW_NODE}|g" Dockerfile
  sedi -E "s|npm-node-version: 24\.[0-9]+\.[0-9]+|npm-node-version: ${NEW_NODE}|g" snapcraft.yaml releases/snapcraft-local.yaml
  sedi -E "s|NODE_TAR=\"node-v24\.[0-9]+\.[0-9]+-linux-\$\{NODE_ARCH\}\.tar\.xz\"|NODE_TAR=\"node-v${NEW_NODE}-linux-\${NODE_ARCH}.tar.xz\"|g" snapcraft.yaml releases/snapcraft-local.yaml
  sedi -E "s|node-v24\.[0-9]+\.[0-9]+-linux-\$\{NODE_ARCH\}/bin/node|node-v${NEW_NODE}-linux-\${NODE_ARCH}/bin/node|g" snapcraft.yaml releases/snapcraft-local.yaml

  sedi -E "s|mongodb-linux-\$\{MONGO_ARCH\}-ubuntu2204-7\.[0-9]+\.[0-9]+\.tgz|mongodb-linux-\${MONGO_ARCH}-ubuntu2204-${MONGO_VER}.tgz|g" snapcraft.yaml releases/snapcraft-local.yaml
  sedi -E "s|mongosh-[0-9]+\.[0-9]+\.[0-9]+-linux-\$\{MONGOSH_ARCH\}\.tgz|mongosh-${MONGOSH_VER}-linux-\${MONGOSH_ARCH}.tgz|g" snapcraft.yaml releases/snapcraft-local.yaml
  sedi -E "s|mongodb-database-tools-ubuntu2204-\$\{TOOLS_ARCH\}-[0-9]+\.[0-9]+\.[0-9]+\.tgz|mongodb-database-tools-ubuntu2204-\${TOOLS_ARCH}-${TOOLS_VER}.tgz|g" snapcraft.yaml releases/snapcraft-local.yaml

  # 6. Update application versions (existing logic retained)
  NEW_NO_DOTS=$(echo "$NEW_VERSION" | tr -d '.')
  OLD_NO_DOTS=$(echo "$OLD_VERSION" | tr -d '.')
  TODAY=$(date +%Y-%m-%d)

  if [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+$ ]]; then
    PKG_VER="v${NEW_VERSION}.0"
  else
    PKG_VER="v${NEW_VERSION}"
  fi

  sedi "0,/\"version\": \"[^\"]*\"/s//\"version\": \"${PKG_VER}\"/" package.json
  sedi "0,/\"version\": \"[^\"]*\"/s//\"version\": \"${PKG_VER}\"/" package-lock.json
  sedi "0,/appVersion: \"[^\"]*\"/s/appVersion: \"[^\"]*\"/appVersion: \"${PKG_VER}\"/" Stackerfile.yml
  sedi "2s/^version: '[^']*'/version: '${NEW_VERSION}'/" snapcraft.yaml releases/snapcraft-local.yaml
  sedi "s|v$OLD_VERSION/|v$NEW_VERSION/|g" snapcraft.yaml releases/snapcraft-local.yaml
  sedi "s|wekan-$OLD_VERSION-|wekan-$NEW_VERSION-|g" snapcraft.yaml releases/snapcraft-local.yaml

  sedi "0,/appVersion = [0-9]\+/s/appVersion = [0-9]\+/appVersion = ${NEW_NO_DOTS}/" sandstorm-pkgdef.capnp
  sedi "0,/appMarketingVersion = (defaultText = \"[^\"]*\")/s/appMarketingVersion = (defaultText = \"[^\"]*\")/appMarketingVersion = (defaultText = \"${NEW_VERSION}~${TODAY}\")/" sandstorm-pkgdef.capnp
  sedi "s|appVersion = $OLD_NO_DOTS,|appVersion = $NEW_NO_DOTS,|g" sandstorm-pkgdef.capnp

  sedi "s|ARG VERSION=$OLD_VERSION|ARG VERSION=$NEW_VERSION|g" Dockerfile
  sedi "s|wekan-$OLD_VERSION|wekan-$NEW_VERSION|g" docs/Platforms/Propietary/Windows/Offline.md
  sedi "s|/v$OLD_VERSION/|/v$NEW_VERSION/|g" docs/Platforms/Propietary/Windows/Offline.md

  # 7. Ensure local cache artifacts are available (or downloaded to ~/Lataukset)
  echo "[DEBUG] Checking local cache and downloading missing artifacts to $DOWNLOAD_DIR ..."
  ensure_cache_or_download "wekan-${NEW_VERSION}-amd64.zip" "https://github.com/wekan/wekan/releases/download/v${NEW_VERSION}/wekan-${NEW_VERSION}-amd64.zip"
  ensure_cache_or_download "wekan-${NEW_VERSION}-arm64.zip" "https://github.com/wekan/wekan/releases/download/v${NEW_VERSION}/wekan-${NEW_VERSION}-arm64.zip"

  ensure_cache_or_download "node-v${NEW_NODE}-linux-x64.tar.xz" "https://nodejs.org/dist/v${NEW_NODE}/node-v${NEW_NODE}-linux-x64.tar.xz"
  ensure_cache_or_download "node-v${NEW_NODE}-linux-arm64.tar.xz" "https://nodejs.org/dist/v${NEW_NODE}/node-v${NEW_NODE}-linux-arm64.tar.xz"

  ensure_cache_or_download "mongodb-linux-x86_64-ubuntu2204-${MONGO_VER}.tgz" "https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-${MONGO_VER}.tgz"
  ensure_cache_or_download "mongodb-linux-aarch64-ubuntu2204-${MONGO_VER}.tgz" "https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-ubuntu2204-${MONGO_VER}.tgz"

  ensure_cache_or_download "mongosh-${MONGOSH_VER}-linux-x64.tgz" "https://downloads.mongodb.com/compass/mongosh-${MONGOSH_VER}-linux-x64.tgz"
  ensure_cache_or_download "mongosh-${MONGOSH_VER}-linux-arm64.tgz" "https://downloads.mongodb.com/compass/mongosh-${MONGOSH_VER}-linux-arm64.tgz"

  ensure_cache_or_download "mongodb-database-tools-ubuntu2204-x86_64-${TOOLS_VER}.tgz" "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-x86_64-${TOOLS_VER}.tgz"
  ensure_cache_or_download "mongodb-database-tools-ubuntu2204-arm64-${TOOLS_VER}.tgz" "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-arm64-${TOOLS_VER}.tgz"

  # 8. Update Wekan website (if applicable)
  if [ -d "../w/wekan.fi" ]; then
    INSTALL_PAGE="../w/wekan.fi/install/index.html"
    METEOR_VER=$(grep -o 'METEOR@[^ "\\]*' .meteor/release | head -1 | sed 's/.*@//')
    NPM_VER=$(grep -o 'NPM_VERSION=[^ "\\]*' Dockerfile | head -1 | cut -d= -f2 | tr -d '"')

    (cd ../w/wekan.fi && git pull)
    sedi "s|<span id=\"meteor-version\">[^<]*</span>|<span id=\"meteor-version\">$METEOR_VER</span>|g" "$INSTALL_PAGE"
    sedi "s|<span class=\"version-number\">v${OLD_VERSION}</span>|<span class=\"version-number\">v${NEW_VERSION}</span>|g" "$INSTALL_PAGE"
    (cd ../w/wekan.fi && git add --all && git commit -m "Updates" && git push)

    # Keep variable referenced to avoid shellcheck complaints in local runs.
    : "$NPM_VER"
  fi

  echo "--- Version bump complete ---"
  echo "Detected dependency versions:"
  echo "  Node.js:                $NEW_NODE"
  echo "  MongoDB (ubuntu2204):   $MONGO_VER"
  echo "  mongosh:                $MONGOSH_VER"
  echo "  mongodb-database-tools: $TOOLS_VER"
}

# --- MAIN BLOCK ---

# If manual arguments are missing, parse CHANGELOG.md
if [ -z "${1:-}" ] || [ -z "${2:-}" ]; then
  echo "No arguments. Detecting versions from CHANGELOG.md..."
  mapfile -t RELEASE_LINES < <(grep -E '^# v[0-9]+\.[0-9]+(\.[0-9]+)?[ -]+[0-9]{4}-[0-9]{2}-[0-9]{2}' CHANGELOG.md | head -2)
  NEW_VERSION=$(echo "${RELEASE_LINES[0]:-}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
  OLD_VERSION=$(echo "${RELEASE_LINES[1]:-}" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 | sed 's/^v//')
  if [ -z "${NEW_VERSION:-}" ] || [ -z "${OLD_VERSION:-}" ]; then
    echo "Error: Automatic detection failed." >&2
    exit 1
  fi
else
  OLD_VERSION="$1"
  NEW_VERSION="$2"
fi

version_bump_logic
exit 0
