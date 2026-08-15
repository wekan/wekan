#!/usr/bin/env bash
# Print the CHANGELOG.md section that is this release's notes, to stdout.
#
# Usage: releases/release-notes.sh <version> [changelog-file]
#
# WHY THIS IS A FILE-TO-FILE PATH AND NEVER A VARIABLE
#
# The notes are the whole newest CHANGELOG section - 172,458 characters for
# v10.92 - and there are two ways to hand a string that size to a shell step,
# both of which have already broken a release:
#
#   * Inline `${{ needs.prepare.outputs.changelog }}` inside a `run:` block.
#     GitHub substitutes it into the shell SOURCE before bash parses it, so every
#     `code` span's backtick runs as a command. v10.59 died with "Incorrect:
#     command not found" and published nothing.
#
#   * Through the ENVIRONMENT - `env: CHANGELOG: ${{ … }}` then "$CHANGELOG" -
#     which fixed the backticks and then hit a harder wall. Linux caps a SINGLE
#     argv/envp string at MAX_ARG_STRLEN, 128 KiB, and the notes passed it:
#     v10.92's release job failed before running a line of the script, with
#     "An error occurred trying to start process '/usr/bin/bash' … Argument list
#     too long". Nothing in the step is wrong; execve refuses to start it.
#
# So the notes never become an argument, an environment variable or a job
# output. They are read from CHANGELOG.md in the workspace and written to a
# file, and only file PATHS are passed around - which has no size limit, and
# leaves the text as data that no shell ever parses.
set -euo pipefail

VERSION="${1:-}"
CHANGELOG_FILE="${2:-CHANGELOG.md}"

if [ -z "$VERSION" ]; then
  echo "usage: releases/release-notes.sh <version> [changelog-file]" >&2
  exit 2
fi
if [ ! -r "$CHANGELOG_FILE" ]; then
  echo "::error::release-notes: cannot read $CHANGELOG_FILE" >&2
  exit 1
fi

# Prefer a version-specific "# v<version> …" section; otherwise the topmost
# "# Upcoming/Upcomig WeKan ® release" one. The python reads the file itself and
# writes to stdout, so the notes never pass through the shell.
NOTES_FILE="$(mktemp)"
trap 'rm -f "$NOTES_FILE"' EXIT

VERSION="$VERSION" CHANGELOG_FILE="$CHANGELOG_FILE" python3 - > "$NOTES_FILE" <<'PYEOF'
import os
import re
import sys

version = os.environ["VERSION"]
with open(os.environ["CHANGELOG_FILE"], encoding="utf-8") as f:
    content = f.read()

patterns = [
    rf"(# v{re.escape(version)} .*?)(?=\n# v[0-9]|\Z)",
    r"(# Upcom\w* WeKan.*?)(?=\n# v[0-9]|\Z)",
]
for pat in patterns:
    m = re.search(pat, content, re.DOTALL)
    if m:
        print(m.group(1).strip())
        sys.exit(0)
# Neither section exists. Print nothing; the caller turns that into an error
# with a message that says what to add, rather than publishing an empty release.
sys.exit(0)
PYEOF

if [ ! -s "$NOTES_FILE" ] || [ -z "$(tr -d '[:space:]' < "$NOTES_FILE")" ]; then
  echo "::error::release-notes: $CHANGELOG_FILE has no '# v$VERSION …' section and no '# Upcoming WeKan (R) release' section, so the release would have no notes. Add the section and re-run." >&2
  exit 1
fi

cat "$NOTES_FILE"
