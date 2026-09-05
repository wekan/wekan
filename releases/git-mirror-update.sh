#!/bin/bash

set -euo pipefail

# Resolve the checkout from this script instead of assuming Linux's ~/repos path.
# This works from both ~/repos/wekan on Linux and ~/Documents/repos/wekan on macOS,
# including when the script is started from some other working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEKAN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TOOLS_DIR="$WEKAN_ROOT/.tools"

mirror() {
  local name="$1"
  local clone_url="$2"
  local mirror_dir="$TOOLS_DIR/wekan-$name"

  mkdir -p "$TOOLS_DIR"
  if [ ! -d "$mirror_dir/.git" ]; then
    git -C "$TOOLS_DIR" clone "$clone_url" "wekan-$name"
  fi

  if ! git -C "$mirror_dir" remote get-url upstream >/dev/null 2>&1; then
    git -C "$mirror_dir" remote add upstream https://github.com/wekan/wekan
  fi

  git -C "$mirror_dir" pull
  git -C "$mirror_dir" fetch upstream
  git -C "$mirror_dir" merge upstream/main
  git -C "$mirror_dir" push
}

mirror "gitlab" "git@gitlab.com:wekan/wekan"
mirror "codeberg" "git@codeberg.org:wekan/wekan"
