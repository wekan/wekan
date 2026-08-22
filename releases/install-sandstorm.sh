#!/bin/bash
if [ -n "${ZSH_VERSION:-}" ]; then exec /bin/bash "$0" "$@"; fi

echo "INSTALLING WEKAN SANDSTORM VERSION RELATED FILES:"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/ensure-tools.sh"
ensure_archive_tools
cd ~
wget https://releases.wekan.team/dev/meteor-spk/projects.7z
7z x projects.7z
rm projects.7z
echo "export PATH=\$PATH:~/projects/meteor-spk/meteor-spk-0.6.0" >> ~/.bashrc
source ~/.bashrc
echo "INSTALL DEV VERSION OF SANDSTORM:"
curl https://install.sandstorm.io | bash
cd ~/repos/wekan
