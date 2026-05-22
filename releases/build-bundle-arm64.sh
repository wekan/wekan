#!/bin/bash
set -euo pipefail

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan new version number:"
    echo "  ./build.sh 9.17"
    exit 1
fi


git pull
cd .build
zip -r wekan-$1-arm64.zip bundle
scp wekan-$1-arm64.zip wekan@192.168.1.47:/home/wekan/Lataukset/
cd ..
