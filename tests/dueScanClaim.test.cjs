'use strict';

// The daily due-date reminder scan runs once per installation, not once per
// WeKan server (models/lib/dueScanClaim.js, models/cards.js addCronJob).
// Run: node tests/dueScanClaim.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { claimDueScanDay, dayKey, COLLECTION } = require('../models/lib/dueScanClaim');

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

function fakeDb() {
  const ids = new Map();
  return {
    collection(name) {
      if (!ids.has(name)) ids.set(name, new Set());
      const set = ids.get(name);
      return {
        async insertOne(doc) {
          if (set.has(doc._id)) throw Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });
          set.add(doc._id);
          return { insertedId: doc._id };
        },
      };
    },
    _ids: ids,
  };
}

(async () => {
  await test('24 servers at 8:00: exactly one scans', async () => {
    const db = fakeDb();
    const now = new Date(2026, 9, 29, 8, 0, 3);
    const results = await Promise.all(Array.from({ length: 24 }, () => claimDueScanDay(db, now)));
    assert.strictEqual(results.filter(Boolean).length, 1);
    assert.deepStrictEqual([...db._ids.get(COLLECTION)], ['2026-10-29']);
  });

  await test('the next day is claimed again', async () => {
    const db = fakeDb();
    assert.strictEqual(await claimDueScanDay(db, new Date(2026, 9, 29, 8)), true);
    assert.strictEqual(await claimDueScanDay(db, new Date(2026, 9, 30, 8)), true);
  });

  await test('dayKey is the local date, zero-padded', async () => {
    assert.strictEqual(dayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  });

  await test('negative: any other database error is not swallowed', async () => {
    const db = { collection: () => ({ insertOne: async () => { throw Object.assign(new Error('down'), { code: 6 }); } }) };
    await assert.rejects(() => claimDueScanDay(db), /down/);
  });

  await test('the scheduler claims the day before it scans', async () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'models', 'cards.js'), 'utf8');
    const job = src.slice(src.indexOf('const addCronJob'), src.indexOf('export {', src.indexOf('const addCronJob')));
    const claim = job.indexOf('claimDueScanDay(');
    const scan = job.indexOf('findDueCards(notifydays)');
    assert.ok(claim > 0 && scan > claim, 'claim, then scan');
    assert.ok(job.includes('if (!(await claimDueScanDay(Cards.rawDatabase()))) return;'), 'a server that did not claim the day returns');
  });

  console.log(`dueScanClaim.test.cjs: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
