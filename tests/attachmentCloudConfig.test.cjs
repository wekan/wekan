'use strict';

const assert = require('assert');
const { CLOUD_CONFIG_FIELDS, normalizeCloudConfig } =
  require('../models/lib/attachmentCloudConfig');

assert.deepStrictEqual(Object.keys(CLOUD_CONFIG_FIELDS), ['s3', 'azure', 'gcs']);
assert.deepStrictEqual(normalizeCloudConfig('s3', {
  enabled: true, read: false, endpoint: ' https://s3.example.test ', region: 'eu-test-1',
  bucket: 'files', accessKeyId: 'id', secretAccessKey: '', secretAccessKeySet: true,
  forcePathStyle: true,
}), {
  enabled: true, read: false, endpoint: 'https://s3.example.test', region: 'eu-test-1',
  bucket: 'files', accessKeyId: 'id', secretAccessKey: '', forcePathStyle: true,
});
assert.strictEqual(normalizeCloudConfig('gcs', {
  enabled: false, read: true, projectId: '', bucket: '', keyFilename: '',
  credentials: '{"type":"service_account"}',
}).credentials, '{"type":"service_account"}');

for (const [provider, input] of [
  ['other', {}],
  ['s3', { enabled: 'true' }],
  ['s3', { unknown: 'value' }],
  ['s3', { endpoint: 'x'.repeat(2049) }],
  ['gcs', { credentials: '{broken' }],
  ['gcs', { credentials: '[]' }],
]) assert.throws(() => normalizeCloudConfig(provider, input),
  error => error?.error === 'invalid-storage-settings');

console.log('attachmentCloudConfig: fixed fields, bounds and credentials passed');
