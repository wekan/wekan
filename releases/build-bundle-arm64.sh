#!/bin/bash
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan new version number:"
    echo "  ./build.sh 9.17"
    exit 1
fi


# Downloads and release zips stay in .tools/tmp (releases/tools-env.sh), not
# in ~/Downloads or ~/Lataukset.
DOWNLOAD_DIR="${DOWNLOAD_DIR:-$WEKAN_DOWNLOADS}"

git pull
cd .build
zip -r wekan-$1-arm64.zip bundle
mkdir -p "$DOWNLOAD_DIR"
mv -f "wekan-$1-arm64.zip" "$DOWNLOAD_DIR/"
cd ..

echo "arm64 bundle done: $DOWNLOAD_DIR/wekan-$1-arm64.zip"
echo "Upload it to the GitHub release (v$1) so snap/Docker builds can fetch it from upstream."
