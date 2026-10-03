'use strict';
// Continuous backup, the pure half (models/lib/continuousBackup.js,
// docs/Backup/Continuous-Backup.md): settings, target safety, the engine
// choice, index and segment checks, the choice of segments for a restore to a
// moment, and SQLite page deltas. Positive and negative cases for each.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const cb = require('../models/lib/continuousBackup');

const sources = ['/data/files/attachments', '/data/files/avatars', '/data/logs', '/data/files/db'];
const valid = { enabled: true, target: '/backup/wekan' };

test('settings: defaults filled in, every field of its type and range', () => {
  const result = cb.validateSettings(valid, { sources });
  assert.deepEqual(result, { ...cb.DEFAULTS, ...valid });
  assert.equal(cb.validateSettings({}, { sources, defaultTarget: '/data/continuous-backup' }).target, '/data/continuous-backup');
  assert.equal(cb.validateSettings({ ...valid, keepDays: 3650, fileScanSeconds: 30 }, { sources }).keepDays, 3650);
});

test('NEGATIVE settings: unknown keys, wrong types, out of range, nothing selected', () => {
  for (const bad of [
    { ...valid, isAdmin: true }, { ...valid, enabled: 'yes' }, { ...valid, engine: 'mongodump' },
    { ...valid, keepDays: 0 }, { ...valid, keepDays: 1.5 }, { ...valid, sqliteIntervalSeconds: 4 },
    { ...valid, baseEveryHours: 721 }, { ...valid, database: false, attachments: false, avatars: false, logs: false },
    null, [], 'x',
  ]) assert.throws(() => cb.validateSettings(bad, { sources }), /./, JSON.stringify(bad));
});

test('NEGATIVE target: relative, traversal, NUL, or overlapping what the stream reads', () => {
  for (const target of ['backup', '/backup/../etc', '/backup/\0x', '', '/data/files/attachments/backup', '/data/files', '/data',
    '/data/files/db', '/data/logs/stream']) {
    assert.throws(() => cb.validateSettings({ ...valid, target }, { sources }), /target directory/i, target);
  }
  assert.equal(cb.targetConflict('/data/continuous-backup', sources), null);
  assert.equal(cb.targetConflict('/data/files/attachments-backup', sources), null, 'a sibling with a common prefix is not inside');
  assert.equal(cb.targetConflict('/data', sources), '/data/files/attachments');
});

test('Litestream: only an absolute binary and a supported replica URL', () => {
  const ok = { ...valid, engine: 'litestream', litestreamBinary: '/usr/local/bin/litestream', litestreamReplicaUrl: 's3://bucket/wekan' };
  assert.equal(cb.validateSettings(ok, { sources }).engine, 'litestream');
  for (const bad of [{ litestreamBinary: 'litestream' }, { litestreamBinary: '/bin/../x' }, { litestreamReplicaUrl: 'http://x' },
    { litestreamReplicaUrl: 'not a url' }, { litestreamReplicaUrl: 'javascript:alert(1)' }]) {
    assert.throws(() => cb.validateSettings({ ...ok, ...bad }, { sources }), /Litestream/, JSON.stringify(bad));
  }
});

test('engine choice: auto prefers the oplog, then SQLite pages, never Litestream unasked', () => {
  const all = { oplog: true, sqliteFiles: ['/d/wekan.sqlite'], nodeSqlite: true, litestream: true };
  assert.equal(cb.chooseEngine('auto', all).engine, 'oplog');
  assert.equal(cb.chooseEngine('auto', { ...all, oplog: false }).engine, 'sqlite');
  assert.equal(cb.chooseEngine('litestream', all).engine, 'litestream');
  const none = cb.chooseEngine('auto', { oplog: false, sqliteFiles: [], nodeSqlite: true, litestream: false });
  assert.equal(none.engine, null);
  assert.deepEqual(none.reasons, { oplog: 'no-oplog', sqlite: 'no-sqlite-files', litestream: 'no-sqlite-files' });
  // NEGATIVE: a requested engine that cannot run is not silently replaced.
  assert.equal(cb.chooseEngine('oplog', { ...all, oplog: false }).engine, null);
  assert.equal(cb.chooseEngine('litestream', { ...all, litestream: false }).reasons.litestream, 'no-litestream-binary');
});

const entry = (seq, first, last, data = `segment ${seq}`) => ({ seq, file: `${cb.segmentName(seq)}.ndjson`,
  sha256: cb.sha256(data), bytes: Buffer.byteLength(data), first, last, count: 1 });

test('index: in sequence, never back in time, and the segments a restore to a moment reads', () => {
  const lines = [entry(1, 100, 200), entry(2, 200, 300), entry(3, 400, 500)].map(cb.indexLine).join('\n');
  const entries = cb.parseIndex(`${lines}\n`);
  assert.deepEqual(cb.segmentsUntil(entries, 99), []);
  assert.deepEqual(cb.segmentsUntil(entries, 250).map(e => e.seq), [1, 2]);
  assert.deepEqual(cb.segmentsUntil(entries, 1e15).map(e => e.seq), [1, 2, 3]);
});

test('NEGATIVE index: a gap, a repeat, time going back, a bad hash or file name', () => {
  const ok = [entry(1, 100, 200), entry(2, 200, 300)];
  for (const entries of [[ok[0], { ...ok[1], seq: 3, file: `${cb.segmentName(3)}.ndjson` }], [ok[0], ok[0]],
    [ok[0], { ...ok[1], first: 150 }]]) {
    assert.throws(() => cb.parseIndex(entries.map(e => JSON.stringify(e)).join('\n')), /index/);
  }
  for (const bad of [{ sha256: 'x' }, { file: '../000000000001.ndjson' }, { file: '000000000002.ndjson' }, { first: 300 },
    { count: -1 }, { bytes: 1.5 }, { first: Infinity }]) {
    assert.throws(() => cb.indexLine({ ...ok[0], ...bad }), /index entry/, JSON.stringify(bad));
  }
  assert.throws(() => cb.parseIndex('{not json'), /index line/);
});

// A real SQLite page layout is not needed to test the delta arithmetic, but
// the header check is real.
function image(pages, pageSize = 4096, seed = 'a') {
  const buffer = Buffer.alloc(pages * pageSize);
  for (let n = 0; n < pages; n += 1) crypto.createHash('sha256').update(`${seed}${n}`).digest().copy(buffer, n * pageSize + 200);
  Buffer.from('SQLite format 3\0', 'latin1').copy(buffer, 0);
  buffer.writeUInt16BE(pageSize === 65536 ? 1 : pageSize, 16);
  return buffer;
}

test('page deltas: only changed pages, and applying them rebuilds the new image exactly', () => {
  const before = image(10);
  const after = Buffer.from(before);
  after.write('changed', 3 * 4096 + 500); after.write('changed', 7 * 4096 + 10);
  assert.equal(cb.sqlitePageSize(before), 4096);
  const { hashes } = cb.diffImage([], before, 4096);
  const diff = cb.diffImage(hashes, after, 4096);
  assert.deepEqual(diff.pages.map(p => p.n), [3, 7]);
  assert.ok(cb.applyDelta(before, diff.delta).equals(after));
  // Growing and shrinking.
  const grown = Buffer.concat([after, image(2, 4096, 'b').subarray(0, 8192)]);
  const grow = cb.diffImage(diff.hashes, grown, 4096);
  assert.deepEqual(grow.pages.map(p => p.n), [10, 11]);
  assert.ok(cb.applyDelta(after, grow.delta).equals(grown));
  const shrunk = after.subarray(0, 6 * 4096);
  const shrink = cb.diffImage(diff.hashes, shrunk, 4096);
  assert.deepEqual(shrink.pages, []);
  assert.ok(cb.applyDelta(after, shrink.delta).equals(shrunk));
  assert.equal(cb.sqlitePageSize(image(1, 65536)), 65536);
});

test('NEGATIVE page deltas: corrupt headers, pages out of range, short data, an undefined new page', () => {
  assert.throws(() => cb.sqlitePageSize(Buffer.alloc(100)), /Not a SQLite/);
  const bad = image(1); bad.writeUInt16BE(1000, 16);
  assert.throws(() => cb.sqlitePageSize(bad), /page size/);
  assert.throws(() => cb.pageHashes(Buffer.alloc(4097), 4096), /whole number/);
  const before = image(2);
  const { delta } = cb.diffImage([], before, 4096);
  assert.throws(() => cb.decodeDelta(Buffer.from('nope')), /Not a page delta/);
  assert.throws(() => cb.decodeDelta(delta.subarray(0, delta.length - 1)), /inconsistent/);
  const outOfRange = cb.encodeDelta({ pageSize: 4096, pageCount: 1, pages: [{ n: 5, data: Buffer.alloc(4096) }] });
  assert.throws(() => cb.decodeDelta(outOfRange), /inconsistent/);
  // A delta that grows the image must carry every new page.
  const gap = cb.encodeDelta({ pageSize: 4096, pageCount: 4, pages: [{ n: 3, data: Buffer.alloc(4096) }] });
  assert.throws(() => cb.applyDelta(before, gap), /undefined/);
});

test('retention: old generations go, the newest complete one always stays', () => {
  const day = 86400000, now = 100 * day;
  const generations = [
    { name: 'a', started: now - 30 * day, ended: now - 29 * day, complete: true },
    { name: 'b', started: now - 20 * day, ended: now - 19 * day, complete: true },
    { name: 'c', started: now - 10 * day, complete: false },
  ];
  assert.deepEqual(cb.generationsToRemove(generations, now, 7), ['a', 'c']);
  assert.deepEqual(cb.generationsToRemove(generations, now, 365), []);
  assert.match(cb.generationName(new Date('2026-10-03T08:09:10Z'), 'abcdef123456'), cb.GENERATION_NAME);
  assert.doesNotMatch('../../etc', cb.GENERATION_NAME);
});

test('the pane, its route and its server methods are wired, and only site admins reach the methods', () => {
  const root = path.join(__dirname, '..');
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const server = read('server/continuousBackup.js');
  for (const method of ['getSettings', 'saveSettings', 'status', 'restorePoints', 'fetchFromCloud', 'restore']) {
    const at = server.indexOf(`'continuousBackup.${method}'`);
    assert.ok(at > 0, method);
    const body = server.slice(at, server.indexOf('\n  },', at));
    assert.match(body, /await requireSiteAdmin\(this\.userId\)/, `${method} checks the caller`);
  }
  assert.match(server, /tenantAdmin\.isSiteAdmin\(user\)/);
  assert.match(read('server/imports.js'), /import '\/server\/continuousBackup';/);
  const urls = require('../models/lib/adminUrls');
  assert.equal(urls.ADMIN_PAGES.attachments.panes['continuous-backup'], 'continuous-backup');
  assert.ok(urls.ADMIN_PANE_TITLES.attachments['continuous-backup']);
  const menu = read('client/components/settings/attachments.js');
  assert.match(menu, /\{ id: 'continuous-backup',/);
  assert.match(read('client/components/settings/attachments.jade'), /isContinuousBackupActive/);
  // NEGATIVE: an Organization administrator's menu keeps Backup only.
  const { tenantAdminAttachmentsMenu } = require('../models/lib/tenantAdmin');
  const items = [{ id: 'backup' }, { id: 'continuous-backup' }, { id: 'move' }];
  assert.deepEqual(tenantAdminAttachmentsMenu(items, { orgs: [{ orgId: 'o', isAdmin: true }] }).map(i => i.id), ['backup']);
});

test('NEGATIVE: the engines never use a shell, follow a link, or read a source as a target', () => {
  const root = path.join(__dirname, '..', 'server', 'lib', 'continuousBackup');
  const all = fs.readdirSync(root).map(name => fs.readFileSync(path.join(root, name), 'utf8')).join('\n');
  assert.doesNotMatch(all, /\bexec(Sync)?\(|shell: true/);
  assert.match(fs.readFileSync(path.join(root, 'litestream.js'), 'utf8'), /shell: false/);
  assert.match(fs.readFileSync(path.join(root, 'files.js'), 'utf8'), /isSymbolicLink\(\)\) continue/);
  assert.match(fs.readFileSync(path.join(root, 'store.js'), 'utf8'), /O_NOFOLLOW/);
  assert.match(fs.readFileSync(path.join(root, 'restore.js'), 'utf8'), /symlinkOnRestorePath/);
});

test('the Attachments page template compiles: a comment between if and else if would orphan the pane', () => {
  // A `//-` line between two branches of an if / else if chain ends the chain,
  // and the loader then refuses the whole file - every Admin Panel page and
  // the sign-in with it. This compiles the template the way the build does.
  const { JadeCompiler, SpacebarsCompiler } = require('../npm-packages/meteor-jade-loader/lib/jade-compiler')();
  const file = path.join(__dirname, '..', 'client', 'components', 'settings', 'attachments.jade');
  const parsed = JadeCompiler.parse(fs.readFileSync(file, 'utf8'), { filename: file, fileMode: true });
  for (const [name, template] of Object.entries(parsed.templates)) {
    assert.doesNotThrow(() => SpacebarsCompiler.codeGen(template, { isTemplate: true, sourceName: name }), name);
  }
  assert.match(fs.readFileSync(file, 'utf8'), /else if isContinuousBackupActive\n\s+\/\/-/);
});

// The Compose files run FerretDB with an oplog for this engine (2026-10-03).
// FerretDB refuses a find with noCursorTimeout, so a tail that asked for it
// never started there and retried forever; the tail asks again every second,
// so it never idles out, and one that does is reopened.
test('NEGATIVE: the oplog tail asks for nothing FerretDB refuses', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server/lib/continuousBackup/oplog.js'), 'utf8')
    .replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(source, /noCursorTimeout/);
  assert.match(source, /\{ tailable: true, awaitData: true, maxAwaitTimeMS: 1000 \}/);
  // And the Compose files give it a FerretDB that keeps an oplog, over a direct connection.
  for (const file of ['docker-compose.yml', 'docker-compose-ferretdb-v1-postgresql.yml']) {
    const compose = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(compose, /--repl-set-name=rs0/, file);
    assert.match(compose, /MONGO_URL=mongodb:\/\/ferretdb:27017\/wekan\?directConnection=true/, file);
  }
});
