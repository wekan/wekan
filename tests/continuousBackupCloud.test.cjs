'use strict';
// Cloud upload of continuous backup (maintainer decision of 2026-10-03):
// server/lib/continuousBackup/cloud.js mirrors the target to a remote and
// fetches it back. The remote here is a directory, and the adapter wrapper is
// driven by a stand-in that answers the way the @tweedegolf adapters do; a
// live S3, Azure or GCS account is not part of this test.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const store = require('../server/lib/continuousBackup/store');
const { FileEngine } = require('../server/lib/continuousBackup/files');
const { restoreFiles } = require('../server/lib/continuousBackup/restore');
const { CloudMirror, fetchFromCloud, adapterRemote, remoteKey, checkPrefix } = require('../server/lib/continuousBackup/cloud');
const { validateSettings } = require('../models/lib/continuousBackup');

const root = path.join(__dirname, '..');
const sandbox = () => fs.mkdtempSync(path.join(process.env.TMPDIR || path.join(root, '.tools', 'tmp'), 'cb-cloud-'));
// A remote that is a directory, recording the order of its writes.
function dirRemote(dir, { failOn = null } = {}) {
  const puts = [], removes = [];
  const file = key => path.join(dir, ...key.split('/'));
  return {
    puts, removes,
    put: async (key, from) => {
      if (failOn && failOn(key)) throw new Error('network down');
      fs.mkdirSync(path.dirname(file(key)), { recursive: true }); fs.copyFileSync(from, file(key)); puts.push(key);
    },
    get: async (key, to) => fs.copyFileSync(file(key), to, fs.constants.COPYFILE_EXCL),
    remove: async key => { fs.rmSync(file(key), { force: true }); removes.push(key); },
    list: async prefix => {
      const out = [];
      const walk = (d, p) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const k = p ? `${p}/${e.name}` : e.name; if (e.isDirectory()) walk(path.join(d, e.name), k); else out.push(k); } };
      walk(dir, '');
      return out.filter(k => k.startsWith(prefix));
    },
  };
}
async function streamWithFiles(base, secret) {
  const live = path.join(base, 'live', 'attachments');
  fs.mkdirSync(live, { recursive: true });
  fs.writeFileSync(path.join(live, 'a.txt'), 'CLOUD-SECRET-a');
  const { target, cipher } = await store.openStream(path.join(base, 'target'), secret);
  const generation = await store.createGeneration(target, { encrypted: cipher.encrypted });
  const sources = [{ area: 'attachments', key: 'attachments', path: live }];
  const engine = await new FileEngine({ sources, target, generation, cipher, watch: false, onError: e => { throw e; },
    onState: s => store.writeState(target, { files: s }, cipher) }).start();
  return { target, cipher, generation, live, sources, engine };
}

test('the target is mirrored: contents before the indexes that name them, once each, changes again', async t => {
  const base = sandbox(); t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const { target, generation, live, engine } = await streamWithFiles(base, null);
  const remote = dirRemote(path.join(base, 'bucket'));
  const mirror = new CloudMirror({ target, remote, prefix: 'wekan/backup', intervalMs: 3600000 });
  await mirror.sync();
  const keys = remote.puts.map(k => k.replace('wekan/backup/', ''));
  assert.ok(keys.includes('stream.json'));
  const segment = keys.findIndex(k => /files\/000000000001\.ndjson$/.test(k));
  const index = keys.findIndex(k => /files\/index\.ndjson$/.test(k));
  assert.ok(segment >= 0 && index > segment, 'the index after the segment it names');
  assert.ok(keys.some(k => k.startsWith('blobs/')));
  assert.equal(keys.some(k => /state\.json|upload\.json|\.partial|\.incoming/.test(k)), false, 'local-only files stay local');
  // Nothing new: nothing uploaded.
  remote.puts.length = 0; await mirror.sync(); assert.deepEqual(remote.puts, []);
  // A new file: its blob and segment, then the grown index again.
  fs.writeFileSync(path.join(live, 'b.txt'), 'second'); await engine.scan(); await engine.stop();
  await mirror.sync();
  assert.ok(remote.puts.some(k => /files\/000000000002\.ndjson$/.test(k)));
  assert.equal(remote.puts.at(-1).endsWith('index.ndjson') || remote.puts.at(-1).endsWith('generation.json'), true);
  // Retention removed the generation here: it goes there, indexes first.
  fs.rmSync(generation.dir, { recursive: true });
  await mirror.sync();
  assert.ok(remote.removes.length > 0);
  assert.equal(fs.existsSync(path.join(base, 'bucket', 'wekan', 'backup', 'generations', generation.name)) &&
    fs.readdirSync(path.join(base, 'bucket', 'wekan', 'backup', 'generations', generation.name), { recursive: true })
      .some(n => String(n).endsWith('.ndjson')), false);
  const firstIndex = remote.removes.findIndex(k => k.endsWith('index.ndjson'));
  const firstSegment = remote.removes.findIndex(k => /0{11}1\.ndjson$/.test(k));
  assert.ok(firstIndex < firstSegment, 'the index goes before what it names');
});

test('an encrypted stream uploads no plaintext, and a lost target comes back from the cloud and restores', async t => {
  const base = sandbox(); t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const { target, generation, sources, engine } = await streamWithFiles(base, 'a cloud passphrase long');
  await engine.stop();
  const bucket = path.join(base, 'bucket');
  const remote = dirRemote(bucket);
  await new CloudMirror({ target, remote, prefix: 'wb', intervalMs: 3600000 }).sync();
  for (const key of await remote.list('wb/')) {
    assert.equal(fs.readFileSync(path.join(bucket, ...key.split('/'))).includes('CLOUD-SECRET'), false, key);
  }
  // The disk is lost.
  fs.rmSync(target, { recursive: true });
  fs.mkdirSync(target);
  const { fetched } = await fetchFromCloud({ target, remote, prefix: 'wb' });
  assert.ok(fetched >= 5);
  const { cipher } = await store.openStream(target, 'a cloud passphrase long');
  const roots = { 'attachments\0attachments': { path: path.join(base, 'restored'), file: false } };
  await restoreFiles({ target, name: generation.name, until: Date.now(), roots, mode: 'replace-all', cipher });
  assert.equal(fs.readFileSync(path.join(base, 'restored', 'a.txt'), 'utf8'), 'CLOUD-SECRET-a');
  assert.ok(sources.length);
  // Fetching again keeps what is here.
  assert.equal((await fetchFromCloud({ target, remote, prefix: 'wb' })).fetched, 0);
});

test('NEGATIVE: a failed upload is retried, and nothing is recorded as uploaded that was not', async t => {
  const base = sandbox(); t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const { target, engine } = await streamWithFiles(base, null);
  await engine.stop();
  let down = true;
  const remote = dirRemote(path.join(base, 'bucket'), { failOn: key => down && key.includes('/blobs/') });
  const mirror = new CloudMirror({ target, remote, prefix: 'p', intervalMs: 3600000 });
  await assert.rejects(mirror.sync(), /network down/);
  assert.equal(remote.puts.some(k => k.endsWith('index.ndjson')), false, 'no index uploaded before its contents');
  down = false;
  await mirror.sync();
  assert.ok(remote.puts.some(k => k.includes('/blobs/')));
  assert.ok(remote.puts.some(k => k.endsWith('files/index.ndjson')));
});

test('NEGATIVE: keys and prefixes never walk out of the folder', () => {
  for (const relative of ['../x', 'a/../b', 'a//b', '', 'a\\b']) assert.throws(() => remoteKey('p', relative), /Unsafe/, relative);
  for (const prefix of ['', '/abs', 'a/../b', '..', 'a b', 'a//b']) assert.throws(() => checkPrefix(prefix), /Invalid upload prefix/, prefix);
  assert.equal(remoteKey('wekan/cb', 'blobs/aa/b'), 'wekan/cb/blobs/aa/b');
  for (const uploadPrefix of ['', '../x', 'a b']) assert.throws(() => validateSettings({ uploadPrefix }, {}), /prefix/);
  assert.throws(() => validateSettings({ upload: 'ftp' }, {}), /Unknown upload storage/);
  assert.equal(validateSettings({ upload: 's3', uploadPrefix: 'wekan/cb' }, {}).upload, 's3');
});

test('the adapter wrapper: answers with { value, error }, an error is thrown, listing filters the prefix', async t => {
  const base = sandbox(); t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const objects = new Map();
  const storage = {
    addFileFromStream: async ({ bucketName, targetPath, stream }) => {
      const chunks = []; for await (const c of stream) chunks.push(c);
      objects.set(`${bucketName}:${targetPath}`, Buffer.concat(chunks)); return { value: 'ok', error: null };
    },
    getFileAsStream: async (bucketName, key) => objects.has(`${bucketName}:${key}`)
      ? { value: Readable.from([objects.get(`${bucketName}:${key}`)]), error: null } : { value: null, error: 'NoSuchKey' },
    removeFile: async (bucketName, key) => { objects.delete(`${bucketName}:${key}`); return { value: 'ok', error: null }; },
    listFiles: async (bucketName, numFiles) => {
      assert.ok(numFiles > 10000, 'asks for more than the adapters\' default 10,000');
      return { value: [...objects.keys()].filter(k => k.startsWith(`${bucketName}:`)).map(k => [k.slice(bucketName.length + 1), 1]), error: null };
    },
  };
  const remote = adapterRemote(storage, 'bucket');
  fs.writeFileSync(path.join(base, 'f'), 'bytes');
  await remote.put('cb/f', path.join(base, 'f'));
  await remote.put('attachments/other', path.join(base, 'f'));
  assert.deepEqual(await remote.list('cb/'), ['cb/f']);
  await remote.get('cb/f', path.join(base, 'g'));
  assert.equal(fs.readFileSync(path.join(base, 'g'), 'utf8'), 'bytes');
  await assert.rejects(remote.get('cb/missing', path.join(base, 'h')), /NoSuchKey/);
  await remote.remove('cb/f');
  assert.deepEqual(await remote.list('cb/'), []);
});
