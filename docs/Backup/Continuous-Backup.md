# Continuous backup

Design of **Admin Panel / Attachments / Continuous backup**. This is a streaming,
incremental backup of the database, attachments, avatars and logs. It runs
beside the scheduled ZIP backup described in [Backup.md](Backup.md#admin-panel-backup-and-schedules).
That ZIP backup is a full copy taken at intervals. This feature writes each
change shortly after it happens, so less work is lost when a disk fails, and an
administrator can restore to a chosen moment.

## Why a second kind of backup

The scheduled backup reads every collection and file each time. Between two
runs nothing is protected, so a daily schedule can lose up to a day of work.
Running it more often costs a whole copy of the instance each time. The startup
SQLite snapshot (`releases/ferretdb/sqlite-recovery.mjs`) is also a whole copy,
made at most once a day while WeKan starts.

Continuous backup writes one full copy, called a *base*. After that it records
only what changes: documents, files and log lines. It writes them seconds after
they happen, to a directory that can be another disk, an NFS share or an
[rclone mount](Rclone/Rclone.md).

## Licences: only copyfree code by default

The built-in engines are part of WeKan and use the MIT licence. They depend
only on:

- Node.js (MIT);
- its built-in `node:sqlite`, which is SQLite, in the public domain;
- the MongoDB driver WeKan already uses (Apache-2.0, already part of WeKan).

The engines download nothing and start no third-party programs.

[Litestream](https://litestream.io) is supported as an **optional** engine for
the SQLite database. It is not bundled. WeKan starts it only when an
administrator selects it and gives the path of a `litestream` binary they
installed themselves. Litestream is Apache-2.0 licensed and replicates to S3,
Azure, GCS, SFTP and other targets.

## Where the settings are

The new pane is in the Admin Panel, on the **Attachments** page, directly after
**Backup**: `/admin/attachments/continuous-backup`. Everything about protecting
data is then in one place. Backup makes archives, and Continuous backup streams
changes. Both read the same storages that the panes below them configure.

Only site administrators see the pane. It backs up the whole instance, so a
per-Organization administrator never gets it. Their Attachments menu keeps
**Backup** only, enforced by `tenantAdmin.tenantAdminAttachmentsMenu`. Every
server method checks the same rule again.

| Setting | Values | Default | Meaning |
| --- | --- | --- | --- |
| Enabled | on/off | off | Run the stream on this server |
| Target directory | absolute path | `<WRITABLE_PATH>/continuous-backup` | Where the stream is written |
| Database | on/off | on | Stream database changes |
| Attachments | on/off | on | Stream filesystem attachment files |
| Avatars | on/off | on | Stream filesystem avatar files |
| Logs | on/off | on | Stream log files |
| Database engine | auto, oplog, sqlite, litestream | auto | How database changes are captured (see below) |
| SQLite interval | 5-3600 s | 60 | How often the `sqlite` engine looks for changed pages |
| File scan interval | 30-86400 s | 300 | Full rescan of the file trees; file watching handles changes in between |
| New base every | 1-720 h | 24 | Start a new generation with a fresh base |
| Keep | 1-3650 days | 7 | Remove generations older than this, always keeping the newest complete one |
| Litestream binary | absolute path | empty | Only for the `litestream` engine |
| Litestream replica URL | `file://`, `s3://`, `abs://`, `gcs://`, `sftp://` | empty | Only for the `litestream` engine |

The target directory is refused when it is inside, or contains, a directory the
stream reads: attachments, avatars, logs or the SQLite directory. Such a target
would back up its own output without end. It is also refused when it is not
absolute, or when its path contains `..` or a NUL character.

## The database engines

`auto` chooses the first engine that can run on this server. The pane shows
which one was chosen and why the others cannot run.

1. **`oplog`: realtime, document level, on every database WeKan supports that
   keeps an oplog.** That means a MongoDB replica set, or the WeKan FerretDB fork
   started with `--repl-set-name` (the Snap's default, `WEKAN_FERRETDB_OPLOG`).
   It tails `local.oplog.rs` for WeKan's database, which is the same source
   Meteor's oplog driver reads:
   - An insert stores the document it carries.
   - An update stores the whole document, read again by `_id`, so a restore
     never has to interpret an update operator.
   - A delete stores the `_id`.

   Each record holds the operation's timestamp, so a restore can stop at any
   moment. The tailing position is saved with the stream, so a restart
   continues where it stopped. If the oplog has already dropped that position,
   the engine starts a new generation instead of leaving a silent gap.
2. **`sqlite`: page level, for the SQLite files WeKan can read.** This covers the
   Snap, the Docker image when it runs FerretDB inside the container, and the
   bundle. It uses SQLite's online backup API through `node:sqlite`. This is
   safe while FerretDB writes, because the database is in WAL mode. On every
   interval it copies a consistent image to a temporary file and compares it
   with the previous image page by page, using a SHA-256 of each page. Only the
   changed pages are written. A restore applies the base and then the deltas,
   up to the chosen moment, and checks the result with `PRAGMA quick_check`.
3. **`litestream`**: WeKan writes a `litestream.yml` for each SQLite file into
   the target directory, starts `litestream replicate -config <file>` as a child
   process, restarts it if it exits, and shows its last output in the pane.
   Restores use `litestream restore`. That step is documented here, but the pane
   does not run it.

The default `docker-compose.yml` runs FerretDB in a separate container with no
oplog, so WeKan can see neither the SQLite file nor an oplog. In that case the
pane says the database engine is unavailable, and the file streams still run.
There are two ways to enable it:

- add `--repl-set-name=rs0` to the `ferretdb` service and `?replicaSet=rs0` to
  `MONGO_URL` (oplog engine);
- or run Litestream in the `ferretdb` container against
  `/data/files/db/wekan.sqlite`.

## Files and logs

Attachments and avatars stored on the **filesystem** are streamed from
`<WRITABLE_PATH>/files/attachments` and `<WRITABLE_PATH>/files/avatars`, or the
same directories without `files/` when `WRITABLE_PATH` already ends in `files`.
Versions in GridFS are database documents, and the database engine streams
them. Versions in S3, Azure or GCS are already in another service, so this
feature does not copy them.

Logs means:

- `<WRITABLE_PATH>/logs` and `<WRITABLE_PATH>/log`, when they exist;
- the recovery event log `files/db/recovery-events.jsonl`.

The application's own event log (Admin Panel / Problems, Reports) is the
`eventlog` collection, and the database engine streams it.

Changes are noticed in two ways. File watching (`fs.watch`, recursive) reacts
within a second or two. A full rescan, comparing size and modification time,
runs at the file scan interval and catches what watching misses on network
filesystems. A changed file's bytes are stored once, under their SHA-256. A file
edited many times keeps only the versions that differ. A deleted file is
recorded as deleted, and its old bytes stay until the generation is removed.
Symbolic links are skipped and never followed.

## Layout of the target directory

```text
<target>/
  stream.json                      format "wekan-continuous-backup", version 1
  state.json                       where each engine continues after a restart
  generations/<YYYYMMDD-HHMMSS>-<id>/
    generation.json                started, engine, database name, base status
    base.zip                       oplog engine: a wekan-instance-backup v2
                                   archive (server/lib/fullBackup.js)
    db/index.ndjson                one line per sealed segment: seq, file,
                                   sha256, bytes, first and last timestamp, count
    db/000000000001.ndjson         put/delete records, closed every few seconds
    sqlite/<name>/base.sqlite      sqlite engine: first consistent image
    sqlite/<name>/index.ndjson     one line per delta, as above
    sqlite/<name>/000000000001.pages  changed pages, each with its number
    files/index.ndjson             one line per sealed file-event segment
    files/000000000001.ndjson      put (area, path, sha256, size, mtime) / delete
  blobs/<aa>/<sha256>              file contents, shared by all generations
```

A segment is written to a `.partial` file, flushed with `fsync`, renamed, and
only then listed in its index. A crash therefore leaves at most one unlisted
`.partial` file, which the next start removes. A restore reads only listed
segments, and checks every SHA-256 before it changes anything.

Point-in-time order needs no shared clock between the engines:

- database records carry the oplog's timestamp;
- page deltas and file events carry the server time at which they were seen.

A restore to time T takes everything at or before T.

## Base and consistency

The oplog engine notes the current end of the oplog **before** it writes the
base, and replays everything after that point. The base is read while WeKan
runs (`live-sequential`, as in Backup.md). A document changed while the base was
read appears again in the records that follow, so the restored state converges
to the state at T. A record stores the whole document, which makes replaying it
idempotent.

## Restore

The pane lists each generation with the period it covers. The administrator
chooses a generation, a moment within it, and what to restore:

| What | Modes | Effect |
| --- | --- | --- |
| Database (oplog) | add-missing, replace-all | The base through `restoreInstanceBackup`, then every record up to T. Replace-all empties each collection the base contains first, as Backup's restore does |
| Files | add-missing, replace-all | Writes the attachment, avatar and log files as they were at T back to their directories. Add-missing never overwrites a file that exists; replace-all also removes files created after T |
| Database (sqlite) | — | Builds `<target>/restore/<time>/<name>.sqlite`, checked with `PRAGMA quick_check`. FerretDB holds the live file open, so the pane shows the steps to stop WeKan and put it in place, rather than overwriting the file under a running database |

Restore checks everything it will read before it writes:

- the generation's own file;
- every index line;
- every segment's SHA-256;
- every blob's SHA-256.

Missing or changed data stops the restore with nothing written. A restore
target is never followed through a symbolic link, using the same rules as
`backupRestoreSymlink`.

## Admin Panel / Problems

The stream runs unattended, so its failures appear where an administrator
already looks. Each of these is one summarised row in Admin Panel / Problems,
through `server/lib/eventLogFold.js`:

- a target that cannot be written;
- an engine that stopped;
- an oplog position that was lost;
- a Litestream process that keeps exiting;
- a restore refused because of a checksum.

A refused restore request, such as an unsafe path or a non-administrator caller,
is recorded as a blocked attempt.

## What it does not do

- It does not upload to cloud storage itself. Point the target directory at
  storage of your choice, for example an rclone mount, or use the Litestream
  engine, which uploads natively.
- It does not encrypt. Protect the target as you would the database. It holds
  account credentials and service secrets.
- It does not replace an occasional offline copy. Keep one, as
  [Backup.md](Backup.md) describes.

## Code

| File | What it holds |
| --- | --- |
| `models/lib/continuousBackup.js` | Settings validation, target safety, segment format and checksums, choosing what a restore at T reads, page comparison. Pure and tested by `tests/continuousBackup.test.cjs` |
| `server/lib/continuousBackup/store.js` | Target layout, atomic segment writes, indexes, blobs, retention |
| `server/lib/continuousBackup/oplog.js` | Oplog engine |
| `server/lib/continuousBackup/sqlite.js` | SQLite page engine |
| `server/lib/continuousBackup/files.js` | Attachment, avatar and log streams |
| `server/lib/continuousBackup/litestream.js` | Litestream supervisor |
| `server/lib/continuousBackup/restore.js` | Verification and point-in-time restore |
| `server/methods/continuousBackup.js` | Settings, status, restore points and restore, all for site administrators only |
| `client/components/settings/attachments.{jade,js}` | The pane |

## Tests

| Test | What it covers |
| --- | --- |
| `tests/continuousBackup.test.cjs` | Settings validation, target refusals, segment checksums, the choice of segments at T, page deltas |
| `tests/integration/continuousBackup.test.cjs` | Against a real MongoDB replica set: tailing, segment sealing, a restart continuing from its position, restore at T, refusal of a changed segment. Also the `sqlite` engine on a real WAL database while it is being written, files and logs |
| `server/lib/tests/continuousBackup.tests.js` | Methods refuse non-administrators and per-Organization administrators; settings round trip |
| `tests/playwright/specs/admin-continuous-backup.e2e.js` | The pane renders, saves, shows status, and is hidden from a non-administrator |
