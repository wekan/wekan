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
    # `find`, not `shopt -s globstar`. globstar arrived in bash 4, and macOS
    # still ships bash 3.2 as /bin/bash - there this failed outright with
    # "shopt: globstar: invalid shell option name" and, under `set -e`, took the
    # whole script with it. The release notes are generated on Linux, but this
    # script is also run by tests/provenanceTable.test.cjs on whatever the
    # developer has.
    #
    # ONE traversal, at any depth, exactly as `provenance/**/*.tsv` did: that
    # pattern matches ZERO or more directories, so it already covers
    # provenance/*.tsv - and listing both patterns matched every top-level file
    # twice, which is why the v10.77 release notes printed every row of the
    # table twice.
    #
    # -print0 and read -d '': a path with a space in it would otherwise be split
    # into two names that are not files, and both would be skipped in silence.
    files=()
    if [ -d provenance ]; then
        while IFS= read -r -d '' f; do
            files+=("$f")
        done < <(find provenance -type f -name '*.tsv' -print0 2>/dev/null | sort -z)
    fi
fi

rows=""
# `${files[@]+...}` rather than a bare `"${files[@]}"`: under `set -u`, bash 3.2
# - which is what /bin/bash is on macOS - treats an EMPTY array as an unbound
# variable and aborts with `files[@]: unbound variable`. bash 4.4 and later do
# not. The expansion below is empty when the array is, and identical otherwise.
for f in ${files[@]+"${files[@]}"}; do
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
