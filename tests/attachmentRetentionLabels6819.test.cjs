'use strict';

// #6819: Admin Panel / Attachments / Retention showed only the variable names
// (ATTACHMENTS_RETENTION_DAYS, ...), the raw choices (uploaded, card-inactive)
// and "Default ()" whenever the variable was set but empty - as a Helm chart or
// docker-compose file does. Each field now has a translated label and, where it
// needs one, a help line; the default is shown again.
// Run: node tests/attachmentRetentionLabels6819.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { AUTH_CONFIG_SECTIONS, authConfigSources } = require('../models/lib/authConfigCatalog.js');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const nl = JSON.parse(read('imports/i18n/data/nl.i18n.json'));

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

const fields = AUTH_CONFIG_SECTIONS.attachmentRetention.fields;

test('every retention field has a label, translated in English and Dutch', () => {
  for (const f of fields) {
    assert.ok(f.labelKey, f.envVar);
    for (const key of [f.labelKey, f.helpKey, ...Object.values(f.choiceLabelKeys || {})].filter(Boolean)) {
      assert.ok(en[key], `${key} in English`);
      assert.ok(nl[key] && nl[key] !== en[key], `${key} in Dutch`);
    }
  }
  assert.deepStrictEqual(fields.find(f => f.key === 'mode').choiceLabelKeys,
    { uploaded: 'export-card-attachment-uploaded-at', 'card-inactive': 'last-activity' });
});

test('an empty variable shows the default instead of nothing', () => {
  const env = { ATTACHMENTS_RETENTION_MODE: '', ATTACHMENTS_RETENTION_DRY_RUN: '', ATTACHMENTS_RETENTION_MAX_PER_RUN: '' };
  const { sources } = authConfigSources('attachmentRetention', {}, env);
  assert.strictEqual(sources.mode.value, 'uploaded');
  assert.strictEqual(sources.dryRun.value, false);
  assert.strictEqual(sources.maxPerRun.value, 1000);
  assert.strictEqual(sources.retentionDays.value, 0);
});

test('negative: a set variable still wins over the default', () => {
  const { sources } = authConfigSources('attachmentRetention', {}, { ATTACHMENTS_RETENTION_MODE: 'card-inactive' });
  assert.strictEqual(sources.mode.value, 'card-inactive');
  assert.strictEqual(sources.mode.source, 'env');
});

test('the form shows label, variable, help line and choice names', () => {
  const jade = read('client/components/settings/authProviderSettings.jade');
  assert.match(jade, /if labelKey\n\s+label\(for="auth-\{\{key\}\}"\)\n\s+\| \{\{_ labelKey\}\}\n\s+span\.quiet  \(\{\{envVar\}\}\)\n\s+else\n\s+label\(for="auth-\{\{key\}\}"\)= envVar/);
  assert.match(jade, /if helpKey\n\s+\.description \{\{_ helpKey\}\}/);
  assert.match(jade, /option\(value="\{\{value\}\}" selected=selected\)= label/);
  const js = read('client/components/settings/authProviderSettings.js');
  assert.match(js, /choiceOptions: \(field\.choices \|\| \[\]\)\.map\(choice => \(\{ value: choice, label: choiceLabel\(choice\), selected: value === choice \}\)\)/);
});

console.log(`\n${passed} tests passed`);
