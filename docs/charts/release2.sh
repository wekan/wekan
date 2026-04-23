#!/bin/bash
# Usage: ./release2.sh <version> (e.g. 8.99)
set -e

if [ $# -ne 1 ]; then
  echo "Syntax: ./release2.sh <version> (e.g. 8.99)"
  exit 1
fi

VERSION="$1"
CHARTS_DIR="$(dirname "$0")"
ARCHIVE="$CHARTS_DIR/wekan-$VERSION.0.tgz"
INDEX_FILE="$CHARTS_DIR/index.yaml"

if [ ! -f "$ARCHIVE" ]; then
  echo "Archive $ARCHIVE not found!"
  exit 1
fi

# Generate sha256sum
SHA256=$(sha256sum "$ARCHIVE" | awk '{print $1}')

# Get Finland time
CREATED=$(TZ='Europe/Helsinki' date '+%Y-%m-%dT%H:%M:%S.000000000%:z')

# Update index.yaml: copy topmost entry, update version, created, digest, urls
if [ -f "$INDEX_FILE" ]; then
  awk '/^- apiVersion: v2/{flag=1;print;next}/^- apiVersion: v2/{flag=0}flag' "$INDEX_FILE" | head -n 30 > /tmp/topentry.yaml
  sed -i "s/appVersion: .*/appVersion: \"$VERSION\"/" /tmp/topentry.yaml
  sed -i "s/created: .*/created: \"$CREATED\"/" /tmp/topentry.yaml
  sed -i "s/digest: .*/digest: $SHA256/" /tmp/topentry.yaml
  sed -i "s|urls:.*|urls:\n    - https://wekan.github.io/wekan/wekan-$VERSION.0.tgz|" /tmp/topentry.yaml
  sed -i "s/version: .*/version: $VERSION.0/" /tmp/topentry.yaml
  awk 'NR==1{print;system("cat /tmp/topentry.yaml");next} /^  - apiVersion: v2/ && !p{p=1;next} 1' "$INDEX_FILE" > /tmp/index.yaml
  mv /tmp/index.yaml "$INDEX_FILE"
  rm /tmp/topentry.yaml
else
  echo "index.yaml not found, skipping index update."
fi

echo "Manual release $VERSION.0: sha256: $SHA256, index.yaml updated."
