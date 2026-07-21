# Design: SQLite corruption/bloat safety, automatic recovery, and Admin Panel → Problems → Recovery

Status: **Implemented** · Owner: xet7 · Related (#6492):
`models/lib/recoveryPlan.js`, `models/lib/recoveryEventsJsonl.js`,
`models/recoveryEvents.js`, `server/recovery.js`,
`server/publications/recoveryReport.js`, `client/components/settings/adminReports.*`,
`snap-src/bin/ferretdb-control`, `releases/ferretdb/*`, and the FerretDB fork
(`internal/backends/sqlite/metadata/pool/opendb.go`,
`internal/handler/handler.go`).

When WeKan stores its data in FerretDB v1 (SQLite), the text data lives in
`wekan.sqlite`. Attachments and avatars live on the **filesystem**, not in the
database. This subsystem keeps that text data safe: it prevents the database from
bloating, detects corruption, keeps a ready-to-use backup, can restore or re-migrate
automatically, and shows the whole remediation history in Admin Panel → Problems →
**Recovery**.

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

`models/lib/recoveryPlan.js` (`decideRecovery`) is the pure, unit-tested brain: given
the integrity result and what backups / MongoDB are available, it chooses the
least-invasive recovery — latest good backup → previous backup → re-migrate → (else)
manual. It never chooses anything destructive unless the database is **known corrupt**.

## Admin Panel → Problems → Recovery

The startup scripts append one JSON line per action to `recovery-events.jsonl` in the
data dir. On startup the WeKan server imports the new lines into the `recoveryEvents`
collection (`server/recovery.js`), and the **Recovery** report
(`server/publications/recoveryReport.js`, admin-only) lists them newest-first with the
same search + pagination as the other admin reports. Admins can also record a manual
event with the `recordRecoveryEvent` method.

Event types include `backup-created`, `corruption-detected`, `restore-backup`,
`restore-prev`, `remigrate`, `bloat-repaired`, `integrity-ok`, `manual-required`, each
with a severity (info / warning / error).

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
- `tests/recoveryReportQuery.test.cjs` — the report search selector (escapes regex
  metacharacters).
- `tests/recoveryReportWiring.test.cjs` — the Recovery report is wired and the
  publication/count/method are admin-gated.
- `tests/ferretdbTextDataBackup.test.cjs` — the backup/restore scripts (critical
  negatives: never delete the live text data or a backup copy, never copy
  attachments/avatars).
- FerretDB: `opendb_test.go` (corruption check + bloat `VACUUM`) and
  `msg_replset_test.go` (OpLog cap).
