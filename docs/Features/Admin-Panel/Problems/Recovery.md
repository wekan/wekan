# Design: SQLite corruption/bloat safety, automatic recovery, and Admin Panel → Problems → Recovery

> **This page uses the shared [Table Page](../../../Features/Page/Table.md) design.**
> The layout, search, pagination, column spec and per-page data loading are defined
> there and are not repeated here.

Status: **Implemented for bundled FerretDB SQLite launch paths** · Owner: xet7 · Related (#6492):
`models/lib/recoveryPlan.js`, `models/lib/recoveryEventsJsonl.js`,
`models/recoveryEvents.js`, `server/recovery.js`,
`server/publications/recoveryReport.js`, `client/components/settings/adminProblems.*`,
`snap-src/bin/ferretdb-control`, `releases/ferretdb/*`, and the FerretDB fork
(`internal/backends/sqlite/metadata/pool/opendb.go`,
`internal/handler/handler.go`).

The implementation target and safety invariants are defined first in
[Verified FerretDB SQLite recovery](../../../Databases/FerretDB/1/Verified-Recovery.md).
That document is authoritative for snapshot format, checksums, disk-space gates,
automatic source selection, migration fallback and low-load scheduling.

When WeKan stores its data in FerretDB v1 (SQLite), the text data lives in
`wekan.sqlite`. Attachments and avatars live on the **filesystem**, not in the
database. This subsystem keeps that text data safe: it prevents the database from
bloating, detects corruption, keeps a ready-to-use backup, restores or re-migrates
when an operator requests it, and shows the remediation history in Admin Panel →
Problems → **Recovery**.

## What each layer does

### FerretDB (the database engine)

- **Automatic corruption detection.** Every time a database file is opened, FerretDB
  runs SQLite's fast `PRAGMA quick_check`; anything but `ok` is logged prominently.
  Corruption cannot be repaired in place, so this only reports it — recovery is done
  by WeKan (restore/re-migrate).
- **Automatic bloat repair.** On open, FerretDB `VACUUM`s a file whose free pages
  dominate it (≥ ~1 MiB and ≥ ¼ free), rebuilding it compactly. Content-preserving.
- **Bounded OpLog.** `local.oplog.rs` is capped small (16 MiB) so the transient
  `local.sqlite` cannot bloat and drive CPU high.
- Toggle: `FERRETDB_SQLITE_AUTO_REPAIR=false`.

### WeKan startup (the launch scripts, files at rest)

Before FerretDB opens the files, every launch path (snap `ferretdb-control`, the
bundled release `start-wekan.sh`, the Docker `wekan-entrypoint.sh`):

- **Backs up the text data.** Copies `wekan.sqlite*` into a `backup/` subfolder of the
  same data dir, keeping the previous generation under `backup/prev`. It only ever
  **copies** the live database — never moves or deletes it — and never copies
  attachments/avatars. Toggle: `WEKAN_SQLITE_BACKUP=false`.
- **Restores on request.** If a restore is requested — the `WEKAN_FORCE_RESTORE` env or
  a `RESTORE_REQUESTED` marker file containing `backup`, `prev` or `remigrate` — it
  copies the chosen known-good backup **into** the live database (dropping the stale
  WAL side-files so the copy is used cleanly) and records the action. The backup copies
  are never deleted; the main `wekan.sqlite` is only ever overwritten, never removed.
  `remigrate` requests a re-migration of the text data from MongoDB (handled by
  `migration-control`); attachments/avatars on the filesystem are untouched.
- **Resets the transient OpLog** (`local.sqlite`) so a bloated/corrupt OpLog cannot
  persist across a restart. Toggle: `WEKAN_FERRETDB_RESET_OPLOG=false`.

### The recovery decision

`models/lib/recoveryPlan.js` (`decideRecovery`) is the pure, unit-tested policy: given
the integrity result and what backups / MongoDB are available, it chooses the
least-invasive recovery — latest good backup → previous backup → re-migrate → (else)
manual. It never chooses anything destructive unless the database is **known corrupt**.
The launch scripts implement this policy through `sqlite-recovery.mjs` and FerretDB's
read-only `check-sqlite` command. They verify the live file before FerretDB opens it,
then restore and re-check latest or previous compressed snapshots. Snap quarantines
unusable SQLite files and re-runs migration when retained MongoDB source files exist.

## Failure coverage and recovery ownership

| Failure | Mitigation / recovery | Problems → Recovery |
| --- | --- | --- |
| Transient OpLog is corrupt or bloated | Removed at startup and recreated automatically | Startup output; text-data events are separate |
| Text database is corrupt | Startup tries latest, previous, then retained MongoDB migration source | `corruption-detected`, then the automatic outcome |
| Requested backup is missing or mode is invalid | Live data is left in place and the request is retained | `manual-required` |
| Restore copy fails | No success is reported; marker and request remain for retry | `restore-failed` |
| Backup copy fails | Startup continues and the prior generation remains available | `backup-failed` |
| Recovery succeeds but database remains unreadable | Maintenance state remains instead of exposing a broken app | `manual-required` |
| Bundled WeKan process exits | Bundle supervisor loop starts it again | Process logs; no database remediation is claimed |
| Container or snap process exits | Docker/snap service manager owns restart policy | Service-manager logs; no false Recovery row |

Verified snapshots are gzip-compressed below `<sqlite-dir>/.recovery`, carry SHA-256
and byte counts for compressed and uncompressed forms, and are published only after a
staged decompression verifies. Free space is checked without assuming compression.
Non-urgent creation waits for a low-load startup window; corrupt startup recovery is
urgent and does not leave the application serving known-corrupt text data.

### What users see during a recovery

Recovery must never look like a broken site. Two layers cover the whole window, on
**every** FerretDB v1 platform (snap, bundled release, Docker):

- **In-app maintenance spinner (all platforms).** When a recovery is in progress the
  server publishes a *public* status document — everyone, including logged-out users on
  the sign-in page, sees it — that drives a full-screen overlay with a spinner in both
  the app and sign-in layouts. The launch scripts write a `RECOVERY_IN_PROGRESS` marker
  when they restore/re-migrate; the server keeps the spinner up until it has
  health-probed the database (a real read), then **clears the marker** and hides the
  spinner — or, if it still cannot read, keeps the spinner and records that manual
  recovery is required. Admins can also toggle it for a server-initiated re-migration.
  Because the *server* owns clearing the marker, the spinner behaves identically on all
  platforms.
- **Static bridge page (before the app is up).** For the brief window while a
  just-restored FerretDB comes back up and before Meteor can serve the client, the
  launch scripts serve a tiny standalone "recovering your data" page (HTTP 503) on the
  web port so users never hit a bare connection error: the snap reuses
  `wekan-maintenance-page.mjs` (with a recovery wording), and the release/Docker paths
  serve the portable `releases/ferretdb/recovery-bridge.mjs`. The bridge is
  **time-bounded** (`WEKAN_RECOVERY_BRIDGE_SECONDS`, default 20s) and is only a visual
  bridge — it can never block WeKan from starting, and it hands straight over to the
  in-app spinner above. It is skipped cleanly if its page file or the marker is absent.

## Admin Panel → Problems → Recovery

The startup scripts append one JSON line per action to `recovery-events.jsonl` in the
data dir. On startup the WeKan server imports the new lines into the `recoveryEvents`
collection (`server/recovery.js`), and the **Recovery** report
(`server/publications/recoveryReport.js`, admin-only) lists them newest-first with the
same search + pagination as the other admin reports. Admins can also record a manual
event with the `recordRecoveryEvent` method.

Event types include `snapshot-created`, `snapshot-deferred`, `snapshot-failed`,
`backup-created`, `backup-failed`, `corruption-detected`,
`restore-backup`, `restore-prev`, `restore-failed`, `remigrate`, `bloat-repaired`,
`integrity-ok`, `manual-required`, each with a severity (info / warning / error).

Recovery also keeps the audit trail for irreversible board deletion. Changing
Admin Panel → Problems → Delete records `permanent-delete-setting-changed` with
the Global Admin username, user ID and whether the setting was enabled or
disabled. Every successfully purged archived board records
`board-permanently-deleted` with that actor, the board ID and its title. No-op,
unauthorized and failed operations are not logged as successful actions.

Attempted setting changes and board purges are always recorded with a Boolean
`done`, the user ID and username when known, and the proxy-aware IPv4 or IPv6
address resolved through `HTTP_FORWARDED_COUNT`. Board attempts also keep
bounded `boardIds` and `boardTitles` arrays; an ID that does not resolve uses an
unknown-title marker rather than disappearing from the audit.

The Recovery table begins with **Done**. `true` renders a green check, `false` a
red warning triangle, and a successful operation that physically deleted data
adds a yellow trashcan. A batch that partly completes therefore shows yellow
successful rows for the boards already removed and a red failed-attempt row for
the whole requested batch.

The filter dropdown above the table selects **All**, **Done**, **Failed** or
**Deleted** events. Filtering is applied by the server before counting and
pagination, and combines with the search term. Older events written before the
`done` field existed count as Done because those event types represented completed
recovery actions.

Below the existing database-recovery description, the pane has a second paragraph
explaining that Recovery also records permanent-delete setting changes and every
successful, failed or unauthorized purge attempt, together with its Done status,
actor, trusted address and attempted board IDs and titles.

Admin Panel → Problems → **Delete** repeats that same paragraph immediately below
its existing permanent-delete setting description. Both panes use one shared source
sentence, so the explanation at the control and the explanation at its audit trail
cannot drift apart.

## Manual recovery

To force a restore on the next start, set `WEKAN_FORCE_RESTORE=backup` (or `prev`, or
`remigrate`) in the environment, or create a `RESTORE_REQUESTED` file containing that
word in the SQLite data dir, then restart WeKan. The action is recorded in the
Recovery report.

## Tests

- `tests/recoveryPlan.test.cjs` — the decision logic (positive + negatives: never act
  on a healthy/unknown database; never restore a known-bad backup; nothing to restore
  → manual, non-destructive).
- `tests/recoveryEventsJsonl.test.cjs` — the JSONL parser (skips junk, normalizes
  severity, bounds line size; never throws).
- `tests/recoveryReportQuery.test.cjs` — the report search and outcome selectors
  (including combined filters, legacy Done rows and escaped regex metacharacters).
- `tests/recoveryReportWiring.test.cjs` — the Recovery report is wired and the
  publication/count/method are admin-gated.
- `tests/permanentDeleteRecoveryAudit.test.cjs` — permanent-delete setting
  changes and board-purge attempts record status, actor, address and affected
  boards; it also pins the Done/deletion icons and proves failed operations
  cannot produce success records.
- `tests/ferretdbTextDataBackup.test.cjs` — the backup/restore scripts (critical
  negatives: never delete the live text data or a backup copy, never copy
  attachments/avatars, never report a failed copy as success, and retain failed
  restore requests for automatic retry on restart).
- FerretDB: `opendb_test.go` (corruption check + bloat `VACUUM`) and
  `msg_replset_test.go` (OpLog cap).
