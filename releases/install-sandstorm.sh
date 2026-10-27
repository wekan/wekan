#!/bin/bash
if [ -n "${ZSH_VERSION:-}" ]; then exec /bin/bash "$0" "$@"; fi
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp

echo "INSTALLING WEKAN SANDSTORM VERSION RELATED FILES:"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# The checkout is wherever this script is: ~/repos/wekan on Linux,
# ~/Documents/repos/wekan on macOS, Downloads\repos\wekan on Windows.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
. "$SCRIPT_DIR/ensure-tools.sh"
ensure_archive_tools
cd "$WEKAN_TOOLS_DIR"
wget https://releases.wekan.team/dev/meteor-spk/projects.7z
7z x projects.7z
rm projects.7z
# meteor-spk is in .tools/projects/meteor-spk now: on PATH for this script,
# and found there by sandstorm-slim-spk.sh. No shell rc file is edited.
export PATH="$PATH:$WEKAN_METEOR_SPK_DIR/meteor-spk-0.6.0"
echo "INSTALL DEV VERSION OF SANDSTORM:"
curl https://install.sandstorm.io | bash
cd "$REPO_DIR"
