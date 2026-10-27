#!/bin/bash
# The checkout is wherever this script is: ~/repos/wekan on Linux,
# ~/Documents/repos/wekan on macOS, Downloads\repos\wekan on Windows.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Usage: ./release-snap.sh 1.36

if [ "$#" -ne 1 ]; then
  echo "Usage: ./release-snap.sh <version>"
  exit 1
fi

# Cleanup
cd "$REPO_DIR/releases"
./release-cleanup.sh

# Build Source
cd "$REPO_DIR"
./releases/rebuild-release.sh

# Build Snap
cd "$REPO_DIR"
sudo snapcraft

# Cleanup
cd "$REPO_DIR"
./releases/release-cleanup.sh

# Push snap
cd "$REPO_DIR"
sudo snap install --dangerous wekan_$1_amd64.snap
echo "Now you can test local installed snap."
snapcraft push wekan_$1_amd64.snap
scp wekan_$1_amd64.snap x2:/var/www/releases.wekan.team/
mv wekan_$1_amd64.snap ..
