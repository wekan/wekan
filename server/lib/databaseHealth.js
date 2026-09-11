// Database health probe, the Meteor half of models/lib/databaseHealth.js.
//
// Runs once at startup and then every five minutes, asks MongoDB what it can
// answer from WeKan's side of the socket - serverStatus, dbStats,
// getCmdLineOpts - and, when the data directory is a path this process can
// see, asks the kernel what filesystem it is on. Each finding is one row in
// Admin Panel / Problems / Database problems (the `database` stream), with
// what it means and what to do, folded per type so a problem that persists
// is one row with a count, not a row per probe.
//
// FerretDB answers only some of these commands (no opLatencies, no
// fsTotalSize); every step is independent and wrapped, so what it cannot
// answer is skipped and the rest still runs. Nothing here can throw into
// startup, and nothing here is on a request path.
import { Meteor } from 'meteor/meteor';
import fs from 'fs';
import { getRawDb } from '/server/lib/mongoStartup';
import { recordDatabaseHealth } from '/server/lib/databaseProblems';
const health = require('/models/lib/databaseHealth');

const PROBE_MS = 5 * 60 * 1000;

const state = {
  uptime: null,
  restarts: 0,
  opLatencies: null,
  networkFsReported: false,
};

async function serverStatus(db) {
  try {
    return await db.admin().command({ serverStatus: 1 });
  } catch (e) {
    return null;
  }
}

async function dbStats(db) {
  try {
    return await db.command({ dbStats: 1 });
  } catch (e) {
    return null;
  }
}

async function dataDirectory(db) {
  try {
    const opts = await db.admin().command({ getCmdLineOpts: 1 });
    const parsed = opts && opts.parsed;
    return (parsed && parsed.storage && parsed.storage.dbPath) || '';
  } catch (e) {
    return '';
  }
}

// The data directory is only inspectable when this process shares a
// filesystem with mongod - the snap, the bundle with its embedded database,
// or a container that mounts the same volume. A separate database container
// or host has a dbPath that does not exist here, and that is simply skipped.
function checkDataDirectory(dbPath) {
  if (state.networkFsReported || !dbPath || typeof fs.statfs !== 'function') return;
  if (!fs.existsSync(dbPath)) return;
  fs.statfs(dbPath, (error, stats) => {
    if (error || !stats) return;
    const name = health.networkFilesystem(stats.type);
    if (!name) return;
    state.networkFsReported = true;
    recordDatabaseHealth(health.networkFilesystemProblem(name, dbPath));
  });
}

export async function probeDatabaseHealth() {
  let db;
  try {
    db = getRawDb();
  } catch (e) {
    return;
  }
  if (!db) return;

  const dbPath = await dataDirectory(db);

  const status = await serverStatus(db);
  if (status) {
    const uptime = Number(status.uptime);
    if (health.restartDetected(state.uptime, uptime)) {
      state.restarts += 1;
      recordDatabaseHealth(health.restartProblem(state.restarts, dbPath));
    }
    if (Number.isFinite(uptime)) state.uptime = uptime;

    if (status.opLatencies) {
      const avg = health.readLatencyMs(state.opLatencies, status.opLatencies);
      const ops = state.opLatencies && state.opLatencies.reads
        ? Number(status.opLatencies.reads.ops) - Number(state.opLatencies.reads.ops) : 0;
      if (health.slowStorage(avg, ops)) recordDatabaseHealth(health.slowStorageProblem(avg, ops));
      state.opLatencies = status.opLatencies;
    }
  }

  const stats = await dbStats(db);
  const space = health.diskSpace(stats);
  if (space && space.critical) recordDatabaseHealth(health.diskSpaceProblem(space, dbPath));

  checkDataDirectory(dbPath);
}

Meteor.startup(() => {
  const run = () => {
    probeDatabaseHealth().catch(e => {
      if (process.env.DEBUG === 'true') console.warn('database health probe failed:', e && e.message);
    });
  };
  // Not in the way of the rest of startup: the first probe waits until the
  // server has settled, and the indexes ensureIndex may be creating are done.
  Meteor.setTimeout(run, 30 * 1000);
  Meteor.setInterval(run, PROBE_MS);
});
