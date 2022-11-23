#!/bin/bash

if [ $# -ne 2 ]
  then
    echo "Syntax with Wekan old and new version number:"
    echo "  ./release-x2.sh 5.10 5.11"
    exit 1
fi

echo "Release: x64"
cd /var/websites/releases.wekan.team/public
mkdir -p /var/websites/old-releases
mv wekan-$1.zip /var/websites/old-releases/
#mv SHA256SUMS.txt x64-SHA256SUMS.txt
#cat x64-SHA256SUMS.txt | grep -v wekan-$1.zip > SHA256SUMS.txt
#rm x64-SHA256SUMS.txt
cp wekan-$2.zip wekan-latest-x64.zip
sha256sum wekan-*.zip > SHA256SUMS.txt

echo "Release: x64 windows"
cd /var/websites/releases.wekan.team/public/windows
mkdir -p /var/websites/old-releases/windows
mv wekan-$1-amd64-windows.zip /var/websites/old-releases/windows/
#sha256sum wekan-$2-amd64-windows.zip >> SHA256SUMS.txt
#mv SHA256SUMS.txt x64-windows-SHA256SUMS.txt
#cat x64-windows-SHA256SUMS.txt | grep -v wekan-$1-amd64-windows.zip > SHA256SUMS.txt
#rm x64-windows-SHA256SUMS.txt
cp wekan-$2-amd64-windows.zip wekan-latest-amd64-windows.zip
sha256sum wekan-*.zip > SHA256SUMS.txt

echo "Release: arm64"
cd /var/websites/releases.wekan.team/public/raspi3
mkdir -p /var/websites/old-releases/raspi3/
mv wekan-$1-arm64.zip /var/websites/old-releases/raspi3/
#sha256sum wekan-$2-arm64.zip >> SHA256SUMS.txt
#mv SHA256SUMS.txt arm64-SHA256SUMS.txt
#cat arm64-SHA256SUMS.txt | grep -v wekan-$1-arm64.zip > SHA256SUMS.txt
#rm arm64-SHA256SUMS.txt
cp wekan-$2-arm64.zip wekan-latest-arm64.zip
sha256sum wekan-*.zip > SHA256SUMS.txt

echo "Release: s390x"
cd /var/websites/releases.wekan.team/public/s390x
mkdir -p /var/websites/old-releases/s390x
mv wekan-$1-s390x.zip /var/websites/old-releases/s390x/
#sha256sum wekan-$2-s390x.zip >> SHA256SUMS.txt
#mv SHA256SUMS.txt s390x-SHA256SUMS.txt
#cat s390x-SHA256SUMS.txt | grep -v wekan-$1-s390x.zip > SHA256SUMS.txt
#rm s390x-SHA256SUMS.txt
cp wekan-$2-s390x.zip wekan-latest-s390x.zip
sha256sum wekan-*.zip > SHA256SUMS.txt

# OpenPower MiniCloud is discontinued, no ppc64le build server
#echo "Release: ppc64le"
#cd /var/websites/releases.wekan.team/public/ppc64le
#mkdir -p /var/websites/old-releases/ppc64le
#mv wekan-$1-ppc64le.zip /var/websites/old-releases/ppc64le/
#sha256sum wekan-$2-ppc64le.zip >> SHA256SUMS.txt
#mv SHA256SUMS.txt ppc64le-SHA256SUMS.txt
#cat ppc64le-SHA256SUMS.txt | grep -v wekan-$1-ppc64le.zip > SHA256SUMS.txt
#rm ppc64le-SHA256SUMS.txt
#cp wekan-$2-ppc64le.zip wekan-latest-ppc64le.zip

cd /var/websites
