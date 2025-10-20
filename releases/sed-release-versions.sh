#!/bin/bash

# Release script for wekan versions.

# 1) Check that there is only 2 parameters
#    of Wekan version number:

if [ $# -ne 2 ]
  then
    echo "Syntax with Wekan current-version release-new-version:"
    echo "  ./release.sh 7.20 7.21"
    exit 1
fi

sed -i 's|$1|$2|g' package.json package-lock.json snapcraft.yaml docs/Platforms/Propietary/Windows/Offline.md Dockerfile Stackerfile.yml sandstorm-pkgdef.capnp
