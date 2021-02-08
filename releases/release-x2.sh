#!/bin/bash

## Syntax: ./release.sh oldversion newversion
## Example: ./release.sh 3.87 3.88

echo "Release: x64"
cd releases.wekan.team
mv wekan-$1.zip /data2/old-releases/
sha256sum wekan-$2.zip >> SHA256SUMS.txt
mv SHA256SUMS.txt ../x64-SHA256SUMS.txt
cat ../x64-SHA256SUMS.txt | grep -v wekan-$1.zip > SHA256SUMS.txt
cd ..

echo "Release: arm64"
cd releases.wekan.team/raspi3
mv wekan-$1-arm64.zip /data2/old-releases/raspi3/
sha256sum wekan-$2-arm64.zip >> SHA256SUMS.txt
mv SHA256SUMS.txt ../../arm64-SHA256SUMS.txt
cat ../../arm64-SHA256SUMS.txt | grep -v wekan-$1-arm64.zip > SHA256SUMS.txt
cd ../..

echo "Release: s390x"
cd releases.wekan.team/s390x
mv wekan-$1-s390x.zip /data2/old-releases/s390x/
sha256sum wekan-$2-s390x.zip >> SHA256SUMS.txt
mv SHA256SUMS.txt ../../s390x-SHA256SUMS.txt
cat ../../s390x-SHA256SUMS.txt | grep -v wekan-$1-s390x.zip > SHA256SUMS.txt
cd ../..

echo "Release: ppc64le"
cd releases.wekan.team/ppc64le
mkdir -p /data2/old-releases/ppc64le
mv wekan-$1-ppc64le.zip /data2/old-releases/ppc64le/
sha256sum wekan-$2-ppc64le.zip >> SHA256SUMS.txt
mv SHA256SUMS.txt ../../ppc64le-SHA256SUMS.txt
cat ../../ppc64le-SHA256SUMS.txt | grep -v wekan-$1-ppc64le.zip > SHA256SUMS.txt
cd ../..
