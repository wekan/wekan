# Admin Panel → Problems: database text-data migration

Status: **Implemented** · Owner: xet7 · Related:
`server/methods/migrateTextDatabase.js`, `server/lib/repairBoardData.js`,
`server/lib/systemStatus.js`, `models/textMigrationStatus.js`,
`client/components/settings/attachments.js`,
`client/components/settings/migrationProgress.*`.

## What it is

WeKan can migrate its **text data** (everything except attachments and avatars,
which stay on the filesystem) between **MongoDB** and **FerretDB v1 (SQLite)** in
either direction, from **Admin Panel → Attachments**. Both databases speak the
MongoDB wire protocol, so the same driver copies collection by collection,
upserting by `_id` (idempotent — re-running is safe). Its progress is visible on
Problems, and this page also explains the FerretDB CPU problem that is the
usual reason to look at it.

## Read more

- [Data migration](https://en.wikipedia.org/wiki/Data_migration) - moving data
  from one storage system to another.
- [wekan/FerretDB](https://github.com/wekan/FerretDB) - the FerretDB v1 fork
  WeKan ships, and [SQLite](https://www.sqlite.org/), its default storage.
- [The MongoDB replica set oplog](https://www.mongodb.com/docs/manual/core/replica-set-oplog/) -
  what OpLog tailing reads.
- [Polling (computer science)](https://en.wikipedia.org/wiki/Polling_(computer_science)) -
  the other reactivity mode.
- WeKan: [Repairs](Repairs.md), [Snap](Snap.md), [CPU usage](CPU-usage.md),
  [Migration to FerretDB on the snap](../../../Platforms/FOSS/Container/Snap/Migration-to-FerretDB.md).

## How to use it

**Migrate the text data**

1. Sign in as a site administrator and open **Admin Panel → Attachments →
   Database migration**.
2. Press **Migrate text data to FerretDB v1 (SQLite)** or **Migrate text data
   to MongoDB**, and confirm.
3. Watch the blue progress dashboard, or the phase line under the buttons
   (**Phase**, the collection being copied and how far it is). You may close
   the page: the migration keeps running on the server.
4. After it finishes, point `MONGO_URL` at the other database and restart.

On the **snap** there is nothing to point: WeKan runs on FerretDB and the snap
migrates itself, with no setting to choose — see
[Migration-to-FerretDB.md](../../../Platforms/FOSS/Container/Snap/Migration-to-FerretDB.md).
A Sandstorm grain has only its own FerretDB SQLite database, so the migration
is refused there.

**See whether a migration or repair is running**

- **Admin Panel → Problems → Summary → Status** lists it under "In progress".
- **`snap run wekan.problems migrations`** prints it as text (see
  [Snap.md](Snap.md)).

**Check and set the FerretDB reactivity mode**

```
snap get wekan wekan-ferretdb-oplog     # true (OpLog) or false (polling)
snap set wekan wekan-ferretdb-oplog=false
snap restart wekan.wekan wekan.ferretdb
```

Admin Panel → Version → **Reactivity mode** shows which is live (`polling` vs
`oplog`).

## How the numbers are calculated

From [server/methods/migrateTextDatabase.js](../../../../server/methods/migrateTextDatabase.js)
and [client/components/settings/attachments.js](../../../../client/components/settings/attachments.js):

- **Batch size:** documents are copied 200 at a time (`BATCH`), as one
  `bulkWrite` of `replaceOne` upserts; a batch that fails is retried one
  document at a time, and the documents the target refuses are counted in
  `failed` and per collection in `failedByCollection`. The run succeeds only
  when that count is 0; otherwise it ends in the error phase with the counts
  per collection and the first failure.
- **Collections:** every collection except the file collections
  (`attachments`, `avatars`, the `cfs.*` and `cfs_gridfs.*` ones) and
  `system.*`. `collectionsDone / collectionsTotal` counts them;
  `collDone / collTotal` counts the documents of the current one
  (`countDocuments`).
- **Overall progress on the dashboard:** the repair phase is the first 40 %
  (boards done / boards total × 40), the copy the last 60 %
  (40 + collections done / collections total × 60), each rounded.
- **Saved progress:** the status is written to `text_migration_status` at each
  phase change, per collection, and every 25 boards during the repair.
- **Polling:** the page asks for the status every 2 seconds while it runs.
- **Target addresses:** `WEKAN_FERRETDB_URL` (default
  `mongodb://127.0.0.1:27018/wekan`) for FerretDB, `WEKAN_MONGODB_URL`
  (default `mongodb://127.0.0.1:27019/wekan`) for MongoDB.

## How it works in WeKan

**Phases**

1. **Repairing** — the shared board data-repairs (see [Repairs.md](Repairs.md))
   run on the **live** database first, so the copy carries clean data into the
   target.
2. **Migrating** — every non-file collection is copied in batches to the other
   database.

**Runs server-side.** The migration runs as a **background** operation on the
server. It does **not** depend on the admin staying on the page — if you close
the Attachments page the migration keeps running to completion. The progress
you see is just a view of it. `migrateTextDatabase(direction)` and
`migrateTextDatabaseStatus` are admin-only methods; a second start while one
runs is refused (`already-running`).

**Progress dashboard.** The migration drives the **same** blue,
Product-name-branded progress dashboard as the board repairs (mounted app-wide,
[client/components/settings/migrationProgress.js](../../../../client/components/settings/migrationProgress.js)).
The dashboard is fed from the migration status poll, so the two phases above
appear as two steps.

**Visible without a browser.** The migration and the startup repair **persist**
their progress to the `text_migration_status` collection
([models/textMigrationStatus.js](../../../../models/textMigrationStatus.js)).
That means a separate process can see whether a migration/repair is running,
through [server/lib/systemStatus.js](../../../../server/lib/systemStatus.js).
This is why an in-memory-only progress object was not enough: a CLI or the
Problems page in another session could not read it.

**Why you might migrate.** If the **ferretdb** process is pegged near 200% CPU
for a long time (pages take minutes, All Boards counts stay `0`, raw i18n keys
appear), the FerretDB v1 (SQLite) backend is saturated under WeKan's load. First
check that a migration or repair is not simply still running
(`snap run wekan.problems`), then the reactivity mode below. On the snap there
is no longer a way to move back to MongoDB: WeKan runs on FerretDB
([Migration-to-FerretDB.md](../../../Platforms/FOSS/Container/Snap/Migration-to-FerretDB.md)).

**FerretDB reactivity mode (polling vs OpLog).** FerretDB v1 has no real
replica-set OpLog; WeKan can either **poll** it (poll-and-diff) or **tail a
simulated OpLog**. The snap default was **polling only** from v10.16, because
an OpLog tail then kept FerretDB CPU pinned: the `ferretdb` process pegging ~2
cores for a long time while the WeKan `node` process is nearly idle is the
signature of an OpLog tail, where Meteor holds a tailable cursor on
`local.oplog.rs` and FerretDB re-scans it server-side.

The snap default is now **OpLog** again (`DEFAULT_WEKAN_FERRETDB_OPLOG="true"`
in `snap-src/bin/config`), named write-notified FerretDB OpLog reactivity in
the commit that enabled it. Opting into OpLog is also cheaper on the FerretDB
side than it was: the `{ts: {$gt}}` tail filter is pushed down to SQL and the
OpLog's Timestamp is indexed, so an idle tail is an index range scan instead
of a whole-collection re-decode on every poll. Polling stays as the fallback.
Two guards make `wekan-ferretdb-oplog=false` truly polling only:

- **`wekan-control`** clears `MONGO_OPLOG_URL` in polling mode, so node never
  tails.
- **`ferretdb-control`** enables the replica set / OpLog **only** when
  `wekan-ferretdb-oplog=true`; in polling mode FerretDB runs **standalone**, so
  no OpLog is maintained and nothing can spin on tailing it.

So if you see the pegged-`ferretdb` / idle-`node` pattern, force polling with
the commands under How to use it.

Tests: [tests/ferretdbMigrationStale.test.cjs](../../../../tests/ferretdbMigrationStale.test.cjs),
[tests/ferretdbOplogGating.test.cjs](../../../../tests/ferretdbOplogGating.test.cjs),
[tests/boardRepair.test.cjs](../../../../tests/boardRepair.test.cjs),
[tests/problemsStatus.test.cjs](../../../../tests/problemsStatus.test.cjs) and
[tests/sandstormSlim.test.cjs](../../../../tests/sandstormSlim.test.cjs).

## Commits

- [The migration reports the documents FerretDB refuses](https://github.com/wekan/wekan/commit/01968fc6376064bdc97d1e5a49fec4742a704f49)
 - [The migration is not offered in a Sandstorm grain](https://github.com/wekan/wekan/commit/e413cd4720274d50c6c02cf78dbdf56adada4684)
 - [The snap tails the write-notified FerretDB OpLog by default](https://github.com/wekan/wekan/commit/cacf4049c96d3ab404736a11ad576aa288390068)
 - [The progress component loads its own template](https://github.com/wekan/wekan/commit/b77299c8063859f11855467bbfd59e0a6097c7bc)
 - [The migration methods check() their arguments](https://github.com/wekan/wekan/commit/49e576b3c83813a9e5d5bdec09adb89851b8d75a)
 - [Migrations in progress on Problems / Status and in snap run wekan.problems](https://github.com/wekan/wekan/commit/5a1c9a61e98d0e1bc2ce566229bcdce3f81745ae)
 - [Shared board repairs run before the copy, in one progress dashboard](https://github.com/wekan/wekan/commit/136a14c88a5c7f3f78a46a948641999362f86ce5)
 - [Migrate text data between MongoDB and FerretDB v1 (SQLite), both directions](https://github.com/wekan/wekan/commit/84fee7b660e365d900e1ac355d97fcccf3debc25)
