#!/bin/bash
# The checkout is wherever this script is: ~/repos/wekan on Linux,
# ~/Documents/repos/wekan on macOS, Downloads\repos\wekan on Windows.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Update node version.

# Check that there is only one parameter
# of Wekan version number:

if [ $# -ne 2 ]
  then
    echo "Syntax with Node old and new version number:"
    echo "  ./node-update.sh 12.21.0 12.22.0"
    exit 1
fi

sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

# With replacing longer strings than only version number,
# trying to make sure only Node.js version is updated.

echo "1) Updating Snap node"
sedi "s|$1|$2|g" "$REPO_DIR/snapcraft.yaml"
sedi "s|node-engine: $1|node-engine: $2|g" "$REPO_DIR/.future-snap/snapcraft.yaml"
sedi "s|node-engine: $1|node-engine: $2|g" "$REPO_DIR/.future-snap/broken-snapcraft.yaml"

echo "2) Updating Docker node"
sedi "s|NODE_VERSION=v$1|NODE_VERSION=v$2|g" "$REPO_DIR/Dockerfile"
sedi "s|NODE_VERSION=v$1|NODE_VERSION=v$2|g" "$REPO_DIR/Dockerfile.arm64v8"
sedi "s|NODE_VERSION=v$1|NODE_VERSION=v$2|g" "$REPO_DIR/.devcontainer/Dockerfile"

echo "3) Updating Rebuild scripts..."
sedi "s|sudo n $1|sudo n $2|g" "$REPO_DIR/build.sh"
sedi "s|nodejs.org/dist/v$1|nodejs.org/dist/v$2|g" "$REPO_DIR/build.bat"
sedi "s|node-v$1|node-v$2|g" "$REPO_DIR/build.bat"

echo "4) Updating Stacksmith"
sedi "s|$1|$2|g" "$REPO_DIR/stacksmith/user-scripts/build.sh"

echo "5) Updating Travis"
sedi "s|$1|$2|g" "$REPO_DIR/.travis.yml"

#echo "6) Adding changes to be committed."
git add snapcraft.yaml .future-snap/snapcraft.yaml .future-snap/broken-snapcraft.yaml \
Dockerfile Dockerfile.arm64v8 .devcontainer/Dockerfile build.sh \
build.bat stacksmith/user-scripts/build.sh .travis.yml

echo "7) Commit changes and push to GitHub"
git commit -n -m "Updated to Node.js v$2. Thanks to Node.js developers."
git push
