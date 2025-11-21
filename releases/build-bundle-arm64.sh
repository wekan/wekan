#!/bin/bash

# This script is only for Wekan maintainer to
# convert x64 bundle to arm64 bundle.

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./maintainer-make-bundle-a.sh 5.10"
    exit 1
fi

sudo apt -y install g++ build-essential p7zip-full npm
sudo npm -g install n
# Building bundle works with Node.js 14.21.3 .
# Running works also with 14.21.4, many architectures at https://github.com/wekan/node-v14-esm/releases/tag/v14.21.4
sudo n 14.21.3
sudo npm -g uninstall node-pre-gyp
sudo npm -g install @mapbox/node-pre-gyp
rm -rf bundle
rm wekan-$1-arm64.zip
rm wekan-$1.zip
wget https://github.com/wekan/wekan/releases/download/v$1/wekan-$1-amd64.zip
7z x wekan-$1-arm64.zip

# Get working fibers and bcrypt from previous WeKan v7.93 https://github.com/wekan/wekan/releases/tag/v7.93
wget https://github.com/wekan/wekan/releases/download/v7.93/wekan-7.93-arm64.zip
mkdir 7.93
cd 7.93
7z x ../wekan-7.93-arm64.zip
cd ..

#wget https://releases.wekan.team/wekan-$1.zip
#7z x wekan-$1-amd64.zip

#(cd bundle/programs/server && chmod u+w *.json && cd node_modules/fibers && node build.js)
(cd bundle/programs/server && chmod u+w *.json)
# && cd node_modules/fibers && node build.js)
#cd ../../../..
(cd bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules && rm -rf bcrypt)
(cp -pR 7.93/bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/)

# Requires building from source https://github.com/meteor/meteor/issues/11682
#(cd bundle/programs/server/npm/node_modules/meteor/accounts-password && npm rebuild --build-from-source)

cd bundle
find . -type d -name '*-garbage*' | xargs rm -rf
find . -name '*phantom*' | xargs rm -rf
find . -name '.*.swp' | xargs rm -f
find . -name '*.swp' | xargs rm -f
cd ..

7z a wekan-$1-arm64.zip bundle

#sudo snap start juju-db

#./start-wekan.sh
