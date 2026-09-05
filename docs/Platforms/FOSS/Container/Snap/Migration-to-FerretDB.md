# The snap migrates itself to FerretDB

**WeKan runs on FerretDB.** Every platform, every install: the snap, Docker, the
bundles, the Helm chart. MongoDB is still in the amd64 and arm64 snaps, but only
to be **read** — it is the source a migration copies from, and it is stopped when
that is done.

There is **nothing to choose and nothing to type**. The `database` snap setting
that used to select between the two is **gone**; so is `snap run wekan.database`.
If your snap still has the setting from an older release, the configure hook says
so once and unsets it.

## What the migration moves

| From | To |
| --- | --- |
| Every MongoDB collection — boards, cards, users, **activities** (the card History) | FerretDB v1, SQLite, in `$SNAP_COMMON/files/db` |
| **CollectionFS** attachments and avatars (`cfs_gridfs.*` buckets + `cfs.*.filerecord`) | files on the filesystem, `$SNAP_COMMON/files/attachments` and `files/avatars` |
| **Meteor-Files** records stored in GridFS (`versions.original.storage: gridfs`) | the same filesystem storage, with the record rewritten to `storage: 'fs'` and a path |

Text data ends up in SQLite, binaries end up on the filesystem, and **nothing is
deleted from MongoDB**: its files stay in `$SNAP_COMMON` exactly as they were.

Every collection is copied and then **counted against the source**, and any that
came up short is copied again — a resume must not skip a collection it never
finished (wekan/wekan#6585).

## Which MongoDB it can read

A MongoDB server starts only on data whose `featureCompatibilityVersion` is at
most one major version behind it, so no single mongod can open everything the
WeKan snap has shipped since 2019. The snap therefore carries **four readers**
and tries them newest-first:

| Reader | Opens (FCV) | Where it came from |
| --- | --- | --- |
| `mongod 7` | 6.0, 7.0 | the snap's own MongoDB |
| `mongod 5.0` | 4.4, 5.0 | the WeKan snap shipped MongoDB 5 in February 2023 |
| `mongod 4.2` | 4.0, 4.2 | the 4.x snaps ([#6471](https://github.com/wekan/wekan/issues/6471)) |
| the `migratemongo` 3.2 tools | 3.x | the 6.09-era snaps (amd64 only) |

All of them are **read-only** here: the data is copied out through the bundled
Node.js driver (or `mongoexport` for 3.2) and the reader is stopped again. On
x86_64, mongod 5.0 and 7 need AVX, so a CPU without it runs them under
`qemu-user` emulation through `bin/cpu-exec` — slow, and it happens once.

The other architectures (armhf, s390x, ppc64el, riscv64, …) never had a MongoDB:
MongoDB publishes no server for them, and those snaps have been FerretDB from
their first boot.

## When it runs, and what happens if it fails

It runs **by itself**, on the first start after the snap finds MongoDB data that
has not been migrated. WeKan keeps serving from MongoDB while it works, and the
progress dashboard is on the normal WeKan address.

A failure does not end it. The attempt is recorded — how many, when, and which
snap revision — and retried:

* **immediately after the next snap refresh**, because the next release is the
  most likely thing to have fixed it (this is how the mongod 5.0 reader reaches
  an instance that was stuck before it existed);
* otherwise after a wait that doubles from an hour up to a day, so a migration
  that cannot succeed yet costs one attempt a day rather than one per start.

`snap run wekan.migrate` retries now, from scratch. `snap set wekan migrate=off`
stops it completely — an admin saying "not now" is a decision, not a failure.

## Two copies, and how they are reconciled

`$SNAP_COMMON` is shared across snap revisions, and `snap revert` does not roll
it back — so an instance can end up with a MongoDB **and** a FerretDB that have
both been written to since they were copies of each other.

Both copies can be read, so they are read: each database is started on a
temporary port, its documents are counted and the newest timestamp in them
found, and the documents that exist in only one of them are **inserted** into
FerretDB. Nothing is overwritten and nothing is deleted.

This is safe because of how WeKan stores history: activities, comments and the
change-history rows are **append-only**
([History.md](../../../../Features/Reports/History/History.md)), so merging them
can only add to what a card's Activity feed shows. Work done on the copy that is
not being served becomes readable in the History of the one that is, instead of
sitting in a database nobody opens.

Earlier releases answered this differently — they switched the snap to
`database=mongodb`, which is where "WeKan changed to old MongoDB data" came from,
and when the staleness detector guessed wrong
([#6583](https://github.com/wekan/wekan/issues/6583)) it put a site on a copy
that was weeks behind. Merging is the repair; MongoDB is served only for the one
start where the merge could not run, and it is tried again on the next.

## Which database is running, and why

Nothing stores that decision — it is read from the data itself, by
`bin/database-role`, and every part of the snap asks the same helper:

```
sudo snap run wekan.problems         # among other things, says which database is serving
```

* **ferretdb** — the migration is done and the FerretDB database has data in it
  (or there is nothing to migrate at all, or the MongoDB files cannot be read by
  this snap and the FerretDB copy can).
* **mongodb** — a migration is still owed, and MongoDB holds the data. That
  includes the case where a migration is marked done but its FerretDB is missing:
  an empty FerretDB beside a MongoDB full of boards must never be served, because
  it looks exactly like total data loss.

An interrupted migration is told apart from a finished one by the importer's
checkpoint (`migration-progress.json`): with a checkpoint it resumes, without one
a FerretDB that has data is a migration that finished — even if its marker went
missing.

## The commands that still exist

```
sudo snap run wekan.migrate          # re-run the whole migration now, from scratch
sudo snap run wekan.problems         # status: which database, what has run, what failed
sudo snap run wekan.database-compare # what does each copy hold? changes nothing
sudo snap run wekan.database-merge   # insert into the served copy what only the other has
sudo snap set wekan migrate=off      # stop the automatic retries (and on to resume)
```

`database-compare` and `database-merge` are apps of the snap, so they exist only
in the revision that ships them — WeKan **v10.90** and newer. On an older one
snapd answers `cannot find app "database-compare" in "wekan"`
([#6583](https://github.com/wekan/wekan/issues/6583), comment 5282677837);
`sudo snap refresh wekan` first. Refreshing is safe for the case they are needed
for: a refresh does not import an old MongoDB over a FerretDB that is already in
use, and neither copy is ever deleted.

## When the database does not come up

WeKan does not open its web port until the database answers, and it waits for as
long as that takes — a large database can need minutes after an update, and
giving up would be worse. While it waits, the browser gets a page saying
**WeKan is waiting for its database**, which names the database being waited for
and the commands that say why it is not there
([#6592](https://github.com/wekan/wekan/issues/6592) — before this, nothing was
listening on the web port and the symptom was a timeout, "loading forever", with
the reason only in `snap logs`).

It appears after 30 seconds (`WEKAN_DB_WAIT_PAGE_SECONDS`), so an ordinary
restart never shows it, and it refreshes itself away when WeKan starts. If it
stays, the database is the thing to look at:

```
sudo snap logs wekan.ferretdb     # or wekan.mongodb — the real reason
sudo snap run wekan.problems      # which copy is served, and is there a second
sudo snap start --enable wekan.ferretdb
sudo snap revert wekan            # back to the revision that worked; data stays
```

`wekan.problems` ends with a **Databases on this machine** section saying which
copy is being served and whether there is a second one — it used to report "No
problems detected" on an instance serving a month-old copy, because every check
it makes is about the ONE database WeKan is connected to.
# Verified recovery design

MongoDB-to-FerretDB migration recovery, source evidence, checkpoint checksums,
disk-space requirements and the initial verified SQLite snapshot are specified in
[Verified FerretDB SQLite recovery](../../../../Databases/FerretDB/1/Verified-Recovery.md).
The raw MongoDB source is never deleted automatically and remains the final recovery
source when both SQLite snapshot generations are unusable.
