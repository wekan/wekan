#!/bin/bash

# Update and publish the WeKan Helm chart in the separate wekan/charts repo,
# which lives at ../w/charts (a sibling of the wekan repo).
#
# Usage:
#   ./releases/release-charts.sh 9.36
#
# Called automatically by ./releases/version.sh during a release, so both
# ./releases/release.sh and ./releases/release-all.sh keep the chart in sync.
#
# What it does:
#   1. On the charts repo main branch, bump ONLY the WeKan version number in:
#        ../w/charts/wekan/Chart.yaml   - appVersion  (e.g. "9.36")
#                                       - version     (e.g. 9.36.0)
#        ../w/charts/wekan/values.yaml  - WeKan image tag (e.g. tag: v9.36)
#      Dependency versions (mongodb chart, mongodb image, etc.) are NOT changed.
#   2. Run ../w/charts/release.sh <version>: helm dependency build, commit+push
#      main, package wekan-<version>.0.tgz, then `git checkout gh-pages` and move
#      the .tgz into the gh-pages working tree.
#   3. Prepend a new chart entry to gh-pages index.yaml: current datetime, the
#      sha256sum of wekan-<version>.0.tgz, and the new version/urls (the rest is
#      copied from the previous newest entry).
#   4. Run ../w/charts/release2.sh <version>: commit+push the gh-pages branch.

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: ./releases/release-charts.sh <wekan-version>"
  echo "Example: ./releases/release-charts.sh 9.36"
  exit 1
fi

VERSION="$1"                  # e.g. 9.36  (WeKan version, no v prefix)
CHART_VERSION="${VERSION}.0"  # e.g. 9.36.0  (chart SemVer + index version)

# The remote (GitHub Actions) flow sets CHARTS_DIR to the charts repo it checked
# out; otherwise resolve it as a sibling of the wekan repo: <repo>/../w/charts.
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -z "${CHARTS_DIR:-}" ]; then
  if [ ! -d "$REPO_DIR/../w/charts/wekan" ]; then
    echo "Charts repo not found at $REPO_DIR/../w/charts/wekan, skipping chart release."
    exit 0
  fi
  CHARTS_DIR="$(cd "$REPO_DIR/../w/charts" && pwd)"
elif [ ! -d "$CHARTS_DIR/wekan" ]; then
  echo "Charts repo not found at $CHARTS_DIR/wekan, skipping chart release."
  exit 0
fi

sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

CHART_YAML="$CHARTS_DIR/wekan/Chart.yaml"
CHART_VALUES="$CHARTS_DIR/wekan/values.yaml"

echo "=== Helm chart release: WeKan v$VERSION (chart $CHART_VERSION) ==="

# ── 1. Bump only the WeKan version numbers on the main branch ────────────────
( cd "$CHARTS_DIR" && git checkout main && git pull )

# Chart.yaml: appVersion (app version) is anchored at column 0; the chart's own
# version is also at column 0, so the indented mongodb dependency "version:" is
# left untouched.
sedi -E "s|^appVersion: \"[^\"]*\"|appVersion: \"${VERSION}\"|" "$CHART_YAML"
sedi -E "s|^version: [0-9]+\.[0-9]+\.[0-9]+|version: ${CHART_VERSION}|" "$CHART_YAML"

# values.yaml: only the WeKan container image tag (tag: v<digits>). The mongodb
# image tag (e.g. 7.0.34) and any "tag: latest" are left unchanged.
sedi -E "s|tag: v[0-9]+\.[0-9]+(\.[0-9]+)?|tag: v${VERSION}|" "$CHART_VALUES"

echo "  Updated Chart.yaml (appVersion ${VERSION}, version ${CHART_VERSION}) and values.yaml (tag v${VERSION})."

# ── 2. Build, commit+push main, package, and switch to gh-pages ──────────────
( cd "$CHARTS_DIR" && ./release.sh "$VERSION" )

# ── 3. Add the new chart to the gh-pages index.yaml ──────────────────────────
TGZ="wekan-${CHART_VERSION}.tgz"
(
  cd "$CHARTS_DIR"
  if [ ! -f "$TGZ" ]; then
    echo "Error: expected packaged chart not found: $CHARTS_DIR/$TGZ" >&2
    exit 1
  fi
  # A Helm index digest is the bare sha256 hash. `sha256sum` prints
  # "<hash>  <filename>", so keep only the first field — otherwise the filename
  # leaks into the digest value (digest: <hash>  wekan-<ver>.tgz).
  DIGEST="$(sha256sum "$TGZ" | awk '{print $1}')"

  CHART_VERSION="$CHART_VERSION" DIGEST="$DIGEST" python3 - <<'PYEOF'
import os, re, sys
from datetime import datetime, timezone

chart_version = os.environ["CHART_VERSION"]
digest        = os.environ["DIGEST"].strip()
url     = f"https://wekan.github.io/charts/wekan-{chart_version}.tgz"
created = datetime.now(timezone.utc).astimezone().isoformat()

path = "index.yaml"
with open(path, encoding="utf-8") as f:
    lines = f.readlines()

# Clean up legacy entries whose digest still carries the "<hash>  <filename>"
# form (older releases stored the raw `sha256sum` output): keep only the hash.
digest_re = re.compile(r'^(\s*digest:\s+)([0-9a-fA-F]+)\b.*$')
lines = [digest_re.sub(r'\1\2', ln) if digest_re.match(ln) else ln for ln in lines]

# Locate the "  wekan:" entries header; the newest entry is the first list item.
hdr = next((i for i, ln in enumerate(lines) if ln.rstrip("\n") == "  wekan:"), None)
if hdr is None:
    sys.exit("Could not find '  wekan:' in index.yaml")

start = hdr + 1
if start >= len(lines) or not lines[start].startswith("  - "):
    sys.exit("Unexpected index.yaml format: no chart entry after '  wekan:'")

# The entry runs until the next list item ("  - ") or a dedent to a top-level key.
end = len(lines)
for j in range(start + 1, len(lines)):
    s = lines[j]
    if s.startswith("  - ") or (s.strip() and not s.startswith("   ")):
        end = j
        break
block = lines[start:end]

def set_field(block, key, value):
    pat = re.compile(r'^(    ' + re.escape(key) + r': ).*$')
    out, done = [], False
    for ln in block:
        if not done and pat.match(ln):
            out.append(f"    {key}: {value}\n")
            done = True
        else:
            out.append(ln)
    return out

block = set_field(block, "appVersion", f'"{chart_version}"')
block = set_field(block, "created", f'"{created}"')
block = set_field(block, "digest", digest)
block = set_field(block, "version", chart_version)

# Update the chart download URL (distinct from the github.com source URL).
out, done = [], False
for ln in block:
    if not done and re.match(r'^    - https://wekan\.github\.io/charts/wekan-.*\.tgz\s*$', ln):
        out.append(f"    - {url}\n")
        done = True
    else:
        out.append(ln)
block = out

# Insert as the new newest (top) entry, right after the "  wekan:" header.
with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines[:start] + block + lines[start:])

print(f"  Prepended chart {chart_version} to index.yaml (created {created}).")
PYEOF
)

# ── 4. Commit and push the gh-pages branch ───────────────────────────────────
( cd "$CHARTS_DIR" && ./release2.sh "$VERSION" )

echo "=== Helm chart v$VERSION published ==="
