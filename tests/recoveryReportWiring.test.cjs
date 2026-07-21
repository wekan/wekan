'use strict';

// Wiring guards for the #6492 Admin Panel / Problems / Recovery report.
//
// Verifies the report is connected end-to-end and — importantly — that its
// publication and count method are ADMIN-GATED and that the publication signals
// readiness up front (the pattern that keeps admin reports from hanging on FerretDB).
//
// Run: node tests/recoveryReportWiring.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('recoveryReportWiring:');

test('server publication is registered', () => {
  assert.ok(/publications\/recoveryReport/.test(read('server/imports.js')), 'recoveryReport pub imported');
  assert.ok(/'\/server\/recovery'/.test(read('server/imports.js')), 'server/recovery imported');
});

test('publication is admin-gated and readies up front', () => {
  const src = read('server/publications/recoveryReport.js');
  assert.ok(/Meteor\.publish\('recoveryReport'/.test(src), 'publishes recoveryReport');
  assert.ok(/this\.ready\(\)/.test(src), 'signals readiness up front');
  assert.ok(/isAdmin/.test(src), 'checks isAdmin');
  // Direct collection fetch (fetchAsync) rather than a live cursor.
  assert.ok(/RecoveryEvents\.find\(/.test(src) && /fetchAsync/.test(src), 'direct paged fetch');
});

test('count method is admin-gated', () => {
  const src = read('server/publications/recoveryReport.js');
  assert.ok(/getRecoveryReportCount/.test(src), 'exposes count method');
  assert.ok(/not-authorized/.test(src) && /isAdmin/.test(src), 'count is admin-only');
});

test('record helper is best-effort server-only', () => {
  const src = read('models/recoveryEvents.js');
  assert.ok(/RecoveryEvents\.record\s*=/.test(src), 'has a record helper');
  assert.ok(/Meteor\.isServer/.test(src), 'server-only');
  assert.ok(/try\s*\{[\s\S]*insertAsync[\s\S]*\}\s*catch/.test(src), 'best-effort (never throws)');
});

test('recordRecoveryEvent method is admin-gated', () => {
  const src = read('server/recovery.js');
  assert.ok(/recordRecoveryEvent/.test(src), 'exposes recordRecoveryEvent');
  assert.ok(/not-authorized/.test(src) && /isAdmin/.test(src), 'admin-only');
});

test('client report is wired: config, menu, template, helpers', () => {
  const js = read('client/components/settings/adminReports.js');
  assert.ok(/'report-recovery':/.test(js), 'reportConfig has report-recovery');
  assert.ok(/pub: 'recoveryReport'/.test(js) && /getRecoveryReportCount/.test(js), 'points at pub + count');
  assert.ok(/Template\.recoveryReport\.helpers/.test(js), 'recoveryReport helpers');
  assert.ok(/showRecoveryReport/.test(js), 'show flag');

  const jade = read('client/components/settings/adminReports.jade');
  assert.ok(/js-report-recovery/.test(jade), 'menu link');
  assert.ok(/template\(name="recoveryReport"\)/.test(jade), 'template defined');
  assert.ok(/showRecoveryReport\.get/.test(jade), 'rendered in main-body');
});

test('i18n keys exist', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const k of ['recoveryReportTitle', 'recovery-report-desc', 'recovery-event', 'recovery-severity', 'recovery-db', 'recovery-detail', 'recovery-no-events']) {
    assert.ok(typeof en[k] === 'string' && en[k].length > 0, `missing i18n key: ${k}`);
  }
});

console.log(`\n${passed} tests passed`);
