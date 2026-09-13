#!/bin/bash
# Open the local repository created by fossil.sh; no network mirror is needed.
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WEKAN_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
FOSSIL_FILE="${1:-$WEKAN_ROOT/../fo/wekan.fossil}"
case "$FOSSIL_FILE" in
  /*) ;;
  *) FOSSIL_FILE="$PWD/$FOSSIL_FILE" ;;
esac
if [ "$#" -gt 1 ]; then
  echo "Usage: bash releases/fossil-ui.sh [repository.fossil]" >&2
  exit 2
fi
if ! command -v fossil >/dev/null 2>&1; then
  echo "Error: fossil is required to open the local repository." >&2
  exit 1
fi
if [ ! -f "$FOSSIL_FILE" ]; then
  echo "Error: Fossil repository not found: $FOSSIL_FILE" >&2
  echo "Create it first with releases/fossil.sh, or specify its filename." >&2
  exit 1
fi
mkdir -p "$WEKAN_ROOT/.tools/tmp"
export TMPDIR="$WEKAN_ROOT/.tools/tmp"
exec fossil ui "$FOSSIL_FILE"
