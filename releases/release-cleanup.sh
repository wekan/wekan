#!/bin/bash
# The checkout is wherever this script is: ~/repos/wekan on Linux,
# ~/Documents/repos/wekan on macOS, Downloads\repos\wekan on Windows.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Usage: ./release.sh 1.36

# Delete old stuff
cd ~/
sudo rm -rf .npm
cd "$REPO_DIR"
sudo rm -rf parts prime stage .meteor-spk

# Set permissions
cd "$(dirname "$REPO_DIR")"
sudo chown -R $USER wekan
cd ~/
sudo chown -R $USER ~/.meteor
sudo rm -rf .cache/snapcraft
sudo chown -R $USER .config

# Back
cd "$(dirname "$REPO_DIR")"
