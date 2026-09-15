'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const tigre = read('tig');
const tigrinya = read('ti');
for (const key of ['api-report-desc', 's3-endpoint-menu-path',
  'api-endpoints']) {
  assert.match(english[key], /\bendpoints?\b/i, `${key}: source sense`);
  assert.match(tigre[key], /Endpoints?/, `${key}: technical term`);
  assert.doesNotMatch(tigre[key], /መወዳእታ/u,
    `${key}: must not call an Endpoint an end`);
  assert.notEqual(tigre[key], tigrinya[key], `${key}: seed removed`);
}
assert.equal(tigre['s3-endpoint'], 'ኣድራሻ Endpoint S3');
assert.match(tigre['s3-endpoint-description'], /URL Endpoint S3/u);
assert.match(tigre['s3-endpoint-description'],
  /s3\.amazonaws\.com.*minio\.example\.com/u);
assert.doesNotMatch(tigre['s3-endpoint'], /መወዳእታ/u,
  'endpoint remains an address rather than a temporal end');
console.log('Three Tigre Endpoint contexts repaired.');
