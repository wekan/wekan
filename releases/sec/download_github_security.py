#!/usr/bin/env python3
"""Download a GitHub organization's "Security and quality" alerts, per repository.

  releases/sec/download-github-security.sh wekan
  releases/sec/download-github-security.sh wekan --repo wekan --state open

For every repository of the organization (or the ones named with --repo) it
writes, under .tools/log/sec/<organization>/<repository>/<YYYY-MM-DD_HH-MM-SS>/:

  dependabot/            Dependabot alerts
  code-scanning/         code scanning alerts (CodeQL and the others); an open
                         alert also gets alert-<n>.instances.json, every place
                         it was found
  secret-scanning/       secret scanning alerts - the secret itself is REDACTED
                         unless --include-secret-values is given
  security-advisories/   the repository's security advisories, drafts and
                         private vulnerability reports included

Each of those holds alerts.json (the whole list, as GitHub answers it) and
alert-<number>.json per alert (advisory-<GHSA>.json for advisories). A kind
GitHub does not answer - not enabled, or not visible to the signed-in account -
gets status.txt with GitHub's reason instead, and the run goes on. SUMMARY.md
in the run's directory lists every open alert, with its link.

It runs the GitHub CLI, `gh`, signed in with an account that may read the
organization's security alerts (`gh auth login`; the token needs the repo
and security_events scopes, read:org for a private organization). It is
meant to be run outside the editor's sandbox, where gh and its login are;
the files it writes are read inside, from .tools/log/sec/ - which .gitignore
and .meteorignore already exclude, so nothing downloaded reaches a commit.

Only the standard library, so `python3 -I` runs it with nothing installed.
"""

import argparse
import datetime
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_OUT = os.path.join(ROOT, ".tools", "log", "sec")

# A GitHub organization or repository name: letters, digits, ".", "_", "-".
# Anything else - a "/", "..", a space - is refused before it names a path
# or an API address.
NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$")

# The kinds of finding, their API path under /repos/{owner}/{repo}/, and the
# field that numbers one.
KINDS = [
    ("dependabot", "dependabot/alerts", "number"),
    ("code-scanning", "code-scanning/alerts", "number"),
    ("secret-scanning", "secret-scanning/alerts", "number"),
    ("security-advisories", "security-advisories", "ghsa_id"),
]

# What GitHub calls a closed alert, per kind - the rest are open.
CLOSED = {"fixed", "dismissed", "resolved", "auto_dismissed", "closed", "withdrawn", "published"}


class GhError(Exception):
    """gh answered with an error: its message, and the HTTP status when it said one."""

    def __init__(self, message, status=None):
        super().__init__(message)
        self.status = status


def valid_name(value, what):
    if not NAME.match(value or "") or value in (".", ".."):
        raise argparse.ArgumentTypeError(f"not a GitHub {what} name: {value!r}")
    return value


def parse_pages(text):
    """gh api --paginate prints one JSON document per page, back to back
    ("[...][...]"); read them all, and flatten the pages that are lists."""
    decoder = json.JSONDecoder()
    items, i = [], 0
    while True:
        while i < len(text) and text[i].isspace():
            i += 1
        if i >= len(text):
            return items
        value, i = decoder.raw_decode(text, i)
        if isinstance(value, list):
            items.extend(value)
        else:
            items.append(value)


def gh_api(path, paginate=True):
    """GET path through `gh api`, its pages read as one list (or one object)."""
    args = ["gh", "api", "-H", "Accept: application/vnd.github+json", "-H", "X-GitHub-Api-Version: 2022-11-28"]
    if paginate:
        args.append("--paginate")
    args.append(path)
    proc = subprocess.run(args, capture_output=True, text=True)
    if proc.returncode != 0:
        message = (proc.stderr or proc.stdout or "gh api failed").strip()
        m = re.search(r"HTTP (\d{3})", message)
        raise GhError(message, int(m.group(1)) if m else None)
    return parse_pages(proc.stdout)


def redact_secrets(alert):
    """A secret scanning alert without the secret it found."""
    alert = dict(alert)
    for key in ("secret", "secret_value"):
        if key in alert and alert[key]:
            alert[key] = "[REDACTED - run with --include-secret-values to keep it]"
    return alert


def write_json(path, value):
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(value, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def is_open(kind, alert):
    state = str(alert.get("state") or "").lower()
    if kind == "security-advisories":
        return state in ("triage", "draft")
    return state not in CLOSED


def describe(kind, alert):
    """One line of SUMMARY.md: what the alert is about, and where."""
    if kind == "dependabot":
        adv = alert.get("security_advisory") or {}
        dep = alert.get("dependency") or {}
        pkg = (dep.get("package") or {}).get("name", "")
        return adv.get("severity", ""), f"{pkg}: {adv.get('summary', '')}", dep.get("manifest_path", "")
    if kind == "code-scanning":
        rule = alert.get("rule") or {}
        loc = ((alert.get("most_recent_instance") or {}).get("location") or {})
        where = f"{loc.get('path', '')}:{loc.get('start_line', '')}" if loc.get("path") else ""
        sev = rule.get("security_severity_level") or rule.get("severity") or ""
        return sev, f"{rule.get('id', '')}: {rule.get('description', '')}", where
    if kind == "secret-scanning":
        return "", alert.get("secret_type_display_name") or alert.get("secret_type", ""), ""
    return alert.get("severity", ""), alert.get("summary", ""), ""


def download_repo(org, repo, run_dir, state, include_secrets, log):
    """Every kind of one repository into run_dir; the open alerts for the summary."""
    os.makedirs(run_dir, exist_ok=True)
    open_rows = []
    counts = {}
    for kind, api, key in KINDS:
        kind_dir = os.path.join(run_dir, kind)
        os.makedirs(kind_dir, exist_ok=True)
        path = f"/repos/{org}/{repo}/{api}?per_page=100"
        if state != "all" and kind != "security-advisories":
            path += f"&state={state}"
        try:
            alerts = gh_api(path)
        except GhError as e:
            # Not enabled, or not visible to this account: said, and the run goes on.
            with open(os.path.join(kind_dir, "status.txt"), "w", encoding="utf-8") as fh:
                fh.write(f"Not downloaded: {e}\n")
            counts[kind] = f"not available ({e.status or 'error'})"
            log(f"  {kind}: not available ({e.status or 'error'})")
            continue
        if kind == "secret-scanning" and not include_secrets:
            alerts = [redact_secrets(a) for a in alerts]
        write_json(os.path.join(kind_dir, "alerts.json"), alerts)
        n_open = 0
        for alert in alerts:
            ident = str(alert.get(key, "")).strip()
            if not re.match(r"^[A-Za-z0-9-]+$", ident):
                continue
            name = f"advisory-{ident}.json" if kind == "security-advisories" else f"alert-{ident}.json"
            write_json(os.path.join(kind_dir, name), alert)
            if is_open(kind, alert):
                n_open += 1
                sev, what, where = describe(kind, alert)
                open_rows.append((kind, ident, sev, what, where, alert.get("html_url", "")))
                if kind == "code-scanning":
                    try:
                        instances = gh_api(f"/repos/{org}/{repo}/code-scanning/alerts/{ident}/instances?per_page=100")
                        write_json(os.path.join(kind_dir, f"alert-{ident}.instances.json"), instances)
                    except GhError as e:
                        log(f"  code-scanning #{ident}: instances not available ({e.status or 'error'})")
        counts[kind] = f"{len(alerts)} ({n_open} open)"
        log(f"  {kind}: {len(alerts)} ({n_open} open)")
    write_summary(org, repo, run_dir, counts, open_rows)
    return len(open_rows)


def md(text):
    return str(text).replace("|", "\\|").replace("\n", " ")


def write_summary(org, repo, run_dir, counts, rows):
    lines = [f"# {org}/{repo} - Security and quality", "",
             f"Downloaded {os.path.basename(run_dir)} with releases/sec/download-github-security.sh.", ""]
    for kind, _, _ in KINDS:
        lines.append(f"- **{kind}**: {counts.get(kind, '')}")
    lines += ["", "## Open", ""]
    if not rows:
        lines.append("Nothing open.")
    else:
        lines += ["| Kind | # | Severity | What | Where | Link |", "| --- | --- | --- | --- | --- | --- |"]
        for kind, ident, sev, what, where, url in rows:
            lines.append(f"| {kind} | {ident} | {md(sev)} | {md(what)} | {md(where)} | {url} |")
    with open(os.path.join(run_dir, "SUMMARY.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")


def org_repos(org, include_archived, include_forks):
    repos = gh_api(f"/orgs/{org}/repos?per_page=100&type=all")
    names = []
    for r in repos:
        if r.get("archived") and not include_archived:
            continue
        if r.get("fork") and not include_forks:
            continue
        name = r.get("name", "")
        if NAME.match(name):
            names.append(name)
    return sorted(names, key=str.lower)


def main(argv=None):
    p = argparse.ArgumentParser(description="Download a GitHub organization's Security and quality alerts with gh.")
    p.add_argument("org", type=lambda v: valid_name(v, "organization"), help="the GitHub organization, e.g. wekan")
    p.add_argument("--repo", action="append", type=lambda v: valid_name(v, "repository"),
                   help="only this repository (may be given more than once)")
    p.add_argument("--state", choices=["all", "open"], default="all",
                   help="every alert (the default), or only the open ones")
    p.add_argument("--out", default=DEFAULT_OUT, help="where .../<org>/<repo>/<datetime>/ go (default: .tools/log/sec)")
    p.add_argument("--include-archived", action="store_true", help="archived repositories too")
    p.add_argument("--include-forks", action="store_true", help="forks too")
    p.add_argument("--include-secret-values", action="store_true",
                   help="keep the secrets secret scanning found (redacted by default)")
    args = p.parse_args(argv)

    if not shutil.which("gh"):
        print("gh, the GitHub CLI, is not installed: https://cli.github.com/", file=sys.stderr)
        return 2
    auth = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True)
    if auth.returncode != 0:
        print("gh is not signed in - run `gh auth login` first:\n" + (auth.stderr or auth.stdout).strip(), file=sys.stderr)
        return 2

    stamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    try:
        repos = args.repo or org_repos(args.org, args.include_archived, args.include_forks)
    except GhError as e:
        print(f"Could not list the repositories of {args.org}: {e}", file=sys.stderr)
        return 1
    if not repos:
        print(f"{args.org} has no repositories to download.", file=sys.stderr)
        return 1

    total_open = 0
    for repo in repos:
        run_dir = os.path.join(args.out, args.org, repo, stamp)
        print(f"{args.org}/{repo} -> {run_dir}")
        total_open += download_repo(args.org, repo, run_dir, args.state, args.include_secret_values, print)
    print(f"Done: {len(repos)} repositories, {total_open} open alerts, under {os.path.join(args.out, args.org)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
