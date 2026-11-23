# Downloading GitHub's "Security and quality" alerts

`download-github-security.sh` saves every repository's security alerts of a
GitHub organization, so they can be read and fixed from the files - inside the
editor's sandbox too, where the GitHub CLI and its login are not.

## Run it

Outside the sandbox, with the [GitHub CLI](https://cli.github.com/) installed
and signed in (`gh auth login`) as an account that may read the organization's
security alerts:

```bash
releases/sec/download-github-security.sh wekan
```

| Option | What it does |
| --- | --- |
| `--repo NAME` | only that repository; may be given more than once |
| `--state open` | only the open alerts (default: all of them) |
| `--out DIR` | write under DIR instead of `.tools/log/sec` |
| `--include-archived`, `--include-forks` | archived repositories and forks too |
| `--builds N` | look at the N newest GitHub Actions runs (at most 100, the default); `--builds 0` downloads no builds |
| `--include-secret-values` | keep the secrets secret scanning found - they are redacted by default |
| `--no-advisories` | skip the Advisory Database entries, the dependency advisories and the organization's advisory list |

## What it writes

```
.tools/log/sec/<organization>/<repository>/<YYYY-MM-DD_HH-MM-SS>/
  SUMMARY.md                 every open alert, with its link
  dependabot/                alerts.json, alert-<n>.json
  code-scanning/             alerts.json, alert-<n>.json, alert-<n>.instances.json
  secret-scanning/           alerts.json, alert-<n>.json (secret redacted)
  security-advisories/       alerts.json, advisory-<GHSA>.json
  advisory-database/         index.json, advisory-<GHSA>.json - each of those GHSAs
                             in the global GitHub Advisory Database
  dependency-advisories/     sbom.json, advisories.json, advisory-<GHSA>.json - the
                             reviewed advisories of the package versions in use
  builds/                    runs.json, the newest Actions runs
    <workflow>/run-<id>/     for a workflow whose newest finished run failed:
      jobs.json              its jobs and their steps
      job-<id>-<name>.log    each failed job's whole log
      job-<id>-<name>.tail.txt   its last 200 lines - usually where the error is
```

```
.tools/log/sec/<organization>/_organization/<YYYY-MM-DD_HH-MM-SS>/
  security-advisories.json   every repository advisory of the organization
  SUMMARY.md                 the same as a table: GHSA, repository, state, CVE
```

**Advisories.** Three kinds, all on by default (`--no-advisories` skips them):

| | Where it comes from | What it answers |
| --- | --- | --- |
| `security-advisories/` | `/repos/{org}/{repo}/security-advisories` | the repository's own GHSAs, drafts and private reports too, with their CVEs |
| `advisory-database/` | `/advisories/{ghsa}` for each of those | whether GitHub has imported it into the global [Advisory Database](https://github.com/advisories). WeKan's own are never there: their package, `wekan/wekan`, is in no ecosystem the database covers, so the CVE is read from the repository advisory |
| `dependency-advisories/` | the dependency graph's SBOM, then `/advisories?ecosystem=…&affects=name@version` in batches of 50 | the reviewed advisories that affect the exact npm, Go, pip, … versions in use - Dependabot's view, read straight from the database, withdrawn ones left out |
| `_organization/` | `/orgs/{org}/security-advisories` | every repository's advisories in one list, once per run |

SUMMARY.md lists them under "Advisory Database" and "Dependency advisories",
the dependency ones by severity. A Hall of Fame update reads the CVEs from
here (see CLAUDE.md / AGENTS.md, Security issues).

**Builds.** SUMMARY.md ends with a table of every workflow's newest finished
run - failed ones first, with the failed jobs, their failed steps and the path
of each log - so all broken builds of an organization can be fixed from one
download. A run still in progress is skipped, older runs of a workflow are not
downloaded, and a successful job's log is not either. Reading Actions needs no
scope beyond `repo` (`actions:read` for a fine-grained token).

A kind GitHub does not answer for a repository - not enabled, or not visible to
the account - gets `status.txt` with GitHub's reason, and the run goes on. Each
run is a new datetime directory, so an earlier download is never overwritten.

`.tools/` is excluded by `.gitignore` and `.meteorignore`: nothing downloaded
can reach a commit or a Meteor rebuild. The secret values themselves are not
written unless asked for, because the files outlive the session that needed
them.

## The token

`gh auth login` with the `repo` and `security_events` scopes reads all four
kinds; `read:org` as well for a private organization. A fine-grained token
needs read access to Dependabot alerts, code scanning alerts, secret scanning
alerts and repository security advisories.

Tests: `node tests/securityDownloadScript.test.cjs` runs the script against a
stand-in `gh` and checks the layout, the redaction and the refused names.
