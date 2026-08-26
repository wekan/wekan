#!/usr/bin/env bash
#
# embed-verified-node.sh - put the right Node.js binary into a WeKan bundle.
#
# WHERE IT COMES FROM is not decided here: releases/resolve-node-source.sh knows
# the three sources and their order - official nodejs.org, then
# unofficial-builds.nodejs.org, then the wekan/node-patches releases - and this
# script downloads what that answers, verifies it against the SHA256 that source
# published, and puts the node executable at <dest>.
#
# The three sources hand out two different SHAPES of file, and that is most of
# the work here: nodejs.org and unofficial-builds publish a TARBALL (a .zip on
# Windows) with the whole distribution in it, while node-patches publishes the
# BARE binary. The resolver says which, so this extracts or copies accordingly.
#
# A bundle needs only the node executable: WeKan runs `node main.js`, and the
# BUILD uses the runner's own node + npm, so no npm is grafted here (the Docker
# image and the emulated cross-builds, which DO run npm, graft it from the
# official amd64 tarball separately).
#
# Usage:
#   embed-verified-node.sh <dest> <platform> <major|version>
#     dest        where to write the node executable (bundle/node, bundle/node.exe)
#     platform    amd64/x64, arm64, i386, armhf, armv7, ppc64le, s390x, riscv64,
#                 loong64, win64, win32, mac-x64, mac-arm64 - or the node-patches
#                 asset name (node-x64, node-win64.exe), accepted as-is so a
#                 caller that already holds one need not translate it
#     major       the pinned Node MAJOR (24), or a full version to pin one
#
# Prints, on success, shell-eval-able lines (also appended to $GITHUB_OUTPUT and
# $GITHUB_ENV when set) so the caller can record provenance:
#     node_full=v24.19.0
#     node_from=official
#     node_url=https://nodejs.org/dist/v24.20.0/node-v24.20.0-linux-x64.tar.xz
#     node_sha256=<hex of the file that was downloaded and verified>
#
# Exit status: 0 embedded, 3 NO source has a Node.js for this platform - the
# caller SKIPS the platform rather than failing (see resolve-node-source.sh) -
# and 1 when something went wrong.

set -uo pipefail

dest="${1:?dest path is required}"
platform="${2:?platform is required (e.g. amd64, win64, mac-arm64)}"
version="${3:?version is required (the major 24, or a full v24.19.0)}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── 1. Which file, from which source ─────────────────────────────────────────
resolved="$(bash "$here/resolve-node-source.sh" "$platform" "$version")"
rc=$?
if [ "$rc" -eq 3 ]; then
  # Not an error: no source publishes a Node.js for this CPU, so WeKan does not
  # build it this release. The caller's preflight decides what to do about it.
  printf 'node_found=false\n'
  exit 3
fi
[ "$rc" -eq 0 ] || exit 1

node_found=false node_full="" node_from="" node_url="" node_kind="" node_member="" node_sha256=""
eval "$(printf '%s\n' "$resolved" | grep -E '^node_[a-z0-9]+=')"
if [ "$node_found" != "true" ] || [ -z "$node_url" ] || [ -z "$node_sha256" ]; then
  echo "::error::resolve-node-source.sh did not return a usable Node.js for ${platform}." >&2
  exit 1
fi

mkdir -p "$(dirname "$dest")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# ── 2. Download it ────────────────────────────────────────────────────────────
#
# --retry survives the transient 5xx and cut connections a release build hits
# often enough to matter. A genuine 404 here means the file is listed in the
# source's own checksum file and still is not downloadable, which is worth saying
# plainly rather than retrying forever.
dl="${work}/download"
if ! bash "$(dirname "$0")/fetch.sh" -o "$dl" "$node_url"; then
  echo "::error::Could not download ${node_url} , although ${node_from} lists it in its published checksums. Re-run when it is reachable." >&2
  exit 1
fi

# ── 3. Verify it against the checksum THAT SOURCE published ──────────────────
#
# All three sources publish one - SHASUMS256.txt at nodejs.org and
# unofficial-builds, a .sha256sum sidecar at node-patches - and the resolver only
# returns a build it found a checksum FOR. So this is unconditional: there is no
# "shipped unverified" path any more, which there used to be when a fork release
# could publish a binary without its sidecar.
if command -v sha256sum >/dev/null 2>&1; then
  got="$(sha256sum "$dl" | cut -d' ' -f1)"
else
  got="$(shasum -a 256 "$dl" | cut -d' ' -f1)"   # macOS has no sha256sum
fi
if [ "$got" != "$node_sha256" ]; then
  echo "::error::$(basename "$node_url") does not match the SHA256 ${node_from} published (published ${node_sha256}, got ${got}). Not shipping it." >&2
  exit 1
fi

# ── 4. Take the node executable out of it ────────────────────────────────────
#
# node-patches publishes the bare binary, so there is nothing to unpack. The
# other two publish an archive of the whole distribution, and a bundle needs
# exactly one file out of it: node_member, which the resolver named.
case "$node_kind" in
  binary)
    cp "$dl" "$dest"
    ;;
  tar.xz|tar.gz|tar)
    # -xf, not -xJf: GNU tar and macOS's bsdtar both detect the compression
    # themselves, and only one of them takes -J.
    if ! tar -xf "$dl" -C "$work" "$node_member"; then
      echo "::error::${node_member} is not in $(basename "$node_url"). The archive's layout is not what ${node_from} has published until now." >&2
      exit 1
    fi
    cp "${work}/${node_member}" "$dest"
    ;;
  zip)
    # Windows. The runners have 7z, git-bash has no unzip, and python3 is there
    # too - so try them in that order rather than assuming any one of them.
    if command -v unzip >/dev/null 2>&1; then
      unzip -p "$dl" "$node_member" > "$dest" \
        || { echo "::error::unzip could not read ${node_member} from $(basename "$node_url")." >&2; exit 1; }
    elif command -v 7z >/dev/null 2>&1; then
      ( cd "$work" && 7z x -y "$dl" "$node_member" >/dev/null ) \
        || { echo "::error::7z could not read ${node_member} from $(basename "$node_url")." >&2; exit 1; }
      cp "${work}/${node_member}" "$dest"
    elif command -v python3 >/dev/null 2>&1; then
      python3 -c 'import sys,zipfile;open(sys.argv[3],"wb").write(zipfile.ZipFile(sys.argv[1]).read(sys.argv[2]))' \
        "$dl" "$node_member" "$dest" \
        || { echo "::error::python3 could not read ${node_member} from $(basename "$node_url")." >&2; exit 1; }
    else
      echo "::error::No unzip, 7z or python3 here, so ${node_member} cannot be taken out of $(basename "$node_url")." >&2
      exit 1
    fi
    ;;
  *)
    echo "::error::resolve-node-source.sh returned an unknown kind '${node_kind}'." >&2
    exit 1
    ;;
esac

if [ ! -s "$dest" ]; then
  echo "::error::${dest} is empty after unpacking $(basename "$node_url")." >&2
  exit 1
fi

# Windows keeps its .exe; everything else needs the exec bit.
case "$dest" in
  *.exe) : ;;
  *)     chmod +x "$dest" ;;
esac

echo "Embedded Node.js ${node_full} for ${platform} from ${node_from} (${node_url}), verified SHA256 ${node_sha256} -> ${dest}" >&2

printf 'node_full=%s\n'   "$node_full"
printf 'node_from=%s\n'   "$node_from"
printf 'node_url=%s\n'    "$node_url"
printf 'node_sha256=%s\n' "$node_sha256"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    printf 'node_full=%s\n'   "$node_full"
    printf 'node_from=%s\n'   "$node_from"
    printf 'node_url=%s\n'    "$node_url"
    printf 'node_sha256=%s\n' "$node_sha256"
  } >> "$GITHUB_OUTPUT"
fi
if [ -n "${GITHUB_ENV:-}" ]; then
  {
    printf 'NODE_FULL=%s\n'   "$node_full"
    printf 'NODE_FROM=%s\n'   "$node_from"
    printf 'NODE_URL=%s\n'    "$node_url"
    printf 'NODE_SHA256=%s\n' "$node_sha256"
  } >> "$GITHUB_ENV"
fi
