'use strict';

// The Admin Panel edit popups — Edit User, Edit Organization, Edit Team.
//
// Two things went wrong with them, and both are layout, so these are CSS source
// guards (there is no browser here to measure anything):
//
//  1. They were positioned from the row that opened them. Opened from a row in a
//     wide table, the popup ran off the right edge of the window and took its
//     right-hand side with it - fields, and the Save button under them.
//  2. They are long forms in ONE column, so on a wide screen most of the form was
//     below the fold and Save was a scroll away.
//
// Run: node tests/adminEditPopup.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const css = read('client/components/main/popup.css');
const POPUPS = ['editUserPopup', 'editOrgPopup', 'editTeamPopup'];

console.log('adminEditPopup:');

// The block of declarations that applies to all three popups at once.
function sharedBlock(afterSelector) {
  const at = css.indexOf(afterSelector);
  assert.ok(at !== -1, `${afterSelector} must exist`);
  return css.slice(at, css.indexOf('}', at));
}

test('no popup can ever be wider than the window', () => {
  const base = css.slice(css.indexOf('.pop-over {'), css.indexOf('}', css.indexOf('.pop-over {')));
  assert.ok(/max-width: calc\(100vw - 20px\)/.test(base),
    'the generic rule keeps every popup inside the window');
});

test('the admin edit popups are centred on the window, not on the row', () => {
  const block = sharedBlock(".pop-over[data-popup='editUserPopup'],");
  assert.ok(/position: fixed !important;/.test(block), 'fixed, so no row can push it off-screen');
  assert.ok(/left: 50% !important;/.test(block) && /transform: translateX\(-50%\) !important;/.test(block),
    'centred - and the same way in both text directions, so there is no RTL variant');
  assert.ok(/right: auto !important;/.test(block),
    'the opener-based offset must be cleared, or the popup is stretched instead of moved');
  assert.ok(/max-width: calc\(100vw - 20px\) !important;/.test(block),
    'and it still never exceeds the window');
  for (const name of POPUPS) {
    assert.ok(css.includes(`.pop-over[data-popup='${name}'],`)
      || css.includes(`.pop-over[data-popup='${name}'] {`), `${name} must be covered`);
  }
});

test('wide windows get several columns, narrow ones get one', () => {
  const block = sharedBlock(".pop-over[data-popup='editUserPopup'] .content > form,");
  assert.ok(/display: grid;/.test(block));
  assert.ok(/grid-template-columns: repeat\(auto-fit, minmax\(240px, 1fr\)\);/.test(block),
    'auto-fit: the column count follows the width the popup got, with no breakpoint');
  // A media query would have to guess a width, and would be wrong for the next
  // form that is added to one of these popups.
  assert.ok(!/@media[^{]*editUserPopup/.test(css), 'no breakpoint is guessed');
  // The popup itself has to be wide enough for those columns to appear.
  const box = sharedBlock(".pop-over[data-popup='editUserPopup'],");
  assert.ok(/width: min\(1040px, calc\(100vw - 20px\)\) !important;/.test(box),
    'wide when the window allows it, never wider than the window');
});

test('Save and the rules that separate sections span every column', () => {
  // Otherwise Save ends up as a narrow button in whichever column it fell into.
  const spanning = css.slice(css.indexOf(".pop-over[data-popup='editUserPopup'] .content > form > hr,"));
  const head = spanning.slice(0, spanning.indexOf('}'));
  assert.ok(/grid-column: 1 \/ -1;/.test(spanning.slice(0, spanning.indexOf('}') + 2)),
    'they are full-width rows');
  for (const child of ['hr', '.buttonsContainer', 'h2', 'span.form-text']) {
    assert.ok(head.includes(`> ${child}`), `${child} must span the full width`);
  }
});

test('a hidden field does not take a column of its own', () => {
  // Each of these forms starts with a hidden id label; as a grid item it would
  // leave the first cell blank and push everything one place along.
  const hidden = css.slice(css.indexOf(".pop-over[data-popup='editUserPopup'] .content > form > .hide,"));
  assert.ok(/display: none !important;/.test(hidden.slice(0, hidden.indexOf('}') + 2)));
  // …and the forms really do carry such a field, or the rule would be dead.
  const people = read('client/components/settings/peopleBody.jade');
  for (const cls of ['label.hide.userId', 'label.hide.orgId', 'label.hide.teamId']) {
    assert.ok(people.includes(cls), `${cls} is the hidden field the rule is for`);
  }
});

test('the popup header follows the active theme', () => {
  // It used to be a fixed blue on narrow windows, and the board colour (only) on
  // wide ones - so in the Admin Panel, where there is no board, no theme reached it.
  const tpl = read('client/components/main/popup.tpl.jade');
  assert.ok(/class=themeColorClass/.test(tpl), 'the popup carries the active theme class');
  assert.ok(!/class=currentBoard\.colorClass/.test(tpl),
    'and no longer the board colour alone');
  assert.ok(/background: var\(--theme-accent, #2980b9\);/.test(css),
    'the narrow-window header reads the theme accent, with the stock blue as fallback');
});

console.log(`\n${passed} tests passed`);
