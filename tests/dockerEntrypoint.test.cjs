'use strict';
// The Docker image is distroless - no shell - so its entrypoint is Node.js:
// releases/ferretdb/wekan-entrypoint.mjs. This runs its decisions and the whole
// start, with stand-in binaries, the way the image runs it:
//
//   - MPTCP off for Go (CVE-2026-98432), uws coerced to sockjs, the heap and
//     GOMEMLIMIT from the container's memory, an administrator's settings kept;
//   - MONGO_URL_FILE (#5724), WEKAN_DB and the .ferretdb-default marker;
//   - #6458's cpu-exec decision: qemu-user only when a declared feature is
//     missing;
//   - #6492's requested restore and rotating backup;
//   - FerretDB started with sqlite-recovery.mjs run by THIS node: the shell
//     entrypoint ran /build/node, which the image never had, so every FerretDB
//     start of the image stopped with status 127;
//   - WeKan started from main.js with that environment, its exit status
//     passed on, and FerretDB stopped with it.
//
// Negative: the image runs no shell at all - no RUN after the runtime FROM, no
// bash or sh in CMD, nothing in the entrypoint spawns one.
// Run: node --test tests/dockerEntrypoint.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(ROOT, 'releases/ferretdb/wekan-entrypoint.mjs');
const load = () => import(pathToFileURL(ENTRY).href);
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('GODEBUG: MPTCP off when unset, appended to a setting, an operator\'s choice kept', async () => {
  const { godebugWithoutMptcp } = await load();
  assert.equal(godebugWithoutMptcp(undefined), 'multipathtcp=0');
  assert.equal(godebugWithoutMptcp(''), 'multipathtcp=0');
  assert.equal(godebugWithoutMptcp('gctrace=1'), 'gctrace=1,multipathtcp=0');
  assert.equal(godebugWithoutMptcp('multipathtcp=1'), 'multipathtcp=1');
  assert.equal(godebugWithoutMptcp('x=1,multipathtcp=2'), 'x=1,multipathtcp=2');
});

test('DDP_TRANSPORT: uws is coerced to sockjs, loudly; sockjs is the default', async () => {
  const { ddpTransport } = await load();
  const said = [];
  assert.equal(ddpTransport('uws', m => said.push(m)), 'sockjs');
  assert.match(said[0], /uws is not available in this build/);
  assert.equal(ddpTransport(undefined), 'sockjs');
  assert.equal(ddpTransport('sockjs'), 'sockjs');
});

test('#6606: three fifths of the container to V8, capped at 4 GiB; a fifth to Go, capped at 1 GiB', async () => {
  const { memoryLimits, memoryBytes } = await load();
  assert.deepEqual(memoryLimits(1024 * 1024 * 1024), { heapMb: 614, goMb: 204 });
  assert.deepEqual(memoryLimits(64 * 1024 ** 3), { heapMb: 4096, goMb: 1024 });
  // No fixed floor: a 256 MiB container gets 153 MiB, not more than it has.
  assert.equal(memoryLimits(256 * 1024 * 1024).heapMb, 153);
  // cgroup v2, then v1, then MemTotal; "max" is no limit.
  const files = { '/sys/fs/cgroup/memory.max': '536870912\n' };
  const reader = f => { if (f in files) return files[f]; throw new Error('ENOENT'); };
  assert.equal(memoryBytes(reader), 536870912);
  files['/sys/fs/cgroup/memory.max'] = 'max\n';
  files['/proc/meminfo'] = 'MemTotal:        4194304 kB\n';
  assert.equal(memoryBytes(reader), 4194304 * 1024);
  delete files['/sys/fs/cgroup/memory.max'];
  files['/sys/fs/cgroup/memory/memory.limit_in_bytes'] = '1073741824';
  assert.equal(memoryBytes(reader), 1073741824);
  assert.equal(memoryBytes(() => { throw new Error('ENOENT'); }), 2097152 * 1024, 'nothing readable: 2 GiB');
});

test('#5724 MONGO_URL_FILE: read without its trailing newline; MONGO_URL wins; unreadable or empty stops', async () => {
  const { mongoUrlFromFile } = await load();
  const files = { '/run/secrets/mongo': 'mongodb://wekan:hunter2@db:27017/wekan\n', '/empty': '\n' };
  const reader = f => { if (f in files) return files[f]; throw new Error('EACCES'); };
  assert.equal(mongoUrlFromFile({ MONGO_URL_FILE: '/run/secrets/mongo' }, reader), 'mongodb://wekan:hunter2@db:27017/wekan');
  assert.equal(mongoUrlFromFile({ MONGO_URL: 'mongodb://a/b', MONGO_URL_FILE: '/run/secrets/mongo' }, reader), 'mongodb://a/b');
  assert.throws(() => mongoUrlFromFile({ MONGO_URL_FILE: '/nope' }, reader), /MONGO_URL_FILE=\/nope cannot be read/);
  assert.throws(() => mongoUrlFromFile({ MONGO_URL_FILE: '/empty' }, reader), /MONGO_URL_FILE=\/empty is empty/);
});

test('WEKAN_DB and the .ferretdb-default marker choose the backend; anything else is refused', async () => {
  const { wantFerret, sqliteDir } = await load();
  assert.equal(wantFerret({ WEKAN_DB: 'ferretdb', MONGO_URL: 'x' }, false), true);
  assert.equal(wantFerret({ WEKAN_DB: 'mongodb' }, true), false);
  assert.equal(wantFerret({}, true), true, 'a MongoDB-less arch with no MONGO_URL');
  assert.equal(wantFerret({ MONGO_URL: 'mongodb://db/wekan' }, true), false);
  assert.equal(wantFerret({}, false), false);
  assert.throws(() => wantFerret({ WEKAN_DB: 'postgres' }, false), /WEKAN_DB must be 'mongodb' or 'ferretdb' \(got 'postgres'\)/);
  assert.equal(sqliteDir({}), '/data/files/db');
  assert.equal(sqliteDir({ WRITABLE_PATH: '/srv/files' }), '/srv/files/db');
  assert.equal(sqliteDir({ WRITABLE_PATH: '/srv' }), '/srv/files/db');
  assert.equal(sqliteDir({ FERRETDB_SQLITE_DIR: '/x' }), '/x');
});

test('#6458 cpu-exec: qemu-user only for a declared feature the CPU lacks', async () => {
  const { cpuExecPlan } = await load();
  const cpuinfo = 'processor\t: 0\nflags\t\t: fpu sse sse2 avx2\n';
  const quiet = () => {};
  assert.deepEqual(cpuExecPlan('/build/ferretdb', ['--x'], { spec: '', machine: 'x86_64', cpuinfo, qemuCandidates: ['/build/qemu-x86_64'], log: quiet }),
    ['/build/ferretdb', ['--x']], 'nothing declared: a plain start');
  assert.deepEqual(cpuExecPlan('/build/ferretdb', ['--x'], { spec: 'x86_64=avx2', machine: 'x86_64', cpuinfo, qemuCandidates: ['/build/qemu-x86_64'], log: quiet }),
    ['/build/ferretdb', ['--x']], 'the CPU has it');
  assert.deepEqual(cpuExecPlan('/build/ferretdb', ['--x'], { spec: 'aarch64=atomics', machine: 'x86_64', cpuinfo, qemuCandidates: ['/q'], log: quiet }),
    ['/build/ferretdb', ['--x']], 'another architecture\'s entry is not this one\'s');
  const said = [];
  assert.deepEqual(cpuExecPlan('/build/ferretdb', ['--x'], { spec: 'x86_64=avx512f', machine: 'x86_64', cpuinfo, qemuCandidates: ['/build/qemu-x86_64'], log: m => said.push(m), name: 'FerretDB' }),
    ['/build/qemu-x86_64', ['/build/ferretdb', '--x']]);
  assert.match(said[0], /lacks a feature that WEKAN_REQUIRED_CPU_FEATURES requires on x86_64; running FerretDB through qemu-user/);
  // Negative (CodeQL js/clear-text-logging): nothing read from the
  // environment - the feature list, a path, the qemu found - is logged.
  assert.doesNotMatch(said.join('\n'), /avx512f|\/build\//);
  // "avx" is not found inside "avx2": a whole word.
  assert.deepEqual(cpuExecPlan('/n', [], { spec: 'x86_64=avx', machine: 'x86_64', cpuinfo, qemuCandidates: ['/q'], log: quiet }), ['/q', ['/n']]);
  // ARM lists them on "Features" lines.
  assert.deepEqual(cpuExecPlan('/n', [], { spec: 'aarch64=atomics', machine: 'aarch64', cpuinfo: 'Features\t: fp asimd atomics\n', qemuCandidates: ['/q'], log: quiet }), ['/n', []]);
  // No qemu: run it directly, and say what will happen.
  said.length = 0;
  assert.deepEqual(cpuExecPlan('/n', [], { spec: 'x86_64=avx512f', machine: 'x86_64', cpuinfo, qemuCandidates: [], log: m => said.push(m) }), ['/n', []]);
  assert.match(said.join('\n'), /expect SIGILL/);
  assert.doesNotMatch(said.join('\n'), /avx512f|\/n\b/, 'negative: no feature list or path in it either');
});

test('negative: the entrypoint logs no value taken from the environment (CodeQL js/clear-text-logging)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'releases', 'ferretdb', 'wekan-entrypoint.mjs'), 'utf8');
  // What a log or warn line may interpolate: counts, the port, the listen
  // address, a child's exit, the CPU architecture and the caller's own name
  // for a program. A path, the CPU feature list or a qemu path is not on it.
  const allowed = new Set(['heapMb', 'rc', 'listen', 'grace', 'max', 'e.message', 'signal || code', 'machine', 'name',
    "first.stderr || 'no reason given'", "env.PORT || '8080'", 'from', 'ferretBin']);
  const found = [];
  for (const m of src.matchAll(/\b(?:log|warn)\(`([^`]*)`/g)) {
    for (const v of m[1].matchAll(/\$\{([^}]*)\}/g)) if (!allowed.has(v[1].trim())) found.push(v[1]);
  }
  assert.deepEqual(found, [], 'a log line interpolates something not on the list');
  assert.doesNotMatch(src, /\b(?:log|warn)\(`[^`]*\$\{(?:source|backup|binary|qemu|missing[^}]*)\}/, 'the six CodeQL found are gone');
});

function tmp() { return fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'entry-')); }

test('#6492 requested restore: from backup, prev and continuous; remigrate; a missing source keeps the request', async () => {
  const { requestedRestore } = await load();
  const quiet = () => {};
  const dir = tmp();
  try {
    fs.mkdirSync(path.join(dir, 'backup/prev'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'wekan.sqlite'), 'live');
    fs.writeFileSync(path.join(dir, 'wekan.sqlite-wal'), 'stale wal');
    fs.writeFileSync(path.join(dir, 'backup/wekan.sqlite'), 'good');
    fs.writeFileSync(path.join(dir, 'backup/prev/wekan.sqlite'), 'older');
    fs.writeFileSync(path.join(dir, 'RESTORE_REQUESTED'), 'backup\nignored\n');
    assert.equal(requestedRestore(dir, {}, quiet, quiet), 'restored');
    assert.equal(fs.readFileSync(path.join(dir, 'wekan.sqlite'), 'utf8'), 'good');
    assert.ok(!fs.existsSync(path.join(dir, 'wekan.sqlite-wal')), 'the stale WAL is dropped');
    assert.ok(!fs.existsSync(path.join(dir, 'RESTORE_REQUESTED')));
    assert.ok(fs.existsSync(path.join(dir, 'backup/wekan.sqlite')), 'the backup is never removed');
    assert.equal(fs.readFileSync(path.join(dir, 'RECOVERY_IN_PROGRESS'), 'utf8'), 'recovery backup\n');
    const events = fs.readFileSync(path.join(dir, 'recovery-events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(events[0].type, 'restore-backup');
    assert.match(events[0].ts, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    assert.equal(requestedRestore(dir, { WEKAN_FORCE_RESTORE: 'prev' }, quiet, quiet), 'restored');
    assert.equal(fs.readFileSync(path.join(dir, 'wekan.sqlite'), 'utf8'), 'older');
    // continuous: the live database is kept first, beside the staged copy.
    fs.mkdirSync(path.join(dir, 'continuous-restore'));
    fs.writeFileSync(path.join(dir, 'continuous-restore/wekan.sqlite'), 'rebuilt');
    assert.equal(requestedRestore(dir, { WEKAN_FORCE_RESTORE: 'continuous' }, quiet, quiet), 'restored');
    assert.equal(fs.readFileSync(path.join(dir, 'wekan.sqlite'), 'utf8'), 'rebuilt');
    assert.equal(fs.readFileSync(path.join(dir, 'continuous-restore/replaced/wekan.sqlite'), 'utf8'), 'older');
    // The marker's first line, letters only.
    fs.writeFileSync(path.join(dir, 'RESTORE_REQUESTED'), 're-migrate!\n');
    assert.equal(requestedRestore(dir, {}, quiet, quiet), 'remigrate');
    // Negative: nothing to restore from keeps the request for a retry.
    fs.rmSync(path.join(dir, 'backup/prev'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'RESTORE_REQUESTED'), 'prev\n');
    assert.equal(requestedRestore(dir, {}, quiet, quiet), 'missing');
    assert.ok(fs.existsSync(path.join(dir, 'RESTORE_REQUESTED')));
    assert.equal(fs.readFileSync(path.join(dir, 'wekan.sqlite'), 'utf8'), 'rebuilt', 'the live database is untouched');
    assert.equal(requestedRestore(path.join(dir, 'none'), {}, quiet, quiet), null, 'no request, nothing done');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('#6492 rotating backup: the previous copy to prev, the live one copied, never moved', async () => {
  const { rotatingBackup } = await load();
  const quiet = () => {};
  const dir = tmp();
  try {
    assert.equal(rotatingBackup(dir, quiet, quiet), null, 'no database yet');
    fs.writeFileSync(path.join(dir, 'wekan.sqlite'), 'one');
    assert.equal(rotatingBackup(dir, quiet, quiet), true);
    fs.writeFileSync(path.join(dir, 'wekan.sqlite'), 'two');
    assert.equal(rotatingBackup(dir, quiet, quiet), true);
    assert.equal(fs.readFileSync(path.join(dir, 'backup/wekan.sqlite'), 'utf8'), 'two');
    assert.equal(fs.readFileSync(path.join(dir, 'backup/prev/wekan.sqlite'), 'utf8'), 'one');
    assert.equal(fs.readFileSync(path.join(dir, 'wekan.sqlite'), 'utf8'), 'two');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// A bundle directory with stand-in ferretdb, main.js and sqlite-recovery.mjs,
// each of them recording what it was started with.
function bundle({ marker = false, recovery = true, mainExit = 0 } = {}) {
  const dir = tmp();
  fs.copyFileSync(ENTRY, path.join(dir, 'wekan-entrypoint.mjs'));
  const record = name => `require('fs').writeFileSync(require('path').join(__dirname, '${name}.json'), JSON.stringify({ argv: process.argv.slice(2), env: process.env, cwd: process.cwd() }));`;
  fs.writeFileSync(path.join(dir, 'main.js'), `${record('main')}\nsetTimeout(() => process.exit(${mainExit}), 300);\n`);
  fs.writeFileSync(path.join(dir, 'ferretdb'), `#!${process.execPath}\n${record('ferretdb')}\nprocess.on('SIGTERM', () => { require('fs').writeFileSync(require('path').join(__dirname, 'ferretdb.stopped'), ''); process.exit(0); });\nsetInterval(() => {}, 1000);\n`, { mode: 0o755 });
  if (recovery) fs.writeFileSync(path.join(dir, 'sqlite-recovery.mjs'), `import fs from 'node:fs'; fs.writeFileSync(new URL('./recovery.json', import.meta.url), JSON.stringify(process.argv.slice(2)));\n`);
  if (marker) fs.writeFileSync(path.join(dir, '.ferretdb-default'), '');
  return dir;
}

function start(dir, env) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(dir, 'wekan-entrypoint.mjs')], {
      env: { PATH: process.env.PATH, WEKAN_DB_WAIT_PAGE: 'false', ...env }, cwd: dir,
    });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('exit', status => resolve({ status, out }));
  });
}
const json = (dir, name) => JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));

test('the whole start with FerretDB: recovery by this node, FerretDB, then WeKan; WeKan\'s status passed on and FerretDB stopped', async () => {
  const dir = bundle({ marker: true, mainExit: 3 });
  const data = path.join(dir, 'data');
  try {
    const r = await start(dir, { WRITABLE_PATH: data, MONGO_OPLOG_URL: 'mongodb://x/local' });
    assert.equal(r.status, 3, r.out);
    // sqlite-recovery.mjs ran, and ran with THIS node (the image has no /build/node).
    assert.deepEqual(json(dir, 'recovery'), ['startup', path.join(data, 'files/db'), path.join(dir, 'ferretdb')]);
    const db = json(dir, 'ferretdb');
    assert.deepEqual(db.argv, ['--handler=sqlite', `--sqlite-url=file:${data}/files/db/`, '--listen-addr=127.0.0.1:27017', '--telemetry=disable', '--log-level=error']);
    assert.equal(db.env.GODEBUG, 'multipathtcp=0');
    assert.match(db.env.GOMEMLIMIT, /^\d+MiB$/);
    const main = json(dir, 'main');
    assert.equal(main.env.MONGO_URL, 'mongodb://127.0.0.1:27017/wekan');
    assert.equal(main.env.MONGO_OPLOG_URL, undefined, 'FerretDB v1 SQLite polls: no oplog');
    assert.equal(main.env.METEOR_REACTIVITY_ORDER, 'polling');
    assert.equal(main.env.DDP_TRANSPORT, 'sockjs');
    assert.match(main.env.NODE_OPTIONS, /^--max-old-space-size=\d+$/);
    assert.equal(main.cwd, fs.realpathSync(dir));
    assert.ok(fs.existsSync(path.join(dir, 'ferretdb.stopped')), 'FerretDB is stopped when WeKan exits');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('an external MongoDB: no FerretDB, the administrator\'s NODE_OPTIONS and GOMEMLIMIT unchanged', async () => {
  const dir = bundle({ marker: true });
  try {
    const r = await start(dir, { MONGO_URL: 'mongodb://db:27017/wekan', NODE_OPTIONS: '--max-old-space-size=900', GOMEMLIMIT: '77MiB', DDP_TRANSPORT: 'uws' });
    assert.equal(r.status, 0, r.out);
    assert.ok(!fs.existsSync(path.join(dir, 'ferretdb.json')), 'MONGO_URL set: the marker does not start FerretDB');
    const main = json(dir, 'main');
    assert.equal(main.env.NODE_OPTIONS, '--max-old-space-size=900');
    assert.equal(main.env.GOMEMLIMIT, '77MiB');
    assert.equal(main.env.DDP_TRANSPORT, 'sockjs');
    assert.match(r.out, /uws is not available/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('negative: a failed recovery, a missing FerretDB, a bad WEKAN_DB and an unreadable MONGO_URL_FILE stop before WeKan', async () => {
  const failing = bundle({});
  try {
    fs.writeFileSync(path.join(failing, 'sqlite-recovery.mjs'), 'process.exit(5);\n');
    const r = await start(failing, { WEKAN_DB: 'ferretdb', WRITABLE_PATH: path.join(failing, 'data') });
    assert.equal(r.status, 5);
    assert.match(r.out, /Recovery could not produce a verified SQLite database \(status 5\)/);
    assert.ok(!fs.existsSync(path.join(failing, 'main.json')));
    assert.ok(!fs.existsSync(path.join(failing, 'ferretdb.json')));
    fs.rmSync(path.join(failing, 'ferretdb'));
    const missing = await start(failing, { WEKAN_DB: 'ferretdb' });
    assert.equal(missing.status, 1);
    assert.match(missing.out, /FerretDB requested but .*ferretdb is missing\/not executable/);
    const bad = await start(failing, { WEKAN_DB: 'sqlite' });
    assert.equal(bad.status, 1);
    assert.match(bad.out, /WEKAN_DB must be/);
    const file = await start(failing, { MONGO_URL_FILE: path.join(failing, 'nope') });
    assert.equal(file.status, 1);
    assert.match(file.out, /cannot be read/);
    assert.ok(!fs.existsSync(path.join(failing, 'main.json')));
  } finally { fs.rmSync(failing, { recursive: true, force: true }); }
});

test('#6595 for real: the waiting page holds the port until the database answers, and is gone before WeKan starts', async () => {
  const dir = bundle({});
  try {
    // The probe: "not answering" with a reason twice, then "answering".
    fs.writeFileSync(path.join(dir, 'db-ready.mjs'), `import fs from 'node:fs';
const f = new URL('./probes', import.meta.url);
const n = (fs.existsSync(f) ? Number(fs.readFileSync(f, 'utf8')) : 0) + 1;
fs.writeFileSync(f, String(n));
if (n < 3) { console.error('db-ready: MongoServerSelectionError: connect ECONNREFUSED db:27017'); process.exit(1); }
`);
    fs.writeFileSync(path.join(dir, 'recovery-bridge.mjs'), `import fs from 'node:fs';
fs.writeFileSync(new URL('./bridge.json', import.meta.url), JSON.stringify({ reason: process.env.WEKAN_BRIDGE_REASON, detail: process.env.WEKAN_BRIDGE_DETAIL, port: process.env.PORT }));
process.on('SIGTERM', () => { fs.writeFileSync(new URL('./bridge.stopped', import.meta.url), ''); process.exit(0); });
setInterval(() => {}, 1000);
`);
    fs.writeFileSync(path.join(dir, 'main.js'), "require('fs').writeFileSync(require('path').join(__dirname, 'main.json'), JSON.stringify({ bridgeStopped: require('fs').existsSync(require('path').join(__dirname, 'bridge.stopped')) }));\n");
    const r = await start(dir, { MONGO_URL: 'mongodb://db:27017/wekan', WEKAN_DB_WAIT_PAGE: 'true', PORT: '8123' });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(json(dir, 'bridge'), { reason: 'database', detail: 'db-ready: MongoServerSelectionError: connect ECONNREFUSED db:27017', port: '8123' });
    assert.equal(json(dir, 'main').bridgeStopped, true, 'the page let go of the port first');
    assert.match(r.out, /The database is answering; starting WeKan\./);
    // "Could not ask" (2) is no evidence of a problem: no page at all.
    for (const f of ['bridge.json', 'bridge.stopped', 'probes', 'main.json']) fs.rmSync(path.join(dir, f), { force: true });
    fs.writeFileSync(path.join(dir, 'db-ready.mjs'), "console.error('no driver'); process.exit(2);\n");
    const two = await start(dir, { MONGO_URL: 'mongodb://db:27017/wekan', WEKAN_DB_WAIT_PAGE: 'true' });
    assert.equal(two.status, 0, two.out);
    assert.ok(!fs.existsSync(path.join(dir, 'bridge.json')));
    assert.match(two.out, /Cannot check whether the database is answering \(no driver\)/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('negative: nothing in the image needs a shell', () => {
  const docker = read('Dockerfile');
  const final = docker.slice(docker.lastIndexOf('\nFROM '));
  assert.match(final, /^\nFROM runtime-\$\{TARGETARCH\}/);
  assert.doesNotMatch(final, /^RUN\b/m, 'no RUN after the runtime FROM: there is no shell to run it');
  assert.match(final, /^CMD \["\/usr\/local\/bin\/node", "\/build\/wekan-entrypoint\.mjs"\]$/m);
  assert.doesNotMatch(final, /\b(bash|\/bin\/sh)\b/);
  assert.match(docker, /^FROM gcr\.io\/distroless\/base-nossl-debian13:nonroot AS distroless$/m);
  // The C++ runtime node needs comes from Debian; libssl and libgomp, which
  // nothing loads (node links OpenSSL statically), are not in the image.
  assert.match(docker, /^unpack \/extra gcc-14-base libgcc-s1 libstdc\+\+6 libatomic1$/m);
  assert.doesNotMatch(docker.split('\n').filter(l => !/^\s*#/.test(l)).join('\n'), /libssl|libgomp|cc-debian13/);
  // The 386 root, which distroless does not publish, is assembled from Debian with dpkg records.
  assert.match(docker, /^FROM scratch AS runtime-386$/m);
  assert.match(docker, /dpkg-query --status "\$pkg" > "\$dest\/var\/lib\/dpkg\/status\.d\/\$pkg"/);
  // The wekan user keeps uid and gid 999: existing volumes and the Helm chart's chown.
  assert.match(docker, /^wekan:x:999:999:WeKan:\/home\/wekan:\/sbin\/nologin$/m);
  assert.match(docker, /^COPY --from=bundle --chown=999:999 \/owned\/data \/data$/m);
  // The MongoDB tool launchers are #!/bin/sh: each becomes a symlink to
  // mongo-tools, which picks the tool by the name it is run as. Found by the
  // line fetch-mongo-tools.sh writes into every launcher.
  assert.match(docker, /for launcher in \$\(grep -l 'mongo-tools beside this file' bundle\/\* 2>\/dev\/null\); do\n  ln -sf mongo-tools "\$launcher"\ndone/);
  assert.match(read('releases/fetch-mongo-tools.sh'), /# mongo-tools beside this file \(wekan\/mongo-tools-patches\)\./);
  // cpu-exec is bash: not shipped, its decision made by the entrypoint.
  assert.match(docker, /rm -f bundle\/start-wekan\.sh bundle\/start-wekan\.bat bundle\/cpu-exec/);
  const entry = fs.readFileSync(ENTRY, 'utf8').split('\n').filter(line => !/^\s*\/\//.test(line)).join('\n');
  assert.doesNotMatch(entry, /spawn(Sync)?\(\s*['"](bash|sh|\/bin\/sh|cp|rm|cat|head|date|sleep|kill)['"]/);
  assert.doesNotMatch(entry, /\/build\/node\b(?!_modules)/, 'node is process.execPath, never /build/node');
  assert.ok(!fs.existsSync(path.join(ROOT, 'releases/ferretdb/wekan-entrypoint.sh')), 'the shell entrypoint is gone');
});
