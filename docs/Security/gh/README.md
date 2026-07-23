# docs/Security/gh — pulling GitHub's security & code-quality reports

`pull-security-reports.sh` downloads **every security and code-quality report
GitHub exposes for a repository — open and closed — into one timestamped
directory of plain JSON and text files**, so the whole Security tab can be read
offline, diffed between runs, and handed to a reviewer (human or assistant) in
one piece.

It exists because the VSCode Flatpak sandbox
(`docs/Security/Sandboxes/vscode/`) has neither `gh` nor network access to
`api.github.com`. The maintainer runs this script on the host, then points the
assistant at the output directory.

## Usage

```sh
# from the repo root, on the host (NOT inside the Flatpak sandbox)
./docs/Security/gh/pull-security-reports.sh

# another repo, another destination, plus the full SARIF of the newest analysis
./docs/Security/gh/pull-security-reports.sh -r wekan/wekan -o /tmp/wekan-sec --sarif
```

| Flag | Meaning |
| --- | --- |
| `-r`, `--repo` | `owner/repo` to query. Default: the current git remote, else `wekan/wekan`. |
| `-o`, `--out` | Reports root. Default: `docs/Security/gh/reports`. A `YYYY-MM-DD_HH-MM-SS/` run directory is created inside it. |
| `--sarif` | Also download the newest CodeQL analysis as SARIF — every result with its full code-flow steps. Large. |
| `-h`, `--help` | Usage. |

### Requirements

- **`gh`** — <https://cli.github.com/>, authenticated with `gh auth login`.
- **`jq`** — used to split and summarize responses. The script exits early with
  install hints if it is missing.

The CodeQL, Dependabot and secret-scanning endpoints need the
**`security_events`** scope on top of `repo`. If you get `403`s:

```sh
gh auth refresh -h github.com -s security_events -s repo
```

## Output layout

```
reports/
  latest -> 2026-07-23_21-05-44          symlink to the newest run
  2026-07-23_21-05-44/
    00-summary.txt                       what was fetched, what failed, counts
    Repository/                          which security features are enabled
    CodeQuality/
      StandardFindings/                  CodeQL maintainability + reliability
        open/    alerts.json alerts.txt by-rule.txt counts.txt by-file.txt
        closed/  (same files)
      AIFindings/                        AI findings on recently changed files
        open/ closed/ NOTE.txt
    CodeScanning/                        CodeQL security alerts
      open/ closed/
      analyses.json/.txt  default-setup.json  codeql-databases.json
    Dependabot/
      Vulnerabilities/  open/ closed/    alerts.json alerts.txt counts.txt
      Malware/          open/ closed/
    SecretScanning/     open/ closed/    secret values redacted
    Advisories/         open/ closed/    advisories.json advisories.txt
    DependencyGraph/    sbom.json/.txt
    Raw/                                 unsplit API responses
```

The category names mirror the GitHub Security tab, so a finding you are looking
at in the browser is in the directory with the same name.

### The files inside each `open/` and `closed/`

| File | Contents |
| --- | --- |
| `alerts.json` | The raw API objects for that category and state — nothing dropped, for regrepping later. |
| `alerts.txt` | One readable block per finding: severity, rule id, `file:line`, tool, message, dismissal reason, URL. |
| `by-rule.txt` | The same findings **grouped by rule**, biggest rule first, `file:line` sorted — this is the view that matches how the web UI groups things, and the fastest way to triage. |
| `counts.txt` | One line per rule: `count  severity  rule-id  description`. The top-level picture in ~30 lines. |
| `by-file.txt` | One line per file: `count  path`. Shows where the findings concentrate. |

Dependabot's `counts.txt` instead counts per severity, per package, and per
manifest. Advisories use `advisories.json` / `advisories.txt`.

## Design

**One run per directory, never overwritten.** Every invocation creates a new
`YYYY-MM-DD_HH-MM-SS/` directory and repoints the `latest` symlink. Runs are
therefore diffable — `diff -r reports/2026-07-01_* reports/2026-07-23_*` shows
exactly what appeared and what got fixed between two dates.

**Fetch once, split locally.** Code scanning, Dependabot, secret scanning and
advisories are each fetched **once with no state filter**, so a single paginated
request returns every state. The response is saved under `Raw/`, then `jq`
splits it into the category and state directories. This keeps API traffic
minimal and guarantees `open` + `closed` are a partition of the same snapshot
rather than two requests taken at different moments.

**How code scanning alerts are split three ways.** GitHub returns quality and
security findings from the same endpoint; the UI separates them. The script
reproduces that split from the alert fields:

- **AIFindings** — `.tool.name` matches `copilot`, `autofix` or `ai`.
- **StandardFindings** — not AI, and either `.rule.tags` contains
  `maintainability` / `reliability` / `quality`, or `.rule.security_severity_level`
  is `null` (a rule with no security severity is a quality rule).
- **CodeScanning** — everything else, i.e. the security queries.

**Dependabot malware vs vulnerabilities.** `Malware/` takes alerts whose
advisory type/classification is `malware`, **or** whose summary/description
matches `malicious code|malware|malicious package` — the classification field is
not always populated on repository alerts, so the text check is a deliberate
fallback. Everything else goes to `Vulnerabilities/`.

**One alert = one location.** A code scanning alert is a single finding at a
single `file:line`. So `alerts.json` is already the per-rule `file:line` list;
no extra `/instances` request is needed to know where a rule fired.

**Nothing aborts the run.** Each endpoint is fetched by a `fetch` helper that
records a failure in `00-summary.txt` and in a per-endpoint `.error.txt` and
then continues. A disabled feature or a missing token scope costs you one
category, not the whole dump. Read `00-summary.txt` first: it lists every
endpoint as `OK` / `FAIL` / `NOTE` with counts.

### Two safety properties

1. **Secret values are never written to disk.** The secret-scanning API returns
   the live credential in `.secret`. The script deletes that field before
   writing anything, so the dump can describe a leak without containing a
   working credential.
2. **The reports are never committed.** The reports root gets a `.gitignore`
   containing `*`, written on every run. These files describe *unfixed*
   vulnerabilities in a public repository — publishing them would be handing out
   a target list. Keep them local; paste only what a fix needs.

### Known gap: AI findings

"AI findings" (Security → Findings → AI findings) has **no documented REST
endpoint**. `CodeQuality/AIFindings/` is populated best-effort by tool-name
matching, and each run drops a `NOTE.txt` saying so. If `alerts.json` there is
an empty array, GitHub is not exposing those findings through the API and they
have to be read in the browser:

```
https://github.com/<owner>/<repo>/security/code-quality
```

## Reading the results

Start at `00-summary.txt` for the per-category open/closed counts, then:

- `CodeQuality/StandardFindings/open/counts.txt` — the rule-level overview.
- `CodeQuality/StandardFindings/open/by-rule.txt` — the actual `file:line` list
  to work through, worst rules first.
- `Dependabot/Vulnerabilities/open/alerts.txt` — each vulnerable package with
  its vulnerable range and the version that fixes it (or
  `NO PATCH AVAILABLE`).

Note that CodeQL quality findings are **not** vulnerabilities. Triage them by
severity: `error`-level reliability rules (overwritten property, missing
`await`, comparison between inconvertible types) are worth reading as possible
bugs; `note`-level maintainability rules (unused variable, semicolon insertion)
are style noise.

⚠️ **Do not bulk-fix "unused import" findings in this repo.** In Meteor/Blaze,
`import './something.js'` is frequently side-effecting — it registers a
template, a collection hook, or a route. CodeQL sees no binding used and reports
it as dead code; removing those breaks the app at runtime, not at build time.

## Testing changes to the script

The script talks only to `gh`, so it can be exercised without network by putting
a fake `gh` earlier in `PATH` that prints fixture JSON for each endpoint, and
running with `-o` pointed at a scratch directory. That validates the directory
layout, the `jq` splits and the summary counts offline — which is how the
current version was verified from inside the sandbox.
