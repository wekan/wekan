#!/usr/bin/env bash
# Make sure the GitHub Release for a tag exists, creating it with the notes of
# this version's CHANGELOG.md section when it does not.
#
# Usage: releases/ensure-github-release.sh <repository> <version>
#
# WHY A BUILD JOB CREATES THE RELEASE. release-all.yml attaches every file to
# the release from the job that BUILT it, as that job's last step - a file goes
# up the moment it exists, not when the slowest build of the run is done, and a
# cancelled run still leaves every finished file on the release. The first
# file of a run is the amd64 bundle, and nothing can be attached to a release
# that does not exist yet, so build-amd64 (and build-arm64, in case it is
# re-run on its own) call this right before attaching. The `release` job later
# refreshes the same notes and checks both base bundles are there; it no longer
# uploads anything.
#
# Creating it HERE, and not in an earlier job of its own, keeps one property
# the release flow depends on: a run whose amd64 build fails publishes NO
# release at all, so CLAUDE.md's "nothing published -> rename the section back
# to Upcoming and run again" still applies to it.
#
# The notes go file to file, never through a shell variable or argv: see
# releases/release-notes.sh for the two ways that broke a release.
set -euo pipefail
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <repository> <version>" >&2
  exit 2
fi
repository=$1
version=${2#v}
tag="v${version}"
repo_root=$(cd "$(dirname "$0")/.." && pwd)
export TMPDIR="${TMPDIR:-$repo_root/.tools/tmp}"
mkdir -p "$TMPDIR"

if gh release view --repo "$repository" "$tag" --json tagName >/dev/null 2>&1; then
  echo "OK: release $tag already exists."
  exit 0
fi

notes=$(mktemp "$TMPDIR/release-notes.XXXXXX")
trap 'rm -f "$notes"' EXIT
bash "$repo_root/releases/release-notes.sh" "$version" "$repo_root/CHANGELOG.md" > "$notes"

for attempt in 1 2 3; do
  if gh release create --repo "$repository" "$tag" --verify-tag \
       --title "$tag" --notes-file "$notes"; then
    echo "OK: created release $tag."
    exit 0
  fi
  # Another job may have created it between the view above and this create.
  if gh release view --repo "$repository" "$tag" --json tagName >/dev/null 2>&1; then
    echo "OK: release $tag exists (created by another job)."
    exit 0
  fi
  if [ "$attempt" -lt 3 ]; then
    echo "::warning::Could not create release $tag; retrying in $((attempt * 10))s."
    sleep $((attempt * 10))
  fi
done
echo "::error::Could not create release $tag. The tag must exist (the prepare job pushes it), and GITHUB_TOKEN must be allowed to write releases here (permissions: contents: write)." >&2
exit 1
