'use strict';
// Decided 2026-11-18 (TODO.md): List Sync's journaled rule replay skips an
// action into a list that refusing the actor's role (#4527), as the ordinary
// engine does (tests/listLockRules.test.cjs). The skip is decided once, before
// the action saves its command, and saved durably, so a replay never re-decides
// and a half-finished action is never skipped.
// Run: node --test tests/listSyncRuleListSkip.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');
const { exceptionFor } = require('../models/lib/listPermissions');

const src = fs.readFileSync(path.join(__dirname, '..', 'server/notifications/storedRulePlans.js'), 'utf8');
const board = { _id: 'b', permission: 'private',
  members: [{ userId: 'owner', isActive: true, isAdmin: true }, { userId: 'member', isActive: true }] };
const lists = { locked: { _id: 'locked', boardId: 'b', roleExceptions: { normal: { write: false } } }, open: { _id: 'open', boardId: 'b' } };

function loadSkipper({ records, rows, duplicate = false }) {
  const start = src.indexOf('const listSkipId =');
  const body = src.slice(start, src.indexOf('\n}\n', src.indexOf('function listSkipper(')) + 2);
  const collection = { rawCollection: () => ({
    findOne: async q => rows.get(q._id) || null,
    insertOne: async doc => {
      if (rows.has(doc._id) || duplicate) { rows.set(doc._id, rows.get(doc._id) || doc); const e = new Error('dup'); e.code = 11000; throw e; }
      rows.set(doc._id, doc);
    },
  }) };
  const req = name => {
    if (name === '/server/lib/listPermissionGate') {
      return { listException: async (u, b, id, c) => (lists[id] && lists[id].boardId === b._id ? exceptionFor(b, lists[id], u, c) : undefined) };
    }
    if (name === '/server/lib/securityLog') return { record: e => records.push(e) };
    throw new Error(name);
  };
  // eslint-disable-next-line no-new-func
  return new Function('require', 'sha256', 'canonical', 'SyncRuleListSkips', `${body}\nreturn listSkipper;`)(req, sha256, canonical, collection);
}
const invocation = { id: 'inv1', action: { actionType: 'moveCardToTop' } };
const guard = async () => {};

test('a refusing list skips the action once, durably, and shows in Problems', async () => {
  const records = [], rows = new Map();
  const skip = loadSkipper({ records, rows })({ plan: { actorId: 'member' }, invocation, guard });
  assert.strictEqual(await skip.recorded(), false);
  assert.strictEqual(await skip.when(board, ['open', 'locked']), true);
  assert.strictEqual(await skip.recorded(), true);
  const [saved] = rows.values();
  assert.deepStrictEqual([saved.invocationId, saved.listId, saved.actionType], ['inv1', 'locked', 'moveCardToTop']);
  assert.deepStrictEqual(records.map(r => [r.key, r.action, r.source]), [['authz.rule-list-locked', 'detected', 'sync-rule:moveCardToTop']]);
  // A replay that raced the same insert reads the saved skip back.
  const again = loadSkipper({ records, rows, duplicate: true })({ plan: { actorId: 'member' }, invocation, guard });
  assert.strictEqual(await again.when(board, ['locked']), true);
});

test('negative: an open list, the board admin and no list do not skip', async () => {
  const records = [], rows = new Map();
  const member = loadSkipper({ records, rows })({ plan: { actorId: 'member' }, invocation, guard });
  assert.strictEqual(await member.when(board, ['open', null, undefined]), false);
  const admin = loadSkipper({ records, rows })({ plan: { actorId: 'owner' }, invocation, guard });
  assert.strictEqual(await admin.when(board, ['locked']), false);
  assert.strictEqual(rows.size, 0);
  assert.deepStrictEqual(records, []);
});

test('every list-writing runner checks a saved skip first and decides before saving its command', () => {
  const runner = name => src.slice(src.indexOf(`export async function ${name}(`), src.indexOf('\nexport async function', src.indexOf(`export async function ${name}(`) + 10));
  for (const name of ['runStoredSyncRuleMove', 'runStoredSyncRuleMoveBoard', 'runStoredSyncRuleMoveAll', 'runStoredSyncRuleMoveAllBoard',
    'runStoredSyncRuleCopyCard', 'runStoredSyncRuleLinkCard', 'runStoredSyncRuleCreateCard', 'runStoredSyncRuleSortList']) {
    const body = runner(name);
    const recorded = body.indexOf('await skip.recorded()'), find = body.indexOf('await commands.findOne({ _id: id })');
    assert.ok(recorded > 0 && recorded < find, `${name}: a saved skip is read before a saved command`);
    const decide = name === 'runStoredSyncRuleMoveBoard' ? body.indexOf('skip });') : body.indexOf('skip.when(');
    assert.ok(decide > find && decide < body.indexOf('await commands.insertOne(candidate)'), `${name}: decided before the command is saved`);
  }
  const archive = runner('runStoredSyncRuleArchive');
  assert.ok(archive.indexOf('skip.recorded()') < archive.indexOf('SyncRuleArchiveCommands.rawCollection().findOne'));
  assert.ok(archive.indexOf('if (!existing) {') < archive.indexOf('skip.when(') && archive.indexOf('skip.when(') < archive.indexOf('captureArchive('));
  const capture = src.slice(src.indexOf('async function captureRuleMoveBoard('), src.indexOf('async function boardMoveInputs('));
  assert.ok(capture.indexOf('skip.when(') < capture.indexOf('return prepareRuleMoveBoardCommand('));
});
