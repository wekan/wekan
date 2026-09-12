#!/bin/sh
# Explicit maintainer operation: overwrite remote translations from local files.
set -eu
translation_script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
translation_repo_dir=$(CDPATH= cd -- "$translation_script_dir/../.." && pwd)
cd "$translation_repo_dir"
mkdir -p "$translation_repo_dir/.tools/tmp"
export TMPDIR="$translation_repo_dir/.tools/tmp"
translation_node=${NODE_BIN:-node}
exec "$translation_node" "$translation_script_dir/push-all-translations.mjs" "$@"
