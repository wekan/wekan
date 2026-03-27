#!/bin/bash

# Build WeKan armhf (arm/v7) bundle - Meteor 3 style (no fibers needed).
#
# This script rebuilds only the native Node.js modules for arm/v7 (armhf).
# Note: MongoDB Community Edition is not available for armhf.
# Use docker-compose-ferretdb.yml or the snap's built-in FerretDB as the database.
#
# Run on an armhf machine, or use a QEMU arm/v7 environment.
#
# Usage:
#   ./releases/build-bundle-armhf.sh 8.43

if [ $# -ne 1 ]; then
  echo "Syntax with Wekan version number:"
  echo "  ./releases/build-bundle-armhf.sh 8.43"
  exit 1
fi

VERSION=$1

# Install build dependencies
if command -v apt-get &>/dev/null; then
  sudo apt-get update
  sudo apt-get install -y build-essential g++ make python3 curl wget zip unzip
fi

# Remove old files
rm -rf bundle
rm -f wekan-${VERSION}-armhf.zip wekan-${VERSION}-amd64.zip

# Download the amd64 bundle as the base
wget --no-check-certificate \
  https://github.com/wekan/wekan/releases/download/v${VERSION}/wekan-${VERSION}-amd64.zip

# Extract bundle
unzip wekan-${VERSION}-amd64.zip

# Rebuild native Node.js modules for armhf (no fibers needed with Meteor 3)
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

# Create armhf bundle
zip -r wekan-${VERSION}-armhf.zip bundle

echo "Done: wekan-${VERSION}-armhf.zip"
echo "Note: MongoDB Community is not available for armhf."
echo "      Use docker-compose-ferretdb.yml or the WeKan snap (built-in FerretDB) as the database."
