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
    # macOS still ships Bash 3, which has no globstar. `find` covers both the
    # top level and nested job directories without listing top-level rows twice.
    while IFS= read -r f; do
        files+=("$f")
    done < <(find provenance -type f -name '*.tsv' -print 2>/dev/null | LC_ALL=C sort)
fi
# Bash 3 with `set -u` treats an empty-array expansion as an unbound variable.
# Keep one harmless sentinel; the file guard below skips it.
if [ ${#files[@]} -eq 0 ]; then
    files=("")
fi

rows=""
for f in "${files[@]}"; do
    [ -f "$f" ] || continue
    rows="${rows}$(cat "$f")
"
done

# Drop blank lines, drop rows that are duplicates of a whole other row, then
# sort by bundle and binary.
#
# Deduplicated on the WHOLE line, not on (bundle, binary): a row is (bundle,
# binary, source, version, checked, sha, url), so an identical line is the same
# FACT recorded twice - by a doubled glob, a retried step, a job that ran again
# - and nothing distinguishes the copies. Two rows that share a bundle and a
# binary but differ anywhere else are NOT that; they are a real disagreement
# about which Node.js went into a bundle, and `sort -u -k1,1 -k2,2` would hide
# one of the two at random. Better shown twice and noticed.
rows="$(printf '%s' "$rows" | awk 'NF && !seen[$0]++' \
        | sort -t"$(printf '\t')" -k1,1 -k2,2)"

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
echo "[wekan/node-patches](https://github.com/wekan/node-patches) build the ones"
echo "neither of them does - and not every source publishes a checksum. This is"
echo "what went into this release, and which downloads were checked against a"
echo "published SHA256."
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
