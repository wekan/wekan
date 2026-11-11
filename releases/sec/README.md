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
| `--include-secret-values` | keep the secrets secret scanning found - they are redacted by default |

## What it writes

```
.tools/log/sec/<organization>/<repository>/<YYYY-MM-DD_HH-MM-SS>/
  SUMMARY.md                 every open alert, with its link
  dependabot/                alerts.json, alert-<n>.json
  code-scanning/             alerts.json, alert-<n>.json, alert-<n>.instances.json
  secret-scanning/           alerts.json, alert-<n>.json (secret redacted)
  security-advisories/       alerts.json, advisory-<GHSA>.json
```

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
