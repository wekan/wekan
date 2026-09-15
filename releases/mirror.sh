#!/bin/bash

# Mirror one repository or all repositories of a configured GitHub organization.
# Shared menu manages source/destination organizations and local offline archives.
# Linked files are downloaded from their live URLs only; no archive.org fallback.
# Default repository: https://github.com/wekan/wekan to
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

mkdir -p "$TOOLS_DIR/tmp"
export TMPDIR="$TOOLS_DIR/tmp"

# Default registry; settings.txt overrides these destinations after configuration.
default_registry() {
mirror "gitlab" "git@gitlab.com:wekan/wekan"
mirror "codeberg" "git@codeberg.org:wekan/wekan"
mirror "sourceforge" "ssh://wekan@git.code.sf.net/p/wekan/code"
}
# Bitbucket is inactive because its repository access is unreliable.
# Stream both output channels to the terminal and retain the complete run log.
MIRROR_LOG_DIR="$TOOLS_DIR/log/mirror/$(date +%Y-%m-%d_%H-%M-%S)"
if ! mkdir -p "$(dirname "$MIRROR_LOG_DIR")"; then exit 1; fi
MIRROR_LOG_BASE="$MIRROR_LOG_DIR"
MIRROR_LOG_SUFFIX=0
until mkdir "$MIRROR_LOG_DIR" 2>/dev/null; do
  if [ ! -d "$MIRROR_LOG_DIR" ]; then echo "Cannot create mirror log directory: $MIRROR_LOG_DIR" >&2; exit 1; fi
  MIRROR_LOG_SUFFIX=$((MIRROR_LOG_SUFFIX + 1))
  MIRROR_LOG_DIR="$MIRROR_LOG_BASE-$MIRROR_LOG_SUFFIX"
done
MIRROR_LOG_FILE="$MIRROR_LOG_DIR/mirror-log.txt"
export WEKAN_MIRROR_LOG_FILE="$MIRROR_LOG_FILE"
{
  printf 'Mirror log: %s\n' "$MIRROR_LOG_FILE"
  if command -v gh >/dev/null 2>&1; then
    printf '[github] gh CLI found; authenticated source metadata will prefer gh api.\n'
  else
    printf '[github] gh CLI not found; source metadata will use the HTTP API fallback.\n'
  fi
  status=0
  node "$WEKAN_ROOT/tools/mirror-menu.mjs" "$@" || status=$?
  printf 'Mirror command finished (exit %s). Mirror log: %s\n' "$status" "$MIRROR_LOG_FILE"
  exit "$status"
} 2>&1 | tee -a "$MIRROR_LOG_FILE"
