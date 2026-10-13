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

test('four settings batches render native prose while retaining technical literals', async () => {
  const { exemptProseCandidates } = await import('../releases/translations/audit-exempt-prose.mjs');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = require('../imports/i18n/data/en.i18n.json');
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'en', fallbackLng: 'en', initImmediate: false,
    interpolation: { prefix: '__', suffix: '__' }, resources: { en: { translation: source } } });
  const states = {
    bn: { enabled: /^S3 সক্রিয়$/, disabled: /নিষ্ক্রিয়$/, required: /প্রয়োজন$/, failed: /ব্যর্থ হয়েছে$/, success: /সফল হয়েছে$/ },
    is: { enabled: /^S3 virkt$/, disabled: /óvirk$/, required: /nauðsynlegur$/, failed: /við S3 mistókst$/, success: /við S3 tókst$/ },
    tl: { enabled: /^Pinagana ang S3$/, disabled: /^Hindi pinagana/, required: /^Kailangan/, failed: /^Nabigo/, success: /^Nagtagumpay/ },
    sq: { enabled: /^S3 është aktivizuar$/, disabled: /është çaktivizuar$/, required: /^Kërkohet/, failed: /dështoi$/, success: /me sukses$/ },
  };
  for (const [code, expected] of Object.entries(states)) {
    const data = require(`../imports/i18n/data/${code}.i18n.json`);
    const remaining = exemptProseCandidates(source, data);
    assert.deepEqual(Object.fromEntries(Object.entries(remaining).filter(([, value]) => /^(?:S3|MongoDB)/.test(value))), {}, code);
    assert.deepEqual(Object.keys(data), Object.keys(source), code);
    for (const key of Object.keys(source)) {
      assert.deepEqual(translationTokens(data[key]), translationTokens(source[key]), `${code}:${key}`);
    }
    for (const [state, key] of Object.entries({ enabled: 's3-enabled', disabled: 's3-disabled',
      required: 's3-secret-key-required', failed: 's3-connection-failed', success: 's3-connection-success' })) {
      assert.match(data[key], expected[state], `${code}:${key}`);
    }
    for (const name of ['AWS S3', 'MinIO', 'Cloudflare R2', 'Backblaze B2', 'Wasabi', 'DigitalOcean Spaces']) {
      assert.ok(data['s3-minio-storage-description'].includes(name), `${code}:${name}`);
    }
    for (const host of ['s3.amazonaws.com', 'minio.example.com']) assert.ok(data['s3-endpoint-description'].includes(host), code);
    assert.notEqual(data['s3-access-key'], data['s3-secret-key'], code);
    i18n.addResourceBundle(code, 'translation', data);
    for (const key of ['MongoDB_version', 'MongoDB_storage_engine', 'MongoDB_Oplog_enabled',
      's3-minio-storage-description', 's3-secret-key-required', 's3-connection-failed', 's3-settings-saved']) {
      assert.notEqual(data[key], source[key], `${code}:${key}`);
      assert.equal(i18n.t(key, { lng: code }), data[key], `${code}:${key}`);
    }
  }
});

test('Tagalog repairs keep one-time secret warnings, native clauses and console labels', async () => {
  const data = require('../imports/i18n/data/tl.i18n.json');
  const { corrections, repairLocale } = await import('../releases/translations/repair-audited-translations.mjs');
  const repaired = corrections.filter(row => row.locale === 'tl' && row.reason.includes('2026-10-13'));
  assert.equal(repaired.length, 15);
  for (const row of repaired) {
    assert.equal(data[row.key], row.after, row.key);
    assert.equal(repairLocale('tl', { [row.key]: row.before }).data[row.key], row.after, row.key);
    assert.equal(repairLocale('tl', { [row.key]: 'Mas bagong salin' }).data[row.key], 'Mas bagong salin', 'preserve newer wording');
  }
  assert.match(data['s3-force-path-style-description'], /karamihan.*hindi AWS/);
  assert.match(data['s3-endpoint-menu-path'], /iwang blangko.*endpoint ng rehiyon/);
  assert.match(data['s3-secret-key-menu-path'], /isang beses lamang/);
  assert.match(data['s3-secret-key-menu-path'], /kopyahin ito agad/);
  assert.doesNotMatch(data['s3-secret-key-menu-path'], /\bis shown\b|\bkapag the\b|\bkopyahin it\b/);
  for (const label of ['Security credentials', 'Access keys', 'Create access key', 'Application running outside AWS', 'Access key ID']) {
    assert.ok(data['s3-access-key-menu-path'].includes(label), label);
  }
  for (const label of ['Secret access key', 'Download .csv']) assert.ok(data['s3-secret-key-menu-path'].includes(label), label);
  assert.match(data['s3-ssl-enabled-description'], /Gamitin ang SSL\/TLS/);
});
