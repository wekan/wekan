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
version="${3:?version is required (a full tag v24.19.0, or a bare major 24)}"

# The caller passes the pinned Node MAJOR ($NODE_VERSION is '24'), but the fork
# tags its releases by full version (v24.19.0). Resolve a bare major to the newest
# fork tag v<major>.x that actually carries this asset; a full tag (with or
# without the leading v) is used as given. Without this the URL would be
# .../releases/download/24/node-x64 , which 404s.
case "$version" in
    v[0-9]*.[0-9]*.[0-9]*) : ;;                       # already a full tag
    [0-9]*.[0-9]*.[0-9]*)  version="v$version" ;;     # full version, add the v
    [0-9]*)                                            # a bare major - resolve it
        gh_auth=()
        [ -n "${GITHUB_TOKEN:-}" ] && gh_auth=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
        releases_json="$(curl -fsSL "${gh_auth[@]}" \
            "https://api.github.com/repos/wekan/node/releases?per_page=100" 2>/dev/null || true)"
        resolved="$(printf '%s' "$releases_json" | python3 -c "
import json,sys
major='v${version}.'
asset='${asset}'
def key(t):
    try: return [int(x) for x in t.lstrip('v').split('.')[:3]]
    except Exception: return [0,0,0]
tags=[r['tag_name'] for r in json.load(sys.stdin)
      if r.get('tag_name','').startswith(major)
      and any(a.get('name')==asset for a in r.get('assets',[]))]
print(sorted(set(tags), key=key, reverse=True)[0] if tags else '')
" 2>/dev/null || true)"
        if [ -z "$resolved" ]; then
            echo "::error::The wekan/node fork has no '${asset}' in any ${version}.x release. WeKan takes its Node.js only from the fork, so build ${asset} in wekan/node (the release-all-missing workflow) and attach it to a v${version}.x release, then re-run." >&2
            exit 1
        fi
        version="$resolved"
        ;;
esac

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
# The checksum sidecar. It is a belt-and-suspenders integrity check ON TOP of the
# already-authenticated HTTPS download from the fork, so a MISSING one is a
# warning, not a failure: some fork build steps have published the binary without
# its node-<asset>.sha256sum yet (e.g. win64), and the bundle should still ship
# rather than fail the whole release over a missing side file. A checksum that IS
# present and does NOT match is still fatal - that is a corrupted/wrong file.
# (check-arch-binaries.sh treats a missing fork checksum the same way.)
node_sha256=""
if curl -fSL --retry 8 --retry-delay 15 -o "${work}/sum" "${fork_url}.sha256sum" 2>/dev/null; then
  node_sha256="$(awk '{print $1; exit}' "${work}/sum")"
fi
if [ -n "$node_sha256" ]; then
  if command -v sha256sum >/dev/null 2>&1; then
    got="$(sha256sum "$dest" | cut -d' ' -f1)"
  else
    got="$(shasum -a 256 "$dest" | cut -d' ' -f1)"   # macOS has no sha256sum
  fi
  if [ "$got" != "$node_sha256" ]; then
    echo "::error::${asset} does not match its published SHA256 (published ${node_sha256}, got ${got})." >&2
    exit 1
  fi
  verified="verified SHA256 ${node_sha256}"
else
  echo "::warning::the wekan/node fork publishes no ${asset}.sha256sum for ${version} yet, so this Node.js is shipped UNVERIFIED (it still came over HTTPS from the fork). Publish the checksum beside ${asset} in wekan/node to enable verification." >&2
  verified="UNVERIFIED (no published .sha256sum)"
fi

# Windows keeps its .exe; everything else needs the exec bit.
case "$dest" in
  *.exe) : ;;
  *)     chmod +x "$dest" ;;
esac

echo "Embedded Node.js ${version} (${asset}) from the wekan/node fork, ${verified} -> ${dest}" >&2

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
