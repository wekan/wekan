#!/bin/bash

echo "Note: If you use other locale than en_US.UTF-8 , you need to additionally install en_US.UTF-8"
echo "      with 'sudo dpkg-reconfigure locales' , so that MongoDB works correctly."
echo "      You can still use any other locale as your main locale."

echo "Building Wekan."
sudo chown -R $(id -u):$(id -g) $HOME/.npm $HOME/.meteor
rm -rf node_modules
meteor npm install
rm -rf .build
METEOR_PROFILE=100 meteor build .build --directory
cp -f fix-download-unicode/cfs_access-point.txt .build/bundle/programs/server/packages/cfs_access-point.js
cd .build/bundle/programs/server
rm -rf node_modules
meteor npm install
cd ../../../..
