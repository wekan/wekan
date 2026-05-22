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

version_pair_exists() {
  local version="$1"
  local amd64_url_fmt="$2"
  local arm64_url_fmt="$3"
  local amd64_url arm64_url

  printf -v amd64_url "$amd64_url_fmt" "$version"
  printf -v arm64_url "$arm64_url_fmt" "$version"
  http_ok "$amd64_url" && http_ok "$arm64_url"
}

latest_common_semver_by_probe() {
  local current_version="$1"
  local minor_ahead="$2"
  local max_patch="$3"
  local amd64_url_fmt="$4"
  local arm64_url_fmt="$5"

  if [[ ! "$current_version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    return 1
  fi

  local major="${BASH_REMATCH[1]}"
  local start_minor="${BASH_REMATCH[2]}"
  local start_patch="${BASH_REMATCH[3]}"

  local best="$current_version"
  local found_any=0
  local end_minor=$((start_minor + minor_ahead))
  local minor patch candidate

  # Probe version URLs directly because some upstream directory listings return 403.
  for ((minor=start_minor; minor<=end_minor; minor++)); do
    local patch_begin=0
    local found_in_minor=""
    local misses_after_hit=0

    if [ "$minor" -eq "$start_minor" ]; then
      patch_begin="$start_patch"
    fi

    for ((patch=patch_begin; patch<=max_patch; patch++)); do
      candidate="${major}.${minor}.${patch}"
      if version_pair_exists "$candidate" "$amd64_url_fmt" "$arm64_url_fmt"; then
        found_in_minor="$candidate"
        found_any=1
        misses_after_hit=0
      elif [ -n "$found_in_minor" ]; then
        misses_after_hit=$((misses_after_hit + 1))
        if [ "$misses_after_hit" -ge 5 ]; then
          break
        fi
      fi
    done

    if [ -n "$found_in_minor" ]; then
      best="$found_in_minor"
    fi
  done

  [ "$found_any" -eq 1 ] || return 1
  echo "$best"
}

latest_common_version() {
  local listing_url="$1"
  local extract_regex="$2"
  local version_sed="$3"
  local amd64_url_fmt="$4"
  local arm64_url_fmt="$5"
  local found=""

  local listing
  listing=$(curl -fsSL "$listing_url" 2>/dev/null || true)
  if [ -z "$listing" ]; then
    echo "[WARN] Could not fetch listing from $listing_url. Falling back to existing file versions." >&2
    return 1
  fi

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

  if [ "${USE_LOCAL_DEP_VERSIONS:-0}" = "1" ]; then
    if [ -f "$DOWNLOAD_DIR/$filename" ]; then
      echo "[DOWNLOAD] Using local file: $DOWNLOAD_DIR/$filename"
      return 0
    fi

    echo "[ERROR] Missing local file: $DOWNLOAD_DIR/$filename" >&2
    return 1
  fi

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

ensure_cache_or_download_optional() {
  local filename="$1"
  local upstream_url="$2"

  if ! ensure_cache_or_download "$filename" "$upstream_url"; then
    echo "[WARN] Optional artifact unavailable: $filename"
    echo "[WARN] Continuing without optional artifact download."
  fi
}

latest_cached_version_by_pattern() {
  local file_glob="$1"
  local extract_regex="$2"

  shopt -s nullglob
  local files=("$DOWNLOAD_DIR"/$file_glob)
  shopt -u nullglob

  if [ ${#files[@]} -eq 0 ]; then
    return 1
  fi

  printf '%s\n' "${files[@]}" \
    | sed -E "s#^.*/${extract_regex}#\\1#" \
    | sort -Vu \
    | tail -1
}

update_releases_node_versions() {
  local new_node="$1"
  local files=()

  # Only touch files that clearly contain Node.js release references.
  mapfile -t files < <(grep -RIlE 'nodejs\.org/dist|node-v24\.[0-9]+\.[0-9]+-linux-|npm-node-version: 24\.' releases || true)
  if [ ${#files[@]} -eq 0 ]; then
    echo "[DEBUG] No Node.js references found under releases/."
    return 0
  fi

  echo "[DEBUG] Updating Node.js references in ${#files[@]} releases files..."
  local f
  for f in "${files[@]}"; do
    sedi -E "s#nodejs.org/dist/v24\.[0-9]+\.[0-9]+#nodejs.org/dist/v${new_node}#g" "$f"
    sedi -E "s#latest-v24\.x/node-v24\.[0-9]+\.[0-9]+-linux-(x64|arm64)\.tar\.xz#latest-v24.x/node-v${new_node}-linux-\1.tar.xz#g" "$f"
    sedi -E "s#node-v24\.[0-9]+\.[0-9]+-linux-(x64|arm64|armv7l|s390x|ppc64le)\.tar\.(xz|gz)#node-v${new_node}-linux-\1.tar.\2#g" "$f"
    sedi -E "s#npm-node-version: 24\.[0-9]+\.[0-9]+#npm-node-version: ${new_node}#g" "$f"
    sedi -E "s#NODE_TAR=\"node-v24\.[0-9]+\.[0-9]+-linux-\$\{NODE_ARCH\}\.tar\.xz\"#NODE_TAR=\"node-v${new_node}-linux-\${NODE_ARCH}.tar.xz\"#g" "$f"
    sedi -E "s#node-v24\.[0-9]+\.[0-9]+-linux-\$\{NODE_ARCH\}/bin/node#node-v${new_node}-linux-\${NODE_ARCH}/bin/node#g" "$f"
  done
}

update_releases_mongo_versions() {
  local mongo_ver="$1"
  local mongosh_ver="$2"
  local tools_ver="$3"
  local files=()

  # Update only explicit MongoDB/mongosh/database-tools artifact references.
  mapfile -t files < <(grep -RIlE 'mongodb-linux-|mongosh-[0-9]+\.[0-9]+\.[0-9]+-linux-|mongodb-database-tools-ubuntu(2204|2404)-' releases || true)
  if [ ${#files[@]} -eq 0 ]; then
    echo "[DEBUG] No MongoDB artifact references found under releases/."
    return 0
  fi

  echo "[DEBUG] Updating MongoDB artifact references in ${#files[@]} releases files..."
  local f
  for f in "${files[@]}"; do
    sedi -E "s#(mongodb-linux-(x86_64|aarch64|\$\{MONGO_ARCH\})-ubuntu2204-)[0-9]+\.[0-9]+\.[0-9]+(\.tgz)#\1${mongo_ver}\3#g" "$f"
    sedi -E "s#(mongosh-)[0-9]+\.[0-9]+\.[0-9]+(-linux-(x64|arm64|\$\{MONGOSH_ARCH\})\.tgz)#\1${mongosh_ver}\2#g" "$f"
    sedi -E "s#(mongodb-database-tools-ubuntu(2204|2404)-(x86_64|arm64|\$\{TOOLS_ARCH\})-)[0-9]+\.[0-9]+\.[0-9]+(\.tgz)#\1${tools_ver}\4#g" "$f"
  done
}

version_bump_logic() {
  echo "--- Starting version bump logic ---"
  echo "New Version: $NEW_VERSION"
  echo "Old Version: $OLD_VERSION"

  if [ "${USE_LOCAL_DEP_VERSIONS:-0}" = "1" ]; then
    echo "[DEBUG] Using dependency versions from local cache in $DOWNLOAD_DIR ..."

    NEW_NODE=$(latest_cached_version_by_pattern 'node-v*-linux-x64.tar.xz' 'node-v([0-9]+\.[0-9]+\.[0-9]+)-linux-x64\.tar\.xz') || true
    MONGO_VER=$(latest_cached_version_by_pattern 'mongodb-linux-x86_64-ubuntu2204-*.tgz' 'mongodb-linux-x86_64-ubuntu2204-([0-9]+\.[0-9]+\.[0-9]+)\.tgz') || true
    MONGOSH_VER=$(latest_cached_version_by_pattern 'mongosh-*-linux-x64.tgz' 'mongosh-([0-9]+\.[0-9]+\.[0-9]+)-linux-x64\.tgz') || true
    TOOLS_VER=$(latest_cached_version_by_pattern 'mongodb-database-tools-ubuntu2204-x86_64-*.tgz' 'mongodb-database-tools-ubuntu2204-x86_64-([0-9]+\.[0-9]+\.[0-9]+)\.tgz') || true

    if [ -z "${NEW_NODE:-}" ] || [ -z "${MONGO_VER:-}" ] || [ -z "${MONGOSH_VER:-}" ] || [ -z "${TOOLS_VER:-}" ]; then
      echo "Error: Missing one or more local dependency versions in $DOWNLOAD_DIR." >&2
      exit 1
    fi

    echo "Local Node.js detected: $NEW_NODE"
    echo "Local MongoDB detected: $MONGO_VER"
    echo "Local mongosh detected: $MONGOSH_VER"
    echo "Local mongodb-database-tools detected: $TOOLS_VER"
  else
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
    CURRENT_MONGO_VER=$(get_current_version_from_file snapcraft.yaml 'mongodb-linux-\$\{MONGO_ARCH\}-ubuntu2204-[0-9]+\.[0-9]+\.[0-9]+' | sed -E 's/.*-ubuntu2204-//')
    MONGO_VER=$(latest_common_semver_by_probe \
      "$CURRENT_MONGO_VER" \
      3 \
      80 \
      'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-%s.tgz' \
      'https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-ubuntu2204-%s.tgz') || true

    if [ -z "${MONGO_VER:-}" ]; then
      echo "[WARN] Could not probe newer MongoDB version. Using current value from snapcraft.yaml." >&2
      MONGO_VER="$CURRENT_MONGO_VER"
    fi

    if [ -z "$MONGO_VER" ]; then
      echo "Error: Could not determine latest/common MongoDB version." >&2
      exit 1
    fi
    echo "Latest common MongoDB detected: $MONGO_VER"

    # 3. Detect latest mongosh available for both amd64 and arm64
    echo "[DEBUG] Detecting latest mongosh for amd64+arm64..."
    CURRENT_MONGOSH_VER=$(get_current_version_from_file snapcraft.yaml 'mongosh-[0-9]+\.[0-9]+\.[0-9]+-linux-\$\{MONGOSH_ARCH\}\.tgz' | sed -E 's/mongosh-([0-9]+\.[0-9]+\.[0-9]+)-.*/\1/')
    MONGOSH_VER=$(latest_common_semver_by_probe \
      "$CURRENT_MONGOSH_VER" \
      6 \
      120 \
      'https://downloads.mongodb.com/compass/mongosh-%s-linux-x64.tgz' \
      'https://downloads.mongodb.com/compass/mongosh-%s-linux-arm64.tgz') || true

    if [ -z "${MONGOSH_VER:-}" ]; then
      echo "[WARN] Could not probe newer mongosh version. Using current value from snapcraft.yaml." >&2
      MONGOSH_VER="$CURRENT_MONGOSH_VER"
    fi

    if [ -z "$MONGOSH_VER" ]; then
      echo "Error: Could not determine latest/common mongosh version." >&2
      exit 1
    fi
    echo "Latest common mongosh detected: $MONGOSH_VER"

    # 4. Detect latest mongodb-database-tools available for both amd64 and arm64
    echo "[DEBUG] Detecting latest mongodb-database-tools for ubuntu2204 on amd64+arm64..."
    CURRENT_TOOLS_VER=$(get_current_version_from_file snapcraft.yaml 'mongodb-database-tools-ubuntu2204-\$\{TOOLS_ARCH\}-[0-9]+\.[0-9]+\.[0-9]+' | sed -E 's/.*-ubuntu2204-\$\{TOOLS_ARCH\}-//')
    TOOLS_VER=$(latest_common_semver_by_probe \
      "$CURRENT_TOOLS_VER" \
      8 \
      180 \
      'https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-x86_64-%s.tgz' \
      'https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-arm64-%s.tgz') || true

    if [ -z "${TOOLS_VER:-}" ]; then
      echo "[WARN] Could not probe newer mongodb-database-tools version. Using current value from snapcraft.yaml." >&2
      TOOLS_VER="$CURRENT_TOOLS_VER"
    fi

    if [ -z "$TOOLS_VER" ]; then
      echo "Error: Could not determine latest/common mongodb-database-tools version." >&2
      exit 1
    fi
    echo "Latest common mongodb-database-tools detected: $TOOLS_VER"
  fi

  # 5. Update dependency versions in snap files and Dockerfile
  echo "[DEBUG] Updating dependency versions in files..."
  sedi -E "s|NODE_VERSION=v24\.[0-9]+\.[0-9]+|NODE_VERSION=v${NEW_NODE}|g" Dockerfile
  sedi -E "s|npm-node-version: 24\.[0-9]+\.[0-9]+|npm-node-version: ${NEW_NODE}|g" snapcraft.yaml
  sedi -E "s|NODE_TAR=\"node-v24\.[0-9]+\.[0-9]+-linux-\$\{NODE_ARCH\}\.tar\.xz\"|NODE_TAR=\"node-v${NEW_NODE}-linux-\${NODE_ARCH}.tar.xz\"|g" snapcraft.yaml
  sedi -E "s|node-v24\.[0-9]+\.[0-9]+-linux-\$\{NODE_ARCH\}/bin/node|node-v${NEW_NODE}-linux-\${NODE_ARCH}/bin/node|g" snapcraft.yaml
  update_releases_node_versions "$NEW_NODE"

  sedi -E "s|mongodb-linux-\$\{MONGO_ARCH\}-ubuntu2204-7\.[0-9]+\.[0-9]+\.tgz|mongodb-linux-\${MONGO_ARCH}-ubuntu2204-${MONGO_VER}.tgz|g" snapcraft.yaml
  sedi -E "s|mongosh-[0-9]+\.[0-9]+\.[0-9]+-linux-\$\{MONGOSH_ARCH\}\.tgz|mongosh-${MONGOSH_VER}-linux-\${MONGOSH_ARCH}.tgz|g" snapcraft.yaml
  sedi -E "s|mongodb-database-tools-ubuntu2204-\$\{TOOLS_ARCH\}-[0-9]+\.[0-9]+\.[0-9]+\.tgz|mongodb-database-tools-ubuntu2204-\${TOOLS_ARCH}-${TOOLS_VER}.tgz|g" snapcraft.yaml
  update_releases_mongo_versions "$MONGO_VER" "$MONGOSH_VER" "$TOOLS_VER"

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

  # 7. Ensure dependency artifacts are available in local cache (or downloaded to ~/Lataukset).
  # Do not fetch Wekan release bundles here: they are created later by release-bundle.sh.
  echo "[DEBUG] Checking local cache and downloading missing dependency artifacts to $DOWNLOAD_DIR ..."

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
    (
      cd ../w/wekan.fi
      git add --all
      if git diff --cached --quiet; then
        echo "[INFO] No website changes to commit in ../w/wekan.fi."
      else
        git commit -m "Updates"
        git push
      fi
    )

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
