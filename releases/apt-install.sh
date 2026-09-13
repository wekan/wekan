#!/usr/bin/env bash
# Install Debian/Ubuntu packages in a release job, without letting somebody
# else's package index end the release.
#
#     bash releases/apt-install.sh build-essential g++ make python3 curl
#
# Why this exists. The v10.87 `bump` job died on this:
#
#     E: Failed to fetch https://dl.google.com/linux/chrome-stable/deb/dists/stable/main/binary-amd64/Packages.gz
#        Hash Sum mismatch
#     E: Some index files failed to download.
#     Error: Process completed with exit code 100.
#
# Nothing in this release wants Google Chrome. A GitHub runner ships with
# google-chrome, microsoft-prod, azure-cli and docker repositories configured,
# and `apt-get update` fails as a whole when ANY of them serves an index that
# does not match its own hashes - which happens while that repository is being
# republished. The job was installing python3 and curl from the Ubuntu archive.
#
# So: retry (a mismatch is a mirror mid-update and passes in a minute), and if
# it still fails, retry once more with the third-party lists moved aside. Every
# package a release job installs comes from the Ubuntu archive itself, so
# dropping the extras costs nothing - and the runner is thrown away afterwards.
#
# Tunables (env): APT_ATTEMPTS (default 3), APT_SLEEPS ("15 45"; "0" in tests),
# APT_SOURCES_DIR (default /etc/apt/sources.list.d - the third-party lists).
set -uo pipefail

if [ "$#" -eq 0 ]; then
    echo "apt-install.sh: give it packages to install" >&2
    exit 2
fi

attempts=${APT_ATTEMPTS:-3}
sleeps=${APT_SLEEPS:-"15 45"}

# In a container this runs as root and there is no sudo; on a runner there is.
SUDO=""
if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi

# Acquire::Retries covers a dropped connection inside one run; the loop covers
# an index that is briefly inconsistent, which no number of retries inside a
# single apt-get run will fix.
update() { $SUDO apt-get update -o Acquire::Retries=3; }

attempt=1
ok=""
while [ "$attempt" -le "$attempts" ]; do
    if update; then ok=yes; break; fi
    if [ "$attempt" -eq "$attempts" ]; then break; fi
    delay=$(printf '%s\n' $sleeps | sed -n "${attempt}p")
    [ -n "$delay" ] || delay=$(printf '%s\n' $sleeps | tail -n 1)
    echo "::warning::apt-get update failed (attempt $attempt/$attempts). Clearing the index and retrying in ${delay}s."
    $SUDO rm -rf /var/lib/apt/lists/*
    [ "$delay" -gt 0 ] && sleep "$delay"
    attempt=$((attempt + 1))
done

sources_dir=${APT_SOURCES_DIR:-/etc/apt/sources.list.d}
if [ -z "$ok" ]; then
    echo "::warning::apt-get update still fails. Dropping the third-party repositories this release does not use (google-chrome, microsoft, docker ...) and updating from the distribution archive alone."
    if [ -d "$sources_dir" ]; then
      $SUDO mkdir -p "${sources_dir}.disabled"
      $SUDO sh -c "mv ${sources_dir}/* ${sources_dir}.disabled/ 2>/dev/null || true"
    fi
    $SUDO rm -rf /var/lib/apt/lists/*
    if update; then ok=yes; fi
fi

if [ -z "$ok" ]; then
    echo "::error::apt-get update failed $attempts times, and again with only the distribution archive. That is an outage at the mirror, not WeKan: re-run this job."
    exit 100
fi

$SUDO apt-get install -y "$@"
