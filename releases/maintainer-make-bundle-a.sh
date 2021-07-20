#!/bin/bash

# This script is only for Wekan maintainer to
# convert x64 bundle to arm64 bundle.

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./maintainer-make-bundle-a.sh 5.10"
    exit 1
fi

cd ~/repos
rm -rf bundle

unzip wekan-$1.zip

sudo chown wekan:wekan bundle -R
sudo apt -y install libcurl4-openssl-dev

sudo rm -f /home/wekan/repos/bundle/programs/server/node_modules/.bin/node-pre-gyp
sudo rm -f /home/wekan/repos/bundle/programs/server/node_modules/.bin/node-gyp
sudo rm -rf /home/wekan/repos/bundle/programs/server/npm/node_modules/meteor/lucasantoniassi_accounts-lockout/node_modules/.phantomjs-prebuilt-garbage-*
sudo rm -rf /home/wekan/repos/bundle/programs/server/node_modules/.bin/*
sudo rm -rf /home/wekan/repos/bundle/programs/server/node_modules/node-pre-gyp/node_modules/.bin/*
sudo rm -rf /home/wekan/repos/bundle/programs/server/node_modules/node-gyp/node_modules/.bin/*
sudo rm -rf /home/wekan/repos/bundle/programs/server/npm/node_modules/meteor/ostrio_files/node_modules/request-libcurl/.node_modules-garbage*

cd bundle/programs/server
chmod u+w *.json
npm uninstall fibers node-gyp node-pre-gyp @mapbox/node-pre-gyp
npm install
npm install node-gyp
npm install @mapbox/node-pre-gyp
npm install fibers

cd /home/wekan/repos/bundle
find . -type d -name '*-garbage*' | xargs rm -rf
find . -name '*phantom*' | xargs rm -rf
find . -name '.*.swp' | xargs rm -f
find . -name '*.swp' | xargs rm -f

cd /home/wekan/repos

zip -r wekan-$1-arm64.zip bundle
