#!/bin/bash

cd /home/wekan/app
rm -rf node_modules
/home/wekan/.meteor/meteor npm install
rm -rf .build
/home/wekan/.meteor/meteor build .build --directory
cp -f fix-download-unicode/cfs_access-point.txt .build/bundle/programs/server/packages/cfs_access-point.js
cd .build/bundle/programs/server
rm -rf node_modules
/home/wekan/.meteor/meteor npm install
cd /home/wekan/app
