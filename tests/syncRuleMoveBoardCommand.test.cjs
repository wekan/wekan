'use strict';
// Durable rule moves to another board (server/lib/syncRuleMoveBoardCommand.js).
// Server test: server/lib/tests/storedRuleMoveBoard.tests.js.
// Run: node tests/syncRuleMoveBoardCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const M = require('../server/lib/syncRuleMoveBoardCommand');
const { durableRuleActionTypes, finalActionIds, CROSS_BOARD_FINAL_ACTIONS } = require('../server/lib/listSyncSteps');
const { durableRuleActionType } = require('../server/lib/syncRuleMoveCommand');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

const ROOT = path.join(__dirname, '..');
async function fixture(actions = [{ _id: 'move', boardId: 'to', actionType: 'moveCardToBottom', listName: 'Inbox' }]) {
  const f = { activity: { _id: 'activity', boardId: 'from', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: actions.length - 1, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'from', triggerId: 't', actionId: actions[0]._id,
      extraActionIds: actions.slice(1).map(a => a._id) }],
    readAction: async id => actions.find(a => a._id === id) });
  f.context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: f.index };
  f.card = { _id: 'card', boardId: 'from', listId: 'list', swimlaneId: 'lane', sort: 4, lastMoveReason: 'why',
    labelIds: ['urgent-from', 'local-from'], members: ['actor', 'stranger'], cardNumber: 3,
    customFields: [{ _id: 'cf-from', value: 1 }], cardDependencies: [{ cardId: 'x', type: 'blocks' }] };
  f.prepare = over => M.prepareRuleMoveBoardCommand({ ...f.context, card: f.card,
    target: { boardId: 'to', listId: 'inbox', swimlaneId: 'to-lane', sort: 9 },
    mapped: { labelIds: ['urgent-to'], cardNumber: 41, customFields: [{ _id: 'cf-to', value: 1 }] },
    allowedMemberIds: ['actor'], titles: { boardName: 'To', oldBoardName: 'From', swimlaneName: 'Lane' },
    labelActivities: [{ _id: 'a1', labelId: 'urgent-from' }, { _id: 'a2', labelId: 'local-from' }],
    createdAt: new Date(1000), ...over });
  return f;
}
const resum = row => { const { checksum, ...content } = row; return { ...content, checksum: sha256(canonical(content)) }; };

test('the move is Card.move\'s: mapped fields, every hook record planned once', async () => {
  const f = await fixture();
  const command = f.prepare();
  assert.deepEqual(M.moveModifier(command), { $set: { boardId: 'to', swimlaneId: 'to-lane', listId: 'inbox', sort: 9,
    lastMoveReason: '', labelIds: ['urgent-to'], cardNumber: 41, customFields: [{ _id: 'cf-to', value: 1 }],
    cardDependencies: [], members: ['actor'] } });
  const [position, fields] = command.effects.history;
  assert.deepEqual([position.boardId, position.rows.map(r => r.group)], ['to', ['position']]);
  assert.deepEqual(fields.rows.map(r => r.group).sort(), ['customFields', 'dependencies', 'labels', 'members']);
  assert.deepEqual([command.effects.move.activityType, command.effects.move.boardId, command.effects.move.oldBoardId],
    ['moveCardBoard', 'to', 'from']);
  assert.deepEqual(command.effects.customFields.map(r => [r.activity.activityType, r.activity.customFieldId]),
    [['unsetCustomField', 'cf-from'], ['setCustomField', 'cf-to']]);
  assert.deepEqual(command.effects.labelActivities, [{ _id: 'a1', labelId: 'urgent-to', boardId: 'to' },
    { _id: 'a2', remove: true }], 'by position, as updateActivities does');
  assert.deepEqual([command.effects.userPosition.boardId, command.effects.userPosition.newBoardId], ['from', 'to']);
  assert.deepEqual(M.validateRuleMoveBoardCommand(command, f.context), command);
  // Watchers and members are written only when someone is dropped.
  assert.ok(!Object.hasOwn(f.prepare({ allowedMemberIds: ['actor', 'stranger'] }).after.fields, 'watchers'));
  assert.deepEqual(M.afterSelector(command), { _id: 'card', boardId: 'to', listId: 'inbox', swimlaneId: 'to-lane',
    sort: { $eq: 9 }, cardNumber: 41 });
  assert.deepEqual(M.beforeSelector(command).watchers, { $exists: false }, 'an absent field matches only an absent one');
});

test('negative: not the plan\'s last action, the own board, tampering', async () => {
  const later = await fixture([{ _id: 'move', boardId: 'to', actionType: 'moveCardToTop' },
    { _id: 'color', boardId: 'from', actionType: 'setColor', selectedColor: 'green' }]);
  assert.throws(() => M.prepareRuleMoveBoardCommand({ ...later.context, index: 0 }), /not-last/);
  const own = await fixture([{ _id: 'move', boardId: 'from', actionType: 'moveCardToTop' }]);
  assert.throws(() => own.prepare(), /invalid/);
  const f = await fixture();
  assert.throws(() => f.prepare({ target: { boardId: 'from', listId: 'l', swimlaneId: 's', sort: 1 } }), /invalid/);
  const command = f.prepare();
  for (const tampered of [{ after: { ...command.after, fields: { ...command.after.fields, cardDependencies: ['x'] } } },
    { after: { ...command.after, place: { ...command.after.place, boardId: 'elsewhere' } } },
    { effects: { ...command.effects, labelActivities: [] } }]) {
    assert.throws(() => M.validateRuleMoveBoardCommand(resum({ ...command, ...tampered }), f.context), /command-invalid/);
  }
});

test('eligibility lifts a move elsewhere only when it ends every plan it is in', async () => {
  assert.deepEqual([...CROSS_BOARD_FINAL_ACTIONS], ['moveCardToTop', 'moveCardToBottom']);
  assert.deepEqual([...finalActionIds([{ actionIds: ['a', 'b'], activityType: 'createCard' },
    { actionIds: ['c'], activityType: 'moveCard' }, { actionIds: ['d'], activityType: 'moveCard' },
    { actionIds: ['e'], activityType: null }])], ['b'], 'last of a rule whose trigger type is its own');
  assert.deepEqual([...finalActionIds([{ actionIds: ['m'], activityType: 'createCard' },
    { actionIds: ['m', 'x'], activityType: 'joinMember' }])], ['x'], 'an action that is not last in another rule is not final');
  const boards = { to: { _id: 'to', syncEffectsEnabled: true }, off: { _id: 'off', syncEffectsEnabled: false } };
  const run = actions => durableRuleActionTypes({ boardId: 'from', typeOf: durableRuleActionType,
    readActions: async id => (id === 'from' ? actions : []), readBoard: async id => boards[id] ?? null });
  assert.deepEqual(await run([{ actionType: 'moveCardToTop', boardId: 'to', finalInPlan: true }]), ['moveCardToTop']);
  assert.deepEqual(await run([{ actionType: 'moveCardToTop', boardId: 'to', finalInPlan: false }]), ['moveCardToTop:elsewhere']);
  assert.deepEqual(await run([{ actionType: 'moveCardToTop', boardId: 'off', finalInPlan: true }]), ['moveCardToTop:elsewhere']);
  assert.deepEqual(await run([{ actionType: 'moveAllCardsInList', boardId: 'to', finalInPlan: true }]),
    ['moveAllCardsInList:elsewhere'], 'moving a whole list elsewhere is not built');
});

test('wiring: the runner, the guard and the deferred hooks', () => {
  const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
  const plans = read('server/notifications/storedRulePlans.js');
  assert.match(plans, /\(isOtherBoardMove\(invocation\.action, plan\.boardId\) \? runStoredSyncRuleMoveBoard : runStoredSyncRuleMove\)\(/);
  assert.match(plans, /kinds: \['history', 'position', 'boardMove', 'move', 'customFields', 'labelActivities'\], fromBoardId: command\.boardId/);
  assert.match(plans, /await assertDestinationBoard\(action\.boardId, plan, options\.trigger\);/);
  assert.match(plans, /SyncRuleMoveBoardCommands\.rawCollection\(\)\.findOne\(\{ planId: planIdValue, cardId,\s*'after\.place\.boardId': card\.boardId/);
  assert.match(plans, /\(found\.boardId === saved\.boardId && found\.listId === saved\.listId\) \|\|/);
  // Delivery judges recipients where the activity happened: a card its own
  // rules moved is placed back on the activity's board and list for that.
  assert.match(plans, /if \(await movedByThisPlan\(_id, saved\.cardId, card\)\) \{\n\s*return Object\.assign\(Object\.create\(Object\.getPrototypeOf\(card\)\), card,\n\s*\{ boardId: saved\.boardId, listId: saved\.listId \}\);/);
  assert.match(read('server/models/cards.js'), /if \(!deferSyncLabelActivities\(doc\)\) await updateActivities\(/);
  const app = read('server/lib/listSyncApplication.js');
  assert.match(app, /return actions\.map\(action => \(\{ \.\.\.action, finalInPlan: final\.has\(action\._id\) \}\)\);/);
  // The scope: the label-activity slot needs the board left, and only it.
  const { withSyncRecordingDeferred, deferSyncLabelActivities } = require('../server/lib/syncRecordingScope');
  const scope = { cardId: 'card', boardId: 'to', listId: 'inbox' };
  assert.rejects(() => withSyncRecordingDeferred({ ...scope, kinds: ['labelActivities'] }, async () => {}),
    /scope-invalid/);
  return withSyncRecordingDeferred({ ...scope, kinds: ['labelActivities'], fromBoardId: 'from' }, async () => {
    assert.equal(deferSyncLabelActivities({ _id: 'card', boardId: 'to' }), false, 'not the board left');
    assert.equal(deferSyncLabelActivities({ _id: 'card', boardId: 'from' }), true);
    assert.equal(deferSyncLabelActivities({ _id: 'card', boardId: 'from' }), false, 'one slot');
  });
});
