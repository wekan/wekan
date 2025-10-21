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

# Remove dots from version numbers for sandstorm-pkgdef.capnp
OLD_VERSION_NO_DOTS=$(echo "$1" | tr -d '.')
NEW_VERSION_NO_DOTS=$(echo "$2" | tr -d '.')

# Update all files except sandstorm-pkgdef.capnp with regular version format
sed -i "s|$1|$2|g" package.json package-lock.json snapcraft.yaml docs/Platforms/Propietary/Windows/Offline.md Dockerfile Stackerfile.yml

# Update sandstorm-pkgdef.capnp with version format without dots
sed -i "s|$OLD_VERSION_NO_DOTS|$NEW_VERSION_NO_DOTS|g" sandstorm-pkgdef.capnp
