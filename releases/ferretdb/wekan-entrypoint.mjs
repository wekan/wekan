// ─────────────────────────────────────────────────────────────────────────────
// Docker entrypoint for the WeKan image — selects the database backend.
//
// The image is distroless: there is no shell, no coreutils and no util-linux in
// it, only node, the C and C++ runtime libraries and WeKan's own files. That is
// what removed the hundreds of Debian packages Artifact Hub's Trivy scan listed
// in the image. So this entrypoint is Node.js, and everything the old
// wekan-entrypoint.sh did with cat, cp, rm, head, date, sleep and `&` is done
// here with node:fs and node:child_process. Started as
//
//   CMD ["/usr/local/bin/node", "/build/wekan-entrypoint.mjs"]
//
// Every arch's bundle ships a `ferretdb` binary (the wekan/FerretDB v1 fork
// with the pure-Go SQLite backend), so FerretDB is available everywhere. Which
// backend actually starts is decided here:
//
//   WEKAN_DB=mongodb   -> never start FerretDB; use external MONGO_URL (a mongod
//                         or FerretDB container). Default on amd64/arm64.
//   WEKAN_DB=ferretdb  -> start the bundled FerretDB (SQLite) on 127.0.0.1:27017
//                         and point WeKan at it. Works on ANY arch.
//   (unset)            -> FerretDB if this image was built for a MongoDB-less arch
//                         (ppc64le/s390x/riscv64, marked by /build/.ferretdb-default)
//                         and MONGO_URL is unset; otherwise MongoDB (external).
//
// Whichever backend is chosen binds the same MongoDB wire-protocol address, so
// WeKan connects via the unchanged MONGO_URL either way.
//
// The directory this file is in is the bundle (/build in the image), so a test
// can copy it next to stand-in binaries and run all of it.
//
// Pure decisions are exported and tested: tests/dockerEntrypoint.test.cjs.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// CVE-2026-98432 (Linux kernel, IPv4 TCP use-after-free; remote code execution
// shown through an MPTCP listener, golang-announce 2026-10): Go enables MPTCP on
// every Linux listen socket by default since Go 1.24, and FerretDB is a Go
// server. Turn it off unless the operator chose a multipathtcp setting. The fix
// is a patched kernel; this only takes WeKan's own listeners out of the way.
export function godebugWithoutMptcp(godebug) {
  const value = godebug || '';
  if (`,${value},`.includes(',multipathtcp=')) return value;
  return value ? `${value},multipathtcp=0` : 'multipathtcp=0';
}

// WeKan ships NO uWebSockets.js on any platform: ddp-server requires that module
// only inside the uws transport's setup(), which a sockjs server never calls,
// and it is 121M of prebuilt binaries for OS/CPU/ABI combinations one machine
// cannot use. A deployment whose compose file or config still says uws would
// otherwise die on a missing module, so it is coerced here - loudly, so the log
// says why the setting did not take - rather than left to crash-loop.
export function ddpTransport(value, log = console.log) {
  if (value === 'uws') {
    log('WeKan: DDP_TRANSPORT=uws is not available in this build - it ships no uWebSockets.js. Using sockjs.');
    return 'sockjs';
  }
  return value || 'sockjs';
}

// The memory this container may use: the cgroup v2 limit, else the v1 limit,
// else MemTotal, else 2 GiB - the same order and the same fallbacks as before.
export function memoryBytes(read = file => fs.readFileSync(file, 'utf8')) {
  const tryRead = file => { try { return String(read(file)).trim(); } catch { return null; } };
  let value = tryRead('/sys/fs/cgroup/memory.max');
  if (value === null) value = tryRead('/sys/fs/cgroup/memory/memory.limit_in_bytes');
  if (value && /^[0-9]+$/.test(value)) return Number(value);
  const meminfo = tryRead('/proc/meminfo') || '';
  const kb = (/^MemTotal:\s+([0-9]+)/m.exec(meminfo) || [])[1];
  return (kb ? Number(kb) : 2097152) * 1024;
}

// Give V8 a deliberate share of the CONTAINER limit. Node 26's automatic
// cgroup heuristic capped a 1 GiB Helm pod at about 640 MiB; the server bundle
// can cross that while linking and creating its startup indexes, so v10.96+
// died before the first application log (#6606). Keep forty percent for native
// allocations (and the bundled FerretDB when this image runs it), cap the heap
// at the long-standing 4 GiB recommendation, and respect an administrator's
// NODE_OPTIONS and GOMEMLIMIT unchanged.
export function memoryLimits(bytes) {
  const mb = Math.floor(Math.floor(bytes / 1024) / 1024);
  return {
    heapMb: Math.min(Math.floor((mb * 3) / 5), 4096),
    goMb: Math.min(Math.floor(mb / 5), 1024),
  };
}

// MONGO_URL_FILE (#5724): a file holding the whole MongoDB URL, password
// included (Docker / Kubernetes secrets). Read here because Meteor connects
// with MONGO_URL before any WeKan code runs. MONGO_URL wins when both are set.
// Returns the URL, or throws with the message to print.
export function mongoUrlFromFile(env, read = file => fs.readFileSync(file, 'utf8')) {
  if (env.MONGO_URL || !env.MONGO_URL_FILE) return env.MONGO_URL || '';
  let text;
  try { text = read(env.MONGO_URL_FILE); } catch {
    throw new Error(`ERROR: MONGO_URL_FILE=${env.MONGO_URL_FILE} cannot be read.`);
  }
  // `$(cat file)` dropped the trailing newlines; so does this.
  const url = String(text).replace(/\n+$/, '');
  if (!url) throw new Error(`ERROR: MONGO_URL_FILE=${env.MONGO_URL_FILE} is empty.`);
  return url;
}

// FerretDB SQLite lives at <files>/db, next to attachments/avatars. WeKan appends
// "files" to WRITABLE_PATH unless it already ends with it (server/initializeDirs.js).
export function sqliteDir(env) {
  if (env.FERRETDB_SQLITE_DIR) return env.FERRETDB_SQLITE_DIR;
  const wp = env.WRITABLE_PATH || '/data';
  return `${wp.endsWith('/files') ? wp : `${wp}/files`}/db`;
}

// Whether to start the bundled FerretDB. Throws on a WEKAN_DB that is neither.
export function wantFerret(env, markerExists) {
  switch (env.WEKAN_DB || '') {
    case 'ferretdb': return true;
    case 'mongodb': return false;
    case '': return Boolean(markerExists) && !env.MONGO_URL;
    default: throw new Error(`ERROR: WEKAN_DB must be 'mongodb' or 'ferretdb' (got '${env.WEKAN_DB}')`);
  }
}

// #6458: run a binary through the bundled same-arch qemu-user when the CPU lacks
// features it declares (WEKAN_REQUIRED_CPU_FEATURES, e.g. "x86_64=avx"). This is
// snap-src/bin/cpu-exec's decision, here because the image has no bash to run
// that script with. node and ferretdb are baseline builds needing no special
// features, so with none declared this is a plain start.
//
// Returns [command, args] to spawn.
export function cpuExecPlan(binary, args, {
  spec = '', machine = os.machine(), cpuinfo = '', qemuCandidates = [], log = console.error,
} = {}) {
  let required = '';
  for (const entry of String(spec).split(',')) {
    if (entry.startsWith(`${machine}=`)) required = entry.slice(machine.length + 1);
  }
  const missing = [];
  if (required && cpuinfo) {
    for (const feature of required.split('+')) {
      if (!feature) continue;
      const escaped = feature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`^(flags|features)\\s*:.*\\s${escaped}(\\s|$)`, 'im').test(cpuinfo)) missing.push(feature);
    }
  }
  if (!missing.length) return [binary, args];
  const qemu = qemuCandidates.find(Boolean);
  if (qemu) {
    log(`cpu-exec: this CPU lacks ${missing.join(' ')}; running ${binary} through qemu-user emulation (${qemu}).`);
    log('cpu-exec: emulation is slower — consider migrating to FerretDB (no special CPU features needed).');
    return [qemu, [binary, ...args]];
  }
  log(`cpu-exec: ERROR: this CPU lacks ${missing.join(' ')} and no qemu-user (qemu-${machine}) was found;`);
  log(`cpu-exec: running ${binary} directly — expect SIGILL (Illegal instruction). Install qemu-user(-static) or migrate to FerretDB.`);
  return [binary, args];
}

function isExecutable(file) {
  try { fs.accessSync(file, fs.constants.X_OK); return fs.statSync(file).isFile(); } catch { return false; }
}

// The qemu-user candidates, first executable wins: WEKAN_QEMU_USER, the one
// beside the bundle, then PATH - cpu-exec's order without the snap's paths.
function qemuCandidates(env, build) {
  const name = `qemu-${os.machine()}`;
  const list = [env.WEKAN_QEMU_USER, path.join(build, name)];
  for (const dir of (env.PATH || '').split(':').filter(Boolean)) {
    list.push(path.join(dir, name), path.join(dir, `${name}-static`));
  }
  return list.filter(file => file && isExecutable(file));
}

function readCpuinfo(env) {
  try { return fs.readFileSync(env.WEKAN_CPUINFO || '/proc/cpuinfo', 'utf8'); } catch { return ''; }
}

const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

function appendEvent(dir, event) {
  try {
    fs.appendFileSync(path.join(dir, 'recovery-events.jsonl'), `${JSON.stringify({ db: 'wekan', ...event, ts: nowIso() })}\n`);
  } catch { /* the event log must never stop the start */ }
}

// Copy every wekan.sqlite* of `from` into `to` (cp -f "$from"/wekan.sqlite* "$to/").
// Returns false when there was nothing to copy or a copy failed.
export function copySqliteFiles(from, to) {
  let names;
  try { names = fs.readdirSync(from).filter(name => name.startsWith('wekan.sqlite')); } catch { return false; }
  if (!names.length) return false;
  try {
    for (const name of names) {
      const source = path.join(from, name);
      if (fs.statSync(source).isFile()) fs.copyFileSync(source, path.join(to, name));
    }
    return true;
  } catch { return false; }
}

// #6492 recovery: perform a REQUESTED restore before FerretDB opens the files, when
// the live database has been detected corrupt (WEKAN_FORCE_RESTORE env or a
// RESTORE_REQUESTED marker containing backup/prev/remigrate/continuous). Copies a
// known-good backup INTO the live database (dropping stale WAL side-files);
// backups are never deleted and the main wekan.sqlite is only overwritten, never
// removed. Recorded for Admin Panel / Problems / Recovery.
export function requestedRestore(dir, env, log = console.log, warn = console.error) {
  let mode = env.WEKAN_FORCE_RESTORE || '';
  const request = path.join(dir, 'RESTORE_REQUESTED');
  if (!mode && fs.existsSync(request)) {
    // head -n1 | tr -cd 'a-z'
    try { mode = fs.readFileSync(request, 'utf8').split('\n')[0].replace(/[^a-z]/g, ''); } catch { mode = ''; }
  }
  if (!mode || !dir) return null;
  const backup = path.join(dir, 'backup');
  const has = sub => fs.existsSync(path.join(sub, 'wekan.sqlite'));
  let source = '';
  if (mode === 'backup' && has(backup)) source = backup;
  else if (mode === 'prev' && has(path.join(backup, 'prev'))) source = path.join(backup, 'prev');
  // Admin Panel / Attachments / Continuous backup stages a rebuilt
  // database here (server/continuousBackup.js), never over the live one.
  else if (mode === 'continuous' && has(path.join(dir, 'continuous-restore'))) source = path.join(dir, 'continuous-restore');
  try { fs.writeFileSync(path.join(dir, 'RECOVERY_IN_PROGRESS'), `recovery ${mode}\n`); } catch { /* best effort */ }
  // A continuous-backup restore replaces the live database the administrator
  // chose to roll back: keep that one first, at rest with its WAL, beside the
  // staged copy. Never removed here.
  if (mode === 'continuous' && source && fs.existsSync(path.join(dir, 'wekan.sqlite'))) {
    const replaced = path.join(dir, 'continuous-restore', 'replaced');
    try { fs.mkdirSync(replaced, { recursive: true }); } catch { /* copy below fails then */ }
    if (!copySqliteFiles(dir, replaced)) source = '';
  }
  if (source) {
    if (copySqliteFiles(source, dir)) {
      for (const side of ['wekan.sqlite-wal', 'wekan.sqlite-shm']) fs.rmSync(path.join(dir, side), { force: true });
      appendEvent(dir, { type: `restore-${mode}`, severity: 'warning', source: 'startup', detail: 'Restored wekan.sqlite from a backup copy' });
      log(`Recovery: restored text-data database from ${source}.`);
      fs.rmSync(request, { force: true });
      return 'restored';
    }
    appendEvent(dir, { type: 'restore-failed', severity: 'error', source: 'startup', detail: 'Could not copy the requested backup; request retained for retry' });
    warn('Recovery: restore copy failed; request retained for retry.');
    return 'failed';
  }
  if (mode === 'remigrate') {
    appendEvent(dir, { type: 'remigrate', severity: 'warning', source: 'startup', detail: 'Re-migration of text data from MongoDB requested' });
    log('Recovery: re-migration from MongoDB requested.');
    fs.rmSync(request, { force: true });
    return 'remigrate';
  }
  appendEvent(dir, { type: 'manual-required', severity: 'error', source: 'startup', detail: 'Requested recovery source is invalid or missing; request retained for retry' });
  warn('Recovery: requested source is invalid or missing; request retained.');
  return 'missing';
}

// #6492 safety: rotating backup of the TEXT-DATA database (wekan.sqlite*) into a
// "backup" subfolder of the same data dir, so a known copy is ready to restore if
// the live database is ever detected corrupt. Made at rest, before FerretDB opens
// the files. Only ever COPIES from the live database (never moved/deleted) and
// only wekan.sqlite* (attachments/avatars live on the filesystem). The previous
// backup is kept under backup/prev. Set WEKAN_SQLITE_BACKUP=false to disable.
// Used only when the bundle has no sqlite-recovery.mjs, which does this itself.
export function rotatingBackup(dir, log = console.log, warn = console.error) {
  if (!dir || !fs.existsSync(path.join(dir, 'wekan.sqlite'))) return null;
  const backup = path.join(dir, 'backup');
  fs.mkdirSync(backup, { recursive: true });
  if (fs.existsSync(path.join(backup, 'wekan.sqlite'))) {
    const prev = path.join(backup, 'prev');
    fs.rmSync(prev, { recursive: true, force: true });
    fs.mkdirSync(prev, { recursive: true });
    copySqliteFiles(backup, prev);
  }
  if (copySqliteFiles(dir, backup)) {
    log(`Backed up text-data database (wekan.sqlite*) to ${backup} (previous kept in ${backup}/prev).`);
    appendEvent(dir, { type: 'backup-created', severity: 'info', source: 'startup', detail: 'Backed up wekan.sqlite to backup/' });
    return true;
  }
  appendEvent(dir, { type: 'backup-failed', severity: 'error', source: 'startup', detail: 'Could not copy wekan.sqlite to backup/; previous backup was retained' });
  warn('Recovery: text-data backup failed; previous backup retained.');
  return false;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise(resolve => {
    child.once('exit', resolve);
    try { child.kill('SIGTERM'); } catch { resolve(); }
  });
}

function runQuiet(file, args, env) {
  // A probe answers with its status; stderr is its reason.
  const r = spawnSync(file, args, { env, encoding: 'utf8' });
  return { status: r.status === null ? 1 : r.status, stderr: String(r.stderr || '').trim() };
}

export async function main({ build = path.dirname(fileURLToPath(import.meta.url)), env = { ...process.env } } = {}) {
  const node = process.execPath;
  const log = (...a) => console.log(...a);
  const warn = (...a) => console.error(...a);
  const cpuOptions = () => ({
    spec: env.WEKAN_REQUIRED_CPU_FEATURES || '', cpuinfo: readCpuinfo(env), qemuCandidates: qemuCandidates(env, build), log: warn,
  });

  env.GODEBUG = godebugWithoutMptcp(env.GODEBUG);
  env.DDP_TRANSPORT = ddpTransport(env.DDP_TRANSPORT, log);

  if (!env.NODE_OPTIONS || !env.GOMEMLIMIT) {
    const { heapMb, goMb } = memoryLimits(memoryBytes());
    if (!env.NODE_OPTIONS) {
      env.NODE_OPTIONS = `--max-old-space-size=${heapMb}`;
      log(`WeKan: Node heap limit ${heapMb} MiB (60% of available memory, capped at 4096 MiB).`);
    }
    if (!env.GOMEMLIMIT) env.GOMEMLIMIT = `${goMb}MiB`;
  }

  try {
    const fromFile = !env.MONGO_URL && env.MONGO_URL_FILE;
    env.MONGO_URL = mongoUrlFromFile(env);
    if (!env.MONGO_URL) delete env.MONGO_URL;
    if (fromFile) log('Using MONGO_URL from MONGO_URL_FILE');
  } catch (e) {
    warn(e.message);
    return 1;
  }

  const ferretBin = path.join(build, 'ferretdb');
  const listen = env.FERRETDB_LISTEN_ADDR || '127.0.0.1:27017';
  const dbDir = sqliteDir(env);
  const children = [];
  let stopping = false;

  let ferret = false;
  try { ferret = wantFerret(env, fs.existsSync(path.join(build, '.ferretdb-default'))); } catch (e) { warn(e.message); return 1; }

  if (ferret) {
    if (!isExecutable(ferretBin)) {
      warn(`ERROR: FerretDB requested but ${ferretBin} is missing/not executable.`);
      return 1;
    }
    env.MONGO_URL = env.MONGO_URL || `mongodb://${listen}/wekan`;
    fs.mkdirSync(dbDir, { recursive: true });
    // Bundled FerretDB v1 SQLite is standalone and polling-only. Replica sets,
    // change streams and OpLog tailing are reserved for external MongoDB.
    delete env.MONGO_OPLOG_URL;
    env.METEOR_REACTIVITY_ORDER = 'polling';
    env.DEFAULT_METEOR_REACTIVITY_ORDER = 'polling';
    // Telemetry off: --telemetry=disable both disables AND locks it (FerretDB won't
    // let it be re-enabled). DO_NOT_TRACK/FERRETDB_TELEMETRY are belt-and-suspenders.
    env.DO_NOT_TRACK = '1';
    env.FERRETDB_TELEMETRY = 'disable';
    const recovery = path.join(build, 'sqlite-recovery.mjs');
    if (fs.existsSync(recovery)) {
      // The node running this, not /build/node: the image keeps node in
      // /usr/local/bin, and /build/node never existed there, so the shell
      // entrypoint's `/build/node sqlite-recovery.mjs` stopped every FerretDB
      // start of the image with status 127.
      const r = spawnSync(node, [recovery, 'startup', dbDir, ferretBin], { env, stdio: 'inherit' });
      const rc = r.status === null ? 1 : r.status;
      if (rc !== 0) {
        warn(`Recovery could not produce a verified SQLite database (status ${rc}).`);
        return rc;
      }
    }
    requestedRestore(dbDir, env, log, warn);
    if (!fs.existsSync(recovery) && (env.WEKAN_SQLITE_BACKUP || 'true') === 'true') rotatingBackup(dbDir, log, warn);
    log(`Starting bundled FerretDB v1 (SQLite) on ${listen} (standalone polling) ...`);
    const [cmd, args] = cpuExecPlan(ferretBin, [
      '--handler=sqlite',
      `--sqlite-url=file:${dbDir}/`,
      `--listen-addr=${listen}`,
      '--telemetry=disable',
      '--log-level=error',
    ], cpuOptions());
    const db = spawn(cmd, args, { env, stdio: 'inherit' });
    db.on('error', e => warn(`FerretDB could not start: ${e.message}`));
    db.on('exit', (code, signal) => { if (!stopping) warn(`FerretDB exited (${signal || code}).`); });
    children.push(db);
  }

  const bridgeEnv = extra => ({ ...env, PORT: env.PORT || '8080', PRODUCT_NAME: env.PRODUCT_NAME || 'WeKan', ...extra });
  const bridge = path.join(build, 'recovery-bridge.mjs');

  // #6492: if a recovery is in progress, briefly serve the static "recovering data"
  // page on the web port while the just-restored FerretDB comes back up, then start
  // WeKan (whose in-app recovery spinner, driven by the same RECOVERY_IN_PROGRESS
  // marker, then takes over). Bounded so it can never block WeKan.
  const inProgress = path.join(dbDir, 'RECOVERY_IN_PROGRESS');
  if (fs.existsSync(inProgress) && fs.existsSync(bridge)) {
    const grace = Number(env.WEKAN_RECOVERY_BRIDGE_SECONDS || 20);
    log(`Recovery in progress: bridging with the recovery page for up to ${grace}s before starting WeKan.`);
    const page = spawn(node, [bridge], { env: bridgeEnv({}), stdio: 'inherit' });
    for (let waited = 0; fs.existsSync(inProgress) && waited < grace; waited += 2) await sleep(2000);
    await stop(page);
  }

  // #6595: WAIT FOR THE DATABASE BEHIND A PAGE, not behind a closed port.
  //
  // WeKan does not open its web port until the database answers. In a container
  // nothing else was listening while it waited, so a reverse proxy in front
  // returned "Gateway timeout" - the same symptom for WeKan being broken and for
  // the database not being up yet. The wait is NOT a timeout on the database;
  // what is bounded is the PAGE: after WEKAN_DB_WAIT_MAX_SECONDS it stops and
  // WeKan starts anyway and keeps waiting itself. WEKAN_DB_WAIT_PAGE=false keeps
  // the old behaviour.
  const dbReady = path.join(build, 'db-ready.mjs');
  if ((env.WEKAN_DB_WAIT_PAGE || 'true') === 'true' && fs.existsSync(dbReady) && fs.existsSync(bridge) && env.MONGO_URL) {
    const probeEnv = { ...env, NODE_PATH: path.join(build, 'programs/server/node_modules') };
    const probe = () => runQuiet(node, [dbReady, env.MONGO_URL], probeEnv);
    // The FIRST probe's reason is printed: a MONGO_URL the driver refuses
    // outright must not look like a database that has not started yet.
    const first = probe();
    // 0 = answering, 1 = not answering, 2 = the probe could not ask at all - and
    // "could not ask" is no evidence of a problem, so it puts up no page.
    if (first.status === 2) {
      log(`Cannot check whether the database is answering (${first.stderr || 'no reason given'}); starting WeKan without the waiting page.`);
    } else if (first.status !== 0) {
      const max = Number(env.WEKAN_DB_WAIT_MAX_SECONDS || 600);
      log(`The database is not answering yet; serving the 'waiting for database' page on port ${env.PORT || '8080'} while it comes up.`);
      // The reason goes on the PAGE too: whoever is waiting is looking at a browser.
      const page = spawn(node, [bridge], { env: bridgeEnv({ WEKAN_BRIDGE_REASON: 'database', WEKAN_BRIDGE_DETAIL: first.stderr }), stdio: 'inherit' });
      let waited = 0;
      while (waited < max) {
        await sleep(3000);
        waited += 3;
        if (probe().status === 0) {
          log('The database is answering; starting WeKan.');
          break;
        }
      }
      if (waited >= max) {
        log(`The database has not answered in ${max}s; starting WeKan anyway, which will keep waiting for it.`);
        const last = probe();
        if (last.stderr) warn(last.stderr);
      }
      // The page holds the web port, so it has to be gone before WeKan binds it.
      await stop(page);
    }
  }

  // WeKan itself. The shell entrypoint exec'd it; Node cannot exec, so this
  // process stays as PID 1 and passes signals on. (`ulimit -s 65500` is gone
  // with the shell: V8's own --stack-size limit is far below the default 8 MiB
  // stack, so it never changed what WeKan could do. A deployment that raises
  // --stack-size in NODE_OPTIONS sets the stack with `docker run --ulimit stack=`
  // or the compose file's `ulimits:`.)
  const [cmd, args] = cpuExecPlan(node, [path.join(build, 'main.js')], cpuOptions());
  const wekan = spawn(cmd, args, { env, stdio: 'inherit', cwd: build });
  children.push(wekan);
  for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
    process.on(signal, () => {
      stopping = true;
      for (const child of children) { try { child.kill(signal); } catch { /* gone */ } }
    });
  }
  return new Promise(resolve => {
    wekan.on('error', e => { warn(`WeKan could not start: ${e.message}`); resolve(1); });
    wekan.on('exit', async (code, signal) => {
      stopping = true;
      await Promise.all(children.filter(c => c !== wekan).map(stop));
      resolve(code === null ? 128 + (os.constants.signals[signal] || 1) : code);
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(code => process.exit(code), e => { console.error(e && e.stack ? e.stack : e); process.exit(1); });
}
