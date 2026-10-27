#!/bin/bash
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp
# The checkout is wherever this script is: ~/repos/wekan on Linux,
# ~/Documents/repos/wekan on macOS, Downloads\repos\wekan on Windows.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Usage: ./release.sh 1.36

# Delete old stuff
sudo rm -rf "$npm_config_cache"
cd "$REPO_DIR"
sudo rm -rf parts prime stage .meteor-spk

# Set permissions
cd "$(dirname "$REPO_DIR")"
sudo chown -R $USER wekan
cd ~/
[ -d "$WEKAN_TOOLS_DIR/.meteor" ] && sudo chown -R $USER "$WEKAN_TOOLS_DIR/.meteor"
sudo rm -rf .cache/snapcraft
sudo chown -R $USER .config

# Back
cd "$(dirname "$REPO_DIR")"
