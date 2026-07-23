'use strict';
(async () => {

// Unit + negative tests for the card-title "#" label autocomplete matcher
// (issue #5116): typing "#test" must suggest a label named "Testing".
// Run: node tests/labelAutocompleteMatch.test.cjs

const assert = require('assert');
const {
  labelMatchesTerm,
  filterLabelsByTerm,
} = await import('../models/lib/labelAutocomplete.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const L = (name, color) => ({ _id: name + '-id', name, color });
const BOARD = [
  L('Testing', 'green'),
  L('To Do', 'yellow'),
  L('URGENT', 'red'),
  L('', 'blue'), // a color-only label (no name)
];

// ── the exact #5116 scenario ────────────────────────────────────────────────
check('#5116: lowercase "test" matches label "Testing"', () => {
  assert.strictEqual(labelMatchesTerm(L('Testing', 'green'), 'test'), true);
});
check('#5116: mixed-case "Test" still matches "Testing" (unchanged behaviour)', () => {
  assert.strictEqual(labelMatchesTerm(L('Testing', 'green'), 'Test'), true);
});
check('#5116: uppercase "TESTING" matches "Testing"', () => {
  assert.strictEqual(labelMatchesTerm(L('Testing', 'green'), 'TESTING'), true);
});
check('lowercase term matches an ALL-CAPS label ("urg" -> "URGENT")', () => {
  assert.strictEqual(labelMatchesTerm(L('URGENT', 'red'), 'urg'), true);
});

// ── color fallback (labels shown by color when unnamed) ─────────────────────
check('matches by color name, case-insensitively ("BLUE" -> blue label)', () => {
  assert.strictEqual(labelMatchesTerm(L('', 'blue'), 'BLUE'), true);
  assert.strictEqual(labelMatchesTerm(L('', 'Blue'), 'blue'), true);
});

// ── empty term shows every label (menu before typing) ───────────────────────
check('empty term matches every label', () => {
  assert.strictEqual(labelMatchesTerm(L('Testing', 'green'), ''), true);
  assert.strictEqual(filterLabelsByTerm(BOARD, '').length, BOARD.length);
});

// ── negative cases ──────────────────────────────────────────────────────────
check('a non-substring term matches nothing (negative)', () => {
  assert.strictEqual(labelMatchesTerm(L('Testing', 'green'), 'zzz'), false);
  assert.deepStrictEqual(filterLabelsByTerm(BOARD, 'zzz'), []);
});
check('does not throw on missing name/color or a null label (negative)', () => {
  assert.strictEqual(labelMatchesTerm({ color: 'green' }, 'gr'), true);
  assert.strictEqual(labelMatchesTerm({ name: 'X' }, 'x'), true);
  assert.strictEqual(labelMatchesTerm(null, 'x'), false);
  assert.strictEqual(labelMatchesTerm({}, 'x'), false);
});

// ── filterLabelsByTerm preserves order and does not mutate ──────────────────
check('filterLabelsByTerm keeps input order and leaves the input untouched', () => {
  const input = BOARD.slice();
  // "t" (case-insensitively) is in Testing, To Do and urgenT — kept in board order.
  const out = filterLabelsByTerm(BOARD, 't');
  assert.deepStrictEqual(out.map(l => l.name), ['Testing', 'To Do', 'URGENT']);
  assert.deepStrictEqual(BOARD, input, 'input array unchanged');
});
check('filterLabelsByTerm tolerates a non-array (negative)', () => {
  assert.deepStrictEqual(filterLabelsByTerm(null, 'x'), []);
  assert.deepStrictEqual(filterLabelsByTerm(undefined, 'x'), []);
});

// ── source guard: listBody.js uses the shared matcher, not a raw indexOf ─────
check('listBody.js label strategy routes through labelMatchesTerm (no case-sensitive indexOf)', () => {
  const fs = require('fs');
  const path = require('path');
  const raw = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'lists', 'listBody.js'),
    'utf8',
  );
  // Strip comments first: the fix keeps a comment that MENTIONS the old
  // label.name.indexOf(term) code, which would otherwise trip the negative guard.
  const src = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  assert.ok(/labelMatchesTerm\(label, term\)/.test(src),
    'label search must call labelMatchesTerm(label, term)');
  assert.ok(!/label\.name\.indexOf\(term\)/.test(src),
    'the case-sensitive label.name.indexOf(term) must be gone from the active code');
});

console.log(`\nlabelAutocompleteMatch: ${passed} checks passed`);

})().catch(e => { console.error(e); process.exit(1); });