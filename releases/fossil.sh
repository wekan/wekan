#!/bin/bash

# Export WeKan branches and tags to a local Fossil repository; extend it on subsequent runs.
# Usage: bash releases/fossil.sh [destination.fossil]
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WEKAN_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
FOSSIL_FILE="${1:-$WEKAN_ROOT/../fo/wekan.fossil}"
case "$FOSSIL_FILE" in
  /*) ;;
  *) FOSSIL_FILE="$PWD/$FOSSIL_FILE" ;;
esac

if [ "$#" -gt 1 ]; then
  echo "Usage: bash releases/fossil.sh [destination.fossil]" >&2
  exit 2
fi
for tool in git fossil; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: $tool is required for the local Git-to-Fossil export." >&2
    exit 1
  fi
done
IMPORT_OPTIONS=(--git)
if [ -e "$FOSSIL_FILE" ]; then
  IMPORT_OPTIONS+=(--incremental)
fi

mkdir -p "$WEKAN_ROOT/.tools/tmp"
export TMPDIR="$WEKAN_ROOT/.tools/tmp"
cd -- "$WEKAN_ROOT"
git rev-parse --git-dir >/dev/null
mkdir -p -- "$(dirname -- "$FOSSIL_FILE")"

# --all also visits internal refs that can point to trees instead of commits,
# producing "unexpected object of type tree" warnings. Export the real history
# namespaces explicitly, without deleting refs or hiding diagnostic output.
if ! git fast-export --branches --tags --remotes --reencode=yes |
  fossil import "${IMPORT_OPTIONS[@]}" "$FOSSIL_FILE"; then
  echo "Error: Git-to-Fossil export failed. See the diagnostics above." >&2
  exit 1
fi
echo "Updated local Fossil repository: $FOSSIL_FILE"
