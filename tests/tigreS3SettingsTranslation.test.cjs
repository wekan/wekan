'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const tigre = read('tig');
const english = read('en');
const keys = [
  's3-file-id', 's3-minio-storage-description', 's3-disabled',
  's3-access-key', 's3-bucket', 's3-bucket-description',
  's3-connection-failed', 's3-connection-success', 's3-enabled',
  's3-endpoint', 's3-endpoint-description', 's3-minio-storage',
  's3-port', 's3-port-description', 's3-region', 's3-secret-key',
  's3-secret-key-required', 's3-settings-saved', 's3-ssl-enabled',
  's3-attachments', 's3-size',
];
const ledger = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/audited-corrections.json'), 'utf8'));
for (const key of keys) {
  assert.notEqual(tigre[key], english[key], `${key}: English placeholder`);
  assert.match(tigre[key], /[\u1200-\u137f]/u, `${key}: Tigre text`);
  const records = ledger.filter(row => row.locale === 'tig' && row.key === key);
  assert.equal(records.length, 1, `${key}: one correction record`);
  assert.equal(records[0].before, english[key]);
  assert.equal(records[0].after, tigre[key]);
}
assert.equal(tigre['s3-storage'], 'S3', 'bare protocol label stays literal');
assert.match(tigre['s3-endpoint'], /ኣድራሻ Endpoint S3/u,
  'technical Endpoint label includes the existing address noun');
assert.match(tigre['s3-connection-failed'], /ፈሺሉ/u);
assert.match(tigre['s3-connection-success'], /ተሳኺዑ/u);
assert.notEqual(tigre['s3-connection-failed'], tigre['s3-connection-success']);
assert.match(tigre['s3-enabled'], /ነቒሑ/u);
assert.match(tigre['s3-disabled'], /ጠፊኡ/u);
assert.match(tigre['s3-bucket-description'], /ፋይላት/u,
  'corpus-attested file plural stays consistent with other Tigre values');
assert.match(tigre['s3-port-description'], /ቁጽሪ/u);
assert.match(tigre['s3-endpoint-description'],
  /s3\.amazonaws\.com.*minio\.example\.com/u);
assert.match(tigre['s3-minio-storage-description'],
  /AWS S3.*MinIO.*Cloudflare R2.*Backblaze B2.*Wasabi.*DigitalOcean Spaces/u);
assert.equal(tigre['s3-access-key-description'].includes('AWS S3'), true,
  'already-translated access-key help remains intact');
console.log(`Tigre S3 settings: ${keys.length} fills and literal/meaning checks pass.`);
