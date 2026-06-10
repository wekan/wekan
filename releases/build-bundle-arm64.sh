#!/bin/bash
set -euo pipefail

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan new version number:"
    echo "  ./build.sh 9.17"
    exit 1
fi


DOWNLOAD_DIR="${DOWNLOAD_DIR:-$HOME/Lataukset}"

git pull
cd .build
zip -r wekan-$1-arm64.zip bundle
mkdir -p "$DOWNLOAD_DIR"
mv -f "wekan-$1-arm64.zip" "$DOWNLOAD_DIR/"
cd ..

echo "arm64 bundle done: $DOWNLOAD_DIR/wekan-$1-arm64.zip"
echo "Upload it to the GitHub release (v$1) so snap/Docker builds can fetch it from upstream."
