'use strict';

// Plain-Node regression test (no Meteor) for issue #5659:
// "Bug: List Width settings do not affect Public Board".
//
// Root cause: the default list width was duplicated across the resolution
// paths and DISAGREED — models/users.js fell back to 270 (getListWidth and the
// anonymous/public-board getListWidthFromStorage path) while the client and
// the lists schema used 272 — so lists whose width resolved through different
// paths could render at different "defaults" on the same (public) board.
//
// The fix is models/lib/listWidth.js: ONE Meteor-free module holding the
// default/minimum width and the resolution order, imported by
// client/components/lists/list.js, client/components/lists/listHeader.js and
// models/users.js. This test pins:
//   - with NO customization, every list resolves to the SAME default width,
//     for members and for logged-out visitors of public boards alike;
//   - a valid customized width (shared, personal, or fixed mode) still wins;
//   - invalid / below-minimum values can NOT make one list differ;
//   - the consumers really import the shared module (no local re-definitions).
//
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/listWidthDefaults.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  DEFAULT_LIST_WIDTH,
  MIN_LIST_WIDTH,
  isValidListWidth,
  normalizeListWidth,
  resolveListWidth,
} = require('../models/lib/listWidth');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- The one default ---------------------------------------------------------

test('there is a single sane default width (>= minimum)', () => {
  assert.strictEqual(typeof DEFAULT_LIST_WIDTH, 'number');
  assert.strictEqual(typeof MIN_LIST_WIDTH, 'number');
  // #6465: narrowed defaults so more lists fit on screen.
  assert.strictEqual(DEFAULT_LIST_WIDTH, 220);
  assert.strictEqual(MIN_LIST_WIDTH, 200);
  assert.ok(DEFAULT_LIST_WIDTH >= MIN_LIST_WIDTH);
});

test('with no customization, EVERY list gets the same width (public-board default)', () => {
  // A logged-out visitor of a public board: no fixed mode, shared mode
  // (allowsPersonalListWidth=false), no stored widths anywhere. Simulate a
  // whole board of lists in every "empty" shape a list doc can have.
  const uncustomizedLists = [
    {}, // no width field at all (pre-6409 list)
    { width: undefined },
    { width: null },
  ];
  const widths = uncustomizedLists.map(l =>
    resolveListWidth({ sharedWidth: l.width, personalMode: false }),
  );
  widths.forEach(w => assert.strictEqual(w, DEFAULT_LIST_WIDTH));
  // ... and the same holds in personal mode with nothing stored (anon
  // localStorage empty / logged-in profile empty).
  const personal = uncustomizedLists.map(l =>
    resolveListWidth({
      sharedWidth: l.width,
      personalMode: true,
      personalWidth: null,
    }),
  );
  personal.forEach(w => assert.strictEqual(w, DEFAULT_LIST_WIDTH));
  // ... and with no options at all.
  assert.strictEqual(resolveListWidth(), DEFAULT_LIST_WIDTH);
  assert.strictEqual(resolveListWidth({}), DEFAULT_LIST_WIDTH);
});

// --- Customized widths still win ---------------------------------------------

test('a customized shared width (lists.width) still wins for every viewer', () => {
  assert.strictEqual(resolveListWidth({ sharedWidth: 400 }), 400);
  // Shared widths apply in shared mode regardless of viewer login state — the
  // resolver has no user input in shared mode at all.
  assert.strictEqual(
    resolveListWidth({ sharedWidth: 400, personalMode: false, personalWidth: 999 }),
    400,
  );
});

test('a personal width wins over the shared width in personal mode only', () => {
  assert.strictEqual(
    resolveListWidth({ sharedWidth: 400, personalMode: true, personalWidth: 350 }),
    350,
  );
  // negative: personal width must NOT leak into shared mode
  assert.strictEqual(
    resolveListWidth({ sharedWidth: 400, personalMode: false, personalWidth: 350 }),
    400,
  );
  // personal mode with no personal width falls back to the shared width
  assert.strictEqual(
    resolveListWidth({ sharedWidth: 400, personalMode: true, personalWidth: null }),
    400,
  );
});

test('fixed ("same width for all lists") mode overrides everything (#5729)', () => {
  assert.strictEqual(
    resolveListWidth({
      fixedEnabled: true,
      fixedWidth: 500,
      sharedWidth: 400,
      personalMode: true,
      personalWidth: 350,
    }),
    500,
  );
  // negative: fixed width is ignored while the mode is off
  assert.strictEqual(
    resolveListWidth({ fixedEnabled: false, fixedWidth: 500, sharedWidth: 400 }),
    400,
  );
  // fixed mode without a stored value uses the same single default
  assert.strictEqual(
    resolveListWidth({ fixedEnabled: true, fixedWidth: null, sharedWidth: 400 }),
    DEFAULT_LIST_WIDTH,
  );
});

// --- Invalid values can never make one list differ ---------------------------

test('below-minimum / bogus stored widths fall back to the default (negative)', () => {
  // the lists schema historically allowed 100-1000, but the render minimum is
  // 270; anything below must not make one list narrower than the rest.
  [269, 100, 0, -5, NaN, Infinity, '400', {}, [], true].forEach(bad => {
    assert.strictEqual(isValidListWidth(bad), false, `isValidListWidth(${String(bad)})`);
    assert.strictEqual(normalizeListWidth(bad), DEFAULT_LIST_WIDTH);
    assert.strictEqual(resolveListWidth({ sharedWidth: bad }), DEFAULT_LIST_WIDTH);
    assert.strictEqual(
      resolveListWidth({ fixedEnabled: true, fixedWidth: bad }),
      DEFAULT_LIST_WIDTH,
    );
  });
  // an invalid personal width falls back to the (valid) shared width
  assert.strictEqual(
    resolveListWidth({ sharedWidth: 400, personalMode: true, personalWidth: 100 }),
    400,
  );
});

test('boundary widths behave (negative + positive)', () => {
  assert.strictEqual(isValidListWidth(MIN_LIST_WIDTH), true);
  assert.strictEqual(isValidListWidth(MIN_LIST_WIDTH - 1), false);
  assert.strictEqual(resolveListWidth({ sharedWidth: MIN_LIST_WIDTH }), MIN_LIST_WIDTH);
  assert.strictEqual(
    resolveListWidth({ sharedWidth: MIN_LIST_WIDTH - 1 }),
    DEFAULT_LIST_WIDTH,
  );
});

test('normalizeListWidth honors an explicit fallback', () => {
  assert.strictEqual(normalizeListWidth(300, 400), 300);
  assert.strictEqual(normalizeListWidth(null, 400), 400);
});

// --- The consumers really use the shared module ------------------------------

test('client list.js imports the shared module and defines no local default', () => {
  const src = read('client/components/lists/list.js');
  assert.ok(src.includes("from '/models/lib/listWidth'"), 'imports /models/lib/listWidth');
  assert.ok(src.includes('resolveListWidth('), 'resolves widths via resolveListWidth');
  // negative: the old duplicated constants must not come back
  assert.ok(!/const\s+DEFAULT_LIST_WIDTH\s*=/.test(src), 'no local DEFAULT_LIST_WIDTH');
  assert.ok(!/const\s+MIN_LIST_WIDTH\s*=/.test(src), 'no local MIN_LIST_WIDTH');
});

test('client listHeader.js imports the shared module and hardcodes no default', () => {
  const src = read('client/components/lists/listHeader.js');
  assert.ok(src.includes("from '/models/lib/listWidth'"), 'imports /models/lib/listWidth');
  // negative: the old "?: 272" / ">= 270" literals must not come back
  assert.ok(!/\breturn 272\b/.test(src), 'no hardcoded 272 default');
  assert.ok(!/>=\s*270\b/.test(src), 'no hardcoded 270 minimum');
});

test('models/users.js no longer falls back to a DIFFERENT default (270)', () => {
  const src = read('models/users.js');
  assert.ok(src.includes("from '/models/lib/listWidth'"), 'imports /models/lib/listWidth');
  // negative: these exact lines were the #5659 root cause
  assert.ok(!/return 270;?\s*\/\/\s*TODO/.test(src), 'old getListWidth 270 default gone');
  assert.ok(!/return 270;?\s*\/\/\s*Return default width/.test(src), 'old storage 270 default gone');
  assert.ok(!/\breturn 270\b/.test(src), 'no width helper returns 270 anymore');
  assert.ok(/getListWidth\(boardId, listId\) \{[\s\S]*?DEFAULT_LIST_WIDTH/.test(src),
    'getListWidth falls back to the shared DEFAULT_LIST_WIDTH');
});

test('the lists schema default matches the shared default', () => {
  const src = read('models/lists.js');
  const m = src.match(/width:\s*\{[\s\S]*?defaultValue:\s*(\d+)/);
  assert.ok(m, 'lists.width schema has a defaultValue');
  assert.strictEqual(Number(m[1]), DEFAULT_LIST_WIDTH);
});

console.log(`\n${passed} tests passed`);
