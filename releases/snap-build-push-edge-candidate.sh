#!/bin/bash

if [ $# -ne 1 ]
  then
    echo "Use: snapcraft login"
    echo "Then use version number:"
    echo "  ./releases/snap-build-push-edge-candidate.sh 7.88"
    exit 1
fi

sudo apt -y install snapd
sudo systemctl enable snapd
sudo systemctl start snapd
sudo snap install snapcraft --classic
sudo snap install multipass
multipass launch --name ubu
snapcraft
snapcraft upload --release=candidate,edge wekan_$1_amd64.snap
