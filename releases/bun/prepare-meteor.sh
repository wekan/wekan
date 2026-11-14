#!/usr/bin/env bash
# Temporary opt-in port of meteor/meteor#14751; normal builds never use it.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/../tools-env.sh"   # temporary files and downloads go to .tools/tmp
root=$(pwd)
export TMPDIR="$root/.tools/tmp"
mkdir -p "$TMPDIR"
release=$(sed -n 's/^METEOR@//p' .meteor/release)
[[ "$release" =~ ^[0-9]+\.[0-9]+([.][0-9]+)?(-[a-z]+[.][0-9]+)?$ ]] || { echo 'Invalid Meteor release'; exit 1; }
meteor_dir="$root/.tools/meteor-bun"
[ ! -e "$meteor_dir/.git" ] || { echo 'Use a fresh Meteor checkout'; exit 1; }
git clone --depth 1 --branch "release/METEOR@$release" https://github.com/meteor/meteor.git "$meteor_dir"
if [ ! -f "$meteor_dir/tools/static-assets/server/esm-loader.mjs" ]; then
  # Do not silently downgrade core packages to the PR's older 3.5 base.
  # The 3.6 port applies unchanged to these releases, each pinned to its commit.
  case "$release" in
    3.6) commit=e730097ce42a0dbc4c134aeb1706147b02112844 ;;
    3.6.1) commit=eaf134973529396b660078b705b9fa50a4747fd5 ;;
    *) echo "Port the Bun patch to Meteor $release before building"; exit 1 ;;
  esac
  [ "$(git -C "$meteor_dir" rev-parse HEAD)" = "$commit" ] || exit 1
  git -C "$meteor_dir" apply --check "$root/releases/bun/meteor-3.6.patch"
  git -C "$meteor_dir" apply "$root/releases/bun/meteor-3.6.patch"
fi
printf '%s\n' "$meteor_dir" >> "$GITHUB_PATH"
