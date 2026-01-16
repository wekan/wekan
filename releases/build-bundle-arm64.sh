#!/bin/bash

# This script is only for Wekan maintainer to
# convert x64 bundle to arm64 bundle.

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./maintainer-make-bundle-a.sh 5.10"
    exit 1
fi

# Install deps
sudo apt -y install g++ build-essential p7zip-full
sudo npm -g uninstall node-pre-gyp
sudo npm -g install @mapbox/node-pre-gyp
# Remove old files
rm -rf bundle 7.93
rm wekan-$1-arm64.zip wekan-7.93-arm64.zip

# Download newest WeKan, and WeKan v7.93 that has working fibers and bcrypt
wget --no-check-certificate https://github.com/wekan/wekan/releases/download/v$1/wekan-$1-amd64.zip
wget --no-check-certificate https://github.com/wekan/wekan/releases/download/v7.93/wekan-7.93-arm64.zip

# Unarchive newest WeKan and WeKan v7.93
7z x wekan-$1-amd64.zip
(mkdir 7.93 && cd 7.93 && 7z x ../wekan-7.93-arm64.zip)

# Add working bcrypt
rm -rf ~/repos/wekan/bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt
cp -pR ~/repos/wekan/7.93/bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt \
~/repos/wekan/bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/

# Add working fibers
rm -rf ~/repos/wekan/bundle/programs/server/node_modules/fibers
cp -pR ~/repos/wekan/7.93/bundle/programs/server/node_modules/fibers \
~/repos/wekan/bundle/programs/server/node_modules/

##(cd bundle/programs/server && chmod u+w *.json && cd node_modules/fibers && node build.js)
#cd ../../../..
#(cd bundle/programs/server/npm/node_modules/meteor/accounts-password && npm remove bcrypt && npm install bcrypt)

# Requires building from source https://github.com/meteor/meteor/issues/11682
##(cd bundle/programs/server/npm/node_modules/meteor/accounts-password && npm rebuild --build-from-source)

# Remove temporary files
cd bundle
find . -type d -name '*-garbage*' | xargs rm -rf
find . -name '*phantom*' | xargs rm -rf
find . -name '.*.swp' | xargs rm -f
find . -name '*.swp' | xargs rm -f
cd ..

# Make newest WeKan bundle for Linux arm64
7z a wekan-$1-arm64.zip bundle

#sudo snap start juju-db

#./start-wekan.sh
