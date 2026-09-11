# Where MongoDB's data directory may live

MongoDB's WiredTiger storage engine needs a **local, POSIX-compliant
filesystem** under its data directory (`/data/db` in the containers). It does
not work reliably on a network filesystem - SMB/CIFS, DFS, NFS, or a cloud
file share mounted as one - even when the share is fast, has plenty of free
space, and works fine for ordinary files.

## What it looks like when it is not

A reported crash series (WeKan and MongoDB in one Kubernetes pod, the
MongoDB volume connected over SMB to a DFS storage server) looked like this
in the MongoDB log, repeatedly, until the process aborted:

```
"c":"WT","msg":"WiredTiger error message","attr":{"error":28,"message":{...,
  "msg":"__posix_sync:94:/data/db/WiredTiger.turtle: ... No space left on device"}}
"c":"ASSERT","msg":"Fatal assertion","attr":{"msgid":50853,
  "file":"src/mongo/db/storage/wiredtiger/wiredtiger_util.cpp"}}
"msg":"***aborting after fassert() failure"
"msg":"Got signal: 6 (Aborted)."
```

The share reported **519 MB used with 10 GiB free**, so "no space left" is
not about space. Error 28 (`ENOSPC`) here comes back from `fsync()` - the
call WiredTiger makes on every checkpoint to be sure a write has really
reached stable storage. An SMB/CIFS mount cannot honour that the way a local
disk does, and the failure surfaces as this errno. Because a checkpoint that
cannot be made durable is a database that cannot be trusted, MongoDB
deliberately aborts rather than continue - which is why it comes back up and
crashes again on the next checkpoint.

The same log had thousands of **"Slow query"** lines with
`"planningTimeMicros"` around 200,000 (0.2 s to *plan* a query that touched
nine index keys). That is the storage latency again: every read of an index
page went over the share. Fixing the storage fixes those too. (One WeKan-side
cause of slow queries on that log, a missing index on the comment-reactions
collection, was fixed in WeKan as well - see the CHANGELOG - but an indexed
query still cannot be fast on storage this slow.)

## What WeKan reports about it

Admin Panel / Problems / Database problems gets a row for each of these,
from a probe that runs at startup and every five minutes:

| Row | What it means |
| --- | --- |
| `db.restart` | The database process restarted while WeKan kept running - a crash-and-restart loop like the one above. |
| `db.network-filesystem` | The data directory is on a CIFS/SMB, NFS or FUSE filesystem. Only when WeKan can see that directory itself (the snap, the bundle with its embedded database, or a shared volume). |
| `db.slow-storage` | Reads averaged over 100 ms across the interval - storage latency, the "Slow query" symptom. |
| `db.disk-space` | The filesystem under the data directory is below 5% or 512 MiB free - the real "no space left on device", before it happens. |
| `db.index-created` | WeKan found a collection with data but without an index it queries by, and created it. Fixed automatically; nothing to do. |

The first four are reported with what to do; the last is WeKan's own
remediation (a missing index was the WeKan-side cause of slow queries in the
report above).

## What to do

- Put MongoDB's data directory on a **local block volume**: a Kubernetes
  PersistentVolume backed by a block storage class (a cloud disk, Ceph RBD,
  Longhorn, local-path, ...), a Docker named volume on the host's local disk,
  or a directory on a local filesystem (ext4, xfs).
- Do not mount the data directory from SMB/CIFS, DFS, NFS, or a file-share
  storage class. If that is the only storage available, run MongoDB
  somewhere it can have a local disk and point WeKan at it over the network
  with `MONGO_URL` - the database connection over TCP is fine; it is only the
  database's *files* that must be local.
- **Attachments are different.** WeKan's attachment files (when stored on
  the filesystem rather than in the database) are ordinary files and may
  live on a network share; only MongoDB's own data directory may not.
- After moving: restore from a
  [backup](../../Backup/Backup.md) or copy the data directory while MongoDB is
  stopped, then run `mongod --repair` once if the last shutdown was one of
  these aborts ([Repair-MongoDB.md](../../Backup/Repair-MongoDB.md)).

MongoDB's own production notes say the same: WiredTiger requires a filesystem
with `fsync()` semantics (they list ext4 and xfs), and they explicitly warn
against remote filesystems for the data files.

## See also

- [The MongoDB pages](.) - the rest of them
- [../FerretDB/1](../FerretDB/1) - the default database; its SQLite backend
  has the same requirement (SQLite also needs a local filesystem)
