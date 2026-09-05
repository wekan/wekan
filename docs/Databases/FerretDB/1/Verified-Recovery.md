# Design: Verified FerretDB SQLite recovery and low-load maintenance

Status: **Implemented** · Owner: xet7

This design covers every WeKan launch path that uses FerretDB v1 with SQLite and
the snap's MongoDB-to-FerretDB migration. Recovery material lives below the same
SQLite directory as FerretDB's databases; it never depends on an unrelated home
directory, temporary directory, or external service.

## Storage layout

For a SQLite directory `<db>`, recovery uses only `<db>/.recovery/`:

```text
<db>/wekan.sqlite
<db>/.recovery/latest/wekan.sqlite.gz
<db>/.recovery/latest/manifest.json
<db>/.recovery/previous/wekan.sqlite.gz
<db>/.recovery/previous/manifest.json
<db>/.recovery/migration-source/manifest.json
<db>/recovery-events.jsonl
<db>/.recovery/maintenance-request.json
```

The manifest contains the uncompressed and compressed byte counts, SHA-256 of
both forms, creation time, source file identity, reason, and schema version.
Manifests are written last and renamed atomically. A directory without a complete,
valid manifest is not a recovery candidate.

## Snapshot invariants

1. Snapshot only a database at rest. Startup snapshots run before FerretDB opens
   the directory; an online request is deferred to the next controlled restart.
2. Check free bytes before writing. Required space is the live database size plus
   a configurable safety reserve; compression is never assumed when deciding.
3. Write into a staging directory, stream through gzip and SHA-256, decompress and
   hash the result, then publish it atomically. Only after publication may `latest`
   rotate to `previous`.
4. Never rotate a corrupt, incomplete, or unverifiable snapshot over a verified
   generation. Never report success after a failed copy, hash, compression,
   decompression, close, or rename.
5. Restore into a staging file, verify its uncompressed checksum and size, then
   atomically replace `wekan.sqlite`. WAL/SHM files are removed only after the
   replacement is ready.
6. Every decision and failure is appended to the recovery JSONL and therefore
   imported into Admin Panel → Problems → Recovery.

SHA-256 detects accidental damage and tampering of stored recovery material. It
does not authenticate an attacker who can rewrite both data and manifest; operators
who require that threat model must copy snapshots to separately protected storage.

## Automatic startup recovery

Startup validates, in order: live SQLite, latest snapshot, previous snapshot. The
portable checker is built with the same SQLite library/version used by the shipped
FerretDB and runs `PRAGMA quick_check` without starting the network server.

| Live result | Automatic action |
| --- | --- |
| Healthy | Start normally; create a verified snapshot when due and safe |
| Corrupt, latest valid | Restore latest, re-check, start |
| Corrupt, latest invalid, previous valid | Restore previous, re-check, start |
| Corrupt, no valid snapshot, retained MongoDB source readable | Re-run migration into staging, compare collection evidence, then atomically adopt it |
| Corrupt, no verified source | Keep maintenance mode and report `manual-required`; never start against known-corrupt text data |
| Check unavailable/unknown | Do not guess or overwrite; report the missing checker and follow the configured conservative policy |

An automatic attempt is bounded. Startup safety work is urgent and cannot wait
forever for the statistically quietest hour, but a non-corruption request waits for
a short low-load window. Corruption recovery takes priority over CPU scheduling
because the application cannot safely serve until it completes.

## MongoDB migration recovery

The raw MongoDB files remain untouched and are the final recovery source. Before
an importer starts, migration records source evidence (file mtimes/sizes and, when
readable, per-collection counts/newest timestamps) plus a checksum of its progress
checkpoint under `.recovery/migration-source/`.

Interrupted migrations resume only when source evidence and the checkpoint hash
still match. If either changed, partial SQLite text data is quarantined and the
migration restarts from the retained MongoDB source. A migration is complete only
after target evidence covers the source evidence, the target passes SQLite integrity
checking, and an initial verified snapshot has been published. Failure falls back
to serving MongoDB and records the exact retry reason.

## Low-load scheduling and CPU statistics

`cpuMonitor` keeps a bounded rolling sample window containing time, system CPU,
load averages and the current WeKan activity. Admin Panel → Problems → Speed shows
current, minimum, average, maximum, sample count and the lowest-load time observed.

Non-urgent CPU-heavy work requests a maintenance lease. The scheduler runs it only
after consecutive samples are below the low-load threshold, permits one heavy job
at a time, labels the activity, yields between chunks, and defers when CPU rises.
Snapshot compression, checksum verification, migration comparison, history-chain
audits and other maintenance use this lease. Disk-space and integrity checks remain
cheap prerequisites and are never skipped.

## Tamper evidence and paced audits

Change-history rows form a per-board SHA-256 chain over immutable content, actor,
time and predecessor. Before undo or redo, WeKan verifies the row, predecessor and
absence of a fork. A background audit checks every chain in bounded batches.
History has no client publication, REST mutation route or general-purpose Meteor
mutation method; only server undo/redo may change `undone`, and recording new work
may mark an abandoned redo branch `superseded`.

The existing filesystem-integrity inventory covers attachments and avatars. The
same paced audit also covers registered logs and verified recovery generations.
Missing files, changed sizes, invalid signed baselines and changed checksums are
reported in Admin Panel → Problems → Security. Intentional application deletion
removes its inventory entry as part of the authorized operation and is not called
tampering.

Each report includes the object kind and ID, bounded path, expected and observed
size/checksums, detection time, and the most recent legitimate writer/time when
known. An interactive verification also records the authenticated username, user
ID and proxy-aware IP. A background scan explicitly leaves actor and IP unknown;
it never invents attribution. Contents, secrets and unbounded paths are excluded.

Background checks acquire the maintenance lease after consecutive low-CPU samples,
recheck CPU immediately before every bounded batch, pause between files/batches,
and yield and defer when CPU rises. Synchronous undo/redo verification is small and
urgent, because a suspect row must never be applied first.

## Tests and failure injection

Tests use temporary SQLite directories and injected command/filesystem failures to
cover: healthy snapshot/restore, latest-to-previous fallback, corrupt gzip, wrong
checksum, truncated manifest, insufficient space, interrupted staging writes,
source evidence changing during migration, no usable source, high-CPU deferral,
lease serialization, and recovery-event import. Negative tests prove a failed or
unverified candidate can never replace live data or be logged as success.
