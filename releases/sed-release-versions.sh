#!/bin/bash

# Update WeKan version number across release files.
#
# Each file uses a context-specific pattern so that only the WeKan version
# is replaced, leaving unrelated numbers (npm package versions, CSS values,
# Node.js versions, MongoDB versions, port numbers, etc.) untouched.
#
# Usage:
#   ./releases/sed-release-versions.sh 8.42 8.43

if [ $# -ne 2 ]; then
  echo "Syntax with Wekan current-version new-version:"
  echo "  ./releases/sed-release-versions.sh 8.42 8.43"
  exit 1
fi

OLD="$1"
NEW="$2"
OLD_NO_DOTS=$(echo "$OLD" | tr -d '.')
NEW_NO_DOTS=$(echo "$NEW" | tr -d '.')

sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

# package.json and package-lock.json
#   WeKan's own version entry always has a "v" prefix: "version": "v8.42.0"
#   npm dependency versions never use a "v" prefix, so this pattern is WeKan-specific.
#   The patch component (\1) is preserved as-is.
sedi 's|"version": "v'"$OLD"'\.\([0-9]*\)"|"version": "v'"$NEW"'.\1"|g' \
  package.json package-lock.json

# Stackerfile.yml
#   appVersion field uses the same "v" prefix format.
sedi 's|appVersion: "v'"$OLD"'\.\([0-9]*\)"|appVersion: "v'"$NEW"'.\1"|g' \
  Stackerfile.yml

# Dockerfile
#   Only the ARG VERSION line is updated. All other ENV values
#   (Node.js version, npm version, etc.) are left untouched.
sedi "s|ARG VERSION=$OLD|ARG VERSION=$NEW|g" Dockerfile

# snapcraft.yaml
#   Three distinct WeKan-specific patterns, each too narrow to match
#   MongoDB, Node.js, Caddy, or other tool versions present in the file:
#     1. The snap version: field (anchored to start of line)
#     2. WeKan bundle filenames: wekan-8.42-<arch>.zip
#     3. GitHub release URL path: /releases/download/v8.42/
sedi "s|^version: '$OLD'|version: '$NEW'|" snapcraft.yaml
sedi "s|wekan-$OLD-|wekan-$NEW-|g" snapcraft.yaml
sedi "s|/v$OLD/|/v$NEW/|g" snapcraft.yaml

# docs/Platforms/Propietary/Windows/Offline.md
#   Same URL patterns as snapcraft.yaml. The file also contains
#   MongoDB (7.0.31) and Node.js (14.x) version numbers which
#   do not match either pattern.
sedi "s|wekan-$OLD-|wekan-$NEW-|g" \
  docs/Platforms/Propietary/Windows/Offline.md
sedi "s|/v$OLD/|/v$NEW/|g" \
  docs/Platforms/Propietary/Windows/Offline.md

# sandstorm-pkgdef.capnp
#   Two separate fields, each with a unique surrounding context:
#     1. appVersion integer (no dots): "appVersion = 842,"
#     2. appMarketingVersion string: "8.42.0~<date>" — the tilde is the
#        Sandstorm date separator and never appears in other version strings.
sedi "s|appVersion = $OLD_NO_DOTS,|appVersion = $NEW_NO_DOTS,|g" \
  sandstorm-pkgdef.capnp
sedi 's|"'"$OLD"'\.0~|"'"$NEW"'.0~|g' sandstorm-pkgdef.capnp
