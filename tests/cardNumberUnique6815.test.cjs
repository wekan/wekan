'use strict';

// #6815: a card added in the browser brings the number the browser computed
// from the cards it has in view; with lazy loading that reissued numbers other
// cards on the board already had (842 duplicate numbers on 452 boards in one
// production database), and the server's counter never saw them. The server
// checks every new card's number now (server/models/cards.js
// Cards.before.insert). From the reporter's patch; a board without a counter
// is seeded from its highest number as getNextCardNumber does.
// Run: node tests/cardNumberUnique6815.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { counterName, isCardNumber, needsNewCardNumber, counterFloor, numberToCheckOnUpdate } = require('../models/lib/cardNumberAssign.js');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const pending = [];
const test = (name, fn) => pending.push([name, fn]);

test('a number another card on the board has is replaced', () => {
  assert.strictEqual(needsNewCardNumber(57, { _id: 'other' }), true);
});

test('negative: a free number, and "no number" (0 / missing), are kept', () => {
  assert.strictEqual(needsNewCardNumber(57, null), false);
  for (const none of [0, undefined, null, -3, 1.5, NaN]) {
    assert.strictEqual(isCardNumber(none), false, String(none));
    assert.strictEqual(needsNewCardNumber(none, { _id: 'other' }), false, String(none));
  }
});

test('the counter is the one Boards.getNextCardNumber uses, and its floor', () => {
  assert.strictEqual(counterName('b1'), 'cardNumber-b1');
  assert.match(read('models/boards.js'), /const counterName = `cardNumber-\$\{this\._id\}`;/);
  assert.strictEqual(counterFloor(57, 120), 120, 'a new counter starts at the board\'s highest');
  assert.strictEqual(counterFloor(57, null), 57);
  assert.strictEqual(counterFloor(130, 120), 130);
});

// The hook itself, run against an in-memory board.
function runHook(cards, counter) {
  const src = read('server/models/cards.js');
  const body = src.slice(src.indexOf('Cards.before.insert(async (userId, doc) => {\n  const { counterName, isCardNumber'), src.indexOf('Cards.after.insert('));
  const fn = body.slice(body.indexOf('async (userId, doc) =>'), body.lastIndexOf('});')) + '}';
  const store = { counter };
  const Counters = { rawCollection: () => ({
    findOne: async () => (store.counter === undefined ? null : { _id: 'c' }),
    updateOne: async (q, u) => { store.counter = Math.max(store.counter ?? -Infinity, u.$max.next_val); },
  }) };
  const Cards = { findOneAsync: async (sel, opts) => {
    const on = cards.filter(c => c.boardId === sel.boardId);
    if ('cardNumber' in sel) return on.find(c => c.cardNumber === sel.cardNumber) || null;
    if (opts && opts.sort) return on.sort((a, b) => b.cardNumber - a.cardNumber)[0] || null;
    return null;
  } };
  const Boards = { findOneAsync: async () => ({ getNextCardNumber: async () => { store.counter += 1; return store.counter; } }) };
  const requireStub = name => (name === '/models/counters' ? { Counters } : require(path.join(__dirname, '..', name.replace(/^\//, ''))));
  const hook = new Function('Cards', 'Boards', 'require', `return (${fn});`)(Cards, Boards, requireStub);
  return { hook, store };
}

test('the reporter\'s duplicate: a taken number from the browser gets the next free one', async () => {
  const cards = [1, 2, 3, 100].map(n => ({ boardId: 'b', cardNumber: n }));
  const { hook, store } = runHook(cards, 3); // a counter behind the board's 100
  const doc = { boardId: 'b', cardNumber: 3 };
  await hook('u', doc);
  assert.strictEqual(doc.cardNumber, 101);
  assert.strictEqual(store.counter, 101);
});

test('a free number keeps; a new counter starts at the board\'s highest, not at the browser\'s number', async () => {
  const cards = [1, 2, 100].map(n => ({ boardId: 'b', cardNumber: n }));
  const { hook, store } = runHook(cards, undefined); // no counter yet
  const doc = { boardId: 'b', cardNumber: 3 }; // the browser saw only 1 and 2
  await hook('u', doc);
  assert.strictEqual(doc.cardNumber, 3, 'free: kept');
  assert.strictEqual(store.counter, 100, 'negative: not 3, or the counter would later reissue 4..100');
});

test('negative: "no number" is left alone, and an existing counter is only raised', async () => {
  const cards = [{ boardId: 'b', cardNumber: 5 }];
  const a = runHook(cards, 50);
  const none = { boardId: 'b', cardNumber: 0 };
  await a.hook('u', none);
  assert.strictEqual(none.cardNumber, 0);
  assert.strictEqual(a.store.counter, 50);
  const free = { boardId: 'b', cardNumber: 7 };
  await a.hook('u', free);
  assert.strictEqual(free.cardNumber, 7);
  assert.strictEqual(a.store.counter, 50, 'never lowered');
});

// ---- updates: a move to another board, a restore, a number set ------------

test('which updates bring a card into a board\'s numbering', () => {
  const doc = { _id: 'c', boardId: 'a', cardNumber: 12, archived: false };
  assert.deepStrictEqual(numberToCheckOnUpdate(doc, { boardId: 'b', cardNumber: 1 }), { boardId: 'b', cardNumber: 1 }, 'move: the browser\'s number on the destination');
  assert.deepStrictEqual(numberToCheckOnUpdate({ ...doc, archived: true }, { archived: false }), { boardId: 'a', cardNumber: 12 }, 'restore');
  assert.deepStrictEqual(numberToCheckOnUpdate(doc, { cardNumber: 40 }), { boardId: 'a', cardNumber: 40 }, 'number set');
  assert.strictEqual(numberToCheckOnUpdate(doc, { title: 'x' }), null, 'negative: an ordinary edit');
  assert.strictEqual(numberToCheckOnUpdate(doc, { boardId: 'a', listId: 'l2' }), null, 'negative: a move within the board');
  assert.strictEqual(numberToCheckOnUpdate(doc, { archived: true }), null, 'negative: archiving');
  assert.strictEqual(numberToCheckOnUpdate({ ...doc, cardNumber: 0 }, { archived: false, boardId: 'b' }), null, 'negative: no number');
  assert.strictEqual(numberToCheckOnUpdate(doc, undefined), null);
});

function runUpdateHook(cards, counter) {
  const src = read('server/models/cards.js');
  const start = src.indexOf('Cards.before.update(async (userId, doc, fieldNames, modifier) => {\n  const { counterName, isCardNumber, counterFloor, numberToCheckOnUpdate }');
  assert.ok(start > 0, 'the update hook exists');
  const body = src.slice(start, src.indexOf('Cards.after.insert(', start));
  const fn = body.slice(body.indexOf('async (userId, doc, fieldNames, modifier) =>'), body.lastIndexOf('});')) + '}';
  const store = { counter };
  const Counters = { rawCollection: () => ({
    findOne: async () => (store.counter === undefined ? null : { _id: 'c' }),
    updateOne: async (q, u) => { store.counter = Math.max(store.counter ?? -Infinity, u.$max.next_val); },
  }) };
  const others = sel => cards.filter(c => c.boardId === sel.boardId && (!sel._id || c._id !== sel._id.$ne));
  const Cards = { findOneAsync: async (sel, opts) => {
    const on = others(sel);
    if ('cardNumber' in sel) return on.find(c => c.cardNumber === sel.cardNumber) || null;
    if (opts && opts.sort) return on.sort((a, b) => b.cardNumber - a.cardNumber)[0] || null;
    return null;
  } };
  const Boards = { findOneAsync: async () => ({ getNextCardNumber: async () => { store.counter += 1; return store.counter; } }) };
  const requireStub = name => (name === '/models/counters' ? { Counters } : require(path.join(__dirname, '..', name.replace(/^\//, ''))));
  const hook = new Function('Cards', 'Boards', 'require', `return (${fn});`)(Cards, Boards, requireStub);
  return { hook, store };
}

test('a card moved from the browser to another board gets a free number there, not the browser\'s', async () => {
  // the destination board: cards 1..3 and 200; the browser had none of them loaded
  const cards = [1, 2, 3, 200].map(n => ({ _id: `d${n}`, boardId: 'dest', cardNumber: n }));
  const { hook, store } = runUpdateHook(cards, 3);
  const modifier = { $set: { boardId: 'dest', listId: 'l', cardNumber: 1 } };
  await hook('u', { _id: 'moved', boardId: 'src', cardNumber: 57 }, ['boardId'], modifier);
  assert.strictEqual(modifier.$set.cardNumber, 201);
  assert.strictEqual(store.counter, 201);
});

test('a restored card that shares its number with an open card gets a new one', async () => {
  const cards = [{ _id: 'open', boardId: 'b', cardNumber: 9 }, { _id: 'top', boardId: 'b', cardNumber: 50 }];
  const { hook } = runUpdateHook(cards, 50);
  const modifier = { $set: { archived: false } };
  await hook('u', { _id: 'old', boardId: 'b', cardNumber: 9, archived: true }, ['archived'], modifier);
  assert.strictEqual(modifier.$set.cardNumber, 51);
});

test('negative: a free number is kept on a move and a restore, and the card itself does not count as taken', async () => {
  const cards = [{ _id: 'self', boardId: 'b', cardNumber: 9 }, { _id: 'x', boardId: 'dest', cardNumber: 4 }];
  const a = runUpdateHook(cards, 4);
  const restore = { $set: { archived: false } };
  await a.hook('u', { _id: 'self', boardId: 'b', cardNumber: 9, archived: true }, ['archived'], restore);
  assert.strictEqual(restore.$set.cardNumber, undefined, 'its own number is not a duplicate');
  const d = runUpdateHook(cards, 4);   // the destination board's counter
  const move = { $set: { boardId: 'dest', cardNumber: 5 } };
  await d.hook('u', { _id: 'self', boardId: 'b', cardNumber: 9 }, ['boardId'], move);
  assert.strictEqual(move.$set.cardNumber, 5, 'free on the destination: kept');
  assert.strictEqual(d.store.counter, 5, 'and the counter raised past it');
  const edit = { $set: { title: 'y' } };
  await d.hook('u', { _id: 'self', boardId: 'b', cardNumber: 9 }, ['title'], edit);
  assert.strictEqual(d.store.counter, 5, 'an ordinary edit does nothing');
});

(async () => {
  let passed = 0;
  console.log('cardNumberUnique6815:');
  for (const [name, fn] of pending) { await fn(); passed += 1; console.log('  ok -', name); }
  console.log(`cardNumberUnique6815: ${passed} passed`);
})().catch(e => { console.error(e); process.exit(1); });
