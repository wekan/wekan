#!/usr/bin/env python3
"""Rebuild the wekan/charts Helm index from the packages it actually serves.

An index.yaml is a description of the .tgz files sitting beside it, and this
regenerates it from those files instead of editing it in place. That matters
because the index had drifted from them in four separate ways, none of which an
in-place edit can notice:

  MISSING ENTRIES.  145 packages on gh-pages had no entry at all - they are
      downloadable but no `helm search`, no `helm install wekan --version 9.63.0`
      and no Artifact Hub listing can find them. release-charts.sh writes one
      entry per release, so a release whose charts job did not run leaves a hole,
      and nothing ever goes back for it.

  DUPLICATE ENTRIES WITH STALE DIGESTS.  9.36.0 appeared four times and 10.30.0
      twice, each copy with a DIFFERENT digest and the SAME url, because
      release-charts.sh PREPENDS an entry every time it runs and a re-run of a
      release duplicated the version instead of replacing it. Only one of those
      digests is the digest of the file being served; a helm client that picks
      another fails the integrity check on a perfectly good package.

  A WRONG appVersion, ON EVERY ENTRY.  The index said appVersion "10.79.0" - the
      CHART version - where the packaged Chart.yaml says "10.79", the WeKan
      version. appVersion is what a user reads to see which WeKan they get.

  FROZEN DEPENDENCY VERSIONS.  Each new entry was copied from the previous one
      with a few fields substituted, so fields nobody substituted never changed:
      the index claimed the mongodb subchart was 0.7.2 for every release, while
      the packages have moved on to 0.7.6.

Every one of those is the same mistake - treating the index as the record rather
than as a description of the packages - so the fix is to derive it from them.

`created` is preserved, never invented: an entry that already exists and whose
digest matches its package keeps the timestamp it has, and a package being added
takes the date it was COMMITTED to the gh-pages branch, which is when it really
was published (verified: wekan-10.79.0.tgz was committed at 2026-08-10T02:46:52Z
and its existing entry says created 2026-08-10T02:46:52.308983+00:00). Only a
package with no entry and no git history falls back to now.

Usage:
    releases/reindex-charts.py [--charts-dir DIR]     # report only, writes nothing
    releases/reindex-charts.py --write [--charts-dir DIR]

DIR defaults to $CHARTS_DIR, then .tools/charts, then ../w/charts. It must be on
the gh-pages branch, where the packages and index.yaml live.
"""

import argparse
import hashlib
import os
import re
import subprocess
import sys
import tarfile
from datetime import datetime, timezone

try:
    import yaml
except ImportError:
    sys.exit("reindex-charts.py needs PyYAML (pip install pyyaml, or apt install python3-yaml).")

CHART_NAME = "wekan"
BASE_URL = "https://wekan.github.io/charts"


def find_charts_dir(explicit):
    """Where the charts checkout is, in the order the repo keeps things."""
    here = os.path.dirname(os.path.abspath(__file__))
    repo = os.path.dirname(here)
    for candidate in (explicit, os.environ.get("CHARTS_DIR"),
                      os.path.join(repo, ".tools", "charts"),
                      os.path.join(repo, "..", "w", "charts")):
        if candidate and os.path.isdir(candidate):
            return os.path.abspath(candidate)
    return None


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def chart_metadata(path):
    """The packaged Chart.yaml - which IS the index entry, bar created/digest/urls.

    Read from the archive rather than from the chart source, because the archive
    is what is served: a source tree that has moved on since cannot make an entry
    describe a package wrongly.
    """
    with tarfile.open(path) as tar:
        members = [m for m in tar.getnames()
                   if m.count("/") == 1 and m.endswith("/Chart.yaml")]
        if not members:
            return None
        with tar.extractfile(members[0]) as fh:
            return yaml.safe_load(fh.read())


def git_added(directory, filename):
    """When this package was committed to gh-pages - i.e. when it was published."""
    try:
        out = subprocess.run(
            ["git", "-C", directory, "log", "--diff-filter=A", "--format=%aI",
             "-1", "--", filename],
            capture_output=True, text=True, timeout=60, check=False).stdout.strip()
        return out or None
    except (OSError, subprocess.SubprocessError):
        return None


def version_key(version):
    parts = re.findall(r"\d+", version or "")
    return [int(p) for p in parts] or [0]


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--charts-dir")
    ap.add_argument("--write", action="store_true",
                    help="rewrite index.yaml (without this, nothing is written)")
    args = ap.parse_args()

    directory = find_charts_dir(args.charts_dir)
    if not directory:
        sys.exit("reindex-charts.py: no charts checkout found. Pass --charts-dir "
                 "or set CHARTS_DIR to a wekan/charts clone on its gh-pages branch.")

    index_path = os.path.join(directory, "index.yaml")
    packages = sorted(f for f in os.listdir(directory) if f.endswith(".tgz"))
    if not packages:
        sys.exit(f"reindex-charts.py: no .tgz packages in {directory} - is it on "
                 f"the gh-pages branch?")

    # What the index says now. Missing or unreadable is not fatal: the packages
    # are the source of truth and an index can be built from them alone.
    old_entries = []
    if os.path.exists(index_path):
        with open(index_path, encoding="utf-8") as fh:
            old = yaml.safe_load(fh) or {}
        old_entries = (old.get("entries") or {}).get(CHART_NAME) or []
    old_by_version = {}
    for entry in old_entries:
        old_by_version.setdefault(entry.get("version"), []).append(entry)

    now = datetime.now(timezone.utc).isoformat()
    entries, skipped, added, retimed, corrected = [], [], [], [], []

    for filename in packages:
        path = os.path.join(directory, filename)
        meta = chart_metadata(path)
        if not meta or not meta.get("version"):
            skipped.append(f"{filename}: no <chart>/Chart.yaml inside it")
            continue

        entry = dict(meta)
        digest = sha256(path)
        entry["digest"] = digest
        entry["urls"] = [f"{BASE_URL}/{filename}"]

        # created: keep what the matching entry already says, so a rebuild does
        # not restamp the whole repository; otherwise take the publish date from
        # git; only then fall back to now.
        previous = old_by_version.get(meta["version"], [])
        match = next((e for e in previous if str(e.get("digest", "")).strip() == digest), None)
        if match and match.get("created"):
            entry["created"] = str(match["created"])
        else:
            when = git_added(directory, filename)
            entry["created"] = when or now
            if previous:
                retimed.append(f"{meta['version']} ({filename}): "
                               f"{len(previous)} stale entr{'y' if len(previous) == 1 else 'ies'} "
                               f"replaced, created taken from {'git' if when else 'now'}")
            else:
                added.append(f"{meta['version']} ({filename}), published {entry['created'][:10]}")

        if match:
            for field in ("appVersion", "dependencies"):
                if field in meta and match.get(field) != meta.get(field):
                    corrected.append(f"{meta['version']}: {field} "
                                     f"{match.get(field)!r} -> {meta[field]!r}")
        entries.append(entry)

    # TWO PACKAGES CLAIMING ONE CHART VERSION. Two 2023 packaging slips do this:
    # wekan-1.2.7.tgz contains a chart whose Chart.yaml says version 1.2.6, and
    # wekan-6.96.tgz and wekan-6.9.6.tgz both say 6.9.6. `helm repo index` would
    # list both, leaving `--version 6.9.6` to resolve to whichever entry came
    # first - so the index would name a version that means two different files.
    # The package whose FILENAME matches the version it declares is the one that
    # was meant; a mismatch is the slip. The other file stays on the server, so a
    # direct URL anyone already has keeps working - it is just not offered as a
    # version. If neither filename matches, the one published first wins, because
    # that is the one that may already have been installed from.
    by_version = {}
    for entry in entries:
        by_version.setdefault(entry["version"], []).append(entry)
    unindexed = []
    for version, group in by_version.items():
        if len(group) == 1:
            continue
        def preference(entry):
            filename = entry["urls"][0].rsplit("/", 1)[-1]
            return (filename != f"{CHART_NAME}-{version}.tgz", entry.get("created", ""))
        group.sort(key=preference)
        for loser in group[1:]:
            entries.remove(loser)
            unindexed.append(
                f"{loser['urls'][0].rsplit('/', 1)[-1]}: its Chart.yaml declares "
                f"version {version}, which "
                f"{group[0]['urls'][0].rsplit('/', 1)[-1]} also declares - kept the "
                f"one whose filename matches. The file is still served, just not "
                f"offered as a version.")

    entries.sort(key=lambda e: version_key(e.get("version")), reverse=True)

    seen = {}
    for entry in entries:
        seen.setdefault(entry["version"], []).append(entry)
    collisions = {v: len(e) for v, e in seen.items() if len(e) > 1}

    print(f"charts dir      : {directory}")
    print(f"packages        : {len(packages)}")
    print(f"index entries   : {len(old_entries)} before -> {len(entries)} after")
    print(f"  added         : {len(added)}   (a package that had no entry at all)")
    # The duplicates are counted in the OLD index, not derived from the sizes:
    # entries added and packages not offered move that difference too, and
    # folding all three into one subtraction reported six duplicates where there
    # were four.
    print(f"  de-duplicated : {len(old_entries) - len({e.get('version') for e in old_entries})}"
          f"   (stale repeat entries for a version already listed)")
    print(f"  corrected     : {len(corrected)}   (fields that disagreed with the package)")
    if skipped:
        print(f"  skipped       : {len(skipped)}")
        for line in skipped:
            print(f"      {line}")
    if unindexed:
        print(f"  not offered   : {len(unindexed)}   (a version two packages claim)")
        for line in unindexed:
            print(f"      {line}")
    for line in retimed:
        print(f"    ! {line}")
    for line in corrected[:6]:
        print(f"    ~ {line}")
    if len(corrected) > 6:
        print(f"    ~ ... and {len(corrected) - 6} more")
    for line in added[-8:]:
        print(f"    + {line}")
    if len(added) > 8:
        print(f"    + ... and {len(added) - 8} older ones")

    if collisions:
        sys.exit(f"reindex-charts.py: two packages claim the same chart version "
                 f"{collisions} - refusing to write an index that cannot say which "
                 f"file a version is.")

    if not args.write:
        print("\nReport only. Nothing was written. Re-run with --write to rebuild index.yaml.")
        return 0

    document = {
        "apiVersion": "v1",
        "entries": {CHART_NAME: entries},
        "generated": now,
    }
    with open(index_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(document, fh, default_flow_style=False, width=10000,
                       sort_keys=True, allow_unicode=True)
    print(f"\nWrote {index_path} - {len(entries)} entries.")
    print("Review it (git diff), then commit and push the gh-pages branch.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
