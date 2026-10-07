'use strict';
// Continuous backup against real systems (docs/Backup/Continuous-Backup.md):
// the oplog engine on a MongoDB replica set, the SQLite page engine on a real
// WAL database being written, the file streams on real directories, and the
// Litestream supervisor with a stand-in binary. Each restores to a chosen
// moment and refuses a changed byte before writing anything.
//
// The oplog test needs WEKAN_CONTINUOUS_BACKUP_TEST_MONGO_URL (a replica set,
// e.g. `meteor run`'s mongodb://127.0.0.1:3001); it only touches fresh random
// databases. The others need nothing.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: sleep } = require('node:timers/promises');
const store = require('../../server/lib/continuousBackup/store');
const { OplogEngine } = require('../../server/lib/continuousBackup/oplog');
const { SqliteEngine, quickCheck, nodeSqlite } = require('../../server/lib/continuousBackup/sqlite');
const { FileEngine } = require('../../server/lib/continuousBackup/files');
const { LitestreamEngine, litestreamConfig } = require('../../server/lib/continuousBackup/litestream');
const { restoreDatabase, restoreFiles, restoreSqlite, restorePoints } = require('../../server/lib/continuousBackup/restore');

const tmpRoot = () => fs.mkdtempSync(path.join(process.env.TMPDIR || path.resolve('.tools/tmp'), 'continuous-backup-'));
const uri = process.env.WEKAN_CONTINUOUS_BACKUP_TEST_MONGO_URL;
// Wait into the next second: oplog times have one-second resolution.
const nextSecond = async () => { const second = Math.floor(Date.now() / 1000); while (Math.floor(Date.now() / 1000) === second) await sleep(50); };
async function tamper(file) { const data = fs.readFileSync(file); data[data.length - 2] ^= 1; fs.writeFileSync(file, data); }

test('oplog engine: base, realtime changes, restart from its position, restore to a moment', { skip: !uri, timeout: 120000 }, async t => {
  const { MongoClient, BSON, ObjectId } = require('mongodb');
  const { ZipArchive } = await import('archiver');
  const tools = require('../../server/lib/fullBackup').createBackupTools(BSON.EJSON);
  const root = tmpRoot();
  const client = new MongoClient(uri); await client.connect();
  const token = new ObjectId().toHexString();
  const dbName = `cb_source_${token}`, source = client.db(dbName);
  const restored = n => client.db(`cb_restore_${n}_${token}`);
  t.after(async () => {
    for (const db of [source, restored(1), restored(2), restored(3)]) await db.dropDatabase().catch(() => {});
    await client.close(); fs.rmSync(root, { recursive: true, force: true });
  });
  await source.collection('cards').insertMany([{ _id: 'a', title: 'A', at: new Date('2026-10-01') }, { _id: 'b', title: 'B' }]);
  const target = await store.openTarget(path.join(root, 'target'));
  const generation = await store.createGeneration(target, { engine: 'oplog', database: dbName });
  let saved = null;
  const engine = () => new OplogEngine({ client, dbName, target, generation, EJSON: BSON.EJSON, Timestamp: BSON.Timestamp,
    ZipArchive, appendInstanceBackup: tools.appendInstanceBackup, sealMs: 200, onError: error => { throw error; },
    onPosition: async position => { saved = position; } });
  const first = await engine().start(null);
  // Changes after the base: an insert, an update by operator, a delete.
  await source.collection('cards').insertOne({ _id: 'c', title: 'C', big: BSON.Long.fromString('9007199254740993') });
  await source.collection('cards').updateOne({ _id: 'a' }, { $set: { title: 'A2' }, $unset: { at: '' } });
  await source.collection('cards').deleteOne({ _id: 'b' });
  await sleep(1500); await first.stop();
  await nextSecond(); const middle = Date.now(); await nextSecond();
  // Changes while the engine is stopped are picked up on restart, from the
  // saved position.
  await source.collection('cards').updateOne({ _id: 'c' }, { $set: { title: 'C2' } });
  await source.collection('lists').insertOne({ _id: 'l', title: 'L' });
  assert.ok(saved && Number.isInteger(saved.t));
  const second = await engine().start(saved);
  await source.collection('lists').drop();
  await sleep(1500); await second.stop();
  const points = await restorePoints(target, generation.name);
  assert.ok(points.until >= middle);

  const titles = async db => Object.fromEntries((await db.collection('cards').find({}).toArray()).map(d => [d._id, d.title]));
  // As it was at `middle`.
  await restoreDatabase({ target, name: generation.name, until: middle, db: restored(1), filesRoot: path.join(root, 'files'),
    mode: 'replace-all', EJSON: BSON.EJSON, ...tools });
  assert.deepEqual(await titles(restored(1)), { a: 'A2', c: 'C' });
  const a = await restored(1).collection('cards').findOne({ _id: 'a' });
  assert.equal('at' in a, false, 'an update that removed a field is replayed as the whole document');
  assert.equal((await restored(1).collection('cards').findOne({ _id: 'c' })).big.toString(), '9007199254740993');
  // As it is now: the restart caught the change made while stopped, and the drop.
  await restoreDatabase({ target, name: generation.name, until: Date.now(), db: restored(2), filesRoot: path.join(root, 'files'),
    mode: 'replace-all', EJSON: BSON.EJSON, ...tools });
  assert.deepEqual(await titles(restored(2)), { a: 'A2', c: 'C2' });
  assert.equal(await restored(2).collection('lists').countDocuments(), 0);
  // NEGATIVE: a changed byte in a segment refuses the restore before any write.
  const segment = path.join(generation.dir, 'db', '000000000001.ndjson');
  await tamper(segment);
  await assert.rejects(restoreDatabase({ target, name: generation.name, until: Date.now(), db: restored(3),
    filesRoot: path.join(root, 'files'), mode: 'replace-all', EJSON: BSON.EJSON, ...tools }), /has changed/);
  assert.deepEqual(await restored(3).listCollections().toArray(), []);
  // NEGATIVE: an unknown generation name is never a path.
  await assert.rejects(restoreDatabase({ target, name: '../../etc', until: Date.now(), db: restored(3), filesRoot: root,
    mode: 'replace-all', EJSON: BSON.EJSON, ...tools }), /Invalid generation/);
});

test('SQLite page engine: a WAL database written meanwhile, rebuilt at a moment and checked', { skip: !nodeSqlite(), timeout: 60000 }, async t => {
  const sqlite = nodeSqlite();
  const root = tmpRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'db'); fs.mkdirSync(dir);
  const file = path.join(dir, 'wekan.sqlite');
  const db = new sqlite.DatabaseSync(file);
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE cards (id INTEGER PRIMARY KEY, title TEXT)');
  const insert = db.prepare('INSERT INTO cards (title) VALUES (?)');
  for (let i = 0; i < 500; i += 1) insert.run(`card ${i} ${'x'.repeat(200)}`);
  const target = await store.openTarget(path.join(root, 'target'));
  const generation = await store.createGeneration(target, { engine: 'sqlite' });
  const engine = await new SqliteEngine({ files: [file], target, generation, intervalMs: 3600000, onError: error => { throw error; } }).start();
  for (let i = 0; i < 300; i += 1) insert.run(`later ${i}`);
  await sleep(5); await engine.run();
  const middle = Date.now(); await sleep(5);
  db.exec("UPDATE cards SET title = 'changed' WHERE id <= 10; DELETE FROM cards WHERE id > 700");
  await engine.run(); await engine.stop();
  assert.equal(engine.status().deltas, 2);
  assert.ok(engine.status().pages > 0);
  const count = out => { const check = new sqlite.DatabaseSync(out, { readOnly: true });
    try { return check.prepare("SELECT count(*) AS n, sum(title = 'changed') AS changed FROM cards").get(); } finally { check.close(); } };
  const atMiddle = path.join(root, 'restore', 'middle.sqlite');
  await restoreSqlite({ target, name: generation.name, database: 'wekan', until: middle, out: atMiddle, quickCheck });
  assert.deepEqual({ ...count(atMiddle) }, { n: 800, changed: 0 });
  const atEnd = path.join(root, 'restore', 'end.sqlite');
  await restoreSqlite({ target, name: generation.name, database: 'wekan', until: Date.now(), out: atEnd, quickCheck });
  assert.deepEqual({ ...count(atEnd) }, { n: 700, changed: 10 });
  db.close();
  // NEGATIVE: never over an existing file; a changed delta is refused.
  await assert.rejects(restoreSqlite({ target, name: generation.name, database: 'wekan', until: Date.now(), out: atEnd, quickCheck }), /already exists/);
  await assert.rejects(restoreSqlite({ target, name: generation.name, database: '../x', until: Date.now(), out: path.join(root, 'x'), quickCheck }), /Invalid database/);
  await tamper(path.join(generation.dir, 'sqlite', 'wekan', '000000000001.pages'));
  await assert.rejects(restoreSqlite({ target, name: generation.name, database: 'wekan', until: Date.now(),
    out: path.join(root, 'restore', 'tampered.sqlite'), quickCheck }), /has changed/);
  assert.equal(fs.existsSync(path.join(root, 'restore', 'tampered.sqlite')), false);
});

test('file streams: attachments, avatars and logs, with watching, restored to a moment', { timeout: 60000 }, async t => {
  const root = tmpRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const live = path.join(root, 'live');
  const sources = [
    { area: 'attachments', key: 'attachments', path: path.join(live, 'attachments') },
    { area: 'avatars', key: 'avatars', path: path.join(live, 'avatars') },
    { area: 'logs', key: 'logs', path: path.join(live, 'logs') },
    { area: 'logs', key: 'recovery-events.jsonl', path: path.join(live, 'db', 'recovery-events.jsonl'), file: true },
  ];
  for (const source of sources) fs.mkdirSync(source.file ? path.dirname(source.path) : source.path, { recursive: true });
  fs.mkdirSync(path.join(live, 'attachments', 'board'), { recursive: true });
  fs.writeFileSync(path.join(live, 'attachments', 'board', 'one.txt'), 'one');
  fs.writeFileSync(path.join(live, 'avatars', 'me.png'), Buffer.from([1, 2, 3]));
  fs.writeFileSync(path.join(live, 'logs', 'wekan.log'), 'line 1\n');
  fs.writeFileSync(path.join(live, 'db', 'recovery-events.jsonl'), '{"event":1}\n');
  fs.writeFileSync(path.join(root, 'secret'), 'outside');
  fs.symlinkSync(path.join(root, 'secret'), path.join(live, 'attachments', 'link.txt'));
  const target = await store.openTarget(path.join(root, 'target'));
  const generation = await store.createGeneration(target, {});
  let state = {};
  const engine = await new FileEngine({ sources, target, generation, scanMs: 3600000, sealMs: 100,
    onError: error => { throw error; }, onState: async s => { state = s; } }).start();
  // Its seal and scan timers keep the process alive: stop it however this test
  // ends, or a failed assertion below becomes a 300 s suite timeout.
  t.after(() => engine.stop());
  assert.equal(engine.status().files, 4, 'the symbolic link is skipped');
  // Watching notices a change without a rescan (the scan runs hourly here).
  // File-system events can lag by seconds on a loaded machine: allow 20 s.
  fs.appendFileSync(path.join(live, 'logs', 'wekan.log'), 'line 2\n');
  for (let i = 0; i < 200 && engine.status().puts < 5; i += 1) await sleep(100);
  assert.equal(engine.status().puts, 5, 'the appended log line was streamed by watching');
  await sleep(20); const middle = Date.now(); await sleep(20);
  fs.writeFileSync(path.join(live, 'attachments', 'board', 'one.txt'), 'one, edited');
  fs.writeFileSync(path.join(live, 'attachments', 'board', 'two.txt'), 'two');
  fs.rmSync(path.join(live, 'avatars', 'me.png'));
  await engine.scan(); await engine.stop();
  assert.equal(Object.keys(state.known).length, 4, 'two added, the avatar deleted');
  // The same content twice is stored once.
  fs.writeFileSync(path.join(live, 'attachments', 'board', 'copy.txt'), 'two');
  const again = await new FileEngine({ sources, target, generation, state, watch: false, onError: error => { throw error; } }).start();
  await again.stop();
  assert.equal(again.status().puts, 1);
  const blobs = fs.readdirSync(path.join(target, 'blobs')).filter(n => /^[a-f0-9]{2}$/.test(n))
    .flatMap(prefix => fs.readdirSync(path.join(target, 'blobs', prefix)));
  assert.equal(blobs.length, 7);

  const roots = dir => Object.fromEntries(sources.map(source => [`${source.area}\0${source.key}`,
    { path: path.join(dir, path.relative(live, source.path)), file: !!source.file }]));
  const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8');
  const restoredMiddle = path.join(root, 'restore-middle');
  const result = await restoreFiles({ target, name: generation.name, until: middle, roots: roots(restoredMiddle), mode: 'replace-all' });
  assert.equal(result.files, 4);
  assert.equal(read(restoredMiddle, 'attachments/board/one.txt'), 'one');
  assert.equal(read(restoredMiddle, 'logs/wekan.log'), 'line 1\nline 2\n');
  assert.equal(read(restoredMiddle, 'db/recovery-events.jsonl'), '{"event":1}\n');
  assert.deepEqual([...fs.readFileSync(path.join(restoredMiddle, 'avatars', 'me.png'))], [1, 2, 3]);
  assert.equal(fs.existsSync(path.join(restoredMiddle, 'attachments', 'link.txt')), false);
  // Replace-all onto the live tree: back to `middle`, files created since removed.
  await restoreFiles({ target, name: generation.name, until: middle, roots: roots(live), mode: 'replace-all' });
  assert.equal(read(live, 'attachments/board/one.txt'), 'one');
  assert.equal(fs.existsSync(path.join(live, 'attachments', 'board', 'two.txt')), false);
  assert.equal(fs.existsSync(path.join(live, 'avatars', 'me.png')), true);
  assert.equal(fs.lstatSync(path.join(live, 'attachments', 'link.txt')).isSymbolicLink(), true, 'a link is not a file the backup owns');
  // Add-missing never overwrites.
  fs.writeFileSync(path.join(live, 'attachments', 'board', 'one.txt'), 'local edit');
  await restoreFiles({ target, name: generation.name, until: Date.now(), roots: roots(live), mode: 'add-missing' });
  assert.equal(read(live, 'attachments/board/one.txt'), 'local edit');
  assert.equal(read(live, 'attachments/board/two.txt'), 'two');

  // A root that is itself a link (attachments on another disk) is followed.
  const disk = path.join(root, 'other-disk'); fs.mkdirSync(disk);
  const viaLink = path.join(root, 'via-link'); fs.mkdirSync(viaLink);
  fs.symlinkSync(disk, path.join(viaLink, 'attachments'));
  await restoreFiles({ target, name: generation.name, until: middle, roots: roots(viaLink), mode: 'replace-all' });
  assert.equal(fs.readFileSync(path.join(disk, 'board', 'one.txt'), 'utf8'), 'one');
  // NEGATIVE: a link BELOW a root is never followed, and a changed blob is refused.
  const linked = path.join(root, 'linked');
  fs.mkdirSync(path.join(root, 'elsewhere'));
  fs.mkdirSync(path.join(linked, 'attachments'), { recursive: true });
  fs.symlinkSync(path.join(root, 'elsewhere'), path.join(linked, 'attachments', 'board'));
  await assert.rejects(restoreFiles({ target, name: generation.name, until: Date.now(), roots: roots(linked), mode: 'replace-all' }), /symbolic link/);
  assert.deepEqual(fs.readdirSync(path.join(root, 'elsewhere')), []);
  const blob = store.blobPath(target, require('node:crypto').createHash('sha256').update('two').digest('hex'));
  fs.writeFileSync(blob, 'evil');
  const clean = path.join(root, 'restore-clean');
  await assert.rejects(restoreFiles({ target, name: generation.name, until: Date.now(), roots: roots(clean), mode: 'replace-all' }), /missing or changed/);
  assert.equal(fs.existsSync(clean), false, 'nothing is written when one blob is wrong');
});

test('Litestream supervisor: configuration, no shell, restarts when it exits, stops cleanly', { skip: process.platform === 'win32', timeout: 30000 }, async t => {
  const root = tmpRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const config = litestreamConfig(['/data/db/wekan.sqlite', '/data/db/odd "name".sqlite'], 's3://bucket/wekan/');
  assert.match(config, /path: "\/data\/db\/wekan\.sqlite"\n {4}replicas:\n {6}- url: "s3:\/\/bucket\/wekan\/wekan"/);
  assert.match(config, /path: "\/data\/db\/odd \\"name\\"\.sqlite"/, 'a quote in a path cannot add YAML of its own');
  const binary = path.join(root, 'litestream');
  const marker = path.join(root, 'starts');
  fs.writeFileSync(binary, `#!/bin/sh\necho "$@" >> "${marker}"\nif [ ! -f "${marker}.second" ]; then touch "${marker}.second"; exit 3; fi\necho replicating\nexec sleep 30\n`, { mode: 0o755 });
  assert.equal(LitestreamEngine.available(binary), true);
  assert.equal(LitestreamEngine.available('litestream'), false, 'a bare name is not looked up on PATH');
  const errors = [];
  const engine = await new LitestreamEngine({ binary, files: [path.join(root, 'wekan.sqlite')], replicaUrl: 'file:///backup',
    target: root, onError: error => errors.push(error.message) }).start();
  for (let i = 0; i < 60 && engine.status().starts < 2; i += 1) await sleep(100);
  for (let i = 0; i < 30 && !engine.status().output.includes('replicating'); i += 1) await sleep(100);
  assert.equal(engine.status().starts, 2, 'restarted after it exited');
  assert.equal(engine.status().lastExitCode, 3);
  assert.match(errors[0], /exited with code 3/);
  assert.ok(engine.status().running);
  assert.match(fs.readFileSync(marker, 'utf8'), new RegExp(`^replicate -config ${root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/litestream\\.yml$`, 'm'));
  await engine.stop();
  assert.equal(engine.status().running, false);
});

test('encrypted stream: no plaintext at rest, restores with the key, refused without it', { timeout: 120000 }, async t => {
  const root = tmpRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const MARK = 'PLAINTEXT-MARKER-6f1c';
  const target = path.join(root, 'target');
  const { cipher } = await store.openStream(target, 'an administrator passphrase');
  const generation = await store.createGeneration(target, { encrypted: true });
  // Files and logs.
  const live = path.join(root, 'live');
  const sources = [{ area: 'attachments', key: 'attachments', path: path.join(live, 'attachments') }];
  fs.mkdirSync(sources[0].path, { recursive: true });
  fs.writeFileSync(path.join(sources[0].path, 'secret.txt'), `${MARK} attachment`);
  let state = {};
  const files = await new FileEngine({ sources, target, generation, cipher, watch: false, onError: error => { throw error; },
    onState: async s => { state = s; await store.writeState(target, { files: s }, cipher); } }).start();
  await files.stop();
  // SQLite pages.
  if (nodeSqlite()) {
    const sqlite = nodeSqlite();
    fs.mkdirSync(path.join(root, 'db'));
    const file = path.join(root, 'db', 'wekan.sqlite');
    const db = new sqlite.DatabaseSync(file);
    db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE t (v TEXT); INSERT INTO t VALUES ('${MARK} row')`);
    const engine = await new SqliteEngine({ files: [file], target, generation, cipher, intervalMs: 3600000, onError: error => { throw error; } }).start();
    db.exec(`INSERT INTO t VALUES ('${MARK} later')`);
    await engine.run(); await engine.stop(); db.close();
    const out = path.join(root, 'restored.sqlite');
    await restoreSqlite({ target, name: generation.name, database: 'wekan', until: Date.now(), out, quickCheck, cipher });
    const check = new sqlite.DatabaseSync(out, { readOnly: true });
    assert.equal(check.prepare('SELECT count(*) AS n FROM t').get().n, 2);
    check.close();
    fs.rmSync(out);
  }
  // Nothing in the target is readable without the key.
  const all = [];
  const walkAll = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name); if (e.isDirectory()) walkAll(p); else all.push(p); } };
  walkAll(target);
  for (const file of all) assert.equal(fs.readFileSync(file).includes(MARK), false, `${path.relative(target, file)} holds plaintext`);
  assert.equal(all.some(f => f.includes(require('node:crypto').createHash('sha256').update(`${MARK} attachment`).digest('hex'))), false,
    'no blob is named by the content hash');

  const roots = { 'attachments\0attachments': { path: path.join(root, 'restored-attachments'), file: false } };
  const restored = await restoreFiles({ target, name: generation.name, until: Date.now(), roots, mode: 'replace-all', cipher });
  assert.equal(restored.written, 1);
  assert.equal(fs.readFileSync(path.join(root, 'restored-attachments', 'secret.txt'), 'utf8'), `${MARK} attachment`);
  assert.deepEqual(fs.readdirSync(path.join(target, 'restore')), [], 'the decrypted staging is removed');
  // NEGATIVE: without the key, with a wrong key, or with a changed blob.
  const elsewhere = { 'attachments\0attachments': { path: path.join(root, 'nowhere'), file: false } };
  await assert.rejects(restoreFiles({ target, name: generation.name, until: Date.now(), roots: elsewhere, mode: 'replace-all' }), /key is needed/);
  await assert.rejects(store.openStream(target, 'not the passphrase at all'), /not the key of this backup/);
  const blob = all.find(f => f.includes(`${path.sep}blobs${path.sep}`) && !f.includes('.incoming'));
  const bytes = fs.readFileSync(blob); bytes[bytes.length - 3] ^= 1; fs.writeFileSync(blob, bytes);
  await assert.rejects(restoreFiles({ target, name: generation.name, until: Date.now(), roots: elsewhere, mode: 'replace-all', cipher }), /missing or changed/);
  assert.equal(fs.existsSync(path.join(root, 'nowhere')), false);
});

test('encrypted oplog stream: the base and records are sealed and restore with the key', { skip: !uri, timeout: 120000 }, async t => {
  const { MongoClient, BSON, ObjectId } = require('mongodb');
  const { ZipArchive } = await import('archiver');
  const tools = require('../../server/lib/fullBackup').createBackupTools(BSON.EJSON);
  const root = tmpRoot();
  const client = new MongoClient(uri); await client.connect();
  const token = new ObjectId().toHexString();
  const dbName = `cb_enc_${token}`, source = client.db(dbName), restored = client.db(`cb_enc_restore_${token}`);
  t.after(async () => { await source.dropDatabase(); await restored.dropDatabase(); await client.close(); fs.rmSync(root, { recursive: true, force: true }); });
  await source.collection('cards').insertOne({ _id: 'a', title: 'BASE-SECRET-91' });
  const { target, cipher } = await store.openStream(path.join(root, 'target'), 'b'.repeat(64));
  const generation = await store.createGeneration(target, { engine: 'oplog', encrypted: true });
  const engine = await new OplogEngine({ client, dbName, target, generation, cipher, EJSON: BSON.EJSON, Timestamp: BSON.Timestamp,
    ZipArchive, appendInstanceBackup: tools.appendInstanceBackup, sealMs: 200, onError: error => { throw error; } }).start(null);
  await source.collection('cards').insertOne({ _id: 'b', title: 'RECORD-SECRET-92' });
  await sleep(1500); await engine.stop();
  for (const file of [path.join(generation.dir, 'base.zip'), path.join(generation.dir, 'db', '000000000001.ndjson')]) {
    const data = fs.readFileSync(file);
    assert.equal(data.includes('BASE-SECRET-91') || data.includes('RECORD-SECRET-92'), false, file);
  }
  await restoreDatabase({ target, name: generation.name, until: Date.now(), db: restored, filesRoot: path.join(root, 'files'),
    mode: 'replace-all', EJSON: BSON.EJSON, ...tools, cipher });
  assert.deepEqual((await restored.collection('cards').find({}).sort({ _id: 1 }).toArray()).map(d => d.title), ['BASE-SECRET-91', 'RECORD-SECRET-92']);
  assert.deepEqual(fs.readdirSync(path.join(target, 'restore')), [], 'the decrypted base is removed');
  await assert.rejects(restoreDatabase({ target, name: generation.name, until: Date.now(), db: restored, filesRoot: root,
    mode: 'replace-all', EJSON: BSON.EJSON, ...tools }), /key is needed/);
});
