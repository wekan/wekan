#!/usr/bin/env bash
# Puts "What's new in WeKan v<version>" on a snap's Snap Store page.
#
#   releases/snap-listing-update.sh <wekan|wekan-ondra|wekan-gantt-gpl> <version> <CHANGELOG-big.md>
#
# Needs SNAPCRAFT_STORE_CREDENTIALS (SNAP_AUTH: its package_update covers the
# listing), snapcraft, mksquashfs, curl and node.
#
# The Snap Store has no API for a revision's own changelog - the dashboard's
# "Add changelog" is a web form and nothing else - so the release's In short
# paragraph goes on the LISTING, which `snapcraft upload-metadata` updates. The
# description comes from releases/snap-listing.mjs (What's new, then the
# listing text kept in releases/snap-listing/<name>.md).
#
# upload-metadata sends what a SNAP FILE's meta/snap.yaml and meta/gui/icon say
# - summary, description, title, license - and the icon. Everything but the
# description is therefore taken from the store's own listing, and the icon is
# the store's own icon, downloaded: from a release snap, the listing's title,
# summary and hand-uploaded icon would be replaced with snapcraft.yaml's, and
# with no icon at all upload-metadata REMOVES the listing's icon. So the snap
# given to it is a small one built here, holding only meta/.
#
# --force: the wekan listing was edited on the web, and without it the store
# refuses every field it calls a conflict. Nothing on the page is lost by it:
# the fields other than the description are sent back as the store has them.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files go to .tools/tmp

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <wekan|wekan-ondra|wekan-gantt-gpl> <version> <CHANGELOG-big.md>" >&2
  exit 2
fi
name=$1
version=$2
changelog=$3
case "$name" in wekan|wekan-ondra|wekan-gantt-gpl) ;; *) echo "::error::'$name' is not one of WeKan's snaps." >&2; exit 2 ;; esac
case "$version" in [0-9]*.[0-9]*) ;; *) echo "::error::'$version' is not a version like 13.30." >&2; exit 2 ;; esac
case "$version" in *[!0-9.]*) echo "::error::'$version' is not a version like 13.30." >&2; exit 2 ;; esac
[ -s "$changelog" ] || { echo "::error::No changelog file: $changelog" >&2; exit 2; }
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

work=$(mktemp -d "${TMPDIR:-/tmp}/snap-listing.XXXXXX")
trap 'rm -rf "$work"' EXIT

node "$here/snap-listing.mjs" "$name" "$version" "$changelog" > "$work/description.md"

curl -fsS --retry 3 --max-time 60 -H 'Snap-Device-Series: 16' \
  "https://api.snapcraft.io/v2/snaps/info/${name}?fields=title,summary,license,media" > "$work/listing.json"

mkdir -p "$work/root/meta/gui"
# The listing's own icon, so upload-metadata finds it unchanged.
icon_url=$(node -e '
  const m = (JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).snap.media || []).find(x => x.type === "icon");
  process.stdout.write(m ? m.url : "");' "$work/listing.json")
if [ -n "$icon_url" ]; then
  case "$icon_url" in
    *.svg) icon="$work/root/meta/gui/icon.svg" ;;
    *) icon="$work/root/meta/gui/icon.png" ;;
  esac
  curl -fsS --retry 3 --max-time 60 -o "$icon" "$icon_url"
else
  echo "::warning::$name has no icon on its listing; none is sent."
fi

# meta/snap.yaml as JSON, which is YAML too: no quoting rules to get wrong in a
# description full of colons, quotes and markdown.
node -e '
  const fs = require("fs");
  const [listing, description, out, name, version] = process.argv.slice(1);
  const snap = JSON.parse(fs.readFileSync(listing, "utf8")).snap;
  const yaml = { name, version, summary: snap.summary, title: snap.title, description: fs.readFileSync(description, "utf8") };
  if (snap.license) yaml.license = snap.license;
  fs.writeFileSync(out, JSON.stringify(yaml, null, 2) + "\n");
' "$work/listing.json" "$work/description.md" "$work/root/meta/snap.yaml" "$name" "$version"

mksquashfs "$work/root" "$work/${name}_${version}_listing.snap" -noappend -comp xz -all-root -no-xattrs -no-fragments -no-progress -quiet >/dev/null

if ! snapcraft upload-metadata --force "$work/${name}_${version}_listing.snap"; then
  echo "::error::The Snap Store did not take the $name listing for v$version. A 401/403 means SNAP_AUTH lacks package_update for $name: snapcraft export-login --snaps wekan,wekan-ondra,wekan-gantt-gpl --acls package_access,package_push,package_release,package_update snap-auth.txt" >&2
  exit 1
fi
echo "UPDATED the $name Snap Store page: What's new in WeKan v$version."
[ -z "${GITHUB_STEP_SUMMARY:-}" ] || echo "- UPDATED \`$name\` Snap Store page: What's new in WeKan v$version" >> "$GITHUB_STEP_SUMMARY"
