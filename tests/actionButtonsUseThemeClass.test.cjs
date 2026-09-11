'use strict';

// Regression guard: reported directly - on an opened card the Flowtime "Add
// Interruption" button rendered as an unthemed default button beside "Start
// Pomodoro", and the Timeline view's "Restore to this state" button the same
// way. WeKan's action buttons take their colors from the `.primary` (or
// `.negate` for destructive) theme class; a `button` with neither is the
// browser default, which looks like a different, unstyled control next to a
// themed one.
//
// This pins every labelled action button added by recent features to the
// `.primary` class. Pagination arrows, sort headers, icon-only toggles and the
// vote/poker buttons have their own deliberate styling and are not action
// buttons in this sense, so they are not listed.
//
// Run: node tests/actionButtonsUseThemeClass.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const BUTTONS = [
  ['client/components/cards/cardFlowtime.jade', 'js-add-flow-interruption', 'Flowtime "Add Interruption"'],
  ['client/components/cards/cardFlowtime.jade', 'js-start-flow', 'Flowtime "Start"'],
  ['client/components/cards/cardPomodoro.jade', 'js-start-pomodoro', 'Pomodoro "Start"'],
  ['client/components/boards/timelineView.jade', 'js-restore-card-timeline', 'Timeline "Restore to this state"'],
  ['client/components/lists/listHeader.jade', 'js-list-sync-now', 'List "Sync now"'],
  ['client/components/settings/settingBody.jade', 'js-ldap-test-connection', 'Admin Panel "Test LDAP Connection"'],
];

console.log('actionButtonsUseThemeClass:');

for (const [rel, cls, label] of BUTTONS) {
  test(`${label} carries the .primary theme class`, () => {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const line = src.split('\n').find(l => new RegExp(`^\\s*button[^\\s(]*\\.${cls}(?![\\w-])`).test(l));
    assert.ok(line, `${rel} must still have a button.${cls}`);
    const classChain = /^\s*button([.#][^\s(]*)/.exec(line)[1];
    assert.ok(classChain.split('.').includes('primary'),
      `${label} (${rel}) is an unthemed default button: ${line.trim()}`);
  });
}

console.log(`\nactionButtonsUseThemeClass: ${passed} tests passed`);
