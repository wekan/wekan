'use strict';

// Plain-Node unit test (no Meteor) for the Calendar view's card selector
// builders. Run: node tests/calendarFilter.test.cjs
//
// Regression guard for #5656 ("Filter not working for Calendar"): the board
// Filter sidebar (member / assignee / due-date / label / custom-field) scopes
// the Board / Lists / Swimlanes views, but the Calendar view used to query
// cards with only a board+date selector and IGNORE the active Filter, showing
// every card in the interval. The builders must AND the Filter selector into
// the date-interval selector so the Calendar honors the same filter as the
// other views — while leaving the selector unchanged when no filter is active.

const assert = require('assert');
const {
  cardsDueInBetweenSelector,
  cardsInIntervalSelector,
} = require('../models/lib/calendarFilter');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Minimal Mongo/Minimongo-like matcher for the operators these selectors emit
// ($and, $or, $in with null/missing, $gte/$lte on comparable values, array
// containment, scalar equality) so we can assert the built selector actually
// selects/rejects representative card documents.
function fieldMatches(cond, value) {
  if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
    if ('$in' in cond) {
      const list = cond.$in;
      if (Array.isArray(value)) return value.some(v => list.includes(v));
      if (value === undefined || value === null) {
        return list.includes(null) || list.includes(undefined);
      }
      return list.includes(value);
    }
    let ok = true;
    if ('$gte' in cond) ok = ok && value !== undefined && value >= cond.$gte;
    if ('$lte' in cond) ok = ok && value !== undefined && value <= cond.$lte;
    if ('$gte' in cond || '$lte' in cond) return ok;
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

// The shape Filter._getMongoSelector() produces for an active assignee filter:
// an exceptions clause (empty here) OR the assignee criterion.
function assigneeFilterSelector(userId) {
  return {
    $or: [
      { _id: { $in: [] } }, // exceptions (none)
      { assignees: { $in: [userId] } },
    ],
  };
}

const BOARD = 'board-1';
const USER = 'user-a';
const START = 100; // use plain numbers as stand-in comparable timestamps
const END = 200;

// --- no active filter: selector unchanged -----------------------------------
test('#5656: cardsDueInBetweenSelector is unchanged when no filter is active', () => {
  const base = { boardId: BOARD, dueAt: { $gte: START, $lte: END } };
  assert.deepStrictEqual(cardsDueInBetweenSelector(BOARD, START, END), base);
  assert.deepStrictEqual(cardsDueInBetweenSelector(BOARD, START, END, {}), base);
  assert.deepStrictEqual(cardsDueInBetweenSelector(BOARD, START, END, null), base);
});

test('#5656: cardsInIntervalSelector is unchanged when no filter is active', () => {
  const sel = cardsInIntervalSelector(BOARD, START, END);
  assert.strictEqual(sel.boardId, BOARD);
  assert.ok(Array.isArray(sel.$or) && sel.$or.length === 3);
  assert.ok(!('$and' in sel), 'no filter must not introduce $and wrapping');
});

// --- active filter: ANDed in -------------------------------------------------
test('#5656: an active filter is ANDed into the due-date selector', () => {
  const filter = assigneeFilterSelector(USER);
  const sel = cardsDueInBetweenSelector(BOARD, START, END, filter);
  assert.deepStrictEqual(sel, {
    $and: [filter, { boardId: BOARD, dueAt: { $gte: START, $lte: END } }],
  });
});

test('#5656: an active filter is ANDed into the interval selector without $or clash', () => {
  const filter = assigneeFilterSelector(USER);
  const sel = cardsInIntervalSelector(BOARD, START, END, filter);
  // Top-level object carries $and (filter + base). The base keeps its own $or;
  // the filter keeps its own $or. Neither is dropped because they live in
  // separate $and branches.
  assert.ok('$and' in sel);
  assert.strictEqual(sel.$and.length, 2);
  assert.deepStrictEqual(sel.$and[0], filter);
  assert.ok('$or' in sel.$and[1], 'interval base $or preserved');
});

// --- behavioural: filter scopes which cards the Calendar shows --------------
test('#5656: due-date filter query only matches cards assigned to the filtered user', () => {
  const sel = cardsDueInBetweenSelector(BOARD, START, END, assigneeFilterSelector(USER));
  const mine = { _id: 'c1', boardId: BOARD, dueAt: 150, assignees: [USER] };
  const theirs = { _id: 'c2', boardId: BOARD, dueAt: 150, assignees: ['user-b'] };
  const outOfRange = { _id: 'c3', boardId: BOARD, dueAt: 999, assignees: [USER] };
  assert.ok(docMatches(sel, mine), 'assigned + in range: shown');
  assert.ok(!docMatches(sel, theirs), 'assigned to someone else: hidden by filter');
  assert.ok(!docMatches(sel, outOfRange), 'out of the calendar interval: not shown');
});

test('#5656: interval filter query only matches cards assigned to the filtered user', () => {
  const sel = cardsInIntervalSelector(BOARD, START, END, assigneeFilterSelector(USER));
  const mine = { _id: 'c4', boardId: BOARD, startAt: 120, endAt: 160, assignees: [USER] };
  const theirs = { _id: 'c5', boardId: BOARD, startAt: 120, endAt: 160, assignees: ['user-b'] };
  assert.ok(docMatches(sel, mine), 'assigned + overlapping interval: shown');
  assert.ok(!docMatches(sel, theirs), 'assigned to someone else: hidden by filter');
});

test('#5656: without a filter, both users\' cards are shown (pre-fix behaviour preserved when inactive)', () => {
  const sel = cardsDueInBetweenSelector(BOARD, START, END);
  const mine = { _id: 'c6', boardId: BOARD, dueAt: 150, assignees: [USER] };
  const theirs = { _id: 'c7', boardId: BOARD, dueAt: 150, assignees: ['user-b'] };
  assert.ok(docMatches(sel, mine));
  assert.ok(docMatches(sel, theirs), 'no active filter: every in-range card shown');
});

console.log(`\n${passed} tests passed`);
