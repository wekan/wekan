#!/bin/bash

# Release script for wekan.

# 1) Check that there is only one parameter
#    of Wekan version number:

if [ $# -ne 2 ]
  then
    echo "Syntax with Wekan old and new version number:"
    echo "  ./release.sh 9.16 9.17"
    exit 1
fi

# 2) Commit and push version number changes
cd ~/repos/wekan

~/repos/wekan/releases/version.sh $1 $2

~/repos/wekan/releases/release-bundle.sh $2

git add --all
git add package-lock.json
git commit -m "v$2"
git push

# 3) Add release tag
~/repos/wekan/releases/add-tag.sh v$2

# 4) Push to repo
git push

# 5) Build Bundle

# 6) Build Sandstorm
#~/repos/wekan/releases/release-sandstorm.sh $2

# Build Snap
#./release-snap.sh $2
