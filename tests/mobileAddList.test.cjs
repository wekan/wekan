'use strict';

// Mobile mode has no "Add List" row of its own. The + lives in each list header,
// BETWEEN the caret and the drag handle.
//
// Requested: the standing "+ Add List" row wasted a whole row on a phone, and it was
// the last caller of the pre-#6465 addListForm template - desktop had already moved
// Add List into the list header. Now both do the same thing, with the same class, the
// same handler and the same Font Awesome icon, so they are one button in two layouts
// rather than two lookalikes that can drift.
//
// RTL: nothing is placed with a physical left/right. The header is a CSS grid, and a
// grid follows the INLINE axis - under dir="rtl" column 1 is on the right, so the
// whole row mirrors on its own: handle, +, caret, then the title.
//
// Run: node tests/mobileAddList.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const listHeader = read('client/components/lists/listHeader.jade');
const swim = read('client/components/swimlanes/swimlanes.jade');
const swimJs = read('client/components/swimlanes/swimlanes.js');
const css = read('client/components/boards/boardHeader.css');

// The mini-screen, list-overview branch of the list header - the rows a phone shows
// when no single list is selected.
const miniBranch = (() => {
  const at = listHeader.indexOf('a.list-header-menu-icon.js-select-list');
  assert.ok(at > -1, 'the mini-screen list row must exist');
  const end = listHeader.indexOf('else if currentUser.isBoardMember', at);
  return listHeader.slice(at, end === -1 ? undefined : end);
})();

console.log('mobileAddList:');

test('the standing Add List row is gone', () => {
  // addListForm WAS that row. Mobile mode was its last caller.
  assert.ok(!/\+addListForm/.test(swim), 'nothing renders the old row');
  assert.ok(!/template\(name="addListForm"\)/.test(swim), 'and the template is gone');
  assert.ok(!/Template\.addListForm\./.test(swimJs),
    'nor may a handler be left on it - that throws at module load');
});

test('the + is in the list header, between the caret and the drag handle', () => {
  const caret = miniBranch.indexOf('fa-caret-right');
  const plus = miniBranch.indexOf('js-add-list-here');
  const handle = miniBranch.indexOf('js-list-handle');
  assert.ok(caret > -1 && plus > -1 && handle > -1,
    'caret, add-list and handle must all be in the mobile list row');
  assert.ok(caret < plus, 'the + comes after the caret');
  assert.ok(plus < handle, 'and before the drag handle');
});

test('it is the same button as on desktop, not a lookalike', () => {
  // Same class -> same click handler, same behaviour (open the inline composer after
  // this list).
  assert.ok(/a\.js-add-list-here/.test(miniBranch), 'same class as the desktop button');
  const js = read('client/components/lists/listHeader.js');
  assert.ok(/'click \.js-add-list-here'/.test(js), 'and that class has a handler');
  // Same icon, which is what was asked for.
  const desktop = listHeader.slice(listHeader.indexOf('else if currentUser.isBoardMember'));
  const iconOf = src => /js-add-list-here[\s\S]{0,120}?i\.fa\.(fa-[\w-]+)/.exec(src);
  const mobileIcon = iconOf(miniBranch);
  const desktopIcon = iconOf(desktop);
  assert.ok(mobileIcon && desktopIcon, 'both must declare an icon');
  assert.strictEqual(mobileIcon[1], desktopIcon[1],
    'mobile must use the same Font Awesome icon as desktop');
});

test('the grid has a column for it and the caret moves left', () => {
  const header = /\.mobile-mode \.list-header \{([^}]*)\}/.exec(css);
  assert.ok(header, 'the mobile list header must be styled');
  assert.ok(/grid-template-columns:\s*30px 1fr auto auto auto/.test(header[1]),
    'five columns: title, caret, +, handle');
  const col = (sel) => {
    const rule = new RegExp(`\\.mobile-mode \\.list-header \\.${sel} \\{([^}]*)\\}`).exec(css);
    assert.ok(rule, `${sel} must be placed`);
    return /grid-column:\s*(\d+)/.exec(rule[1])[1];
  };
  assert.strictEqual(col('list-header-menu-icon'), '3', 'caret in column 3');
  assert.strictEqual(col('list-header-add-list'), '4', 'the + between them, column 4');
  assert.strictEqual(col('list-header-handle'), '5', 'handle last, column 5');
});

test('the row mirrors in RTL', () => {
  // A grid lays out along the INLINE axis, so column 1 is on the right under
  // dir="rtl" and the row mirrors by itself - as long as nothing pins a physical
  // side. A single `left:`/`right:` here would strand a control on the wrong edge.
  for (const sel of ['list-header-menu-icon', 'list-header-add-list', 'list-header-handle']) {
    const rule = new RegExp(`\\.mobile-mode \\.list-header \\.${sel} \\{([^}]*)\\}`).exec(css)[1];
    assert.ok(!/(^|[\s;])(left|right)\s*:/.test(rule),
      `${sel} must not use a physical left/right - it would not mirror in RTL`);
  }
});

test('an empty swimlane and an empty board keep a + of their own', () => {
  // There is no list header to host the button when there are no lists, so without
  // this the first list could never be created on a phone.
  const mini = swim.slice(swim.indexOf('if isMiniScreen'), swim.indexOf('template(name="listsGroup")'));
  assert.ok(/if swimlaneHasNoLists[\s\S]{0,400}js-open-empty-add-list/.test(mini),
    'an empty swimlane shows its own + in mobile mode');
  const listsGroupMini = swim.slice(swim.indexOf('template(name="listsGroup")'));
  assert.ok(/if boardHasNoLists[\s\S]{0,400}js-open-empty-add-list/.test(listsGroupMini),
    'and so does an empty board in Lists view');
});

test('the composer opens after the list whose + was clicked', () => {
  // Same mechanism as desktop: the click records the list id, and the composer is
  // rendered after that list.
  const mini = swim.slice(swim.indexOf('if isMiniScreen'), swim.indexOf('template(name="listsGroup")'));
  assert.ok(/\+miniList\(this\)\s*\n\s*if isAddListAfter _id\s*\n\s*\+addListInline/.test(mini),
    'the inline composer is rendered after the list it belongs to');
  assert.ok(/isAddListAfter\(listId\)/.test(swimJs), 'and the helper still exists');
});

test('clicking the + does not also open the list', () => {
  // In mobile mode the whole row is an `a.js-select-list` and the + sits INSIDE it, so
  // the click bubbled to the ancestor and opened the list as well - you asked to add a
  // list and got taken into one. preventDefault does not stop that; only
  // stopPropagation does.
  const js = read('client/components/lists/listHeader.js');
  const handler = /'click \.js-add-list-here'\(event\) \{[\s\S]*?\n  \},/.exec(js);
  assert.ok(handler, 'the add-list handler must exist');
  assert.ok(/event\.stopPropagation\(\)/.test(handler[0]),
    'the click must not reach the row js-select-list handler');
  // The row really is a select-list anchor, which is why this is needed.
  const listJade = read('client/components/lists/list.jade');
  assert.ok(/a\.mini-list\.js-select-list/.test(listJade),
    'the mobile row is an anchor that opens the list');
});

console.log(`\nmobileAddList: ${passed} tests passed`);
