#!/usr/bin/env python3
"""Download the whole Artifact Hub security report of a package.

  releases/sec/download-artifacthub-security.sh                  # helm/wekan/wekan
  releases/sec/download-artifacthub-security.sh helm/wekan/wekan --version 13.30.0

Artifact Hub (https://artifacthub.io/packages/helm/wekan/wekan) scans every
container image a chart names with Trivy and shows the result on the
package's "Security report" page. This saves that report - every image,
every target, every vulnerability, as Artifact Hub answers it - under
.tools/log/sec/_artifacthub/<kind>/<repository>/<package>/<YYYY-MM-DD_HH-MM-SS>/:

  package.json           the package: its version, images, report summary
  security-report.json   the whole report: one Trivy result per image
  images/<image>.json    the same, one file per image
  SUMMARY.md             the counts per image and target, then every
                         vulnerability, the most severe first, with the
                         installed and the fixed version

Artifact Hub's API is public, so no login or token is needed; it runs inside
the editor's sandbox too when the network is there. download-github-security.sh
runs it as well, for the wekan organization (--artifacthub, --no-artifacthub).

Only the standard library, so `python3 -I` runs it with nothing installed.
"""

import argparse
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_OUT = os.path.join(ROOT, ".tools", "log", "sec")
# The address of Artifact Hub. ARTIFACTHUB_URL points the tests at a stand-in.
BASE_URL = os.environ.get("ARTIFACTHUB_URL", "https://artifacthub.io").rstrip("/")
DEFAULT_PACKAGES = ["helm/wekan/wekan"]
# The directory under --out. download_github_security.py writes .../<org>/
# there, and a GitHub name starts with a letter or digit, so no organization
# can be called this - the same reason its _organization/ is safe.
OUT_DIR = "_artifacthub"

# A kind, repository or package name, and a version: nothing that could be a
# "/", "..", a space or a query. Anything else is refused before it names a
# path or an address.
NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$")
VERSION = re.compile(r"^[A-Za-z0-9][A-Za-z0-9.+_-]{0,99}$")
PACKAGE_ID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]
TIMEOUT = 120


class HubError(Exception):
    """Artifact Hub answered with an error: its message, and the HTTP status."""

    def __init__(self, message, status=None):
        super().__init__(message)
        self.status = status


def valid_package(value):
    parts = value.split("/")
    if len(parts) != 3 or not all(NAME.match(p) for p in parts):
        raise argparse.ArgumentTypeError(
            f"not an Artifact Hub package, KIND/REPOSITORY/PACKAGE such as helm/wekan/wekan: {value!r}")
    return value


def valid_version(value):
    if not VERSION.match(value):
        raise argparse.ArgumentTypeError(f"not a package version: {value!r}")
    return value


def hub_get(path):
    url = BASE_URL + path
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "wekan-security-download"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            body = r.read()
    except urllib.error.HTTPError as e:
        raise HubError(f"{url}: HTTP {e.code} {e.reason}", e.code) from None
    except (urllib.error.URLError, OSError) as e:
        raise HubError(f"{url}: {getattr(e, 'reason', e)}") from None
    try:
        return json.loads(body)
    except ValueError:
        raise HubError(f"{url}: the answer is not JSON") from None


def write_json(path, value):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(value, f, indent=2, ensure_ascii=False)
        f.write("\n")


def slug(text):
    s = re.sub(r"[^A-Za-z0-9._-]+", "-", str(text)).strip("-.")
    return s[:150] or "image"


def md(text):
    return str(text if text is not None else "").replace("|", "\\|").replace("\n", " ").strip()


def vulnerabilities(report):
    """Every vulnerability of the report as (image, target, vulnerability)."""
    out = []
    for image, result in (report or {}).items():
        for target in (result or {}).get("Results") or []:
            for v in target.get("Vulnerabilities") or []:
                out.append((image, target.get("Target", ""), v))
    return out


def severity_rank(v):
    s = str(v.get("Severity", "UNKNOWN")).upper()
    return SEVERITIES.index(s) if s in SEVERITIES else len(SEVERITIES)


def write_summary(path, package, pkg, version, report):
    url = f"{BASE_URL}/packages/{package}"
    created = pkg.get("security_report_created_at")
    when = datetime.datetime.fromtimestamp(created, datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC") if created else "-"
    lines = [f"# Artifact Hub security report: {package} {version}", "",
             f"- Package: {url}",
             f"- Security report: {url}?modal=security-report",
             f"- Report made: {when}", ""]
    summary = pkg.get("security_report_summary") or {}
    if summary:
        lines += ["| " + " | ".join(s.capitalize() for s in SEVERITIES) + " |",
                  "|" + "---|" * len(SEVERITIES),
                  "| " + " | ".join(str(summary.get(s.lower(), 0)) for s in SEVERITIES) + " |", ""]
    lines += ["## Images", "", "| Image | Target | Class | " + " | ".join(s.capitalize() for s in SEVERITIES) + " |",
              "|---|---|---|" + "---|" * len(SEVERITIES)]
    for image, result in (report or {}).items():
        for target in (result or {}).get("Results") or []:
            counts = {s: 0 for s in SEVERITIES}
            for v in target.get("Vulnerabilities") or []:
                s = str(v.get("Severity", "UNKNOWN")).upper()
                counts[s if s in counts else "UNKNOWN"] += 1
            lines.append(f"| {md(image)} | {md(target.get('Target'))} | {md(target.get('Class'))} | "
                         + " | ".join(str(counts[s]) for s in SEVERITIES) + " |")
    vulns = sorted(vulnerabilities(report), key=lambda t: (severity_rank(t[2]), t[0], str(t[2].get("PkgName")), str(t[2].get("VulnerabilityID"))))
    lines += ["", f"## Vulnerabilities ({len(vulns)})", "",
              "| Severity | ID | Package | Installed | Fixed | Status | Image | Target | Title |",
              "|---|---|---|---|---|---|---|---|---|"]
    for image, target, v in vulns:
        vid = md(v.get("VulnerabilityID"))
        link = v.get("PrimaryURL")
        if link and str(link).startswith("https://"):
            vid = f"[{vid}]({md(link)})"
        lines.append(f"| {md(v.get('Severity'))} | {vid} | {md(v.get('PkgName'))} | {md(v.get('InstalledVersion'))} | "
                     f"{md(v.get('FixedVersion')) or '-'} | {md(v.get('Status'))} | {md(image)} | {md(target)} | {md(v.get('Title'))} |")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return len(vulns)


def download_package(package, out, stamp, log, version=None):
    """Download one package's report. Returns the number of vulnerabilities, or
    None when Artifact Hub had no report to give (the reason is in status.txt)."""
    kind, repo, name = package.split("/")
    run_dir = os.path.join(out, OUT_DIR, kind, repo, name, stamp)
    path = f"/api/v1/packages/{kind}/{repo}/{name}" + (f"/{urllib.parse.quote(version)}" if version else "")
    pkg = hub_get(path)
    package_id = str(pkg.get("package_id", ""))
    version = str(pkg.get("version", ""))
    if not PACKAGE_ID.match(package_id) or not VERSION.match(version):
        raise HubError(f"{BASE_URL}{path}: the answer names no package id and version")
    log(f"Artifact Hub {package} {version} -> {run_dir}")
    write_json(os.path.join(run_dir, "package.json"), pkg)
    try:
        report = hub_get(f"/api/v1/packages/{package_id}/{urllib.parse.quote(version)}/security-report")
    except HubError as e:
        os.makedirs(run_dir, exist_ok=True)
        with open(os.path.join(run_dir, "status.txt"), "w", encoding="utf-8") as f:
            f.write(f"No security report: {e}\n")
        log(f"  no security report: {e}")
        return None
    if not isinstance(report, dict):
        report = {}
    write_json(os.path.join(run_dir, "security-report.json"), report)
    for image, result in report.items():
        write_json(os.path.join(run_dir, "images", slug(image) + ".json"), result)
    count = write_summary(os.path.join(run_dir, "SUMMARY.md"), package, pkg, version, report)
    log(f"  {len(report)} images, {count} vulnerabilities")
    return count


def download_all(packages, out, stamp, log, version=None):
    """Every package; a failure is reported and the rest go on. Returns how many failed."""
    failed = 0
    for package in packages:
        try:
            download_package(package, out, stamp, log, version)
        except HubError as e:
            print(f"Artifact Hub {package}: {e}", file=sys.stderr)
            failed += 1
    return failed


def main(argv=None):
    p = argparse.ArgumentParser(description="Download the whole Artifact Hub security report of a package.")
    p.add_argument("package", nargs="*", type=valid_package,
                   help="KIND/REPOSITORY/PACKAGE as in its artifacthub.io/packages/ address (default: helm/wekan/wekan)")
    p.add_argument("--version", type=valid_version, help="that version (default: the newest)")
    p.add_argument("--out", default=DEFAULT_OUT, help="where _artifacthub/<kind>/<repo>/<package>/<datetime>/ go (default: .tools/log/sec)")
    args = p.parse_args(argv)
    stamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    failed = download_all(args.package or DEFAULT_PACKAGES, args.out, stamp, print, args.version)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
