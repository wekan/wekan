#!/bin/bash

set -euo pipefail

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
cd ~/repos/wekan

DOWNLOAD_DIR="${DOWNLOAD_DIR:-$HOME/Lataukset}"
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

~/repos/wekan/releases/rebuild-docs.sh "$2"

~/repos/wekan/releases/version.sh "$1" "$2"

# 3) Build bundle first so generated artifacts (for example package-lock.json)
# are ready before commit/tag steps.
~/repos/wekan/releases/release-bundle.sh "$2"

DOWNLOAD_DIR="${DOWNLOAD_DIR:-$HOME/Lataukset}"
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
~/repos/wekan/releases/add-tag.sh "v$2"

# 5) Push to repo
git push

# 6) Update wekan.fi website: bump version numbers in ../w/wekan.fi and copy the
# freshly built API docs (public/api/wekan.html -> api/v$2/index.html,
# public/api/wekan.yml -> api/v$2/wekan.yml).
~/repos/wekan/releases/release-website.sh "$1" "$2"

# 7) Build Sandstorm
#~/repos/wekan/releases/release-sandstorm.sh $2

# Build Snap
#./release-snap.sh $2
