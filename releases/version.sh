#!/usr/bin/env bash
# =================================================================
# WEKAN VERSION + DEPENDENCY UPDATE SCRIPT
# Supports: Linux (Bash/Zsh) and macOS (Zsh)
# =================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Local copy of dependency artifacts, used only for the optional
# USE_LOCAL_DEP_VERSIONS offline mode. Builds themselves fetch from upstream.
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

  if [ "${USE_LOCAL_DEP_VERSIONS:-0}" = "1" ]; then
    if [ -f "$DOWNLOAD_DIR/$filename" ]; then
      echo "[DOWNLOAD] Using local file: $DOWNLOAD_DIR/$filename"
      return 0
    fi

    echo "[ERROR] Missing local file: $DOWNLOAD_DIR/$filename" >&2
    return 1
  fi

  mkdir -p "$DOWNLOAD_DIR"

  if [ -f "$DOWNLOAD_DIR/$filename" ]; then
    echo "[DOWNLOAD] Already exists: $DOWNLOAD_DIR/$filename"
    return 0
  fi

  echo "[DOWNLOAD] Fetching from upstream: $upstream_url"
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
    # Update the explicit, stable Node.js dist path (e.g. nodejs.org/dist/v24.18.0).
    # The old floating `latest-v24.x/` path is intentionally NOT handled here: it
    # only ever holds the single newest v24 release, so a pinned filename under it
    # 404s once upstream advances — that is what broke the snap build. snapcraft.yaml
    # and the Dockerfile now use the explicit version path only.
    # WeKan is pinned to Node.js 24.x, so the major is intentionally hard-coded:
    # this bumps any older 24.x reference to the newest 24.x (${new_node}) and
    # never rewrites a reference to a different major. The Node-specific anchors
    # ('nodejs.org/dist/v', 'node-v...-linux-', 'npm-node-version:', 'NODE_TAR=')
    # also keep this from touching MongoDB/WeKan or other version numbers.
    sedi -E "s#nodejs.org/dist/v24\.[0-9]+\.[0-9]+#nodejs.org/dist/v${new_node}#g" "$f"
    sedi -E "s#node-v24\.[0-9]+\.[0-9]+-linux-(x64|arm64|armv7l|s390x|ppc64le)\.tar\.(xz|gz)#node-v${new_node}-linux-\1.tar.\2#g" "$f"
    sedi -E "s#npm-node-version: 24\.[0-9]+\.[0-9]+#npm-node-version: ${new_node}#g" "$f"
    sedi -E "s#NODE_TAR=\"node-v24\.[0-9]+\.[0-9]+-linux-\$\{NODE_ARCH\}\.tar\.xz\"#NODE_TAR=\"node-v${new_node}-linux-\${NODE_ARCH}.tar.xz\"#g" "$f"
    sedi -E "s#node-v24\.[0-9]+\.[0-9]+-linux-\$\{NODE_ARCH\}/bin/node#node-v${new_node}-linux-\${NODE_ARCH}/bin/node#g" "$f"
  done
}

update_releases_mongo_versions() {
  local mongo_ver="$1"
  local files=()

  # Only the MongoDB 7 server (mongod) is version-managed now: mongosh is no longer
  # bundled, and the MongoDB Database Tools come unversioned from the newest
  # wekan/mongo-tools release, so neither is pinned in any releases/ file.
  mapfile -t files < <(grep -RIlE 'mongodb-linux-' releases || true)
  if [ ${#files[@]} -eq 0 ]; then
    echo "[DEBUG] No MongoDB server artifact references found under releases/."
    return 0
  fi

  echo "[DEBUG] Updating MongoDB server references in ${#files[@]} releases files..."
  local f
  for f in "${files[@]}"; do
    sedi -E "s#(mongodb-linux-(x86_64|aarch64|\$\{MONGO_ARCH\})-ubuntu2204-)[0-9]+\.[0-9]+\.[0-9]+(\.tgz)#\1${mongo_ver}\3#g" "$f"
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

    if [ -z "${NEW_NODE:-}" ] || [ -z "${MONGO_VER:-}" ]; then
      echo "Error: Missing one or more local dependency versions in $DOWNLOAD_DIR." >&2
      exit 1
    fi

    echo "Local Node.js detected: $NEW_NODE"
    echo "Local MongoDB detected: $MONGO_VER"
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

    # mongosh and the MongoDB Database Tools are no longer probed from mongodb.com:
    # mongosh is not bundled anymore (WeKan uses the bundled Node.js + `mongodb`
    # driver), and the Database Tools come from the wekan/mongo-tools fork's newest
    # release (no version pinned in snapcraft.yaml). Only the MongoDB 7 server
    # (mongod, amd64/arm64) is still version-managed here.
  fi

  # 5. Update dependency versions in snap files and Dockerfile
  echo "[DEBUG] Updating dependency versions in files..."
  sedi -E "s|NODE_VERSION=v24\.[0-9]+\.[0-9]+|NODE_VERSION=v${NEW_NODE}|g" Dockerfile
  sedi -E "s|npm-node-version: 24\.[0-9]+\.[0-9]+|npm-node-version: ${NEW_NODE}|g" snapcraft.yaml
  sedi -E "s|NODE_TAR=\"node-v24\.[0-9]+\.[0-9]+-linux-\$\{NODE_ARCH\}\.tar\.xz\"|NODE_TAR=\"node-v${NEW_NODE}-linux-\${NODE_ARCH}.tar.xz\"|g" snapcraft.yaml
  sedi -E "s|node-v24\.[0-9]+\.[0-9]+-linux-\$\{NODE_ARCH\}/bin/node|node-v${NEW_NODE}-linux-\${NODE_ARCH}/bin/node|g" snapcraft.yaml
  update_releases_node_versions "$NEW_NODE"

  sedi -E "s|mongodb-linux-\$\{MONGO_ARCH\}-ubuntu2204-7\.[0-9]+\.[0-9]+\.tgz|mongodb-linux-\${MONGO_ARCH}-ubuntu2204-${MONGO_VER}.tgz|g" snapcraft.yaml
  update_releases_mongo_versions "$MONGO_VER"

  # 6. Update application versions (existing logic retained)
  NEW_NO_DOTS=$(echo "$NEW_VERSION" | tr -d '.')
  OLD_NO_DOTS=$(echo "$OLD_VERSION" | tr -d '.')
  TODAY=$(date +%Y-%m-%d)

  if [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+$ ]]; then
    PKG_VER="v${NEW_VERSION}.0"
  else
    PKG_VER="v${NEW_VERSION}"
  fi

  # Update ONLY the WeKan application version, never any dependency versions.
  # The WeKan version is the only "version" value carrying a leading 'v'
  # (e.g. "v9.57.0"); every dependency version in these files is plain semver
  # ("5.2.0"), so anchoring on "v[0-9]" is what keeps this from touching them.
  #
  # package-lock.json (lockfileVersion 3) stores the root version TWICE: the
  # top-level "version" and the nested packages."".version. Both must be bumped,
  # so this is a global (/g) replace, not the first-match-only "0,/re/" form --
  # otherwise the remote release-all.yml bump job (which commits version.sh's
  # output directly, with no intervening `npm install` to re-sync the lock)
  # would push a package-lock.json whose packages."".version stays stale.
  sedi -E "s/\"version\": \"v[0-9][^\"]*\"/\"version\": \"${PKG_VER}\"/g" package.json
  sedi -E "s/\"version\": \"v[0-9][^\"]*\"/\"version\": \"${PKG_VER}\"/g" package-lock.json
  sedi "0,/appVersion: \"[^\"]*\"/s/appVersion: \"[^\"]*\"/appVersion: \"${PKG_VER}\"/" Stackerfile.yml
  # Set the snap version (the `version: '<x>'` line). Match by `^version:`
  # instead of a hard-coded line number, and tolerate any quoting, so this can
  # never silently miss if the line moves or the quotes change — a stale snap
  # version breaks the release (the snap is named wekan_<old>_<arch>.snap and the
  # upload/attach globs in release-all.yml then match nothing). Only line 2
  # starts with `version:` (npm-node-version: is indented), so this is safe.
  sedi -E "s/^version:.*/version: '${NEW_VERSION}'/" snapcraft.yaml
  if ! grep -qxF "version: '${NEW_VERSION}'" snapcraft.yaml; then
    echo "Error: failed to set snap version to '${NEW_VERSION}' in snapcraft.yaml." >&2
    exit 1
  fi
  # Re-point the bundle the snap downloads to v$NEW_VERSION. Anchor on the stable
  # "wekan-<v>-" and "releases/download/v<v>/" shapes, NOT on $OLD_VERSION: the
  # snap is RELEASE-CRITICAL exactly like the Docker image — it downloads
  # wekan-<v>-<arch>.zip here, so if these stayed at an old version (which the
  # $OLD_VERSION-anchored form did whenever $OLD did not match) the snap would be
  # NAMED v$NEW_VERSION (via the version: line above) but SHIP the old bundle and
  # report the old version. Self-healing + assert so any miss fails the release.
  sedi -E "s#wekan-[0-9]+\.[0-9]+(\.[0-9]+)?-#wekan-${NEW_VERSION}-#g" snapcraft.yaml
  sedi -E "s#(releases/download/)v[0-9]+\.[0-9]+(\.[0-9]+)?/#\1v${NEW_VERSION}/#g" snapcraft.yaml
  if grep -qE "wekan-[0-9]+\.[0-9]+(\.[0-9]+)?-" snapcraft.yaml \
     && ! grep -qF "wekan-${NEW_VERSION}-" snapcraft.yaml; then
    echo "Error: failed to set the WeKan bundle version to ${NEW_VERSION} in snapcraft.yaml." >&2
    exit 1
  fi
  if grep -qE "releases/download/v[0-9]" snapcraft.yaml \
     && ! grep -qF "releases/download/v${NEW_VERSION}/" snapcraft.yaml; then
    echo "Error: failed to set the release-download URL to v${NEW_VERSION} in snapcraft.yaml." >&2
    exit 1
  fi

  # Both anchor on the field name and re-normalize whatever value is there to the
  # new version (NOT on the old value), so they self-heal from any stale state.
  # Global, not first-match, and the old separate "appVersion = $OLD_NO_DOTS,"
  # fixup is dropped — that $OLD-anchored line silently no-op'd on a mismatch and
  # is redundant now that this rewrites every appVersion occurrence.
  sedi -E "s/appVersion = [0-9]+/appVersion = ${NEW_NO_DOTS}/g" sandstorm-pkgdef.capnp
  sedi -E "s/appMarketingVersion = \(defaultText = \"[^\"]*\"\)/appMarketingVersion = (defaultText = \"${NEW_VERSION}~${TODAY}\")/g" sandstorm-pkgdef.capnp
  if ! grep -qF "appVersion = ${NEW_NO_DOTS}" sandstorm-pkgdef.capnp; then
    echo "Error: failed to set 'appVersion = ${NEW_NO_DOTS}' in sandstorm-pkgdef.capnp." >&2
    exit 1
  fi

  # Anchor on the `ARG VERSION=` prefix, NOT on the old version number, so this
  # always rewrites the default to the new version even if OLD_VERSION was passed
  # wrong (e.g. a skipped point release). A stale default here means every Docker
  # image downloads that version's wekan-<v>-<arch>.zip and reports the wrong
  # version in the Admin Panel. release-all.yml also passes --build-arg VERSION,
  # but keep this in sync so manual `docker build .` produces the right image too.
  sedi -E "s|^ARG VERSION=.*|ARG VERSION=$NEW_VERSION|g" Dockerfile
  if ! grep -qxF "ARG VERSION=$NEW_VERSION" Dockerfile; then
    echo "Error: failed to set 'ARG VERSION=$NEW_VERSION' in Dockerfile." >&2
    exit 1
  fi
  # Documentation (Windows offline-install guide): same self-healing anchors as
  # snapcraft.yaml so the doc's download links re-point to v$NEW_VERSION from any
  # stale value. Only warn (don't fail the release) on a miss — a stale doc link
  # is cosmetic, unlike the snap/Docker bundles above.
  OFFLINE_DOC="docs/Platforms/Propietary/Windows/Offline.md"
  sedi -E "s#wekan-[0-9]+\.[0-9]+(\.[0-9]+)?-#wekan-${NEW_VERSION}-#g" "$OFFLINE_DOC"
  sedi -E "s#(releases/download/)v[0-9]+\.[0-9]+(\.[0-9]+)?/#\1v${NEW_VERSION}/#g" "$OFFLINE_DOC"
  if grep -qE "wekan-[0-9]+\.[0-9]+(\.[0-9]+)?-" "$OFFLINE_DOC" \
     && ! grep -qF "wekan-${NEW_VERSION}-" "$OFFLINE_DOC"; then
    echo "[WARN] $OFFLINE_DOC still references an old wekan-<version> bundle; expected ${NEW_VERSION}." >&2
  fi

  # 7. Download dependency artifacts from upstream to ~/Lataukset for the optional
  # USE_LOCAL_DEP_VERSIONS offline mode. The builds themselves fetch from upstream too.
  # Do not fetch Wekan release bundles here: they are created later by release-bundle.sh.
  # Skipped in the remote (GitHub Actions) flow via RELEASE_SKIP_DEP_DOWNLOAD=1,
  # where every build job already downloads its dependencies straight from upstream.
  if [ "${RELEASE_SKIP_DEP_DOWNLOAD:-0}" = "1" ]; then
    echo "[DEBUG] RELEASE_SKIP_DEP_DOWNLOAD=1 set, skipping dependency pre-download."
  else
    echo "[DEBUG] Downloading missing dependency artifacts from upstream to $DOWNLOAD_DIR ..."

    ensure_cache_or_download "node-v${NEW_NODE}-linux-x64.tar.xz" "https://nodejs.org/dist/v${NEW_NODE}/node-v${NEW_NODE}-linux-x64.tar.xz"
    ensure_cache_or_download "node-v${NEW_NODE}-linux-arm64.tar.xz" "https://nodejs.org/dist/v${NEW_NODE}/node-v${NEW_NODE}-linux-arm64.tar.xz"

    ensure_cache_or_download "mongodb-linux-x86_64-ubuntu2204-${MONGO_VER}.tgz" "https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-${MONGO_VER}.tgz"
    ensure_cache_or_download "mongodb-linux-aarch64-ubuntu2204-${MONGO_VER}.tgz" "https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-ubuntu2204-${MONGO_VER}.tgz"

    # mongosh is no longer bundled; the MongoDB Database Tools come from the
    # wekan/mongo-tools release, so nothing is fetched from mongodb.com for them.
  fi

  # 8. Update Wekan website (manual/local flow only; the remote flow handles the
  # wekan.fi and charts repos in dedicated parallel GitHub Actions jobs). These
  # blocks no-op in CI because the sibling repos are not checked out there.
  if [ -d "../w/wekan.fi" ]; then
    INSTALL_PAGE="../w/wekan.fi/install/index.html"
    METEOR_VER=$(grep -o 'METEOR@[^ "\\]*' .meteor/release | head -1 | sed 's/.*@//')
    NPM_VER=$(grep -o 'NPM_VERSION=[^ "\\]*' Dockerfile | head -1 | cut -d= -f2 | tr -d '"')
    NODE_VER=$(grep -o 'NODE_VERSION=[^ "\\]*' Dockerfile | head -1 | cut -d= -f2 | tr -d '"')

    (cd ../w/wekan.fi && git pull)
    sedi "s|<span id=\"meteor-version\">[^<]*</span>|<span id=\"meteor-version\">$METEOR_VER</span>|g" "$INSTALL_PAGE"
    sedi "s|<span id=\"node-version\">[^<]*</span>|<span id=\"node-version\">$NODE_VER</span>|g" "$INSTALL_PAGE"
    # Node.js download URL paths: OFFICIAL nodejs.org (amd64/arm64/s390x/ppc64le)
    # and UNOFFICIAL unofficial-builds.nodejs.org (riscv64). Keep them in sync with
    # release-website.sh so the install links never go stale after a Node.js bump.
    sedi -E "s#(nodejs\.org/dist/)v[0-9]+\.[0-9]+\.[0-9]+#\1${NODE_VER}#g" "$INSTALL_PAGE"
    sedi -E "s#(unofficial-builds\.nodejs\.org/download/release/)v[0-9]+\.[0-9]+\.[0-9]+#\1${NODE_VER}#g" "$INSTALL_PAGE"
    sedi -E "s#node-v[0-9]+\.[0-9]+\.[0-9]+-linux-#node-${NODE_VER}-linux-#g" "$INSTALL_PAGE"
    # Anchor on the version-number class, not on $OLD_VERSION, so a stale value on
    # the page still gets re-normalized to v$NEW_VERSION (see release-website.sh).
    sedi -E "s#(<span class=\"version-number\">)v[0-9][^<]*(</span>)#\1v${NEW_VERSION}\2#g" "$INSTALL_PAGE"
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

  # 9. Update and publish the WeKan Helm chart in the separate wekan/charts repo
  # at ../w/charts. release-charts.sh bumps only the WeKan version numbers in the
  # chart, packages it, and publishes it to the gh-pages Helm repo index.
  if [ -d "../w/charts/wekan" ]; then
    ./releases/release-charts.sh "${NEW_VERSION}"
  fi

  echo "--- Version bump complete ---"
  echo "Detected dependency versions:"
  echo "  Node.js:                $NEW_NODE"
  echo "  MongoDB (ubuntu2204):   $MONGO_VER"
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
