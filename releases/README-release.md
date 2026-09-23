# Release menus and automated dependency checks

Run `./build.sh` or `build.bat` and select **Release All** or
**Release All Missing**. WeKan lists them under Releases / Release.
The commands are also available as `build.sh release-all` and
`build.sh release-all-missing` (or `build.bat` on Windows).
Windows uses Git Bash; Python 3, Git and authenticated GitHub CLI must be on PATH.

Release All requires a nonempty Upcoming section, runs automated checks,
prepares the next release heading/version, commits all nonignored changes
including new files, pushes the default branch, and dispatches Actions.
Builds and publication run in Actions. Release All Missing keeps the existing
version and notes, commits pending changes, and retries failed or missing outputs.
It selects the latest published release or accepts an explicit release version.
No new Upcoming section is needed merely to complete an existing release.

Use `./build.sh release-all --check` or `./build.sh release-all-missing --check`
for a preflight without commits, pushes or dispatch. Version resolution can
contact GitHub. `python3 releases/remote-release.py --audit` runs local checks.

Dependency checks are **best effort**, not a requirement for AI approval or an
exhaustive manual review. Ordinary changed hashes and missing historical review
records are informational. Builds stop on detected indicators:

- A file or artifact matches a known telemetry/security hash.
- Source introduces suspicious keyword occurrences beyond its existing baseline.
- Source contains a new HTTP(S) URL literal outside its URL allowlist.
- Existing artifact signature checks find known telemetry implementations.

The checks report affected paths and indicator types. URL query strings and
credentials are not printed. Normal local logging and baseline-compatible code
remain allowed. Standard npm and Go registry URLs are dependency transport and
are excluded from the new-URL rule. Patch inputs inspect added lines, so removing
telemetry does not itself trigger a warning about the deleted reporting code.

`risk-baseline.json` holds comparison data; `dependency-review.json` is retained
as an informational metadata fingerprint list. A missing initial URL baseline
warns instead of blocking everything; known hashes and keyword checks still run.
Binary URL comparisons are supported when `artifactUrls` is configured; other
binary checks use known hashes and telemetry signatures. These heuristics can
have false positives and cannot prove the absence of arbitrary reporting code.

Fix unwanted reporting when detected. Legitimate URLs/keywords can be configured
in the baseline without AI approval. `allowUrlPatternsByFile` optionally permits
full-match URL patterns in named files only; keep hosts and paths specific.
The website uses this for Node 26 version-directory links on its install page. To explicitly record expected source data:
`python3 releases/risk-audit.py --source . --record-baseline`.
Do not baseline unwanted reporting. Patch repositories use a separate
`upstream-risk-baseline.json` for their upstream source; pass it with `--policy`.
Release commands never silently update these baselines to hide findings.

Run `python3 -B tests/remoteRelease.test.py` and
`python3 -B tests/riskAudit.test.py` for offline positive and negative tests.
Release writes are mocked. Dispatch uses an explicit repository and branch,
following the [GitHub CLI interface](https://cli.github.com/manual/gh_workflow_run).
A failed commit or push prevents dispatch. If dispatch fails after pushing,
retry that prepared version rather than incrementing again.

WeKan resolves the latest stable Node.js 26.x, MongoDB 7.0.x and npm 12.x
from official Node.js, MongoDB and npm metadata during Actions version preparation.
Both Linux amd64 and arm64 archives must be listed and reachable. MongoDB rapid
release series such as 7.3 are excluded. A metadata or artifact failure stops
before version files are changed. Ordinary updates still pass the subsequent
risk audit. Meteor follows `.meteor/release`; FerretDB uses its latest published
fork release. The website manifest reports these actual release selections.
`python3 releases/dependency-versions.py` prints the current selections without
changing files or publishing. `USE_LOCAL_DEP_VERSIONS=1` retains offline cache mode;
`RELEASE_SKIP_DEP_DOWNLOAD=1` skips tarball caching, not version discovery.
Missing builds first retry failed jobs of the matching full-release run, then
fill packaging gaps. Legacy runs are matched through their preparation commit.
If native assets remain missing and no matching run exists, the workflow reports
an error instead of claiming completion. Successful jobs are not rerun.

Known dependency keyword false positives can be listed as exact lines under
`knownKeywordMatches` in `dependency-review.json`, keyed by file path with a
nonempty `reason`. Matching entries print as informational, not new warnings.
New or changed lines remain `New/unclassified dependency keyword hints` for
review. No wildcard module exemptions or automatic baselining are used.
Source and binary risk checks run independently and are never suppressed by
these metadata classifications. An empty classification list means no existing
matches have been verified, not that future matches are safe.
