'use strict';

// The "Selected: ★" button on All Boards is a TOGGLE over the whole selection.
//
// It only ever added stars: it walked the selection and starred whatever was
// not starred yet. So once every selected board was starred the button did
// nothing at all - clicking it again could not undo what it had just done - and
// its tooltip said "Star the selected boards" whatever state the selection was
// in.
//
// Run: node tests/selectedStars.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const {
  SELECTED_STAR_STAR, SELECTED_STAR_UNSTAR,
  selectedStarAction, selectedStarTitleKey,
} = require('../models/lib/selectedStars');

// A selection where the boards named in `starred` are starred.
const act = (ids, starred = []) =>
  selectedStarAction(ids, id => starred.includes(id));

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('selectedStars:');

test('none starred: star every one of them', () => {
  const r = act(['a', 'b', 'c']);
  assert.strictEqual(r.action, SELECTED_STAR_STAR);
  assert.deepStrictEqual(r.boardIds, ['a', 'b', 'c']);
});

test('all starred: UNSTAR every one of them', () => {
  // This is the case that did nothing before.
  const r = act(['a', 'b', 'c'], ['a', 'b', 'c']);
  assert.strictEqual(r.action, SELECTED_STAR_UNSTAR);
  assert.deepStrictEqual(r.boardIds, ['a', 'b', 'c']);
});

test('some starred: star the REST, and touch nothing else', () => {
  const r = act(['a', 'b', 'c', 'd'], ['b', 'd']);
  assert.strictEqual(r.action, SELECTED_STAR_STAR, 'the action is still star');
  // Only the unstarred ones: the ids returned are the ones to TOGGLE, and
  // toggling an already-starred board would un-star it. A click that starred
  // two boards and un-starred two others is not something a button may do.
  assert.deepStrictEqual(r.boardIds, ['a', 'c']);
});

test('one board on its own toggles both ways', () => {
  assert.deepStrictEqual(act(['a']), { action: SELECTED_STAR_STAR, boardIds: ['a'] });
  assert.deepStrictEqual(act(['a'], ['a']), { action: SELECTED_STAR_UNSTAR, boardIds: ['a'] });
});

test('and starring twice is idempotent, which is the point', () => {
  // Click once from nothing-starred, and everything is starred; the second
  // click is the undo. Before, the second click was a no-op.
  const first = act(['a', 'b']);
  const after = first.boardIds;                       // now starred
  const second = act(['a', 'b'], after);
  assert.strictEqual(second.action, SELECTED_STAR_UNSTAR);
  assert.deepStrictEqual(second.boardIds, ['a', 'b']);
  const third = act(['a', 'b'], []);                  // and back again
  assert.strictEqual(third.action, SELECTED_STAR_STAR);
});

test('an empty or junk selection is answered, not thrown on (negative)', () => {
  for (const empty of [[], null, undefined, 'nonsense', 42]) {
    const r = selectedStarAction(empty, () => true);
    assert.strictEqual(r.action, SELECTED_STAR_STAR, `${JSON.stringify(empty)} is harmless`);
    assert.deepStrictEqual(r.boardIds, []);
  }
  // A hole in the list is not a board.
  assert.deepStrictEqual(act([null, 'a', undefined, ''], []).boardIds, ['a']);
});

test('the tooltip names the direction the button goes', () => {
  assert.strictEqual(selectedStarTitleKey(SELECTED_STAR_STAR), 'set-selected-starred');
  assert.strictEqual(selectedStarTitleKey(SELECTED_STAR_UNSTAR), 'set-selected-unstarred');
  // Anything unexpected reads as "star", the safer of the two to offer.
  assert.strictEqual(selectedStarTitleKey(undefined), 'set-selected-starred');

  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['set-selected-starred'], 'Star the selected boards');
  assert.strictEqual(en['set-selected-unstarred'], 'Unstar the selected boards');
});

test('every language file has the new keys, so none of them loses a tooltip', () => {
  // Untranslated everywhere means the English source stands in as a
  // placeholder, which is what CLAUDE.md's translation policy says happens -
  // but the KEY has to exist in every file or that language shows nothing.
  const dir = path.join(ROOT, 'imports/i18n/data');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'));
  assert.ok(files.length > 100, 'all the language files');
  const missing = files.filter(f => {
    const obj = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return !('set-selected-unstarred' in obj) || !('multi-selection-off' in obj);
  });
  assert.deepStrictEqual(missing, [], `missing in: ${missing.join(', ')}`);
});

test('the click and the label ask the same function', () => {
  // Two copies of "which way does this button go" would be two answers to it,
  // and the label would eventually lie about what the click does.
  //
  // The star action lives in the All Boards SIDEBAR now, with the rest of the
  // actions on a selection - it was a header-bar button with a tooltip, and it
  // is a sidebar row with its name written beside it.
  const js = read('client/components/boards/allBoardsSidebar.js');
  assert.ok(/function currentSelectedStarAction\(\)/.test(js), 'one function decides');
  assert.ok(/currentSelectedStarAction\(\)\.boardIds\.forEach/.test(js),
    'the click toggles exactly the boards it names');
  assert.ok(/selectedStarTitleKey\(currentSelectedStarAction\(\)\.action\)/.test(js),
    'and the label reads the same answer');

  // And the click no longer decides for itself which boards to skip.
  const handler = js.slice(js.indexOf("'click .js-star-selected'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(!/hasStarred/.test(body), 'the handler must not re-derive the rule');

  const jade = read('client/components/boards/allBoardsSidebar.jade');
  assert.ok(/span \{\{selectedStarTitle\}\}/.test(jade),
    'the star row takes its name from the helper, not a fixed string');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nselectedStars: ${passed} tests passed`);
