#!/bin/bash

# Build WeKan arm64 bundle - Meteor 3 style (no fibers needed).
#
# This script rebuilds only the native Node.js modules for arm64.
# Run on an arm64 machine, or use the GitHub Actions ubuntu-24.04-arm runner.
#
# Usage:
#   ./releases/build-bundle-arm64.sh 8.43

if [ $# -ne 1 ]; then
  echo "Syntax with Wekan version number:"
  echo "  ./releases/build-bundle-arm64.sh 8.43"
  exit 1
fi

VERSION=$1

# Install build dependencies
sudo apt-get update
sudo apt-get install -y build-essential g++ make python3 curl wget zip unzip

# Remove old files
rm -rf bundle
rm -f wekan-${VERSION}-arm64.zip wekan-${VERSION}-amd64.zip

# Download the amd64 bundle as the base
wget --no-check-certificate \
  https://github.com/wekan/wekan/releases/download/v${VERSION}/wekan-${VERSION}-amd64.zip

# Extract bundle
unzip wekan-${VERSION}-amd64.zip

# Rebuild native Node.js modules for arm64 (no fibers or bcrypt patching needed with Meteor 3)
cd bundle/programs/server
npm rebuild
cd ../../..

# Clean up temporary files
cd bundle
find . -type d -name '*-garbage*' -exec rm -rf {} + 2>/dev/null || true
find . -name '*phantom*' -exec rm -rf {} + 2>/dev/null || true
find . -name '.*.swp' -delete 2>/dev/null || true
find . -name '*.swp' -delete 2>/dev/null || true
cd ..

# Create arm64 bundle
zip -r wekan-${VERSION}-arm64.zip bundle

echo "Done: wekan-${VERSION}-arm64.zip"
