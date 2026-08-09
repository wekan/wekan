#!/bin/bash
#
# snap-release-all-channels.sh - put every snap, on every architecture, on every
# channel.
#
# WeKan publishes THREE snaps of the same application - wekan, wekan-ondra and
# wekan-gantt-gpl - across SIX Snap Store architectures, and each has to reach
# FOUR channels. That is 72 (snap, architecture, channel) combinations, and the
# helper this replaces released one snap, one revision, to three channels:
#
#     snapcraft release wekan $1 edge,beta,candidate
#
# which is wrong three ways at once. It names only `wekan`. It takes ONE revision
# number, and revisions are PER ARCHITECTURE - amd64 revision 42 and arm64
# revision 42 are different uploads - so a single number can only ever be right
# for one of them. And it leaves out `stable`, so somebody had to remember the
# fourth channel by hand, every time.
#
# This resolves the revision per (snap, architecture) from the store itself, so
# the caller never types a revision number, and releases it to all four channels
# in one call - a revision reaches all of them or none.
#
# SIX ARCHITECTURES, NOT EIGHT. The release bundles cover eight; snapcraft.yaml
# declares a `build-for` for six, and the two missing ones are missing for
# reasons, not by oversight:
#
#   i386   core24 has no i386 port. `build-on: i386` is a PARSE error, which
#          failed EVERY architecture's snap build, not only i386's. Served by
#          the .deb and the AppImage instead.
#   armv7  the Snap Store has ONE 32-bit ARM architecture, `armhf`, and that is
#          the 32-bit Raspberry Pi OS build. armv7 is the ODroid-U3 - a DIFFERENT
#          CPU with its own bundle. Publishing it as armhf would hand Raspberry
#          Pi users the ODroid build, so it ships as a bundle only.
#
# ppc64le AND ppc64el ARE THE SAME HARDWARE. The bundles at
# https://github.com/wekan/wekan name it the way Node.js and the kernel do
# (ppc64le); the Snap Store names it the way Debian does (ppc64el). Nothing warns
# when the wrong one is used - an unrecognised --arch is simply an architecture
# the store has never heard of - so the mapping lives in ONE place,
# models/lib/snapArchitectures.js, and this script reads it from there rather
# than keeping a second copy in bash.
#
# Usage:
#   releases/snap-release-all-channels.sh                 # newest revision of each
#   releases/snap-release-all-channels.sh 10.75           # only that version's
#   releases/snap-release-all-channels.sh --dry-run       # print, do not release
#   releases/snap-release-all-channels.sh --snap wekan    # one snap only
#   releases/snap-release-all-channels.sh --arch ppc64le  # one architecture (either spelling)
#
# Needs `snapcraft` on PATH and a logged-in store session (`snapcraft login`).

set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

version=""
dry_run=0
only_snap=""
only_arch=""

while [ $# -gt 0 ]; do
    case "$1" in
        --dry-run) dry_run=1; shift ;;
        --snap)    only_snap="${2:-}"; shift 2 ;;
        --arch)    only_arch="${2:-}"; shift 2 ;;
        -h|--help) sed -n '2,40p' "${BASH_SOURCE[0]}"; exit 0 ;;
        -*)        echo "unknown option: $1" >&2; exit 2 ;;
        *)         version="$1"; shift ;;
    esac
done

node_bin="$(command -v node || true)"
if [ -z "$node_bin" ]; then
    echo "snap-release-all-channels.sh: node is required (it reads the architecture table" >&2
    echo "  from models/lib/snapArchitectures.js so there is only one copy of it)." >&2
    exit 1
fi

if [ "$dry_run" -eq 0 ] && ! command -v snapcraft >/dev/null 2>&1; then
    echo "snap-release-all-channels.sh: snapcraft is not on PATH." >&2
    echo "  Install it and run 'snapcraft login', or pass --dry-run to see the plan." >&2
    exit 1
fi

# The single source of truth, read once.
snaps="$("$node_bin" -e 'process.stdout.write(require("'"$repo_root"'/models/lib/snapArchitectures").SNAP_NAMES.join(" "))')"
arches="$("$node_bin" -e 'process.stdout.write(require("'"$repo_root"'/models/lib/snapArchitectures").snapArchitectures().join(" "))')"
channels="$("$node_bin" -e 'process.stdout.write(require("'"$repo_root"'/models/lib/snapArchitectures").SNAP_CHANNELS.join(","))')"

# Accept either spelling of --arch, and refuse one that is neither.
if [ -n "$only_arch" ]; then
    resolved="$("$node_bin" -e 'process.stdout.write(require("'"$repo_root"'/models/lib/snapArchitectures").snapArchOf(process.argv[1]))' "$only_arch")"
    if [ -z "$resolved" ]; then
        echo "snap-release-all-channels.sh: '$only_arch' is not an architecture WeKan builds." >&2
        echo "  Known: $arches (and their bundle names ppc64le, armv7)." >&2
        exit 2
    fi
    only_arch="$resolved"
fi

echo "Channels:      $channels"
echo "Snaps:         ${only_snap:-$snaps}"
echo "Architectures: ${only_arch:-$arches}"
echo "Version:       ${version:-<newest uploaded>}"
# Say what is NOT being published, every run. "It is missing" and "it cannot
# be there" look identical from the outside, and this is the difference.
"$node_bin" -e 'const n = require(process.argv[1] + "/models/lib/snapArchitectures").NOT_SNAP_ARCHITECTURES;'\
'Object.entries(n).forEach(([a, why]) => console.log("Not a snap:    " + a + " - " + why));' "$repo_root"
[ "$dry_run" -eq 1 ] && echo "DRY RUN - nothing will be released."
echo

released=0
skipped=0
failed=0

for snap in $snaps; do
    [ -n "$only_snap" ] && [ "$snap" != "$only_snap" ] && continue

    # One store round-trip per snap, not one per architecture.
    revisions="$(snapcraft list-revisions "$snap" 2>/dev/null)"
    if [ -z "$revisions" ]; then
        echo "  $snap: could not list revisions (not logged in, or no such snap) - skipping"
        skipped=$((skipped + 1))
        continue
    fi

    for arch in $arches; do
        [ -n "$only_arch" ] && [ "$arch" != "$only_arch" ] && continue

        revision="$(printf '%s' "$revisions" | "$node_bin" -e '
            const { parseRevisions, pickRevision } = require("'"$repo_root"'/models/lib/snapArchitectures");
            let text = "";
            process.stdin.on("data", d => { text += d; });
            process.stdin.on("end", () => {
              const rev = pickRevision(parseRevisions(text), process.argv[1], process.argv[2] || undefined);
              process.stdout.write(rev === null ? "" : String(rev));
            });
        ' "$arch" "$version")"

        if [ -z "$revision" ]; then
            # Not every architecture is built for every release, and a snap that
            # has none of an architecture is not an error - it is a fact about
            # what was uploaded. Say so and carry on.
            echo "  $snap $arch: no revision${version:+ for $version} - skipping"
            skipped=$((skipped + 1))
            continue
        fi

        echo "  $snap $arch: revision $revision -> $channels"
        if [ "$dry_run" -eq 1 ]; then
            released=$((released + 1))
            continue
        fi

        if snapcraft release "$snap" "$revision" "$channels"; then
            released=$((released + 1))
        else
            # One architecture failing must not stop the other seventeen.
            echo "  $snap $arch: RELEASE FAILED" >&2
            failed=$((failed + 1))
        fi
    done
done

echo
echo "===== released $released, skipped $skipped, failed $failed ====="
[ "$failed" -eq 0 ]
