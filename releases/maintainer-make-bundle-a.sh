#!/bin/bash

# This script is only for Wekan maintainer to
# convert x64 bundle to arm64 bundle.

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./maintainer-make-bundle-a.sh 5.10"
    exit 1
fi

sudo apt -y install g++ build-essential
sudo npm -g install node-gyp
rm -rf bundle
#rm wekan-$1.zip
#wget https://releases.wekan.team/wekan-$1.zip
unzip wekan-$1.zip
cd bundle/programs/server
chmod u+w *.json
cd node_modules/fibers
node build.js
cd ../../../..
find . -type d -name '*-garbage*' | xargs rm -rf
find . -name '*phantom*' | xargs rm -rf
find . -name '.*.swp' | xargs rm -f
find . -name '*.swp' | xargs rm -f
cd ..
zip -r wekan-$1-arm64.zip bundle
