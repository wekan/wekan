#!/bin/bash
if [ -n "${ZSH_VERSION:-}" ]; then exec /bin/bash "$0" "$@"; fi

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/ensure-tools.sh"
if [ "$(_et_os)" = macos ]; then
  _et_brew_ensure
  command -v volta >/dev/null 2>&1 || brew install volta
else
  ensure_tools curl
  if ! command -v volta >/dev/null 2>&1; then
    echo "volta not found. Installing Volta with its official installer..."
    curl -fsSL https://get.volta.sh | bash
  fi
  export VOLTA_HOME="${VOLTA_HOME:-$HOME/.volta}"
  export PATH="$VOLTA_HOME/bin:$PATH"
fi
if [ $NODE_VERSION != v$2 ]; then
  echo "8) Upgrading installed node to newest version"
  volta install node@12
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
  cp ~/.volta/bin/node ~/projects/meteor-spk/meteor-spk-0.5.1/meteor-spk.deps/bin/
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
