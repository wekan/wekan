'use strict';

// The environment WeKan and FerretDB are started with. It is
// releases/ferretdb/start-wekan.sh's, decision for decision, so a single file
// behaves like the bundle ZIP it was made from:
//
//   - the same defaults: PORT 8080, ROOT_URL from it, WITH_API=true (exports
//     need it), CARDS_LOADING=auto, FerretDB on 127.0.0.1:27017, polling
//     reactivity and no oplog for FerretDB, telemetry off;
//   - the same memory budget: Node 3/5 of RAM up to 4 GiB (1 GiB on 32-bit),
//     FerretDB's Go 1/5 up to 1 GiB, both from the cgroup limit when lower;
//   - the same escape hatches: MONGO_URL elsewhere or WEKAN_DB=mongodb uses an
//     external database and does not start FerretDB.
//
// What a single file adds is wekan-files/wekan.env: settings kept beside the
// data, so the menu, a terminal and an autostart entry all start WeKan the
// same way. Precedence: the real environment, then wekan.env, then defaults.

const fs = require('node:fs');
const os = require('node:os');

const ENV_TEMPLATE = `# WeKan single-file settings, read every time WeKan starts.
# One KEY=VALUE per line. A variable set in the real environment wins.
# Everything WeKan understands works here, e.g. MAIL_URL, MAIL_FROM.
#
# PORT=8080
# ROOT_URL=http://localhost:8080
# WITH_API=true
# MONGO_URL=mongodb://127.0.0.1:27017/wekan
`;

function parseEnvFile(text) {
  const out = {};
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"') && value.length >= 2)
      || (value.startsWith("'") && value.endsWith("'") && value.length >= 2)) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

/** Sets KEY=VALUE in an env file's text, keeping every other line. */
function setEnvValue(text, key, value) {
  const lines = String(text || '').split(/\r?\n/);
  const re = new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`);
  let done = false;
  const next = lines.map(line => {
    if (!done && re.test(line)) {
      done = true;
      return `${key}=${value}`;
    }
    return line;
  });
  while (next.length && next[next.length - 1] === '') next.pop();
  if (!done) next.push(`${key}=${value}`);
  return `${next.join('\n')}\n`;
}

function readCgroupMb(fsImpl = fs) {
  for (const file of ['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory/memory.limit_in_bytes']) {
    try {
      const raw = fsImpl.readFileSync(file, 'utf8').trim();
      if (/^\d+$/.test(raw)) return Math.floor(Number(raw) / 1048576);
    } catch (e) {
      // not there: not a cgroup v1/v2 system
    }
  }
  return 0;
}

function memoryBudget({ totalMb, cgroupMb = 0, bits = 64 }) {
  let memoryMb = totalMb > 0 ? totalMb : 2048;
  if (cgroupMb > 0 && cgroupMb < memoryMb) memoryMb = cgroupMb;
  let heapMb = Math.floor((memoryMb * 3) / 5);
  if (heapMb > 4096) heapMb = 4096;
  // A 32-bit Node.js has 4 GiB of address space for everything; asking V8
  // for the 64-bit ceiling makes it die before WeKan's code runs.
  if (bits === 32 && heapMb > 1024) heapMb = 1024;
  let goMb = Math.floor(memoryMb / 5);
  if (goMb > 1024) goMb = 1024;
  return { memoryMb, heapMb, goMb };
}

/**
 * @return {{env: object, port: string, rootUrl: string, mongoUrl: string,
 *   ferretAddr: string, useFerret: boolean, budget: object, notes: string[]}}
 */
function buildEnv({ base = process.env, file = {}, layout, version = '', target = '',
  totalMb = Math.floor(os.totalmem() / 1048576), cgroupMb = readCgroupMb(),
  bits = /64/.test(process.arch) ? 64 : 32 }) {
  const env = { ...file, ...base };
  const notes = [];
  if (env.DDP_TRANSPORT === 'uws') {
    notes.push('DDP_TRANSPORT=uws is not available in this build - it ships no uWebSockets.js. Using sockjs.');
    env.DDP_TRANSPORT = 'sockjs';
  }
  env.DDP_TRANSPORT = env.DDP_TRANSPORT || 'sockjs';
  const budget = memoryBudget({ totalMb, cgroupMb, bits });
  env.NODE_OPTIONS = env.NODE_OPTIONS || `--max-old-space-size=${budget.heapMb}`;
  env.GOMEMLIMIT = env.GOMEMLIMIT || `${budget.goMb}MiB`;
  env.WRITABLE_PATH = layout.writable;
  env.PORT = env.PORT || '8080';
  env.ROOT_URL = env.ROOT_URL || `http://localhost:${env.PORT}`;
  const ferretAddr = env.FERRETDB_LISTEN_ADDR || '127.0.0.1:27017';
  env.MONGO_URL = env.MONGO_URL || `mongodb://${ferretAddr}/wekan`;
  env.WITH_API = env.WITH_API || 'true';
  env.CARDS_LOADING = env.CARDS_LOADING || 'auto';
  env.WEKAN_PACKAGING = env.WEKAN_PACKAGING || 'single-file';
  if (version) env.WEKAN_SINGLE_FILE_VERSION = version;
  if (target) env.WEKAN_SINGLE_FILE_TARGET = target;
  let useFerret = true;
  if (env.WEKAN_DB === 'mongodb') useFerret = false;
  else if (env.WEKAN_DB && env.WEKAN_DB !== 'ferretdb') {
    throw new Error(`WEKAN_DB must be 'mongodb' or 'ferretdb' (got '${env.WEKAN_DB}')`);
  }
  if (!env.MONGO_URL.includes(ferretAddr)) useFerret = false;
  if (useFerret) {
    env.METEOR_POLLING_THROTTLE_MS = env.METEOR_POLLING_THROTTLE_MS || '2000';
    env.METEOR_POLLING_INTERVAL_MS = env.METEOR_POLLING_INTERVAL_MS || '30000';
    delete env.MONGO_OPLOG_URL;
    env.METEOR_REACTIVITY_ORDER = 'polling';
    env.DEFAULT_METEOR_REACTIVITY_ORDER = 'polling';
    env.DO_NOT_TRACK = '1';
    env.FERRETDB_TELEMETRY = 'disable';
  }
  // The launcher's own role switch must never leak into what it starts.
  delete env.WEKAN_SINGLE_FILE_ROLE;
  return { env, port: env.PORT, rootUrl: env.ROOT_URL, mongoUrl: env.MONGO_URL, ferretAddr, useFerret, budget, notes };
}

function readEnvFile(layout, fsImpl = fs) {
  try {
    return parseEnvFile(fsImpl.readFileSync(layout.envFile, 'utf8'));
  } catch (e) {
    return {};
  }
}

module.exports = { ENV_TEMPLATE, parseEnvFile, setEnvValue, memoryBudget, readCgroupMb, buildEnv, readEnvFile };
