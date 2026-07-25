'use strict';

// "Hide card counter list on All Boards" and "Hide board member list on All
// Boards" moved from Admin Panel / Settings / Layout to Admin Panel / Settings /
// Visibility, which is where the rest of "what All Boards shows" lives (the
// pane id and its own i18n key are still tableVisibilityMode; the menu label is
// now the "visibility" key).
//
// "Don't show the board activities on all boards" moved out of Layout too, into
// its own pane, and stopped being a bulk write over every board.
//
// The move has a trap worth guarding: the Layout save read those two radios with
//   $('input[name=hideCardCounterList]:checked').val() === 'true'
// If that read is left behind after the inputs move, :checked matches nothing,
// .val() is undefined, the comparison yields FALSE, and pressing Save on Layout
// silently turns both settings OFF. So the reads must be gone from Layout, and
// the new ones must not write a value they did not find.
//
// Run: node tests/boardsVisibilitySettings.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const jade = read('client/components/settings/settingBody.jade');
const js = read('client/components/settings/settingBody.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

// The two panes, isolated so "which pane is it in" is actually being asserted.
function template(name) {
  const start = jade.indexOf(`template(name='${name}')`);
  assert.ok(start >= 0, `template ${name} must exist`);
  const after = jade.indexOf('\ntemplate(name=', start + 1);
  return jade.slice(start, after === -1 ? undefined : after);
}
const boardsVisibility = template('tableVisibilityModeSettings');
const layout = template('layoutSettings');

console.log('boardsVisibilitySettings:');

test('the pane is the one shown as "Visibility"', () => {
  // The menu label is the 'visibility' key; the pane id and its own
  // tableVisibilityMode key are unchanged, so its 141 translations still apply.
  assert.strictEqual(en.visibility, 'Visibility');
  const js = read('client/components/settings/settingBody.js');
  assert.ok(/id: 'tableVisibilityMode-setting'[^}]*labelKey: 'visibility'/.test(js),
    'the menu entry for this pane must be labelled with the visibility key');
});

test('both settings are now in the Visibility pane', () => {
  for (const id of ['hide-card-counter-list', 'hide-board-member-list']) {
    assert.ok(boardsVisibility.includes(id), `${id} must be in the Visibility pane`);
  }
  // Radios, with both states bound to the stored value as before.
  assert.ok(/name="hideCardCounterList"[\s\S]*?checked="\{\{#if currentSetting\.hideCardCounterList\}\}/.test(boardsVisibility));
  assert.ok(/name="hideBoardMemberList"[\s\S]*?checked="\{\{#if currentSetting\.hideBoardMemberList\}\}/.test(boardsVisibility));
  // And they are saved by the pane's own button.
  assert.ok(/js-tableVisibilityMode-save/.test(boardsVisibility));
});

test('neither setting is left behind in Layout', () => {
  for (const id of ['hide-card-counter-list', 'hide-board-member-list',
    'hideCardCounterList', 'hideBoardMemberList']) {
    assert.ok(!layout.includes(id), `${id} must be gone from the Layout pane`);
  }
});

test('the Layout save no longer writes them (this is the trap)', () => {
  const save = js.slice(js.indexOf("'click button.js-save-layout'"),
    js.indexOf("'click button.js-tableVisibilityMode-save'"));
  assert.ok(!/hideCardCounterList/.test(save) && !/hideBoardMemberList/.test(save),
    'a leftover read would resolve to undefined, compare false, and turn both ' +
    'settings OFF every time Layout is saved');
});

test('the Visibility save writes them, and only what it found', () => {
  const save = js.slice(js.indexOf("'click button.js-tableVisibilityMode-save'"));
  const body = save.slice(0, save.indexOf('\n  },') + 4);
  assert.ok(/allowPrivateOnly/.test(body), 'it still saves its own setting');
  assert.ok(/Settings\.update\(ReactiveCache\.getCurrentSetting\(\)\._id/.test(body),
    'the two flags live in Settings, so they are a second write');
  // Guarded: an input that is not on screen must not be written as false.
  assert.ok(/!== undefined/.test(body),
    'a missing radio must be skipped, never saved as false');
  assert.ok(/Object\.keys\(\$set\)\.length/.test(body),
    'and no empty update is sent');
});

test('the i18n keys are unchanged (the strings only moved)', () => {
  assert.strictEqual(en['hide-card-counter-list'], 'Hide card counter list on All Boards');
  assert.strictEqual(en['hide-board-member-list'], 'Hide board member list on All Boards');
});

test('hide board activities is its own pane, not a Layout button', () => {
  assert.ok(jade.includes("template(name='hideBoardActivitiesSettings')"),
    'it has its own pane now');
  assert.ok(!layout.includes('js-all-boards-hide-activities'),
    'the Layout button must be gone');
  assert.ok(!js.includes('js-all-boards-hide-activities'),
    'and its handler with it');
  assert.ok(/id: 'hideBoardActivities-setting'/.test(js), 'it has a menu entry');
});

test('hide board activities is ONE global setting, not a write per board', () => {
  // The old implementation bulk-updated showActivities:false on every board
  // document. That could not be undone - the per-board values were overwritten
  // and gone - and did nothing for boards created afterwards.
  const save = js.slice(js.indexOf("'click button.js-hide-board-activities-save'"));
  const body = save.slice(0, save.indexOf('\n  },') + 4);
  assert.ok(/Settings\.update\(ReactiveCache\.getCurrentSetting\(\)\._id/.test(body),
    'it writes ONE global setting');
  assert.ok(!/Boards\.update/.test(body), 'and never touches board documents');
  assert.ok(/=== undefined/.test(body), 'a missing radio is skipped, not saved as false');
  // Schema field exists, and the read side consults it FIRST.
  assert.ok(/hideBoardActivitiesOnAllBoards: \{\s*type: Boolean/.test(read('models/settings.js')),
    'the global flag must be in the Settings schema');
  const activities = read('client/components/activities/activities.js');
  const fn = activities.slice(activities.indexOf('function _showActivities'));
  assert.ok(fn.indexOf('hideBoardActivitiesOnAllBoards') < fn.indexOf('let ret = false'),
    'the global flag is read once, before any per-board value');
});

test('the Settings menu labels use existing translated keys', () => {
  // Renaming a menu entry must not invent a string that only English has. Both
  // renames point at keys that already exist in en.i18n.json.
  assert.ok(/id: 'registration-setting'[^}]*labelKey: 'login'/.test(js),
    'the sign-in pane is labelled with the existing login key');
  assert.strictEqual(en.login, 'Login');
  assert.strictEqual(en.visibility, 'Visibility');
  // The pane ids never changed, so no pane content lost its translations.
  assert.ok(js.includes("'registration-setting'") && js.includes("'tableVisibilityMode-setting'"),
    'the pane ids are unchanged');
});

test('the three account-access settings moved to Email and Login', () => {
  const email = template('email');
  const login = jade.slice(jade.indexOf('ul#registration-setting'), jade.indexOf("template(name='email')"));
  assert.ok(email.includes('accounts-allowEmailChange'), 'Allow Email Change is in Email');
  assert.ok(login.includes('accounts-allowUserNameChange'), 'Allow Username Change is in Login');
  assert.ok(login.includes('accounts-allowUserDelete'), 'Allow user self delete is in Login');
  // Each host pane has a Save that reaches them.
  assert.ok(/js-save\.primary/.test(email) && /js-account-access-save/.test(login));
  // The Accounts pane had nothing left, so it is gone - not left empty with a
  // stray Save button.
  assert.ok(!jade.includes("template(name='accountSettings')"), 'the empty pane is removed');
  assert.ok(!js.includes('js-accounts-save'), 'and its save handler with it');
  assert.ok(!/isAccountSetting/.test(jade) && !/isAccountSetting/.test(js),
    'and every reference to it');
});

test('the moved radios still see their values, and save what they found', () => {
  // A radio bound to a helper the HOST template does not have renders unchecked -
  // it would silently show the wrong value. The helpers moved with the settings.
  assert.ok(/Template\.email\.helpers\(accountAccessHelpers\)/.test(js),
    'Email gets the helpers');
  assert.ok(/Template\.setting\.helpers\(accountAccessHelpers\)/.test(js),
    'the Settings template (which hosts the Login pane) gets them too');
  const save = js.slice(js.indexOf("'click button.js-account-access-save'"));
  const body = save.slice(0, save.indexOf('\n  },') + 4);
  assert.ok(/!== undefined/.test(body),
    'a radio that is not on screen must be skipped, never saved as false');
  assert.ok(/accounts-allowUserNameChange/.test(body) && /accounts-allowUserDelete/.test(body));
  // The settings still live in AccountSettings; only where they are SHOWN changed.
  assert.ok(/Meteor\.subscribe\('accountSettings'\)/.test(js),
    'the subscription must stay - the collection is unchanged');
});

console.log(`\nboardsVisibilitySettings: ${passed} tests passed`);
