'use strict';
// A saved List Sync operation whose scope or access went stale can never be
// replayed, and while it is pending its list cannot Sync. It is recorded once
// for Admin Panel -> Problems -> Recovery, listed there with its live
// replayability, and an administrator discards it (server/lib/listSyncStuck.js).
//
// Run: node --test tests/listSyncStuck.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('../server/lib/listSyncStuck');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const clone = value => (value == null ? value : structuredClone(value));
const get = (row, key) => key.split('.').reduce((value, part) => value?.[part], row);
function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    const actual = get(row, key);
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('$exists' in value) return (actual !== undefined) === value.$exists;
      if ('$ne' in value) return JSON.stringify(actual) !== JSON.stringify(value.$ne);
    }
    return JSON.stringify(actual) === JSON.stringify(value);
  });
}
function setPath(row, key, value) {
  const parts = key.split('.'); let target = row;
  for (const part of parts.slice(0, -1)) target = target[part] ??= {};
  target[parts.at(-1)] = value;
}
function collection({ failDelete = false } = {}) {
  const rows = new Map();
  return { rows, writes: 0,
    async findOne(query) { return clone([...rows.values()].find(row => matches(row, query)) || null); },
    find(query) {
      const list = [...rows.values()].filter(row => matches(row, query));
      const cursor = { sort: () => cursor, limit: n => { list.splice(n); return cursor; }, toArray: async () => list.map(clone) };
      return cursor;
    },
    async insertOne(row) {
      this.writes++;
      if (rows.has(row._id)) throw Object.assign(new Error('duplicate'), { code: 11000 });
      rows.set(row._id, clone(row));
    },
    async updateOne(query, { $set }) {
      this.writes++;
      const row = [...rows.values()].find(candidate => matches(candidate, query));
      if (!row) return { matchedCount: 0, modifiedCount: 0 };
      for (const [key, value] of Object.entries($set)) setPath(row, key, clone(value));
      return { matchedCount: 1, modifiedCount: 1 };
    },
    async deleteOne(query) {
      this.writes++;
      if (failDelete) throw new Error('lost acknowledgement');
      const row = [...rows.values()].find(candidate => matches(candidate, query));
      if (row) rows.delete(row._id);
    },
    async deleteMany(query) {
      this.writes++;
      for (const row of [...rows.values()]) if (matches(row, query)) rows.delete(row._id);
    },
  };
}

const LIST = 'list1', OP = '11111111-1111-4111-8111-111111111111', INTENT = '22222222-2222-4222-8222-222222222222';
function fixture({ state = 'applying', stuck = true } = {}) {
  const f = { operations: collection(), steps: collection(), discards: collection(), leaseChecks: 0,
    live: 'scope-changed', operator: 'admin', now: () => new Date(5000) };
  f.operations.rows.set(LIST, { _id: LIST, operationId: OP, intentId: INTENT, state, checkpoint: 2, total: 5,
    scope: { listId: LIST, boardId: 'board1', incarnation: 'i', revision: 'r', sourceKey: 'k' },
    ...(stuck ? { stuck: { reason: 'scope-changed', at: new Date(1000) } } : {}) });
  for (let index = 0; index < 5; index++) f.steps.rows.set(`${OP}:${index}`, { _id: `${OP}:${index}`, operationId: OP, index });
  f.steps.rows.set('other:0', { _id: 'other:0', operationId: 'other', index: 0 });
  f.inspect = async () => f.live;
  f.assertCurrent = async () => { f.leaseChecks++; };
  f.discard = (extra = {}) => S.discardStuckOperation({ ...f, listId: LIST, operationId: OP, ...extra });
  return f;
}

test('stale scope, lost access, an unknown trigger and a missing intent are stuck reasons', () => {
  assert.equal(S.stuckReason({ code: 'sync-operation-scope-changed' }), 'scope-changed');
  assert.equal(S.stuckReason({ code: 'sync-operation-access-denied' }), 'access-denied');
  assert.equal(S.stuckReason({ code: 'sync-operation-trigger-unknown' }), 'trigger-unknown');
  assert.equal(S.stuckReason(new Error('sync-operation-intent-missing')), 'intent-missing');
});

test('transient and unrelated failures are NOT stuck reasons', () => {
  for (const code of ['sync-busy', 'sync-lease-lost', 'sync-operation-plan-damaged', 'sync-card-changed',
    'sync-operation-write-unconfirmed', 'ECONNRESET', '']) {
    assert.equal(S.stuckReason({ code }), null, code);
  }
  assert.equal(S.stuckReason(null), null);
  assert.equal(S.stuckReason({ code: 'constructor' }), null, 'no prototype keys');
});

test('a stuck operation is recorded once, not on every replay', async () => {
  const f = fixture({ stuck: false });
  const first = await S.markStuckOperation({ ...f, listId: LIST, operationId: OP, reason: 'scope-changed' });
  assert.equal(first.operationId, OP, 'the first mark returns the operation for one Recovery event');
  assert.deepEqual(f.operations.rows.get(LIST).stuck, { reason: 'scope-changed', at: new Date(5000) });
  for (let minute = 0; minute < 5; minute++) {
    assert.equal(await S.markStuckOperation({ ...f, listId: LIST, operationId: OP, reason: 'scope-changed' }), null);
  }
  assert.equal(await S.markStuckOperation({ ...f, listId: LIST, operationId: OP, reason: 'access-denied' }), null,
    'a changed reason is stored without another event');
  assert.equal(f.operations.rows.get(LIST).stuck.reason, 'access-denied');
  assert.deepEqual(f.operations.rows.get(LIST).stuck.at, new Date(5000), 'the first time stays');
});

test('a preparing operation, another operation or an unknown reason is not marked', async () => {
  const preparing = fixture({ state: 'preparing', stuck: false });
  assert.equal(await S.markStuckOperation({ ...preparing, listId: LIST, operationId: OP, reason: 'scope-changed' }), null);
  assert.equal(preparing.operations.rows.get(LIST).stuck, undefined, 'preparing is discarded automatically instead');
  const other = fixture({ stuck: false });
  assert.equal(await S.markStuckOperation({ ...other, listId: LIST, operationId: '33333333-3333-4333-8333-333333333333',
    reason: 'scope-changed' }), null);
  assert.equal(await S.markStuckOperation({ ...other, listId: LIST, operationId: OP, reason: 'sync-busy' }), null);
  assert.equal(other.operations.rows.get(LIST).stuck, undefined);
});

test('Recovery lists marked operations with their live replayability and no card data', async () => {
  const f = fixture();
  f.operations.rows.set('list2', { _id: 'list2', operationId: 'op2', state: 'applying', checkpoint: 0, total: 1,
    scope: { boardId: 'board2' } });
  const result = await S.listStuckOperations(f);
  assert.equal(result.rows.length, 1, 'an unmarked (replayable) operation is not listed');
  assert.deepEqual(result.rows[0], { listId: LIST, operationId: OP, boardId: 'board1', state: 'applying', applied: 2,
    total: 5, reason: 'scope-changed', stuckAt: new Date(1000), replayable: false, discarding: false });
  f.live = null;
  assert.equal((await S.listStuckOperations(f)).rows[0].replayable, true, 'access restored: shown as replayable');
  f.inspect = async () => { throw new Error('database unavailable'); };
  assert.equal((await S.listStuckOperations(f)).rows[0].replayable, null, 'a failed check is unknown, not stuck');
});

test('discard records the decision, removes the plan and the marker, and writes no card', async () => {
  const f = fixture();
  const result = await f.discard();
  assert.deepEqual(result, { listId: LIST, operationId: OP, boardId: 'board1', status: 'discarded', decidedNow: true,
    applied: 2, total: 5 });
  assert.equal(f.operations.rows.has(LIST), false, 'the list can Sync again');
  assert.deepEqual([...f.steps.rows.keys()], ['other:0'], 'only this operation\'s steps are removed');
  assert.deepEqual(f.discards.rows.get(OP), { _id: OP, version: 1, decision: 'discard', listId: LIST, boardId: 'board1',
    intentId: INTENT, state: 'applying', applied: 2, total: 5, reason: 'scope-changed', operator: 'admin',
    decidedAt: new Date(5000) });
  assert.ok(f.leaseChecks >= 3, 'the lease is checked around every write');
});

test('discarding twice is a no-op', async () => {
  const f = fixture();
  await f.discard();
  const writes = f.discards.writes;
  const again = await f.discard({ operator: 'other-admin' });
  assert.equal(again.status, 'already-discarded');
  assert.equal(again.decidedNow, false, 'no second audit row');
  assert.equal(f.discards.writes, writes, 'the decision is not written again');
  assert.equal(f.discards.rows.get(OP).operator, 'admin');
});

test('a replayable operation is NOT discarded, even with an old stuck mark', async () => {
  const f = fixture();
  f.live = null;
  await assert.rejects(f.discard(), error => error.reason === 'replayable');
  assert.equal(f.operations.rows.get(LIST).operationId, OP);
  assert.equal(f.steps.rows.size, 6);
  assert.equal(f.discards.rows.size, 0);
});

test('an unmarked, preparing, missing or mismatched operation is refused', async () => {
  const unmarked = fixture({ stuck: false });
  await assert.rejects(unmarked.discard(), error => error.reason === 'not-stuck');
  const preparing = fixture({ state: 'preparing' });
  await assert.rejects(preparing.discard(), error => error.reason === 'not-stuck');
  const missing = fixture();
  await assert.rejects(missing.discard({ operationId: '44444444-4444-4444-8444-444444444444' }), error => error.reason === 'missing');
  await assert.rejects(missing.discard({ listId: 'other list!' }), error => error.reason === 'invalid');
  await assert.rejects(missing.discard({ operator: '' }), error => error.reason === 'invalid');
  await assert.rejects(missing.discard({ assertCurrent: undefined }), error => error.reason === 'lease-required');
  assert.equal(missing.operations.rows.has(LIST), true);
});

test('a lost lease stops the discard before anything is removed', async () => {
  const f = fixture();
  f.assertCurrent = async () => { throw Object.assign(new Error('sync-lease-lost'), { code: 'sync-lease-lost' }); };
  await assert.rejects(f.discard(), /sync-lease-lost/);
  assert.equal(f.operations.rows.has(LIST), true);
  assert.equal(f.steps.rows.size, 6);
});

test('an interrupted discard is finished by the retry or by the next replay, never resumed', async () => {
  const f = fixture();
  f.operations.deleteOne = async () => { throw new Error('lost acknowledgement'); };
  await assert.rejects(f.discard(), /lost acknowledgement/);
  assert.equal(f.discards.rows.size, 1, 'the decision was recorded');
  assert.equal(f.operations.rows.has(LIST), true);
  // The replay path (resumePending) completes the decided discard first.
  delete f.operations.deleteOne;
  const g = { ...f, operations: collection() };
  g.operations.rows.set(LIST, f.operations.rows.get(LIST));
  assert.equal(await S.completeDecidedDiscard({ ...g, listId: LIST }), OP);
  assert.equal(g.operations.rows.has(LIST), false);
  assert.deepEqual([...g.steps.rows.keys()], ['other:0']);
  assert.equal(await S.completeDecidedDiscard({ ...g, listId: LIST }), null, 'nothing left to finish');
});

test('the retry of an interrupted discard skips the live check: the decision stands', async () => {
  const f = fixture();
  const realDelete = f.operations.deleteOne.bind(f.operations);
  f.operations.deleteOne = async () => { throw new Error('lost acknowledgement'); };
  await assert.rejects(f.discard());
  f.operations.deleteOne = realDelete;
  f.live = null;
  const retry = await f.discard();
  assert.equal(retry.status, 'discarded');
  assert.equal(retry.decidedNow, false, 'the audit row was for the first call');
  assert.equal(f.operations.rows.has(LIST), false);
});

test('completeDecidedDiscard leaves an undecided operation alone', async () => {
  const f = fixture();
  assert.equal(await S.completeDecidedDiscard({ ...f, listId: LIST }), null);
  assert.equal(f.operations.rows.has(LIST), true);
  f.discards.rows.set(OP, { _id: OP, listId: 'another-list' });
  assert.equal(await S.completeDecidedDiscard({ ...f, listId: LIST }), null, 'a decision for another list does not count');
  assert.equal(f.operations.rows.has(LIST), true);
});

// Wiring: the methods, the replay and the UI.
test('the methods are instance-administrator only and the discard holds the list lease', () => {
  const source = read('server/methods/listSyncStuck.js');
  for (const name of ['listSyncStuckOperations', 'listSyncStuckDiscard']) {
    const body = source.slice(source.indexOf(`async ${name}(`));
    assert.match(body.slice(0, 300), /await assertAdmin\(this\.userId\)/, `${name} checks the administrator first`);
    assert.match(source, new RegExp(`DDPRateLimiter\\.addRule\\(\\{ type: 'method', name: '${name}'`));
  }
  assert.match(source, /isAdmin.*loginDisabled|loginDisabled[\s\S]{0,80}isAdmin/);
  assert.match(source, /withListSyncLease\(listId,/);
  assert.match(source, /assertCurrent: async \(\) => \{ await assertCurrent\(\); await assertAdmin\(this\.userId\); \}/,
    'administrator access is re-checked with the lease around every write');
  assert.match(source, /if \(result\.decidedNow\)/, 'one Recovery audit row per decision');
  assert.match(read('server/imports.js'), /import '\/server\/methods\/listSyncStuck';/);
});

test('replay and new runs finish a decided discard first and record a stuck operation once', () => {
  const source = read('server/lib/listSyncApplication.js');
  const resume = source.slice(source.indexOf('async function resumePending('), source.indexOf('async function noteStuck('));
  assert.ok(resume.indexOf('completeDecidedListSyncDiscard') < resume.indexOf('readPendingListSyncOperation'),
    'a decided discard is completed before anything is resumed');
  assert.match(resume, /stuckReason\(error\)/);
  assert.match(source, /if \(!marked\) return false;\s*\n[\s\S]*RecoveryEvents\.record\(RecoveryEvents\.types\.LIST_SYNC_OPERATION_STUCK/,
    'the Recovery event follows only a first mark');
  assert.match(source, /if \(error\.listSyncStuck\.recorded\)/, 'the console line is written once too');
  const inspect = source.slice(source.indexOf('export async function inspectListSyncOperation('));
  assert.match(inspect, /if \(reason\) return reason;\s*\n\s*throw error;/, 'an unknown failure never unlocks a discard');
  assert.match(read('models/recoveryEvents.js'), /LIST_SYNC_OPERATION_STUCK: 'list-sync-operation-stuck'/);
  assert.match(read('server/listSync.js'), /e\?\.listSyncStuck\s*\n?\s*\?/, 'a blocked manual Sync says why');
});

test('nothing else deletes saved List Sync operations outside the journal and the lease-holding paths', () => {
  // The shape of the fault: a removal of the operation marker that does not
  // hold the list lease. Only the journal, the preparing discard and this
  // module may delete from the operations collection.
  const allowed = new Set(['server/lib/syncOperationJournal.js', 'server/lib/listSyncOperations.js', 'server/lib/listSyncStuck.js']);
  const files = require('node:child_process').execFileSync('git', ['grep', '-l', '-E', 'listSyncOperations\\b|operations\\.deleteOne',
    '--', 'server', 'models'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  for (const file of files) {
    if (allowed.has(file) || file.includes('/tests/')) continue;
    assert.doesNotMatch(read(file), /operations\.(rawCollection\(\)\.)?delete(One|Many)\(/, file);
  }
});

test('the Recovery page lists them and disables discard unless known not replayable', () => {
  const jade = read('client/components/settings/adminProblems.jade');
  assert.match(jade, /\+syncRuleEmailLegacyCommands\n\s+\+listSyncStuckOperations/);
  assert.match(jade, /template\(name="listSyncStuckOperations"\)/);
  assert.match(jade, /button\.js-list-sync-stuck-discard\(type="button" disabled=discardDisabled\)/);
  const js = read('client/components/settings/adminProblems.js');
  assert.match(js, /discardDisabled: t\.busy\.get\(\) \|\| row\.replayable !== false/);
  assert.match(js, /window\.confirm\(TAPi18n\.__\('stuck-sync-operation-discard-confirm'\)\)/);
  assert.match(js, /Meteor\.call\('listSyncStuckDiscard', \{ listId, operationId \}/);
});

test('every interface key used by the section is in the pending key list, outside guarded prefixes', () => {
  // list-sync-* and sync-* keys are pinned by locale suites that require every
  // locale to carry them; these new English strings wait for translation.
  const jade = read('client/components/settings/adminProblems.jade');
  const js = read('client/components/settings/adminProblems.js');
  const section = jade.slice(jade.indexOf('template(name="listSyncStuckOperations")')) +
    js.slice(js.indexOf('const LIST_SYNC_STUCK_REFUSALS'));
  const used = [...section.matchAll(/'(stuck-sync-operation-[a-z-]+)'/g)].map(match => match[1]);
  assert.ok(used.length >= 10, used.join());
  for (const key of used) assert.ok(!key.startsWith('list-sync-') && !key.startsWith('sync-'), key);
  assert.match(js, /stuck-sync-operation-reason-\$\{row\.reason \|\| 'unknown'\}/, 'each reason has its own text');
});
