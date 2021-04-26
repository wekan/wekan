#!/bin/bash

# Release script for wekan.

# 1) Check that there is only one parameter
#    of Wekan version number:

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./release.sh 5.10"
    exit 1
fi

# 2) Commit and push version number changes
cd ~/repos/wekan
git add --all
git commit -m "v$1"
git push

# 3) Add release tag
~/repos/wekan/releases/add-tag.sh v$1

# 4) Push to repo
git push

# 5) Build Bundle
~/repos/wekan/releases/release-bundle.sh $1

# 6) Build Sandstorm
~/repos/wekan/releases/release-sandstorm.sh $1

# Build Snap
#./release-snap.sh $1
