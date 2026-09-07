'use strict';

const CLOUD_CONFIG_FIELDS = Object.freeze({
  s3: Object.freeze({
    enabled: { type: 'boolean' }, read: { type: 'boolean' },
    write: { type: 'boolean', hidden: true },
    endpoint: { type: 'text', max: 2048 }, region: { type: 'text', max: 200 },
    bucket: { type: 'text', max: 1000 }, accessKeyId: { type: 'text', max: 1000 },
    secretAccessKey: { type: 'password', max: 8192, secret: true },
    forcePathStyle: { type: 'boolean' },
  }),
  azure: Object.freeze({
    enabled: { type: 'boolean' }, read: { type: 'boolean' },
    write: { type: 'boolean', hidden: true },
    accountName: { type: 'text', max: 1000 },
    accountKey: { type: 'password', max: 8192, secret: true },
    connectionString: { type: 'password', max: 8192, secret: true },
    bucket: { type: 'text', max: 1000 },
  }),
  gcs: Object.freeze({
    enabled: { type: 'boolean' }, read: { type: 'boolean' },
    write: { type: 'boolean', hidden: true },
    projectId: { type: 'text', max: 1000 }, bucket: { type: 'text', max: 1000 },
    keyFilename: { type: 'text', max: 2048 },
    credentials: { type: 'textarea', max: 65536, secret: true, json: true },
  }),
});

function invalid(reason) {
  const error = new Error(reason);
  error.error = 'invalid-storage-settings';
  return error;
}

function normalizeCloudConfig(provider, input) {
  const definitions = CLOUD_CONFIG_FIELDS[provider];
  if (!definitions || !input || typeof input !== 'object' || Array.isArray(input)) {
    throw invalid('Invalid cloud storage configuration');
  }
  const allowed = new Set(Object.keys(definitions));
  for (const key of Object.keys(input)) {
    if (key.endsWith('Set') && allowed.has(key.slice(0, -3))) continue;
    if (!allowed.has(key)) throw invalid('Unknown cloud storage setting');
  }
  const output = {};
  for (const [field, definition] of Object.entries(definitions)) {
    if (!(field in input)) continue;
    if (definition.type === 'boolean') {
      if (typeof input[field] !== 'boolean') throw invalid('Invalid boolean storage setting');
      output[field] = input[field];
      continue;
    }
    if (typeof input[field] !== 'string') throw invalid('Invalid text storage setting');
    const value = input[field].trim();
    if (value.length > definition.max) throw invalid('Cloud storage setting is too long');
    if (definition.json && value) {
      let parsed;
      try { parsed = JSON.parse(value); } catch (_) { throw invalid('Invalid credentials JSON'); }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw invalid('Invalid credentials JSON');
      }
    }
    output[field] = value;
  }
  return output;
}

module.exports = { CLOUD_CONFIG_FIELDS, normalizeCloudConfig };
