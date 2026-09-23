# Release telemetry checks

Release All and Release All Missing audit application source before release work,
then audit the final bundle before compression. Reusable AppImage, Flatpak, Mac
and Windows wrappers also audit their downloaded payloads; Windows ZIP members
are streamed without unpacking the virtual bundle. Local bundle assembly and
missing-platform repacking use the same check. Docker checks after dependency
installation and pruning, Snap checks before staging, and Sandstorm checks its
FerretDB dependency and the final built bundle before upload.

Failures print `::error::Telemetry audit failed: ...` with the affected file or
signature and return nonzero. A telemetry failure is never an unsupported-platform
skip. Builds do not automatically rewrite the reviewed source inventories.

## What was reviewed

- **WeKan:** no standalone default usage reporter found in application source or
  the current local production bundle. Security/audit logging, the local metrics
  endpoint and Meteor's instrumentation emitter remain. These are local or
  explicitly configured features, not a default external reporting service.
- **Meteor tooling:** Meteor 3.6.0-beta.1's installed
  `tools/meteor-services/stats.js` sends package lists to
  `activity.meteor.com` on build/run unless opted out. The application now
  includes `package-stats-opt-out@1.0.8`; both workflows also set
  `DO_NOT_TRACK=1`. The opt-out package has no reporting implementation.
  Meteor's CLI is an external build tool, not shipped application code.
- **mongosh-patches:** the existing patch removes the reporter, local telemetry
  collection, machine/agent identification and associated automatic reporting.
  Source inventory, compiled JavaScript checks and eval/REPL network-guard tests
  run before packaging. Empty or old telemetry bundles are rejected.
- **mongo-tools-patches:** cloud SDK reporting is patched after dependency
  regeneration. Source/vendor inventories and SDK request tests run before
  compilation; every native output is now scanned before checksumming.
- **FerretDB:** the former reporter is inert and locked disabled, including an
  explicit enable attempt. Remove its unused beacon URL default as well.
  Explicitly configured OpenTelemetry tracing remains opt-in: an empty URL never
  constructs an exporter. Source inventory and existing no-request tests run
  before both release matrices; native binaries are checked before acceptance.
  Serial and parallel matrices propagate audit failures.

Normal database connections, authentication, operator-configured integrations,
cloud storage operations and request correlation are not removed. Optional
JavaScript authentication SDKs in WeKan may retain client-identification headers
for explicitly configured authentication requests; their presence alone is not
a default background reporter. Native Database Tools have the stricter SDK
header-removal policy from their patch, which is checked on their executables.

## Source fingerprints and automated indicators

`releases/telemetry-source.json` and FerretDB's matching inventory provide
historical fingerprints. Ordinary changes, additions and deletions now warn;
no comprehensive AI or manual review is required before building. The automated
indicator checker separately blocks known telemetry/security hashes, new
suspicious keywords and new URL literals. Legitimate additions can be allowed
through the indicator baseline configuration. Builds never silently rewrite it.

WeKan's release-only application version fields and text line endings are
normalized. Translation data, generated API reference files, Font Awesome
metadata, Rspack's generated `public/build-assets` and `public/build-chunks`,
and Meteor's generated `.npm` directories are excluded from the source
inventory; final bundles are scanned including dependencies. The manifest lists
the exact scope. FerretDB records its source and pinned Go module metadata;
mongosh and Database Tools retain their own upstream/vendor audit inventories.

## Verification and limits

### Source review after the September 23 release failure

The saved `wekan2` release log stops in the bump job's source gate, before
building. Its reviewed inventory predates 46 changed runtime files. Compared
with the inventory at `63238a687`, the reviewed changes are:

- Multiline board/card/list/swimlane composers and CSS: local display, parsing
  and normal application mutations; no external reporting destination.
- Import parsing, file associations and Trello policy checks: local conversion
  and existing user-requested import paths; no new background reporter.
- Full backups and scheduler startup: local database/file streams by default.
  Cloud destinations still require saved operator configuration; schedules
  must be explicitly enabled. Cron history and progress remain local.
- Login adapters, field mapping, code consumption and Firefox submit timing:
  authentication against configured identity providers and local account
  state, not analytics. Sandstorm failures now return a generic response.
- Admin Panel bulk feature settings: authenticated application mutations.

Dependency manifests did not change in that repair, which refreshed the
1,577-file inventory. Current release checks still examine the actual checkout,
but source fingerprint drift is informational. Automated risk indicators, rather
than a missing comprehensive review, now determine whether a build stops.
Tests cover both nonblocking drift and rejection of concrete indicators.
The human-run `release-all.sh` launcher also checks source before repairing
commit links, renaming release notes or making remote writes. The workflows
retain their independent checks; the launcher does not refresh the inventory.

Run `node --test tests/releaseTelemetry.test.cjs tests/securityLog.test.cjs`
with `TMPDIR` under `.tools/tmp`. The tests cover positive local logging cases,
source drift, native signatures, compressed archive members (including chunk
boundaries), fatal log annotations and workflow integration. Companion
repositories contain their own independent regression suites.

Validated locally: the current 40,996-file WeKan bundle, all eight previously
built Database Tools executables, a freshly compiled macOS ARM64 FerretDB,
FerretDB's real telemetry tests and both matrix failure modes, and mongosh's
compiled eval/REPL network-guard tests. A stripped Database Tools binary rebuilt with the removal patch reversed was
rejected by the native gate. Meteor statistics opt-out was verified against the
installed tool source using a fake connection and a reporting control case.
No hosted release or publication was run.
A subsequent clean macOS ARM64 validation rebuilt Meteor's production bundle,
mongosh, FerretDB and all eight Database Tools. mongosh CRUD passed against both
MongoDB and FerretDB; Database Tools passed import/export, dump/restore, BSON,
GridFS, mongostat and mongotop checks against an isolated MongoDB. WeKan served
HTTP successfully against FerretDB, including the bundled launcher's SQLite
startup. npm 12's default rejection of Meteor's pinned source-map-support URL
was fixed with a validated bundle-local `allow-remote=root` setting. The local
bundle uses Meteor's portable ARM64 Node 26.8.2; the initial external-runtime
startup used Homebrew Node 26.9.0. Cross-platform builds were not run.

Artifact checks detect known removed reporting implementations and endpoints.
They cannot prove arbitrary machine code never transmits data, or detect every
possible encoded/new reporter. Reviewed source inventories, locked dependency
inputs and behavior tests complement those checks. Do not treat a clean strings
scan alone as approval of an unknown binary.


## Automated indicators instead of mandatory whole-source review

Source fingerprint drift is now informational. Release menus and workflows use
`releases/risk-audit.py` to stop on known telemetry/security hashes, newly added
suspicious keyword occurrences and new URL literals. Existing artifact signatures
and telemetry-removal/runtime checks remain active. Local logging is retained.
These are best-effort checks, not comprehensive verification or an AI approval
requirement. See [release menus and indicator configuration](../../releases/README-release.md).
