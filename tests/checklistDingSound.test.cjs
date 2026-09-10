'use strict';

// Regression coverage for #5427 ("Add an audio ding any time a task is
// checked off").
//
// Three parts, each checked here:
//  1. A per-user preference, 'profile.checklistDingSound' (models/users.js),
//     off by default.
//  2. client/lib/checklistDingSound.js - a synthesized Web Audio tone (no
//     bundled audio file: the issue thread rejected a bundled sound because
//     its license was not copyfree/MIT/BSD). It must guard on AudioContext
//     being available and never throw.
//  3. client/components/cards/checklists.js's checklistItemDetail toggle
//     handler - plays the sound only on the unchecked -> checked transition,
//     and only when the user's preference is enabled.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// --- 1. The preference field exists, is a plain Boolean, optional (so it
// defaults to undefined/falsy - i.e. off), mirroring the shape of the
// existing 'profile.submitOnEnter' preference right above it ---
const usersModel = read('models/users.js');
const prefMatch = usersModel.match(
  /'profile\.checklistDingSound':\s*\{[^}]*type:\s*Boolean,[^}]*optional:\s*true,[^}]*\}/,
);
assert.ok(prefMatch, 'profile.checklistDingSound must be declared as an optional Boolean');

assert.match(
  usersModel,
  /hasChecklistDingSound\(\)\s*\{\s*const profile = this\.profile \|\| \{\};\s*return profile\.checklistDingSound \|\| false;\s*\}/,
);

// Negative: reading the helper with no 'checklistDingSound' key set at all
// (the real-world default for every existing user) must be false, not
// throw and not be undefined.
function hasChecklistDingSound(profile) {
  profile = profile || {};
  return profile.checklistDingSound || false;
}
assert.equal(hasChecklistDingSound(undefined), false);
assert.equal(hasChecklistDingSound({}), false);
assert.equal(hasChecklistDingSound({ checklistDingSound: false }), false);
assert.equal(hasChecklistDingSound({ checklistDingSound: true }), true);

// The server-side toggle method exists and flips the same field.
const serverUsersModel = read('server/models/users.js');
assert.match(serverUsersModel, /async toggleChecklistDingSound\(\)/);
assert.match(
  serverUsersModel,
  /\$set:\s*\{\s*'profile\.checklistDingSound':\s*!current\s*\}/,
);

// --- 2. The sound utility guards missing AudioContext and never throws ---
const soundSource = read('client/lib/checklistDingSound.js');

// No bundled audio file - only Web Audio API synthesis (OscillatorNode).
assert.doesNotMatch(soundSource, /\.mp3|\.wav|\.ogg/i);
assert.match(soundSource, /createOscillator/);
assert.match(soundSource, /createGain/);

// Guarded on AudioContext actually existing.
assert.match(
  soundSource,
  /window\.AudioContext \|\| window\.webkitAudioContext/,
);

// The exported entry point wraps everything in try/catch so a failure can
// never throw into the caller (the checklist toggle handler).
assert.match(soundSource, /export function playChecklistDingSound\(\)\s*\{\s*try\s*\{/);
assert.match(soundSource, /\}\s*catch\s*\(error\)\s*\{/);

// Actually run it in an environment with no `window` at all (e.g. server-
// side rendering / a test harness) - must be a silent no-op, not a throw.
delete require.cache[require.resolve('../client/lib/checklistDingSound.js')];
(async () => {
  const modUrl = `file://${path.join(root, 'client/lib/checklistDingSound.js')}`;
  const mod = await import(modUrl);
  assert.equal(typeof mod.playChecklistDingSound, 'function');
  assert.doesNotThrow(() => mod.playChecklistDingSound());

  // And with a `window` that has no AudioContext constructor either.
  global.window = {};
  assert.doesNotThrow(() => mod.playChecklistDingSound());
  delete global.window;

  // And with a window whose AudioContext constructor itself throws (a
  // browser that blocks audio before a user gesture, etc.) - still no throw.
  global.window = {
    AudioContext: function () {
      throw new Error('blocked');
    },
  };
  assert.doesNotThrow(() => mod.playChecklistDingSound());
  delete global.window;

  console.log('checklistDingSound: playChecklistDingSound() never throws, with or without AudioContext');
})().then(() => {
  // --- 3. Wiring: only unchecked -> checked, only when the preference is on ---
  const checklists = read('client/components/cards/checklists.js');

  assert.match(
    checklists,
    /import \{ playChecklistDingSound \} from '\/client\/lib\/checklistDingSound';/,
  );

  const handlerMatch = checklists.match(
    /'click \.js-checklist-item \.check-box-container'\(\)\s*\{([\s\S]*?)\n\s{2}\},/,
  );
  assert.ok(handlerMatch, 'checklistItemDetail toggle handler must exist');
  const handlerBody = handlerMatch[1];

  // The pre-toggle state is captured BEFORE toggleItem() runs, so the check
  // reflects what the item WAS, not what it becomes.
  const wasFinishedIndex = handlerBody.indexOf('wasFinished');
  const toggleCallIndex = handlerBody.indexOf('item.toggleItem()');
  assert.ok(wasFinishedIndex > -1 && toggleCallIndex > -1);
  assert.ok(
    wasFinishedIndex < toggleCallIndex,
    'wasFinished must be captured before item.toggleItem() mutates the item',
  );

  // The ding is only played when the item was NOT finished before (i.e. the
  // unchecked -> checked transition), never on check -> uncheck.
  assert.match(handlerBody, /if\s*\(!wasFinished\)\s*\{/);

  // And it is gated on the user's preference.
  assert.match(handlerBody, /hasChecklistDingSound\(\)/);
  assert.match(handlerBody, /playChecklistDingSound\(\)/);

  // Pure re-implementation of the decision the handler makes, to pin the
  // truth table directly (positive + two negatives):
  function shouldDing(wasFinishedBefore, prefEnabled) {
    if (wasFinishedBefore) return false; // check -> uncheck: never dings
    return !!prefEnabled;
  }
  // Positive: unchecked -> checked, preference on.
  assert.equal(shouldDing(false, true), true);
  // Negative: checked -> unchecked (any preference state) never dings.
  assert.equal(shouldDing(true, true), false);
  assert.equal(shouldDing(true, false), false);
  // Negative: unchecked -> checked, but preference off (the default) never dings.
  assert.equal(shouldDing(false, false), false);

  console.log('checklistDingSound: toggle handler only dings on unchecked -> checked, gated on the preference');
  console.log('checklistDingSound: all checks passed');
}).catch(error => {
  console.error(error);
  process.exit(1);
});
