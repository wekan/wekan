'use strict';

// Wiring guards for the #6492 recovery maintenance spinner.
//
// While a data recovery is in progress the server sets a published status flag and
// every client shows a full-page maintenance spinner instead of errors. Verifies the
// pieces are connected and — importantly — that the status publication is PUBLIC (so
// logged-out users on the sign-in page see it too) while the toggle method is
// admin-gated, and that the startup scripts mark recovery in progress.
//
// Run: node tests/recoveryMaintenance.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('recoveryMaintenance:');

test('status model writes are server-only + best-effort', () => {
  const src = read('models/recoveryStatus.js');
  assert.ok(/setMaintenance\s*=/.test(src) && /Meteor\.isServer/.test(src), 'server-only setMaintenance');
  assert.ok(/isMaintenanceActive/.test(src) && /maintenanceMessage/.test(src), 'read helpers');
});

test('publication is PUBLIC (no admin gate) and singleton-scoped', () => {
  const src = read('server/publications/recoveryMaintenance.js');
  assert.ok(/Meteor\.publish\('recoveryMaintenance'/.test(src), 'publishes recoveryMaintenance');
  assert.ok(!/isAdmin/.test(src), 'must NOT be admin-gated (everyone sees maintenance)');
  assert.ok(/RECOVERY_STATUS_ID/.test(src), 'publishes only the single status doc');
  assert.ok(/publications\/recoveryMaintenance/.test(read('server/imports.js')), 'registered in server/imports.js');
});

test('the maintenance toggle method is admin-gated', () => {
  const src = read('server/recovery.js');
  assert.ok(/setRecoveryMaintenance/.test(src), 'exposes setRecoveryMaintenance');
  assert.ok(/not-authorized/.test(src) && /isAdmin/.test(src), 'admin-only');
});

test('server shows maintenance from the RECOVERY_IN_PROGRESS marker and clears when healthy', () => {
  const src = read('server/recovery.js');
  assert.ok(/RECOVERY_IN_PROGRESS/.test(src), 'checks the marker');
  assert.ok(/setMaintenance\(true/.test(src) && /setMaintenance\(false/.test(src), 'turns it on then off');
  assert.ok(/probeDatabaseHealthy/.test(src), 'clears only after a health probe');
});

test('client overlay is subscribed and rendered in the layouts', () => {
  const js = read('client/components/main/recoveryMaintenance.js');
  assert.ok(/subscribe\('recoveryMaintenance'\)/.test(js), 'subscribes to the status');
  assert.ok(/isMaintenanceActive/.test(js), 'exposes the active helper');

  const jade = read('client/components/main/recoveryMaintenance.jade');
  assert.ok(/if isMaintenanceActive/.test(jade) && /\+spinner/.test(jade), 'shows a spinner when active');

  const layouts = read('client/components/main/layouts.jade');
  assert.ok((layouts.match(/\+recoveryMaintenance/g) || []).length >= 2,
    'overlay injected in both the app and the sign-in layouts');
});

test('overlay css covers the screen above everything', () => {
  const css = read('client/components/main/recoveryMaintenance.css');
  assert.ok(/position:\s*fixed/.test(css) && /inset:\s*0/.test(css), 'full-screen fixed');
  assert.ok(/z-index:\s*\d{4,}/.test(css), 'above modals/popups');
});

test('startup scripts mark recovery in progress during a restore/remigrate', () => {
  for (const rel of [
    'snap-src/bin/ferretdb-control',
    'releases/ferretdb/start-wekan.sh',
    'releases/ferretdb/wekan-entrypoint.sh',
  ]) {
    assert.ok(/RECOVERY_IN_PROGRESS/.test(read(rel)), `${rel} writes the marker`);
  }
});

test('i18n keys exist', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const k of ['recovery-maintenance-title', 'recovery-maintenance-note']) {
    assert.ok(typeof en[k] === 'string' && en[k].length > 0, `missing i18n key: ${k}`);
  }
});

console.log(`\n${passed} tests passed`);
