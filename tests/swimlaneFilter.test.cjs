'use strict';

// Plain-Node unit test (no Meteor) for the per-list / per-swimlane card
// selector builder. Run: node tests/swimlaneFilter.test.cjs
//
// Regression guard for #6441 ("Label filter works in one swimlane but not
// another on the same board"): the board scopes each list's cards to the
// current swimlane while still surfacing shared/orphaned cards (no swimlane).
// That swimlane-membership fallback used to be a bare top-level `$or`, which
// competes with the board Filter's own top-level `$or` (label/member criteria)
// when the two selectors are combined into one document — dropping the label
// criterion in every swimlane except the default one. The builder must express
// the fallback as a single `swimlaneId: { $in: [...] }` clause and combine the
// Filter with `$and`, so a labelled card matches — and an unlabelled card does
// NOT match — the SAME way regardless of which swimlane it is rendered in.

const assert = require('assert');
const {
  swimlaneMembershipSelector,
  listCardsSelector,
  combineWithFilter,
  filteredListCardsSelector,
} = require('../models/lib/swimlaneFilter');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// A tiny Mongo/Minimongo-like matcher supporting exactly the operators the
// builder emits ($and, $or, $in with null/missing, array containment,
// scalar equality), so we can assert the built selector actually selects (or
// rejects) representative card documents rather than eyeballing query shape.
function fieldMatches(cond, value) {
  if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
    if ('$in' in cond) {
      const list = cond.$in;
      if (Array.isArray(value)) {
        // array field (e.g. labelIds): matches when any element is in the list
        return value.some(v => list.includes(v));
      }
      // scalar field: null in the list matches null AND a missing field
      if (value === undefined || value === null) {
        return list.includes(null) || list.includes(undefined);
      }
      return list.includes(value);
    }
    if ('$nin' in cond) {
      // negation of $in (#6443 first-swimlane orphaned-card clause). A missing /
      // null field matches $nin unless null/undefined is explicitly excluded.
      const list = cond.$nin;
      if (Array.isArray(value)) {
        return !value.some(v => list.includes(v));
      }
      if (value === undefined || value === null) {
        return !(list.includes(null) || list.includes(undefined));
      }
      return !list.includes(value);
    }
  }
  return value === cond;
}

function docMatches(selector, doc) {
  return Object.entries(selector).every(([key, cond]) => {
    if (key === '$and') return cond.every(sub => docMatches(sub, doc));
    if (key === '$or') return cond.some(sub => docMatches(sub, doc));
    return fieldMatches(cond, doc[key]);
  });
}

// The shape Filter._getMongoSelector() produces for an active label filter:
// an exceptions clause (empty here) OR the label criterion.
function labelFilterSelector(labelId) {
  return {
    $or: [
      { _id: { $in: [] } },            // exceptions (none)
      { labelIds: { $in: [labelId] } },
    ],
  };
}

const RECURRING = 'label-recurring';
const FOCUS = 'swimlane-focus';
const BACKGROUND = 'swimlane-background';
const LIST = 'list-1';

// --- swimlaneMembershipSelector ---------------------------------------------
test('swimlaneMembershipSelector uses a single $in clause, not a top-level $or', () => {
  const sel = swimlaneMembershipSelector(BACKGROUND);
  assert.deepStrictEqual(sel, { swimlaneId: { $in: [BACKGROUND, null, ''] } });
  assert.ok(!('$or' in sel), 'must NOT introduce a top-level $or (#6441)');
});

test('swimlaneMembershipSelector is empty without a swimlane context', () => {
  assert.deepStrictEqual(swimlaneMembershipSelector(undefined), {});
  assert.deepStrictEqual(swimlaneMembershipSelector(''), {});
});

test('the swimlane clause matches the swimlane plus orphaned/shared cards', () => {
  const sel = swimlaneMembershipSelector(BACKGROUND);
  assert.ok(docMatches(sel, { swimlaneId: BACKGROUND }));
  assert.ok(docMatches(sel, { swimlaneId: null }));
  assert.ok(docMatches(sel, { swimlaneId: '' }));
  assert.ok(docMatches(sel, {}), 'missing swimlaneId is treated as orphaned');
  assert.ok(!docMatches(sel, { swimlaneId: FOCUS }), 'other swimlane excluded');
});

// --- combineWithFilter -------------------------------------------------------
test('combineWithFilter ANDs the filter in and never drops it', () => {
  const base = { listId: LIST, archived: false };
  const filter = labelFilterSelector(RECURRING);
  const combined = combineWithFilter(base, filter);
  assert.deepStrictEqual(combined, { $and: [filter, base] });
});

test('combineWithFilter returns the base unchanged with no active filter', () => {
  const base = { listId: LIST, archived: false };
  assert.strictEqual(combineWithFilter(base, null), base);
  assert.strictEqual(combineWithFilter(base, {}), base);
});

// --- filteredListCardsSelector: POSITIVE ------------------------------------
test('#6441: a labelled card matches in the Focus swimlane', () => {
  const sel = filteredListCardsSelector(LIST, FOCUS, labelFilterSelector(RECURRING));
  const card = { _id: 'c1', listId: LIST, archived: false, swimlaneId: FOCUS, labelIds: [RECURRING] };
  assert.ok(docMatches(sel, card));
});

test('#6441: a labelled card matches in the Background swimlane too', () => {
  const sel = filteredListCardsSelector(LIST, BACKGROUND, labelFilterSelector(RECURRING));
  const card = { _id: 'c2', listId: LIST, archived: false, swimlaneId: BACKGROUND, labelIds: [RECURRING] };
  assert.ok(docMatches(sel, card), 'label filter must apply board-wide, not only in the first swimlane');
});

// --- filteredListCardsSelector: NEGATIVE ------------------------------------
test('#6441: an unlabelled card is hidden in the Focus swimlane', () => {
  const sel = filteredListCardsSelector(LIST, FOCUS, labelFilterSelector(RECURRING));
  const card = { _id: 'c3', listId: LIST, archived: false, swimlaneId: FOCUS, labelIds: ['label-other'] };
  assert.ok(!docMatches(sel, card));
});

test('#6441: an unlabelled card is hidden in the Background swimlane too', () => {
  const sel = filteredListCardsSelector(LIST, BACKGROUND, labelFilterSelector(RECURRING));
  const card = { _id: 'c4', listId: LIST, archived: false, swimlaneId: BACKGROUND, labelIds: ['label-other'] };
  assert.ok(!docMatches(sel, card), 'the label filter must hide non-matching cards in Background (#6441)');
});

// --- the core regression: SAME result regardless of swimlane ----------------
test('#6441: matching result is identical across swimlanes for the same card', () => {
  const labelled = { _id: 'c5', listId: LIST, archived: false, labelIds: [RECURRING] };
  const unlabelled = { _id: 'c6', listId: LIST, archived: false, labelIds: [] };

  [FOCUS, BACKGROUND].forEach(swimlaneId => {
    const sel = filteredListCardsSelector(LIST, swimlaneId, labelFilterSelector(RECURRING));
    // place each card in this swimlane, then evaluate
    const inHere = id => Object.assign({}, id === 'labelled' ? labelled : unlabelled, { swimlaneId });
    assert.strictEqual(docMatches(sel, inHere('labelled')), true, `labelled card must match in ${swimlaneId}`);
    assert.strictEqual(docMatches(sel, inHere('unlabelled')), false, `unlabelled card must NOT match in ${swimlaneId}`);
  });
});

test('#6441: an orphaned (no swimlane) card is filtered consistently in every swimlane', () => {
  const orphanLabelled = { _id: 'c7', listId: LIST, archived: false }; // no swimlaneId, no labels
  const orphanWithLabel = { _id: 'c8', listId: LIST, archived: false, labelIds: [RECURRING] };

  [FOCUS, BACKGROUND].forEach(swimlaneId => {
    const sel = filteredListCardsSelector(LIST, swimlaneId, labelFilterSelector(RECURRING));
    assert.ok(!docMatches(sel, orphanLabelled), `orphaned unlabelled card hidden in ${swimlaneId}`);
    assert.ok(docMatches(sel, orphanWithLabel), `orphaned labelled card shown in ${swimlaneId}`);
  });
});

// --- do not regress other filter types --------------------------------------
test('a non-label filter (e.g. member) is likewise preserved across swimlanes', () => {
  const memberFilter = { $or: [{ _id: { $in: [] } }, { members: { $in: ['user-a'] } }] };
  [FOCUS, BACKGROUND].forEach(swimlaneId => {
    const sel = filteredListCardsSelector(LIST, swimlaneId, memberFilter);
    const match = { _id: 'm1', listId: LIST, archived: false, swimlaneId, members: ['user-a'] };
    const noMatch = { _id: 'm2', listId: LIST, archived: false, swimlaneId, members: ['user-b'] };
    assert.ok(docMatches(sel, match));
    assert.ok(!docMatches(sel, noMatch));
  });
});

test('archived cards never match the active-cards selector', () => {
  const sel = filteredListCardsSelector(LIST, FOCUS, labelFilterSelector(RECURRING));
  const card = { _id: 'c9', listId: LIST, archived: true, swimlaneId: FOCUS, labelIds: [RECURRING] };
  assert.ok(!docMatches(sel, card));
});

// --- #6443: orphaned-swimlane cards surface in the FIRST swimlane -----------
// BACKGROUND is treated as the board's first swimlane; FOCUS is another
// existing swimlane; DELETED is a swimlaneId that no longer exists (orphaned).
const DELETED = 'swimlane-deleted';

test('#6443: first-swimlane clause is a single $nin field clause (no $or)', () => {
  const sel = swimlaneMembershipSelector(BACKGROUND, [FOCUS]);
  assert.deepStrictEqual(sel, { swimlaneId: { $nin: [FOCUS] } });
  assert.ok(!('$or' in sel), 'must NOT introduce a top-level $or (#6441)');
});

test('#6443: first swimlane surfaces own, shared AND orphaned cards; excludes other swimlanes', () => {
  const sel = swimlaneMembershipSelector(BACKGROUND, [FOCUS]);
  assert.ok(docMatches(sel, { swimlaneId: BACKGROUND }), 'own card');
  assert.ok(docMatches(sel, { swimlaneId: null }), 'null/shared card');
  assert.ok(docMatches(sel, { swimlaneId: '' }), 'empty/shared card');
  assert.ok(docMatches(sel, {}), 'missing swimlaneId');
  assert.ok(docMatches(sel, { swimlaneId: DELETED }), 'orphaned card (deleted swimlane) now visible');
  assert.ok(!docMatches(sel, { swimlaneId: FOCUS }), 'card owned by another existing swimlane excluded');
});

test('#6443: a non-first swimlane does NOT show orphaned cards (own + shared only)', () => {
  const sel = swimlaneMembershipSelector(FOCUS); // no otherSwimlaneIds passed
  assert.ok(docMatches(sel, { swimlaneId: FOCUS }));
  assert.ok(docMatches(sel, { swimlaneId: null }));
  assert.ok(!docMatches(sel, { swimlaneId: DELETED }), 'orphaned card is not duplicated into non-first swimlanes');
});

test('#6443: single-swimlane board (otherSwimlaneIds = []) shows every card in that swimlane', () => {
  const sel = swimlaneMembershipSelector(BACKGROUND, []);
  assert.deepStrictEqual(sel, { swimlaneId: { $nin: [] } });
  assert.ok(docMatches(sel, { swimlaneId: BACKGROUND }));
  assert.ok(docMatches(sel, { swimlaneId: DELETED }), 'orphaned card visible on a single-swimlane board');
  assert.ok(docMatches(sel, { swimlaneId: null }));
});

test('#6443: label filter still applies alongside the first-swimlane orphaned clause (no $or clash)', () => {
  const sel = filteredListCardsSelector(LIST, BACKGROUND, labelFilterSelector(RECURRING), [FOCUS]);
  const orphanLabelled = { _id: 'o1', listId: LIST, archived: false, swimlaneId: DELETED, labelIds: [RECURRING] };
  const orphanUnlabelled = { _id: 'o2', listId: LIST, archived: false, swimlaneId: DELETED, labelIds: [] };
  assert.ok(docMatches(sel, orphanLabelled), 'orphaned labelled card shown in the first swimlane');
  assert.ok(!docMatches(sel, orphanUnlabelled), 'orphaned unlabelled card still hidden by the active label filter');
});

console.log(`\n${passed} tests passed`);
