#!/bin/bash
#
# provenance-table.sh - turn the collected provenance rows into the markdown
# table that goes at the TOP of the release notes.
#
# Reads every provenance.tsv the build jobs uploaded (given as arguments, or
# found under ./provenance/) and prints a markdown section. Sorted by bundle,
# then by binary, so the same platform's rows stay together.
#
# Usage: provenance-table.sh [file...]

set -euo pipefail

files=("$@")
if [ ${#files[@]} -eq 0 ]; then
    shopt -s nullglob globstar
    files=(provenance/**/*.tsv provenance/*.tsv)
fi

rows=""
for f in "${files[@]}"; do
    [ -f "$f" ] || continue
    rows="${rows}$(cat "$f")
"
done

# Drop blank lines, then sort by bundle and binary.
rows="$(printf '%s' "$rows" | awk 'NF' | sort -t"$(printf '\t')" -k1,1 -k2,2)"

if [ -z "$rows" ]; then
    # Not fatal. The bundles are what the release is; a missing provenance
    # artifact is a gap in the notes, not a reason to publish nothing.
    echo "> **Note:** no build job recorded where its binaries came from, so"
    echo "> this release has no provenance table. The build logs still have it."
    echo
    exit 0
fi

echo "## Binaries in these bundles"
echo
echo "Each bundle carries a Node.js, a FerretDB and the MongoDB Database Tools."
echo "Which source has a given CPU varies from release to release - nodejs.org"
echo "builds some architectures, unofficial-builds others, and the"
echo "[wekan/node](https://github.com/wekan/node) fork the ones neither of them"
echo "does - and not every source publishes a checksum. This is what went into"
echo "this release, and which downloads were checked against a published"
echo "SHA256."
echo
echo "| Bundle | Binary | From | Version | Checked | SHA256 |"
echo "| --- | --- | --- | --- | --- | --- |"

printf '%s\n' "$rows" | while IFS="$(printf '\t')" read -r bundle what src version verified sha url; do
    [ -n "${bundle:-}" ] || continue
    if [ "$sha" = "-" ]; then
        shown="—"
    else
        # The first 16 characters identify it; the whole thing is beside the
        # file on the release it came from, which is where anyone checking
        # would get it anyway.
        shown="\`${sha:0:16}…\`"
    fi
    printf '| %s | %s | [%s](%s) | %s | %s | %s |\n' \
        "$bundle" "$what" "$src" "$url" "$version" "$verified" "$shown"
done

echo
echo "A row saying *no checksum published* is not a failed check - it is a"
echo "source that publishes nothing to check against. Those are the ones worth"
echo "fixing at the source."
echo
