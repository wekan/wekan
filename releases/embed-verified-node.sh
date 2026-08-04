#!/usr/bin/env bash
#
# embed-verified-node.sh - put a NAMED, CHECKSUMMED Node.js into a bundle.
#
# The four native bundles (amd64, arm64, win64, mac-arm64) used to ship
# `cp $(command -v node)` - whatever Node the GitHub runner happened to carry.
# Two things were wrong with that:
#
#   1. It is not the pinned version. ubuntu-24.04-arm ships Node 22 by default,
#      and build-arm64 had no setup-node, so the arm64 bundle shipped Node
#      22.x while every other bundle shipped 24 - silently, because nothing
#      recorded which node went in.
#   2. It has no checksum. The runner's node is extracted from a tarball setup
#      verified once and threw away; the bare binary on PATH publishes nothing
#      to check against, so provenance could only say "no checksum published"
#      and nobody could tell WHICH Node.js build a given platform carried - the
#      exact thing you need when a Node.js CVE lands and the question is "which
#      of our platforms has the affected binary".
#
# nodejs.org publishes an official build for every mainstream CPU this is used
# for (linux x64/arm64, darwin arm64, win x64) AND a SHASUMS256.txt beside it.
# So download THAT, verify it against the published SHA256, and put its node
# into the bundle. The bundled node is then a named version from a named source
# with a checksum anyone can re-verify - which is what the provenance table is
# for. (The emulated arches - i386, ppc64le, s390x, riscv64, ... - already do
# this through install-node-for-arch.sh with an official->unofficial->fork
# fallback; those CPUs are the ones the fork exists for. The four here are all
# built by nodejs.org itself, so they need no fallback.)
#
# Usage:
#   embed-verified-node.sh <dest> <os> <node_arch> <version>
#     dest       where to write the node binary, e.g. bundle/node or bundle/node.exe
#     os         linux | darwin | win
#     node_arch  x64 | arm64   (what nodejs.org calls the CPU)
#     version    "24" (newest 24.x is resolved from nodejs.org) or exact "v24.18.1"
#
# Prints, on success, two shell-eval-able lines (also appended to $GITHUB_OUTPUT
# and $GITHUB_ENV when set), so the caller can record provenance:
#     node_full=v24.18.1
#     node_sha256=<hex of the verified archive>
#
# The SHA256 recorded is the archive's published hash - the supply-chain anchor:
# it names the exact official build the bundled node was extracted from, and it
# is what SHASUMS256.txt lists. The inner binary is deterministic from it.

set -euo pipefail

dest="${1:?dest path is required}"
os="${2:?os is required (linux|darwin|win)}"
node_arch="${3:?node_arch is required (x64|arm64)}"
version="${4:?version is required (major like 24, or exact vX.Y.Z)}"

DIST="https://nodejs.org/dist"

# Resolve a bare major ("24") to the newest vMAJOR.x nodejs.org actually has.
# An exact "vX.Y.Z" is taken as given.
case "$version" in
  v*) node_full="$version" ;;
  *)
    idx="$(curl -fsSL "${DIST}/index.json")"
    # index.json is newest-first; take the first entry whose version is vMAJOR.*
    node_full="$(printf '%s' "$idx" | python3 -c '
import json,sys
major=sys.argv[1]
for e in json.load(sys.stdin):
    v=e.get("version","")
    if v.startswith("v"+major+"."):
        print(v); break
' "$version")"
    if [ -z "${node_full:-}" ]; then
      echo "::error::Could not find a Node.js ${version}.x release at ${DIST}/index.json ." >&2
      exit 1
    fi
    ;;
esac

# The archive nodejs.org publishes for this OS+CPU, and the node inside it.
case "$os" in
  linux)  archive="node-${node_full}-linux-${node_arch}.tar.xz";  inner="node-${node_full}-linux-${node_arch}/bin/node" ;;
  darwin) archive="node-${node_full}-darwin-${node_arch}.tar.gz"; inner="node-${node_full}-darwin-${node_arch}/bin/node" ;;
  win)    archive="node-${node_full}-win-${node_arch}.zip";        inner="node-${node_full}-win-${node_arch}/node.exe" ;;
  *) echo "::error::unknown os '${os}' (want linux|darwin|win)." >&2; exit 1 ;;
esac

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

url="${DIST}/${node_full}/${archive}"
sums_url="${DIST}/${node_full}/SHASUMS256.txt"

# Download the archive and the checksum list, then verify. A mismatch is retried
# a few times - the overwhelmingly likely cause is a truncated CDN transfer, not
# a real tampering - and only fatal if it still does not match, because at that
# point the bytes served are not the bytes published and there is nothing safe
# to continue on.
node_sha256=""
attempts=3
i=1
while [ "$i" -le "$attempts" ]; do
  curl -fSL --retry 5 --retry-delay 10 -o "${work}/${archive}" "$url"
  curl -fsSL -o "${work}/SHASUMS256.txt" "$sums_url"
  # SHASUMS256.txt lines are "<sha256>  <filename>".
  node_sha256="$(awk -v f="$archive" '$2==f {print $1; exit}' "${work}/SHASUMS256.txt")"
  if [ -z "$node_sha256" ]; then
    echo "::error::${archive} is not listed in ${sums_url}; cannot verify Node.js." >&2
    exit 1
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    got="$(sha256sum "${work}/${archive}" | cut -d' ' -f1)"
  else
    got="$(shasum -a 256 "${work}/${archive}" | cut -d' ' -f1)"   # macOS spelling
  fi
  if [ "$got" = "$node_sha256" ]; then
    break
  fi
  echo "::warning::Node.js archive ${archive} did not match its published SHA256 (try ${i}/${attempts}: published ${node_sha256}, got ${got}); retrying." >&2
  i=$((i+1))
  if [ "$i" -gt "$attempts" ]; then
    echo "::error::Node.js archive ${archive} still does not match its published SHA256 after ${attempts} tries." >&2
    exit 1
  fi
done

# Extract just the node binary and put it at dest.
mkdir -p "$(dirname "$dest")"
case "$os" in
  linux)  tar -C "$work" -xJf "${work}/${archive}" "$inner"; cp "${work}/${inner}" "$dest"; chmod +x "$dest" ;;
  darwin) tar -C "$work" -xzf "${work}/${archive}" "$inner"; cp "${work}/${inner}" "$dest"; chmod +x "$dest" ;;
  win)    unzip -q -o "${work}/${archive}" "$inner" -d "$work"; cp "${work}/${inner}" "$dest" ;;
esac

echo "Embedded Node.js ${node_full} (${os}-${node_arch}) from nodejs.org, verified SHA256 ${node_sha256} -> ${dest}" >&2

# Hand the version and verified checksum back to the caller for provenance.
printf 'node_full=%s\n' "$node_full"
printf 'node_sha256=%s\n' "$node_sha256"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  printf 'node_full=%s\n'   "$node_full"   >> "$GITHUB_OUTPUT"
  printf 'node_sha256=%s\n' "$node_sha256" >> "$GITHUB_OUTPUT"
fi
if [ -n "${GITHUB_ENV:-}" ]; then
  printf 'NODE_FULL=%s\n'   "$node_full"   >> "$GITHUB_ENV"
  printf 'NODE_SHA256=%s\n' "$node_sha256" >> "$GITHUB_ENV"
fi
