'use strict';

// #6818: the data health scan and repairs (models/lib/dataHealth.js) against a
// small in-memory stand-in for the MongoDB driver Db, plus the source rules
// that keep the Meteor half (server/lib/dataHealthScan.js,
// server/methods/dataHealth.js, the Problems / Summary page) honest:
//  - a repair that deletes data needs confirmed === true on the SERVER;
//  - custom fields on a board through the legacy scalar boardId, or a string
//    boardIds, are on that board;
//  - the card list / swimlane repairs ARE the startup upgrade steps of
//    server/lib/schemaUpgradeSteps.js, not a second copy;
//  - no repair overwrites an edit made while it runs;
//  - removing a duplicate member never removes board-admin rights;
//  - one scan or repair at a time, and the nightly claim refuses a recent scan;
//  - the new strings are translated everywhere, in en.i18n.json's key order;
//  - linked-card / subtask lookups are bounded by CHUNK, not by the card count.
// Run: node tests/dataHealth6818.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { isDeepStrictEqual } = require('util');

const { CHECKS, scanDataHealth, repairDataHealth, dataHealthProblems, dedupeMembers } = require('../models/lib/dataHealth.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ---- a driver-shaped fake ----------------------------------------------------
// Only the operators the module and the upgrade steps it runs use. `hooks`
// lets a test change the data between a repair's read and its write, the way a
// user editing the board meanwhile would.
const get = (doc, key) => key.split('.').reduce((v, k) => (v == null ? undefined : (Array.isArray(v) && /^\d+$/.test(k) ? v[+k] : v[k])), doc);
const isOps = c => c && typeof c === 'object' && !Array.isArray(c) && !(c instanceof Date) && Object.keys(c).some(k => k.startsWith('$'));
function same(value, x) {
  if (x === null) return value == null;
  if (x instanceof Date) return value instanceof Date && value.getTime() === x.getTime();
  if (Array.isArray(x) || (x && typeof x === 'object')) return isDeepStrictEqual(value, x);
  return value === x;
}
function cond(value, c) {
  if (isOps(c)) {
    return Object.entries(c).every(([op, arg]) => {
      if (op === '$in') return arg.some(x => same(value, x));
      if (op === '$nin') return !arg.some(x => same(value, x));
      if (op === '$exists') return arg === (value !== undefined);
      if (op === '$ne') return !same(value, arg);
      if (op === '$gt') return typeof value === 'number' && value > arg;
      if (op === '$lt') return value != null && value < arg;
      throw new Error('fake: ' + op);
    });
  }
  return same(value, c);
}
function matches(doc, filter) {
  return Object.entries(filter || {}).every(([k, c]) => {
    if (k === '$or') return c.some(f => matches(doc, f));
    if (k === '$and') return c.every(f => matches(doc, f));
    return cond(get(doc, k), c);
  });
}
function applyUpdate(d, update) {
  const before = JSON.stringify(d);
  Object.assign(d, structuredClone(update.$set || {}));
  for (const k of Object.keys(update.$unset || {})) delete d[k];
  for (const [k, c] of Object.entries(update.$pull || {})) {
    if (!Array.isArray(d[k])) { if (d[k] !== undefined) throw new Error('fake: $pull on a non-array'); continue; }
    d[k] = d[k].filter(el => !(isOps(c) ? cond(el, c) : (el && typeof el === 'object' && matches(el, c))));
  }
  return JSON.stringify(d) !== before;
}
function fakeDb(data, hooks = {}) {
  const all = name => (data[name] = data[name] || []);
  const lookups = [];   // [collection, size of the _id $in]
  const cursor = docs => ({
    async toArray() { return docs.map(d => structuredClone(d)); },
    async close() {},
    [Symbol.asyncIterator]() { let i = 0; return { next: async () => (i < docs.length ? { value: structuredClone(docs[i++]), done: false } : { done: true }) }; },
  });
  const beforeWrite = async name => { if (hooks.beforeWrite) { const h = hooks.beforeWrite; hooks.beforeWrite = null; await h(data, name); } };
  return {
    lookups,
    collection(name) {
      return {
        find(filter = {}) {
          if (filter._id && filter._id.$in) lookups.push([name, filter._id.$in.length]);
          return cursor(all(name).filter(d => matches(d, filter)));
        },
        async findOne(filter = {}) { const d = all(name).find(x => matches(x, filter)); return d ? structuredClone(d) : null; },
        async distinct(field, filter = {}) { return [...new Set(all(name).filter(d => matches(d, filter)).map(d => get(d, field)))]; },
        aggregate(pipeline) {
          if (data.noAggregate) throw new Error('aggregate not supported');
          let rows = all(name);
          for (const stage of pipeline) {
            if (stage.$match) rows = rows.filter(d => matches(d, stage.$match));
            if (stage.$group) {
              const groups = new Map();
              for (const d of rows) {
                const id = Object.fromEntries(Object.entries(stage.$group._id).map(([k, ref]) => [k, get(d, ref.slice(1))]));
                const key = JSON.stringify(id);
                groups.set(key, { _id: id, c: ((groups.get(key) || {}).c || 0) + 1 });
              }
              rows = [...groups.values()];
            }
          }
          return cursor(rows);
        },
        async updateOne(filter, update) {
          await beforeWrite(name);
          const d = all(name).find(x => matches(x, filter));
          return { matchedCount: d ? 1 : 0, modifiedCount: d && applyUpdate(d, update) ? 1 : 0 };
        },
        async updateMany(filter, update) {
          await beforeWrite(name);
          const hit = all(name).filter(x => matches(x, filter));
          return { modifiedCount: hit.filter(d => applyUpdate(d, update)).length };
        },
        async deleteMany(filter) {
          await beforeWrite(name);
          const before = all(name).length;
          data[name] = all(name).filter(x => !matches(x, filter));
          return { deletedCount: before - data[name].length };
        },
        async insertOne(doc) { all(name).push(structuredClone(doc)); return { insertedId: doc._id }; },
      };
    },
  };
}

// One of everything that should be found, and healthy data around it.
function sample() {
  return {
    users: [{ _id: 'u1', emails: [{ address: 'Anna@x.nl' }] }, { _id: 'u2', emails: [{ address: 'anna@x.nl' }] }, { _id: 'u3' }],
    boards: [
      { _id: 'A', members: [{ userId: 'u1', isAdmin: true, isActive: true }, { userId: 'u3', isActive: false }, { userId: 'u3', isActive: true }] },
      { _id: 'B', members: [{ userId: 'u1', isAdmin: true, isActive: true }, { userId: 'ghost' }] },
      { _id: 'C', members: [{ userId: 'u2', isAdmin: false, isActive: true }] },
    ],
    swimlanes: [{ _id: 'sA', boardId: 'A', sort: 0 }, { _id: 'sB', boardId: 'B', sort: 0 }, { _id: 'sX', boardId: 'deleted', sort: NaN }],
    lists: [
      { _id: 'lA', boardId: 'A', swimlaneId: '', sort: 0 },
      { _id: 'lA2', boardId: 'A', swimlaneId: 'sB', sort: 1 },     // swimlane of another board
      { _id: 'lA3', boardId: 'A', swimlaneId: 'gone', sort: 2 },   // swimlane does not exist
      { _id: 'lB', boardId: 'B', swimlaneId: '', sort: 0 },
    ],
    customFields: [{ _id: 'fA', boardIds: ['A'] }, { _id: 'fDead', boardIds: ['A', 'deleted'] }, { _id: 'fNone', boardIds: [] }],
    cards: [
      { _id: 'ok', boardId: 'A', listId: 'lA', swimlaneId: 'sA', sort: 0, archived: false, cardNumber: 1,
        customFields: [{ _id: 'fA', value: 'BVH 1' }, { _id: 'fB', value: null }] },
      { _id: 'moved', boardId: 'B', listId: 'lA', swimlaneId: 'sB', sort: 0, archived: false, cardNumber: 1 },
      { _id: 'nolist', boardId: 'A', listId: 'gone', swimlaneId: 'sA', sort: 0, archived: false, cardNumber: 1 },
      { _id: 'twin', boardId: 'A', listId: 'lA', swimlaneId: 'sA', sort: 0, archived: false, cardNumber: 1 },
      { _id: 'deadvals', boardId: 'A', listId: 'lA', swimlaneId: 'sA', sort: 0, archived: false, cardNumber: 2,
        customFields: [{ _id: 'fA', value: 'keep' }, { _id: 'fOther', value: 'x' }, { value: 'no id' }] },
      { _id: 'link', boardId: 'A', listId: 'lA', swimlaneId: 'sA', sort: 0, archived: false, type: 'cardType-linkedCard', linkedId: 'vanished' },
      { _id: 'sub', boardId: 'A', listId: 'lA', swimlaneId: 'sA', sort: 0, archived: false, parentId: 'vanished' },
      { _id: 'noflag', boardId: 'A', listId: 'lA', swimlaneId: 'sA', sort: 0 },
    ],
    checklists: [{ _id: 'cl1', cardId: 'ok', boardId: 'A' }, { _id: 'cl2', cardId: 'gone' }],
    checklistItems: [{ _id: 'i1', checklistId: 'cl1', cardId: 'ok' }, { _id: 'i2', checklistId: 'deleted' }, { _id: 'i3', checklistId: 'cl1', cardId: 'moved' }],
    card_comments: [{ _id: 'm1', cardId: 'ok', boardId: 'B' }],
    card_text_notes: [],
    attachments: [{ _id: 'a1', meta: { cardId: 'gone' }, deletedAt: null }, { _id: 'a2', meta: { cardId: 'gone' }, deletedAt: '2026-01-01' }],
  };
}
const count = (scan, id) => scan.results.find(r => r.id === id).count;
const card = (data, id) => data.cards.find(c => c._id === id);

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  await test('every check is described, and every repair kind is known', () => {
    assert.strictEqual(new Set(CHECKS.map(c => c.id)).size, CHECKS.length);
    for (const c of CHECKS) {
      assert.ok(c.title && c.means && c.todo, c.id);
      assert.ok([null, 'safe', 'confirm'].includes(c.repair), c.id);
    }
  });

  await test('the scan finds each kind once and nothing in healthy data', async () => {
    const scan = await scanDataHealth(fakeDb(sample()));
    const n = Object.fromEntries(scan.results.map(r => [r.id, r.count]));
    assert.deepStrictEqual(Object.fromEntries(Object.entries(n).filter(([, v]) => v)), {
      'board-duplicate-member': 1, 'board-ghost-member': 1, 'board-no-admin': 1,
      'swimlane-no-board': 1, 'sort-not-a-number': 1,
      'list-missing-swimlane': 1, 'list-foreign-swimlane': 1,
      'card-foreign-list': 1, 'card-missing-list': 1, 'card-no-archived-flag': 1,
      'card-duplicate-number': 1, 'card-link-gone': 1, 'card-parent-gone': 1, 'card-dead-field-values': 1,
      'checklist-card-gone': 1, 'comment-wrong-board': 1,
      'checklist-item-orphan': 1, 'checklist-item-other-card': 1,
      'attachment-card-gone': 1,
      'customfield-no-board': 1, 'customfield-dead-board': 1,
      'user-duplicate-email': 1,
    });
    assert.deepStrictEqual(scan.results.find(r => r.id === 'card-foreign-list').examples, ['moved']);
    assert.ok(scan.at instanceof Date && scan.durationMs >= 0);
  });

  await test('negative: a database without aggregate() skips only the card-number check', async () => {
    const data = sample();
    data.noAggregate = true;
    const scan = await scanDataHealth(fakeDb(data));
    assert.strictEqual(count(scan, 'card-duplicate-number'), null);
    assert.strictEqual(count(scan, 'card-foreign-list'), 1);
  });

  // ---- 1. confirmation on the server -------------------------------------------
  await test('a deleting repair runs only with confirmed === true', async () => {
    const data = sample();
    const db = fakeDb(data);
    for (const id of CHECKS.filter(c => c.repair === 'confirm').map(c => c.id)) {
      for (const options of [undefined, {}, { confirmed: false }, { confirmed: 'true' }, { confirmed: 1 }]) {
        await assert.rejects(repairDataHealth(db, id, options), /needs confirmation/, `${id} ${JSON.stringify(options)}`);
      }
    }
    assert.strictEqual(data.checklistItems.length, 3, 'nothing was deleted');
    assert.strictEqual(await repairDataHealth(db, 'checklist-item-orphan', { confirmed: true }), 1);
    assert.strictEqual(await repairDataHealth(db, 'board-ghost-member'), 1, 'a safe repair needs no confirmation');
  });

  await test('and the method refuses an unconfirmed deleting repair before running it; the page confirms on the second click', () => {
    const methods = read('server/methods/dataHealth.js');
    const body = methods.slice(methods.indexOf('async repairDataHealth('));
    assert.match(body, /^async repairDataHealth\(checkId, confirmed\)/);
    assert.match(body, /check\(confirmed, Match\.Optional\(Boolean\)\);/);
    assert.match(methods, /import \{ check, Match \} from 'meteor\/check';/);
    const guard = body.search(/if \(kind === 'confirm' && confirmed !== true\) \{\s*throw new Meteor\.Error/);
    assert.ok(guard > 0, 'the confirm guard throws');
    assert.ok(guard < body.indexOf('repairDataHealthCheck('), 'and comes before the repair runs');
    assert.match(body, /repairDataHealthCheck\(checkId, \{ confirmed: confirmed === true \}\)/);
    assert.match(read('server/lib/dataHealthScan.js'), /repairDataHealth\(getRawDb\(\), checkId, \{ confirmed: confirmed === true,/);
    const client = read('client/components/settings/problemsSummary.js');
    const calls = client.match(/Meteor\.call\('repairDataHealth',[^\n]*/g) || [];
    assert.deepStrictEqual(calls, ["Meteor.call('repairDataHealth', checkId, kind === 'confirm', (error, res) => {"]);
    // the call is reached for a 'confirm' repair only after the first click set
    // dataHealthConfirming for this check
    const handler = client.slice(client.indexOf("'click .js-data-health-repair'"), client.indexOf("'click .js-data-health-scan'"));
    assert.ok(handler.indexOf("dataHealthConfirming.get() !== checkId") < handler.indexOf("Meteor.call('repairDataHealth'"));
  });

  // ---- 2. legacy custom field shapes --------------------------------------------
  await test('a custom field on a live board through a scalar boardId or a string boardIds is on that board', async () => {
    const data = sample();
    data.customFields.push({ _id: 'fLegacy', boardId: 'A' }, { _id: 'fString', boardIds: 'A' }, { _id: 'fBoth', boardIds: ['deleted'], boardId: 'A' });
    card(data, 'ok').customFields.push({ _id: 'fLegacy', value: 'x' }, { _id: 'fString', value: 'y' }, { _id: 'fBoth', value: 'z' });
    const scan = await scanDataHealth(fakeDb(data));
    assert.strictEqual(count(scan, 'card-dead-field-values'), 1, 'only deadvals, as before');
    assert.strictEqual(count(scan, 'customfield-no-board'), 1, 'only fNone');
    assert.deepStrictEqual(scan.results.find(r => r.id === 'customfield-dead-board').examples, ['fDead', 'fBoth']);
    assert.strictEqual(await repairDataHealth(fakeDb(data), 'card-dead-field-values', { confirmed: true }), 1);
    assert.deepStrictEqual(card(data, 'ok').customFields.map(v => v._id), ['fA', 'fB', 'fLegacy', 'fString', 'fBoth'], 'their values are kept');
  });

  await test('negative: a string boardIds never throws, and a dead legacy boardId is removed only from a field with a live board', async () => {
    const data = sample();
    data.customFields.push(
      { _id: 'fStrDead', boardIds: 'deleted', boardId: 'A' },
      { _id: 'fLegacyDead', boardIds: ['A'], boardId: 'deleted' },
      { _id: 'fOnlyDead', boardId: 'deleted' },
    );
    const scan = await scanDataHealth(fakeDb(data));
    assert.strictEqual(count(scan, 'customfield-dead-board'), 4);
    assert.strictEqual(await repairDataHealth(fakeDb(data), 'customfield-dead-board'), 3);
    const f = id => data.customFields.find(x => x._id === id);
    assert.deepStrictEqual(f('fDead'), { _id: 'fDead', boardIds: ['A'] });
    assert.deepStrictEqual(f('fStrDead'), { _id: 'fStrDead', boardId: 'A' });
    assert.deepStrictEqual(f('fLegacyDead'), { _id: 'fLegacyDead', boardIds: ['A'] });
    assert.deepStrictEqual(f('fOnlyDead'), { _id: 'fOnlyDead', boardId: 'deleted' }, 'on deleted boards only: left for the admin');
    assert.deepStrictEqual(f('fNone').boardIds, [], 'a field on no board is left for the admin');
    const src = read('models/lib/dataHealth.js');
    assert.match(src, /Array\.isArray\(f\.boardIds\) \? f\.boardIds\.slice\(\) : \(f\.boardIds \? \[f\.boardIds\] : \[\]\);\s*if \(f\.boardId\) ids\.push\(f\.boardId\);/);
    assert.doesNotMatch(src, /\(f\.boardIds \|\| \[\]\)/, 'no read of boardIds that throws on a string');
  });

  // ---- 3. the card repairs are the upgrade steps --------------------------------
  await test('card repairs run the startup upgrade steps, not a copy of them', () => {
    const src = read('models/lib/dataHealth.js');
    for (const gone of ['repairCardLists', 'firstListOf', 'newId', 'Rescued Data\'', 'insertOne(']) {
      assert.ok(!src.includes(gone), `models/lib/dataHealth.js must not contain ${gone}`);
    }
    assert.match(src, /require\('\.\.\/\.\.\/server\/lib\/schemaUpgradeSteps'\)/);
    assert.match(src, /'card-foreign-list'\(db, opts\) \{ return runUpgradeSteps\(db, \['card-list-other-board', 'swimlane-structure'\], opts\); \}/);
    for (const id of ['card-missing-list', 'card-missing-swimlane', 'card-foreign-swimlane']) {
      assert.match(src, new RegExp(`'${id}'\\(db, opts\\) \\{ return runUpgradeSteps\\(db, \\['swimlane-structure'\\], opts\\); \\}`));
    }
    assert.match(src, /if \(!\(await step\.check\(db, ctx\)\)\) continue;\s*const res = await step\.run\(db, ctx\);/, 'check() then run(), as runSchemaUpgrade does');
    const names = require('../server/lib/schemaUpgradeSteps').steps.map(s => s.name);
    assert.ok(names.indexOf('card-list-other-board') < names.indexOf('swimlane-structure'), 'the order the runner uses');
  });

  await test('safe repairs put things where they belong', async () => {
    let data = sample();
    let db = fakeDb(data);
    assert.ok(await repairDataHealth(db, 'card-foreign-list') >= 1);
    assert.strictEqual(card(data, 'moved').listId, 'lB', 'first list of its own board');
    assert.strictEqual(card(data, 'moved').swimlaneId, 'sB');
    data = sample();
    db = fakeDb(data);
    assert.ok(await repairDataHealth(db, 'card-missing-list') >= 1);
    assert.strictEqual(card(data, 'nolist').listId, 'lA');
    assert.strictEqual(card(data, 'nolist').swimlaneId, 'sA');
    assert.strictEqual(await repairDataHealth(db, 'list-foreign-swimlane'), 1);
    assert.strictEqual(await repairDataHealth(db, 'list-missing-swimlane'), 1);
    assert.deepStrictEqual(data.lists.filter(l => l.swimlaneId).map(l => l._id), []);
    assert.strictEqual(await repairDataHealth(db, 'board-duplicate-member'), 1);
    assert.deepStrictEqual(data.boards[0].members.map(m => [m.userId, m.isActive]), [['u1', true], ['u3', true]], 'the active entry is kept');
    assert.strictEqual(await repairDataHealth(db, 'board-ghost-member'), 1);
    assert.deepStrictEqual(data.boards[1].members.map(m => m.userId), ['u1']);
    assert.strictEqual(await repairDataHealth(db, 'customfield-dead-board'), 1);
    assert.deepStrictEqual(data.customFields.find(f => f._id === 'fDead').boardIds, ['A']);
    const after = await scanDataHealth(db);
    for (const id of ['card-missing-list', 'list-foreign-swimlane', 'list-missing-swimlane', 'board-duplicate-member', 'board-ghost-member', 'customfield-dead-board']) {
      assert.strictEqual(count(after, id), 0, id);
    }
  });

  await test('#6814: a card moved from another board gets a list AND a swimlane of its own board in one repair', async () => {
    const data = sample();
    data.cards.push({ _id: 'toC', boardId: 'C', listId: 'lA', swimlaneId: 'sA', archived: false });
    const db = fakeDb(data);
    await repairDataHealth(db, 'card-foreign-list');
    const rescued = data.lists.find(l => l.boardId === 'C');
    assert.strictEqual(rescued.title, 'Rescued Data', 'board C had no list');
    assert.strictEqual(card(data, 'toC').listId, rescued._id);
    const swimlane = data.swimlanes.find(s => s._id === card(data, 'toC').swimlaneId);
    assert.strictEqual(swimlane && swimlane.boardId, 'C', 'and a swimlane of board C, not the one of A');
    const after = await scanDataHealth(db);
    for (const id of ['card-foreign-list', 'card-missing-list', 'card-foreign-swimlane', 'card-missing-swimlane']) assert.strictEqual(count(after, id), 0, id);
    assert.strictEqual(await repairDataHealth(db, 'card-foreign-list'), 0, 'negative: a second repair finds nothing');
  });

  await test('swimlane repairs move open cards only, as swimlane-structure does', async () => {
    const data = sample();
    data.swimlanes.push({ _id: 'sOld', boardId: 'A', archived: true, sort: 5 });
    data.cards.push(
      { _id: 'lost', boardId: 'A', listId: 'lA', swimlaneId: 'deleted-lane', archived: false },
      { _id: 'foreign', boardId: 'A', listId: 'lA', swimlaneId: 'sB', archived: false },
      { _id: 'archivedLost', boardId: 'A', listId: 'lA', swimlaneId: 'deleted-lane', archived: true },
      { _id: 'inArchivedLane', boardId: 'A', listId: 'lA', swimlaneId: 'sOld', archived: false },
    );
    const db = fakeDb(data);
    const scan = await scanDataHealth(db);
    assert.deepStrictEqual(scan.results.find(r => r.id === 'card-missing-swimlane').examples, ['lost'], 'an archived card is not counted');
    assert.deepStrictEqual(scan.results.find(r => r.id === 'card-foreign-swimlane').examples, ['foreign']);
    assert.ok(await repairDataHealth(db, 'card-missing-swimlane') >= 2);
    assert.strictEqual(card(data, 'lost').swimlaneId, 'sA');
    assert.strictEqual(card(data, 'foreign').swimlaneId, 'sA');
    assert.strictEqual(card(data, 'archivedLost').swimlaneId, 'deleted-lane', 'negative: archived cards stay');
    assert.strictEqual(card(data, 'inArchivedLane').swimlaneId, 'sOld', 'negative: a card of an archived swimlane stays hidden');
    assert.strictEqual(await repairDataHealth(db, 'card-foreign-swimlane'), 0);
  });

  // ---- 4. no lost concurrent edits ----------------------------------------------
  await test('repairs keep edits made between their read and their write', async () => {
    let data = sample();
    await repairDataHealth(fakeDb(data, { beforeWrite: d => d.boards[1].members.push({ userId: 'u2', isActive: true }) }), 'board-ghost-member');
    assert.deepStrictEqual(data.boards[1].members.map(m => m.userId), ['u1', 'u2'], 'ghost removed, new member kept');

    data = sample();
    await repairDataHealth(fakeDb(data, { beforeWrite: d => card(d, 'deadvals').customFields.push({ _id: 'fA2', value: 'new' }) }),
      'card-dead-field-values', { confirmed: true });
    assert.deepStrictEqual(card(data, 'deadvals').customFields, [{ _id: 'fA', value: 'keep' }, { _id: 'fA2', value: 'new' }]);

    data = sample();
    await repairDataHealth(fakeDb(data, { beforeWrite: d => d.customFields[1].boardIds.push('B') }), 'customfield-dead-board');
    assert.deepStrictEqual(data.customFields[1].boardIds, ['A', 'B']);

    data = sample();
    const fixed = await repairDataHealth(fakeDb(data, { beforeWrite: d => d.boards[0].members.push({ userId: 'u2', isActive: true }) }), 'board-duplicate-member');
    assert.strictEqual(fixed, 0, 'the guarded dedupe skips a board whose members changed');
    assert.deepStrictEqual(data.boards[0].members.map(m => m.userId), ['u1', 'u3', 'u3', 'u2'], 'the new member is kept');
  });

  await test('negative: no repair writes back a whole members, customFields or boardIds array unguarded', () => {
    const src = read('models/lib/dataHealth.js');
    const repairs = src.slice(src.indexOf('const REPAIRS = {'));
    assert.doesNotMatch(repairs, /\$set: \{ (customFields|boardIds):/);
    const memberSets = repairs.match(/updateOne\([^;]*\$set: \{ members:/g) || [];
    assert.deepStrictEqual(memberSets, ['updateOne({ _id: b._id, members: b.members }, { $set: { members:']);
    assert.match(repairs, /\$pull: \{ members: \{ userId: \{ \$in: ghostIds \} \} \}/);
    assert.match(repairs, /\$pull: \{ customFields: \{ _id: \{ \$in: deadIds \} \} \}/);
    assert.match(repairs, /\$pull = \{ boardIds: \{ \$in: deadBoards \} \}/);
  });

  // ---- 5. admin rights survive the dedupe ----------------------------------------
  await test('dedupeMembers keeps one entry per person, prefers an active admin, and returns null when nothing changes', () => {
    assert.strictEqual(dedupeMembers([{ userId: 'a' }, { userId: 'b' }]), null);
    assert.deepStrictEqual(dedupeMembers([{ userId: 'a', isActive: false }, { userId: 'a', isActive: true }]), [{ userId: 'a', isActive: true }]);
    assert.deepStrictEqual(dedupeMembers([{ userId: 'a', x: 1 }, { userId: 'a', x: 2 }]), [{ userId: 'a', x: 1 }]);
    assert.deepStrictEqual(dedupeMembers([{ userId: 'u', isAdmin: false }, { userId: 'u', isAdmin: true, isActive: true }]),
      [{ userId: 'u', isAdmin: true, isActive: true }]);
    assert.deepStrictEqual(dedupeMembers([{ userId: 'u', isAdmin: false, isActive: true }, { userId: 'u', isAdmin: true, isActive: true }]),
      [{ userId: 'u', isAdmin: true, isActive: true }], 'an active admin beats an active member');
    assert.deepStrictEqual(dedupeMembers([{ userId: 'u', isAdmin: true, isActive: true }, { userId: 'u', isAdmin: false, isActive: true }]),
      [{ userId: 'u', isAdmin: true, isActive: true }], 'negative: a later non-admin does not replace the admin');
  });

  await test('negative: no duplicate repair leaves an open board without the admin it had', async () => {
    const data = sample();
    data.boards.push({ _id: 'D', members: [{ userId: 'u1', isAdmin: false }, { userId: 'u1', isAdmin: true, isActive: true }] });
    const db = fakeDb(data);
    assert.strictEqual(count(await scanDataHealth(db), 'board-no-admin'), 1, 'only C');
    await repairDataHealth(db, 'board-duplicate-member');
    assert.deepStrictEqual(data.boards[3].members, [{ userId: 'u1', isAdmin: true, isActive: true }]);
    assert.strictEqual(count(await scanDataHealth(db), 'board-no-admin'), 1, 'still only C');
  });

  // ---- 6. one scan or repair at a time ------------------------------------------
  await test('the claim: nightly refuses a recent scan atomically, release filters on the claim, repairs take the claim', () => {
    const src = read('server/lib/dataHealthScan.js');
    const claim = src.slice(src.indexOf('async function claim('), src.indexOf('// Only the holder'));
    assert.match(claim, /\{ runningSince: null \}, \{ runningSince: \{ \$lt: new Date\(now\.getTime\(\) - STALE_MS\) \} \}/);
    assert.match(claim, /if \(nightly\) \{\s*filter\.\$and\.push\(\{ \$or: \[\{ at: null \}, \{ at: \{ \$exists: false \} \}, \{ at: \{ \$lt: new Date\(now\.getTime\(\) - EVERY_MS\) \} \}\] \}\);/);
    assert.match(claim, /findOneAndUpdate\(filter, \{ \$set: \{ runningSince: now \} \}, \{ upsert: true \}\)/);
    assert.match(src, /status\(\)\.updateOne\(\{ _id: SCAN_ID, runningSince: claimedAt \}, \{ \$set: \{ \.\.\.set, runningSince: null \} \}\)/);
    assert.doesNotMatch(src, /updateOne\(\{ _id: SCAN_ID \}/, 'negative: nothing clears runningSince without the claim');
    assert.strictEqual((src.match(/runningSince: null/g) || []).length, 2, 'the claim filter and release() only');
    assert.match(src, /runWhenCpuLow\('data health scan', \(\) => runDataHealthScan\(\{ nightly: true \}\)/);
    const repair = src.slice(src.indexOf('export async function repairDataHealthCheck('));
    assert.match(repair, /const claimedAt = await claim\(\);\s*if \(!claimedAt\) throw/);
    assert.ok(repair.indexOf('await claim()') < repair.indexOf('repairDataHealth(getRawDb()'));
    assert.match(repair, /\} finally \{\s*await release\(claimedAt\)/);
    // the claim filter as data: the fake's matcher agrees with what it means
    const now = Date.now();
    const filter = (nightly) => {
      const f = { _id: 'scan', $and: [{ $or: [{ runningSince: null }, { runningSince: { $lt: new Date(now - 6 * 3600e3) } }] }] };
      if (nightly) f.$and.push({ $or: [{ at: null }, { at: { $exists: false } }, { at: { $lt: new Date(now - 20 * 3600e3) } }] });
      return f;
    };
    assert.ok(matches({ _id: 'scan', at: new Date(now - 21 * 3600e3) }, filter(true)));
    assert.ok(!matches({ _id: 'scan', at: new Date(now - 60e3) }, filter(true)), 'negative: a scan a minute ago is not repeated');
    assert.ok(matches({ _id: 'scan', at: new Date(now - 60e3) }, filter(false)), 'Start still runs it');
    assert.ok(!matches({ _id: 'scan', runningSince: new Date(now - 60e3) }, filter(false)), 'negative: not beside a running one');
  });

  // ---- 7. translations -----------------------------------------------------------
  await test('the new strings are translated in every non-en locale and sit in en.i18n.json\'s key order', () => {
    const dir = path.join(ROOT, 'imports/i18n/data');
    const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.i18n.json'), 'utf8'));
    const enOrder = new Map(Object.keys(en).map((k, i) => [k, i]));
    const keys = ['data-health', 'data-health-repair'];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'));
    let checked = 0;
    for (const file of files) {
      const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      const order = Object.keys(j).filter(k => enOrder.has(k));
      for (const key of keys) {
        assert.ok(typeof j[key] === 'string' && j[key].trim(), `${file}: ${key}`);
        if (!file.startsWith('en')) assert.notStrictEqual(j[key], en[key], `${file}: ${key} is still English`);
        const i = order.indexOf(key);
        if (i > 0) assert.ok(enOrder.get(order[i - 1]) < enOrder.get(key), `${file}: ${key} after ${order[i - 1]}`);
        if (i < order.length - 1) assert.ok(enOrder.get(order[i + 1]) > enOrder.get(key), `${file}: ${key} before ${order[i + 1]}`);
      }
      checked += 1;
    }
    assert.ok(checked > 150);
    const ay = JSON.parse(fs.readFileSync(path.join(dir, 'ay.i18n.json'), 'utf8'));
    assert.doesNotMatch(ay['data-health'], /qullqi/, 'negative: qullqi is money, not health');
  });

  // ---- 8. bounded lookups --------------------------------------------------------
  await test('linked cards and subtasks are looked up a CHUNK at a time inside the card loop', async () => {
    const data = sample();
    for (let i = 0; i < 2500; i += 1) {
      data.cards.push({ _id: `L${i}`, boardId: 'A', listId: 'lA', swimlaneId: 'sA', sort: 0, archived: false,
        type: 'cardType-linkedCard', linkedId: i % 2 ? 'ok' : `gone${i}` });
    }
    const db = fakeDb(data);
    const scan = await scanDataHealth(db);
    assert.strictEqual(count(scan, 'card-link-gone'), 1 + 1250, 'the sample one and every even one');
    const cardLookups = db.lookups.filter(([c]) => c === 'cards');
    assert.ok(cardLookups.length >= 3, 'more than one lookup');
    assert.ok(cardLookups.every(([, n]) => n <= 1000), 'never more than CHUNK ids at a time');
    const src = read('models/lib/dataHealth.js');
    const loop = src.slice(src.indexOf('for await (const c of cards)'), src.indexOf('// Duplicate card numbers'));
    assert.match(loop, /if \(pointers\.length >= CHUNK\) await lookUpPointers\(\);\s*\}\s*await lookUpPointers\(\);/);
    assert.match(src, /const part = pointers;\s*pointers = \[\];/, 'cleared after each lookup');
  });

  // ---- 9. what the texts say -------------------------------------------------------
  await test('board-no-admin treats only isActive === true as active, as Boards.hasAdmin does', async () => {
    const data = sample();
    data.boards.push({ _id: 'E', members: [{ userId: 'u1', isAdmin: true }] }, { _id: 'F', members: [{ userId: 'u1', isAdmin: true, isActive: true }] });
    const scan = await scanDataHealth(fakeDb(data));
    assert.deepStrictEqual(scan.results.find(r => r.id === 'board-no-admin').examples, ['C', 'E']);
    assert.match(read('models/boards.js'), /hasAdmin\(memberId\) \{\s*return !!findWhere\(this\.members, \{\s*userId: memberId,\s*isActive: true,\s*isAdmin: true,/);
    const c = CHECKS.find(x => x.id === 'card-missing-swimlane');
    assert.match(c.title, /^Open cards/);
    assert.strictEqual(c.repair, 'safe');
  });

  await test('confirmed repairs delete only what is shown nowhere', async () => {
    const data = sample();
    const db = fakeDb(data);
    assert.strictEqual(await repairDataHealth(db, 'checklist-item-orphan', { confirmed: true }), 1);
    assert.deepStrictEqual(data.checklistItems.map(i => i._id), ['i1', 'i3']);
    assert.strictEqual(await repairDataHealth(db, 'card-dead-field-values', { confirmed: true }), 1);
    assert.deepStrictEqual(card(data, 'deadvals').customFields, [{ _id: 'fA', value: 'keep' }]);
    assert.deepStrictEqual(card(data, 'ok').customFields,
      [{ _id: 'fA', value: 'BVH 1' }, { _id: 'fB', value: null }], 'an empty entry is not a dead value');
    const after = await scanDataHealth(db);
    assert.strictEqual(count(after, 'checklist-item-orphan'), 0);
    assert.strictEqual(count(after, 'card-dead-field-values'), 0);
  });

  await test('negative: checks without a repair cannot be repaired', async () => {
    for (const id of ['card-duplicate-number', 'user-duplicate-email', 'board-no-admin', 'no-such-check']) {
      await assert.rejects(repairDataHealth(fakeDb(sample()), id, { confirmed: true }), /no repair/);
    }
  });

  await test('Problems rows: only checks that found something, ids only, repair kind passed on', async () => {
    const rows = dataHealthProblems(await scanDataHealth(fakeDb(sample())));
    const row = rows.find(r => r.checkId === 'card-foreign-list');
    assert.strictEqual(row.id, 'data-health:card-foreign-list');
    assert.strictEqual(row.repair, 'safe');
    assert.strictEqual(row.count, 1);
    assert.match(row.detail, /e\.g\. moved\.$/);
    assert.ok(rows.every(r => r.count > 0));
    assert.strictEqual(rows.find(r => r.checkId === 'checklist-item-orphan').repair, 'confirm');
    assert.deepStrictEqual(dataHealthProblems(null), []);
  });

  await test('the server wiring: nightly, one pod at a time, admin-only methods, shown in Problems', () => {
    const server = read('server/lib/dataHealthScan.js');
    assert.match(server, /runWhenCpuLow\('data health scan'/);
    assert.match(server, /NIGHT_HOURS\.includes\(new Date\(\)\.getHours\(\)\)/);
    assert.match(server, /runningSince/);   // the claim that keeps it to one pod
    const methods = read('server/methods/dataHealth.js');
    for (const m of ['dataHealthScanNow', 'repairDataHealth']) assert.match(methods, new RegExp(`async ${m}\\(`));
    assert.strictEqual((methods.match(/await requireAdmin\(\);/g) || []).length, 2);
    assert.match(read('server/lib/systemStatus.js'), /dataHealthProblemsNow\(\)/);
    assert.match(read('server/imports.js'), /import '\/server\/lib\/dataHealthScan';/);
    assert.match(read('server/imports.js'), /import '\/server\/methods\/dataHealth';/);
    const jade = read('client/components/settings/problemsSummary.jade');
    assert.match(jade, /button\.js-data-health-repair/);
    assert.match(jade, /button\.js-data-health-scan/);
  });

  console.log(`\n${passed} tests passed`);
})().catch(error => { console.error(error); process.exit(1); });
