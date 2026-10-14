'use strict';

// Guard: #6767 - giving every old board a key is linear, not quadratic.
// v12.41 re-read every key of the instance for every board it gave one, and
// counted up from 2 again for every board sharing a title: on 32,500 boards,
// hours of slow queries. Now the keys in use are read once and the rest is
// planned in memory (models/lib/boardKey.js planBoardKeys), and a single new
// board reads only the keys that could collide.
// Run: node tests/boardKeyBackfill.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const k = require('../models/lib/boardKey.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('32,500 boards, most of them alike, get unique keys in well under a second', () => {
  const titles = ['Board', 'Development Team', 'Marketing', '2026', 'Ålands Öppna', ''];
  const boards = Array.from({ length: 32500 }, (_, i) => ({ _id: `b${i}`, title: titles[i % titles.length] }));
  const taken = new Set(['BOAR', 'DT', 'DT2', 'MARK7']);
  const started = Date.now();
  const plan = k.planBoardKeys(boards, taken);
  const ms = Date.now() - started;
  assert.strictEqual(plan.length, boards.length);
  const keys = plan.map(p => p.key);
  assert.strictEqual(new Set(keys).size, keys.length, 'every planned key is unique');
  for (const existing of ['BOAR', 'DT', 'DT2', 'MARK7']) assert.ok(!keys.includes(existing), `negative: ${existing} was already taken`);
  assert.ok(keys.every(k.isValidKey), 'every key is a valid key');
  assert.ok(ms < 1500, `took ${ms} ms`);
});

test('the same keys as one by one: planning matches suggestKey on a small set', () => {
  const boards = [{ _id: 'a', title: 'Dev Team' }, { _id: 'b', title: 'Dev Team' }, { _id: 'c', title: 'Design Tasks' }];
  const taken = new Set(['DT']);
  const plan = k.planBoardKeys(boards, new Set(taken));
  const oneByOne = [];
  const t = new Set(taken);
  for (const b of boards) { const key = k.suggestKey(b.title, t); t.add(key); oneByOne.push(key); }
  assert.deepStrictEqual(plan.map(p => p.key), oneByOne);
  assert.deepStrictEqual(oneByOne, ['DT2', 'DT3', 'DT4']);
});

test('a single board\'s lookup by prefix sees every key it could collide with', () => {
  for (const title of ['Board', 'Development Team Alpha Beta Gamma Delta', 'Marketing', '', 'x', 'Ålands Öppna']) {
    const prefix = k.keyPrefix(title);
    const taken = new Set();
    for (let i = 0; i < 2000; i += 1) {
      const key = k.suggestKey(title, taken);
      assert.ok(key.startsWith(prefix), `${key} does not start with ${prefix}`);
      taken.add(key);
    }
  }
});

const server = read('server/boardKeys.js');

test('the server reads the keys in use once, and writes only where there is still no key', () => {
  const backfill = server.slice(server.indexOf('async function backfillKeys'), server.indexOf('Boards.after.insert'));
  assert.strictEqual((backfill.match(/takenKeys\(/g) || []).length, 1, 'one read of the keys in use');
  assert.match(backfill, /planBoardKeys\(missing, await takenKeys\(null, ''\)\)/);
  assert.match(backfill, /updateOne: \{ filter: \{ _id, \.\.\.missingSelector \}, update: \{ \$set: \{ key \} \} \}/);
  assert.match(backfill, /bulkWrite\(ops, \{ ordered: false \}\)/);
  assert.match(backfill, /return serial\(async \(\) => \{/, 'in the same queue as every key write');
  // negative: the per-board loop that made it quadratic is gone
  assert.doesNotMatch(server, /for \(const \{ _id \} of missing\) await assignKey\(_id\)/);
  assert.match(server, /await ensureIndex\(Boards, \{ key: 1 \}\);/);
  assert.match(server, /suggestKey\(board\.title, await takenKeys\(boardId, keyPrefix\(board\.title\)\)\)/);
  assert.match(server, /\$regex: `\^\$\{escapeRegExp\(prefix\)\}`/);
});

console.log(`# ${passed} passed`);
