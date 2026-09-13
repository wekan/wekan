#!/bin/bash

# Mirror changes from https://github.com/wekan/wekan to
# GitLab, Codeberg and SourceForge.
# Not to Bitbucket, it has Unauthorized errors.

set -euo pipefail

# Resolve the checkout from this script instead of assuming Linux's ~/repos path.
# This works from both ~/repos/wekan on Linux and ~/Documents/repos/wekan on macOS,
# including when the script is started from some other working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEKAN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TOOLS_DIR="$WEKAN_ROOT/.tools"
export PATH="$TOOLS_DIR/bin:${GOBIN:+$GOBIN:}$PATH"

case "${1:-}" in
  --help|-h) echo "Usage: bash releases/mirror.sh [--preview]"; exit 0 ;;
  --preview|"") ;;
  *) echo "Unknown mirror option: $1" >&2; exit 2 ;;
esac
if [ "$#" -gt 1 ]; then echo "Expected at most --preview" >&2; exit 2; fi

mkdir -p "$TOOLS_DIR/tmp"
export TMPDIR="$TOOLS_DIR/tmp"
WORK_DIR="$(mktemp -d "$TMPDIR/mirror-run.XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT
node "$WEKAN_ROOT/tools/mirror-active-forges.mjs" --export-source "$WORK_DIR/github.json"
STATUS=0
ARCHIVE_ARGS=(--archive-only)
if [ "${1:-}" != --preview ]; then ARCHIVE_ARGS+=(--apply); fi
node "$WEKAN_ROOT/tools/mirror-active-forges.mjs" "${ARCHIVE_ARGS[@]}" --snapshot "$WORK_DIR/github.json" || STATUS=1
mirror() {
  local name="$1"
  local clone_url="$2" # Also read by the shared engine's active-mirror registry.
  bash "$SCRIPT_DIR/mirror-$name.sh" ${RUN_ARGS[@]+"${RUN_ARGS[@]}"} --snapshot "$WORK_DIR/github.json" --skip-archive || STATUS=1
}
RUN_ARGS=("$@")

# WeKan repo mirrors

# GitLab
# https://gitlab.com/wekan/wekan
mirror "gitlab" "git@gitlab.com:wekan/wekan"

# Bitbucket: Unauthorized error often, so not in use.
# https://bitbucket.org/wekan/wekan
# https://bitbucket.org/wekan/wekan/src/main/
# Workspaces: https://bitbucket.org/account/workspaces/
#mirror "bitbucket" "git@bitbucket.org:wekan/wekan.git"

# Codeberg:
# https://codeberg.org/wekan/wekan
mirror "codeberg" "git@codeberg.org:wekan/wekan"

# SourceForge:
# https://sourceforge.net/projects/wekan/
# git clone ssh://wekan@git.code.sf.net/p/wekan/code wekan-sourceforge
mirror "sourceforge" "ssh://wekan@git.code.sf.net/p/wekan/code"

exit "$STATUS"
