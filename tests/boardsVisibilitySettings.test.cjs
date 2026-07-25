'use strict';

// "Hide card counter list on All Boards" and "Hide board member list on All
// Boards" moved from Admin Panel / Settings / Layout to Admin Panel / Settings /
// Boards visibility, which is where the rest of "what All Boards shows" lives
// (the pane's i18n key is tableVisibilityMode; its label is "Boards visibility").
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

test('the pane really is the one shown as "Boards visibility"', () => {
  assert.strictEqual(en.tableVisibilityMode, 'Boards visibility',
    'if this label changes, this test is pointing at the wrong pane');
});

test('both settings are now in Boards visibility', () => {
  for (const id of ['hide-card-counter-list', 'hide-board-member-list']) {
    assert.ok(boardsVisibility.includes(id), `${id} must be in the Boards visibility pane`);
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

test('the Boards visibility save writes them, and only what it found', () => {
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

console.log(`\nboardsVisibilitySettings: ${passed} tests passed`);
