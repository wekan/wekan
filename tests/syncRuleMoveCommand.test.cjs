'use strict';
// Durable rule moves that stay in place (server/lib/syncRuleMoveCommand.js).
// Run: node tests/syncRuleMoveCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const M = require('../server/lib/syncRuleMoveCommand');
const { positionChange } = require('../models/lib/timeHistory');
const { DURABLE_RULE_ACTIONS, durableSyncEligibility } = require('../server/lib/listSyncSteps');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

const ROOT = path.join(__dirname, '..');
const inPlace = { listName: '*', swimlaneName: '*', boardId: 'board' };
async function fixture(action) {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', ...action }) });
  f.card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'T', sort: 5 };
  f.context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  f.prepare = over => M.prepareRuleMoveCommand({ ...f.context, card: f.card, sorts: [2, 5, 9, Infinity, NaN],
    createdAt: new Date(1000), ...over });
  return f;
}

test('the sort is the ordinary action\'s: one past the destination\'s finite bound, 0 when it has none', async () => {
  const top = (await fixture({ actionType: 'moveCardToTop', ...inPlace })).prepare();
  assert.deepEqual([top.bound, top.before.sort, top.after.sort], [2, 5, 1]);
  const bottom = (await fixture({ actionType: 'moveCardToBottom', ...inPlace })).prepare();
  assert.deepEqual([bottom.bound, bottom.after.sort], [9, 10]);
  const empty = (await fixture({ actionType: 'moveCardToTop', ...inPlace })).prepare({ sorts: [] });
  assert.deepEqual([empty.bound, empty.after.sort], [null, -1]);
  // An unset listName means the card's own list (#6472).
  const unset = (await fixture({ actionType: 'moveCardToBottom', swimlaneName: '*', boardId: 'board' })).prepare();
  assert.equal(unset.after.sort, 10);
});

test('the effects are the hook\'s position row and trackChange\'s legacy row, and nothing else', async () => {
  const f = await fixture({ actionType: 'moveCardToTop', ...inPlace });
  const command = f.prepare();
  const [row] = command.effects.history.rows;
  assert.equal(command.effects.history.rows.length, 1);
  // Exactly what the hook writes for the same update.
  const at = { boardId: 'board', swimlaneId: 'lane', listId: 'list', sort: 5, lastMoveReason: '' };
  const hook = positionChange(at, { ...at, sort: 1 }, ['sort']);
  assert.deepEqual([row.group, row.changeType, row.previousContent, row.newContent],
    [hook.group, hook.changeType, hook.previousContent, hook.newContent]);
  assert.equal(row.entityId, 'card');
  const legacy = command.effects.userPosition;
  assert.deepEqual([legacy.userId, legacy.boardId, legacy.entityType, legacy.entityId, legacy.actionType],
    ['actor', 'board', 'card', 'card', 'move']);
  assert.deepEqual([legacy.previousSort, legacy.newSort, legacy.newListId, legacy.newSwimlaneId], [5, 1, 'list', 'lane']);
  assert.equal(legacy._id, M.legacyIdFor(command._id), 'a deterministic id is its own receipt');
  assert.deepEqual(M.validateRuleMoveCommand(command, f.context), command);
  // Already in place: nothing to write, nothing to record.
  const same = f.prepare({ sorts: [6], card: { ...f.card, sort: 5 } });
  assert.equal(same.after.sort, 5);
  assert.deepEqual(same.effects, { history: null, userPosition: null });
});

test('negative: moves elsewhere are not this command\'s, and a tampered command is refused', async () => {
  for (const action of [{ listName: 'Done', swimlaneName: '*', boardId: 'board' },
    { listName: '*', swimlaneName: 'Other', boardId: 'board' },
    { listName: '*', swimlaneName: '*', boardId: 'another-board' }]) {
    const f = await fixture({ actionType: 'moveCardToTop', ...action });
    assert.throws(() => f.prepare(), /sync-rule-move-invalid/, JSON.stringify(action));
  }
  const f = await fixture({ actionType: 'moveCardToTop', ...inPlace });
  const command = f.prepare();
  const resum = row => { const { checksum, ...content } = row; return { ...content, checksum: sha256(canonical(content)) }; };
  assert.throws(() => M.validateRuleMoveCommand(resum({ ...command, after: { sort: 100 } }), f.context), /command-invalid/);
  assert.throws(() => M.validateRuleMoveCommand(resum({ ...command, bound: 0 }), f.context), /command-invalid/);
  assert.throws(() => M.validateRuleMoveCommand({ ...command, listId: 'other' }, f.context), /command-invalid/);
  const forged = resum({ ...command, effects: { ...command.effects,
    userPosition: { ...command.effects.userPosition, userId: 'someone-else' } } });
  assert.throws(() => M.validateRuleMoveCommand(forged, f.context), /command-invalid/);
  assert.throws(() => f.prepare({ card: { ...f.card, boardId: 'other' } }), /card-invalid/);
  // A card with no sort is captured as null and matched as missing-or-null.
  const unsorted = f.prepare({ card: { ...f.card, sort: undefined } });
  assert.equal(unsorted.before.sort, null);
  assert.equal(M.sortSelector(unsorted, null).sort, null);
  assert.deepEqual(M.sortSelector(command, 5).sort, { $eq: 5 });
});

test('eligibility: in-place moves are durable, any other move keeps direct Sync', () => {
  const type = action => M.durableRuleActionType(action, 'board');
  assert.equal(type({ actionType: 'moveCardToTop', ...inPlace }), 'moveCardToTop');
  assert.equal(type({ actionType: 'moveCardToBottom', swimlaneName: '*' }), 'moveCardToBottom');
  assert.equal(type({ actionType: 'moveCardToTop', listName: 'Done', swimlaneName: '*' }), 'moveCardToTop:elsewhere');
  assert.equal(type({ actionType: 'setColor' }), 'setColor');
  const base = { list: { syncRevision: 'r', syncCredentialIncarnation: 'i' }, board: { syncEffectsEnabled: true },
    trigger: 'manual', actorId: 'actor', flags: {} };
  assert.deepEqual(durableSyncEligibility({ ...base, ruleActionTypes: [type({ actionType: 'moveCardToTop', ...inPlace })] }),
    { eligible: true, reason: null });
  assert.deepEqual(durableSyncEligibility({ ...base,
    ruleActionTypes: [type({ actionType: 'moveCardToTop', listName: 'Done', swimlaneName: '*' })] }),
  { eligible: false, reason: 'rule-actions' });
  // Every durable type has a runner, and every move type is checked by place.
  for (const action of M.RULE_MOVE_ACTIONS) assert.ok(DURABLE_RULE_ACTIONS.has(action));
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  assert.match(plans, /RULE_MOVE_ACTIONS\.map\(type => \[type, \(\{ invocation \}\) =>\s*runStoredSyncRuleMove/);
  const application = fs.readFileSync(path.join(ROOT, 'server/lib/listSyncApplication.js'), 'utf8');
  assert.match(application, /actions\.map\(action => durableRuleActionType\(action, list\.boardId\)\)/);
  assert.ok(!/actions\.map\(action => action\.actionType\)/.test(application), 'no eligibility by type alone');
});

test('negative: only a scope that names the move defers the hook\'s position row', () => {
  const { withSyncRecordingDeferred, deferSyncRecording } = require('../server/lib/syncRecordingScope');
  const doc = { _id: 'card', boardId: 'board', listId: 'list' };
  return Promise.all([
    withSyncRecordingDeferred({ cardId: 'card', boardId: 'board', listId: 'list', kinds: ['history'] },
      async () => assert.equal(deferSyncRecording('history', doc, ['position']), false, 'ordinary Sync keeps it')),
    withSyncRecordingDeferred({ cardId: 'card', boardId: 'board', listId: 'list', kinds: ['history', 'position'] },
      async () => assert.equal(deferSyncRecording('history', doc, ['position']), true)),
  ]);
});
