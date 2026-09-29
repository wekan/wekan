'use strict';
// Sync activation, maintainer decision of 2026-09-30: stored rule,
// notification and webhook effects of Sync are off unless the board opted in,
// scheduled runs also need the instance switch, and callers name their trigger.
// Run: node tests/syncActivation.test.cjs
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { assertSyncActivation, validateSyncTrigger } = require('../server/lib/syncActivation');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('an opted-in board runs manual Sync effects; scheduled also needs the instance switch', () => {
  assertSyncActivation({ board: { syncEffectsEnabled: true }, trigger: 'manual', flags: {} });
  assertSyncActivation({ board: { syncEffectsEnabled: true }, trigger: 'scheduled', flags: { enableSyncCronEffects: true } });
});

test('off by default, and no trigger is assumed (negative)', () => {
  assert.throws(() => assertSyncActivation({ board: {}, trigger: 'manual', flags: {} }), /sync-effects-not-enabled/);
  assert.throws(() => assertSyncActivation({ board: { syncEffectsEnabled: 'yes' }, trigger: 'manual' }), /not-enabled/);
  assert.throws(() => assertSyncActivation({ board: null, trigger: 'manual' }), /not-enabled/);
  assert.throws(() => assertSyncActivation({ board: { syncEffectsEnabled: true }, trigger: 'scheduled', flags: {} }),
    /sync-cron-effects-not-enabled/);
  for (const trigger of [undefined, '', 'cron', 'MANUAL']) assert.throws(() => validateSyncTrigger(trigger), /trigger-required/);
});

test('every stored-effect stage checks it in its guard, with the board it re-read', () => {
  for (const file of ['server/notifications/storedRulePlans.js', 'server/notifications/storedWebhooks.js',
    'server/notifications/storedDelivery.js']) {
    const src = read(file);
    assert.match(src, /validateSyncTrigger\(trigger\)/, `${file} requires a trigger up front`);
    assert.match(src, /assertSyncActivation\(\{ board, trigger, flags: getFeatureFlags\(\) \}\)/, `${file} checks inside its guard`);
  }
  assert.match(read('server/lib/syncActivityDelivery.js'), /assertCurrent: guard, trigger \}\)/, 'the coordinator passes it to each stage');
  assert.match(read('server/notifications/storedRulePlans.js'), /completeDelivery\(\{ \.\.\.context, trigger: options\.trigger/);
});

test('both switches default to off in their schemas and flag cache', () => {
  assert.match(read('models/lib/featureFlags.js'), /enableSyncCronEffects: false/);
  assert.match(read('models/settings.js'), /enableSyncCronEffects: \{\s*type: Boolean,\s*optional: true,\s*defaultValue: false/);
  assert.match(read('models/boards.js'), /syncEffectsEnabled: \{\s*type: Boolean,\s*optional: true,\s*\}/);
});

console.log(`\nsyncActivation: ${passed} tests passed`);
