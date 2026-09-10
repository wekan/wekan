'use strict';

// Regression coverage for #766 ("Add [a] Dropzone to List Titles"): dropping
// a dragged card precisely onto another list's HEADER (the `.js-list-header`
// element, above `.list-body`) did nothing - the card snapped back to its
// source list - because the card sortable's `connectWith:
// '.js-minicards:not(.js-list-full)'` (list.js) only covers each list's
// card-body area. The header sits in normal flow directly above it and does
// not overlap it, so jQuery UI's own connectWith/intersection resolution
// never finds a container there and silently cancels the drop.
//
// The fix does not add a second, separate drop implementation: it detects a
// header-targeted mouseup from the sortable `stop` callback's own event
// coordinates and, when found, resolves the SAME prevCardDom/nextCardDom/
// listId/targetContainer values that a normal top-of-list-body drop would
// produce, so the rest of the handler - including the single `card.move(...)`
// call - is unchanged and reused as-is.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const listJs = read('client/components/lists/list.js');
const listHeaderJade = read('client/components/lists/listHeader.jade');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('listHeaderCardDrop766:');

test('the list header carries the .js-list-header class the drop detection hit-tests for', () => {
  assert.match(listHeaderJade, /\.list-header\.js-list-header\(/);
});

test('the card sortable stop handler detects a drop over another list\'s header', () => {
  const stopAt = listJs.indexOf('stop(evt, ui) {');
  assert.ok(stopAt >= 0, 'stop handler exists');
  const stopBody = listJs.slice(stopAt, stopAt + 4000);
  assert.match(
    stopBody,
    /document\.elementFromPoint\(evt\.clientX, evt\.clientY\)/,
    'hit-tests the drop point',
  );
  assert.match(
    stopBody,
    /closest\('\.js-list-header'\)/,
    'looks for a .js-list-header ancestor at the drop point',
  );
});

test('a header drop resolves to the TOP of that list\'s card body (no prev card, first card as next)', () => {
  const stopAt = listJs.indexOf('stop(evt, ui) {');
  const stopBody = listJs.slice(stopAt, stopAt + 4000);
  const branchAt = stopBody.indexOf('if (headerDropList) {');
  assert.ok(branchAt >= 0, 'header-drop branch exists');
  const branch = stopBody.slice(branchAt, branchAt + 400);
  assert.match(branch, /prevCardDom = null/);
  assert.match(branch, /nextCardDom = headerDropContainer/);
});

test('a header drop reuses listData/targetContainer resolution rather than duplicating it', () => {
  assert.match(
    listJs,
    /const listData = headerDropList[\s\S]{0,120}\? Blaze\.getData\(headerDropList\)/,
  );
  assert.match(
    listJs,
    /const targetContainer = headerDropContainer \|\| ui\.item\.parent\(\)\.get\(0\);/,
  );
});

test('the header-drop path adds no new move mutation - only the two pre-existing card.move(...) call sites remain (multi-selection loop and single-card drop)', () => {
  const moveCallSites = listJs.match(/\bcard\.move\(\s*\n/g) || [];
  assert.strictEqual(
    moveCallSites.length,
    2,
    'expected exactly the pre-existing multi-selection and single-card card.move() call sites, no header-drop-specific duplicate',
  );
});

console.log(`listHeaderCardDrop766: ${passed} passed`);
