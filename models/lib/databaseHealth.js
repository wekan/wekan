// Database health, the pure half (server/lib/databaseHealth.js is the probe).
//
// A reported crash series (.tools/crash: WeKan and MongoDB in one Kubernetes
// pod, the data directory on an SMB/DFS share) showed what Admin Panel /
// Problems could not: MongoDB aborting on every checkpoint because fsync()
// returned ENOSPC on the share, restarting, and aborting again - while every
// query in between was slow because each index page came over the network.
// Nothing in WeKan saw it; the admin found it in the container log.
//
// These are the checks WeKan can make from its side of the socket, each a
// pure function of what MongoDB reports (serverStatus, dbStats,
// getCmdLineOpts) or of the local filesystem, so tests/databaseHealth.test.cjs
// drives them without a database:
//
//   restartDetected     serverStatus.uptime went DOWN -> the database process
//                       restarted (a crash, when WeKan did not restart it)
//   networkFilesystem   the data directory's statfs f_type is a network
//                       filesystem WiredTiger cannot run on
//   readLatency         serverStatus.opLatencies: average read latency over
//                       the interval, the storage-latency symptom
//   diskSpace           dbStats fsUsedSize/fsTotalSize: the real "no space
//                       left on device", before it happens
//   collectionScans     the "Slow query" lines MongoDB keeps in its own log
//                       (getLog): a COLLSCAN reading at least 10,000
//                       documents means a query has no index
//   scanRate            serverStatus.metrics.queryExecutor.scannedObjects:
//                       how many documents the database reads per second
//
// The last two found, on one instance, a 10 GB collection scanned three times
// per search and an hourly job reading all 1.1 million cards - neither was
// visible anywhere in WeKan, only in the database's own log (#6826).
//
// Remediation is what WeKan can do itself: a missing index is created at
// startup (server/lib/mongoStartup.js ensureIndex) and recorded as fixed;
// the rest is recorded with what to do, since a filesystem cannot be changed
// from inside the application.

const DOCS = 'docs/Databases/MongoDB/Storage-Requirements.md';

// Linux statfs f_type magic numbers of filesystems MongoDB documents as
// unsupported for the data directory (remote / network filesystems).
const NETWORK_FS_TYPES = {
  0xff534d42: 'cifs',
  0xfe534d42: 'smb2',
  0x6969: 'nfs',
  0x65735546: 'fuse',
  0x01021997: '9p',
  0x2fc12fc1: 'zfs-fuse',
  0x19830326: 'fhgfs',
  0xc36400: 'ceph-fs',
  0x1373: 'devfs',
};
// A few common local ones, named so a detail line can say what it found.
const LOCAL_FS_TYPES = {
  0xef53: 'ext4', 0x58465342: 'xfs', 0x9123683e: 'btrfs', 0x01021994: 'tmpfs',
  0x6c: 'overlayfs', 0x794c7630: 'overlayfs', 0xf15f: 'ecryptfs',
};

function networkFilesystem(fType) {
  const key = Number(fType);
  if (!Number.isFinite(key)) return null;
  return NETWORK_FS_TYPES[key] || null;
}

function filesystemName(fType) {
  const key = Number(fType);
  return NETWORK_FS_TYPES[key] || LOCAL_FS_TYPES[key] || (Number.isFinite(key) ? `0x${key.toString(16)}` : 'unknown');
}

// serverStatus.uptime is seconds since the mongod started. Lower than last time
// (with a margin for a probe that ran twice in a second) means it restarted.
function restartDetected(previousUptimeSec, uptimeSec) {
  if (!Number.isFinite(previousUptimeSec) || !Number.isFinite(uptimeSec)) return false;
  return uptimeSec + 5 < previousUptimeSec;
}

// serverStatus.opLatencies.reads = { latency: <total microseconds>, ops: <count> },
// cumulative since start. The average over an interval is the delta.
function readLatencyMs(previous, current) {
  const p = previous && previous.reads;
  const c = current && current.reads;
  if (!p || !c) return null;
  const ops = Number(c.ops) - Number(p.ops);
  const latency = Number(c.latency) - Number(p.latency);
  if (!(ops > 0) || !(latency >= 0)) return null;
  return latency / ops / 1000;
}

const SLOW_READ_MS = 100;

function slowStorage(avgReadMs, ops) {
  // A handful of reads can be slow for any reason; a sustained average over a
  // real number of them is the storage.
  return Number.isFinite(avgReadMs) && avgReadMs >= SLOW_READ_MS && ops >= 20;
}

// dbStats (MongoDB 4.4+) reports the filesystem behind the data directory.
const MIN_FREE_BYTES = 512 * 1024 * 1024;
const MIN_FREE_PERCENT = 5;

function diskSpace(dbStats) {
  const total = Number(dbStats && dbStats.fsTotalSize);
  const used = Number(dbStats && dbStats.fsUsedSize);
  if (!(total > 0) || !(used >= 0)) return null;
  const free = Math.max(0, total - used);
  const percentFree = (free / total) * 100;
  return {
    freeBytes: free,
    totalBytes: total,
    percentFree,
    critical: free < MIN_FREE_BYTES || percentFree < MIN_FREE_PERCENT,
  };
}

function gib(bytes) {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
}

// MongoDB 8.2 keeps a second, throwaway WiredTiger instance under the data
// directory for queries that spill to disk. mongod empties it on every start
// (it holds nothing worth keeping) and recreates it - but a second reported
// crash series (.tools/test: mongo:8.2.2 in Kubernetes, the disk really full)
// showed that emptying it can fail ("Failed to clear dbpath of the internal
// WiredTiger instance", "Directory not empty") after an abort, and mongod
// then opens the half-emptied directory, finds no WiredTiger version file,
// reports "Failed to open the spill WiredTiger instance ... database
// corruption detected" and fasserts. It does that on EVERY start, with the
// disk long since freed, until somebody deletes the directory by hand. The
// real data is not corrupt; only this scratch directory is.
const SPILL_DIRECTORY = '_tmp/spilldb';
const SPILL_OPEN_FAILURE = 'Failed to open the spill WiredTiger instance';

function spillDirectory(dbPath) {
  const base = String(dbPath || '').replace(/[\\/]+$/, '');
  return `${base}/${SPILL_DIRECTORY}`;
}

function spillLoopAdvice(dbPath) {
  return `If MongoDB 8.2 then fails to START, with "${SPILL_OPEN_FAILURE}" in its log, only its scratch `
    + `directory is broken: stop it, delete ${spillDirectory(dbPath || '<dbPath>')} (nothing else), and start it again`;
}

// The rows, in the `database` stream's shape (type/kind/severity/detail).
function restartProblem(restarts, dbPath) {
  return {
    type: 'db.restart',
    kind: 'availability',
    severity: 'high',
    detail: `The database process restarted (${restarts} time${restarts === 1 ? '' : 's'} since WeKan started) `
      + 'while WeKan kept running - MongoDB aborting is the usual cause. Read its log for a "Fatal assertion": '
      + 'a WiredTiger checkpoint failing with "No space left on device" means the disk under the data '
      + 'directory is full (free it or grow the volume), or, when it has free space, that the directory is on a '
      + `network filesystem (SMB/NFS), which MongoDB cannot use. ${spillLoopAdvice(dbPath)} - see ${DOCS}.`,
  };
}

function networkFilesystemProblem(name, dbPath) {
  return {
    type: 'db.network-filesystem',
    kind: 'storage',
    severity: 'high',
    detail: `MongoDB's data directory ${dbPath} is on a ${name} network filesystem. WiredTiger needs fsync() `
      + 'semantics a network share cannot give: it will abort on a checkpoint ("No space left on device" with '
      + `space free) and every query pays the network latency. Move the data directory to a local disk - ${DOCS}.`,
  };
}

function slowStorageProblem(avgReadMs, ops) {
  return {
    type: 'db.slow-storage',
    kind: 'performance',
    severity: 'medium',
    detail: `Database reads averaged ${avgReadMs.toFixed(0)} ms over the last interval (${ops} reads). `
      + 'That is storage latency, not query cost: the database waited for its disk. A data directory on a '
      + `network filesystem, an overloaded volume, or a VM without its disk cache does this - ${DOCS}.`,
  };
}

function diskSpaceProblem(space, dbPath) {
  return {
    type: 'db.disk-space',
    kind: 'disk',
    severity: 'high',
    detail: `The filesystem under MongoDB's data directory has ${gib(space.freeBytes)} free of `
      + `${gib(space.totalBytes)} (${space.percentFree.toFixed(1)}%). Below that, writes and checkpoints fail `
      + `with "No space left on device" and MongoDB stops. Free space or grow the volume now. ${spillLoopAdvice(dbPath)}.`,
  };
}

function indexCreatedRemediation(collectionName, keys, documents) {
  return {
    type: 'db.index-created',
    kind: 'index',
    severity: 'low',
    detail: `Created the missing index ${JSON.stringify(keys)} on ${collectionName}, which already held `
      + `${documents} document${documents === 1 ? '' : 's'}: until now every query on it was a full `
      + 'collection scan (a "Slow query" line in the MongoDB log per read). Fixed automatically; nothing to do.',
  };
}

// ---- queries without an index ----------------------------------------------

// A full collection scan this big is a missing index, not a small lookup table
// (settings, customBoardRoles... are scanned whole by design).
const SCAN_MIN_DOCS = 10000;
// Documents read per second, sustained over a probe interval, above which the
// database is doing work no index would need.
const SCAN_RATE_PER_SEC = 50000;

// The field NAMES a query filtered on, never its values.
const fieldShape = filter => (filter && typeof filter === 'object' && !Array.isArray(filter)
  ? Object.keys(filter).sort().join(',') : '');

function slowQueryFilter(command) {
  const cmd = command || {};
  const first = list => (Array.isArray(list) && list[0]) || null;
  return cmd.filter || cmd.q || cmd.query
    || (first(cmd.pipeline) && first(cmd.pipeline).$match)
    || (first(cmd.updates) && first(cmd.updates).q)
    || (first(cmd.deletes) && first(cmd.deletes).q)
    || null;
}

// The getLog('global') lines (JSON strings) newer than `sinceMs`: the big
// collection scans, grouped by collection and the fields they filtered on.
// Returns { groups, newestMs }.
function collectionScans(logLines, sinceMs = 0) {
  const groups = new Map();
  let newestMs = sinceMs;
  for (const line of Array.isArray(logLines) ? logLines : []) {
    let entry;
    try { entry = typeof line === 'string' ? JSON.parse(line) : line; } catch (e) { continue; }
    const at = Date.parse(entry && entry.t && entry.t.$date);
    if (!Number.isFinite(at) || at <= sinceMs) continue;
    if (at > newestMs) newestMs = at;
    const a = entry.msg === 'Slow query' && entry.attr;
    if (!a || typeof a.ns !== 'string' || /^(local|config|admin)\./.test(a.ns)) continue;
    if (!/COLLSCAN/.test(String(a.planSummary || '')) || !(Number(a.docsExamined) >= SCAN_MIN_DOCS)) continue;
    const fields = fieldShape(slowQueryFilter(a.command));
    const key = `${a.ns}|${fields}`;
    const g = groups.get(key) || { ns: a.ns, fields, count: 0, maxDocs: 0, maxMs: 0 };
    g.count += 1;
    g.maxDocs = Math.max(g.maxDocs, Number(a.docsExamined) || 0);
    g.maxMs = Math.max(g.maxMs, Number(a.durationMillis) || 0);
    groups.set(key, g);
  }
  return { groups: [...groups.values()].sort((x, y) => y.maxDocs * y.count - x.maxDocs * x.count), newestMs };
}

function collectionScanProblem(groups) {
  const list = (groups || []).slice(0, 3).map(g => `${g.ns} (filter on ${g.fields || 'nothing'}: `
    + `${g.count}x, up to ${g.maxDocs} documents, ${g.maxMs} ms)`).join('; ');
  return {
    type: 'db.collection-scan',
    kind: 'index',
    severity: 'medium',
    detail: `MongoDB read whole collections to answer queries: ${list}. A full scan per query means an `
      + 'index is missing - WeKan creates the ones it knows at startup, so this one is unknown to it. '
      + 'Report the collection and the filter fields to WeKan; the query, not the data, is what needs fixing.',
  };
}

// serverStatus.metrics.queryExecutor.scannedObjects between two probes. Null
// when it cannot be told - no previous probe, or the counter went down because
// the database restarted.
function scanRate(previous, current, seconds) {
  if (previous === null || previous === undefined || current === null || current === undefined) return null;
  const before = Number(previous), after = Number(current);
  if (!Number.isFinite(before) || !Number.isFinite(after) || !(seconds > 0) || after < before) return null;
  return (after - before) / seconds;
}

function scanRateProblem(perSecond) {
  return {
    type: 'db.scan-rate',
    kind: 'performance',
    severity: 'medium',
    detail: `The database read ${Math.round(perSecond)} documents per second over the last interval. `
      + 'That much reading is queries without a fitting index, or one query asked far too often; the '
      + '"collection scan" row here, and the MongoDB log\'s "Slow query" lines, name them.',
  };
}

module.exports = {
  DOCS,
  NETWORK_FS_TYPES,
  SLOW_READ_MS,
  MIN_FREE_BYTES,
  MIN_FREE_PERCENT,
  SPILL_DIRECTORY,
  SPILL_OPEN_FAILURE,
  spillDirectory,
  spillLoopAdvice,
  networkFilesystem,
  filesystemName,
  restartDetected,
  readLatencyMs,
  slowStorage,
  diskSpace,
  restartProblem,
  networkFilesystemProblem,
  slowStorageProblem,
  diskSpaceProblem,
  indexCreatedRemediation,
  SCAN_MIN_DOCS,
  SCAN_RATE_PER_SEC,
  collectionScans,
  collectionScanProblem,
  scanRate,
  scanRateProblem,
};
