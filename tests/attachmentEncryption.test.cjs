'use strict';

// ATTACHMENTS_PASSPHRASE (docs/Compliance/README.md P3): attachments on the
// disk encrypted by WeKan, read back plain - all of a file or any byte range -
// so every URL stays the same.
// Run: node --test tests/attachmentEncryption.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || path.join(ROOT, '.tools', 'tmp'), 'att-enc-'));
process.env.ATTACHMENTS_PASSPHRASE = 'a passphrase for the attachment test';
const E = require('../server/lib/attachmentEncryption');

const collect = async stream => { const parts = []; for await (const c of stream) parts.push(c); return Buffer.concat(parts); };

test('encrypted in place, read back plain - the whole file and any range, plain files as before', async () => {
  const data = crypto.randomBytes(100003);
  const file = path.join(TMP, 'a.bin');
  fs.writeFileSync(file, data);
  assert.ok((await collect(E.createPlainReadStream(file))).equals(data), 'a plain file reads as before');
  assert.equal(await E.encryptFileInPlace(file), true);
  assert.equal(await E.isEncryptedFile(file), true);
  assert.equal(fs.statSync(file).size, data.length + E.HEADER);
  assert.ok(!fs.readFileSync(file).includes(data.subarray(500, 564)), 'nothing of the plain file on the disk');
  assert.ok((await collect(E.createPlainReadStream(file))).equals(data));
  for (const [start, end] of [[0, 0], [1, 15], [15, 16], [17, 4096], [65535, 70000], [100000, 100002]]) {
    assert.ok((await collect(E.createPlainReadStream(file, { start, end }))).equals(data.subarray(start, end + 1)), `${start}-${end}`);
  }
  assert.equal(await E.encryptFileInPlace(file), false, 'encrypting twice does nothing');
  assert.equal(await E.decryptFileInPlace(file), true);
  assert.ok(fs.readFileSync(file).equals(data), 'decrypted back to the same bytes');
});

test('the counter crosses byte boundaries correctly', () => {
  const iv = Buffer.alloc(16, 0xff);
  assert.equal(E.ivAt(iv, 16).toString('hex'), '00'.repeat(16), 'carries all the way');
  assert.equal(E.ivAt(Buffer.alloc(16), 16 * 256).toString('hex'), `${'00'.repeat(14)}0100`);
});

test('negative: without the passphrase an encrypted file is refused, not served as garbage', async () => {
  const file = path.join(TMP, 'b.bin');
  fs.writeFileSync(file, Buffer.from('secret contents'));
  await E.encryptFileInPlace(file);
  const saved = process.env.ATTACHMENTS_PASSPHRASE;
  delete process.env.ATTACHMENTS_PASSPHRASE;
  try {
    assert.throws(() => E.createPlainReadStream(file), /set ATTACHMENTS_PASSPHRASE/);
  } finally {
    process.env.ATTACHMENTS_PASSPHRASE = saved;
  }
  assert.equal(E.attachmentsPassphrase({ ATTACHMENTS_PASSPHRASE: 'short' }), '', 'a short passphrase is not used');
});

test('every reader of an attachment on the disk goes through the decrypting read', () => {
  assert.match(read('models/lib/fileStoreStrategy.js'), /require\('\/server\/lib\/attachmentEncryption'\)\.createPlainReadStream\(chosen, range \|\| undefined\)/);
  const exporter = read('models/exporter.js');
  assert.equal((exporter.match(/createPlainReadStream\(/g) || []).length, 2, 'both attachment reads of the board export');
  assert.match(read('server/lib/webdavAdapter.js'), /createPlainReadStream\(origPath\)/);
  const upload = read('models/attachments.server.js');
  assert.ok(upload.indexOf('encryptNewAttachment(fileObjId)') > upload.indexOf('indexNewAttachment(fileObjId)'), 'after indexing, which reads the plain file');
});

test('the pane: only while the passphrase is set, site administrators only, audited', () => {
  const run = read('server/lib/attachmentEncryptionRun.js');
  assert.match(run, /if \(!enc\.attachmentsPassphrase\(\)\) throw new Meteor\.Error\('attachment-encryption-off'/);
  assert.match(run, /if \(!user \|\| user\.loginDisabled \|\| !isSiteAdmin\(user\)\) throw new Meteor\.Error\('not-authorized'\);/);
  const audited = require('../models/lib/adminAudit').AUDITED_METHODS;
  for (const m of ['setEncryptNewAttachments', 'encryptAllAttachments', 'decryptAllAttachments']) assert.ok(audited.includes(m), m);
  assert.match(read('client/components/settings/attachments.js'), /\.\.\.\(encryptionAvailable\.get\(\) \? \[\{ id: 'encrypt'/);
  assert.match(run, /'meta\.updatedAt': new Date\(\)/, 'the integrity scan sees the change explained');
});

test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));
