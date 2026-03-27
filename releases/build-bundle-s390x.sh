#!/bin/bash

# Build WeKan s390x bundle - Meteor 3 style (no fibers needed).
#
# This script rebuilds only the native Node.js modules for s390x.
# Run on an s390x machine (e.g. IBM LinuxONE), or use a QEMU s390x environment.
#
# Usage:
#   ./releases/build-bundle-s390x.sh 8.43

if [ $# -ne 1 ]; then
  echo "Syntax with Wekan version number:"
  echo "  ./releases/build-bundle-s390x.sh 8.43"
  exit 1
fi

VERSION=$1

# Install build dependencies (Debian/Ubuntu or RHEL/Fedora)
if command -v apt-get &>/dev/null; then
  sudo apt-get update
  sudo apt-get install -y build-essential g++ make python3 curl wget zip unzip
elif command -v dnf &>/dev/null; then
  sudo dnf install -y gcc gcc-c++ make python3 curl wget zip unzip
  sudo dnf groupinstall -y "Development Tools"
fi

# Remove old files
rm -rf bundle
rm -f wekan-${VERSION}-s390x.zip wekan-${VERSION}-amd64.zip

# Download the amd64 bundle as the base
wget --no-check-certificate \
  https://github.com/wekan/wekan/releases/download/v${VERSION}/wekan-${VERSION}-amd64.zip

# Extract bundle
unzip wekan-${VERSION}-amd64.zip

# Rebuild native Node.js modules for s390x (no fibers or bcrypt patching needed with Meteor 3)
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

# Create s390x bundle
zip -r wekan-${VERSION}-s390x.zip bundle

echo "Done: wekan-${VERSION}-s390x.zip"
