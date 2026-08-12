'use strict';

// Choosing WHICH of two copies of a WeKan database the snap serves, and bringing
// the other one's work across instead of stranding it.
// Run: node tests/snapDatabaseAutopick.test.cjs
//
// wekan/wekan#6583 and #6585 are the same accident from opposite ends: a snap
// serving a copy of its own data instead of the data. The guard those produced
// (snap-src/bin/ferretdb-migration-stale) answers from file timestamps, and an
// mtime cannot tell "somebody used this database" from "this database was
// started" - so when both copies look used it says AMBIGUOUS, and the admin was
// left to run `snap set wekan database=...` twice and look at the boards each
// time. That message lives in `snap logs`; most people never see it, and their
// site is meanwhile showing the wrong copy.
//
// Both copies can be READ, so the question is answered from what is in them:
// per-collection counts, and the newest moment any document carries. WeKan's
// history is what makes that reliable (every change a user makes writes a row) and
// what makes the merge safe (rows are append-only, so they can only be ADDED) -
// see docs/Features/Reports/History/History.md section 9a.
//
// The rules being pinned here:
//   * a copy that holds everything the other holds is served, with nothing to merge
//   * where both hold work the other does not, the NEWER one is served and the
//     other's missing documents are inserted into it
//   * insert-only: nothing in the served copy is overwritten, nothing is deleted,
//     and the other copy stays on disk
//   * when the two cannot be told apart, NOTHING is changed - that case is a
//     decision about somebody's work

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const {
  chooseDatabase,
  MERGE_COLLECTIONS,
  coversEverywhere,
  totalDocuments,
} = require('../snap-src/bin/database-choose.mjs');
const { mergeMissing } = require('../snap-src/bin/database-merge-missing.mjs');

let passed = 0;
const queued = [];
function test(name, fn) { queued.push([name, fn]); }

console.log('snapDatabaseAutopick:');

const DAY = 86400000;
const NOW = Date.UTC(2026, 7, 12, 12, 0, 0);
const ev = (counts, newest) => ({ counts, newest, newestFrom: 'cards.dateLastActivity' });

// ── the decision ────────────────────────────────────────────────────────────
test('the copy that holds everything the other does is served, with nothing to merge', () => {
  // The ordinary shape after a migration that was resumed late: MongoDB kept
  // being used, so it has every card the copy has and more.
  const decision = chooseDatabase(
    ev({ cards: 1400, boards: 12, activities: 9000 }, NOW),
    ev({ cards: 1000, boards: 12, activities: 6000 }, NOW - 21 * DAY));
  assert.strictEqual(decision.choice, 'mongodb');
  assert.strictEqual(decision.merge, null, 'there is nothing on the other side that is not here');
  assert.strictEqual(decision.reason, 'superset');
});

test('and it works the other way round, which is the #6583 shape', () => {
  // FerretDB had been the live database for two weeks; the mtime guard called it
  // stale because starting mongod had touched MongoDB's files.
  const decision = chooseDatabase(
    ev({ cards: 1000, activities: 6000 }, NOW - 14 * DAY),
    ev({ cards: 1400, activities: 9000 }, NOW));
  assert.strictEqual(decision.choice, 'ferretdb');
  assert.strictEqual(decision.merge, null);
});

test('both hold work the other does not: serve the newer, merge the other', () => {
  // Somebody used MongoDB for a week, then switched to FerretDB and used that for
  // a month. Each has cards the other never saw.
  const decision = chooseDatabase(
    ev({ cards: 1200, activities: 8000, boards: 12 }, NOW - 30 * DAY),
    ev({ cards: 900, activities: 9500, boards: 13 }, NOW));
  assert.strictEqual(decision.choice, 'ferretdb', 'the newer data is what people are working on');
  assert.strictEqual(decision.merge, 'mongodb', 'and the other side has documents that must not be stranded');
  assert.match(decision.detail, /overwritten/, 'the message has to say what the merge does NOT do');
});

test('one database empty or unreadable: the other one, without ceremony', () => {
  assert.strictEqual(chooseDatabase(ev({ cards: 10 }, NOW), null).choice, 'mongodb');
  assert.strictEqual(chooseDatabase(null, ev({ cards: 10 }, NOW)).choice, 'ferretdb');
  assert.strictEqual(chooseDatabase(ev({ cards: 10 }, NOW), ev({}, null)).choice, 'mongodb');
  assert.strictEqual(chooseDatabase(ev({ cards: 0 }, null), ev({ cards: 5 }, NOW)).choice, 'ferretdb');
});

test('nothing to compare changes nothing (negative)', () => {
  const decision = chooseDatabase(null, null);
  assert.strictEqual(decision.choice, null);
  assert.strictEqual(decision.reason, 'no-data');
  for (const junk of [undefined, 'string', 42, [], { nope: 1 }]) {
    assert.doesNotThrow(() => chooseDatabase(junk, junk));
    assert.strictEqual(chooseDatabase(junk, junk).choice, null);
  }
});

test('too close to call changes nothing - the #6583 lesson (negative)', () => {
  // Two databases last written within a few minutes of each other are the same
  // database as far as this can tell; switching on that is the bug, not the fix.
  const decision = chooseDatabase(
    ev({ cards: 1000, lists: 30 }, NOW),
    ev({ cards: 1001, lists: 29 }, NOW - 60000));
  assert.strictEqual(decision.choice, null);
  assert.strictEqual(decision.reason, 'too-close');
});

test('no timestamps anywhere changes nothing (negative)', () => {
  const decision = chooseDatabase(
    ev({ cards: 10, lists: 3 }, null),
    ev({ cards: 9, lists: 4 }, null));
  assert.strictEqual(decision.choice, null);
  assert.strictEqual(decision.reason, 'no-timestamps');
});

test('a superset that is OLDER is not served on its size alone (negative)', () => {
  // More documents is not the same as more recent: a copy can be bigger because
  // the newer one had cards deleted. Size decides only when age agrees.
  const decision = chooseDatabase(
    ev({ cards: 2000, activities: 9000 }, NOW - 40 * DAY),
    ev({ cards: 1500, activities: 8000 }, NOW));
  assert.notStrictEqual(decision.reason, 'superset');
  assert.strictEqual(decision.choice, 'ferretdb', 'the newer one is served');
  assert.strictEqual(decision.merge, 'mongodb', 'and the bigger one is merged INTO it, not discarded');
});

test('the margin is what "clearly newer" means, and it is configurable', () => {
  const close = chooseDatabase(
    ev({ cards: 10, lists: 2 }, NOW),
    ev({ cards: 9, lists: 3 }, NOW - 3 * 3600000));
  assert.strictEqual(close.choice, null, 'three hours apart is not a fact');
  const wide = chooseDatabase(
    ev({ cards: 10, lists: 2 }, NOW),
    ev({ cards: 9, lists: 3 }, NOW - 3 * 3600000),
    { newerByMs: 60000 });
  assert.strictEqual(wide.choice, 'mongodb', 'with a one-minute margin the same evidence decides');
});

test('history is in the collections that get merged', () => {
  // The whole point: the work done on the copy that is not served has to end up
  // in the served copy's HISTORY. Activities first, comments with them.
  assert.ok(MERGE_COLLECTIONS.includes('activities'), 'the card Activity feed');
  assert.ok(MERGE_COLLECTIONS.includes('card_comments'), 'and comments, which are history too');
  assert.ok(MERGE_COLLECTIONS.indexOf('activities') < MERGE_COLLECTIONS.indexOf('cards'),
    'append-only history is merged before the documents it describes, so a card '
    + 'that arrives already has its story');
});

test('counting and covering are honest about missing collections', () => {
  assert.strictEqual(totalDocuments(ev({ a: 3, b: 4 }, NOW)), 7);
  assert.strictEqual(totalDocuments(null), 0);
  assert.strictEqual(coversEverywhere(ev({ a: 3 }, NOW), ev({ a: 3, b: 1 }, NOW)), false,
    'a collection the other has and this one does not is NOT covered');
  assert.strictEqual(coversEverywhere(ev({ a: 3, b: 1 }, NOW), ev({ a: 3 }, NOW)), true);
});

// ── the merge ───────────────────────────────────────────────────────────────
// A minimal in-memory stand-in for the two driver `Db` handles mergeMissing uses:
// find(), find({_id:{$in}}).toArray(), insertMany().
function fakeDb(data) {
  const store = new Map(Object.entries(data).map(([k, v]) => [k, v.map(d => ({ ...d }))]));
  return {
    _dump: name => store.get(name) || [],
    collection(name) {
      if (!store.has(name)) store.set(name, []);
      const docs = store.get(name);
      return {
        find(filter = {}) {
          const ids = filter && filter._id && filter._id.$in;
          const matched = ids
            ? docs.filter(d => ids.map(String).includes(String(d._id)))
            : docs.slice();
          return {
            async toArray() { return matched; },
            async close() {},
            [Symbol.asyncIterator]() {
              let i = 0;
              return { async next() { return i < matched.length ? { value: matched[i++], done: false } : { done: true }; } };
            },
          };
        },
        async insertMany(batch) {
          for (const doc of batch) {
            if (docs.some(d => String(d._id) === String(doc._id))) {
              const err = new Error('E11000 duplicate key error');
              err.result = { insertedCount: 0 };
              throw err;
            }
            docs.push({ ...doc });
          }
          return { insertedCount: batch.length };
        },
      };
    },
  };
}

test('the merge inserts what is missing and overwrites nothing', async () => {
  const source = fakeDb({
    activities: [{ _id: 'a1', text: 'from the other copy' }, { _id: 'a2', text: 'shared' }],
    cards: [{ _id: 'c1', title: 'OLD title' }, { _id: 'c9', title: 'only in the other copy' }],
  });
  const target = fakeDb({
    activities: [{ _id: 'a2', text: 'shared' }],
    cards: [{ _id: 'c1', title: 'NEW title' }],
  });
  const summary = await mergeMissing(source, target, { collections: ['activities', 'cards'] });
  assert.strictEqual(summary.inserted.activities, 1, 'the activity only the other copy had');
  assert.strictEqual(summary.inserted.cards, 1, 'and the card only it had');
  const cards = target._dump('cards');
  assert.strictEqual(cards.find(c => c._id === 'c1').title, 'NEW title',
    'a card edited on both sides keeps the version in the copy being SERVED - '
    + 'overwriting it with the older one is the data loss this exists to avoid');
  assert.ok(cards.find(c => c._id === 'c9'), 'and the one that only existed elsewhere is here now');
  assert.deepStrictEqual(summary.errors, []);
});

test('the merge deletes nothing, on either side (negative)', async () => {
  const source = fakeDb({ cards: [{ _id: 'c1', t: 1 }] });
  const target = fakeDb({ cards: [{ _id: 'c2', t: 2 }] });
  await mergeMissing(source, target, { collections: ['cards'] });
  assert.strictEqual(source._dump('cards').length, 1, 'the source is not emptied as it is read');
  assert.strictEqual(target._dump('cards').length, 2, 'and the target keeps what it had');
  assert.ok(target._dump('cards').find(c => c._id === 'c2'));
});

test('--dry-run counts without writing (negative)', async () => {
  const source = fakeDb({ cards: [{ _id: 'c1' }, { _id: 'c2' }] });
  const target = fakeDb({ cards: [] });
  const summary = await mergeMissing(source, target, { collections: ['cards'], dryRun: true });
  assert.strictEqual(summary.inserted.cards, 2, 'it says what it would do');
  assert.strictEqual(target._dump('cards').length, 0, 'and does none of it');
});

test('a limit stops the merge without failing it', async () => {
  const many = Array.from({ length: 500 }, (_, i) => ({ _id: `a${i}` }));
  const source = fakeDb({ activities: many });
  const target = fakeDb({ activities: [] });
  const summary = await mergeMissing(source, target, { collections: ['activities'], limit: 200 });
  assert.ok(summary.inserted.activities >= 200 && summary.inserted.activities <= 400,
    `stopped at ${summary.inserted.activities}, which must be near the limit rather than the whole set`);
  assert.deepStrictEqual(summary.errors, [], 'a limit is not an error');
});

test('a collection missing from one side is not an error (negative)', async () => {
  const source = fakeDb({ cards: [{ _id: 'c1' }] });
  const target = fakeDb({});
  const summary = await mergeMissing(source, target, { collections: ['cards', 'customFields'] });
  assert.strictEqual(summary.inserted.cards, 1);
  assert.strictEqual(summary.inserted.customFields, undefined);
  assert.deepStrictEqual(summary.errors, []);
});

// ── the wiring ──────────────────────────────────────────────────────────────
test('wekan-control asks autopick before it repeats the old advice', () => {
  const wekan = read('snap-src/bin/wekan-control');
  const at = wekan.indexOf('migration_stale_rc" -eq 2');
  // To the START of the next branch, not to the next '-eq 0' - that appears
  // inside this one now ("autopick_rc" -eq 0).
  const branch = wekan.slice(at, wekan.indexOf('if [ "ferretdb" = "$DATABASE" ]', at));
  assert.ok(/bin\/database-autopick/.test(branch),
    'the ambiguous case is where the admin used to be sent away to run commands');
  assert.ok(/database-role/.test(branch),
    'and after a merge the role has to be asked again, or this start brings up the '
    + 'database that was NOT chosen');
  assert.ok(/sudo snap set .* database=mongodb/.test(branch)
    && /sudo snap set .* database=ferretdb/.test(branch),
    'when nothing could be decided the two commands must still be printed');
});

test('autopick changes nothing it cannot justify, and says so', () => {
  const script = read('snap-src/bin/database-autopick');
  assert.ok(/WEKAN_AUTOPICK/.test(script), 'an admin has to be able to turn it off');
  assert.ok(/--dry-run/.test(script), 'and to see what it would do first');
  assert.ok(/exit 1/.test(script), 'no choice is a non-zero exit, so the caller keeps its message');
  assert.ok(/untouched/.test(script), 'the log has to say the other copy is still there');
  assert.ok(!/rm -rf|removeAsync|dropDatabase/.test(script),
    'nothing here may delete a database - that is the whole promise');
});

test('the merge script itself can only insert (negative)', () => {
  const merge = read('snap-src/bin/database-merge-missing.mjs');
  const code = merge.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  for (const forbidden of ['deleteMany', 'deleteOne', 'drop(', 'replaceOne', 'updateMany', 'updateOne']) {
    assert.ok(!code.includes(forbidden),
      `${forbidden} in the merge would make it more than an insert, and "nothing is `
      + 'overwritten" is what makes serving the other copy safe');
  }
  assert.ok(/insertMany/.test(code), 'insert is the only operation it needs');
});

(async () => {
  for (const [name, fn] of queued) { await fn(); passed += 1; console.log('  ok -', name); }
  console.log(`\nsnapDatabaseAutopick: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
