'use strict';

// The page sidebar's controls look like sidebar rows.
// Run: node tests/pageSidebarControls.test.cjs
//
// Rules, My Cards, Due Cards and Global Search each keep their controls in the
// shared page sidebar (models/lib/pageSidebar.js), and each draws them as
// `.board-header-btn` - which is what they were when they lived in that page's
// own second header bar.
//
// Every rule for that class is scoped to `#header-quick-access` (header.css),
// so inside the sidebar they had NO styling at all: three bare links jammed on
// one line, icons run into words, nothing to click but the text. Reported from
// the Rules page, where it is three links reading
// "← Board 🔀 Workflow view ⇄ Import / export" with no space between them.
//
// They are rows now - one per line, the width of the panel, with the icon in a
// fixed column so every label starts at the same x, like the board sidebar's
// own rows.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const css = read('client/components/boards/boardsList.css');
const pageSidebar = read('models/lib/pageSidebar.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('pageSidebarControls:');

test('a control in the page sidebar is a row', () => {
  const rule = css.slice(css.indexOf('.page-sidebar .sidebar-content .board-header-btn {'));
  const body = rule.slice(0, rule.indexOf('}'));
  assert.ok(/display: flex/.test(body) && /align-items: center/.test(body),
    'the icon and the label sit on one line together');
  assert.ok(/width: 100%/.test(body), 'and the row is the width of the panel');
  assert.ok(/padding: 8px 10px/.test(body), 'with room to click');
  assert.ok(/cursor: pointer/.test(body), 'and it says it can be clicked');
});

test('the icons line the labels up (negative)', () => {
  // A row with a caret and a row without one must still start their words at
  // the same x, or the list reads as ragged.
  const rule = css.slice(css.indexOf('.page-sidebar .sidebar-content .board-header-btn i.fa'));
  const body = rule.slice(0, rule.indexOf('}'));
  assert.ok(/width: 16px/.test(body) && /text-align: center/.test(body),
    'the icon has a column of its own');
  assert.ok(/flex-shrink: 0/.test(body), 'which does not collapse under a long label');
});

test('both sidebars that use this shell get it', () => {
  // All Boards has its own sidebar with the same shell and the same problem.
  assert.ok(/\.all-boards-sidebar \.sidebar-content \.board-header-btn,\n\.page-sidebar \.sidebar-content \.board-header-btn \{/
    .test(css), 'the rule names both');
});

test('it is the class the pages actually use (negative)', () => {
  // Not a new class invented for the sidebar: every controls template draws
  // `.board-header-btn`, because that is what these controls were.
  for (const rel of ['client/components/rules/rulesMain.jade',
    'client/components/main/myCards.jade']) {
    assert.ok(/a\.board-header-btn/.test(read(rel)), `${rel} draws that class`);
  }
  assert.ok(/'board-rules': 'rulesControls'/.test(pageSidebar),
    'and the page sidebar is what renders them');
});

console.log(`\npageSidebarControls: ${passed} tests passed`);
