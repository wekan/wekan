#!/bin/bash
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp
# The checkout is wherever this script is: ~/repos/wekan on Linux,
# ~/Documents/repos/wekan on macOS, Downloads\repos\wekan on Windows.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
## After building bundles, copy and rename for uploading to releases

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./rel.sh 6.61"
    exit 1
fi


mkdir -p "$TMPDIR/rel$1"
mv "$REPO_DIR"/wekan-$1*.zip "$TMPDIR/rel$1/"
mv "$TMPDIR"/wekan-$1*.zip "$TMPDIR/rel$1/"
mv "$REPO_DIR"/.build/wekan-$1-amd64.zip "$TMPDIR/rel$1/wekan-$1-amd64.zip"
