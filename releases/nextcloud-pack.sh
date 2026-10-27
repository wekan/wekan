#!/usr/bin/env bash
#
# nextcloud-pack.sh - pack the Nextcloud ExApp directory as <app-id>/...
#
#   Usage: nextcloud-pack.sh <source dir> <app id> <archive.tar.gz>
#
# The Nextcloud App Store wants every member under one directory named after
# the app (releases/nextcloud-release.py verify_archive checks it). This used
# to be GNU tar's --transform "s,^\.$,<id>,;s,^\./,<id>/,", which bsdtar - the
# tar of macOS and the BSDs - does not have, so the release could not be packed
# or tested there. The source is copied under a staging <app-id>/ instead and
# that directory is packed: --exclude, -C and -czf are the same in both tars.
#
# Never packed: .git, .tools, .env, node_modules. COPYFILE_DISABLE keeps
# macOS's tar from adding ._* AppleDouble files for extended attributes.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp

if [ "$#" -ne 3 ]; then
	echo "Usage: $0 <source dir> <app id> <archive.tar.gz>" >&2
	exit 2
fi
source_dir=$1
app_id=$2
archive=$3

case "$app_id" in
	''|*/*|.|..|*[!A-Za-z0-9_.-]*) echo "nextcloud-pack: invalid app id: $app_id" >&2; exit 2 ;;
esac
if [ ! -d "$source_dir" ]; then
	echo "nextcloud-pack: no such directory: $source_dir" >&2
	exit 2
fi
case "$archive" in
	/*) ;;
	*) archive="$PWD/$archive" ;;
esac

export COPYFILE_DISABLE=1
stage=$(mktemp -d "$TMPDIR/nextcloud-pack.XXXXXX")
trap 'rm -rf -- "$stage"' EXIT
mkdir "$stage/$app_id"
tar --exclude=.git --exclude=.tools --exclude=.env --exclude=node_modules \
	-cf - -C "$source_dir" . | tar -xf - -C "$stage/$app_id"
tar -czf "$archive" -C "$stage" "$app_id"
