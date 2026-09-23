#!/usr/bin/env bash
# Install the npm version selected in the checked-out release's Dockerfile.
set -euo pipefail
release_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
version="$(sed -nE 's/.*NPM_VERSION=([0-9]+\.[0-9]+\.[0-9]+).*/\1/p' "$release_dir/../Dockerfile")"
[[ "$version" =~ ^12\.[0-9]+\.[0-9]+$ ]] || {
  echo 'Error: missing or unsupported release npm version in Dockerfile.' >&2
  exit 1
}
bash "$release_dir/npm-retry.sh" npm install --global "npm@$version"
