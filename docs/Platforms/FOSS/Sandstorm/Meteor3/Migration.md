# WeKan on Sandstorm — Meteor 3.5 / Node.js 24 build + MongoDB 3 → FerretDB migration

Status: **design / not yet implemented**. Nothing here has been built or run end‑to‑end
in a grain yet — every step marked **TEST** must be verified against a real Sandstorm
install (ideally a copy of an existing WeKan grain) before shipping.

This document describes how to build a modern WeKan `.spk` (Meteor 3.5, Node.js 24) that
replaces the packaged MongoDB 3.0 database with **FerretDB v1 (embedded SQLite)**, migrating
any existing grain's MongoDB 3.0 data on first launch — reusing the exact migration logic the
WeKan **snap** already ships.

---

## 1. Why

The current Sandstorm build uses **meteor‑spk 0.6.0** (`https://dl.sandstorm.io/meteor-spk-0.6.0.tar.xz`,
built 2021‑10‑23). Its `meteor-spk.deps` payload is a 2015‑era design:

| Component | meteor‑spk 0.6.0 ships | WeKan needs |
|---|---|---|
| `bin/node` | Node **14.17.5** (stock, from nodejs.org) | **Node 24.x** (Meteor 3.5) |
| `bin/mongod` | MongoDB **3.0.7** (WiredTiger) | keep — read‑only migration source only |
| `bin/niscud` | MongoDB **2.x** (Kenton's Niscu fork) | **drop** |
| `lib/` | glibc **2.31** (Ubuntu 20.04) | regenerate on 22.04 (glibc 2.35) for node24/ferretdb |
| `start.js` | launches Mongo 3.0 + niscu→3.0 migration | rewrite for FerretDB |

`start.js` in 0.6.0 is functionally identical to 0.5.1 (only reformatted). It still launches
mongod 3.0 with `--nohttpinterface` (a flag **removed in MongoDB 3.6+**), so a newer mongod
can't even be dropped in without changing it.

Note on the Node fork: `sandstorm-io/node` is **not** needed. It is frozen at Node 8.11.4
(2018) and its only real patch is a V8 thread‑table optimization for **node‑fibers** — and
Meteor 3 removed fibers entirely. meteor‑spk already ships **stock** upstream Node (0.6.0's
`bin/node` is the official nodejs.org 14.17.5 build). Use stock **Node 24**.

---

## 2. Target architecture

Steady state after migration: WeKan (Node 24) talks to **FerretDB v1 (SQLite)** over the
MongoDB wire protocol — no MongoDB server runs at all. mongod 3.0 is used **once**, only to
read an existing grain's old data during the one‑time migration.

```
grain (single sandbox, writable = /var)
  ├─ /var/wiredTigerDb            ← EXISTING MongoDB 3.0 data (old grains only; read-only source)
  ├─ /var/files/                 ← WRITABLE_PATH (new)
  │    ├─ attachments/           ← GridFS attachments extracted here (Meteor-Files on fs)
  │    ├─ avatars/               ← GridFS avatars extracted here
  │    └─ db/                    ← FerretDB SQLite dir (wekan.sqlite)  ← steady-state DB
  └─ /var/.migration-to-ferretdb-done   ← idempotency marker
```

### Ports (loopback inside the grain)

| Port | Role |
|---|---|
| 4000 | app HTTP (behind `sandstorm-http-bridge`) |
| 4001 | FerretDB v1 (steady state) — `MONGO_URL=mongodb://127.0.0.1:4001/wekan` |
| 4003 | temporary mongod 3.0 (migration read only) |

---

## 3. Sandbox compatibility (verified from the sandstorm source)

Checked `sandstorm/src/sandstorm/seccomp-bpf/filter.s`. The grain seccomp filter is an
allowlist whose **default action is `ENOSYS`, not SIGSYS‑kill**, so Go/glibc gracefully fall
back on missing syscalls. Relevant results:

- **Allowed** (needed by Node 24 / Go FerretDB): `getrandom`, `statfs`/`fstatfs`,
  `sched_getaffinity`, `clone`, `futex`, `epoll_*`, `eventfd2`, `fork`, `mmap`, `mprotect`.
- **Denied → ENOSYS** (tolerated via fallback): `membarrier`, `rseq`, `clone3`, `restart_syscall`.

Conclusion: a grain can run Node 24 + FerretDB (Go) + mongod 3.0 concurrently — the same
multi‑process model the current build already uses for mongod+node. Nothing else is needed
from the sandstorm platform repo.

**TEST (highest risk):** Node 24's glibc uses `clone3` for thread creation and relies on the
ENOSYS→`clone` fallback (glibc ≥ 2.34). Verify a trivial Node 24 grain spawns threads before
investing in the rest.

---

## 4. `meteor-spk.deps` payload changes

Start from the 0.6.0 base, then:

- **Replace** `bin/node` with **Node 24** — use the exact build from Meteor 3.5's dev bundle
  (`meteor node -e "console.log(process.version)"`) so native‑addon ABIs match the WeKan bundle.
- **Keep** `bin/mongod` (3.0.7) — read‑only migration source.
- **Add** `migratemongo/bin/{mongoexport,mongo}` + `migratemongo/lib/` (the old glibc those
  3.x CLIs need). The importer reads the 3.0 data with these — the modern Node driver cannot
  speak to a 3.0/3.2 server. Reuse the same tools the snap's
  [`migratemongo`](https://github.com/wekan/migratemongo) provides (amd64, x86_64).
- **Add** `ferretdb` — the `ferretdb-amd64` binary from `ferretdb.zip`
  (newest release of [wekan/FerretDB](https://github.com/wekan/FerretDB/releases); the same
  artifact `release-all.yml` unzips as `ferretdb/amd64/ferretdb-amd64`).
- **Add** `migrate-mongo3-to-ferretdb.mjs` — copy verbatim from
  [`snap-src/bin/migrate-mongo3-to-ferretdb.mjs`](../../../../../snap-src/bin/migrate-mongo3-to-ferretdb.mjs);
  it is entirely env/path‑driven and needs no changes.
- **Drop** `bin/niscud` and the old `node_modules/{mongodb,bson,mongodb-core,es6-promise,readable-stream}`.
  The importer resolves `mongodb`/`bson` from the WeKan bundle via
  `NODE_PATH=<bundle>/programs/server/node_modules`.
- **Regenerate `lib/`, `lib64/`, `usr/lib`** on Ubuntu 22.04/24.04 (glibc 2.35) for node24 +
  ferretdb. Keep the **old** libs separately under `migratemongo/lib` for mongod3/mongoexport
  (dual‑lib pattern, exactly as the snap does with `MM_LIB`).

> The 0.5.1 fork's `lib/x86_64-linux-gnu/*` were **dangling symlinks into
> `/home/user/Lataukset/...`** (a Downloads folder). Do not carry those forward — the tree
> must be self‑contained and regenerated with `gather-deps` on a clean modern base.

amd64 only. (arm64 Sandstorm is out of scope here; the migratemongo 3.x binaries are x86_64.)

---

## 5. `start.js` (rewritten launcher)

CJS launcher, spawned by the pkgdef as `... node start.js`. It migrates once if an old
MongoDB 3.0 data dir is present, then runs WeKan on FerretDB. Migration logic is a re‑pathed
port of the snap's [`migration-control`](../../../../../snap-src/bin/migration-control) +
[`migrate-mongo3-to-ferretdb.mjs`](../../../../../snap-src/bin/migrate-mongo3-to-ferretdb.mjs).

```js
// meteor-spk.deps/start.js
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP_PORT   = process.env.PORT || '4000';
const DB_PORT    = '4001';                 // FerretDB steady-state
const SRC_PORT   = '4003';                 // temp mongod 3.0 (migration read)
const FILES_DIR  = '/var/files';
const SQLITE_DIR = path.join(FILES_DIR, 'db');
const OLD_MONGO  = '/var/wiredTigerDb';
const MARKER     = '/var/.migration-to-ferretdb-done';
const STATUS     = path.join(FILES_DIR, 'db', 'migration-status.json');
const APPROOT    = __dirname;              // where .meteor-spk/bundle is mounted
const MM_LIB     = path.join(APPROOT, 'migratemongo/lib');

for (const d of [FILES_DIR, SQLITE_DIR,
                 path.join(FILES_DIR, 'attachments'), path.join(FILES_DIR, 'avatars')]) {
  fs.mkdirSync(d, { recursive: true });
}

function startFerret(port) {
  return spawn(path.join(APPROOT, 'ferretdb'),
    ['--handler=sqlite', `--sqlite-url=file:${SQLITE_DIR}/`,
     `--listen-addr=127.0.0.1:${port}`, '--telemetry=disable'],
    { stdio: 'inherit',
      env: { ...process.env, DO_NOT_TRACK: '1', FERRETDB_TELEMETRY: 'disable' } });
}

function migrateIfNeeded() {
  const hasOld = fs.existsSync(path.join(OLD_MONGO, 'WiredTiger'));
  if (fs.existsSync(MARKER) || !hasOld) return;    // fresh install or already migrated

  console.log('** Migrating MongoDB 3 -> FerretDB (one-time) ...');
  const oldLibEnv = { ...process.env,
    LD_LIBRARY_PATH: `${MM_LIB}:${process.env.LD_LIBRARY_PATH || ''}` };

  // 1. old mongod 3.0 serving the existing data (read-only source)
  spawnSync('/bin/mongod',
    ['--dbpath', OLD_MONGO, '--bind_ip', '127.0.0.1', '--port', SRC_PORT,
     '--storageEngine', 'wiredTiger', '--fork', '--logpath', '/var/migration-mongod.log'],
    { stdio: 'inherit', env: oldLibEnv });

  // 2. FerretDB target (the PERMANENT SQLite dir — no temp/switch needed)
  const ferret = startFerret(DB_PORT);

  // 3. importer: CLI-read 3.0 -> driver-insert FerretDB; GridFS -> /var/files/{attachments,avatars}
  const rc = spawnSync(path.join(APPROOT, 'node'),
    [path.join(APPROOT, 'migrate-mongo3-to-ferretdb.mjs')], {
    stdio: 'inherit',
    env: { ...process.env,
      NODE_PATH:        path.join(APPROOT, 'programs/server/node_modules'),
      MONGO_BIN_DIR:    path.join(APPROOT, 'migratemongo/bin'),
      MONGO_LIB:        MM_LIB,
      SRC_PORT, SRC_DB: 'wekan',
      TARGET_MONGO_URL: `mongodb://127.0.0.1:${DB_PORT}/wekan`,
      FILES_DIR,
      MIGRATION_PORT:   APP_PORT,          // progress dashboard shown at the grain URL
      STATUS_FILE:      STATUS },          // importer writes final state here (see §6)
  }).status;

  try { ferret.kill(); } catch {}
  spawnSync('/bin/mongo', ['--port', SRC_PORT, '--quiet', '--eval',
    'db.getSiblingDB("admin").shutdownServer()'], { env: oldLibEnv });

  if (rc === 0) {
    fs.writeFileSync(MARKER, new Date().toISOString());   // never re-migrate; old data KEPT
  } else {
    console.error('** Migration failed; will retry on next grain start. Old data kept.');
    process.exit(1);
  }
}

function runApp() {
  const ferret = startFerret(DB_PORT);                    // steady-state DB
  process.env.MONGO_URL     = `mongodb://127.0.0.1:${DB_PORT}/wekan`;
  process.env.ROOT_URL      = process.env.ROOT_URL || `http://127.0.0.1:${APP_PORT}`;
  process.env.PORT          = APP_PORT;
  process.env.WRITABLE_PATH = FILES_DIR;
  process.on('exit', () => { try { ferret.kill(); } catch {} });
  setTimeout(() => require('./main.js'), 1500);           // let FerretDB start listening
}

migrateIfNeeded();
runApp();
```

Design choices vs the snap:
- **No temp‑then‑switch**: the migration writes straight into the permanent FerretDB SQLite
  dir (`/var/files/db`), because in a grain there is only one database going forward.
- **Idempotent**: the marker prevents re‑migration; the old `/var/wiredTigerDb` is **never
  deleted automatically** — the admin deletes it explicitly from the UI (§7).

---

## 6. What the migration does (importer)

`migrate-mongo3-to-ferretdb.mjs` (unchanged from the snap):

- **Text collections** — `mongoexport` each (Extended JSON) from mongod 3.0, `insertMany`
  into FerretDB via the modern Node driver (batch 200, upsert on conflict).
- **Attachments + avatars** — from CollectionFS GridFS (`cfs_gridfs.<bucket>.{files,chunks}`
  + `cfs.<bucket>.filerecord`): each file is reassembled from its chunks and written to
  `/var/files/attachments` or `/var/files/avatars`, and a **Meteor‑Files** record pointing at
  that filesystem path is inserted into FerretDB. This is exactly WeKan's "MongoDB → filesystem"
  attachment move, done inline.
- **Schema** is left as‑is; WeKan's own Board Settings / Migrations upgrade it on first use.
- **Progress** is served over HTTP at `MIGRATION_PORT` (= the app port), so a user opening the
  grain during migration sees a live dashboard.

**Add for the UI (§7):** have the importer also write a final status JSON to
`STATUS_FILE` (`/var/files/db/migration-status.json`) — the `state` object it already builds:
`{ startedAt, finishedAt, phase, success, collections, files, errors }`. One `fs.writeFileSync`
at the end of `run()`.

---

## 7. Admin Panel / Attachments / **Sandstorm** (new, `isSandstorm` only)

When `isSandstorm === true` (`Meteor.settings.public.sandstorm`, see
[models/settings.js](../../../../../models/settings.js#L19)), a new **Sandstorm** section appears
in Admin Panel / Attachments (next to Backup), showing:

1. **Migration status** — Success / Pending / Failed + timestamp and per‑collection / file
   counts, read from `/var/files/db/migration-status.json` and the marker.
2. **Raw MongoDB disk usage** — bytes currently used by the old raw MongoDB 3.0 files under
   `/var/wiredTigerDb` (the reclaimable space), plus FerretDB SQLite size and attachments/avatars
   size for context.
3. **Delete raw MongoDB files** — a guarded button that removes `/var/wiredTigerDb` to free
   grain disk. Enabled **only** when migration succeeded (marker present, `success:true`) and
   FerretDB actually holds data.

### Server methods

New file `server/methods/sandstormMigration.js` (server‑only; admin‑gated exactly like
[`server/methods/backup.js`](../../../../../server/methods/backup.js) via `ReactiveCache.getCurrentUser()` + `isAdmin`):

```js
const OLD_MONGO = '/var/wiredTigerDb';
const STATUS    = (process.env.WRITABLE_PATH || '/var/files') + '/db/migration-status.json';
const MARKER    = '/var/.migration-to-ferretdb-done';

function dirBytes(dir) {                 // recursive size; tolerant of missing dir
  let total = 0;
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else { try { total += fs.statSync(p).size; } catch {} }
  } };
  try { if (fs.existsSync(dir)) walk(dir); } catch {}
  return total;
}

Meteor.methods({
  async sandstormMigrationStatus() {
    const user = await ReactiveCache.getCurrentUser();
    if (!user || !user.isAdmin) return false;
    let status = null;
    try { status = JSON.parse(fs.readFileSync(STATUS, 'utf8')); } catch {}
    return {
      isSandstorm: true,
      migrationDone: fs.existsSync(MARKER),
      status,
      rawMongoBytes: dirBytes(OLD_MONGO),
      rawMongoExists: fs.existsSync(OLD_MONGO),
      ferretBytes: dirBytes(path.dirname(STATUS)),
    };
  },

  async sandstormDeleteRawMongo() {
    const user = await ReactiveCache.getCurrentUser();
    if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
    // Safety: only after a confirmed-successful migration.
    if (!fs.existsSync(MARKER)) throw new Meteor.Error('migration-not-done');
    let ok = false;
    try { ok = JSON.parse(fs.readFileSync(STATUS, 'utf8')).success === true; } catch {}
    if (!ok) throw new Meteor.Error('migration-not-successful');
    const freed = dirBytes(OLD_MONGO);
    fs.rmSync(OLD_MONGO, { recursive: true, force: true });
    return { deleted: true, freedBytes: freed };
  },
});
```

### Client

New tab in [client/components/settings/attachments.{jade,js}](../../../../../client/components/settings/attachments.js),
rendered only when `isSandstorm`. Poll `sandstormMigrationStatus` (like the Backup tab polls
`backupStatus`), render the status + a human‑readable size (`filesize`), and a
**Delete raw MongoDB files** button behind a confirm dialog that calls `sandstormDeleteRawMongo`
and refreshes.

> Deleting the raw files is irreversible. Gate it behind: migration `success:true`, an explicit
> confirm, and (recommended) a typed confirmation. The data still exists in FerretDB + on the
> filesystem after migration, so this only reclaims the now‑redundant Mongo 3.0 copy.

---

## 8. pkgdef / env changes ([sandstorm-pkgdef.capnp](../../../../../sandstorm-pkgdef.capnp))

- `WRITABLE_PATH`: `/var/wekan-uploads` → **`/var/files`**.
- Do **not** set `MONGO_URL` in `environ` (start.js sets it to the FerretDB port).
- Bump `appVersion` and `appMarketingVersion`.
- Keep `argv = ["/sandstorm-http-bridge", "4000", "--", "node", "start.js"]`.
- `SANDSTORM=1` and `METEOR_SETTINGS={"public":{"sandstorm":true}}` are already present — that
  drives `isSandstorm` for the new admin panel.

---

## 9. Build / CI ([.github/workflows/sandstorm.yml](../../../../../.github/workflows/sandstorm.yml))

- Base the fork on **0.6.0** (has the 3.0 mongod) rather than 0.5.1.
- Add a build step that assembles the modernized `meteor-spk.deps`: swap in node24, add
  `ferretdb-amd64` (from `ferretdb.zip`), add `migratemongo/{bin,lib}` + `mongoexport`/`mongo`,
  add `migrate-mongo3-to-ferretdb.mjs`, drop `niscud`, and regenerate the lib tree with
  `gather-deps` on ubuntu‑24.04.
- Publish the assembled `projects.7z` as a **GitHub release asset** on
  [xet7/meteor-spk](https://github.com/xet7/meteor-spk) (it currently has none) and fetch from
  there, with `releases.wekan.team` as fallback — so the build no longer depends on a single host.

---

## 10. Risks & test checklist

- [ ] **TEST** Node 24 threads under seccomp (clone3→clone ENOSYS fallback). *Highest risk.*
- [ ] **TEST** mongod 3.0.7 opens `/var/wiredTigerDb` inside the grain with the old libs.
- [ ] **TEST** FerretDB (Go) starts and listens in the grain.
- [ ] **TEST** full migration on a **copy** of a real old WeKan grain (text + attachments + avatars).
- [ ] **TEST** fresh install (no `/var/wiredTigerDb`): skips migration, runs on empty FerretDB.
- [ ] **TEST** grain disk headroom — migration transiently holds old Mongo + new SQLite + extracted
      files at once, within the grain quota.
- [ ] **TEST** `LD_LIBRARY_PATH` split — node24/ferretdb on the fresh 2.35 libs; mongo‑3.0 CLIs on
      the old libs; no cross‑contamination.
- [ ] **TEST** Admin Panel / Attachments / Sandstorm: status accuracy, disk numbers, guarded delete.

---

## 11. Open questions

- FerretDB v1 SQLite filename: the backend manages files inside `--sqlite-url` dir; for db
  `wekan` it creates `wekan.sqlite` (plus metadata). Confirm the exact on‑disk name/layout for
  the disk‑usage display.
- Exact bundle mount root in the grain (`__dirname` of `start.js`) — confirm from the packed
  spk so `/bin/mongod` vs `<APPROOT>/…` references are correct (the current `start.js` uses
  `/bin/mongod`).
- Whether to keep the migration `mongoexport` path or, long‑term, drop the whole 3.0 story once
  no MongoDB‑3.0 grains remain in the wild.
