#!/bin/bash

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./release.sh 9.10"
    exit 1
fi

sudo apt-get -y install snapd
sudo snap install helm --classic
/snap/bin/helm repo add mongo https://groundhog2k.github.io/helm-charts/
/snap/bin/helm dependency update
/snap/bin/helm dependency build
cd ..
tar -cvzf wekan-$1.0.tgz wekan
mv wekan-$1.0.tgz charts/
echo "Update release sha256sum to release list."
