'use strict';

// Issue #2426: show the current swimlane's name at the bottom of a minicard
// in List view, where a card's swimlane membership isn't otherwise visually
// obvious (unlike Swimlanes view, which already groups cards by swimlane).
//
// Wired into Board Settings > Card the same way allowsShowLists /
// allowsShowListsOnMinicard already are: a single board-wide toggle,
// allowsSwimlaneNameOnMinicard, OFF by default so existing boards are
// unaffected. There is no "Show on Card" equivalent - the card detail view
// already shows the swimlane via its own picker - so the row's first column
// stays empty, the same shape as the "List title" row. This test pins:
//  - the new board field exists, defaults to false, and is in the
//    server-side allow-list of client-writable board fields;
//  - the Card Settings sidebar panel has a row that toggles it;
//  - the minicard only renders the swimlane-name label when the flag is
//    true, reusing ReactiveCache.getSwimlane() like other per-card reactive
//    lookups on the minicard already do.
//
// Run: node tests/minicardSwimlaneNameOnMinicard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('minicardSwimlaneNameOnMinicard:');

test('the board schema has the new field, off by default', () => {
  const boards = read('models/boards.js');
  const at = boards.indexOf('allowsSwimlaneNameOnMinicard: {');
  assert.ok(at !== -1, 'allowsSwimlaneNameOnMinicard must be declared in the Boards schema');
  const field = boards.slice(at, at + 300);
  assert.ok(/type: Boolean/.test(field));
  assert.ok(/defaultValue: false/.test(field),
    'must default to false so existing boards see no change (issue scope)');
  assert.ok(/setAllowsSwimlaneNameOnMinicard/.test(boards),
    'mirrors the setAllowsX(...) pattern the other allowsX fields already have');
});

test('the server allow-list can be written to from the client', () => {
  const serverBoards = read('server/models/boards.js');
  assert.ok(/'allowsSwimlaneNameOnMinicard'/.test(serverBoards),
    'without this, Boards.update from the sidebar toggle would be rejected');
});

test('Card Settings has a row for it, toggling allowsSwimlaneNameOnMinicard', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  assert.ok(/js-field-has-swimlane-name-on-minicard/.test(jade));
  assert.ok(/allowsSwimlaneNameOnMinicard/.test(jade));

  const sidebarJs = read('client/components/sidebar/sidebar.js');
  assert.ok(/allowsSwimlaneNameOnMinicard\(\)/.test(sidebarJs),
    'a reactive helper backs the row checkbox state');
  assert.ok(/'click \.js-field-has-swimlane-name-on-minicard'/.test(sidebarJs));
  assert.ok(
    /Boards\.update\(tpl\.currentBoard\._id, \{ \$set: \{ allowsSwimlaneNameOnMinicard: newValue \} \}\)/
      .test(sidebarJs),
    'a direct client Boards.update, matching every other allowsXOnMinicard toggle',
  );
});

test('the minicard only renders the swimlane-name label when the board flag is set', () => {
  const minicardJs = read('client/components/cards/minicard.js');
  assert.ok(/shouldShowSwimlaneNameOnMinicard\(\)/.test(minicardJs));
  assert.ok(/allowsSwimlaneNameOnMinicard/.test(minicardJs));
  assert.ok(/swimlaneName\(\)/.test(minicardJs));
  assert.ok(/ReactiveCache\.getSwimlane\(card\.swimlaneId\)/.test(minicardJs),
    'must resolve the swimlane reactively, matching the reactive per-card lookup pattern elsewhere on the minicard');

  const minicardJade = read('client/components/cards/minicard.jade');
  assert.ok(/if shouldShowSwimlaneNameOnMinicard/.test(minicardJade),
    'the swimlane-name label must be gated behind the flag');
  const at = minicardJade.indexOf('if shouldShowSwimlaneNameOnMinicard');
  const block = minicardJade.slice(at, at + 200);
  assert.ok(/minicard-swimlane-name/.test(block));
  assert.ok(/swimlaneName/.test(block));
});

test('the label styling matches the small, unobtrusive weight of the list-name label', () => {
  const css = read('client/components/cards/minicard.css');
  const at = css.indexOf('.minicard-swimlane-name {');
  assert.ok(at !== -1, '.minicard-swimlane-name must have its own rule');
  const rule = css.slice(at, at + 250);
  assert.ok(/font-size:\s*0\.75em/.test(rule), 'small text, matching .minicard-list-name');
});

test('scope discipline: Swimlanes-view rendering is untouched (negative)', () => {
  const swimlanesJade = fs.existsSync(path.join(repoRoot, 'client/components/swimlanes/swimlanes.jade'))
    ? read('client/components/swimlanes/swimlanes.jade')
    : '';
  assert.ok(!/allowsSwimlaneNameOnMinicard/.test(swimlanesJade),
    'the swimlane-name minicard label is a List-view-only addition; Swimlanes view already groups by swimlane');
});

console.log(`\nminicardSwimlaneNameOnMinicard: ${passed} tests passed`);
