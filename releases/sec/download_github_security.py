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
  builds/                the newest GitHub Actions runs (runs.json) and, for
                         every workflow whose newest finished run failed, the
                         logs of its failed jobs: builds/<workflow>/run-<id>/
                         job-<id>-<name>.log, and the last lines of each in
                         .tail.txt - what to read to fix the build

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

# A finished run or job that did not succeed.
FAILED = {"failure", "timed_out", "startup_failure", "action_required"}
# A job log is kept up to this size; the rest is cut, and said so.
MAX_LOG_BYTES = 50 * 1024 * 1024
TAIL_LINES = 200

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


def gh_text(path):
    """GET path through `gh api` as text - a job's log, which GitHub answers with a
    redirect to the log file; gh follows it."""
    args = ["gh", "api", "-H", "X-GitHub-Api-Version: 2022-11-28", path]
    proc = subprocess.run(args, capture_output=True)
    if proc.returncode != 0:
        message = (proc.stderr or proc.stdout or b"gh api failed").decode(errors="replace").strip()
        m = re.search(r"HTTP (\d{3})", message)
        raise GhError(message, int(m.group(1)) if m else None)
    return proc.stdout


def slug(text):
    """A file or directory name from a workflow's or job's name: never a path."""
    v = re.sub(r"[^A-Za-z0-9._-]+", "-", str(text or ""))
    v = re.sub(r"-{2,}", "-", re.sub(r"\.{2,}", "-", v)).strip("-.")[:80]
    return v or "unnamed"


def newest_per_workflow(runs):
    """The newest FINISHED run of each workflow, newest first, as GitHub lists them."""
    seen, out = set(), []
    for run in runs:
        wf = run.get("workflow_id") or run.get("name")
        if wf in seen or run.get("status") != "completed":
            continue
        seen.add(wf)
        out.append(run)
    return out


def download_builds(org, repo, run_dir, runs_limit, log):
    """The newest Actions runs, and the failed jobs' logs of each workflow whose
    newest finished run failed. Returns the summary rows."""
    bdir = os.path.join(run_dir, "builds")
    os.makedirs(bdir, exist_ok=True)
    try:
        pages = gh_api(f"/repos/{org}/{repo}/actions/runs?per_page={max(1, min(runs_limit, 100))}", paginate=False)
    except GhError as e:
        with open(os.path.join(bdir, "status.txt"), "w", encoding="utf-8") as fh:
            fh.write(f"Not downloaded: {e}\n")
        log(f"  builds: not available ({e.status or 'error'})")
        return None
    runs = []
    for page in pages:
        runs.extend((page.get("workflow_runs") or []) if isinstance(page, dict) else [])
    write_json(os.path.join(bdir, "runs.json"), runs)
    rows = []
    for run in newest_per_workflow(runs):
        conclusion = run.get("conclusion") or ""
        row = {"workflow": run.get("name") or "", "branch": run.get("head_branch") or "", "conclusion": conclusion,
               "url": run.get("html_url") or "", "sha": (run.get("head_sha") or "")[:10], "jobs": []}
        rows.append(row)
        if conclusion not in FAILED or not re.match(r"^\d+$", str(run.get("id", ""))):
            continue
        rdir = os.path.join(bdir, slug(run.get("name")), f"run-{run['id']}")
        os.makedirs(rdir, exist_ok=True)
        try:
            jobs = []
            for page in gh_api(f"/repos/{org}/{repo}/actions/runs/{run['id']}/jobs?per_page=100&filter=latest"):
                jobs.extend((page.get("jobs") or []) if isinstance(page, dict) else [])
        except GhError as e:
            log(f"  builds: {row['workflow']} run {run['id']}: jobs not available ({e.status or 'error'})")
            continue
        write_json(os.path.join(rdir, "jobs.json"), jobs)
        for job in jobs:
            if job.get("conclusion") not in FAILED or not re.match(r"^\d+$", str(job.get("id", ""))):
                continue
            steps = [st.get("name") or "" for st in job.get("steps") or [] if st.get("conclusion") in FAILED]
            name = f"job-{job['id']}-{slug(job.get('name'))}"
            entry = {"name": job.get("name") or "", "steps": steps, "log": ""}
            try:
                try:
                    text = gh_text(f"/repos/{org}/{repo}/actions/jobs/{job['id']}/logs")
                except GhError as first:
                    # The log endpoint answers with a redirect to storage that
                    # some gh versions and tokens do not follow; `gh run view`
                    # reads the same log through the run's archive.
                    proc = subprocess.run(["gh", "run", "view", str(run["id"]), "--job", str(job["id"]), "--log-failed",
                                           "-R", f"{org}/{repo}"], capture_output=True)
                    if proc.returncode != 0 or not proc.stdout.strip():
                        raise GhError(f"{first}; gh run view: "
                                      f"{(proc.stderr or b'').decode(errors='replace').strip()}", first.status)
                    text = proc.stdout
                cut = len(text) > MAX_LOG_BYTES
                with open(os.path.join(rdir, f"{name}.log"), "wb") as fh:
                    fh.write(text[:MAX_LOG_BYTES])
                    if cut:
                        fh.write(f"\n[cut at {MAX_LOG_BYTES} bytes of {len(text)}]\n".encode())
                tail = text.decode("utf-8", errors="replace").splitlines()[-TAIL_LINES:]
                with open(os.path.join(rdir, f"{name}.tail.txt"), "w", encoding="utf-8") as fh:
                    fh.write("\n".join(tail) + "\n")
                entry["log"] = os.path.relpath(os.path.join(rdir, f"{name}.log"), run_dir)
            except GhError as e:
                log(f"  builds: {row['workflow']} job {job['id']}: log not available ({e.status or 'error'})")
                with open(os.path.join(rdir, f"{name}.log-error.txt"), "w", encoding="utf-8") as fh:
                    fh.write(f"The log was not downloaded: {e}\n")
                entry["log"] = f"log not available ({e.status or 'error'}): " + os.path.relpath(
                    os.path.join(rdir, f"{name}.log-error.txt"), run_dir)
            row["jobs"].append(entry)
    failed = [r for r in rows if r["conclusion"] in FAILED]
    log(f"  builds: {len(runs)} runs, {len(rows)} workflows, {len(failed)} failing")
    return rows


def redact_secrets(alert):
    """A secret scanning alert without the secret it found."""
    alert = dict(alert)
    for key in ("secret", "secret_value"):
        if key in alert and alert[key]:
            alert[key] = "[REDACTED - run with --include-secret-values to keep it]"
    return alert


def write_json(path, value, private=False):
    """value as JSON at path; private=True creates it readable by its owner only,
    for a file that holds the secrets --include-secret-values kept."""
    if private:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        os.chmod(path, 0o600)  # an existing file keeps its old mode otherwise
        fh = os.fdopen(fd, "w", encoding="utf-8")
    else:
        fh = open(path, "w", encoding="utf-8")
    with fh:
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
        # Nothing from the alert itself: SUMMARY.md is never redacted and is the
        # file most likely to be pasted somewhere, so it says only what kind of
        # finding this is. The secret's type is in alert-<n>.json, beside it
        # (CodeQL py/clear-text-storage-sensitive-data, code scanning alert #604).
        return "", "Secret scanning alert - details in secret-scanning/", ""
    return alert.get("severity", ""), alert.get("summary", ""), ""


def download_repo(org, repo, run_dir, state, include_secrets, log, builds=100):
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
        private = kind == "secret-scanning" and include_secrets
        write_json(os.path.join(kind_dir, "alerts.json"), alerts, private)
        n_open = 0
        for alert in alerts:
            ident = str(alert.get(key, "")).strip()
            if not re.match(r"^[A-Za-z0-9-]+$", ident):
                continue
            name = f"advisory-{ident}.json" if kind == "security-advisories" else f"alert-{ident}.json"
            write_json(os.path.join(kind_dir, name), alert, private)
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
    build_rows = download_builds(org, repo, run_dir, builds, log) if builds else None
    write_summary(org, repo, run_dir, counts, open_rows, build_rows)
    return len(open_rows)


def md(text):
    return str(text).replace("|", "\\|").replace("\n", " ")


def write_summary(org, repo, run_dir, counts, rows, builds=None):
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
    if builds is not None:
        failing = [b for b in builds if b["conclusion"] in FAILED]
        lines += ["", "## Builds", "",
                  f"The newest finished run of each of {len(builds)} workflows; {len(failing)} failed. "
                  "The failed jobs' logs are in builds/.", ""]
        if builds:
            lines += ["| Workflow | Branch | Result | Failed jobs and steps | Log | Link |", "| --- | --- | --- | --- | --- | --- |"]
            for b in sorted(builds, key=lambda b: (b["conclusion"] not in FAILED, b["workflow"].lower())):
                jobs = "; ".join(f"{j['name']}" + (f" ({', '.join(j['steps'])})" if j["steps"] else "") for j in b["jobs"])
                logs = " ".join(j["log"] for j in b["jobs"] if j["log"])
                lines.append(f"| {md(b['workflow'])} | {md(b['branch'])} | {md(b['conclusion'])} | {md(jobs)} | {md(logs)} | {b['url']} |")
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
    p.add_argument("--builds", type=int, default=100, metavar="N",
                   help="look at the N newest GitHub Actions runs (at most 100) and keep the failed jobs' logs "
                        "of each workflow whose newest run failed; 0 = no builds (default 100)")
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
        total_open += download_repo(args.org, repo, run_dir, args.state, args.include_secret_values, print,
                                    max(0, args.builds))
    print(f"Done: {len(repos)} repositories, {total_open} open alerts, under {os.path.join(args.out, args.org)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
