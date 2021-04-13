#!/bin/bash

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./ln.sh 5.10"
    exit 1
fi

echo "Release ln: x64"
cd releases.wekan.team
rm wekan-latest-x64.zip
ln -s wekan-$1.zip wekan-latest-x64.zip
cd ..

echo "Release ln: arm64"
cd releases.wekan.team/raspi3
rm wekan-latest-arm64.zip
ln -s wekan-$1.zip wekan-latest-arm64.zip
cd ../..

echo "Release ln: s390x"
cd releases.wekan.team/s390x
rm wekan-latest-s390x.zip
ln -s wekan-$1.zip wekan-latest-s390x.zip
cd ../..

echo "Release ln: ppc64le"
cd releases.wekan.team/ppc64le
rm wekan-latest-ppc64le.zip
ln -s wekan-$1.zip wekan-latest-ppc64le.zip
cd ../..
