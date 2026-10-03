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
| Encrypt | on/off | off | Encrypt everything the built-in engines store (see "Encryption") |
| Encryption key file | absolute path | empty | The key, held by the administrator outside the target and every directory the stream reads |
| Upload to | nowhere, S3/MinIO, Azure, GCS | nowhere | Mirror the target to a storage configured in Admin Panel / Attachments (see "Cloud upload") |
| Folder in the bucket | path of letters, digits, `.`, `_`, `-` | `wekan-continuous-backup` | Where in the bucket the mirror lives |

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

The Docker Compose files run FerretDB in a separate container, where WeKan
cannot see the SQLite file. Since 2026-10-03 `docker-compose.yml` and the
`docker-compose-ferretdb-v1-*.yml` files start it with `--repl-set-name=rs0`, so
it keeps `local.oplog.rs` and the `oplog` engine streams the database. Three
details matter when you change those files:

- `MONGO_URL` ends in `?directConnection=true`, never `?replicaSet=rs0`.
  FerretDB answers as a one-member replica set whose member is its listen
  address, `0.0.0.0:27017`. A driver doing replica-set discovery would leave
  `ferretdb:27017` for that address, which is nowhere from the WeKan container.
- WeKan itself still polls. Compose sets no `MONGO_OPLOG_URL`, and
  `METEOR_REACTIVITY_ORDER` stays `polling`. The oplog is there for continuous
  backup only, and is tailed only while continuous backup is on.
- FerretDB records every document write as a whole document. FerretDB releases
  after v1.86.0 also record a dropped collection or database. Earlier releases
  do not, so a restore from them keeps a collection that was dropped. WeKan
  never drops a collection while it runs.

Litestream in the `ferretdb` container, against `/data/files/db/wekan.sqlite`,
remains the alternative for a page-level stream.

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
| Database (sqlite) | — | Builds `<target>/restore/<time>/<name>.sqlite`, checked with `PRAGMA quick_check`. FerretDB holds the live file open, so it is never written over the running database. With **Put it in place on the next restart**, the checked `wekan.sqlite` is staged in `<db>/continuous-restore/` and the startup scripts' `RESTORE_REQUESTED` marker is written with the mode `continuous`. On the next start, before FerretDB opens its files, the Docker entrypoint, `start-wekan.sh` and the Snap first keep the live database and its WAL in `continuous-restore/replaced/`, then copy the staged file in. A request already pending is never overwritten, and only `wekan` can be applied this way |

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

## Encryption

Decided on 2026-10-03. With **Encrypt** on, the built-in engines encrypt
everything they store with AES-256-GCM from Node's own crypto: segments, page
deltas, bases, blobs and `state.json`. Each stored file is a small header, a
12-byte IV, the ciphertext and the 16-byte tag, so GCM refuses a changed byte.
The index checksums cover the stored bytes, so a change is also found before
anything is decrypted.

- **The key file** holds 64 hexadecimal characters, used as the key, or a
  passphrase of at least 16 characters, stretched with scrypt and the stream's
  own salt. It is never stored in the database, which the stream itself backs
  up. It must be outside the target and every directory the stream reads, and
  it must not be a symbolic link.
- **A wrong key** is refused when the settings are saved and before a
  restore. `stream.json` keeps the salt and an HMAC check value, never the key.
- **Blob names** are an HMAC of the content's hash, so a file name does not
  confirm a guessed file.
- **Generations** record whether they are encrypted. Turning encryption on
  starts the next generation encrypted, and earlier ones stay as they were. An
  encrypted generation is refused without its key.
- **Not encrypted:** the indexes' timing and size lines, `generation.json` and
  the `stream.json` header. Litestream has its own encryption options and is
  configured separately.

**Keep a copy of the key file elsewhere.** Without it, an encrypted backup
cannot be restored.

## Cloud upload

Decided on 2026-10-03. With **Upload to** set to a storage configured in
Admin Panel / Attachments (S3/MinIO, Azure or GCS), the target directory is
mirrored into that bucket under **Folder in the bucket**. It uses the same
`@tweedegolf` storage adapters and credentials as attachments.

- **Order:** sealed segments, bases and blobs never change, so each is
  uploaded once. An index, a `generation.json` or the `stream.json` that
  changed is uploaded again, always after the files it names, so the remote
  copy never lists a segment it does not hold.
- **Retention:** what retention removes here is removed there, indexes first.
- **Not uploaded:** `state.json`, the upload record and files of a restore in
  progress. An encrypted stream uploads only encrypted bytes.
- **Failures:** a failed upload is retried on the next run, every 10 seconds,
  and shows in Admin Panel / Problems. Nothing is recorded as uploaded that was
  not.
- **Fetch from cloud** fills a lost or empty target from the bucket, keeping
  files already there. Its restore points can then be restored as usual.

## What it does not do

- It does not replace an occasional offline copy. Keep one, as
  [Backup.md](Backup.md) describes.
- A live S3, Azure or GCS account was not part of its tests. The upload is
  tested against a directory-backed remote and an adapter stand-in that
  answers like the real adapters.

## Code

| File | What it holds |
| --- | --- |
| `models/lib/continuousBackup.js` | Settings validation, target safety, segment format and checksums, choosing what a restore at T reads, page comparison. Pure and tested by `tests/continuousBackup.test.cjs` |
| `server/lib/continuousBackup/store.js` | Target layout, atomic segment writes, indexes, blobs, retention |
| `server/lib/continuousBackup/oplog.js` | Oplog engine |
| `server/lib/continuousBackup/sqlite.js` | SQLite page engine |
| `server/lib/continuousBackup/files.js` | Attachment, avatar and log streams |
| `server/lib/continuousBackup/litestream.js` | Litestream supervisor |
| `server/lib/continuousBackup/restore.js` | Verification and point-in-time restore, and staging a SQLite restore for the next restart |
| `server/lib/continuousBackup/encryption.js` | AES-256-GCM, the key file, the stream's key check, keyed blob names |
| `server/lib/continuousBackup/cloud.js` | The mirror to S3/MinIO, Azure or GCS, and fetching it back |
| `server/continuousBackup.js` | Settings, status, restore points, fetch from cloud and restore, all for site administrators only |
| `releases/ferretdb/wekan-entrypoint.sh`, `releases/ferretdb/start-wekan.sh`, `snap-src/bin/ferretdb-control` | The `continuous` restore mode on startup |
| `client/components/settings/attachments.{jade,js}` | The pane |

## Tests

| Test | What it covers |
| --- | --- |
| `tests/continuousBackup.test.cjs` | Settings validation, target refusals, segment checksums, the choice of segments at T, page deltas |
| `tests/integration/continuousBackup.test.cjs` | Against a real MongoDB replica set: tailing, segment sealing, a restart continuing from its position, restore at T, refusal of a changed segment. Also the `sqlite` engine on a real WAL database while it is being written, files and logs, and all of them encrypted: no plaintext at rest, restored with the key, refused without it |
| `tests/continuousBackupEncryption.test.cjs` | Round trips, a changed byte, a wrong key, a short passphrase, keyed blob names, the stream's key check, encrypted state, key-file placement |
| `tests/continuousBackupCloud.test.cjs` | Upload order, once-only uploads, retention removal, no plaintext uploaded, a lost target fetched back and restored, a failed upload retried, unsafe keys and prefixes, the adapter wrapper |
| `tests/continuousBackupRestartRestore.test.cjs` | Each startup script's real restore block run in a sandbox: the staged database replaces the live one, which is kept; nothing staged changes nothing |
| `server/lib/tests/continuousBackup.tests.js` | Methods refuse non-administrators and per-Organization administrators; settings round trip |
| `tests/playwright/specs/admin-continuous-backup.e2e.js` | The pane renders, saves, shows status, and is hidden from a non-administrator |
