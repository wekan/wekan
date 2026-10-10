#!/bin/bash
# Read-only preflight; safe to run independently of release/publishing commands.
#
# Only the "# Upcoming WeKan ® release" heading itself is required: it is what
# release-all.sh renames to the new version. Everything under it is OPTIONAL -
# entries, the **In short:** summary and a Translations group's
# **Languages updated:** line. A missing one is reported as a warning and left
# out of the release notes (releases/release-notes.sh), never a stop.
set -e
changelog="${1:-$(cd "$(dirname "$0")/.." && pwd)/CHANGELOG.md}"
if [ ! -f "$changelog" ]; then
  echo "Error: changelog not found: $changelog" >&2
  exit 1
fi
headings="$(awk '/^# Upcoming WeKan ® release[[:space:]]*$/ { n++ } END { print n + 0 }' "$changelog")"
if [ "$headings" -ne 1 ]; then
  echo "Error: CHANGELOG.md must contain exactly one '# Upcoming WeKan ® release' heading (found $headings)." >&2
  echo "Add it from docs/DeveloperDocs/Changelog-Upcoming-Template.md before running releases/release-all.sh." >&2
  exit 1
fi

# Optional content: warn, so the person releasing sees what the notes lack.
awk '
  /^# / { active = ($0 ~ /^# Upcoming WeKan ® release[[:space:]]*$/); waiting = 0 }
  active && /<summary>.*<a[[:space:]][^>]*href="[^"]+"[^>]*>[^<[:space:]]/ { entries++ }
  active && /^\*\*In short:\*\* [^[:space:]]/ { summary++ }
  active && /^\*\*Translations\*\* - / { groups++; waiting = 1; next }
  active && waiting && /^\*\*Languages updated:\*\* [^[:space:]]/ { listed++; waiting = 0; next }
  active && waiting && (/^<details>/ || /^\*\*[^*]+\*\* - /) { waiting = 0 }
  END {
    if (!entries) print "Warning: the Upcoming release has no entries."
    if (!summary) print "Warning: the Upcoming release has no **In short:** summary; the release notes will have none."
    if (groups > listed) print "Warning: a Translations group has no **Languages updated:** line; the release notes will not list its languages."
  }
' "$changelog" >&2
exit 0
