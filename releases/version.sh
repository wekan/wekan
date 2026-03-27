#!/bin/bash
# Change version.
# Usage:   ./releases/version.sh old new
# Example: ./releases/version.sh v3.x v3.x

if [ "$#" -ne 2 ]; then
  echo "Usage: ./releases/version.sh <old_version> <new_version>"
  exit 1
fi

sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

sedi "s|API $1|API $2|g" public/api/wekan*
sedi "s|\"version\": \"$1|\"version\": \"$2|g" .meteor-1.6-snap/package-lock.json .meteor-1.6-snap/package.json package-lock.json package.json
sedi "s|appVersion: \"$1|appVersion: \"$2|g" Stackerfile.yml

echo "Also change CHANGELOG.md and sandstorm-pkgdef.capnp"
