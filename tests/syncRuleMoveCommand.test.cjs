'use strict';
// Durable rule moves on the card's own board (server/lib/syncRuleMoveCommand.js)
// and move-all (server/lib/syncRuleMoveAllCommand.js).
// Run: node tests/syncRuleMoveCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const M = require('../server/lib/syncRuleMoveCommand');
const MA = require('../server/lib/syncRuleMoveAllCommand');
const { positionChange } = require('../models/lib/timeHistory');
const { DURABLE_RULE_ACTIONS, durableSyncEligibility } = require('../server/lib/listSyncSteps');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

const ROOT = path.join(__dirname, '..');
async function fixture(action) {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', ...action }) });
  f.card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'T', sort: 5, lastMoveReason: 'why' };
  f.context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  f.prepare = over => M.prepareRuleMoveCommand({ ...f.context, card: f.card,
    target: { boardId: 'board', listId: 'list', swimlaneId: 'lane', sort: 1 },
    titles: { listName: 'List', swimlaneName: 'Lane', cardTitle: 'T' }, createdAt: new Date(1000), ...over });
  return f;
}
const resum = row => { const { checksum, ...content } = row; return { ...content, checksum: sha256(canonical(content)) }; };

test('an in-place move changes the sort only: position row and legacy row, no activity', async () => {
  const f = await fixture({ actionType: 'moveCardToTop', listName: '*', swimlaneName: '*' });
  const command = f.prepare();
  assert.deepEqual(M.moveModifier(command), { $set: { sort: 1 } });
  const [row] = command.effects.history.rows;
  const at = { boardId: 'board', swimlaneId: 'lane', listId: 'list', sort: 5, lastMoveReason: 'why' };
  const hook = positionChange(at, { ...at, sort: 1 }, ['sort']);
  assert.deepEqual([row.group, row.previousContent, row.newContent], [hook.group, hook.previousContent, hook.newContent]);
  assert.equal(command.effects.move, null, 'an in-place move is not a moveCard');
  assert.equal(command.after.lastMoveReason, 'why', 'the reason stays when the list does');
  assert.equal(command.effects.userPosition._id, M.legacyIdFor(command._id));
  assert.deepEqual(M.validateRuleMoveCommand(command, f.context), command);
  // Nothing changes: nothing is written, as Card.move returns early.
  assert.deepEqual(f.prepare({ target: { boardId: 'board', listId: 'list', swimlaneId: 'lane', sort: 5 } }).effects,
    { history: null, userPosition: null, move: null });
});

test('a move to another list is Card.move\'s: the reason reset, the moveCard activity, the hook\'s row', async () => {
  const f = await fixture({ actionType: 'moveCardToBottom', listName: 'Done', swimlaneName: 'Other' });
  const command = f.prepare({ target: { boardId: 'board', listId: 'done', swimlaneId: 'other', sort: 9 },
    titles: { listName: 'Done', swimlaneName: 'Other', cardTitle: 'T' } });
  assert.deepEqual(M.moveModifier(command), { $set: { listId: 'done', lastMoveReason: '', swimlaneId: 'other', sort: 9 } });
  const activity = command.effects.move.activity;
  assert.deepEqual([activity.activityType, activity.oldListId, activity.listId, activity.oldSwimlaneId, activity.swimlaneId,
    activity.listName, activity.moveReason], ['moveCard', 'list', 'done', 'lane', 'other', 'Done', '']);
  assert.deepEqual(command.effects.history.rows[0].newContent, { boardId: 'board', swimlaneId: 'other', listId: 'done',
    sort: 9, lastMoveReason: '' });
  assert.deepEqual(M.validateRuleMoveCommand(command, f.context), command);
  // A swimlane-only move keeps the reason (Card.move resets it for a list change only).
  const lane = f.prepare({ target: { boardId: 'board', listId: 'list', swimlaneId: 'other', sort: 5 } });
  assert.equal(lane.after.lastMoveReason, 'why');
  assert.equal(lane.effects.move.activity.activityType, 'moveCard');
});

test('negative: another board, a tampered place, reason or activity are refused', async () => {
  const f = await fixture({ actionType: 'moveCardToTop', listName: 'Done', swimlaneName: '*' });
  assert.throws(() => f.prepare({ target: { boardId: 'other', listId: 'x', swimlaneId: 'y', sort: 1 } }), /elsewhere/);
  const elsewhere = await fixture({ actionType: 'moveCardToTop', listName: 'Done', swimlaneName: '*', boardId: 'other' });
  assert.throws(() => elsewhere.prepare(), /invalid/);
  const command = f.prepare({ target: { boardId: 'board', listId: 'done', swimlaneId: 'lane', sort: 2 } });
  assert.throws(() => M.validateRuleMoveCommand(resum({ ...command, after: { ...command.after, listId: 'x' } }), f.context),
    /command-invalid/);
  assert.throws(() => M.validateRuleMoveCommand(resum({ ...command, after: { ...command.after, lastMoveReason: 'kept' } }),
    f.context), /command-invalid/);
  const forged = resum({ ...command, effects: { ...command.effects, move: { ...command.effects.move,
    activity: { ...command.effects.move.activity, userId: 'someone-else' } } } });
  assert.throws(() => M.validateRuleMoveCommand(forged, f.context), /command-invalid/);
});

test('move-all: each card of the list is a unit with its own move\'s effects', async () => {
  const f = await fixture({ actionType: 'moveAllCardsInList', fromListName: 'Doing', listName: 'Done' });
  const cards = [
    { _id: 'card', boardId: 'board', listId: 'doing', swimlaneId: 'lane', sort: 2, title: 'T' },
    { _id: 'c2', boardId: 'board', listId: 'doing', swimlaneId: 'lane2', sort: 4, title: 'U', lastMoveReason: 'x' },
  ];
  const command = MA.prepareRuleMoveAllCommand({ ...f.context, from: { _id: 'doing', title: 'Doing' },
    to: { _id: 'done', title: 'Done' }, cards, swimlaneTitles: { lane: 'Lane', lane2: 'Lane 2' }, createdAt: new Date(1000) });
  assert.deepEqual(command.units.map(u => [u.cardId, u.after.listId, u.after.swimlaneId, u.after.sort, u.after.lastMoveReason]),
    [['card', 'done', 'lane', 2, ''], ['c2', 'done', 'lane2', 4, '']]);
  assert.deepEqual(command.units.map(u => u.effects.move.activity.swimlaneName), ['Lane', 'Lane 2']);
  assert.notEqual(command.units[0].effects.move.receiptId, command.units[1].effects.move.receiptId);
  assert.deepEqual(MA.validateRuleMoveAllCommand(command, f.context), command);
  // No list to move from or to: nothing, as the ordinary action.
  assert.deepEqual(MA.prepareRuleMoveAllCommand({ ...f.context, from: null, to: { _id: 'done' }, createdAt: new Date(1) }).units, []);
  // Negative: a card from another list, or a tampered unit, is refused.
  assert.throws(() => MA.prepareRuleMoveAllCommand({ ...f.context, from: { _id: 'doing' }, to: { _id: 'done' },
    cards: [{ ...cards[0], listId: 'elsewhere' }], createdAt: new Date(1) }), /invalid/);
  assert.throws(() => MA.validateRuleMoveAllCommand(resum({ ...command,
    units: [{ ...command.units[0], after: { ...command.units[0].after, sort: 99 } }] }), f.context), /command-invalid/);
});

test('eligibility and wiring: same-board moves are durable; the guard follows only this plan\'s saved moves', () => {
  const type = action => M.durableRuleActionType(action, 'board');
  assert.equal(type({ actionType: 'moveCardToTop', listName: 'Done', swimlaneName: 'Other' }), 'moveCardToTop');
  assert.equal(type({ actionType: 'moveCardToTop', boardId: 'other' }), 'moveCardToTop:elsewhere');
  assert.equal(type({ actionType: 'moveAllCardsInList' }), 'moveAllCardsInList');
  assert.equal(type({ actionType: 'moveAllCardsInList', boardId: 'other' }), 'moveAllCardsInList:elsewhere');
  for (const action of [...M.RULE_MOVE_ACTIONS, 'moveAllCardsInList']) assert.ok(DURABLE_RULE_ACTIONS.has(action), action);
  const base = { list: { syncRevision: 'r', syncCredentialIncarnation: 'i' }, board: { syncEffectsEnabled: true },
    trigger: 'manual', actorId: 'actor', flags: {} };
  assert.deepEqual(durableSyncEligibility({ ...base, ruleActionTypes: ['moveCardToTop:elsewhere'] }),
    { eligible: false, reason: 'rule-actions' });
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  // The guard: the activity's list, or where a saved move of THIS plan put the card - nowhere else.
  // Since moves to another board (syncRuleMoveBoardCommand.js) the card is
  // looked up by id: on the activity's board and list, or where a saved move
  // of this plan put it.
  assert.match(plans, /const card = found && \(\(found\.boardId === saved\.boardId && found\.listId === saved\.listId\) \|\|\s*await movedByThisPlan\(rulePlanId\(effectId, saved\._id\), saved\.cardId, found\)\) \? found : null;/);
  assert.match(plans, /SyncRuleMoveCommands\.rawCollection\(\)\.findOne\(\{ planId: planIdValue, cardId,\s*'after\.listId': card\.listId, 'after\.swimlaneId': card\.swimlaneId \}/);
  assert.ok(!/Cards\.findOneAsync\(\{ _id: saved\.cardId, boardId: saved\.boardId, listId: saved\.listId \}\)/.test(plans),
    'no second guard that still pins the list (negative)');
  // One target for both paths.
  const rules = fs.readFileSync(path.join(ROOT, 'server/rulesHelper.js'), 'utf8');
  assert.match(rules, /const target = await this\.moveCardTarget\(activity, card, action\);/);
  assert.match(plans, /RulesHelper\.moveCardTarget\(context\.saved, card, action\)/);
  // The moveCard hook is deferred only for a scope that names the move.
  assert.match(fs.readFileSync(path.join(ROOT, 'server/models/cards.js'), 'utf8'),
    /if \(deferSyncRecording\('move', doc\)\) return;\s*await cardMove\(/);
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

// An activity's notifications and webhooks are delivered after its rules ran,
// so a rule that moved the card must not make them refuse it - in a normal run
// or a replay (2026-10-02).
test('delivery stages find the card where the activity\'s own rules moved it, and nowhere else', () => {
  const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
  const plans = read('server/notifications/storedRulePlans.js');
  assert.match(plans, /export async function activityCardNow\(saved\) \{\n  const card = await Cards\.findOneAsync\(\{ _id: saved\.cardId \}\);\n  if \(!card\) return null;\n[\s\S]{0,120}if \(card\.boardId === saved\.boardId && \(saved\.listId === undefined \|\| card\.listId === saved\.listId\)\) return card;/);
  assert.match(plans, /find\(\{ 'plan\.activityId': saved\._id \}[\s\S]{0,200}movedByThisPlan\(_id, saved\.cardId, card\)/);
  for (const file of ['server/notifications/storedDelivery.js', 'server/notifications/storedWebhooks.js']) {
    const src = read(file);
    assert.match(src, /require\('\.\/storedRulePlans'\)\.activityCardNow\(saved\)/, file);
    // Negative: no stage still pins the card to the activity's list.
    assert.ok(!/Cards\.findOneAsync\(\{ _id: saved\.cardId, boardId: saved\.boardId, listId: saved\.listId \}\)/.test(src), file);
  }
  for (const file of ['server/notifications/prepareDelivery.js', 'server/notifications/prepareWebhooks.js']) {
    const src = read(file);
    assert.match(src, /\(saved\.listId \? await moved\(\) : !!context\.card && context\.card\.boardId !== saved\.boardId\)/, file);
    assert.ok(!/context\.card\.listId !== saved\.listId\)\)\)/.test(src), file);
  }
});
