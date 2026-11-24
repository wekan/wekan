'use strict';

// P3 (docs/Compliance/README.md): BACKUP_PASSPHRASE - the Admin Panel backup
// encrypted as it is written, and decrypted when restored.
// Run: node --test tests/backupEncryption.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const E = require('../server/lib/backupEncryption');
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || path.join(ROOT, '.tools', 'tmp'), 'backup-enc-'));
const PASS = 'correct horse battery staple';

async function encryptTo(file, data, pass = PASS) {
  await pipeline(Readable.from([data.subarray(0, 1000), data.subarray(1000)]), E.encryptStream(pass), fs.createWriteStream(file));
}

test('round trip: what is written encrypted is restored exactly', async () => {
  const data = crypto.randomBytes(200000);
  const enc = path.join(TMP, 'a.zip');
  const dec = path.join(TMP, 'a.out');
  await encryptTo(enc, data);
  assert.equal(await E.isEncryptedBackup(enc), true);
  assert.ok(!fs.readFileSync(enc).includes(data.subarray(5000, 5064)), 'nothing of the plain text is in the file');
  await E.decryptBackup(enc, dec, PASS);
  assert.ok(fs.readFileSync(dec).equals(data));
});

test('negative: a wrong passphrase, a changed file and no passphrase are refused, leaving nothing', async () => {
  const data = Buffer.from('PK backup contents '.repeat(1000));
  const enc = path.join(TMP, 'b.zip');
  await encryptTo(enc, data);
  await assert.rejects(E.decryptBackup(enc, path.join(TMP, 'b1'), 'a different passphrase entirely'), /passphrase is wrong/);
  assert.equal(fs.existsSync(path.join(TMP, 'b1')), false, 'nothing half-decrypted is kept');
  const bytes = fs.readFileSync(enc);
  bytes[bytes.length - 40] ^= 1;
  fs.writeFileSync(path.join(TMP, 'c.zip'), bytes);
  await assert.rejects(E.decryptBackup(path.join(TMP, 'c.zip'), path.join(TMP, 'c1'), PASS), /changed/);
  assert.equal(fs.existsSync(path.join(TMP, 'c1')), false);
  await assert.rejects(E.decryptBackup(enc, path.join(TMP, 'b2'), ''), /set BACKUP_PASSPHRASE/);
});

test('a plain backup is recognised as plain, and a short passphrase is not used', async () => {
  const plain = path.join(TMP, 'plain.zip');
  fs.writeFileSync(plain, Buffer.from('PK\u0003\u0004 an old backup'));
  assert.equal(await E.isEncryptedBackup(plain), false);
  assert.equal(E.backupPassphrase({ BACKUP_PASSPHRASE: 'short' }), '');
  assert.equal(E.backupPassphrase({ BACKUP_PASSPHRASE: PASS }), PASS);
  assert.equal(E.backupPassphrase({}), '');
});

test('the backup writes through it to disk and cloud, and the restore decrypts and cleans up', () => {
  const b = read('server/methods/backup.js');
  assert.match(b, /source = archive\.pipe\(encrypt\);/);
  assert.match(b, /source\.pipe\(out\);/);
  assert.match(b, /streamArchiveToCloud\(source, storageName, key\)/);
  assert.doesNotMatch(b, /archive\.pipe\(out\)|await streamArchiveToCloud\(archive,/, 'no path writes the plain archive past it');
  assert.match(b, /if \(await backupCrypto\.isEncryptedBackup\(givenPath\)\) \{/);
  assert.match(b, /if \(decrypted\) fs\.promises\.rm\(decrypted, \{ force: true \}\)/);
});

test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));
