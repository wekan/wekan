# Admin Panel → Problems: database text-data migration

Status: **Implemented** · Owner: xet7 · Related:
`server/methods/migrateTextDatabase.js`, `server/lib/repairBoardData.js`,
`server/lib/systemStatus.js`, `models/textMigrationStatus.js`,
`client/components/settings/attachments.js`,
`client/components/settings/migrationProgress.*`.

WeKan can migrate its **text data** (everything except attachments and avatars,
which stay on the filesystem) between **MongoDB** and **FerretDB v1 (SQLite)** in
either direction, from **Admin Panel → Attachments**. Both databases speak the
MongoDB wire protocol, so the same driver copies collection by collection,
upserting by `_id` (idempotent — re-running is safe).

## Phases

1. **Repairing** — the shared board data-repairs (see [Repairs.md](Repairs.md)) run
   on the **live** database first, so the copy carries clean data into the target.
2. **Migrating** — every non-file collection is copied in batches to the other
   database.

After it finishes, point `MONGO_URL` at the other database (on the snap:
`snap set wekan database=ferretdb` or `=mongodb`) and restart.

## Runs server-side

The migration runs as a **background** operation on the server. It does **not**
depend on the admin staying on the page — if you close the Attachments page the
migration keeps running to completion. The progress you see is just a view of it.

## Progress dashboard

The migration drives the **same** blue, Product-name-branded progress dashboard as
the board repairs (mounted app-wide). The dashboard is fed from the migration
status poll, so the two phases above appear as two steps.

## Visible without a browser

The migration and the startup repair **persist** their progress to the
`text_migration_status` collection. That means a separate process can see whether a
migration/repair is running:

- **Admin Panel → Problems → Status** lists it under "In progress".
- **`snap run wekan.problems migrations`** prints it as text (see [Snap.md](Snap.md)).

This is why an in-memory-only progress object was not enough: a CLI or the Problems
page in another session could not read it.

## Why you might migrate

If the **ferretdb** process is pegged near 200% CPU for a long time (pages take
minutes, All Boards counts stay `0`, raw i18n keys appear), the FerretDB v1
(SQLite) backend is saturated under WeKan's poll load. Migrating the text data to
**MongoDB** and switching to it (`snap set wekan database=mongodb`) removes that
bottleneck for a heavy instance. First check that a migration/repair is not simply
still running (`snap run wekan.problems`).

## FerretDB reactivity mode (polling vs OpLog) — the usual CPU cause

FerretDB v1 has no real replica-set OpLog; WeKan can either **poll** it
(poll-and-diff) or **tail a simulated OpLog**. The snap default (since v10.16) is
**polling only** — it keeps FerretDB CPU low. The `ferretdb` process pegging ~2
cores for a long time while the WeKan `node` process is nearly idle is the
signature of an **OpLog tail**: Meteor holds a tailable cursor on `local.oplog.rs`
and FerretDB re-scans it server-side. Two guards now prevent this by default:

- **`wekan-control`** clears `MONGO_OPLOG_URL` in polling mode, so node never tails.
- **`ferretdb-control`** enables the replica set / OpLog **only** when
  `wekan-ferretdb-oplog=true`; in the default polling mode FerretDB runs
  **standalone**, so no OpLog is maintained and nothing can spin on tailing it.

So if you see the pegged-`ferretdb` / idle-`node` pattern, check the setting and
force polling:

```
snap get wekan wekan-ferretdb-oplog     # expect: false
snap set wekan wekan-ferretdb-oplog=false
snap restart wekan.wekan wekan.ferretdb
```

Admin Panel → Version → **Reactivity mode** shows which is live (`polling` vs
`oplog`). Opting into OpLog (`=true`) is now also cheaper on the FerretDB side: the
`{ts: {$gt}}` tail filter is pushed down to SQL and the OpLog's Timestamp is
indexed, so an idle tail is an index range scan instead of a whole-collection
re-decode on every poll.
