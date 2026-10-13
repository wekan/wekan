'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');

test('product-prefixed settings prose stays visible outside the fill exemptions', async () => {
  const { exemptProseCandidates } = await import('../releases/translations/audit-exempt-prose.mjs');
  const source = { storage: 'S3-compatible object storage: AWS S3 and others.',
    key: 'S3 secret key is required', version: 'MongoDB compatible version',
    'blockly-HOME_KEY': 'Home', platform: 'Platform' };
  const snapshot = JSON.stringify(source);
  assert.deepEqual(exemptProseCandidates(source, source), source);
  assert.equal(JSON.stringify(source), snapshot, 'the review never writes translations');
  assert.deepEqual(exemptProseCandidates(source, { ...source, key: 'S3 गुप्त कळ आवश्यक आहे' }),
    Object.fromEntries(Object.entries(source).filter(([key]) => key !== 'key')));
});

test('the supplemental audit retains exact technical names and excludes missing values', async () => {
  const { exemptProseCandidates } = await import('../releases/translations/audit-exempt-prose.mjs');
  const source = { s3: 'S3', minio: 'S3/MinIO', db: 'MongoDB', compact: 'MongoDB Compact',
    collection: 'MongoDB CollectionFS', files: 'MongoDB Meteor-Files', os: 'Linux',
    'blockly-LOGIC_NULL': 'null', url: 'https://example.com/S3', token: '__S3__', missing: 'S3 Size' };
  assert.deepEqual(exemptProseCandidates(source, { ...source, missing: undefined }), {});
  assert.deepEqual(exemptProseCandidates(source, {}), {});
});

test('Marathi has no remaining candidates in this supplemental queue', async () => {
  const { exemptProseCandidates } = await import('../releases/translations/audit-exempt-prose.mjs');
  const source = require('../imports/i18n/data/en.i18n.json');
  const locale = require('../imports/i18n/data/mr.i18n.json');
  assert.deepEqual(exemptProseCandidates(source, locale), {});
  assert.notEqual(locale['s3-connection-success'], locale['s3-connection-failed']);
  assert.notEqual(locale['s3-enabled'], locale['s3-disabled']);
  assert.match(locale['s3-minio-storage-description'], /आणि इतर/);
  assert.match(locale['s3-secret-key-required'], /आवश्यक/);
  for (const key of ['blockly-HOME_KEY', 'blockly-END_KEY']) assert.notEqual(locale[key], source[key]);
  for (const suffix of ['ALT_KEY', 'BACKSPACE_KEY', 'CAPS_LOCK_KEY', 'COMMAND_KEY', 'CONTROL_KEY',
    'END_KEY', 'ENTER_KEY', 'ESCAPE', 'HOME_KEY', 'INSERT_KEY', 'OPTION_KEY',
    'PAGE_DOWN_KEY', 'PAGE_UP_KEY', 'PAUSE_KEY', 'SHIFT_KEY', 'SPACE_KEY', 'TAB_KEY']) {
    assert.ok(locale['blockly-' + suffix].includes(source['blockly-' + suffix]), suffix);
  }
  assert.equal(locale['r-of'], '/');
  assert.equal(locale.of, '/');
  assert.equal(`1 ${locale['r-of']} 10`, '1 / 10', 'count remains numerator then denominator');
});
