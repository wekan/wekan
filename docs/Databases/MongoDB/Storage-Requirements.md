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

## A full disk, and the MongoDB 8.2 crash loop that follows it

A second reported series (`mongo:8.2.2` in Kubernetes, the data directory on
a volume that really did fill up) starts the same way - the checkpoint's
`fdatasync` returns `ENOSPC`, WiredTiger panics, mongod aborts:

```
"c":"WT","msg":"WiredTiger error message","attr":{"error":28,"message":{...,
  "msg":"__posix_sync:200:/data/db/WiredTiger.turtle.set: handle-sync: fdatasync",
  "error_str":"No space left on device"}}
"c":"WT",...,"msg":"__posix_sync:200:the process must exit and restart",
  "error_str":"WT_PANIC: WiredTiger library panic"}}
"c":"ASSERT","msg":"Fatal assertion","attr":{"msgid":50853,
  "location":"src/mongo/db/storage/wiredtiger/wiredtiger_util.cpp:644:9:..."}}
"msg":"Got signal: 6 (Aborted)."
```

Here the space really is gone, so the first fix is the obvious one: free
space or grow the volume. But it then **keeps failing after that**, on every
start, at the same place:

```
"s":"W","c":"STORAGE","id":10380300,"msg":"Failed to clear dbpath of the internal WiredTiger instance",
  "attr":{"error":"Directory not empty"}}
"s":"I","c":"STORAGE","id":10158000,"msg":"Opening spill WiredTiger",...
"s":"E","c":"WT","msg":"WiredTiger error message","attr":{"error":-31809,
  "message":"... wiredtiger_open: ... WiredTiger version file cannot be found:
  WT_TRY_SALVAGE: database corruption detected"}}
"s":"F","c":"STORAGE","id":10158002,"msg":"Failed to open the spill WiredTiger instance",
  "attr":{"details":"-31809: WT_TRY_SALVAGE: database corruption detected - "}}
"s":"F","c":"ASSERT","msg":"Fatal assertion","attr":{"msgid":10158002,
  "location":"src/mongo/db/storage/wiredtiger/spill_wiredtiger_kv_engine.cpp:105:9:..."}}
"msg":"***aborting after fassert() failure"
```

That is not the data. MongoDB 8.2 keeps a second, throwaway WiredTiger
instance under the data directory - `<dbPath>/_tmp/spilldb` - for queries
that spill to disk. It holds nothing worth keeping, and mongod empties it
itself on every start and recreates it. After the abort, that emptying failed
(`Directory not empty`), mongod opened the half-emptied directory anyway,
found no `WiredTiger` version file in it, reported corruption and stopped.
Nothing frees it: the directory stays as it is, so the next start hits the
same wall, and the pod restarts forever with the disk long since freed.

**What to do:** stop mongod, delete that one directory, start it again:

```
rm -rf /data/db/_tmp/spilldb
```

Only that directory. Everything else under the data directory (`*.wt`,
`WiredTiger*`, `journal/`, `_mdb_catalog.wt`, `sizeStorer.wt`, `storage.bson`)
is the database and must not be touched. mongod recreates `_tmp/spilldb`
empty on the next start, and the data comes up from its journal as usual.

The snap does this itself: `mongodb-control` deletes `_tmp/spilldb` before
every start (a mongod is never running at that point), so a snap never needs
this by hand. In Docker and Kubernetes the database container is MongoDB's
own image, which WeKan cannot change, so there it is the command above -
run from a shell in the database container, or in an init container against
the same volume.

## What WeKan reports about it

Admin Panel / Problems / Database problems gets a row for each of these,
from a probe that runs at startup and every five minutes:

| Row | What it means |
| --- | --- |
| `db.restart` | The database process restarted while WeKan kept running - a crash-and-restart loop like the ones above. The row says what a "No space left on device" abort means for a full disk and for a network filesystem, and names `_tmp/spilldb` for the MongoDB 8.2 loop. |
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
