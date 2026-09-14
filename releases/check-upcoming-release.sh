#!/bin/bash
# Read-only preflight; safe to run independently of release/publishing commands.
set -e
changelog="${1:-$(cd "$(dirname "$0")/.." && pwd)/CHANGELOG.md}"
if [ ! -f "$changelog" ]; then
  echo "Error: changelog not found: $changelog" >&2
  exit 1
fi
if ! awk '
  /^# / { active = ($0 ~ /^# Upcoming WeKan ® release[[:space:]]*$/) }
  active && /^# / { headings++ }
  active && /<summary>.*<a[[:space:]][^>]*href="[^"]+"[^>]*>[^<[:space:]]/ { entries++ }
  END { exit !(headings == 1 && entries > 0) }
' "$changelog"; then
  echo "Error: CHANGELOG.md must contain one '# Upcoming WeKan ® release' section with release entries." >&2
  echo "Add Upcoming release notes before running releases/release-all.sh." >&2
  exit 1
fi
