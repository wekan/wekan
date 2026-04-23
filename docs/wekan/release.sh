#!/bin/bash
# Usage: ./release.sh <version> (e.g. 8.99)
set -e

if [ $# -ne 1 ]; then
  echo "Syntax: ./release.sh <version> (e.g. 8.99)"
  exit 1
fi

VERSION="$1"
CHART_PATH="$(dirname "$0")"
CHART_FILE="$CHART_PATH/Chart.yaml"
VALUES_FILE="$CHART_PATH/values.yaml"
CHARTS_DIR="$(dirname "$CHART_PATH")/charts"
INDEX_FILE="$CHARTS_DIR/index.yaml"

# Update Chart.yaml (appVersion and version)
sed -i "s/^appVersion: .*/appVersion: \"$VERSION\"/" "$CHART_FILE"
sed -i "s/^version: .*/version: $VERSION.0/" "$CHART_FILE"

# Update values.yaml (image.tag)
sed -i "s/^  tag: v.*/  tag: v$VERSION/" "$VALUES_FILE"

# Helm dependency update/build
cd "$CHART_PATH"
helm repo add mongo https://groundhog2k.github.io/helm-charts/ || true
helm dependency update
helm dependency build

# Package chart
cd "$CHARTS_DIR"
helm package "$CHART_PATH" -d .
ARCHIVE="wekan-$VERSION.0.tgz"

# Generate sha256sum
SHA256=$(sha256sum "$ARCHIVE" | awk '{print $1}')

# Get Finland time
CREATED=$(TZ='Europe/Helsinki' date '+%Y-%m-%dT%H:%M:%S.000000000%:z')

# Update index.yaml: copy topmost entry, update version, created, digest, urls
if [ -f "$INDEX_FILE" ]; then
  # Extract top entry (after 'wekan:')
  awk '/^- apiVersion: v2/{flag=1;print;next}/^- apiVersion: v2/{flag=0}flag' "$INDEX_FILE" | head -n 30 > /tmp/topentry.yaml
  # Update fields
  sed -i "s/appVersion: .*/appVersion: \"$VERSION\"/" /tmp/topentry.yaml
  sed -i "s/created: .*/created: \"$CREATED\"/" /tmp/topentry.yaml
  sed -i "s/digest: .*/digest: $SHA256/" /tmp/topentry.yaml
  sed -i "s|urls:.*|urls:\n    - https://wekan.github.io/wekan/wekan-$VERSION.0.tgz|" /tmp/topentry.yaml
  sed -i "s/version: .*/version: $VERSION.0/" /tmp/topentry.yaml
  # Insert new entry at top
  awk 'NR==1{print;system("cat /tmp/topentry.yaml");next} /^  - apiVersion: v2/ && !p{p=1;next} 1' "$INDEX_FILE" > /tmp/index.yaml
  mv /tmp/index.yaml "$INDEX_FILE"
  rm /tmp/topentry.yaml
else
  echo "index.yaml not found, skipping index update."
fi

echo "Release $VERSION.0 created, sha256: $SHA256, index.yaml updated."

