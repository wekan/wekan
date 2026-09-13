#!/bin/bash

# Mirror one repository or all repositories of a configured GitHub organization.
# Shared menu manages source/destination organizations and offline archives.
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
MIRROR_LOG_DIR="$TOOLS_DIR/log/mirror/$(date +%Y-%m-%d_%H-%M_%S)"
mkdir -p "$MIRROR_LOG_DIR"
MIRROR_LOG_FILE="$MIRROR_LOG_DIR/mirror-log.txt"
{
  printf 'Mirror log: %s\n' "$MIRROR_LOG_FILE"
  node "$WEKAN_ROOT/tools/mirror-menu.mjs" "$@"
} 2>&1 | tee -a "$MIRROR_LOG_FILE"
