#!/bin/bash
#
# record-provenance.sh - write down where one binary in this bundle came from.
#
# A WeKan bundle is assembled out of binaries other projects publish, and WHICH
# of them serves varies per release and per CPU: nodejs.org has s390x but not
# riscv64, unofficial-builds has riscv64 but is a version behind, the wekan/node
# fork has the CPUs neither of them builds. Some publish a checksum and some do
# not. None of that is visible on the release page, so "where did the node in
# the arm64 bundle come from, and was it checked" had no answer short of reading
# the build log of a run that may have expired.
#
# Each build job records a line per binary with this, the lines are collected as
# artifacts, and the release job puts the table at the TOP of the release notes.
#
# Usage:
#   record-provenance.sh <bundle> <what> <source> <version> <url> [sha256]
#
#   bundle   which bundle this is for, e.g. amd64, arm64, win64, s390x
#   what     which binary, e.g. Node.js, FerretDB, mongodump
#   source   where it came from, e.g. nodejs.org, unofficial-builds, wekan/node
#   version  the version or release tag it came from
#   url      the exact URL it was downloaded from
#   sha256   the checksum it was verified against; omit when none is published
#
# Appends one tab-separated row to $PROVENANCE_FILE (default provenance.tsv).

set -euo pipefail

file="${PROVENANCE_FILE:-provenance.tsv}"

bundle="${1:?bundle is required}"
what="${2:?what is required}"
source_name="${3:?source is required}"
version="${4:?version is required}"
url="${5:?url is required}"
sha256="${6:-}"

if [ -n "$sha256" ]; then
    verified="verified"
else
    # Said in as many words rather than left blank, because a blank cell reads
    # as "nothing to report" and this is very much something to report.
    verified="no checksum published"
    sha256="-"
fi

printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$bundle" "$what" "$source_name" "$version" "$verified" "$sha256" "$url" \
    >> "$file"

echo "provenance: ${bundle}: ${what} ${version} from ${source_name} (${verified})"
