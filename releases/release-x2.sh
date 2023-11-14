#!/bin/bash

if [ $# -ne 2 ]
  then
    echo "Syntax with Wekan old and new version number:"
    echo "  ./release-x2.sh 5.10 5.11"
    exit 1
fi

echo "Release: x64"
cd /data/websites/releases.wekan.team
mkdir -p /data/websites/old-releases
mv wekan-$1.zip /data/websites/old-releases/
mv wekan-$1-amd64.zip /data/websites/old-releases/
cp wekan-$2-amd64.zip wekan-latest-amd64.zip
cp wekan-$2-amd64.zip wekan-$2.zip
sha256sum wekan-*.zip > SHA256SUMS.txt

echo "Release: x64 windows"
cd /data/websites/releases.wekan.team/windows
mkdir -p /data/websites/old-releases/windows
mv wekan-$1-amd64-windows.zip /data/websites/old-releases/windows/
cp wekan-$2-amd64-windows.zip wekan-latest-amd64-windows.zip
sha256sum wekan-*.zip > SHA256SUMS.txt

echo "Release: arm64"
cd /data/websites/releases.wekan.team/raspi3
mkdir -p /data/websites/old-releases/raspi3/
mv wekan-$1-arm64.zip /data/websites/old-releases/raspi3/
cp wekan-$2-arm64.zip wekan-latest-arm64.zip
sha256sum wekan-*.zip > SHA256SUMS.txt

echo "Release: s390x"
cd /data/websites/releases.wekan.team/s390x
mkdir -p /data/websites/old-releases/s390x
mv wekan-$1-s390x.zip /data/websites/old-releases/s390x/
cp wekan-$2-s390x.zip wekan-latest-s390x.zip
sha256sum wekan-*.zip > SHA256SUMS.txt

# OpenPower MiniCloud is discontinued, no ppc64le build server
#echo "Release: ppc64le"
#cd /data/websites/releases.wekan.team/ppc64le
#mkdir -p /data/websites/old-releases/ppc64le
#mv wekan-$1-ppc64le.zip /data/websites/old-releases/ppc64le/
#sha256sum wekan-$2-ppc64le.zip >> SHA256SUMS.txt
#mv SHA256SUMS.txt ppc64le-SHA256SUMS.txt
#cat ppc64le-SHA256SUMS.txt | grep -v wekan-$1-ppc64le.zip > SHA256SUMS.txt
#rm ppc64le-SHA256SUMS.txt
#cp wekan-$2-ppc64le.zip wekan-latest-ppc64le.zip

cd /data/websites
