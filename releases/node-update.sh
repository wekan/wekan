#!/bin/bash

# Update node version.

# 1) Check that there is only one parameter
#    of Wekan version number:

if [ $# -ne 2 ]
  then
    echo "Syntax with Node old and new version number:"
    echo "  ./node-update.sh 12.21.0 12.22.0"
    exit 1
fi

# With replacing longer strings than only version number,
# trying to make sure only Node.js version is updated.

echo "1) Updating Snap node"
sed -i 's|node-engine: $1|node-engine: $2|g'   snapcraft.yaml
sed -i 's|node-engine: $1|node-engine: $2|g'   .future-snap/snapcraft.yaml
sed -i 's|node-engine: $1|node-engine: $2|g'   .future-snap/broken-snapcraft.yaml

echo "2) Updating Docker node"
sed -i 's|NODE_VERSION=v$1|NODE_VERSION=v$2|g' Dockerfile
sed -i 's|NODE_VERSION=v$1|NODE_VERSION=v$2|g' Dockerfile.arm64v8
sed -i 's|NODE_VERSION=v$1|NODE_VERSION=v$2|g' .devcontainer/Dockerfile

echo "3) Updating Rebuild scripts..."
sed -i 's|sudo n $1|sudo n $2|g'   rebuild-wekan.sh
sed -i 's|nodejs.org/dist/v$1|nodejs.org/dist/v$2|g' rebuild-wekan.bat
sed -i 's|node-v$1|node-v$2|g' rebuild-wekan.bat

echo "4) Updating Stacksmith"
sed -i 's|$1|$2|g'   stacksmith/user-scripts/build.sh

echo "5) Updating Travis"
sed -i 's|$1|$2|g'   .travis.yml

echo "6) Adding changes to be committed."
git add snapcraft.yaml .future-snap/snapcraft.yaml .future-snap/broken-snapcraft.yaml \
Dockerfile Dockerfile.arm64v8 .devcontainer/Dockerfile rebuild-wekan.sh \
rebuild-wekan.bat stacksmith/user-scripts/build.sh

echo "7) Commit changes and push to GitHub"
git commit -n -m "Updated to Node.js v$2. Thanks to Node.js developers."
git push

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

if [[ -f "$SANDSTORM_NODE" ]]; then
  echo "9) Installing local Sandstorm develoment version"
  ~/repos/wekan/releases/install-sandstorm.sh
else
  echo "9) Local Sandstorm is already installed"
fi

SANDSTORM_NODE_VERSION=$($SANDSTORM_NODE -v)
PROJECTS_ARCHIVE=~/projects.7z

# If installed Sandstorm node is not newest version
if [ $SANDSTORM_NODE != v$2 ]; then
  echo "10) Copy previously updated local node to Sandstorm node"
  cp /usr/local/bin/node ~/projects/meteor-spk/meteor-spk-0.5.1/meteor-spk.deps/bin/
  echo "11) Install 7zip"
  sudo apt-get -y install p7zip-full
  # If projects.7z exists, delete it
  if [[ -f "$PROJECTS_ARCHIVE" ]] then;
    echo "12) Deleting existing project.7z archive"
    rm $PROJECTS_ARCHIVE
  else
   echo "12) There is no existin project.7z archive"
  fi
  echo "13) Archive projects.7z directory"
  7z a projects.7z projects
  echo "14) Upload projects.7z archive to webserver"
  scp projects.7z x2:/var/snap/wekan/common/releases.wekan.team/meteor-spk/
fi

echo "Done."
