# Release menus and dependency review

Run `./build.sh` or `build.bat` and select **Release All** or
**Release All Missing**. WeKan lists these under Releases / Release.
The same commands are available as `build.sh release-all` and
`build.sh release-all-missing` (or `build.bat` on Windows).
Windows uses Git Bash; install Python 3, Git and GitHub CLI on PATH.
Authenticate GitHub CLI before releasing.

Release All requires a nonempty Upcoming section, checks dependency reviews,
prepares the release heading/version, commits **all nonignored changes**
(including untracked files), pushes the default branch, and dispatches Actions.
Builds, release assets and website publication run in Actions.
Never put secrets or generated build output in nonignored files.

Release All Missing keeps the selected existing release version and Upcoming
notes unchanged. It retries missing/failed outputs and preserves complete
outputs. It uses the latest published release by default, or takes an explicit
release version. Existing release notes suffice if no new Upcoming exists;
completing a release does not require inventing new release notes.

For a read-only preflight, use `./build.sh release-all --check` or
`./build.sh release-all-missing --check`. Preflight may contact GitHub to resolve
versions and verify upstream references, but does not commit, push or dispatch.
`python3 releases/remote-release.py --audit` checks local dependency metadata
and configured source audits without contacting a forge.

`releases/dependency-review.json` records the current dependency metadata
baseline. Added, changed, deleted or symlinked manifests and lockfiles fail
closed, including nonignored untracked files that would be committed. Release
number changes are normalized; dependency versions and lock resolutions are not.
This is a change-review gate, not a vulnerability database or a claim that every
existing dependency is vulnerability-free. Existing telemetry source and binary
checks remain mandatory where available. No release command refreshes reviews.

When the gate fails, review the dependency diff and upstream source, fix unsafe
behavior, run positive/negative and relevant runtime tests, and explicitly update
the review record in the reviewed change. Do not approve an inventory merely
because it builds. The standalone launcher copies have identical logic and
`python3 -B tests/remoteRelease.test.py` tests with all remote writes mocked.

The dispatch pins the repository and default branch, following the
[GitHub CLI workflow-run interface](https://cli.github.com/manual/gh_workflow_run).
A failed commit or push prevents dispatch. If dispatch fails after a push,
use the missing workflow if the release already exists, or retry dispatch
manually with the prepared version; do not prepare another new release merely to retry a failed job.

WeKan retains its existing next-version and changelog validation helpers.
Missing releases first retry failed jobs of the matching full-release workflow,
then fill remaining packaging gaps. Failed-job retries preserve successful jobs.
Legacy runs are matched through their release preparation commit; if no matching
run exists and native assets are absent, the workflow fails with an explicit
message instead of claiming completion. Hosted retries need Actions write access.
