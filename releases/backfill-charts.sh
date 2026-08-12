#!/usr/bin/env bash
#
# ── Catch the Helm chart repo up with the WeKan releases that exist ──────────
#
# The wekan/charts gh-pages index lists one chart per WeKan release. It is
# written one entry at a time by releases/release-charts.sh, during a release -
# so a release whose `charts` job did not run leaves a hole, and the hole is
# permanent: the next release adds ITS entry and never looks back. v10.80 is one
# (its charts job was skipped when a cancelled build-mac-x64 cancelled the run),
# and it is not the only one - 474 of the 690 WeKan releases have no chart entry.
#
# This script closes the gap from the outside, and is the answer to "which WeKan
# releases should the index list?": the ones that EXIST AND CAN BE INSTALLED.
#
#   keep   - a chart package is already published for it. Never rebuilt: the
#            published .tgz and its digest are what people's helm clients have
#            already seen, and repackaging changes the digest for no reason.
#   build  - the release exists, its container image exists, and no chart is
#            published. This is the hole to fill.
#   omit   - the release exists but its container image DOES NOT. A chart is a
#            pointer to an image (`tag: v<version>`), so an entry for a version
#            with no image is an install that fails at the pull. Those releases
#            are LEFT OUT of the index rather than listed and broken - most are
#            releases whose own docker job failed, which is exactly why there is
#            no chart for them either.
#
# The index is then REBUILT from the .tgz files that are actually in the
# directory, by releases/reindex-charts.py - which asks the registry about every
# image each package pins and leaves out the ones whose image is gone. So
# "omitted" needs no bookkeeping: a version with no package is simply not in the
# index, an entry can never point at a package that is not there, and a package
# whose image has been deleted since cannot come back into the index by being
# indexed again.
#
# Usage:
#   ./releases/backfill-charts.sh              # PLAN ONLY - prints what it would do
#   ./releases/backfill-charts.sh --apply      # package the missing charts, rebuild index.yaml
#   ./releases/backfill-charts.sh --apply --push
#
# Without --apply nothing is written, and the plan needs no helm - only curl and
# python3 - so it can be read anywhere. --apply needs helm and a charts checkout,
# and even then it does NOT push unless --push is given: rewriting a live Helm
# repository's index is the maintainer's call, not a side effect of a dry run.
#
# CHARTS_DIR points at the wekan/charts checkout, as in release-charts.sh; it
# defaults to ../w/charts beside this repo.

set -euo pipefail

APPLY=false
PUSH=false
LIMIT=0
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    --push)  PUSH=true ;;
    --limit=*) LIMIT="${arg#--limit=}" ;;
    -h|--help)
      sed -n '2,45p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "backfill-charts.sh: unknown argument '$arg'" >&2
      exit 1 ;;
  esac
done

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CHART_BASE_URL="https://wekan.github.io/charts"

# .tools/charts first: companion repositories are kept under .tools/ (CLAUDE.md),
# which is where the wekan/charts clone lives. ../w/charts stays as the older
# location, so an existing checkout there keeps working.
if [ -z "${CHARTS_DIR:-}" ]; then
  for candidate in "$REPO_DIR/.tools/charts" "$REPO_DIR/../w/charts"; do
    if [ -d "$candidate" ]; then
      CHARTS_DIR="$(cd "$candidate" && pwd)"
      break
    fi
  done
fi
if [ -z "${CHARTS_DIR:-}" ]; then
  echo "Charts repo not found at $REPO_DIR/.tools/charts or $REPO_DIR/../w/charts."
  echo "Set CHARTS_DIR to the wekan/charts checkout, or run with no --apply for a plan."
  [ "$APPLY" = true ] && exit 1
fi

# ── 1. The plan ──────────────────────────────────────────────────────────────
#
# Three questions, all answered over the network so the plan is about what is
# really published rather than what this checkout happens to contain:
#   which WeKan releases exist        - the GitHub releases API
#   which charts are published        - the live index.yaml
#   which container images exist      - ghcr.io's manifest endpoint
#
# The image check is the slow one (one request per release without a chart), so
# it is the only one that is concurrent, and a release is only asked about when
# its answer can change the outcome.
PLAN_JSON="$(mktemp)"
trap 'rm -f "$PLAN_JSON"' EXIT

CHART_BASE_URL="$CHART_BASE_URL" LIMIT="$LIMIT" python3 - "$PLAN_JSON" <<'PYEOF'
import json, os, re, sys, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor

out_path  = sys.argv[1]
base_url  = os.environ["CHART_BASE_URL"]
limit     = int(os.environ.get("LIMIT") or 0)

def get(url, headers=None, timeout=60):
    req = urllib.request.Request(url, headers=headers or {})
    return urllib.request.urlopen(req, timeout=timeout)

# Every WeKan release, newest first. Only vNN.MM tags: those are the releases a
# chart is ever cut for.
releases = []
for page in range(1, 20):
    with get(f"https://api.github.com/repos/wekan/wekan/releases?per_page=100&page={page}") as r:
        batch = json.load(r)
    if not batch:
        break
    releases += batch
versions = []
for rel in releases:
    m = re.fullmatch(r"v(\d+)\.(\d+)", rel.get("tag_name", ""))
    if m:
        versions.append((int(m.group(1)), int(m.group(2))))
versions = sorted(set(versions), reverse=True)
print(f"WeKan releases: {len(versions)}", file=sys.stderr)

# The charts already published, read from the live index.
try:
    with get(f"{base_url}/index.yaml") as r:
        index_text = r.read().decode("utf-8", "replace")
except urllib.error.HTTPError as e:
    sys.exit(f"cannot read {base_url}/index.yaml: HTTP {e.code}")
# EXACTLY four spaces. An entry's own `version:` is at that indent; the mongodb
# subchart's `version:` under `dependencies:` is at six, and a `\s*` here counts
# it as a published chart (0.7.2, 220 times over).
published = set(re.findall(r"^ {4}version:\s*(\d+\.\d+\.\d+)\s*$", index_text, re.M))
print(f"charts published: {len(published)}", file=sys.stderr)

# ghcr.io serves public manifests with an anonymous pull token.
with get("https://ghcr.io/token?scope=repository:wekan/wekan:pull&service=ghcr.io") as r:
    token = json.load(r)["token"]
ACCEPT = ",".join([
    "application/vnd.oci.image.index.v1+json",
    "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.docker.distribution.manifest.v2+json",
])

def image_exists(tag):
    req = urllib.request.Request(
        f"https://ghcr.io/v2/wekan/wekan/manifests/{tag}",
        headers={"Authorization": f"Bearer {token}", "Accept": ACCEPT},
        method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status == 200
    except urllib.error.HTTPError:
        return False
    except Exception:
        # A transport hiccup must not be read as "no image": that would OMIT a
        # release that has one. Unknown is reported and the release is left as
        # it is, which for a release with no chart means no chart this run.
        return None

# THE CHART THIS SCRIPT BUILDS IS TODAY'S CHART, and today's chart installs
# FerretDB (charts#54, charts#55). That is right for a release that shipped with
# FerretDB and wrong for one that did not: WeKan's own docker-compose.yml made
# FerretDB the default in v10.00 (commit 4dbf99010, released 2026-07-18), and a
# chart pairing a v6.09 image with FerretDB would be an install nobody has ever
# run, published under a version number that says it is that release's chart.
#
# So versions below the floor are left without a chart rather than given a
# plausible-looking one. It is not a statement that they cannot work - WeKan
# speaks the MongoDB wire protocol and FerretDB answers it - only that this
# script cannot reconstruct the chart those releases actually had, and inventing
# one is worse than the hole.
#
# Old ENTRIES are never touched either way: a version whose package is already
# published is "keep", and keep is never rebuilt.
FERRETDB_FLOOR = os.environ.get("CHART_FERRETDB_FLOOR", "10.00")
floor_key = tuple(int(x) for x in FERRETDB_FLOOR.split("."))

keep, candidates, predates = [], [], []
for major, minor in versions:
    ver = f"{major}.{minor:02d}"
    if f"{ver}.0" in published:
        keep.append(ver)
    elif (major, minor) < floor_key:
        predates.append(ver)
    else:
        candidates.append(ver)

if limit:
    candidates = candidates[:limit]

print(f"asking ghcr about {len(candidates)} releases with no chart ...", file=sys.stderr)
with ThreadPoolExecutor(max_workers=16) as ex:
    have_image = list(ex.map(lambda v: image_exists(f"v{v}"), candidates))

build   = [v for v, ok in zip(candidates, have_image) if ok is True]
omit    = [v for v, ok in zip(candidates, have_image) if ok is False]
unknown = [v for v, ok in zip(candidates, have_image) if ok is None]

with open(out_path, "w", encoding="utf-8") as fh:
    json.dump({"keep": keep, "build": build, "omit": omit, "unknown": unknown,
               "predates": predates, "floor": FERRETDB_FLOOR}, fh)
PYEOF

KEEP_N=$(jq '.keep   | length' "$PLAN_JSON")
BUILD_N=$(jq '.build  | length' "$PLAN_JSON")
OMIT_N=$(jq '.omit   | length' "$PLAN_JSON")
UNKNOWN_N=$(jq '.unknown | length' "$PLAN_JSON")
PREDATES_N=$(jq '.predates | length' "$PLAN_JSON")
FLOOR=$(jq -r '.floor' "$PLAN_JSON")

echo
echo "=== Helm chart backfill plan ==="
printf '  keep   %-5s chart already published; not rebuilt\n' "$KEEP_N"
printf '  build  %-5s release and image exist, no chart yet\n' "$BUILD_N"
printf '  omit   %-5s release exists but has NO container image, so a chart for it\n' "$OMIT_N"
printf '                would install and then fail at the image pull\n'
printf '  older  %-5s released before WeKan %s, when FerretDB became the default\n' "$PREDATES_N" "$FLOOR"
printf '                database. This script builds TODAY\x27s chart, which installs\n'
printf '                FerretDB, so those releases are left without one rather than\n'
printf '                given a chart nobody ever ran (CHART_FERRETDB_FLOOR overrides)\n'
[ "$UNKNOWN_N" != "0" ] && printf '  ?      %-5s ghcr did not answer; left alone this run\n' "$UNKNOWN_N"

echo
echo "  to build:"
jq -r '.build[]' "$PLAN_JSON" | head -40 | sed 's/^/    /'
[ "$BUILD_N" -gt 40 ] && echo "    ... and $((BUILD_N - 40)) more"
echo "  omitted (no image):"
jq -r '.omit[]' "$PLAN_JSON" | head -20 | sed 's/^/    /'
[ "$OMIT_N" -gt 20 ] && echo "    ... and $((OMIT_N - 20)) more"

if [ "$APPLY" != true ]; then
  echo
  echo "Plan only. Nothing was written. Re-run with --apply to package the ${BUILD_N} missing"
  echo "charts and rebuild index.yaml, and --apply --push to publish them."
  exit 0
fi

# ── 2. Apply ─────────────────────────────────────────────────────────────────
command -v helm >/dev/null 2>&1 || { echo "backfill-charts.sh: --apply needs helm." >&2; exit 1; }
[ -d "${CHARTS_DIR:-}/wekan" ] || { echo "backfill-charts.sh: no chart source at ${CHARTS_DIR:-<unset>}/wekan." >&2; exit 1; }

sedi() { if [ "$(uname)" = "Darwin" ]; then sed -i '' "$@"; else sed -i "$@"; fi; }

cd "$CHARTS_DIR"

# The chart SOURCE is on main; the packages and the index live on gh-pages. Both
# are needed, so the source is copied out before the branch is switched.
git checkout main
git pull --ff-only || true
SRC="$(mktemp -d)"
trap 'rm -f "$PLAN_JSON"; rm -rf "$SRC"' EXIT
cp -a wekan "$SRC/wekan"

git checkout gh-pages
git pull --ff-only || true

# Each missing version is packaged from the CURRENT chart templates with its own
# version numbers - which is all release-charts.sh ever varies between releases
# anyway (appVersion, version, and the image tag; dependency versions are not
# touched). A backfilled chart is therefore the chart as it is today, pointed at
# that release's image, which is the only thing that can be reconstructed after
# the fact and the only thing the version in the index means.
built=0
for VERSION in $(jq -r '.build[]' "$PLAN_JSON"); do
  CHART_VERSION="${VERSION}.0"
  if [ -f "wekan-${CHART_VERSION}.tgz" ]; then
    continue
  fi
  work="$(mktemp -d)"
  cp -a "$SRC/wekan" "$work/wekan"
  sedi -E "s|^appVersion: \"[^\"]*\"|appVersion: \"${VERSION}\"|" "$work/wekan/Chart.yaml"
  sedi -E "s|^version: [0-9]+\.[0-9]+\.[0-9]+|version: ${CHART_VERSION}|" "$work/wekan/Chart.yaml"
  sedi -E "s|tag: v[0-9]+\.[0-9]+(\.[0-9]+)?|tag: v${VERSION}|" "$work/wekan/values.yaml"
  ( cd "$work" && helm dependency build wekan >/dev/null 2>&1 || helm dependency update wekan >/dev/null 2>&1 || true )
  if helm package "$work/wekan" --destination . >/dev/null; then
    built=$((built + 1))
    echo "  packaged wekan-${CHART_VERSION}.tgz"
  else
    echo "::warning::could not package a chart for ${VERSION}; it stays out of the index."
  fi
  rm -rf "$work"
done
echo "packaged ${built} chart(s)."

# THE INDEX IS REBUILT BY releases/reindex-charts.py, not by `helm repo index`.
#
# It used to be `helm repo index . --merge index.yaml`, and that indexes WHAT IT
# FINDS: every .tgz in the directory, including the ones whose container image no
# longer exists. Artifact Hub scans every entry in the index and mails the
# repository owner about each one it cannot pull -
#
#   error scanning image ghcr.io/wekan/wekan:v9.62: image not found (package wekan:9.62.0)
#
# - which is how six WeKan images that were never published, and 129 charts
# vendoring a Bitnami MongoDB subchart image Bitnami has since deleted, became a
# recurring report. They were taken out of the index by the reindex tool, and one
# `--merge` run here would have put every one of them back.
#
# reindex-charts.py asks the registry about every image each package pins and
# leaves out the packages whose image is gone, so "omit" is enforced by the same
# rule in both places - here and in release-charts.sh - rather than by two tools
# that disagree. It also keeps `created` from git history and collapses the
# duplicate entries an older release-charts.sh left behind, which is what the
# python block below used to do by hand.
"$REPO_DIR/releases/reindex-charts.py" --write --charts-dir "$PWD"

# The duplicate-entry repair that used to be here is gone with the tool that
# needed it. `--merge` preserved everything it found, including the four entries
# for 9.36.0 and two for 10.30.0 that an older release-charts.sh prepended -
# same url, different digests, so a helm client could pick a digest matching no
# file. reindex-charts.py writes ONE entry per package, keyed on the version
# inside it, so a duplicate cannot be written in the first place.

if [ "$PUSH" != true ]; then
  echo
  echo "Not pushed (--push not given). Review with:  git -C \"$CHARTS_DIR\" status"
  exit 0
fi

git add -A
git commit -m "Backfill the chart index for the WeKan releases that have an image." || {
  echo "Nothing to commit."; exit 0; }
git push origin gh-pages
echo "=== gh-pages pushed ==="
