// WeKan on Sandstorm — grain launcher (meteor-spk.deps/start.js).
//
// Runs WeKan (Node 24) on FerretDB v1 (embedded SQLite), migrating an existing
// grain's data to FerretDB on first launch. See
// docs/Platforms/FOSS/Sandstorm/Meteor3/Migration.md.
//
// Data an existing grain may hold, and how this handles it:
//   * none                    → fresh: run WeKan on an empty FerretDB.
//   * niscu (MongoDB 2.x)      → migrate niscu → MongoDB 3.0 (the legacy meteor-spk
//     data under /var         path, preserved), which produces /var/wiredTigerDb,
//                              then migrate MongoDB 3.0 → FerretDB.
//   * MongoDB 3.0 (WiredTiger) → migrate MongoDB 3.0 → FerretDB.
//     under /var/wiredTigerDb
//   * already FerretDB         → marker present: skip, run WeKan on FerretDB.
//
// The MongoDB 3 → FerretDB step reads with the legacy Mongo CLI (mongoexport —
// the modern driver can't talk to 3.x) and inserts into FerretDB with the Node
// driver; CollectionFS/Meteor-Files GridFS attachments+avatars are extracted to
// the filesystem. Migration is idempotent (marker); the old data is never
// auto-deleted (the admin frees it from Admin Panel / Attachments / Sandstorm).

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── layout ───────────────────────────────────────────────────────────────────
// Read-only app payload (resolve from __dirname; do not hardcode the mount point).
const APPROOT = __dirname;
const NODE         = path.join(APPROOT, 'bin/node');            // Node 24
const MONGOD3      = path.join(APPROOT, 'bin/mongod');          // MongoDB 3.0.7
const NISCUD       = path.join(APPROOT, 'bin/niscud');          // MongoDB 2.x (Niscu)
const MM_BIN       = path.join(APPROOT, 'migratemongo/bin');    // mongo + mongoexport (3.x CLIs)
const MM_LIB       = path.join(APPROOT, 'migratemongo/lib');    // old glibc for those CLIs
const MONGO_CLI    = path.join(MM_BIN, 'mongo');
const FERRETDB     = path.join(APPROOT, 'ferretdb');           // FerretDB v1 (Go, SQLite)
const IMPORTER     = path.join(APPROOT, 'migrate-mongo3-to-ferretdb.mjs');
const NODE_MODULES = path.join(APPROOT, 'programs/server/node_modules');

// Writable grain state (only /var is writable in a grain).
const NISCU_DBPATH = '/var';                                   // legacy niscu data dir
const NISCU_MARKER = '/var/journal';                           // presence ⇒ niscu-era data
const OLD_MONGO    = '/var/wiredTigerDb';                       // MongoDB 3.0 data dir
const FILES_DIR    = '/var/files';                             // WRITABLE_PATH
const SQLITE_DIR   = path.join(FILES_DIR, 'db');               // FerretDB SQLite dir
const STATE_DIR    = '/var/ferretdb';                          // FerretDB process state (state.json)
const MARKER       = '/var/.migration-to-ferretdb-done';       // FerretDB migration done
const STATUS_FILE  = path.join(SQLITE_DIR, 'migration-status.json');
const MIGRATE_LOG  = '/var/migration-mongod.log';

// Ports (loopback inside the grain).
const APP_PORT  = process.env.PORT || '4000';                  // behind sandstorm-http-bridge
const DB_PORT   = '4001';                                      // FerretDB steady-state
const SRC_PORT  = '4003';                                      // mongod 3.0 (migration source)
const NISCU_PORT = '4004';                                     // niscud (niscu→3.0 source)

// #6480/#6481: FerretDB v1 ships an OpLog (auto-created capped local.oplog.rs +
// replica-set hello handshake). Run the STEADY-STATE FerretDB with a replica-set
// name and point WeKan at it so Meteor tails the OpLog instead of poll-and-diff.
// Polling stays the fallback (METEOR_REACTIVITY_ORDER=oplog,polling → OpLog only
// when tailing works). WEKAN_FERRETDB_OPLOG=false forces polling only. The
// transient migration-target FerretDB above stays OpLog-free (no --repl-set-name).
const FERRET_OPLOG  = process.env.WEKAN_FERRETDB_OPLOG !== 'false';
const REPL_SET_NAME = process.env.WEKAN_FERRETDB_REPL_SET || 'rs0';

function ensureDirs() {
  for (const d of [FILES_DIR, SQLITE_DIR, STATE_DIR,
                   path.join(FILES_DIR, 'attachments'),
                   path.join(FILES_DIR, 'avatars')]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

function haveNiscuData()  { return fs.existsSync(NISCU_MARKER); }
function haveMongo3Data() { return fs.existsSync(path.join(OLD_MONGO, 'WiredTiger')); }

// LD_LIBRARY_PATH with the old libs prepended (for the Mongo 3.x CLI tools).
function oldLibEnv() {
  return {
    ...process.env,
    LD_LIBRARY_PATH: MM_LIB + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : ''),
  };
}

function sleep(sec) { spawnSync('/bin/sleep', [String(sec)]); }

function startFerret(port, opts = {}) {
  const args = ['--handler=sqlite', `--sqlite-url=file:${SQLITE_DIR}/`,
     // FerretDB persists state.json via its state provider even with telemetry
     // off; its --state-dir defaults to "." (= "/" in a grain, read-only), so
     // point it at writable /var or it fails with "open /state.json: read-only
     // file system" and the grain crash-loops.
     `--state-dir=${STATE_DIR}`,
     `--listen-addr=127.0.0.1:${port}`, '--telemetry=disable'];
  // Only the steady-state instance enables the OpLog; the migration target does
  // not, so bulk inserts are not slowed by oplog recording.
  if (opts.oplog && FERRET_OPLOG) args.push(`--repl-set-name=${REPL_SET_NAME}`);
  return spawn(FERRETDB, args,
    { stdio: 'inherit',
      env: { ...process.env, DO_NOT_TRACK: '1', FERRETDB_TELEMETRY: 'disable',
             FERRETDB_STATE_DIR: STATE_DIR } });
}

// Wait until a mongod (3.x) answers a ping via the legacy mongo shell.
function waitMongoReady(port, tries = 30) {
  for (let i = 0; i < tries; i++) {
    const r = spawnSync(MONGO_CLI,
      ['--port', String(port), '--quiet', '--eval', 'db.adminCommand({ping:1}).ok'],
      { env: oldLibEnv(), encoding: 'utf8' });
    if (r.status === 0 && /1/.test(r.stdout || '')) return true;
    sleep(1);
  }
  return false;
}

function stopMongo(port) {
  spawnSync(MONGO_CLI,
    ['--port', String(port), '--quiet', '--eval',
     'db.getSiblingDB("admin").shutdownServer()'],
    { env: oldLibEnv(), encoding: 'utf8' });
  sleep(2);
}

// ── Stage 1: niscu (MongoDB 2.x) → MongoDB 3.0 (WiredTiger) ───────────────────
// Faithful port of the legacy meteor-spk niscu→3.0 migration, using niscud and
// mongod 3.0 with the old bundled MongoDB driver (deps/node_modules/mongodb).
// Produces /var/wiredTigerDb, which Stage 2 then migrates to FerretDB.
async function migrateNiscuToMongo3() {
  console.log('** WeKan: migrating niscu (MongoDB 2.x) -> MongoDB 3.0 ...');
  const MongoClient = require('mongodb').MongoClient;

  spawnSync(NISCUD,
    ['--fork', '--port', NISCU_PORT, '--dbpath', NISCU_DBPATH, '--noauth',
     '--bind_ip', '127.0.0.1', '--nohttpinterface', '--noprealloc',
     '--logpath', '/var/niscu.log'],
    { stdio: 'inherit', env: process.env });
  fs.mkdirSync(OLD_MONGO, { recursive: true });
  spawnSync(MONGOD3,
    ['--fork', '--port', SRC_PORT, '--dbpath', OLD_MONGO, '--noauth',
     '--bind_ip', '127.0.0.1', '--storageEngine', 'wiredTiger',
     // Pin the WiredTiger cache. mongod 3.0 sizes it from detected RAM
     // (RAM/2 - 1GB), but inside a Sandstorm grain sandbox RAM detection returns
     // 0, so it computes cache_size=0G and WiredTiger aborts (minimum is 1MB) with
     // "Fatal Assertion 28561". mongod 3.0.7 parses this option as an integer
     // number of GB (a decimal like 0.25 fails with 'Bad digit "."'), so pin it to
     // 1 GB. It is a cache cap, not a preallocation, so a short migration of a
     // normal-sized grain never actually uses that much; it just never depends on
     // RAM detection.
     '--wiredTigerCacheSizeGB', '1',
     '--wiredTigerEngineConfigString', 'log=(prealloc=false,file_max=200KB)',
     '--logpath', MIGRATE_LOG],
    { stdio: 'inherit', env: process.env });
  if (!waitMongoReady(SRC_PORT)) throw new Error('mongod 3.0 did not become ready for niscu import');
  sleep(2); // give niscud a moment (old 2.x, not pingable with the 3.x shell)

  const oldDb = await MongoClient.connect(`mongodb://127.0.0.1:${NISCU_PORT}/meteor`, {});
  const newDb = await MongoClient.connect(`mongodb://127.0.0.1:${SRC_PORT}/meteor`, {});
  const collections = await oldDb.collections();
  for (const oldColl of collections) {
    if (oldColl.collectionName.slice(0, 7) === 'system.') continue; // indexes regenerate
    console.log('   niscu collection:', oldColl.collectionName);
    const newColl = await newDb.createCollection(oldColl.collectionName);
    const cursor = oldColl.find();
    while (await cursor.hasNext()) {
      await newColl.insertOne(await cursor.next());
    }
  }
  try { await oldDb.admin().command({ shutdown: 1 }); } catch (_) {} // server kills itself
  stopMongo(SRC_PORT);
  console.log('** niscu -> MongoDB 3.0 done.');
}

// ── Stage 2: MongoDB 3.0 → FerretDB v1 (SQLite) ──────────────────────────────
function migrateMongo3ToFerret() {
  console.log('** WeKan: migrating MongoDB 3 -> FerretDB (one-time) ...');
  const started = spawnSync(MONGOD3,
    ['--dbpath', OLD_MONGO, '--bind_ip', '127.0.0.1', '--port', SRC_PORT,
     '--storageEngine', 'wiredTiger',
     // Pin the WiredTiger cache to 1 GB: in a Sandstorm grain sandbox mongod 3.0's
     // RAM detection returns 0, so its default cache sizing computes cache_size=0G
     // and WiredTiger aborts with "Value too small for key 'cache_size'" /
     // "Fatal Assertion 28561", which is exactly why this migration crash-looped on
     // an existing grain's data. mongod 3.0.7 parses this option as an integer GB
     // (0.25 fails to parse), and it is a cap not a preallocation. See the niscu
     // stage above for the same fix.
     '--wiredTigerCacheSizeGB', '1',
     '--fork', '--logpath', MIGRATE_LOG],
    { stdio: 'inherit', env: process.env });
  if (started.status !== 0 || !waitMongoReady(SRC_PORT)) {
    console.error(`** Migration: could not start/reach mongod 3.0 on the old data (see ${MIGRATE_LOG}). Old data kept; retry next start.`);
    stopMongo(SRC_PORT);
    process.exit(1);
  }

  const ferret = startFerret(DB_PORT);   // the PERMANENT SQLite dir (no temp/switch)
  const rc = spawnSync(NODE, [IMPORTER], {
    stdio: 'inherit',
    env: { ...process.env,
      NODE_PATH:        NODE_MODULES,
      MONGO_BIN_DIR:    MM_BIN,
      MONGO_LIB:        MM_LIB,
      // Sandstorm WeKan grains store their data in the Meteor-default database
      // "meteor" (the niscu -> 3.0 stage above also reads/writes "meteor", and an
      // existing grain's WiredTiger catalog shows meteor.* collections). Only the
      // FerretDB *target* is "wekan". Reading SRC_DB 'wekan' here migrated zero
      // documents from a real grain.
      SRC_PORT, SRC_DB: 'meteor',
      TARGET_MONGO_URL: `mongodb://127.0.0.1:${DB_PORT}/wekan`,
      FILES_DIR,
      MIGRATION_PORT:   APP_PORT,        // progress dashboard shown at the grain URL
      STATUS_FILE },
  }).status;

  try { ferret.kill(); } catch (_) {}
  stopMongo(SRC_PORT);

  if (rc === 0) {
    fs.writeFileSync(MARKER, new Date().toISOString());  // never re-migrate; old data KEPT
    console.log('** Migration succeeded.');
  } else {
    console.error('** Migration failed; retry on next grain start. Old data kept.');
    process.exit(1);
  }
}

async function migrateIfNeeded() {
  if (fs.existsSync(MARKER)) return;                     // already on FerretDB
  if (haveNiscuData() && !haveMongo3Data()) {
    await migrateNiscuToMongo3();                        // → produces /var/wiredTigerDb
  }
  if (haveMongo3Data()) {
    migrateMongo3ToFerret();                             // → FerretDB
  }
}

function runApp() {
  const ferret = startFerret(DB_PORT, { oplog: true });  // steady-state DB, OpLog on
  ferret.on('exit', code => {                            // if the DB dies, restart the grain
    console.error(`** FerretDB exited (code ${code}); stopping grain.`);
    process.exit(code || 1);
  });
  process.on('exit', () => { try { ferret.kill(); } catch (_) {} });

  process.env.MONGO_URL     = `mongodb://127.0.0.1:${DB_PORT}/wekan`;
  // Prefer OpLog tailing, fall back to polling if it does not come up (OpLog only
  // when it works). Admin Panel → Version shows the live Reactivity mode.
  if (FERRET_OPLOG) {
    process.env.MONGO_OPLOG_URL = process.env.MONGO_OPLOG_URL ||
      `mongodb://127.0.0.1:${DB_PORT}/local?replicaSet=${REPL_SET_NAME}`;
    process.env.METEOR_REACTIVITY_ORDER = process.env.METEOR_REACTIVITY_ORDER || 'oplog,polling';
    process.env.DEFAULT_METEOR_REACTIVITY_ORDER = process.env.DEFAULT_METEOR_REACTIVITY_ORDER || 'oplog,polling';
  } else {
    process.env.METEOR_REACTIVITY_ORDER = process.env.METEOR_REACTIVITY_ORDER || 'polling';
    process.env.DEFAULT_METEOR_REACTIVITY_ORDER = process.env.DEFAULT_METEOR_REACTIVITY_ORDER || 'polling';
  }
  process.env.ROOT_URL      = process.env.ROOT_URL || `http://127.0.0.1:${APP_PORT}`;
  process.env.PORT          = APP_PORT;
  process.env.WRITABLE_PATH = FILES_DIR;
  // Enable Sandstorm auth. The wekan-accounts-sandstorm package only sets
  // __meteor_runtime_config__.SANDSTORM (which triggers the client's automatic
  // header-based login) when process.env.SANDSTORM is set. Without it WeKan boots
  // but every page shows "Must be logged in". Must be set BEFORE require('./main.js')
  // so the package sees it at load. (Sandstorm context for app code is a separate
  // flag, Meteor.settings.public.sandstorm, set via METEOR_SETTINGS in the pkgdef.)
  process.env.SANDSTORM     = '1';

  console.log('** Starting WeKan on FerretDB ...');
  setTimeout(() => require('./main.js'), 1500);          // let FerretDB start listening
}

ensureDirs();
migrateIfNeeded()
  .then(runApp)
  .catch(e => { console.error('** Fatal during migration:', e && e.stack || e); process.exit(1); });
