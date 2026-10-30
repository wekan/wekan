'use strict';

// Encryption at rest in S3: Admin Panel / Attachments / S3 / Server-side
// encryption (models/lib/s3Encryption.js).
//
//  - test: SSE-S3 and SSE-KMS (with or without a key) become the PutObject
//    parameters of every attachment and avatar upload, of a renamed object,
//    and of a backup;
//  - negative: nothing is added when nothing is chosen, a value that is not a
//    choice or a malformed key adds nothing, and the other providers get no
//    S3 parameters;
//  - the Admin Panel form reads and shows the choice.
//
// Run: node tests/s3Encryption.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const { s3EncryptionOptions } = require('../models/lib/s3Encryption');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('SSE-S3 and SSE-KMS become PutObject parameters', () => {
  assert.deepStrictEqual(s3EncryptionOptions({ serverSideEncryption: 'AES256' }), { ServerSideEncryption: 'AES256' });
  assert.deepStrictEqual(s3EncryptionOptions({ serverSideEncryption: 'aws:kms' }), { ServerSideEncryption: 'aws:kms' });
  const arn = 'arn:aws:kms:eu-north-1:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab';
  assert.deepStrictEqual(s3EncryptionOptions({ serverSideEncryption: 'aws:kms', sseKmsKeyId: ` ${arn} ` }),
    { ServerSideEncryption: 'aws:kms', SSEKMSKeyId: arn });
  assert.deepStrictEqual(s3EncryptionOptions({ serverSideEncryption: 'aws:kms', sseKmsKeyId: 'alias/wekan' }),
    { ServerSideEncryption: 'aws:kms', SSEKMSKeyId: 'alias/wekan' });
});

test('negative: nothing chosen, an unknown choice or a malformed key adds nothing', () => {
  for (const cfg of [undefined, {}, { serverSideEncryption: '' }, { serverSideEncryption: 'aes256' },
    { serverSideEncryption: 'aws:kms:dsse' }, { serverSideEncryption: { $ne: 1 } },
    { serverSideEncryption: 'aws:kms', sseKmsKeyId: 'key with spaces' },
    { serverSideEncryption: 'aws:kms', sseKmsKeyId: 'x'.repeat(2049) }]) {
    assert.deepStrictEqual(s3EncryptionOptions(cfg), {}, JSON.stringify(cfg));
  }
});

// The real cloudUploadOptions from models/lib/fileStoreStrategy.js.
function cloudUploadOptions() {
  const src = read('models/lib/fileStoreStrategy.js');
  const start = src.indexOf('function cloudUploadOptions(');
  const end = src.indexOf('\n}\n', start) + 3;
  const context = { STORAGE_NAME_S3: 's3' };
  vm.runInNewContext(`${src.slice(start, end)}\nthis.fn = cloudUploadOptions;`, context);
  // Objects made in the vm have its prototypes; compare plain copies.
  return (...args) => JSON.parse(JSON.stringify(context.fn(...args)));
}

test('every S3 upload and every renamed object carries the encryption; other providers do not', () => {
  const fn = cloudUploadOptions();
  const adapter = { uploadOptions: { ServerSideEncryption: 'AES256' } };
  assert.deepStrictEqual(fn('s3', 1234, adapter), { ServerSideEncryption: 'AES256', ContentLength: 1234 });
  assert.deepStrictEqual(fn('s3', undefined, adapter), { ServerSideEncryption: 'AES256' }, 'a rename streams without a length');
  assert.deepStrictEqual(fn('azure', 1234, adapter), {});
  assert.deepStrictEqual(fn('s3', 10, {}), { ContentLength: 10 }, 'negative: no choice, no encryption parameter');
  const strategy = read('models/lib/fileStoreStrategy.js');
  assert.match(strategy, /options: cloudUploadOptions\(this\.provider, stat\.size, adapter\)/);
  assert.match(strategy, /options: cloudUploadOptions\(this\.provider, undefined, adapter\)/);
  assert.match(read('models/lib/cloudStorage.js'),
    /uploadOptions: provider === STORAGE_NAME_S3 \? require\('\.\/s3Encryption'\)\.s3EncryptionOptions\(cfg\) : \{\}/);
});

test('a backup written to S3 is encrypted like the attachments', () => {
  const backup = read('server/methods/backup.js');
  assert.match(backup, /ContentType: 'application\/zip', \.\.\.s3EncryptionOptions\(cfg\)/);
});

test('negative: no other S3 write path skips the encryption', () => {
  const { execFileSync } = require('child_process');
  const hits = execFileSync('git', ['grep', '-n', '-E', 'PutObjectCommand|new Upload\\(|addFileFromPath\\(\\{|addFileFromStream\\(\\{', '--',
    'server', 'models'], { cwd: repoRoot, encoding: 'utf8' }).split('\n').filter(Boolean)
    .filter(l => !/\/tests?\//.test(l) && !/^[^:]+:\d+:\s*(\/\/|\*)/.test(l));
  // continuousBackup encrypts its own stream before upload ("no plaintext at
  // rest"); webdavAdapter is WebDAV, not S3.
  const allowed = [/^models\/lib\/fileStoreStrategy\.js:/, /^server\/methods\/backup\.js:/,
    /^server\/lib\/continuousBackup\/cloud\.js:/, /^server\/lib\/webdavAdapter\.js:/];
  assert.deepStrictEqual(hits.filter(l => !allowed.some(re => re.test(l))), []);
});

test('the Admin Panel S3 form reads and shows the choice', () => {
  const js = read('client/components/settings/attachments.js');
  assert.match(js, /serverSideEncryption: '#s3-sse',/);
  assert.match(js, /sseKmsKeyId: '#s3-sse-kms-key-id',/);
  const jade = read('client/components/settings/attachments.jade');
  assert.match(jade, /select\.wekan-form-control#s3-sse/);
  assert.match(jade, /option\(value="aws:kms"/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['s3-sse', 's3-sse-none', 's3-sse-description', 's3-sse-kms-key-id']) assert.ok(en[key], key);
});

console.log(`s3Encryption: ${passed} tests passed`);
