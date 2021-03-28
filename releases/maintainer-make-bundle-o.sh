#!/bin/bash

# This script is only for Wekan maintainer to
# convert x64 bundle to ppc64le bundle.

# 1) Check that there is only one parameter
#    of Wekan version number

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./maintainer-make-bundle-o.sh 5.10"
    exit 1
fi

# 2) Build bundle

cd /home/ubuntu
rm -rf bundle
#wget https://releases.wekan.team/wekan-$1.zip
unzip wekan-$1.zip
cd /home/ubuntu/bundle/programs/server
chmod u+w *.json
cd /home/ubuntu/bundle/programs/server/node_modules/fibers
node build.js
cd /home/ubuntu
#cp -pR /home/ubuntu/node-fibers/bin/linux-ppc64-72-glibc bundle/programs/server/node_modules/fibers/bin/
cd bundle
find . -type d -name '*-garbage*' | xargs rm -rf
find . -name '*phantom*' | xargs rm -rf
find . -name '.*.swp' | xargs rm -f
find . -name '*.swp' | xargs rm -f
cd ..
zip -r wekan-$1-ppc64le.zip bundle
