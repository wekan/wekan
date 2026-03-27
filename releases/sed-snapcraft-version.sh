#!/bin/bash

# Update WeKan version at snapcraft.yaml

# 1) Check that there is 2 parameters
#    of Wekan version number:

if [ $# -ne 2 ]; then
  echo "Syntax with Wekan version number:"
  echo "  ./releases/sed-snapcraft-version.sh 7.10 7.11"
  exit 1
fi

sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

sedi "s|$1|$2|g" snapcraft.yaml docs/Platforms/Propietary/Windows/Offline.md
