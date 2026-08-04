#!/usr/bin/env bash
#
# embed-verified-node.sh - put the wekan/node fork's Node.js binary into a bundle.
#
# WeKan takes its Node.js from the wekan/node fork for EVERY platform. One source
# for all of them means a set of bundles is never half built on one Node.js and
# half on another depending on the CPU, and the arches nobody else builds - 32-bit
# x86 (i386), 32-bit ARM (armhf/armv7), loong64, win32 - come from the same place
# as the mainstream ones. nodejs.org and unofficial-builds do not build several of
# those at all, so the fork is the only source that covers everything.
#
# The fork publishes a BARE node binary per arch - node-x64, node-arm64,
# node-win64.exe, node-mac-arm64, node-i386, node-armhf, ... - plus a
# node-<asset>.sha256sum beside it (NOT a tarball). This downloads that binary,
# verifies it against its published SHA256, and puts it at <dest>. That is enough
# for a bundle: WeKan runs `node main.js`, so the shipped bundle needs only the
# node binary; the BUILD uses the runner's own node + npm, so no npm is grafted
# here (the Docker image and the emulated cross-builds, which DO run npm, graft it
# from the official amd64 tarball separately).
#
# Usage:
#   embed-verified-node.sh <dest> <fork-asset> <version>
#     dest        where to write the node binary (e.g. bundle/node, bundle/node.exe)
#     fork-asset  the fork's asset name: node-x64 / node-arm64 / node-win64.exe /
#                 node-mac-x64 / node-mac-arm64 / node-i386 / node-armhf / ...
#     version     the fork release tag, e.g. v24.19.0 (the same NODE_VERSION the
#                 rest of the build uses; the fork tags its releases by version)
#
# Prints, on success, two shell-eval-able lines (also appended to $GITHUB_OUTPUT
# and $GITHUB_ENV when set) so the caller can record provenance:
#     node_full=v24.19.0
#     node_sha256=<hex of the verified binary>

set -euo pipefail

dest="${1:?dest path is required}"
asset="${2:?fork asset name is required (e.g. node-x64)}"
version="${3:?version is required (e.g. v24.19.0)}"

fork_url="https://github.com/wekan/node/releases/download/${version}/${asset}"

mkdir -p "$(dirname "$dest")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Download the binary and its checksum. --retry survives transient 5xx/connection
# failures; a genuine 404 means the fork has not published node-<asset> for this
# version yet, which is fatal and named as such (the fork must release first).
if ! curl -fSL --retry 8 --retry-delay 15 -o "$dest" "$fork_url"; then
  echo "::error::Could not download ${fork_url} . The wekan/node fork must publish ${asset} for ${version} before this build; build it in wekan/node and re-run." >&2
  exit 1
fi
curl -fSL --retry 8 --retry-delay 15 -o "${work}/sum" "${fork_url}.sha256sum"

node_sha256="$(awk '{print $1; exit}' "${work}/sum")"
if [ -z "$node_sha256" ]; then
  echo "::error::${asset}.sha256sum from the fork is empty; cannot verify Node.js." >&2
  exit 1
fi
if command -v sha256sum >/dev/null 2>&1; then
  got="$(sha256sum "$dest" | cut -d' ' -f1)"
else
  got="$(shasum -a 256 "$dest" | cut -d' ' -f1)"   # macOS has no sha256sum
fi
if [ "$got" != "$node_sha256" ]; then
  echo "::error::${asset} does not match its published SHA256 (published ${node_sha256}, got ${got})." >&2
  exit 1
fi

# Windows keeps its .exe; everything else needs the exec bit.
case "$dest" in
  *.exe) : ;;
  *)     chmod +x "$dest" ;;
esac

echo "Embedded Node.js ${version} (${asset}) from the wekan/node fork, verified SHA256 ${node_sha256} -> ${dest}" >&2

printf 'node_full=%s\n' "$version"
printf 'node_sha256=%s\n' "$node_sha256"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  printf 'node_full=%s\n'   "$version"    >> "$GITHUB_OUTPUT"
  printf 'node_sha256=%s\n' "$node_sha256" >> "$GITHUB_OUTPUT"
fi
if [ -n "${GITHUB_ENV:-}" ]; then
  printf 'NODE_FULL=%s\n'   "$version"    >> "$GITHUB_ENV"
  printf 'NODE_SHA256=%s\n' "$node_sha256" >> "$GITHUB_ENV"
fi
