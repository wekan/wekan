#!/bin/bash

# This script is only for Wekan maintainer to
# convert x64 bundle to s390x bundle.

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./maintainer-make-bundle-s.sh 5.10"
    exit 1
fi

cd /home/linux1
rm -rf bundle
unzip wekan-$1.zip
cd /home/linux1/bundle/programs/server
chmod u+w *.json
cd /home/linux1/bundle/programs/server/node_modules/fibers
node build.js
cd /home/linux1
#cp -pR /home/linux1/node-fibers/bin/linux-s390x-83-glibc bundle/programs/server/node_modules/fibers/bin/
cd bundle
find . -type d -name '*-garbage*' | xargs rm -rf
find . -name '*phantom*' | xargs rm -rf
find . -name '.*.swp' | xargs rm -f
find . -name '*.swp' | xargs rm -f
cd ..
zip -r wekan-$1-s390x.zip bundle
