#!/usr/bin/env bash
# Makes a wekan-ondra snap out of a release's wekan snap.
#
#   releases/snap-rename.sh wekan_<version>_<arch>.snap <new-name> <title> <out-dir>
#
# writes <out-dir>/<new-name>_<version>_<arch>.snap.
#
# The variants ARE wekan under another snap name: release-all.yml's
# snap-variants job builds them from the release tag with only `name:` and
# `title:` of snapcraft.yaml changed. So a variant a release is missing - one
# its snap-variants job did not attach (every release before v13.21), or an
# architecture that job does not build - is the release's own wekan snap with
# those two lines of meta/snap.yaml changed, byte for byte the same program.
# "Release all missing" uses this to fill them in.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files go to .tools/tmp

if [ "$#" -ne 4 ]; then
  echo "Usage: $0 wekan_<version>_<arch>.snap <new-name> <title> <out-dir>" >&2
  exit 2
fi
source_snap=$1
new_name=$2
title=$3
out_dir=$4

case "$new_name" in
  wekan-ondra) ;;
  *) echo "::error::'$new_name' is not one of WeKan's variant snaps (wekan-ondra)." >&2; exit 2 ;;
esac
case "$title" in
  *[!A-Za-z0-9\ ._-]*|'') echo "::error::'$title' is not a plain snap title." >&2; exit 2 ;;
esac
base=$(basename "$source_snap" .snap)
case "$base" in
  wekan_*_*) ;;
  *) echo "::error::$source_snap is not a wekan_<version>_<arch>.snap." >&2; exit 2 ;;
esac
if [ ! -s "$source_snap" ]; then
  echo "::error::No non-empty snap file: $source_snap" >&2
  exit 2
fi
rest=${base#wekan_}
out="$out_dir/${new_name}_${rest}.snap"

work=$(mktemp -d "${TMPDIR:-/tmp}/snap-rename.XXXXXX")
trap 'rm -rf "$work"' EXIT
unsquashfs -no-progress -quiet -d "$work/root" "$source_snap" >/dev/null
yaml="$work/root/meta/snap.yaml"
if ! grep -qx 'name: wekan' "$yaml"; then
  echo "::error::$source_snap is not the wekan snap: meta/snap.yaml says $(grep -m1 '^name:' "$yaml" || echo 'no name')." >&2
  exit 1
fi
# -i.bak: BSD sed too (tests/macosShellPortability.test.cjs).
sed -i.bak "s/^name: wekan$/name: ${new_name}/" "$yaml"
if grep -q '^title:' "$yaml"; then
  sed -i.bak "s/^title: .*/title: ${title}/" "$yaml"
fi
rm -f "$yaml.bak"
grep -qx "name: ${new_name}" "$yaml" || { echo "::error::meta/snap.yaml was not renamed to ${new_name}." >&2; exit 1; }

mkdir -p "$out_dir"
rm -f "$out"
# The same squashfs a snap is: what `snap pack` writes (xz, no fragments, all
# files owned by root). `snap pack` itself where snapd is there, as on every
# GitHub runner.
if command -v snap >/dev/null 2>&1 && snap pack --help >/dev/null 2>&1; then
  packed=$(snap pack "$work/root" "$work" | sed -n 's/^built: //p')
  mv "$work/$(basename "$packed")" "$out"
else
  mksquashfs "$work/root" "$out" -noappend -comp xz -all-root -no-xattrs -no-fragments -no-progress -quiet >/dev/null
fi
echo "$out"
