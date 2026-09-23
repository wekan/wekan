'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { MongoClient, ObjectId, Binary, Long } = require('mongodb');
const { EJSON } = require('bson');
const { appendInstanceBackup, inspectInstanceBackup, restoreInstanceBackup } = require('../../server/lib/fullBackup');

// An explicit test URI is required; only fresh random databases are modified.
const uri = process.env.WEKAN_BACKUP_TEST_MONGO_URL;
test('real database full-instance backup and restore', { skip: !uri, timeout: 120000 }, async t => {
  const { ZipArchive } = await import('archiver');
  const root = fs.mkdtempSync(path.join(process.env.TMPDIR || path.resolve('.tools/tmp'), 'full-backup-'));
  const client = new MongoClient(uri);
  await client.connect();
  const token = new ObjectId().toHexString();
  const source = client.db(`backup_source_${token}`), target = client.db(`backup_restore_${token}`);
  t.after(async () => {
    await source.dropDatabase(); await target.dropDatabase(); await client.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const bytes = { attachments: Buffer.from('attachment content\n'), avatars: Buffer.from('avatar bytes\0') };
  await source.collection('users').insertOne({ _id: 'user', username: 'backup-test',
    services: { password: { bcrypt: 'a-preserved-hash' } }, profile: { avatar: 'avatars-id' } });
  await source.collection('settings').insertOne({ _id: 'settings', productName: 'Backup test' });
  await source.collection('cards').insertOne({ _id: 'card', title: 'Keep me', createdAt: new Date('2026-09-23'),
    exact: Long.fromString('9007199254740993'), binary: new Binary(Buffer.from([0, 255, 2])) });
  await source.collection('cards').createIndex({ title: 1 }, { name: 'title_index' });
  // Dotted collection names and raw GridFS binary used to be excluded/unrestorable.
  await source.collection('cfs_gridfs.attachments.chunks').insertOne({ _id: new ObjectId(),
    files_id: new ObjectId(), n: 0, data: new Binary(Buffer.from([0, 255, 1])) });
  await source.createCollection('empty_collection');
  for (const [coll, content] of Object.entries(bytes)) {
    await source.collection(coll).insertOne({ _id: `${coll}-id`, name: `${coll}.bin`, size: content.length,
      path: '/old-server/files/not-portable', versions: { original: { size: content.length,
        path: '/old-server/files/not-portable', storage: 's3', meta: { cloudPath: 'old/key' } } } });
  }
  const opts = { attachments: true, avatars: true, data: true };
  async function create(name, reader, options = opts) {
    const archive = new ZipArchive();
    const filename = path.join(root, name);
    const output = pipeline(archive, fs.createWriteStream(filename)); output.catch(() => {});
    try {
      const manifest = await appendInstanceBackup({ archive, db: source, opts: options, readFileVersion: reader });
      await archive.finalize(); await output;
      return { filename, manifest };
    } catch (e) { archive.destroy(e); await output.catch(() => {}); throw e; }
  }
  const read = coll => Readable.from([bytes[coll]]);
  const original = await source.collection('cards').findOne({}, { promoteLongs: false, promoteValues: false });
  const { filename, manifest } = await create('full.zip', read);
  assert.equal(manifest.collections.length, 7);
  const inspected = await inspectInstanceBackup(filename);
  const destination = path.join(root, 'different-server/files');
  await restoreInstanceBackup({ inspected, db: target, filesRoot: destination, mode: 'replace-all' });
  assert.equal((await target.collection('users').findOne({ _id: 'user' })).services.password.bcrypt, 'a-preserved-hash');
  const actual = await target.collection('cards').findOne({}, { promoteLongs: false, promoteValues: false });
  assert.equal(EJSON.stringify(actual), EJSON.stringify(original));
  assert.equal(await target.collection('cfs_gridfs.attachments.chunks').countDocuments(), 1);
  assert.ok((await target.collection('cards').listIndexes().toArray()).some(i => i.name === 'title_index'));
  assert.ok(await target.listCollections({ name: 'empty_collection' }).hasNext());
  for (const [coll, content] of Object.entries(bytes)) {
    const doc = await target.collection(coll).findOne({});
    assert.equal(doc.versions.original.storage, 'fs');
    assert.ok(doc.path.startsWith(destination + path.sep));
    assert.deepEqual(fs.readFileSync(doc.path), content);
  }
  await t.test('add missing preserves existing records and associated bytes', async () => {
    const doc = await target.collection('attachments').findOne({});
    fs.writeFileSync(doc.path, 'new content');
    await target.collection('cards').updateOne({ _id: 'card' }, { $set: { title: 'Newer edit' } });
    await restoreInstanceBackup({ inspected, db: target, filesRoot: destination, mode: 'add-missing' });
    assert.equal((await target.collection('cards').findOne({})).title, 'Newer edit');
    assert.equal(fs.readFileSync(doc.path, 'utf8'), 'new content');
  });
  await t.test('files-only archives include their portable metadata', async () => {
    const result = await create('files-only.zip', read, { attachments: true, avatars: false, data: false });
    const checked = await inspectInstanceBackup(result.filename);
    assert.deepEqual(checked.manifest.collections.map(c => c.name), ['attachments']);
    assert.equal(checked.manifest.files.length, 1);
  });
  await t.test('concurrent file metadata changes cannot produce a complete archive', async () => {
    try {
      await assert.rejects(create('changed.zip', async (coll) => {
        if (coll === 'avatars') await source.collection('attachments').updateOne(
          { _id: 'attachments-id' }, { $set: { 'versions.thumbnail': { size: 12 } } });
        return read(coll);
      }), /metadata changed|payload missing/);
    } finally {
      await source.collection('attachments').updateOne({ _id: 'attachments-id' },
        { $unset: { 'versions.thumbnail': '' } });
    }
  });
  await t.test('missing source bytes fail the backup', async () => {
    await assert.rejects(create('missing.zip', () => Readable.from((async function* () {
      throw new Error('Missing source object');
    })())), /Missing source object/);
  });
  await t.test('short reads fail instead of producing successful truncated backups', async () => {
    await assert.rejects(create('short.zip', () => Readable.from(['x'])), /Incomplete/);
  });
  await t.test('corrupt payload is refused before restore', async () => {
    const corrupt = new ZipArchive(); const out = path.join(root, 'corrupt.zip');
    const done = pipeline(corrupt, fs.createWriteStream(out));
    corrupt.append(JSON.stringify(manifest), { name: 'manifest.json' });
    for (const item of [...manifest.files, ...manifest.collections]) corrupt.append('broken', { name: item.path });
    await corrupt.finalize(); await done;
    await assert.rejects(inspectInstanceBackup(out), /checksum/);
    assert.equal((await target.collection('cards').findOne({})).title, 'Newer edit');
  });
  await t.test('destination symlink cannot redirect extracted files', async () => {
    const unsafe = path.join(root, 'unsafe'); fs.mkdirSync(unsafe);
    fs.symlinkSync(root, path.join(unsafe, 'attachments'));
    await assert.rejects(restoreInstanceBackup({ inspected, db: target, filesRoot: unsafe, mode: 'replace-all' }), /Symlink/);
  });
  await t.test('database write failures propagate', async () => {
    // A real unique-index conflict, not a mocked Mongo call.
    await target.collection('cards').insertOne({ _id: 'other', title: 'Keep me' });
    await target.collection('cards').dropIndex('title_index');
    await target.collection('cards').createIndex({ title: 1 }, { unique: true, name: 'unique_title' });
    await target.collection('cards').deleteOne({ _id: 'card' });
    await assert.rejects(restoreInstanceBackup({ inspected, db: target, filesRoot: destination, mode: 'add-missing' }));
  });
});
