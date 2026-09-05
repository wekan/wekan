#!/bin/bash

# Write the machine-readable version manifest and the identical plain-text block
# on the install page. release-website.sh (GitHub Actions) and version.sh (the
# maintainer's local release path) both call this one implementation.

set -euo pipefail

WEBDIR="${1:?website directory required}"
WEKANREPODIR="${2:?WeKan repository directory required}"
WEKAN_VERSION="${3:?WeKan version required}"

DOCKER_WEKAN_VERSION="$(sed -n 's/^ARG VERSION=//p' "$WEKANREPODIR/Dockerfile" | head -1)"
# .meteor/release is the canonical framework pin used by the actual build. The
# Dockerfile repeats it as runtime metadata, but reading that copy here allowed
# version.txt to advertise an old prerelease when the two files drifted.
METEOR_VERSION="$(sed -n 's/^METEOR@//p' "$WEKANREPODIR/.meteor/release" | head -1 | tr -d '\r')"
NODE_VERSION="$(sed -n 's/.*NODE_VERSION=v\([^ \\]*\).*/\1/p' "$WEKANREPODIR/Dockerfile" | head -1)"
NPM_VERSION="$(sed -n 's/.*NPM_VERSION=\([^ \\]*\).*/\1/p' "$WEKANREPODIR/Dockerfile" | tr -d '"' | head -1)"
FERRETDB_VERSION="${FERRETDB_VERSION:-$(bash "$WEKANREPODIR/releases/ferretdb-latest-tag.sh")}"
FERRETDB_VERSION="${FERRETDB_VERSION#v}"
WEKAN_VERSION="${WEKAN_VERSION#v}"

if [ "$DOCKER_WEKAN_VERSION" != "$WEKAN_VERSION" ]; then
  echo "Error: release version $WEKAN_VERSION does not match Dockerfile VERSION $DOCKER_WEKAN_VERSION" >&2
  exit 1
fi

for pair in \
  "WeKan:$WEKAN_VERSION" \
  "FerretDB:$FERRETDB_VERSION" \
  "Meteor:$METEOR_VERSION" \
  "Node:$NODE_VERSION" \
  "NPM:$NPM_VERSION"
do
  label="${pair%%:*}"
  version="${pair#*:}"
  if ! printf '%s' "$version" | grep -Eq '^[0-9]+\.[0-9]+(\.[0-9]+)?([-+][0-9A-Za-z.-]+)?$'; then
    echo "Error: invalid or unavailable $label version: $version" >&2
    exit 1
  fi
done

manifest="WeKan $WEKAN_VERSION
FerretDB $FERRETDB_VERSION
Meteor $METEOR_VERSION
Node $NODE_VERSION
NPM $NPM_VERSION"
printf '%s\n' "$manifest" > "$WEBDIR/version.txt"

VERSION_MANIFEST="$manifest" python3 - "$WEBDIR/install/index.html" <<'PY'
import os
import pathlib
import re
import sys

page = pathlib.Path(sys.argv[1])
text = page.read_text()
replacement = '<pre id="version-info">' + os.environ['VERSION_MANIFEST'] + '</pre>'
updated, count = re.subn(
    r'<pre id="version-info">.*?</pre>', replacement, text,
    count=1, flags=re.DOTALL)
if count == 0:
    updated, count = re.subn(
        r'(<h2[^>]*>.*?<span class="version-number">.*?</span></h2>)',
        r'\1\n     ' + replacement, text, count=1, flags=re.DOTALL)
if count != 1:
    raise SystemExit(f'Error: {page} has no unique version heading or block')
page.write_text(updated)
PY

grep -qxF "WeKan $WEKAN_VERSION" "$WEBDIR/version.txt"
grep -qF '<pre id="version-info">WeKan ' "$WEBDIR/install/index.html"
echo "Updated $WEBDIR/version.txt and install/index.html version information."
