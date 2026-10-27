#!/bin/bash

set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp
# The checkout is wherever this script is: ~/repos/wekan on Linux,
# ~/Documents/repos/wekan on macOS, Downloads\repos\wekan on Windows.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Release script for wekan.

# 1) Check that there is only one parameter
#    of Wekan version number:

if [ $# -ne 2 ]
  then
    echo "Syntax with Wekan old and new version number:"
    echo "  ./release.sh 9.16 9.17"
    exit 1
fi

# 2) Commit and push version number changes
cd "$REPO_DIR"

# Downloads and release zips stay in .tools/tmp (releases/tools-env.sh), not
# in ~/Downloads or ~/Lataukset.
DOWNLOAD_DIR="${DOWNLOAD_DIR:-$WEKAN_DOWNLOADS}"
if compgen -G "$DOWNLOAD_DIR/node-v*-linux-*.tar.*" > /dev/null && compgen -G "$DOWNLOAD_DIR/mongodb-*.tgz" > /dev/null; then
  read -r -p "Check the latest Node.js and MongoDB versions from the internet? (y/n) " CHECK_LATEST
  case "$CHECK_LATEST" in
    y|Y|yes|YES)
      :
      ;;
    *)
      export USE_LOCAL_DEP_VERSIONS=1
      ;;
  esac
fi

"$REPO_DIR/releases/rebuild-docs.sh" "$2"

"$REPO_DIR/releases/version.sh" "$1" "$2"

# 3) Build bundle first so generated artifacts (for example package-lock.json)
# are ready before commit/tag steps.
"$REPO_DIR/releases/release-bundle.sh" "$2"

# Downloads and release zips stay in .tools/tmp (releases/tools-env.sh), not
# in ~/Downloads or ~/Lataukset.
DOWNLOAD_DIR="${DOWNLOAD_DIR:-$WEKAN_DOWNLOADS}"
ZIP_PATH="$DOWNLOAD_DIR/wekan-$2-amd64.zip"
if [ ! -f "$ZIP_PATH" ]; then
  echo "Error: Expected bundle not found: $ZIP_PATH"
  exit 1
fi

git add --all
git add package-lock.json

if git diff --cached --quiet; then
  echo "No changes to commit after build. Skipping commit/tag/push."
  exit 0
fi

git commit -m "v$2"
git push

# 4) Add release tag
"$REPO_DIR/releases/add-tag.sh" "v$2"

# 5) Push to repo
git push

# 6) Update wekan.fi website: bump version numbers in .tools/wekan.fi and copy the
# freshly built API docs (public/api/wekan.html -> api/v$2/index.html,
# public/api/wekan.yml -> api/v$2/wekan.yml).
"$REPO_DIR/releases/release-website.sh" "$1" "$2"

# 7) Build Sandstorm
#"$REPO_DIR/releases/release-sandstorm.sh" $2

# Build Snap
#./release-snap.sh $2
