#!/usr/bin/env bash
# Temporary opt-in port of meteor/meteor#14751; normal builds never use it.
set -euo pipefail
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
  [ "$release" = 3.6-rc.0 ] || { echo "Port the Bun patch to Meteor $release before building"; exit 1; }
  [ "$(git -C "$meteor_dir" rev-parse HEAD)" = cc8cf7d21d24da5f4a4fd456527225bc5ce0e721 ] || exit 1
  git -C "$meteor_dir" apply --check "$root/releases/bun/meteor-3.6-rc.0.patch"
  git -C "$meteor_dir" apply "$root/releases/bun/meteor-3.6-rc.0.patch"
fi
printf '%s\n' "$meteor_dir" >> "$GITHUB_PATH"
