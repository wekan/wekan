#!/bin/bash

# Update node version.

# Check that there is only one parameter
# of Wekan version number:

if [ $# -ne 2 ]
  then
    echo "Syntax with Node old and new version number:"
    echo "  ./node-update-local.sh 12.21.0 12.22.0"
    exit 1
fi

NODE_VERSION=$(node -v)

# If installed node is not newest version
if [ $NODE_VERSION != v$2 ]; then
  echo "8) Upgrading installed node to newest version"
  sudo n $2
else
  echo "8) Installed node is already newest version"
fi

# If Sandstorm node does not exist
SANDSTORM_NODE=~/projects/meteor-spk/meteor-spk-0.5.1/meteor-spk.deps/bin/node

#if [[ -f "$SANDSTORM_NODE" ]]; then
#  echo "9) Installing local Sandstorm develoment version"
#  ~/repos/wekan/releases/install-sandstorm.sh
#else
#  echo "9) Local Sandstorm is already installed"
#fi

SANDSTORM_NODE_VERSION=$($SANDSTORM_NODE -v)
PROJECTS_ARCHIVE=~/projects.7z

# If installed Sandstorm node is not newest version
if [ $SANDSTORM_NODE != v$2 ]; then
  echo "9) Copy previously updated local node to Sandstorm node"
  cp /usr/local/bin/node ~/projects/meteor-spk/meteor-spk-0.5.1/meteor-spk.deps/bin/
#  echo "11) Install 7zip"
#  sudo apt-get -y install p7zip-full
#  # If projects.7z exists, delete it
#  if [[ -f "$PROJECTS_ARCHIVE" ]] then;
#    echo "12) Deleting existing project.7z archive"
#    rm $PROJECTS_ARCHIVE
#  else
#   echo "12) There is no existin project.7z archive"
#  fi
#  echo "13) Archive projects.7z directory"
#  7z a projects.7z projects
#  echo "14) Upload projects.7z archive to webserver"
#  scp projects.7z x2:/var/snap/wekan/common/releases.wekan.team/meteor-spk/
fi

echo "Done."
