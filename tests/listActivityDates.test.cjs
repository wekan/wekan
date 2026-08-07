'use strict';

// #5251: "get last change date of a list using API".
//
// The asker is writing an offline Android client and wants to know whether
// anything in a list changed - a card added, edited or archived - without
// fetching every card and comparing it. A list's own `modifiedAt` does not
// answer that: it moves when the LIST document changes (title, sort, archived),
// and editing a card in it does not touch the list.
//
// So GET /api/boards/:boardId/lists reports two dates per list now:
//
//   modifiedAt      - the list document itself
//   cardsModifiedAt - the newest change among the cards in it
//
// The second is a pure reduction over the board's cards, so the handler needs one
// query for the whole board rather than one per list, and so it can be tested
// here without Meteor.
//
// Run: node tests/listActivityDates.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { newestCardChangeByList } = require('../models/lib/listActivityDates');

const ROOT = path.join(__dirname, '..');
const handler = fs.readFileSync(path.join(ROOT, 'server/models/lists.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const A = new Date('2026-01-01T00:00:00Z');
const B = new Date('2026-06-01T00:00:00Z');
const at = (map, listId) => (map.get(listId) ? map.get(listId).getTime() : null);

console.log('listActivityDates:');

test('the newest change in a list wins', () => {
  const m = newestCardChangeByList([
    { listId: 'L', modifiedAt: A },
    { listId: 'L', modifiedAt: B },
    { listId: 'L', modifiedAt: A },
  ]);
  assert.strictEqual(at(m, 'L'), B.getTime());
});

test('each list answers for itself', () => {
  const m = newestCardChangeByList([
    { listId: 'L1', modifiedAt: A },
    { listId: 'L2', modifiedAt: B },
  ]);
  assert.strictEqual(at(m, 'L1'), A.getTime());
  assert.strictEqual(at(m, 'L2'), B.getTime());
});

test('a list whose cards carry no date is absent, not zero', () => {
  // The difference matters to the client: absent means "no answer", and the
  // handler reports null. A zero or a "now" would be a wrong answer, and a
  // client polling for changes would either never sync or sync forever.
  const m = newestCardChangeByList([{ listId: 'L' }, { listId: 'L', modifiedAt: null }]);
  assert.strictEqual(m.has('L'), false);
});

test('a card with no usable date cannot drag the answer backwards', () => {
  const m = newestCardChangeByList([
    { listId: 'L', modifiedAt: B },
    { listId: 'L', modifiedAt: 'not a date' },
    { listId: 'L', modifiedAt: undefined },
  ]);
  assert.strictEqual(at(m, 'L'), B.getTime());
});

test('the legacy dateLastActivity still answers, and the newer field wins', () => {
  // Boards written by older WeKan have dateLastActivity and no modifiedAt.
  const legacy = newestCardChangeByList([{ listId: 'L', dateLastActivity: B }]);
  assert.strictEqual(at(legacy, 'L'), B.getTime());
  const both = newestCardChangeByList([{ listId: 'L', modifiedAt: A, dateLastActivity: B }]);
  assert.strictEqual(at(both, 'L'), B.getTime(), 'whichever is newer');
});

test('dates as strings and as numbers are understood', () => {
  const m = newestCardChangeByList([
    { listId: 'S', modifiedAt: '2026-06-01T00:00:00Z' },
    { listId: 'N', modifiedAt: B.getTime() },
  ]);
  assert.strictEqual(at(m, 'S'), B.getTime());
  assert.strictEqual(at(m, 'N'), B.getTime());
});

test('junk in the card list is skipped, not thrown on (negative)', () => {
  // The handler passes whatever the database holds. An Invalid Date, a card with
  // no listId, a null row - none of them may take the endpoint down.
  const m = newestCardChangeByList([
    null,
    undefined,
    'nonsense',
    42,
    {},
    { listId: '' },
    { modifiedAt: A },
    { listId: 'L', modifiedAt: new Date('nonsense') },
    { listId: 'L', modifiedAt: B },
  ]);
  assert.strictEqual(at(m, 'L'), B.getTime());
  assert.strictEqual(newestCardChangeByList(null).size, 0, 'not even a list');
  assert.strictEqual(newestCardChangeByList(undefined).size, 0);
  assert.strictEqual(newestCardChangeByList([]).size, 0);
});

test('the lists endpoint reports both dates, from one query', () => {
  const at2 = handler.indexOf("WebApp.handlers.get('/api/boards/:boardId/lists'");
  assert.notStrictEqual(at2, -1, 'the endpoint must be there');
  const fn = handler.slice(at2, handler.indexOf('WebApp.handlers', at2 + 10));

  assert.ok(/modifiedAt: doc\.modifiedAt \|\| null/.test(fn),
    'the list document\'s own date');
  assert.ok(/cardsModifiedAt: newestByList\.get\(doc\._id\) \|\| null/.test(fn),
    'and the newest change among its cards, null when there is none');
  assert.ok(/newestCardChangeByList/.test(fn), 'computed by the shared helper');

  // One query for the board, not one per list: the asker's board is the case
  // where a query per list is what made this expensive in the first place.
  const cardQueries = (fn.match(/ReactiveCache\.getCards\(/g) || []).length;
  assert.strictEqual(cardQueries, 1, 'exactly one cards query for the whole board');
  assert.ok(/fields: \{ listId: 1, modifiedAt: 1, dateLastActivity: 1 \}/.test(fn),
    'fetching only the three fields it reduces over');
  // Archived cards count: archiving is one of the changes being asked about.
  assert.ok(/getCards\(\s*\{ boardId: paramBoardId \}/.test(fn),
    'no archived: false on the cards query - archiving a card IS a change');
});

console.log(`\n${passed} tests passed`);
