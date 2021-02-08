## Wekan release scripts

Release process, for example version 4.94:

1) Build x64 bundle and upload to x2/a/s/o:
===========================================
./release.sh 4.94


2) Build bundles at servers
===========================
arm64:
  ssh a
  ./maintainer-make-release-a.sh 4.94

s390x:
  ssh s
  ./maintainer-make-release-s.sh 4.94

openpower:
  ssh o
  ./maintainer-make-release-o.sh 4.94


3) Download bundles and upload to x2 releases:
==============================================
./releases/up.sh

4) At x2, do release:
=====================
ssh x2
cd /var/snap/wekan/common
./release-x2.sh 4.93 4.94


https://github.com/wekan/wekan-snap/wiki/Making-releases-from-source

https://github.com/wekan/wekan-maintainer/wiki/Building-Wekan-for-Sandstorm

