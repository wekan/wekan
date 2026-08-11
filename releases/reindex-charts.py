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
import io
import json
import os
import re
import subprocess
import sys
import tarfile
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
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


# ── Charts that are published but cannot be installed ────────────────────────
#
# A chart is a pointer to container images, so a chart whose images have been
# deleted from their registries installs and then fails at the pull. Listing one
# is worse than not listing it: Artifact Hub scans every entry in the index for
# vulnerabilities and reports each unpullable image as an error against the
# repository -
#
#   error scanning image ghcr.io/wekan/wekan:v9.62: image not found
#   error scanning image docker.io/bitnami/mongodb:7.0.14-debian-12-r3: image not found
#
# - so the index says the repository is broken when the repository is fine and
# the images are gone.
#
# Two separate causes, both real here. Six WeKan images were never pushed or have
# since been removed (v8.30, v9.12, v9.14, v9.38, v9.39, v9.62 - the releases
# whose own docker job failed). And 129 older charts vendor the BITNAMI mongodb
# subchart, pinning tags such as bitnami/mongodb:7.0.14-debian-12-r3 that Bitnami
# has deleted; charts from 8.x on vendor groundhog2k's, which uses the official
# `mongo` image and is unaffected.
#
# The exclusion is RECORDED IN THE REPOSITORY, in UNINDEXED_FILE, rather than
# decided on every run. Two reasons. A rebuild during a release must not depend
# on reaching two registries - a network blip would silently drop half the index.
# And the decision is reversible and reviewable: the file says which package was
# left out and why, so if an image comes back, deleting a line puts the chart
# back in the index. `--check-images` is what regenerates it.
UNINDEXED_FILE = "unindexed.txt"

REGISTRY_ACCEPT = ",".join([
    "application/vnd.oci.image.index.v1+json",
    "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.docker.distribution.manifest.v2+json",
    "application/vnd.oci.image.manifest.v1+json",
])


def split_image(registry, repository, tag):
    """Normalise an image reference to (host, repository, tag).

    Older WeKan charts put the whole reference in `repository`
    ("ghcr.io/wekan/wekan") and leave `registry` unset, so the docker.io default
    must not be believed when the repository itself begins with a host - reading
    those as docker.io/ghcr.io/wekan/wekan is how a first pass came back
    "unknown" for every one of them.
    """
    head = repository.split("/")[0]
    if "." in head or head == "localhost":
        registry, repository = head, repository.split("/", 1)[1]
    registry = registry or "docker.io"
    if registry in ("docker.io", "index.docker.io", "registry-1.docker.io"):
        host = "registry-1.docker.io"
        if "/" not in repository:
            repository = "library/" + repository
    else:
        host = registry
    return host, repository, tag or "latest"


def image_exists(host, repository, tag, _tokens={}):
    """True / False / None, where None means "could not tell" - never "missing".

    The auth handshake is the REGISTRY'S OWN, not a guess per host: ask for the
    manifest with no credentials, and if the registry answers 401 it says in its
    WWW-Authenticate header which realm to get a token from and for what scope.
    Hard-coding one token URL per registry is what made a first version report
    every quay.io image as missing - including quay.io/wekan/wekan:latest, which
    plainly exists - because the wrong endpoint gave a token quay would not
    accept and the manifest came back 404. A chart must never leave the index on
    the strength of a bad guess about a registry's API.

    A registry that refuses anonymous auth, or a request that times out, returns
    None: the list is only ever allowed to say what is really gone.
    """
    url = f"https://{host}/v2/{repository}/manifests/{tag}"
    headers = {"Accept": REGISTRY_ACCEPT}

    def ask(extra=None):
        request = urllib.request.Request(url, headers={**headers, **(extra or {})},
                                         method="HEAD")
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.status

    try:
        cached = _tokens.get((host, repository))
        if cached:
            return ask({"Authorization": f"Bearer {cached}"}) == 200
        return ask() == 200
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return False
        if error.code != 401:
            return None
        challenge = error.headers.get("WWW-Authenticate", "")
    except Exception:
        return None

    fields = dict(re.findall(r'(\w+)="([^"]*)"', challenge))
    realm = fields.pop("realm", None)
    if not realm:
        return None
    fields.setdefault("scope", f"repository:{repository}:pull")
    try:
        with urllib.request.urlopen(
                f"{realm}?{urllib.parse.urlencode(fields)}", timeout=60) as response:
            payload = json.load(response)
        token = payload.get("token") or payload.get("access_token")
        if not token:
            return None
        _tokens[(host, repository)] = token
        return ask({"Authorization": f"Bearer {token}"}) == 200
    except urllib.error.HTTPError as error:
        return False if error.code == 404 else None
    except Exception:
        return None


def chart_images(path):
    """Every image the chart and its vendored subcharts pin."""
    found = []

    def from_values(values):
        image = (values or {}).get("image")
        if isinstance(image, dict) and image.get("repository"):
            found.append(split_image(image.get("registry"), image["repository"],
                                     str(image.get("tag") or "latest")))

    with tarfile.open(path) as tar:
        top = [m for m in tar.getnames()
               if m.count("/") == 1 and m.endswith("/values.yaml")]
        if top:
            with tar.extractfile(top[0]) as fh:
                from_values(yaml.safe_load(fh.read()))
        for sub in [m for m in tar.getnames()
                    if "/charts/" in m and m.endswith(".tgz")]:
            with tar.extractfile(sub) as fh:
                blob = fh.read()
            try:
                with tarfile.open(fileobj=io.BytesIO(blob)) as subtar:
                    inner = [m for m in subtar.getnames()
                             if m.count("/") == 1 and m.endswith("/values.yaml")]
                    if inner:
                        with subtar.extractfile(inner[0]) as sfh:
                            from_values(yaml.safe_load(sfh.read()))
            except (tarfile.TarError, yaml.YAMLError):
                continue
    return found


def read_unindexed(directory):
    """{filename: reason} - the packages this repository deliberately does not list."""
    path = os.path.join(directory, UNINDEXED_FILE)
    out = {}
    if not os.path.exists(path):
        return out
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            name, _, reason = line.partition("#")
            out[name.strip()] = reason.strip()
    return out


def check_images(directory, packages):
    """Probe every image every package pins; return {filename: reason} for the
    ones with an image that is definitely gone."""
    per_package, wanted = {}, set()
    for filename in packages:
        try:
            images = chart_images(os.path.join(directory, filename))
        except (tarfile.TarError, yaml.YAMLError):
            continue
        per_package[filename] = images
        wanted.update(images)

    print(f"checking {len(wanted)} distinct images from {len(per_package)} packages ...",
          file=sys.stderr)
    with ThreadPoolExecutor(max_workers=12) as pool:
        verdicts = dict(zip(wanted, pool.map(lambda i: image_exists(*i), wanted)))

    unknown = [i for i, ok in verdicts.items() if ok is None]
    if unknown:
        print(f"  {len(unknown)} image(s) could not be checked; they are treated as "
              f"PRESENT, never as missing", file=sys.stderr)

    out = {}
    for filename, images in per_package.items():
        gone = [f"{h}/{r}:{t}" for h, r, t in images if verdicts.get((h, r, t)) is False]
        if gone:
            out[filename] = f"image not found: {', '.join(sorted(gone))}"
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--charts-dir")
    ap.add_argument("--write", action="store_true",
                    help="rewrite index.yaml (without this, nothing is written)")
    ap.add_argument("--check-images", action="store_true",
                    help="probe every image the charts pin and refresh "
                         f"{UNINDEXED_FILE} from the result (needs network)")
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

    # Which packages are published but must not be listed, and why.
    if args.check_images:
        unindexed = check_images(directory, packages)
        if args.write:
            path = os.path.join(directory, UNINDEXED_FILE)
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(
                    "# Packages that are published here but are NOT listed in\n"
                    "# index.yaml, because an image they pin no longer exists in its\n"
                    "# registry - so the chart would install and then fail at the\n"
                    "# pull, and Artifact Hub reports each one as a scan error\n"
                    "# against this repository.\n"
                    "#\n"
                    "# Regenerate with:  releases/reindex-charts.py --check-images --write\n"
                    "# An image that comes back: delete its line and rebuild.\n"
                    "# The .tgz files themselves stay, so a direct URL keeps working.\n\n")
                for name in sorted(unindexed, key=lambda f: version_key(f)):
                    fh.write(f"{name}  # {unindexed[name]}\n")
            print(f"wrote {path} - {len(unindexed)} package(s) not listed.")
    else:
        unindexed = read_unindexed(directory)

    now = datetime.now(timezone.utc).isoformat()
    entries, skipped, added, retimed, corrected = [], [], [], [], []
    excluded = []

    for filename in packages:
        if filename in unindexed:
            excluded.append(f"{filename}: {unindexed[filename]}")
            continue
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
    if excluded:
        print(f"  not listed    : {len(excluded)}   (an image they pin is gone - "
              f"see {UNINDEXED_FILE})")
        for line in excluded[:4]:
            print(f"      {line}")
        if len(excluded) > 4:
            print(f"      ... and {len(excluded) - 4} more")
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
