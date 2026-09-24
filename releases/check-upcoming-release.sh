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

# A missing summary stopped v11.96 only after version bumping and tagging.
# Require actual text on the summary line, inside Upcoming (not an older release).
if ! awk '
  /^# / { active = ($0 ~ /^# Upcoming WeKan ® release[[:space:]]*$/) }
  active && /^\*\*In short:\*\* [^[:space:]]/ { summary++ }
  END { exit !(summary == 1) }
' "$changelog"; then
  echo "Error: Upcoming release needs one nonempty '**In short:**' summary." >&2
  exit 1
fi

# A translation group without its language list fails later, after the release
# tag is already created. Catch it in this read-only local preflight instead.
if ! awk '
  /^# / { active = ($0 ~ /^# Upcoming WeKan ® release[[:space:]]*$/); waiting = 0 }
  active && /^\*\*Translations\*\* - / { groups++; waiting = 1; next }
  active && waiting && /^\*\*Languages updated:\*\* [^[:space:]]/ { listed++; waiting = 0; next }
  active && waiting && (/^<details>/ || /^\*\*[^*]+\*\* - /) { waiting = 0 }
  END { exit !(groups == listed) }
' "$changelog"; then
  echo "Error: Upcoming Translations group needs '**Languages updated:**' followed by comma-separated full language names." >&2
  exit 1
fi
