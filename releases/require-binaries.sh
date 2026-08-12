#!/bin/bash
#
# require-binaries.sh - check that every binary a bundle needs from another
# project's releases exists, and stop the build with a useful message if one
# does not.
#
# A WeKan bundle is assembled out of files other repositories publish: FerretDB
# from wekan/FerretDB, the MongoDB Database Tools from wekan/mongo-tools-patches, and on
# some CPUs a Node.js from wekan/node. Any of them can be absent - a build that
# has not finished, a release that skipped an architecture - and the build
# should say so plainly, naming the file and where it should be published,
# rather than failing later with a bare curl 404 or, worse, shipping a bundle
# that is missing a piece.
#
# Usage:
#   require-binaries.sh <what-is-being-built> <url>...
#
# Every URL is required. For files that are optional - the MongoDB tools, which
# are a convenience because FerretDB is the database - use warn-binaries.sh
# semantics instead by passing them to this script's sibling check in
# check-arch-binaries.sh, or simply do not pass them here.
#
# Exits 0 when all of them exist, non-zero after printing one ::error:: line per
# missing URL plus a summary.

set -uo pipefail

label="${1:?what is being built is required}"
shift

if [ "$#" -eq 0 ]; then
    echo "require-binaries.sh: no URLs given for ${label}" >&2
    exit 2
fi

missing=0

for url in "$@"; do
    name="${url##*/}"
    # -I: the headers answer "does it exist"; the body is tens of megabytes and
    # this runs once per file per build.
    bash "$(dirname "$0")/fetch.sh" --check "$url"
    case $? in
      0)
        echo "  ok       ${name}" ;;
      2)
        # The server would not say. Reporting that as MISSING would tell the
        # maintainer to go and build a file that is already published, so it is
        # its own outcome - and still a failure, because a bundle must not be
        # assembled around a binary nobody could confirm.
        echo "  UNKNOWN  ${name}"
        echo "::error::${label}: could not tell whether ${name} exists at ${url} - the server did not answer. This is an outage, not a missing file: re-run this job."
        missing=$((missing + 1)) ;;
      *)
        echo "  MISSING  ${name}"
        echo "::error::${label}: ${name} does not exist at ${url} . The bundle cannot be assembled without it. Build it in the project that publishes it and attach it to that project's newest release, then re-run this job."
        missing=$((missing + 1)) ;;
    esac
done

if [ "$missing" -ne 0 ]; then
    echo "::error::${label}: ${missing} required binary/binaries are missing - see the lines above. Nothing is built, so no incomplete bundle is published."
    exit 1
fi

echo "${label}: every required binary is present."
