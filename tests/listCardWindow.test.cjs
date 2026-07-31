'use strict';
(async () => {

// Plain-Node tests for the two decisions a board's card list makes on every
// render. Run: node tests/listCardWindow.test.cjs
//
// Both come from a report with screenshots (../log/filter):
//
//   1. "Once a filter is applied for a member, the 3 dots continue to animate" —
//      a list with NO cards under the filter kept a spinner turning at the bottom.
//   2. "random blank cards are appearing on the board" — white minicards with the
//      handle icon and nothing else, mixed in among the real ones.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const { shouldShowLoadMoreSpinner, renderableCardsSelector } =
  await import('../client/lib/listCardWindow.js');
const { windowCountId, selectorKey, stableStringify } =
  await import('../models/lib/cardsLoading.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('listCardWindow:');

// ── 1. the spinner ──────────────────────────────────────────────────────────

test('the reported case: a filter leaves the list empty, so no spinner', () => {
  // The window asked for 20 and got none. Whatever the total says — and it said
  // 25, because the count document still described the UNfiltered list — there is
  // nothing else to fetch.
  assert.strictEqual(
    shouldShowLoadMoreSpinner({ total: 25, loaded: 0, limit: 20 }), false);
});

test('a window that came back short is the whole list', () => {
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: 25, loaded: 3, limit: 20 }), false);
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: 25, loaded: 19, limit: 20 }), false);
});

test('a FULL window with more behind it still offers to load more', () => {
  // The behaviour that has to survive: this is how scrolling a long list works.
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: 25, loaded: 20, limit: 20 }), true);
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: 1000, loaded: 20, limit: 20 }), true);
});

test('a full window with nothing behind it does not', () => {
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: 20, loaded: 20, limit: 20 }), false);
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: 0, loaded: 0, limit: 20 }), false);
});

test('a stale total cannot turn the spinner forever in either direction', () => {
  // Too HIGH (the reported bug): stopped by the short window.
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: 9999, loaded: 4, limit: 20 }), false);
  // Too LOW: the window is full, so the spinner still appears and scrolling
  // continues to work rather than the rest of the list becoming unreachable.
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: 0, loaded: 20, limit: 20 }), false,
    'a total of 0 with a full window is genuinely ambiguous and stays quiet');
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: 21, loaded: 20, limit: 20 }), true);
});

test('negative / missing input never shows a spinner', () => {
  assert.strictEqual(shouldShowLoadMoreSpinner(), false);
  assert.strictEqual(shouldShowLoadMoreSpinner({}), false);
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: 10, loaded: 0, limit: 0 }), false);
  assert.strictEqual(shouldShowLoadMoreSpinner({ total: NaN, loaded: NaN, limit: NaN }), false);
});

// ── 2. blank minicards ──────────────────────────────────────────────────────

test('only documents that carry a title are drawn', () => {
  const sel = renderableCardsSelector({ listId: 'l1', swimlaneId: 's1' });
  assert.deepStrictEqual(sel, {
    listId: 'l1', swimlaneId: 's1', title: { $exists: true },
  });
});

test('a card with an EMPTY title is still a card, and is still drawn', () => {
  // The distinction the whole guard rests on: the schema declares `title` as
  // optional with defaultValue '', so a real card always HAS the key. Only a
  // partially-replicated document lacks it, and `$exists` is what separates them —
  // filtering on a falsy title would hide real cards.
  assert.deepStrictEqual(renderableCardsSelector({}).title, { $exists: true });
  const schema = read('models/cards.js');
  const at = schema.indexOf('    title: {');
  const decl = schema.slice(at, at + 200);
  assert.ok(/optional: true/.test(decl) && /defaultValue: ''/.test(decl),
    'if title ever becomes required-with-no-default this reasoning needs revisiting');
});

test('the selector stays flat, so the card path sees the shape it expects', () => {
  const sel = renderableCardsSelector({ listId: 'l1' });
  assert.ok(!sel.$and, 'no needless $and wrapper');
  assert.strictEqual(sel.listId, 'l1', 'and the original clauses are untouched');
});

test('a selector that already speaks for title is not silently overwritten', () => {
  const sel = renderableCardsSelector({ listId: 'l1', title: 'Exact' });
  assert.deepStrictEqual(sel, { $and: [{ listId: 'l1', title: 'Exact' }, { title: { $exists: true } }] });
});

test('a missing selector still yields a usable one', () => {
  assert.deepStrictEqual(renderableCardsSelector(), { title: { $exists: true } });
  assert.deepStrictEqual(renderableCardsSelector(null), { title: { $exists: true } });
});

// ── the count document id ───────────────────────────────────────────────────

test('two filters no longer share one count document', () => {
  // The root of the stale total. Both of these are "list l1, swimlane s1", and
  // they used to be the same document id, so the second subscription wrote into
  // the first one's document and the client could keep either count.
  const unfiltered = { listId: 'l1', swimlaneId: 's1' };
  const byMember = { listId: 'l1', swimlaneId: 's1', members: { $in: ['ada'] } };
  assert.notStrictEqual(
    windowCountId('l1', 's1', unfiltered),
    windowCountId('l1', 's1', byMember));
});

test('the same filter always names the same document', () => {
  const a = { listId: 'l1', members: { $in: ['ada'] }, swimlaneId: 's1' };
  // Same meaning, built in a different order — the id must not depend on that.
  const b = { swimlaneId: 's1', listId: 'l1', members: { $in: ['ada'] } };
  assert.strictEqual(windowCountId('l1', 's1', a), windowCountId('l1', 's1', b));
  assert.strictEqual(stableStringify(a), stableStringify(b));
});

test('the old two-argument form is unchanged', () => {
  // A caller with no selector to hand still gets the historical id, and the
  // falsy-swimlane collapse it depends on still holds.
  assert.strictEqual(windowCountId('l1', 's1'), 'l1::s1');
  assert.strictEqual(windowCountId('l1', undefined), 'l1::');
  assert.strictEqual(windowCountId('l1', ''), windowCountId('l1', null));
});

test('the key is short, and separates the selectors it is given', () => {
  const key = selectorKey({ listId: 'l1', members: { $in: ['ada'] } });
  assert.ok(/^[0-9a-z]+$/.test(key) && key.length <= 8, `unusable key: ${key}`);
  const seen = new Set();
  for (let i = 0; i < 500; i += 1) {
    seen.add(selectorKey({ listId: 'l1', members: { $in: [`user${i}`] } }));
  }
  assert.strictEqual(seen.size, 500, 'no collisions across a realistic set of filters');
});

// ── wiring ──────────────────────────────────────────────────────────────────

test('the spinner and the cards are measured with the SAME selector', () => {
  // They used to be built in different places from different sources: the cards
  // from the filtered selector, the total from list.cards() or from a count
  // document keyed without the filter. That disagreement IS the bug.
  const js = read('client/components/lists/listBody.js');
  const at = js.indexOf('  showSpinner(swimlaneId) {');
  assert.notStrictEqual(at, -1);
  const body = js.slice(at, js.indexOf('\n  },', at));
  assert.ok(/renderableCardsSelector\(mongoSelector\)/.test(body),
    'showSpinner must use the render selector');
  assert.ok(/shouldShowLoadMoreSpinner\(\{ total, loaded, limit \}\)/.test(body),
    'and defer the decision to the tested helper');
  assert.ok(/isLazyCards\(list\.boardId\)/.test(body),
    'and ask about THIS board, not the current one — the two could disagree');
  assert.ok(!/list\.cards\(swimlaneId\)\.length/.test(body),
    'the old, separately-built count must not come back');

  const cards = js.slice(js.indexOf('  cardsWithLimit(swimlaneId) {'));
  assert.ok(/getCards\(renderableCardsSelector\(mongoSelector\)/.test(cards),
    'and the cards themselves are drawn from that same selector');
});

test('every subscriber names the count document the same way', () => {
  // Two places subscribe to boardListCardCount. If one of them leaves the
  // selector out, they write different documents and the count is never found.
  const listBody = read('client/components/lists/listBody.js');
  assert.ok(/windowCountId\(list\._id, swimlaneId, mongoSelector\)/.test(listBody),
    'listBody subscribes with the selector');
  assert.ok(/windowCountId\(\s*list\._id,\s*swimlaneId,\s*mongoSelector,?\s*\)/.test(listBody),
    'and reads it back with the selector');
  const lazy = read('client/lib/lazyCards.js');
  assert.ok(/windowCountId\(list\._id, swimlaneId, mongoSelector\)/.test(lazy),
    'lazyListCardCount uses the selector too');
});

console.log(`\nlistCardWindow: ${passed} tests passed`);

})();
