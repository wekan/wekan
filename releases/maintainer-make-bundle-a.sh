#!/bin/bash

# This script is only for Wekan maintainer to
# convert x64 bundle to arm64 bundle.

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
npm uninstall fibers node-gyp node-pre-gyp
npm install node-gyp@5.0.4 node-pre-gyp fibers
npm install
npm uninstall fibers node-gyp node-pre-gyp
npm install node-pre-gyp
npm install fibers
npm install node-gyp@5.0.4

cd /home/wekan/repos/bundle
find . -type d -name '*-garbage*' | xargs rm -rf
find . -name '*phantom*' | xargs rm -rf
find . -name '.*.swp' | xargs rm -f
find . -name '*.swp' | xargs rm -f

cd /home/wekan/repos

zip -r wekan-$1-arm64.zip bundle
