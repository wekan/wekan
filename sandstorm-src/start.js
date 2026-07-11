// WeKan on Sandstorm — grain launcher (meteor-spk.deps/start.js).
//
// Replaces the legacy meteor-spk start.js (which launched MongoDB 3.0 + a
// niscu→3.0 migration). This runs WeKan (Node 24) on FerretDB v1 (embedded
// SQLite), migrating an existing grain's MongoDB 3.0 data to FerretDB on first
// launch. See docs/Platforms/FOSS/Sandstorm/Meteor3/Migration.md.
//
// Flow on grain start:
//   1. If /var/wiredTigerDb (old MongoDB 3.0 data) exists and migration is not
//      yet done: start mongod 3.0 to read it, start FerretDB (the permanent
//      SQLite DB), run the importer (mongoexport read → FerretDB insert; GridFS
//      attachments/avatars → /var/files/{attachments,avatars}), then stop
//      mongod. Idempotent via a marker; the old data is never auto-deleted (the
//      admin frees it from Admin Panel / Attachments / Sandstorm).
//   2. Start FerretDB as the steady-state DB and launch WeKan (main.js).
//
// The importer + Mongo 3 CLI tools + FerretDB are added to meteor-spk.deps by
// the spk build (see docs). This file is spawned by the pkgdef as
// `... node start.js`, so process.argv/cwd match the legacy launcher.

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── layout ───────────────────────────────────────────────────────────────────
// Read-only app payload (mounted at the grain root). Resolve from __dirname so
// this does not hardcode the mount point.
const APPROOT = __dirname;
const NODE        = path.join(APPROOT, 'bin/node');              // Node 24
const MONGOD3     = path.join(APPROOT, 'bin/mongod');            // MongoDB 3.0.7 (reads old data)
const MM_BIN      = path.join(APPROOT, 'migratemongo/bin');      // mongo + mongoexport (3.x CLIs)
const MM_LIB      = path.join(APPROOT, 'migratemongo/lib');      // old glibc for those CLIs
const MONGO_CLI   = path.join(MM_BIN, 'mongo');
const FERRETDB    = path.join(APPROOT, 'ferretdb');             // FerretDB v1 (Go, SQLite)
const IMPORTER    = path.join(APPROOT, 'migrate-mongo3-to-ferretdb.mjs');
const NODE_MODULES = path.join(APPROOT, 'programs/server/node_modules');

// Writable grain state (only /var is writable in a grain).
const OLD_MONGO   = '/var/wiredTigerDb';                         // legacy MongoDB 3.0 data dir
const FILES_DIR   = '/var/files';                                // WRITABLE_PATH
const SQLITE_DIR  = path.join(FILES_DIR, 'db');                  // FerretDB SQLite dir
const MARKER      = '/var/.migration-to-ferretdb-done';
const STATUS_FILE = path.join(SQLITE_DIR, 'migration-status.json');
const MIGRATE_LOG = '/var/migration-mongod.log';

// Ports (loopback inside the grain).
const APP_PORT = process.env.PORT || '4000';                    // behind sandstorm-http-bridge
const DB_PORT  = '4001';                                        // FerretDB steady-state
const SRC_PORT = '4003';                                        // temp mongod 3.0 (migration read)

function ensureDirs() {
  for (const d of [FILES_DIR, SQLITE_DIR,
                   path.join(FILES_DIR, 'attachments'),
                   path.join(FILES_DIR, 'avatars')]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

// LD_LIBRARY_PATH with the old libs prepended (for the Mongo 3.x CLI tools).
function oldLibEnv() {
  return {
    ...process.env,
    LD_LIBRARY_PATH: MM_LIB + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : ''),
  };
}

function startFerret(port) {
  return spawn(FERRETDB,
    ['--handler=sqlite', `--sqlite-url=file:${SQLITE_DIR}/`,
     `--listen-addr=127.0.0.1:${port}`, '--telemetry=disable'],
    { stdio: 'inherit',
      env: { ...process.env, DO_NOT_TRACK: '1', FERRETDB_TELEMETRY: 'disable' } });
}

// Wait until the source mongod answers a ping (mongod --fork usually returns
// only once listening, but poll to be safe). Uses the legacy mongo shell.
function waitMongoReady(port, tries = 30) {
  for (let i = 0; i < tries; i++) {
    const r = spawnSync(MONGO_CLI,
      ['--port', String(port), '--quiet', '--eval', 'db.adminCommand({ping:1}).ok'],
      { env: oldLibEnv(), encoding: 'utf8' });
    if (r.status === 0 && /1/.test(r.stdout || '')) return true;
    spawnSync('/bin/sleep', ['1']);
  }
  return false;
}

function stopMongo(port) {
  spawnSync(MONGO_CLI,
    ['--port', String(port), '--quiet', '--eval',
     'db.getSiblingDB("admin").shutdownServer()'],
    { env: oldLibEnv(), encoding: 'utf8' });
}

function migrateIfNeeded() {
  const hasOld = fs.existsSync(path.join(OLD_MONGO, 'WiredTiger'));
  if (fs.existsSync(MARKER) || !hasOld) return;   // fresh install or already migrated

  console.log('** WeKan: migrating MongoDB 3 -> FerretDB (one-time) ...');

  // 1. old mongod 3.0 serving the existing data (read-only migration source).
  const started = spawnSync(MONGOD3,
    ['--dbpath', OLD_MONGO, '--bind_ip', '127.0.0.1', '--port', SRC_PORT,
     '--storageEngine', 'wiredTiger', '--fork', '--logpath', MIGRATE_LOG],
    { stdio: 'inherit', env: process.env });
  if (started.status !== 0 || !waitMongoReady(SRC_PORT)) {
    console.error(`** Migration: could not start/reach mongod 3.0 on the old data (see ${MIGRATE_LOG}). Old data kept; will retry next start.`);
    stopMongo(SRC_PORT);
    process.exit(1);
  }

  // 2. FerretDB target — the PERMANENT SQLite dir (no temp/switch needed).
  const ferret = startFerret(DB_PORT);

  // 3. importer: CLI-read 3.0 → driver-insert FerretDB; GridFS → filesystem.
  const rc = spawnSync(NODE, [IMPORTER], {
    stdio: 'inherit',
    env: { ...process.env,
      NODE_PATH:        NODE_MODULES,
      MONGO_BIN_DIR:    MM_BIN,
      MONGO_LIB:        MM_LIB,
      SRC_PORT, SRC_DB: 'wekan',
      TARGET_MONGO_URL: `mongodb://127.0.0.1:${DB_PORT}/wekan`,
      FILES_DIR,
      MIGRATION_PORT:   APP_PORT,      // progress dashboard shown at the grain URL
      STATUS_FILE },                   // panel reads this later
  }).status;

  try { ferret.kill(); } catch (_) {}
  stopMongo(SRC_PORT);

  if (rc === 0) {
    fs.writeFileSync(MARKER, new Date().toISOString());   // never re-migrate; old data KEPT
    console.log('** Migration succeeded.');
  } else {
    console.error('** Migration failed; will retry on next grain start. Old data kept.');
    process.exit(1);
  }
}

function runApp() {
  const ferret = startFerret(DB_PORT);                    // steady-state DB
  // If FerretDB dies, take the grain down so Sandstorm restarts it cleanly.
  ferret.on('exit', code => {
    console.error(`** FerretDB exited (code ${code}); stopping grain.`);
    process.exit(code || 1);
  });
  process.on('exit', () => { try { ferret.kill(); } catch (_) {} });

  process.env.MONGO_URL     = `mongodb://127.0.0.1:${DB_PORT}/wekan`;
  process.env.ROOT_URL      = process.env.ROOT_URL || `http://127.0.0.1:${APP_PORT}`;
  process.env.PORT          = APP_PORT;
  process.env.WRITABLE_PATH = FILES_DIR;

  console.log('** Starting WeKan on FerretDB ...');
  setTimeout(() => require('./main.js'), 1500);           // let FerretDB start listening
}

ensureDirs();
migrateIfNeeded();
runApp();
