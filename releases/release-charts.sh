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
#      Nothing else is touched, and everything else is what makes the chart what
#      it is: since charts#54/#55 the database is FerretDB
#      (ghcr.io/wekan/ferretdb:latest, `tag: latest`, which the version sed below
#      cannot match), installed by the chart's own
#      templates/ferretdb-{statefulset,service}.yaml. So a release publishes
#      whatever is on the charts repo's main branch, with this release's numbers
#      on it - which is how the FerretDB chart reaches people: in a release.
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
export REPO_DIR
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

# ── 0. Is there an image for this version to point AT? ───────────────────────
#
# A chart is a pointer to a container image, so publishing one for a version
# whose image was never pushed produces a chart that installs and then fails at
# the pull - and Artifact Hub, which scans every entry in the index, reports it
# as an error against the whole repository:
#
#   error scanning image ghcr.io/wekan/wekan:v9.62: image not found
#
# Six versions are in that state already (v8.30, v9.12, v9.14, v9.38, v9.39,
# v9.62 - releases whose own docker job failed), and they had to be taken back
# out of the index by hand. One request stops the seventh. In a full release the
# charts job runs after `docker` has pushed the image, so this passes; it is the
# out-of-band paths - release-all-missing.yml, and running this by hand - where a
# version can have no image at all.
#
# A registry that cannot be reached is NOT taken as "no image": the check has to
# be sure before it stops a release.
# PYTHONDONTWRITEBYTECODE: the check imports releases/reindex-charts.py, and
# importing a module writes releases/__pycache__ beside it - untracked junk
# appearing in the repository on every release.
if ! PYTHONDONTWRITEBYTECODE=1 python3 - "$VERSION" <<'PYEOF'
import importlib.util, os, sys
spec = importlib.util.spec_from_file_location(
    "reindex", os.path.join(os.environ["REPO_DIR"], "releases", "reindex-charts.py"))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
host, repo, tag = mod.split_image(None, "ghcr.io/wekan/wekan", "v" + sys.argv[1])
verdict = mod.image_exists(host, repo, tag)
if verdict is False:
    sys.exit(1)
if verdict is None:
    print(f"  Could not reach the registry to check ghcr.io/wekan/wekan:v{sys.argv[1]};"
          " continuing.")
PYEOF
then
  echo "Error: ghcr.io/wekan/wekan:v${VERSION} does not exist." >&2
  echo "  A chart for it would install and then fail at the image pull, and" >&2
  echo "  Artifact Hub would report it as a scan error against wekan/charts." >&2
  echo "  Publish the image first (the docker job), then run this again." >&2
  exit 1
fi


# ── 1. Bump only the WeKan version numbers on the main branch ────────────────
( cd "$CHARTS_DIR" && git checkout main && git pull )

# Chart.yaml: appVersion is anchored at column 0, and so is the chart's own
# version. The anchor matters for any INDENTED "version:" - a dependency's, if
# one is ever added back (the MongoDB dependency this was written for is gone
# since charts#54).
sedi -E "s|^appVersion: \"[^\"]*\"|appVersion: \"${VERSION}\"|" "$CHART_YAML"
sedi -E "s|^version: [0-9]+\.[0-9]+\.[0-9]+|version: ${CHART_VERSION}|" "$CHART_YAML"

# values.yaml: only the WeKan container image tag (tag: v<digits>). Every other
# image in the chart is pinned to "tag: latest" - FerretDB and the busybox init
# and test images - and this pattern cannot match those, which is what keeps
# ghcr.io/wekan/ferretdb:latest out of a WeKan version bump.
sedi -E "s|tag: v[0-9]+\.[0-9]+(\.[0-9]+)?|tag: v${VERSION}|" "$CHART_VALUES"

# ── 1b. What is NEW in this chart version, written into the chart ────────────
#
# A chart version with no changelog is a version nobody can tell apart from the
# one before it. Artifact Hub reads two annotations for that, and both are
# written here rather than by hand, because both are release facts:
#
#   artifacthub.io/changes  what this version is - "WeKan updated to v<version>"
#                           with a link to that release's own notes, so the chart
#                           page says what the release said.
#   artifacthub.io/images   the images this chart runs, with the exact tags. The
#                           scanner uses this list instead of inferring one, and
#                           an inferred list is what produced
#                             error scanning image ghcr.io/wekan/ferretdb:latest
#                           for an image that is not anonymously pullable. What
#                           is declared here is what the chart actually pulls.
#
# Both are rewritten every release, so they can never describe the version before
# this one. The FerretDB image is read out of values.yaml rather than repeated,
# so changing it there changes it here too.
CHART_YAML="$CHART_YAML" CHART_VALUES="$CHART_VALUES" VERSION="$VERSION" \
  CHART_VERSION="$CHART_VERSION" PYTHONDONTWRITEBYTECODE=1 python3 - <<'PYEOF'
import os, re

chart_path = os.environ["CHART_YAML"]
values_path = os.environ["CHART_VALUES"]
version = os.environ["VERSION"]
chart_version = os.environ["CHART_VERSION"]

# The database image as values.yaml has it - repository and tag, in the ferretdb
# section. Read, never assumed: the whole point of declaring images is that the
# declaration matches what is pulled.
values = open(values_path, encoding="utf-8").read()
ferret = values[values.index("\nferretdb:"):]
repo = re.search(r"^    repository: (\S+)", ferret, re.M)
tag = re.search(r"^    tag: (\S+)", ferret, re.M)
ferret_image = f"{repo.group(1)}:{tag.group(1)}" if repo and tag else None

block = [
    "annotations:",
    "  artifacthub.io/changes: |",
    "    - kind: changed",
    f"      description: WeKan updated to v{version}",
    "      links:",
    "        - name: Release notes",
    f"          url: https://github.com/wekan/wekan/releases/tag/v{version}",
    "        - name: CHANGELOG",
    "          url: https://github.com/wekan/wekan/blob/main/CHANGELOG.md",
    "  artifacthub.io/images: |",
    "    - name: wekan",
    f"      image: ghcr.io/wekan/wekan:v{version}",
]
if ferret_image:
    block += ["    - name: ferretdb", f"      image: {ferret_image}"]
block = "\n".join(block) + "\n"

lines = open(chart_path, encoding="utf-8").read().split("\n")
out, i, replaced = [], 0, False
while i < len(lines):
    if lines[i].startswith("annotations:"):
        # Skip the old block: it and everything indented under it.
        i += 1
        while i < len(lines) and (lines[i].startswith((" ", "\t")) or not lines[i].strip()):
            if lines[i].strip() and not lines[i].startswith((" ", "\t")):
                break
            i += 1
        out.append(block.rstrip("\n"))
        replaced = True
        continue
    out.append(lines[i])
    i += 1
if not replaced:
    # Keep the file's shape: annotations go after apiVersion/appVersion, which is
    # where helm's own `helm create` puts them.
    at = next((k for k, l in enumerate(out) if l.startswith("description:")), len(out))
    out[at:at] = block.rstrip("\n").split("\n")
open(chart_path, "w", encoding="utf-8").write("\n".join(out))
print(f"  Chart.yaml annotations: changes + images for v{version}"
      + (f" (ferretdb {ferret_image})" if ferret_image else ""))
PYEOF

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
