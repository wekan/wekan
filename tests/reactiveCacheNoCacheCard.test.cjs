'use strict';

// Plain-Node unit test (no Meteor) for ReactiveCache.getCard's client-side
// `noCache` path — the #2494 fix ("Send to another board makes cards appear
// and disappear when reordering").
// Run: node tests/reactiveCacheNoCacheCard.test.cjs
//
// Root cause: on the client, `ReactiveCache.getCard(selector, options, true)`
// (noCache) was routed to the ASYNC ReactiveCacheServer.getCard, so it
// returned a Promise. The multi-select "Move/Copy selection" dialogs' max-sort
// lookup (client/components/sidebar/sidebarFilters.js getMaxSortForList) is
// synchronous: it read `.sort` off that Promise, got `undefined`, and
// buildInsertionSortIndexes computed `undefined + 1 = NaN` — every card moved
// to the target list was written with `sort: NaN`, landing at unpredictable
// positions, hiding behind other cards and refusing to be reordered (exactly
// the #2494 symptom). The fix makes the client noCache path a SYNCHRONOUS
// uncached minimongo findOne, while callers that `await` it
// (models/cards.js getSort, models/boards.js getNextCardNumber) keep working
// because awaiting a plain document is a no-op.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(
  path.join(repoRoot, 'imports', 'reactiveCache.js'),
  'utf8',
);

// --- load imports/reactiveCache.js in plain Node with stubbed Meteor deps ---

function loadReactiveCache({ isServer, cardsStub, dataCacheLog }) {
  let src = source
    // strip the 4 meteor/app import lines; their bindings are injected below
    .replace(/^import .*$/gm, '')
    .replace(
      'export { ReactiveCache, ReactiveMiniMongoIndex };',
      'module.exports = { ReactiveCache, ReactiveMiniMongoIndex };',
    );
  assert.ok(src.includes('module.exports'), 'export line was rewritten');

  const Meteor = { isServer, isClient: !isServer };
  const EJSON = { stringify: v => JSON.stringify(v), parse: v => JSON.parse(v) };
  // Minimal DataCache: remembers the compute fn, records cache hits.
  class DataCache {
    constructor(fn) {
      this.fn = fn;
    }
    get(key) {
      if (dataCacheLog) dataCacheLog.push(key);
      return this.fn(key);
    }
    clear() {}
  }
  const groupBy = () => ({});
  const indexBy = () => ({});
  // lazyCollectionProxy(() => require('/models/cards').default) — only the
  // collections a test actually touches need to resolve.
  const requireStub = id => {
    if (id === '/models/cards') return { default: cardsStub };
    return { default: {} };
  };

  const module_ = { exports: {} };
  const fn = new Function(
    'module',
    'exports',
    'require',
    'Meteor',
    'EJSON',
    'DataCache',
    'groupBy',
    'indexBy',
    src,
  );
  fn(module_, module_.exports, requireStub, Meteor, EJSON, DataCache, groupBy, indexBy);
  return module_.exports;
}

// A stub Cards collection over an in-memory doc set, honouring the
// { sort: { sort: 1|-1 } } option the max/min-sort lookups use.
function makeCardsStub(docs) {
  const calls = { findOne: 0, findOneAsync: 0 };
  const pick = (selector, options) => {
    // minimongo accepts an _id string or a selector object
    const match =
      typeof selector === 'string'
        ? d => d._id === selector
        : d => Object.keys(selector).every(k => d[k] === selector[k]);
    let list = docs.filter(match);
    if (options && options.sort && options.sort.sort) {
      const dir = options.sort.sort;
      list = list.slice().sort((a, b) => (a.sort - b.sort) * dir);
    }
    return list[0];
  };
  return {
    calls,
    findOne(selector, options) {
      calls.findOne += 1;
      return pick(selector, options);
    },
    async findOneAsync(selector, options) {
      calls.findOneAsync += 1;
      return pick(selector, options);
    },
    find() {
      return { fetch: () => docs, fetchAsync: async () => docs };
    },
  };
}

const TARGET_LIST_CARDS = [
  { _id: 'a', listId: 'L3', swimlaneId: 'S1', archived: false, sort: 1 },
  { _id: 'b', listId: 'L3', swimlaneId: 'S1', archived: false, sort: 7 },
  { _id: 'c', listId: 'L3', swimlaneId: 'S1', archived: false, sort: 4 },
];

// The exact caller pattern of client/components/sidebar/sidebarFilters.js
// getMaxSortForList + buildInsertionSortIndexes (bottom-of-list branch).
function maxSortThenIndexes(ReactiveCache, cardsCount) {
  const card = ReactiveCache.getCard(
    { listId: 'L3', swimlaneId: 'S1', archived: false },
    { sort: { sort: -1 } },
    true,
  );
  const maxSort = card ? card.sort : null;
  const start = maxSort === null ? 0 : maxSort + 1;
  const indexes = [];
  for (let i = 0; i < cardsCount; i += 1) indexes.push(start + i);
  return indexes;
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

(async () => {
  // --- POSITIVE: client noCache read is synchronous and correct -------------

  test('POSITIVE: client noCache getCard returns the document synchronously (not a Promise)', () => {
    const cards = makeCardsStub(TARGET_LIST_CARDS);
    const { ReactiveCache } = loadReactiveCache({ isServer: false, cardsStub: cards });
    const card = ReactiveCache.getCard(
      { listId: 'L3', swimlaneId: 'S1', archived: false },
      { sort: { sort: -1 } },
      true,
    );
    assert.ok(!(card instanceof Promise), 'must not be a Promise on the client');
    assert.strictEqual(card._id, 'b', 'sort:-1 returns the max-sort card');
    assert.strictEqual(card.sort, 7);
    assert.strictEqual(cards.calls.findOne, 1, 'sync minimongo findOne used');
    assert.strictEqual(cards.calls.findOneAsync, 0);
  });

  test('POSITIVE: #2494 move-selection insertion indexes are finite and strictly increasing', () => {
    const cards = makeCardsStub(TARGET_LIST_CARDS);
    const { ReactiveCache } = loadReactiveCache({ isServer: false, cardsStub: cards });
    const indexes = maxSortThenIndexes(ReactiveCache, 3);
    assert.deepStrictEqual(indexes, [8, 9, 10], 'cards go after the current max sort');
    indexes.forEach(i => assert.ok(Number.isFinite(i), `sort index ${i} must be finite`));
    // Distinct sorts — no two moved cards may occupy the same position.
    assert.strictEqual(new Set(indexes).size, indexes.length);
  });

  test('POSITIVE: awaited callers (models getSort/getNextCardNumber pattern) still work', async () => {
    const cards = makeCardsStub(TARGET_LIST_CARDS);
    const { ReactiveCache } = loadReactiveCache({ isServer: false, cardsStub: cards });
    // models/cards.js getSort awaits the noCache call; awaiting a plain doc is fine.
    const card = await ReactiveCache.getCard(
      { listId: 'L3', swimlaneId: 'S1', archived: false },
      { sort: { sort: 1 } },
      true,
    );
    assert.strictEqual(card._id, 'a', 'sort:1 returns the min-sort card');
    assert.strictEqual(card.sort, 1);
  });

  test('POSITIVE: empty target list yields sort 0,1,2,... (not NaN)', () => {
    const cards = makeCardsStub([]);
    const { ReactiveCache } = loadReactiveCache({ isServer: false, cardsStub: cards });
    const indexes = maxSortThenIndexes(ReactiveCache, 2);
    assert.deepStrictEqual(indexes, [0, 1]);
  });

  // --- NEGATIVE: guards and unchanged paths ----------------------------------

  test('NEGATIVE: null / undefined / empty selector returns null (no findOne call)', () => {
    const cards = makeCardsStub(TARGET_LIST_CARDS);
    const { ReactiveCache } = loadReactiveCache({ isServer: false, cardsStub: cards });
    assert.strictEqual(ReactiveCache.getCard(null, {}, true), null);
    assert.strictEqual(ReactiveCache.getCard(undefined, {}, true), null);
    assert.strictEqual(ReactiveCache.getCard('', {}, true), null);
    assert.strictEqual(cards.calls.findOne, 0);
  });

  test('NEGATIVE: the old routing is the bug — an async read makes the caller compute NaN', async () => {
    // Demonstrates why the client noCache path must be synchronous: feed the
    // caller pattern a Promise (what the pre-fix routing returned) and the
    // insertion indexes degrade to NaN — the #2494 data corruption.
    const promiseCard = Promise.resolve(TARGET_LIST_CARDS[1]);
    const maxSort = promiseCard ? promiseCard.sort : null; // undefined, not 7
    const start = maxSort === null ? 0 : maxSort + 1;
    assert.ok(Number.isNaN(start), 'Promise-based read yields NaN sort indexes');
    await promiseCard;
  });

  test('NEGATIVE: default (cached) client path is untouched and goes through DataCache', () => {
    const cards = makeCardsStub(TARGET_LIST_CARDS);
    const dataCacheLog = [];
    const { ReactiveCache } = loadReactiveCache({
      isServer: false,
      cardsStub: cards,
      dataCacheLog,
    });
    const card = ReactiveCache.getCard('a');
    assert.strictEqual(card._id, 'a');
    assert.strictEqual(dataCacheLog.length, 1, 'cached path consulted the DataCache');
  });

  test('NEGATIVE: server path is unchanged (async, findOneAsync)', async () => {
    const cards = makeCardsStub(TARGET_LIST_CARDS);
    const { ReactiveCache } = loadReactiveCache({ isServer: true, cardsStub: cards });
    const ret = ReactiveCache.getCard(
      { listId: 'L3', swimlaneId: 'S1', archived: false },
      { sort: { sort: -1 } },
      true,
    );
    assert.ok(ret instanceof Promise, 'server keeps the async contract');
    const card = await ret;
    assert.strictEqual(card._id, 'b');
    assert.strictEqual(cards.calls.findOneAsync, 1);
  });

  console.log(`\n${passed} passing`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
