'use strict';

// WP-12 (docs/Compliance/README.md): Admin Panel / Problems / Compliance, the
// read-only checklist of the settings the laws and standards most asked about
// look for, each linking to the pane that changes it.
// Run: node --test tests/complianceChecks.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const C = require('../models/lib/complianceChecks');
const { adminPath } = require('../models/lib/adminUrls');

const GOOD = {
  require2fa: 'admins', idleMinutes: 30, https: true, hsts: 'max-age=31536000', loginRetentionDays: 365,
  auditRetentionDays: 2190, privacyPublished: true, imprintPublished: true, securityContact: true,
  backup: { enabled: true, encrypt: true },
};
const status = facts => Object.fromEntries(C.complianceChecks(facts).map(r => [r.id, r.status]));

test('a deployment set as recommended passes every check', () => {
  assert.ok(Object.values(status(GOOD)).every(s => s === 'ok'), JSON.stringify(status(GOOD)));
});

test('a fresh WeKan: what to look at, and what is only for information', () => {
  assert.deepEqual(status({ require2fa: 'off', loginRetentionDays: 365, auditRetentionDays: 365 }), {
    'require-2fa': 'warn', 'idle-logout': 'warn', https: 'warn', 'login-retention': 'ok',
    'audit-retention': 'info', 'privacy-published': 'warn', 'imprint-published': 'info',
    'security-contact': 'warn', 'backup-encrypted': 'info',
  });
});

test('each check on its own', () => {
  assert.equal(status({ ...GOOD, require2fa: 'all' })['require-2fa'], 'ok');
  assert.equal(status({ ...GOOD, https: true, hsts: null }).https, 'warn', 'HTTPS without HSTS');
  assert.equal(status({ ...GOOD, https: false, hsts: null }).https, 'warn');
  assert.equal(status({ ...GOOD, loginRetentionDays: 0 })['login-retention'], 'warn', '0 keeps them for ever');
  assert.equal(status({ ...GOOD, auditRetentionDays: 0 })['audit-retention'], 'ok', '0 keeps the audit log, which is long enough');
  assert.equal(status({ ...GOOD, auditRetentionDays: 2189 })['audit-retention'], 'info');
  assert.equal(status({ ...GOOD, backup: { enabled: true, encrypt: false } })['backup-encrypted'], 'warn');
});

test('every row has its words, a status word and a pane that exists', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const row of C.complianceChecks(GOOD)) {
    assert.ok(en[row.labelKey], row.labelKey);
    assert.ok(adminPath(row.pane.page, row.pane.slug).endsWith(`/${row.pane.slug}`), `${row.id}: ${row.pane.page}/${row.pane.slug}`);
  }
  for (const key of Object.values(C.STATUS_KEYS)) assert.ok(en[key], key);
});

test('negative: no setting value that could be a secret is shown', () => {
  for (const row of C.complianceChecks({ ...GOOD, hsts: 'max-age=1', require2fa: 'admins' })) {
    assert.doesNotMatch(String(row.value), /password|secret|token|key=|@/i, row.id);
  }
});

test('the pane: in the Problems menu, site administrators only, read-only', () => {
  assert.equal(adminPath('problems', 'compliance'), '/admin/problems/compliance');
  assert.match(read('client/components/settings/adminProblems.js'), /\{ id: 'report-compliance', icon: 'fa-check-square-o', labelKey: 'compliance' \}/);
  assert.match(read('client/components/settings/adminProblems.jade'), /else if isPane 'report-compliance'\s+\+complianceReport/);
  const method = read('server/methods/complianceChecks.js');
  assert.match(method, /if \(!user \|\| user\.loginDisabled \|\| !isSiteAdmin\(user\)\) throw new Meteor\.Error\('not-authorized'\);/);
  assert.doesNotMatch(method, /updateAsync|insertAsync|removeAsync|upsertAsync/, 'it only reads');
  assert.match(read('server/imports.js'), /import '\/server\/methods\/complianceChecks';/);
});
