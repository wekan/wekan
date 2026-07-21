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

test('the standalone maintenance page has a recovery wording', () => {
  const src = read('snap-src/bin/wekan-maintenance-page.mjs');
  assert.ok(/WEKAN_MAINTENANCE_REASON\s*===\s*'recovery'/.test(src), 'detects the recovery reason');
  assert.ok(/recovering your data/i.test(src), 'shows a recovery heading');
});

test('the snap serves a BRIDGE recovery page, bounded so it never blocks WeKan', () => {
  const src = read('snap-src/bin/wekan-control');
  assert.ok(/RECOVERY_IN_PROGRESS/.test(src), 'checks the recovery marker');
  assert.ok(/WEKAN_MAINTENANCE_REASON=recovery/.test(src), 'serves the page with the recovery reason');
  assert.ok(/wekan-maintenance-page\.mjs/.test(src), 'reuses the standalone maintenance page');
  // Must be a bounded bridge: a grace counter with an upper bound, NOT an unbounded
  // `while [ -f marker ]` (the server, not this script, clears the marker — an unbounded
  // wait here would deadlock startup).
  assert.ok(/_rwait"?\s*-lt\s*"?\$_rgrace/.test(src), 'loops only up to a bounded grace window');
  assert.ok(/WEKAN_RECOVERY_BRIDGE_SECONDS/.test(src), 'grace window is overridable');
});

test('release + Docker start scripts serve the SAME bounded bridge page', () => {
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'releases/ferretdb/recovery-bridge.mjs')),
    'the portable recovery-bridge page exists');
  for (const rel of ['releases/ferretdb/start-wekan.sh', 'releases/ferretdb/wekan-entrypoint.sh']) {
    const src = read(rel);
    assert.ok(/recovery-bridge\.mjs/.test(src), `${rel} runs the bridge page`);
    assert.ok(/RECOVERY_IN_PROGRESS/.test(src), `${rel} gates the bridge on the marker`);
    assert.ok(/_rw"?\s*-lt\s*"?\$_rgrace/.test(src), `${rel} bounds the bridge (never blocks WeKan)`);
    // The bridge is guarded so it is skipped cleanly when the page file is absent.
    assert.ok(/\[ -f .*recovery-bridge\.mjs"? \]/.test(src), `${rel} skips the bridge if the page is missing`);
  }
  assert.ok(/COPY[^\n]*recovery-bridge\.mjs[^\n]*\/build\/recovery-bridge\.mjs/.test(read('Dockerfile')),
    'Dockerfile ships the bridge page into the image');
});

test('the recovery marker is cleared by the SERVER (drives the in-app spinner everywhere)', () => {
  // The scripts must NOT clear RECOVERY_IN_PROGRESS themselves: the WeKan server clears it
  // after a health probe, so the in-app recovery spinner shows on ALL platforms until the
  // database is verified healthy. (The bridge pages above are only a pre-boot visual.)
  const srv = read('server/recovery.js');
  assert.ok(/RECOVERY_IN_PROGRESS/.test(srv) && /unlink|rm|removeSync|clear/i.test(srv),
    'the server removes the marker');
  for (const rel of [
    'snap-src/bin/ferretdb-control',
    'releases/ferretdb/start-wekan.sh',
    'releases/ferretdb/wekan-entrypoint.sh',
  ]) {
    const src = read(rel);
    assert.ok(!/rm\s+-f[^\n]*RECOVERY_IN_PROGRESS/.test(src),
      `${rel} must not delete the recovery marker (the server does, after a health probe)`);
  }
});

test('i18n keys exist', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const k of ['recovery-maintenance-title', 'recovery-maintenance-note']) {
    assert.ok(typeof en[k] === 'string' && en[k].length > 0, `missing i18n key: ${k}`);
  }
});

console.log(`\n${passed} tests passed`);
