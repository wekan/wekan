'use strict';

// Single-file WeKan (docs/Platforms/Single-File.md, releases/single-file/):
// one executable per platform, Node.js with WeKan and FerretDB inside it as a
// virtual file system, its data in wekan-files beside it, and a menu.
//
// Pure parts are tested as functions. The whole thing is then tested for real
// on this machine: a single executable is BUILT from a small stand-in bundle
// with this Node.js, started, asked for its status and version, driven
// through its menu, and stopped. The browser test against a real WeKan
// bundle is tests/playwright/specs/single-file.e2e.js.
//
// Run: node tests/singleFile.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const SF = path.join(ROOT, 'releases', 'single-file');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const lib = name => require(path.join(SF, 'lib', name));
const TMP_ROOT = path.join(ROOT, '.tools', 'tmp');
fs.mkdirSync(TMP_ROOT, { recursive: true });
const tmp = prefix => fs.mkdtempSync(path.join(TMP_ROOT, prefix));

const { isFilesRoot } = require(path.join(ROOT, 'models', 'lib', 'filesRoot.js'));
const { layout } = lib('paths.cjs');
const config = lib('config.cjs');
const { requestedRestore } = lib('restore.cjs');
const ferret = lib('ferretdb.cjs');
const backup = lib('backup.cjs');
const releases = lib('releases.cjs');
const autostart = lib('autostart.cjs');
const info = lib('info.cjs');
const { installVirtualCwd } = lib('server.cjs');

// node:vfs and --build-sea arrived in Node.js 26.11. An older Node.js running
// this suite skips the parts that need them, and says so.
const HAS_VFS = spawnSync(process.execPath, ['--no-warnings', '--experimental-vfs', '-e', "require('node:vfs')"]).status === 0;
// And a Node.js can be compiled without single executable applications (the
// Homebrew one on macOS is): it says so for any --build-sea, as build.mjs's
// seaSupported() asks it.
const HAS_SEA = !/Single executable application is disabled/.test(
  spawnSync(process.execPath, ['--build-sea', path.join(__dirname, 'no-such-sea-config.json')], { encoding: 'utf8' }).stderr || '');

// --- where files go --------------------------------------------------------

test('WRITABLE_PATH: "files" keeps its old rule exactly, "wekan-files" is a files root too', () => {
  for (const p of ['/snap/wekan/common/files', 'C:\\w\\files', '/x/wekan-files', 'C:\\x\\wekan-files', 'wekan-files']) {
    assert.equal(isFilesRoot(p), true, p);
  }
  // Negative: none of these may change where an existing install's files are.
  for (const p of ['/data', '/srv/my-files', '/data/files/', 'files', '/x/wekan-files/', '/wekan-filesx', '', undefined]) {
    assert.equal(isFilesRoot(p), false, String(p));
  }
});

test('every place that derives the files root asks filesRoot.js (negative: no copy of the old check left)', () => {
  const offenders = [];
  const walk = rel => {
    for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) {
        if (!['tests', 'node_modules'].includes(e.name)) walk(r);
      } else if (/\.(js|cjs|mjs)$/.test(e.name) && r !== 'models/lib/filesRoot.js') {
        const src = fs.readFileSync(path.join(ROOT, r), 'utf8');
        if (/endsWith\(['"]\/files['"]\)/.test(src)) offenders.push(r);
      }
    }
  };
  for (const dir of ['server', 'models', 'imports', 'client', 'config']) {
    if (fs.existsSync(path.join(ROOT, dir))) walk(dir);
  }
  assert.deepEqual(offenders, []);
});

test('the layout: wekan-files beside the executable, every part inside it, on POSIX and Windows', () => {
  const l = layout({ exePath: '/opt/wekan/wekan-12.40-amd64-single-file', env: {}, pathImpl: path.posix });
  assert.equal(l.writable, '/opt/wekan/wekan-files');
  assert.equal(l.files, '/opt/wekan/wekan-files');
  assert.equal(l.attachments, '/opt/wekan/wekan-files/attachments');
  assert.equal(l.db, '/opt/wekan/wekan-files/db');
  assert.equal(l.bin, '/opt/wekan/wekan-files/bin');
  assert.equal(l.backup, '/opt/wekan/wekan-files/backup');
  assert.equal(l.envFile, '/opt/wekan/wekan-files/wekan.env');
  const w = layout({ exePath: 'C:\\Users\\a\\WeKan\\wekan.exe', env: {}, pathImpl: path.win32 });
  assert.equal(w.files, 'C:\\Users\\a\\WeKan\\wekan-files');
  assert.equal(w.avatars, 'C:\\Users\\a\\WeKan\\wekan-files\\avatars');
  // An explicit WRITABLE_PATH wins; one that is not a files root gets /files,
  // as everywhere else in WeKan.
  assert.equal(layout({ exePath: '/opt/w/x', env: { WRITABLE_PATH: '/data' }, pathImpl: path.posix }).files, '/data/files');
  assert.equal(layout({ exePath: '/opt/w/x', env: { WRITABLE_PATH: '/srv/wekan-files' }, pathImpl: path.posix }).db, '/srv/wekan-files/db');
});

// --- the environment, as start-wekan.sh -------------------------------------

test('wekan.env: KEY=VALUE, comments and quotes; setting a value keeps every other line', () => {
  assert.deepEqual(config.parseEnvFile('# c\nPORT=3000\nexport ROOT_URL="https://w.example"\nBAD LINE\nMAIL_FROM=\'a b\'\n'),
    { PORT: '3000', ROOT_URL: 'https://w.example', MAIL_FROM: 'a b' });
  const text = '# keep\nPORT=1\nOTHER=x\n';
  assert.equal(config.setEnvValue(text, 'PORT', '2'), '# keep\nPORT=2\nOTHER=x\n');
  assert.equal(config.setEnvValue(text, 'NEW', 'y'), '# keep\nPORT=1\nOTHER=x\nNEW=y\n');
  assert.deepEqual(config.parseEnvFile(config.ENV_TEMPLATE), {}, 'the template sets nothing by itself');
  // CodeQL #574: the key used to be spliced into a RegExp. Only a variable
  // name is a setting, it is compared literally, and a value is one line.
  for (const bad of ['.*', 'PORT|X', '(a+)+$', 'A B', '', '1PORT', 'PORT\nX']) {
    assert.throws(() => config.setEnvValue(text, bad, '1'), /Not a setting name/, JSON.stringify(bad));
  }
  assert.throws(() => config.setEnvValue(text, 'PORT', '1\nMAIL_URL=smtp://evil'), /one line/);
  assert.equal(config.setEnvValue('PORTS=1\nPORT=1\n', 'PORT', '2'), 'PORTS=1\nPORT=2\n', 'a key is matched whole');
});

test('the memory budget is start-wekan.sh\'s: 3/5 for Node up to 4 GiB (1 GiB on 32-bit), 1/5 for Go up to 1 GiB', () => {
  assert.deepEqual(config.memoryBudget({ totalMb: 30787 }), { memoryMb: 30787, heapMb: 4096, goMb: 1024 });
  assert.deepEqual(config.memoryBudget({ totalMb: 2048 }), { memoryMb: 2048, heapMb: 1228, goMb: 409 });
  assert.equal(config.memoryBudget({ totalMb: 8192, bits: 32 }).heapMb, 1024);
  assert.equal(config.memoryBudget({ totalMb: 16384, cgroupMb: 1024 }).memoryMb, 1024, 'a lower cgroup limit wins');
  assert.equal(config.memoryBudget({ totalMb: 1024, cgroupMb: 4096 }).memoryMb, 1024, 'a higher one does not');
  const sh = read('releases/ferretdb/start-wekan.sh');
  assert.match(sh, /_heap_mb=\$\(\(_memory_mb\*3\/5\)\); \[ "\$_heap_mb" -gt 4096 \]/);
  assert.match(sh, /_go_mb=\$\(\(_memory_mb\/5\)\); \[ "\$_go_mb" -gt 1024 \]/);
});

test('the environment: start-wekan.sh\'s defaults, wekan.env over them, the real environment over both', () => {
  const l = layout({ exePath: '/opt/w/wekan', env: {}, pathImpl: path.posix });
  const cfg = config.buildEnv({ base: { WEKAN_SINGLE_FILE_ROLE: 'server' }, file: {}, layout: l, version: '12.40', target: 'amd64', totalMb: 4096, cgroupMb: 0, bits: 64 });
  assert.equal(cfg.env.PORT, '8080');
  assert.equal(cfg.env.ROOT_URL, 'http://localhost:8080');
  assert.equal(cfg.env.MONGO_URL, 'mongodb://127.0.0.1:27017/wekan');
  assert.equal(cfg.env.WITH_API, 'true', 'exports need the API');
  assert.equal(cfg.env.CARDS_LOADING, 'auto');
  assert.equal(cfg.env.WRITABLE_PATH, '/opt/w/wekan-files');
  assert.equal(cfg.env.WEKAN_PACKAGING, 'single-file', 'Admin Panel / Version names it');
  assert.equal(cfg.env.METEOR_REACTIVITY_ORDER, 'polling');
  assert.equal(cfg.env.METEOR_POLLING_INTERVAL_MS, '30000');
  assert.equal(cfg.env.FERRETDB_TELEMETRY, 'disable');
  assert.equal(cfg.useFerret, true);
  assert.equal('WEKAN_SINGLE_FILE_ROLE' in cfg.env, false, 'the role switch never leaks into what is started');
  // Precedence.
  const mine = config.buildEnv({ base: { PORT: '9000' }, file: { PORT: '3000', ROOT_URL: 'https://b.example' }, layout: l, totalMb: 4096 });
  assert.equal(mine.env.PORT, '9000');
  assert.equal(mine.env.ROOT_URL, 'https://b.example');
  // An external database: no FerretDB, no forced polling.
  const ext = config.buildEnv({ base: { MONGO_URL: 'mongodb://db.example/wekan' }, layout: l, totalMb: 4096 });
  assert.equal(ext.useFerret, false);
  assert.equal(ext.env.METEOR_REACTIVITY_ORDER, undefined);
  assert.equal(config.buildEnv({ base: { WEKAN_DB: 'mongodb' }, layout: l, totalMb: 4096 }).useFerret, false);
  // uws is coerced, loudly, as start-wekan.sh does.
  const uws = config.buildEnv({ base: { DDP_TRANSPORT: 'uws' }, layout: l, totalMb: 4096 });
  assert.equal(uws.env.DDP_TRANSPORT, 'sockjs');
  assert.match(uws.notes[0], /uws is not available/);
  // Negative: an unknown database is refused, not guessed at.
  assert.throws(() => config.buildEnv({ base: { WEKAN_DB: 'postgres' }, layout: l, totalMb: 4096 }), /WEKAN_DB must be/);
  const sh = read('releases/ferretdb/start-wekan.sh');
  for (const same of ['PORT="${PORT:-8080}"', 'WITH_API="${WITH_API:-true}"', 'CARDS_LOADING="${CARDS_LOADING:-auto}"',
    'FERRETDB_LISTEN_ADDR="${FERRETDB_LISTEN_ADDR:-127.0.0.1:27017}"', 'METEOR_POLLING_THROTTLE_MS:-2000', 'METEOR_POLLING_INTERVAL_MS:-30000']) {
    assert.ok(sh.includes(same), `start-wekan.sh still says ${same}`);
  }
});

// --- requested restore, as start-wekan.sh -----------------------------------

test('a requested restore copies the backup in, drops the side-files and clears the request', () => {
  const dir = tmp('sf-restore-');
  try {
    const db = path.join(dir, 'db');
    fs.mkdirSync(path.join(db, 'backup'), { recursive: true });
    fs.writeFileSync(path.join(db, 'wekan.sqlite'), 'broken');
    fs.writeFileSync(path.join(db, 'wekan.sqlite-wal'), 'stale wal');
    fs.writeFileSync(path.join(db, 'backup', 'wekan.sqlite'), 'good');
    fs.writeFileSync(path.join(db, 'RESTORE_REQUESTED'), 'backup\n');
    const r = requestedRestore({ dbDir: db, env: {} });
    assert.deepEqual(r, { mode: 'backup', result: 'restored' });
    assert.equal(fs.readFileSync(path.join(db, 'wekan.sqlite'), 'utf8'), 'good');
    assert.equal(fs.existsSync(path.join(db, 'wekan.sqlite-wal')), false);
    assert.equal(fs.existsSync(path.join(db, 'RESTORE_REQUESTED')), false);
    assert.equal(fs.readFileSync(path.join(db, 'backup', 'wekan.sqlite'), 'utf8'), 'good', 'the backup is never removed');
    assert.match(fs.readFileSync(path.join(db, 'recovery-events.jsonl'), 'utf8'), /"type":"restore-backup"/);
    assert.equal(requestedRestore({ dbDir: db, env: {} }), null, 'nothing requested: nothing done');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a restore from a missing source keeps the request and the live database (negative)', () => {
  const dir = tmp('sf-restore-');
  try {
    fs.writeFileSync(path.join(dir, 'wekan.sqlite'), 'live');
    fs.writeFileSync(path.join(dir, 'RESTORE_REQUESTED'), 'prev');
    assert.deepEqual(requestedRestore({ dbDir: dir, env: {} }), { mode: 'prev', result: 'missing' });
    assert.equal(fs.readFileSync(path.join(dir, 'wekan.sqlite'), 'utf8'), 'live');
    assert.ok(fs.existsSync(path.join(dir, 'RESTORE_REQUESTED')), 'retained for retry');
    assert.match(fs.readFileSync(path.join(dir, 'recovery-events.jsonl'), 'utf8'), /"manual-required"/);
    // A continuous restore keeps the database it replaces.
    fs.mkdirSync(path.join(dir, 'continuous-restore'));
    fs.writeFileSync(path.join(dir, 'continuous-restore', 'wekan.sqlite'), 'rolled back');
    assert.deepEqual(requestedRestore({ dbDir: dir, env: { WEKAN_FORCE_RESTORE: 'continuous' } }), { mode: 'continuous', result: 'restored' });
    assert.equal(fs.readFileSync(path.join(dir, 'continuous-restore', 'replaced', 'wekan.sqlite'), 'utf8'), 'live');
    assert.equal(fs.readFileSync(path.join(dir, 'wekan.sqlite'), 'utf8'), 'rolled back');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- FerretDB: the one extracted file ----------------------------------------

test('FerretDB is copied once to wekan-files/bin, verified, reused, and an older copy removed', () => {
  const dir = tmp('sf-ferret-');
  try {
    const app = path.join(dir, 'app');
    fs.mkdirSync(path.join(app, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(app, 'bin', 'ferretdb'), 'ferretdb v1');
    const manifest = { ferretdb: { path: 'bin/ferretdb', sha256: ferret.sha256File(path.join(app, 'bin', 'ferretdb')) } };
    const bin = path.join(dir, 'bin');
    fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin, 'ferretdb-0123456789abcdef'), 'older');
    const first = ferret.ensureFerretdb({ appRoot: app, manifest, binDir: bin, platform: 'linux' });
    assert.equal(path.basename(first), `ferretdb-${manifest.ferretdb.sha256.slice(0, 16)}`);
    assert.equal(fs.readFileSync(first, 'utf8'), 'ferretdb v1');
    assert.deepEqual(fs.readdirSync(bin), [path.basename(first)], 'the older copy is gone');
    const mtime = fs.statSync(first).mtimeMs;
    assert.equal(ferret.ensureFerretdb({ appRoot: app, manifest, binDir: bin, platform: 'linux' }), first);
    assert.equal(fs.statSync(first).mtimeMs, mtime, 'a verified copy is reused, not rewritten');
    // Negative: an archive whose FerretDB does not match its checksum is refused.
    fs.writeFileSync(path.join(app, 'bin', 'ferretdb'), 'tampered');
    fs.rmSync(first);
    assert.throws(() => ferret.ensureFerretdb({ appRoot: app, manifest, binDir: bin, platform: 'linux' }), /does not match its checksum/);
    assert.deepEqual(fs.readdirSync(bin), [], 'nothing unverified is left behind');
    assert.equal(ferret.ferretdbFileName(manifest, 'win32').endsWith('.exe'), true);
    assert.deepEqual(ferret.ferretdbArgs('C:\\w\\wekan-files\\db', '127.0.0.1:27017').slice(0, 3),
      ['--handler=sqlite', '--sqlite-url=file:C:/w/wekan-files/db/', '--listen-addr=127.0.0.1:27017']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- backup -----------------------------------------------------------------

test('a backup is wekan-files/backup/YYYY-MM-DD_HH-MM-SS with the data and nothing else', () => {
  const dir = tmp('sf-backup-');
  try {
    const l = layout({ exePath: path.join(dir, 'wekan'), env: {} });
    for (const d of ['db/backup', 'attachments/a', 'avatars', 'bin', 'logs', 'versions']) fs.mkdirSync(path.join(l.files, d), { recursive: true });
    fs.writeFileSync(path.join(l.db, 'wekan.sqlite'), 'db');
    fs.writeFileSync(path.join(l.db, 'backup', 'wekan.sqlite'), 'snapshot');
    fs.writeFileSync(path.join(l.attachments, 'a', 'file'), 'att');
    fs.writeFileSync(path.join(l.bin, 'ferretdb-x'), 'program');
    fs.writeFileSync(l.envFile, 'PORT=1\n');
    const date = new Date(2026, 9, 13, 9, 5, 7);
    assert.equal(backup.backupName(date), '2026-10-13_09-05-07');
    const { dest, copied } = backup.backupTo(l, { date });
    assert.equal(dest, path.join(l.backup, '2026-10-13_09-05-07'));
    assert.deepEqual(copied, ['db', 'attachments', 'avatars', 'wekan.env']);
    assert.equal(fs.readFileSync(path.join(dest, 'db', 'wekan.sqlite'), 'utf8'), 'db');
    assert.equal(fs.readFileSync(path.join(dest, 'attachments', 'a', 'file'), 'utf8'), 'att');
    // Negative: programs, logs, old versions and recovery's own snapshots are not data.
    assert.equal(fs.existsSync(path.join(dest, 'bin')), false);
    assert.equal(fs.existsSync(path.join(dest, 'versions')), false);
    assert.equal(fs.existsSync(path.join(dest, 'db', 'backup')), false);
    // The same second twice does not mix two backups.
    assert.equal(backup.backupTo(l, { date }).dest, `${dest}-2`);
    assert.deepEqual(backup.listBackups(l), ['2026-10-13_09-05-07-2', '2026-10-13_09-05-07']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- versions ---------------------------------------------------------------

const RELEASES = [
  { tag_name: 'v12.41', draft: true, assets: [{ name: 'wekan-12.41-amd64-single-file', browser_download_url: 'u' }] },
  { tag_name: 'v12.40', published_at: '2026-10-20', assets: [
    { name: 'wekan-12.40-amd64-single-file', browser_download_url: 'https://x/12.40', size: 10 },
    { name: 'wekan-12.40-amd64-single-file.sha256sum', browser_download_url: 'https://x/12.40.sum' },
    { name: 'wekan-12.40-win64-single-file.exe', browser_download_url: 'https://x/w' }] },
  { tag_name: 'v12.39', published_at: '2026-10-13', assets: [{ name: 'wekan-12.39-amd64.zip', browser_download_url: 'z' }] },
  { tag_name: 'v12.100', prerelease: true, assets: [{ name: 'wekan-12.100-amd64-single-file', browser_download_url: 'https://x/p' }] },
];

test('the versions on offer: releases with a single file for THIS platform, newest first', () => {
  const list = releases.releasesFor(RELEASES, 'amd64');
  assert.deepEqual(list.map(r => r.version), ['12.100', '12.40'], 'no draft, no release without the file, 12.100 > 12.40');
  assert.equal(list[0].prerelease, true);
  assert.equal(list[1].shaUrl, 'https://x/12.40.sum');
  assert.deepEqual(releases.releasesFor(RELEASES, 'win64').map(r => r.version), ['12.40']);
  assert.equal(releases.assetName('12.40', 'win64'), 'wekan-12.40-win64-single-file.exe');
  assert.equal(releases.assetName('12.40', 'freebsd-x64'), 'wekan-12.40-freebsd-x64-single-file');
  assert.ok(releases.compareVersions('10.10', '10.9') > 0);
  assert.equal(releases.parseSha256sum(`${'a'.repeat(64)}  file\n`), 'a'.repeat(64));
  assert.equal(releases.parseSha256sum('not a sum'), null);
});

function fakeFetch(map) {
  return async url => {
    if (!(url in map)) return { ok: false, status: 404 };
    const body = Buffer.from(map[url]);
    return {
      ok: true,
      status: 200,
      text: async () => body.toString(),
      json: async () => JSON.parse(body.toString()),
      body: (async function* gen() { yield body.subarray(0, 3); yield body.subarray(3); }()),
    };
  };
}

test('a download is installed only when its checksum matches (negative: a wrong one changes nothing)', async () => {
  const dir = tmp('sf-dl-');
  try {
    const l = layout({ exePath: path.join(dir, 'wekan'), env: {} });
    const crypto = require('node:crypto');
    const good = 'new wekan';
    const sum = crypto.createHash('sha256').update(good).digest('hex');
    const rel = { version: '12.40', url: 'https://x/12.40', shaUrl: 'https://x/12.40.sum', size: good.length };
    const file = await releases.download(rel, l, { fetchImpl: fakeFetch({ 'https://x/12.40': good, 'https://x/12.40.sum': `${sum}  f\n` }) });
    assert.equal(fs.readFileSync(file, 'utf8'), good);
    await assert.rejects(
      releases.download(rel, l, { fetchImpl: fakeFetch({ 'https://x/12.40': 'evil', 'https://x/12.40.sum': `${sum}  f\n` }) }),
      /does not match its checksum/);
    assert.deepEqual(fs.readdirSync(l.versions).filter(n => n.includes(String(process.pid)) && n !== path.basename(file)), [], 'no partial download left');
    await assert.rejects(releases.download({ ...rel, shaUrl: '' }, l, { fetchImpl: fakeFetch({}) }), /no checksum/);

    // Installing keeps the running version and puts the new one in its place.
    fs.writeFileSync(l.exePath, 'old wekan');
    const kept = releases.install({ layout: l, newFile: file, currentVersion: '12.39', target: 'amd64' });
    assert.equal(kept, path.join(l.versions, 'wekan-12.39'));
    assert.equal(fs.readFileSync(l.exePath, 'utf8'), good);
    assert.equal(fs.readFileSync(kept, 'utf8'), 'old wekan');
    assert.deepEqual(releases.keptVersions(l, 'amd64').map(k => k.version), ['12.39']);
    // Going back to a kept version copies it, so it stays kept.
    releases.install({ layout: l, newFile: kept, currentVersion: '12.40', target: 'amd64' });
    assert.equal(fs.readFileSync(l.exePath, 'utf8'), 'old wekan');
    assert.deepEqual(releases.keptVersions(l, 'amd64').map(k => k.version), ['12.40', '12.39']);
    // A kept version's name is read literally (it used to be a half-escaped
    // RegExp): only wekan-<version><exe> counts.
    for (const junk of ['wekan-12.38x', 'wekan-12.38.exe.partial', 'wekan-latest', 'xwekan-12.37', '.download-12.36-1-ab']) {
      fs.writeFileSync(path.join(l.versions, junk), '');
    }
    assert.deepEqual(releases.keptVersions(l, 'amd64').map(k => k.version), ['12.40', '12.39']);
    fs.writeFileSync(path.join(l.versions, 'wekan-12.35.exe'), '');
    fs.writeFileSync(path.join(l.versions, 'wekan-12.34Xexe'), '');
    assert.deepEqual(releases.keptVersions(l, 'win64').map(k => k.version), ['12.35']);
    // Negative: a new file that cannot be moved in leaves the old executable in place.
    assert.throws(() => releases.install({ layout: l, newFile: path.join(dir, 'missing'), currentVersion: '12.39', target: 'amd64' }));
    assert.equal(fs.readFileSync(l.exePath, 'utf8'), 'old wekan', 'the executable is put back');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- autostart ---------------------------------------------------------------

test('autostart: each method starts "<executable> start", and removing takes away only its own entry', () => {
  const spec = { exePath: '/opt/my wekan/wekan', workDir: '/opt/my wekan/wekan-files', logFile: '/opt/my wekan/wekan-files/logs/wekan.log' };
  const unit = autostart.systemdUnit({ ...spec, user: 'wekan' });
  assert.match(unit, /^ExecStart="\/opt\/my wekan\/wekan" start$/m);
  assert.match(unit, /^User=wekan$/m);
  assert.match(unit, /^WantedBy=multi-user\.target$/m);
  assert.match(autostart.systemdUnit(spec), /^WantedBy=default\.target$/m, 'a user unit');
  const plist = autostart.launchdPlist({ ...spec, exePath: '/A&B/wekan' });
  assert.match(plist, /<string>\/A&amp;B\/wekan<\/string>\s*<string>start<\/string>/);
  assert.match(plist, /<key>RunAtLoad<\/key>\s*<true\/>/);
  const line = autostart.cronLine(spec);
  assert.match(line, /^@reboot cd '\/opt\/my wekan\/wekan-files' && '\/opt\/my wekan\/wekan' start >> /);
  const others = 'MAILTO=a\n0 1 * * * backup.sh\n';
  const withIt = autostart.crontabWith(others, spec.exePath, line);
  assert.equal(withIt, `${others}${line}\n`);
  assert.equal(autostart.crontabWith(withIt, spec.exePath, line), withIt, 'installing twice adds it once');
  assert.equal(autostart.crontabWith(withIt, spec.exePath, null), others, 'removing keeps everything else');
  assert.equal(autostart.crontabWith(withIt, '/other/wekan', null), withIt, 'another single file\'s entry is not touched');
  assert.match(autostart.termuxBootScript(spec), /termux-wake-lock[\s\S]*exec '\/opt\/my wekan\/wekan' start/);
  assert.deepEqual(autostart.schtasksCreateArgs({ exePath: 'C:\\w\\wekan.exe', admin: true }).slice(-7),
    ['ONSTART', '/RU', 'SYSTEM', '/RL', 'HIGHEST', '/TR', '"C:\\w\\wekan.exe" start']);
  assert.ok(autostart.schtasksCreateArgs({ exePath: 'C:\\w\\wekan.exe', admin: false }).includes('ONLOGON'));
  // Which method each system gets.
  const m = o => autostart.method({ has: () => false, isRoot: false, env: {}, ...o });
  assert.equal(m({ platform: 'win32' }), 'schtasks');
  assert.equal(m({ platform: 'darwin' }), 'launchd-agent');
  assert.equal(m({ platform: 'darwin', isRoot: true }), 'launchd-daemon');
  assert.equal(m({ platform: 'android' }), 'termux-boot');
  assert.equal(m({ platform: 'linux', env: { PREFIX: '/data/data/com.termux/files/usr' } }), 'termux-boot');
  for (const bsd of ['freebsd', 'openbsd', 'netbsd']) assert.equal(m({ platform: bsd }), 'cron', bsd);
  assert.equal(m({ platform: 'linux' }), 'cron', 'no systemd: cron');
});

// --- version info -----------------------------------------------------------

test('version info has what Admin Panel / Version shows, as text lines', () => {
  const fakeOs = {
    type: () => 'Linux', platform: () => 'linux', arch: () => 'x64', release: () => '6.1',
    uptime: () => 90061, loadavg: () => [1, 0.5, 0.25], totalmem: () => 8 * 1073741824, freemem: () => 1073741824,
    cpus: () => [{ model: 'CPU X ' }, { model: 'CPU X' }],
  };
  const l = layout({ exePath: '/nowhere/wekan', env: {}, pathImpl: path.posix });
  const lines = info.versionLines({
    manifest: { version: '12.40', target: 'amd64', node: 'v26.11.1', meteor: '3.6', built: '2026-10-13T00:00:00Z' },
    layout: l, running: { pid: 42, started: new Date(Date.now() - 65000).toISOString(), rootUrl: 'http://localhost:8080' },
    ferretdb: { version: 'v1.94.0', commit: 'abc' }, osImpl: fakeOs,
  });
  const text = lines.join('\n');
  for (const want of [/WeKan version\s+: 12\.40/, /Package\s+: single-file/, /OS type\s+: Linux/, /OS uptime\s+: 1 days, 1 hours, 1 minutes, 1 seconds/,
    /OS total memory\s+: 8\.0 GiB/, /OS CPU count\s+: 2 x CPU X/, /Node\.js version\s+: 26\.11\.1/, /Meteor version\s+: 3\.6/,
    /WeKan server\s+: running, pid 42, for 1 minutes, 5 seconds/, /FerretDB version\s+: v1\.94\.0/, /Storage engine\s+: SQLite/,
    /WRITABLE_PATH\s+: \/nowhere\/wekan-files/]) {
    assert.match(text, want);
  }
});

// --- the virtual working directory ------------------------------------------

test('the server\'s working directory is virtual inside the archive and real outside it', () => {
  const calls = [];
  const proc = { cwd: () => '/real', chdir: d => calls.push(d) };
  const fsImpl = { statSync: p => ({ isDirectory: () => !p.endsWith('.js') }) };
  installVirtualCwd('/vfs/0/bundle/programs/server', { proc, fsImpl, isVirtual: p => p.startsWith('/vfs/0') });
  assert.equal(proc.cwd(), '/vfs/0/bundle/programs/server');
  proc.chdir('../web.browser');
  assert.equal(proc.cwd(), '/vfs/0/bundle/programs/web.browser');
  assert.deepEqual(calls, [], 'the kernel was not asked to enter the archive');
  assert.throws(() => proc.chdir('/vfs/0/main.js'), { code: 'ENOTDIR' });
  proc.chdir('/tmp');
  assert.deepEqual(calls, ['/tmp']);
  assert.equal(proc.cwd(), '/tmp');
});

// --- Node.js itself: what the single file relies on, and the bug it works around

function vfsChild(code) {
  return spawnSync(process.execPath, ['--no-warnings', '--experimental-vfs', '-e', code], { encoding: 'utf8', cwd: TMP_ROOT });
}

test('Node.js 26.11.1 breaks fs.writev/readv while a VFS is mounted, and the workaround fixes both', { skip: !HAS_VFS && 'needs node:vfs (Node.js 26.11+)' }, () => {
  const dir = tmp('sf-writev-');
  try {
    // The paths reach the child through its environment, so the code it runs
    // is a constant (CodeQL js/bad-code-sanitization, as alerts 567/568).
    const env = { ...process.env, SF_TARGET: path.join(dir, 'out.txt'), SF_WORKAROUNDS: path.join(SF, 'lib', 'vfsWorkarounds.cjs') };
    const body = `
      const fs = require('fs');
      const target = process.env.SF_TARGET;
      const v = require('node:vfs').create(); v.writeFileSync('/x', 'x'); v.mount();
      if (process.argv[1] === 'fix') require(process.env.SF_WORKAROUNDS).patchVectoredIo(fs);
      const ws = fs.createWriteStream(target);
      ws.cork(); for (let i = 0; i < 5; i++) ws.write('chunk' + i + '\\n'); process.nextTick(() => ws.uncork());
      ws.on('error', e => { console.log('ERR ' + e.message); process.exit(2); });
      ws.end(() => {
        const fd = fs.openSync(target, 'r'); const a = Buffer.alloc(7), b = Buffer.alloc(7);
        fs.readv(fd, [a, b], 0, (e, n) => console.log('OK ' + fs.readFileSync(target, 'utf8').split('\\n').length + ' ' + n + ' ' + JSON.stringify(a + '' + b)));
      });`;
    const broken = spawnSync(process.execPath, ['--no-warnings', '--experimental-vfs', '-e', body, 'nofix'], { encoding: 'utf8', env });
    // When this assertion fails, Node.js has fixed it: the workaround and this
    // half of the test can go.
    assert.match(broken.stdout + broken.stderr, /h\.writev is not a function/, 'Node.js still has the bug the workaround is for');
    const fixed = spawnSync(process.execPath, ['--no-warnings', '--experimental-vfs', '-e', body, 'fix'], { encoding: 'utf8', env });
    assert.equal(fixed.stdout.trim(), 'OK 6 14 "chunk0\\nchunk1\\n"', fixed.stderr);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the archive writer\'s ZIP is read by Node\'s own VFS: deflated, stored, nested (negative: bad names refused)', { skip: !HAS_VFS && 'needs node:vfs (Node.js 26.11+)' }, async () => {
  const { writeZip } = await import(path.join(SF, 'zip.mjs'));
  const dir = tmp('sf-zip-');
  try {
    const zip = path.join(dir, 'a.zip');
    const big = 'compressible '.repeat(5000);
    writeZip(zip, [
      { name: 'package.json', data: '{"main":"main.js"}' },
      { name: 'main.js', data: `const fs=require('fs');console.log(JSON.stringify([fs.readFileSync(__dirname+'/d/big.txt','utf8').length, require('./d/m.js'), fs.readdirSync(__dirname+'/d').sort()]))` },
      { name: 'd/big.txt', data: big },
      { name: 'd/m.js', data: 'module.exports = "nested";' },
      { name: 'd/rand.bin', data: require('node:crypto').randomBytes(4096) },
    ]);
    const run = spawnSync(process.execPath, ['--no-warnings', '--experimental-vfs', `--vfs-load=${zip}`], { encoding: 'utf8' });
    assert.equal(run.stdout.trim(), JSON.stringify([big.length, 'nested', ['big.txt', 'm.js', 'rand.bin']]), run.stderr);
    assert.ok(fs.statSync(zip).size < big.length / 4, 'text is deflated');
    assert.throws(() => writeZip(path.join(dir, 'b.zip'), [{ name: '../x', data: 'x' }]), /Refusing/);
    assert.throws(() => writeZip(path.join(dir, 'b.zip'), [{ name: 'x', data: '1' }, { name: 'x', data: '2' }]), /Duplicate/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- the whole thing, for real ------------------------------------------------

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
}

// A stand-in Meteor bundle: boot.js reads program.json RELATIVELY (the virtual
// working directory), writes a multi-chunk stream to WRITABLE_PATH (the
// writev workaround), and serves what it saw.
function fakeBundle(dir) {
  const server = path.join(dir, 'programs', 'server');
  fs.mkdirSync(server, { recursive: true });
  fs.writeFileSync(path.join(dir, 'main.js'), "require('./programs/server/boot.js');\n");
  fs.writeFileSync(path.join(dir, 'star.json'), JSON.stringify({ meteorRelease: 'METEOR@3.6-test' }));
  fs.writeFileSync(path.join(server, 'program.json'), JSON.stringify({ format: 'stand-in' }));
  fs.writeFileSync(path.join(server, 'runtime.js'), 'module.exports = function enable() {};\n');
  fs.writeFileSync(path.join(server, 'mini-files.js'), meteorMiniFiles());
  fs.writeFileSync(path.join(server, 'boot.js'), `
const fs = require('fs'); const path = require('path'); const http = require('http');
const program = JSON.parse(fs.readFileSync('program.json', 'utf8'));
const out = path.join(process.env.WRITABLE_PATH, 'attachments', 'probe.bin');
const ws = fs.createWriteStream(out);
ws.cork(); for (let i = 0; i < 8; i++) ws.write(Buffer.alloc(70000, i)); process.nextTick(() => ws.uncork());
ws.end(() => {
  http.createServer((q, r) => {
    r.setHeader('content-type', 'application/json');
    r.end(JSON.stringify({ cwd: process.cwd(), argv2: process.argv[2], program: program.format, written: fs.statSync(out).size, packaging: process.env.WEKAN_PACKAGING }));
  }).listen(Number(process.env.PORT), '127.0.0.1');
});
`);
  // node and ferretdb are what the platform ZIP would carry; the builder
  // leaves node out of the archive and puts ferretdb under bin/.
  fs.writeFileSync(path.join(dir, 'ferretdb'), '#!/bin/sh\necho "version: v0.0.0-stand-in"\necho "commit: 0123abc"\n', { mode: 0o755 });
  fs.writeFileSync(path.join(dir, 'start-wekan.sh'), '#!/bin/sh\n');
  fs.writeFileSync(path.join(dir, 'mongodump'), 'not carried');
}

test('build, start, status, version, menu and stop a real single executable', {
  skip: (!HAS_VFS && 'needs --build-sea with useVfs (Node.js 26.11+)')
    || (!HAS_SEA && 'this Node.js was compiled without single executable applications (Homebrew\'s is)')
    || (process.platform === 'win32' && 'the stand-in FerretDB is a shell script'),
  timeout: 240000,
}, async () => {
  const dir = tmp('sf-e2e-');
  const exe = path.join(dir, 'wekan-test-single-file');
  const sh = (...args) => spawnSync(exe, args, { encoding: 'utf8', cwd: dir, env: { ...process.env, WEKAN_DB: 'mongodb', MONGO_URL: 'mongodb://127.0.0.1:1/none' }, timeout: 60000 });
  try {
    const bundle = path.join(dir, 'bundle');
    fakeBundle(bundle);
    const { build, archiveEntries, excludedFromBundle } = await import(path.join(SF, 'build.mjs'));
    // What goes in: the bundle without what a single file does not carry.
    const { entries, manifest } = archiveEntries({ bundle, target: 'amd64', version: '0.0', ferretdb: path.join(bundle, 'ferretdb'), nodeVersion: process.version, built: 'now' });
    const names = entries.map(e => e.name);
    for (const want of ['bundle/main.js', 'bundle/programs/server/boot.js', 'bin/ferretdb', 'single-file.json', 'models/lib/filesRoot.js',
      'releases/single-file/launcher.cjs', 'releases/single-file/lib/cli.cjs', 'releases/single-file/lib/vfsWorkarounds.cjs', 'releases/ferretdb/sqlite-recovery.mjs']) {
      assert.ok(names.includes(want), want);
    }
    for (const never of ['bundle/ferretdb', 'bundle/start-wekan.sh', 'bundle/mongodump', 'bundle/node']) assert.ok(!names.includes(never), never);
    assert.ok(excludedFromBundle('qemu-x86_64') && excludedFromBundle('mongo-tools.exe') && !excludedFromBundle('programs/server/node'));
    assert.equal(manifest.meteor, '3.6-test');

    // Negative: a directory that is not a bundle, and a Node.js of another version.
    assert.throws(() => build({ bundle: dir, target: 'amd64', version: '0.0', out: exe }), /not a WeKan bundle/);
    const otherNode = path.join(dir, 'node-other');
    fs.writeFileSync(otherNode, 'https://nodejs.org/download/release/v1.2.3/ ...');
    assert.throws(() => build({ bundle, node: otherNode, target: 'amd64', version: '0.0', out: exe }), /same Node\.js version/);

    build({ bundle, node: process.execPath, target: 'amd64', version: '0.0', out: exe, built: 'test' });
    assert.ok(fs.existsSync(`${exe}.sha256sum`));

    let r = sh('help');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /autostart install\|remove\|status/);
    const port = await freePort();
    r = sh('set', 'PORT', String(port));
    assert.match(r.stdout, new RegExp(`PORT=${port}`));
    assert.match(fs.readFileSync(path.join(dir, 'wekan-files', 'wekan.env'), 'utf8'), new RegExp(`^PORT=${port}$`, 'm'));

    r = sh('version');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /WeKan version\s+: 0\.0/);
    assert.match(r.stdout, /FerretDB version\s+: v0\.0\.0-stand-in/, 'FerretDB was extracted and run');
    assert.match(r.stdout, /Meteor version\s+: 3\.6-test/);
    assert.equal(fs.readdirSync(path.join(dir, 'wekan-files', 'bin')).length, 1, 'FerretDB is the one extracted file');

    r = sh('start', '--background');
    assert.equal(r.status, 0, r.stderr);
    let answer = null;
    for (let i = 0; i < 60 && !answer; i += 1) {
      await new Promise(res => setTimeout(res, 500));
      try {
        answer = await (await fetch(`http://127.0.0.1:${port}/`)).json();
      } catch (e) {
        answer = null;
      }
    }
    const log = () => { try { return fs.readFileSync(path.join(dir, 'wekan-files', 'logs', 'wekan.log'), 'utf8'); } catch (e) { return ''; } };
    assert.ok(answer, `the server answered\n${log()}`);
    assert.match(answer.cwd, /bundle[\\/]programs[\\/]server$/, 'process.cwd() is the bundle\'s server directory');
    assert.equal(answer.program, 'stand-in', 'a RELATIVE read found program.json inside the archive');
    assert.match(answer.argv2, /program\.json$/);
    assert.equal(answer.written, 8 * 70000, 'a multi-chunk write stream wrote everything (fs.writev)');
    assert.equal(answer.packaging, 'single-file');
    assert.equal(fs.statSync(path.join(dir, 'wekan-files', 'attachments', 'probe.bin')).size, 8 * 70000,
      'WRITABLE_PATH is wekan-files, and attachments are directly in it');

    r = sh('status');
    assert.match(r.stdout, /Status:\s+running since/);
    assert.match(r.stdout, /answers HTTP 200/);
    // Negative: a second WeKan on the same wekan-files is refused.
    r = sh('start');
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /already running/);

    // The menu, driven as a script would: Status, then Quit.
    const menu = spawnSync(exe, ['menu'], { input: '3\n0\n', encoding: 'utf8', cwd: dir, timeout: 60000 });
    assert.equal(menu.status, 0, menu.stderr);
    assert.match(menu.stdout, /1\) Start WeKan[\s\S]*7\) Backup now[\s\S]*0\) Quit/);
    assert.match(menu.stdout, /Status:\s+running since/);
    // End of input is Quit, not a crash.
    const eof = spawnSync(exe, ['menu'], { input: '', encoding: 'utf8', cwd: dir, timeout: 60000 });
    assert.equal(eof.status, 0, eof.stderr);

    r = sh('backup');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Backed up .*attachments.* to .*wekan-files[\\/]backup[\\/]\d{4}-\d\d-\d\d_\d\d-\d\d-\d\d/);
    assert.match(r.stdout, /Started WeKan again/);

    r = sh('stop');
    assert.match(r.stdout, /Stopped\./);
    assert.equal(fs.existsSync(path.join(dir, 'wekan-files', 'run', 'wekan.pid')), false);
    r = sh('status');
    assert.match(r.stdout, /Status:\s+stopped/);
  } finally {
    try {
      spawnSync(exe, ['stop'], { cwd: dir, timeout: 60000 });
    } catch (e) {
      // never built
    }
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the workflow builds every platform with a bundle, from that bundle, and starts each where it can run', () => {
  const targets = JSON.parse(read('releases/single-file/targets.json'));
  const wf = read('.github/workflows/single-file.yml');
  const names = targets.map(t => t.target);
  // Every platform a WeKan Node.js bundle is published for, the BSDs
  // (bsd.yml), and Android, whose Node.js wekan/node-patches builds.
  for (const must of ['amd64', 'arm64', 'armv7', 'armhf', 'armv6', 'i386', 'ppc64le', 'riscv64', 's390x', 'loong64',
    'win64', 'win32', 'win-arm64', 'mac-arm64', 'mac-x64',
    'freebsd-x64', 'freebsd-arm64', 'openbsd-x64', 'openbsd-arm64', 'netbsd-x64', 'android-arm64', 'android-x64']) {
    assert.ok(names.includes(must), must);
  }
  for (const t of targets) {
    assert.match(t.zip, /^wekan-\{version\}-[a-z0-9-]+\.zip$/, t.target);
    assert.ok(['ubuntu-24.04', 'ubuntu-24.04-arm', 'windows-2025', 'windows-11-arm', 'macos-15', 'none'].includes(t.smoke), `${t.target} smoke runner`);
    // macOS refuses an arm64 binary whose signature broke when the archive was
    // injected; only a Mac can re-sign it.
    assert.equal(t.build_on, /^mac/.test(t.target) ? 'macos-15' : 'ubuntu-24.04', `${t.target} is built where it can be signed`);
  }
  assert.match(wf, /node releases\/single-file\/build\.mjs/);
  assert.match(wf, /sha256sum -c/, 'the platform bundle is verified before it is repackaged');
  assert.match(wf, /skip=true/, 'a platform whose bundle is not published is skipped, not failed');
  assert.match(wf, /WEKAN_SINGLE_FILE_FILES/, 'the browser test runs against the built file');
  assert.match(read('.github/workflows/release-all.yml'), /uses: \.\/\.github\/workflows\/single-file\.yml/);
});

test('the docs say what is extracted, where wekan-files is, and what each menu entry does', () => {
  const doc = read('docs/Platforms/Single-File.md');
  for (const want of ['wekan-files/attachments', 'wekan-files/db', 'wekan-files/bin', 'wekan-files/backup', 'WRITABLE_PATH',
    'libatomic', 'Update to the newest version', 'Run automatically at boot', 'codesign']) {
    assert.ok(doc.includes(want), want);
  }
  const { MENU } = require(path.join(SF, 'lib', 'cli.cjs'));
  for (const [, label] of MENU) assert.ok(doc.includes(label), `the docs describe "${label}"`);
});

// --- The Windows single files (v12.41-v12.44): what stopped them ---------------

// Meteor's mini-files.js path conversion, as Meteor 3 ships it (bundle/programs/
// server/mini-files.js). Run on Windows path semantics.
function meteorMiniFiles() {
  return `function toPosixPath(p) {
  let partialPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  // Sometimes, you can have a path like \\Users\\IEUser on windows, and this
  // actually means you want C:\\Users\\IEUser
  if (p[0] === "\\\\" && !partialPath) {
    p = process.env.SystemDrive + p;
  }
  p = p.replace(/\\\\/g, '/');
  if (p[1] === ':' && !partialPath) {
    // transform "C:/bla/bla" to "/c/bla/bla"
    p = '/' + p[0] + p.slice(2);
  }
  return p;
}
function toDosPath(p) {
  let partialPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  if (p[0] === '/' && !partialPath) {
    if (!/^\\/[A-Za-z](\\/|$)/.test(p)) throw new Error("Surprising path: " + p);
    // transform a previously windows path back
    // "/C/something" to "c:/something"
    p = p[1] + ":" + p.slice(2);
  }
  p = p.replace(/\\//g, '\\\\');
  return p;
}
function pathResolve() {
  const result = path.resolve.apply(path, Array.prototype.map.call(arguments, p => toDosPath(p)));
  return toPosixPath(result);
}`;
}

function windowsMiniFiles(source) {
  const sandbox = { process: { env: { SystemDrive: 'C:' } }, path: path.win32, Array };
  require('node:vm').runInNewContext(`${source}\nthis.f = { toPosixPath, toDosPath, pathResolve };`, sandbox);
  return sandbox.f;
}

test('Windows: Meteor finds a package inside the single file\'s archive (\\\\.\\NUL\\vfs), and drive paths are unchanged', async () => {
  const { patchMiniFiles, MINI_FILES } = await import(path.join(SF, 'meteor-device-paths.mjs'));
  const mount = '\\\\.\\NUL\\vfs\\1\\bundle\\programs\\server\\npm\\node_modules\\meteor\\meteor\\node_modules';
  // Negative: as Meteor ships it, the device path loses its prefix - the
  // "Cannot find module 'denque'" of the win64 and win-arm64 single files.
  const before = windowsMiniFiles(meteorMiniFiles());
  assert.equal(before.toPosixPath(mount), '/C//./NUL/vfs/1/bundle/programs/server/npm/node_modules/meteor/meteor/node_modules');
  const patched = patchMiniFiles(meteorMiniFiles());
  assert.equal(patchMiniFiles(patched), patched, 'applying it twice changes nothing');
  const f = windowsMiniFiles(patched);
  const standard = f.toPosixPath(mount);
  assert.equal(standard, '//./NUL/vfs/1/bundle/programs/server/npm/node_modules/meteor/meteor/node_modules');
  assert.equal(f.toDosPath(f.pathResolve(standard, 'denque')), `${mount}\\denque`, 'the package is looked for where it is');
  assert.equal(f.toDosPath(f.toPosixPath('\\\\server\\share\\wekan')), '\\\\server\\share\\wekan', 'a UNC share too');
  assert.equal(f.toPosixPath('C:\\wekan\\bundle'), '/C/wekan/bundle', 'a drive path as before');
  assert.equal(f.toDosPath('/C/wekan/bundle'), 'C:\\wekan\\bundle');
  assert.equal(f.toPosixPath('\\Users\\me'), '/C/Users/me', 'a rooted path still gets the system drive');
  // Negative: Meteor's code changed - the build stops rather than ship it unpatched.
  assert.throws(() => patchMiniFiles('function toPosixPath(p) { return p; }'), /not the code this patch was written for/);
  assert.equal(MINI_FILES, 'bundle/programs/server/mini-files.js');
  const build = read('releases/single-file/build.mjs');
  assert.match(build, /miniFiles\.data = patchMiniFiles\(fs\.readFileSync\(miniFiles\.file, 'utf8'\)\);/, 'every single file gets it');
});

test('a Node.js without single executable applications is named, not run (negative: one with them passes)', {
  skip: process.platform === 'win32' && 'the stand-in Node.js programs are shell scripts',
}, async () => {
  const { seaSupported } = await import(path.join(SF, 'build.mjs'));
  const dir = tmp('sf-sea-');
  try {
    const disabled = path.join(dir, 'node-without-sea');
    fs.writeFileSync(disabled, '#!/bin/sh\necho "$0: Single executable application is disabled." >&2\nexit 9\n', { mode: 0o755 });
    const enabled = path.join(dir, 'node-with-sea');
    fs.writeFileSync(enabled, '#!/bin/sh\necho "Cannot read single executable configuration from $2" >&2\nexit 1\n', { mode: 0o755 });
    assert.equal(seaSupported(disabled), false);
    assert.equal(seaSupported(enabled), true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a 32-bit target is built only by a 32-bit Node.js (negative: win32 from x64 is refused)', async () => {
  const { build, targetBits, archBits } = await import(path.join(SF, 'build.mjs'));
  for (const t of ['win32', 'i386', 'armv7', 'armhf', 'armv6']) assert.equal(targetBits(t), 32, t);
  for (const t of ['win64', 'win-arm64', 'amd64', 'arm64', 'mac-arm64', 'freebsd-x64']) assert.equal(targetBits(t), 64, t);
  assert.equal(archBits('ia32'), 32);
  assert.equal(archBits('x64'), 64);
  const dir = tmp('sf-bits-');
  try {
    const bundle = path.join(dir, 'bundle');
    fs.mkdirSync(path.join(bundle, 'programs/server'), { recursive: true });
    for (const f of ['main.js', 'programs/server/boot.js', 'programs/server/program.json']) fs.writeFileSync(path.join(bundle, f), '{}');
    fs.writeFileSync(path.join(bundle, 'node.exe'), `nodejs.org/download/release/${process.version}/`);
    fs.writeFileSync(path.join(bundle, 'ferretdb.exe'), 'x');
    if (archBits(process.arch) === 64) {
      assert.throws(() => build({ bundle, target: 'win32', version: '1.0', out: path.join(dir, 'out.exe') }),
        // The building Node.js is named by its own arch: x64 on a PC, arm64 on a Mac.
        new RegExp(`win32 is a 32-bit target, but the Node\\.js building it is ${process.arch}`));
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const wf = read('.github/workflows/single-file.yml');
  assert.match(wf, /contains\(fromJSON\('\["win32","i386","armv7","armhf","armv6"\]'\), matrix\.target\)/);
  assert.match(wf, /wekan-\$\{VERSION\}-i386\.zip[\s\S]*?sha256sum -c "\$zip\.sha256sum"/, 'the i386 Node.js is checked before it builds anything');
  assert.match(wf, /\$\{HOST_NODE:\+--host-node "\$HOST_NODE"\}/);
});
