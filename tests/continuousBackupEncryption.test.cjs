'use strict';
// Encryption at rest for continuous backup (maintainer decision of
// 2026-10-03): server/lib/continuousBackup/encryption.js and how the store
// uses it. Positive and negative cases: round trips, a changed byte, a wrong
// key, a short passphrase, blob names, the stream's key check, encrypted state.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const enc = require('../server/lib/continuousBackup/encryption');
const store = require('../server/lib/continuousBackup/store');
const { validateSettings } = require('../models/lib/continuousBackup');

const root = path.join(__dirname, '..');
const sandbox = () => fs.mkdtempSync(path.join(process.env.TMPDIR || path.join(root, '.tools', 'tmp'), 'cb-encryption-'));
const hexKey = 'a'.repeat(64);
const cipher = enc.cipherFor(enc.deriveKey(hexKey, '00'));

test('buffers round trip, and every encryption differs', () => {
  const data = Buffer.from('secret board content');
  const once = cipher.encrypt(data), twice = cipher.encrypt(data);
  assert.notDeepEqual(once, twice, 'a fresh IV each time');
  assert.equal(once.includes(data), false);
  assert.deepEqual(cipher.decrypt(once), data);
  assert.deepEqual(cipher.decrypt(cipher.encrypt(Buffer.alloc(0))), Buffer.alloc(0));
});

test('NEGATIVE: a changed byte, a wrong key or a plain file is refused', () => {
  const sealed = cipher.encrypt(Buffer.from('secret'));
  const changed = Buffer.from(sealed); changed[changed.length - 20] ^= 1;
  assert.throws(() => cipher.decrypt(changed), /changed or the key is wrong/);
  const other = enc.cipherFor(enc.deriveKey('b'.repeat(64), '00'));
  assert.throws(() => other.decrypt(sealed), /changed or the key is wrong/);
  assert.throws(() => cipher.decrypt(Buffer.from('plain text, not sealed')), /Not an encrypted/);
});

test('streams round trip through a file, and a changed file leaves no output', async t => {
  const dir = sandbox(); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const data = crypto.randomBytes(3 * 1024 * 1024 + 7);
  const sealed = path.join(dir, 'sealed'), opened = path.join(dir, 'opened');
  await pipeline(Readable.from([data.subarray(0, 1000), data.subarray(1000)]), cipher.encryptStream(), fs.createWriteStream(sealed));
  await cipher.decryptFile(sealed, opened);
  assert.ok(fs.readFileSync(opened).equals(data));
  // An empty stream still seals and opens.
  await pipeline(Readable.from([]), cipher.encryptStream(), fs.createWriteStream(path.join(dir, 'empty')));
  await cipher.decryptFile(path.join(dir, 'empty'), path.join(dir, 'empty-opened'));
  assert.equal(fs.readFileSync(path.join(dir, 'empty-opened')).length, 0);
  const bytes = fs.readFileSync(sealed); bytes[500000] ^= 1; fs.writeFileSync(sealed, bytes);
  await assert.rejects(cipher.decryptFile(sealed, path.join(dir, 'tampered')), /changed or the key is wrong/);
  assert.equal(fs.existsSync(path.join(dir, 'tampered')), false);
});

test('keys: 64 hex characters as they are, a passphrase stretched with the salt, a short one refused', () => {
  assert.deepEqual(enc.deriveKey(hexKey, '00'), Buffer.from(hexKey, 'hex'));
  const a = enc.deriveKey('correct horse battery staple', '0011'), b = enc.deriveKey('correct horse battery staple', '0022');
  assert.equal(a.length, 32);
  assert.notDeepEqual(a, b, 'the salt changes the key');
  assert.throws(() => enc.deriveKey('too short', '00'), /at least 16 characters/);
});

test('blob names are keyed: the same content, a different name than its hash, and stable', () => {
  const digest = crypto.createHash('sha256').update('x').digest('hex');
  assert.equal(enc.PLAIN.blobName(digest), digest);
  assert.notEqual(cipher.blobName(digest), digest);
  assert.equal(cipher.blobName(digest), cipher.blobName(digest));
  assert.match(cipher.blobName(digest), /^[a-f0-9]{64}$/);
});

test('a stream remembers its key: the right key opens it, a wrong one is refused', async t => {
  const dir = sandbox(); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const first = await store.openStream(dir, 'my long passphrase 1');
  assert.equal(first.cipher.encrypted, true);
  const header = JSON.parse(fs.readFileSync(path.join(dir, 'stream.json'), 'utf8')).encryption;
  assert.match(header.salt, /^[a-f0-9]{32}$/);
  assert.equal(JSON.stringify(header).includes('my long passphrase'), false);
  const again = await store.openStream(dir, 'my long passphrase 1');
  assert.deepEqual(again.cipher.decrypt(first.cipher.encrypt(Buffer.from('x'))), Buffer.from('x'));
  await assert.rejects(store.openStream(dir, 'another passphrase 2'), /not the key of this backup/);
  // State is sealed, and without the key it starts afresh rather than guess.
  await store.writeState(dir, { generation: 'g', files: { known: { secret: 1 } } }, first.cipher);
  assert.equal(fs.readFileSync(path.join(dir, 'state.json'), 'utf8').includes('secret'), false);
  assert.deepEqual(await store.readState(dir, again.cipher), { generation: 'g', files: { known: { secret: 1 } } });
  assert.deepEqual(await store.readState(dir), {});
  // NEGATIVE: an encrypted generation needs the key.
  assert.throws(() => store.generationCipher({ encrypted: true }, enc.PLAIN), /key is needed/);
  assert.equal(store.generationCipher({ encrypted: false }, first.cipher), enc.PLAIN);
});

test('NEGATIVE: the key file is not a link and holds a usable key', async t => {
  const dir = sandbox(); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'key'), `${hexKey}\n`);
  assert.equal((await enc.readKeyFile(path.join(dir, 'key'))).trim(), hexKey);
  fs.symlinkSync(path.join(dir, 'key'), path.join(dir, 'link'));
  await assert.rejects(enc.readKeyFile(path.join(dir, 'link')), /not a plain file/);
  await assert.rejects(enc.readKeyFile(path.join(dir, 'missing')), /cannot be read/);
});

test('settings: the key file must be absolute and outside the target and every source', () => {
  const sources = ['/data/files/attachments', '/data/logs'];
  const base = { enabled: true, target: '/backup', encrypt: true };
  assert.equal(validateSettings({ ...base, encryptionKeyFile: '/etc/wekan/backup.key' }, { sources }).encrypt, true);
  for (const encryptionKeyFile of ['', 'backup.key', '/backup/key', '/data/files/attachments/key', '/data/logs/key', '/etc/../key']) {
    assert.throws(() => validateSettings({ ...base, encryptionKeyFile }, { sources }), /key file/, encryptionKeyFile);
  }
  assert.equal(validateSettings({ ...base, encrypt: false, encryptionKeyFile: '' }, { sources }).encrypt, false);
});
