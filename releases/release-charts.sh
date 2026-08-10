#!/bin/bash

# Update and publish the WeKan Helm chart in the separate wekan/charts repo,
# checked out at .tools/charts (or the older ../w/charts).
#
# Usage:
#   ./releases/release-charts.sh 9.36
#
# Called automatically by ./releases/version.sh during a release, so both
# ./releases/release.sh and ./releases/release-all.sh keep the chart in sync,
# and by the charts jobs of release-all.yml and release-all-missing.yml.
#
# THE TWO BRANCHES. The charts repo keeps the chart SOURCE on `main` and the
# published packages plus index.yaml on `gh-pages`, and its own two scripts move
# between them: main's release.sh commits the source, tars `wekan/` into
# wekan-<version>.0.tgz, checks out gh-pages and drops the package there;
# gh-pages' release2.sh commits and pushes that branch and returns to main. This
# script drives both, and owns the index in between.
#
# What it does:
#   1. On the charts repo main branch, bump ONLY the WeKan version number in:
#        <charts>/wekan/Chart.yaml   - appVersion  (e.g. "9.36")
#                                    - version     (e.g. 9.36.0)
#        <charts>/wekan/values.yaml  - WeKan image tag (e.g. tag: v9.36)
#      Dependency versions (mongodb chart, mongodb image, etc.) are NOT changed.
#   2. Run <charts>/release.sh <version>: commit+push main, package
#      wekan-<version>.0.tgz, then `git checkout gh-pages` and move the .tgz into
#      the gh-pages working tree.
#   3. Check the package's own Chart.yaml agrees with its filename, then REBUILD
#      index.yaml from every package on gh-pages (releases/reindex-charts.py) -
#      rather than prepending a hand-edited copy of the previous entry, which is
#      where all four of the index's defects came from.
#   4. Run <charts>/release2.sh <version>: commit+push the gh-pages branch.

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: ./releases/release-charts.sh <wekan-version>"
  echo "Example: ./releases/release-charts.sh 9.36"
  exit 1
fi

VERSION="$1"                  # e.g. 9.36  (WeKan version, no v prefix)
CHART_VERSION="${VERSION}.0"  # e.g. 9.36.0  (chart SemVer + index version)

# The remote (GitHub Actions) flow sets CHARTS_DIR to the charts repo it checked
# out; otherwise it is resolved below.
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# .tools/charts first: companion repositories are cloned there (CLAUDE.md), which
# is where the wekan/charts checkout lives. ../w/charts stays as the older
# location so an existing checkout keeps working. The chart SOURCE is on the main
# branch, so `wekan/` is what says a checkout is really there - on gh-pages it is
# not, and a run from the wrong branch should say so rather than half-work.
if [ -z "${CHARTS_DIR:-}" ]; then
  for candidate in "$REPO_DIR/.tools/charts" "$REPO_DIR/../w/charts"; do
    if [ -d "$candidate" ]; then
      CHARTS_DIR="$(cd "$candidate" && pwd)"
      break
    fi
  done
fi
if [ -z "${CHARTS_DIR:-}" ]; then
  echo "Charts repo not found at $REPO_DIR/.tools/charts or $REPO_DIR/../w/charts, skipping chart release."
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

# ── 3. Rebuild the gh-pages index.yaml from the packages ─────────────────────
#
# The package is checked BEFORE it is indexed, because the one thing this step
# cannot recover from is a tarball whose name and contents disagree. charts'
# release.sh names the file from its argument (`tar -cvzf wekan-$1.0.tgz wekan`)
# while the version INSIDE comes from the Chart.yaml this script sed-ed a moment
# ago - so if those two ever drift, the repository gains a file called one
# version that declares another. That is not hypothetical: wekan-1.2.7.tgz
# (containing 1.2.6) and wekan-6.96.tgz (containing 6.9.6) are both in the
# repository's history, each colliding with the correctly named file of that
# version, and a Helm index keys on the version INSIDE, so neither could ever be
# installed under the name it was given.
TGZ="wekan-${CHART_VERSION}.tgz"
(
  cd "$CHARTS_DIR"
  if [ ! -f "$TGZ" ]; then
    echo "Error: expected packaged chart not found: $CHARTS_DIR/$TGZ" >&2
    exit 1
  fi
  inside="$(TGZ="$TGZ" python3 - <<'PYEOF'
import os, sys, tarfile, yaml
with tarfile.open(os.environ["TGZ"]) as tar:
    members = [m for m in tar.getnames()
               if m.count("/") == 1 and m.endswith("/Chart.yaml")]
    if not members:
        sys.exit("no <chart>/Chart.yaml in the package")
    with tar.extractfile(members[0]) as fh:
        print(yaml.safe_load(fh.read()).get("version", ""))
PYEOF
)"
  if [ "$inside" != "$CHART_VERSION" ]; then
    echo "Error: $TGZ declares chart version '${inside}', not '${CHART_VERSION}'." >&2
    echo "  The file name and its Chart.yaml disagree, so this package would be a" >&2
    echo "  second copy of ${inside} under a misleading name - which is how" >&2
    echo "  wekan-1.2.7.tgz and wekan-6.96.tgz came to exist. Not indexing it." >&2
    exit 1
  fi
)

# The index is DERIVED from the packages, never edited in place.
#
# It used to be edited: the newest entry was copied, a few fields substituted,
# and the result PREPENDED. Every one of the index's four defects came from that.
# Re-running a release prepended a second entry for the same version instead of
# replacing it (9.36.0 ended up with four, each with a different digest and the
# same url, so a helm client could pick a digest matching no file). appVersion
# was set to the CHART version rather than the WeKan version, on every entry. The
# fields nobody substituted never changed, so every entry claimed the mongodb
# subchart was 0.7.2 while the packages had moved to 0.7.6. And a release whose
# charts job did not run left a hole nothing ever went back for - 146 packages
# had no entry at all.
#
# Deriving it from the packages makes all four impossible rather than fixed:
# one entry per package, its digest computed from the file, its fields read out
# of the archive, and any package that was missed picked up on the next run.
"$REPO_DIR/releases/reindex-charts.py" --write --charts-dir "$CHARTS_DIR"

# ── 4. Commit and push the gh-pages branch ───────────────────────────────────
( cd "$CHARTS_DIR" && ./release2.sh "$VERSION" )

echo "=== Helm chart v$VERSION published ==="
