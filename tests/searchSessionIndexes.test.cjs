'use strict';

// #6824: search sessions (sessiondata) are read, upserted and pruned by
// { userId, sessionId } and modifiedAt on every global search and card report,
// but the collection had only its _id index, and only the searching user's own
// sessions older than a day were ever removed. One instance held 4,751
// sessions, 10 GB, scanned three times per search.
// Run: node tests/searchSessionIndexes.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server/publications/cards.js'), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('the session lookups and the pruning have an index', () => {
  assert.match(src, /await ensureIndex\(SessionData, \{ userId: 1, sessionId: 1 \}\);/);
  assert.match(src, /await ensureIndex\(SessionData, \{ modifiedAt: 1 \}\);/);
});

test('every direct session lookup is by exactly { userId, sessionId }', () => {
  const lookups = [...src.matchAll(/SessionData\.(?:upsertAsync|upsert|findOneAsync|findOne|find)\((\{[^}]*\})/g)];
  assert.ok(lookups.length >= 3, `expected the find, upsert and findOne lookups, saw ${lookups.length}`);
  for (const m of lookups) {
    assert.strictEqual(m[1].replace(/\s/g, ''), '{userId,sessionId}', m[0]);
  }
});

test('the paging publications use the same two fields', () => {
  const helper = fs.readFileSync(path.join(__dirname, '..', 'models/lib/searchPaginationAuthorization.js'), 'utf8');
  assert.match(helper, /return \{ userId, sessionId \};/);
});

test('stale sessions of every user are pruned, not only the searching user\'s', () => {
  const at = src.indexOf('const removeSelector = {');
  assert.ok(at > 0, 'removeSelector not found');
  const selector = src.slice(at, src.indexOf('};', at));
  assert.match(selector, /modifiedAt: \{/);
  assert.doesNotMatch(selector, /\buserId\b/);
  // negative: still only sessions older than a day, never a current one
  assert.match(selector, /subtract\(now\(\), 1, 'day'\)/);
});

console.log(`\n${passed} tests passed`);
