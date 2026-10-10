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

test('a move with later actions is prepared (they follow the card); negative: the own board, tampering', async () => {
  const later = await fixture([{ _id: 'move', boardId: 'to', actionType: 'moveCardToTop' },
    { _id: 'color', boardId: 'from', actionType: 'setColor', selectedColor: 'green' }]);
  // Since 2026-10-03 the later actions follow the card to its new board.
  assert.equal(M.prepareRuleMoveBoardCommand({ ...later.context, index: 0, card: later.card,
    target: { boardId: 'to', listId: 'inbox', swimlaneId: 'to-lane', sort: 9 },
    mapped: { labelIds: [], cardNumber: 1, customFields: [] }, allowedMemberIds: [],
    titles: { boardName: 'To', oldBoardName: 'From', swimlaneName: 'Lane' }, createdAt: new Date(1) }).targetBoardId, 'to');
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
  assert.deepEqual([...CROSS_BOARD_FINAL_ACTIONS], ['moveCardToTop', 'moveCardToBottom', 'moveAllCardsInList']);
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
    ['moveAllCardsInList']);
  assert.deepEqual(await run([{ actionType: 'moveAllCardsInList', boardId: 'to', finalInPlan: false }]),
    ['moveAllCardsInList:elsewhere']);
});

test('wiring: the runner, the guard and the deferred hooks', () => {
  const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
  const plans = read('server/notifications/storedRulePlans.js');
  assert.match(plans, /\(isOtherBoardMove\(invocation\.action, plan\.boardId\) \? runStoredSyncRuleMoveBoard : runStoredSyncRuleMove\)\(/);
  // The board the card left is the saved move's own: the plan's, or an
  // earlier move's when a move follows a move to another board (2026-10-03).
  assert.match(plans, /kinds: \['history', 'position', 'boardMove', 'move', 'customFields', 'labelActivities'\], fromBoardId: command\.before\.place\.boardId/);
  assert.match(plans, /await assertDestinationBoard\(action\.boardId, plan, options\.trigger\);/);
  assert.match(plans, /SyncRuleMoveBoardCommands\.rawCollection\(\)\.findOne\(\{ planId: planIdValue, cardId,\s*'after\.place\.boardId': card\.boardId/);
  assert.match(plans, /\(found\.boardId === saved\.boardId && found\.listId === saved\.listId\) \|\|/);
  // Delivery judges recipients where the activity happened: a card its own
  // rules moved is placed back on the activity's board and list for that.
  assert.match(plans, /if \(await movedByThisPlan\(_id, saved\.cardId, card\)\) \{\n\s*return Object\.assign\(Object\.create\(Object\.getPrototypeOf\(card\)\), card,\n\s*\{ boardId: saved\.boardId, listId: saved\.listId \}\);/);
  assert.match(read('server/models/cards.js'), /if \(!deferSyncLabelActivities\(doc\)\) await updateActivities\(/);
  const app = read('server/lib/listSyncApplication.js');
  assert.match(app, /return actions\.map\(action => \(\{ \.\.\.action, crossBoardMovable: movable\.has\(action\._id\) \}\)\);/);
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

test('move-all onto another board: one whole move per card, each keeping its sort', async () => {
  const action = { _id: 'all', boardId: 'to', actionType: 'moveAllCardsInList', fromListName: 'Doing', listName: 'Done' };
  const f = await fixture([action]);
  const move = (card, number) => ({ card, mapped: { labelIds: [], cardNumber: number, customFields: [] },
    target: { boardId: 'to', listId: 'done', swimlaneId: 'default-lane', sort: null }, allowedMemberIds: ['actor'],
    titles: { boardName: 'To', oldBoardName: 'From', swimlaneName: 'Default' } });
  const other = { _id: 'other', boardId: 'from', listId: 'list', swimlaneId: 'lane', sort: 7 };
  const command = M.prepareRuleMoveAllBoardCommand({ ...f.context, moves: [move(f.card, 41), move(other, 42)],
    createdAt: new Date(1000) });
  assert.equal(command._id, M.moveAllCommandId(f.plan.actions[0].id));
  assert.deepEqual(command.units.map(u => [u.cardId, u.after.place.boardId, u.after.place.sort, u.after.fields.cardNumber]),
    [['card', 'to', 4, 41], ['other', 'to', 7, 42]], 'its own sort, that board\'s numbers');
  assert.notEqual(command.units[0].effects.move._id, command.units[1].effects.move._id);
  const unit = M.unitMove(command, command.units[1]);
  assert.ok(!Object.hasOwn(M.moveModifier(unit).$set, 'sort') || M.moveModifier(unit).$set.sort === 7);
  assert.deepEqual(M.validateRuleMoveAllBoardCommand(command, f.context), command);
  // Negative: a tampered unit, a sort that changed, or not the last action.
  for (const units of [[{ ...command.units[0], after: { ...command.units[0].after,
    place: { ...command.units[0].after.place, sort: 99 } } }], [command.units[0], command.units[0]]]) {
    assert.throws(() => M.validateRuleMoveAllBoardCommand(resum({ ...command, units }), f.context), /command-invalid/);
  }
  const later = await fixture([action, { _id: 'color', boardId: 'from', actionType: 'setColor', selectedColor: 'red' }]);
  assert.deepEqual(M.prepareRuleMoveAllBoardCommand({ ...later.context, index: 0, createdAt: new Date(1) }).units, [],
    'later actions no longer refuse it');
  // No list to move from or to: nothing, as the ordinary action.
  assert.deepEqual(M.prepareRuleMoveAllBoardCommand({ ...f.context, moves: [], createdAt: new Date(1) }).units, []);
});

test('#1759: the labels the new board lacks are created there before the card names them', async () => {
  const f = await fixture();
  const created = { _id: 'local-to', name: 'Local', color: 'blue' };
  const mapped = { labelIds: ['urgent-to', 'local-to'], createLabels: [created], cardNumber: 41,
    customFields: [{ _id: 'cf-to', value: 1 }] };
  const command = f.prepare({ mapped });
  assert.deepEqual(command.createLabels, [created]);
  assert.deepEqual(command.after.fields.labelIds, ['urgent-to', 'local-to']);
  assert.deepEqual(command.effects.labelActivities, [{ _id: 'a1', labelId: 'urgent-to', boardId: 'to' },
    { _id: 'a2', labelId: 'local-to', boardId: 'to' }], 'the second activity follows the created label');
  assert.deepEqual(M.validateRuleMoveBoardCommand(command, f.context), command);
  // Nothing to create: the command keeps its older shape, without the key.
  assert.ok(!Object.hasOwn(f.prepare(), 'createLabels'));
  // Negative: a label to create that the card does not carry, an unnamed one,
  // or an empty list written into a command, is refused.
  assert.throws(() => f.prepare({ mapped: { ...mapped, createLabels: [{ _id: 'stray', name: 'Stray', color: 'red' }] } }),
    /invalid/);
  assert.throws(() => f.prepare({ mapped: { ...mapped, createLabels: [{ ...created, name: '' }] } }), /invalid/);
  assert.throws(() => M.validateRuleMoveBoardCommand(resum({ ...command, createLabels: [] }), f.context), /command-invalid/);
  // Move-all: a unit carries its own labels to create.
  const all = await fixture([{ _id: 'all', boardId: 'to', actionType: 'moveAllCardsInList', fromListName: 'Doing',
    listName: 'Done' }]);
  const unit = { card: all.card, target: { boardId: 'to', listId: 'done', swimlaneId: 'lane-to', sort: null }, mapped,
    allowedMemberIds: ['actor'], titles: { boardName: 'To', oldBoardName: 'From', swimlaneName: 'Lane' } };
  const moveAll = M.prepareRuleMoveAllBoardCommand({ ...all.context, moves: [unit], createdAt: new Date(1) });
  assert.deepEqual(moveAll.units[0].createLabels, [created]);
  // The runner plans with Card.move's own rule, shares a created label with
  // the next card of a move-all, and creates each once before the update.
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  assert.match(plans, /const labels = crossBoardLabelPlan\(fromBoard, raw\.labelIds, toBoard, actorId\);/);
  assert.match(plans, /if \(labels\.create\.length\) toBoard\.labels = \[\.\.\.\(toBoard\.labels \|\| \[\]\), \.\.\.labels\.create\];/);
  assert.match(plans, /await createPlannedLabels\(place\.boardId, command\.createLabels, actor, guard\);\s*await guard\(\);\s*if \(!await raw\.findOne\(ruleMoveBoardAfter\(command\)\)\)/);
  assert.equal((plans.match(/actorId: plan\.actorId \}\)/g) || []).length >= 2, true, 'both captures pass the actor');
});

test('wiring: move-all onto another board has its runner, and the guard follows its units', () => {
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  assert.match(plans, /moveAllCardsInList: \(\{ invocation \}\) => \(isOtherBoardMoveAll\(invocation\.action, plan\.boardId\)\s*\? runStoredSyncRuleMoveAllBoard : runStoredSyncRuleMoveAll\)/);
  assert.match(plans, /SyncRuleMoveAllBoardCommands\.rawCollection\(\)\.findOne\(\{ planId: planIdValue,\s*units: \{ \$elemMatch: \{ cardId, 'after\.place\.boardId': card\.boardId/);
  assert.match(plans, /for \(const unit of command\.units\) await applyRuleMoveBoard\(unitMove\(command, unit\), \{ guard, completeDelivery, options \}\);/);
});

// 2026-10-03: a move to another board may be followed by actions that follow
// the card there - and only by those, in any plan it can be in.
test('followable: only follower-safe actions after it, in its rule and in rules of its trigger type', () => {
  const { followableActionIds, FOLLOWER_SAFE } = require('../server/lib/listSyncSteps');
  // Since the maintainer decision of 2026-10-03, moves, sorting, moving all
  // cards and archiving resolve on the board the card went to, so they may
  // follow a move to another board too, and so may a further move to yet
  // another board, a move-all onto another board among them. Sending email
  // may follow too since the later decision of 2026-10-03: it reads the card
  // where this plan's own move put it (storedRulePlans.js ruleEmailActivity).
  // Anything without a durable adapter still may not.
  for (const type of ['setColor', 'addLabel', 'checkAll', 'addChecklist', 'removeChecklist', 'linkCard', 'createCard',
    'moveCardToTop', 'moveCardToBottom', 'sortList', 'moveAllCardsInList', 'archive', 'unarchive', 'sendEmail',
    'moveCardToTop:elsewhere', 'moveCardToBottom:elsewhere', 'moveAllCardsInList:elsewhere'])
    assert.ok(FOLLOWER_SAFE.has(type), type);
  for (const type of ['addAttachment', 'linkCard:elsewhere', 'copyCard:elsewhere', undefined, null])
    assert.ok(!FOLLOWER_SAFE.has(type), type);
  const types = { m: 'moveCardToTop', c: 'setColor', s: 'sortList', l: 'linkCard', x: 'archive', e: 'linkCard:elsewhere', g: 'sendEmail',
    o: 'moveAllCardsInList:elsewhere', n: 'moveCardToTop:elsewhere' };
  const typeOf = id => types[id];
  assert.deepEqual([...followableActionIds([{ actionIds: ['m', 'c', 'l', 's', 'x'], activityType: 'createCard' }], typeOf)].sort(),
    ['c', 'l', 'm', 's', 'x'], 'colour, link, sorting and archiving may follow it');
  assert.ok(followableActionIds([{ actionIds: ['m', 'g'], activityType: 'createCard' }], typeOf).has('m'), 'an email may');
  assert.ok(!followableActionIds([{ actionIds: ['m', 'e'], activityType: 'createCard' }], typeOf).has('m'),
    'a link onto yet another board may not');
  assert.ok(followableActionIds([{ actionIds: ['m', 'o'], activityType: 'createCard' }], typeOf).has('m'),
    'a move-all onto another board may');
  assert.ok(followableActionIds([{ actionIds: ['m', 'n'], activityType: 'createCard' }], typeOf).has('m'),
    'a further move to yet another board may');
  assert.ok(!followableActionIds([{ actionIds: ['m'], activityType: 'createCard' },
    { actionIds: ['e'], activityType: 'createCard' }], typeOf).has('m'), 'another rule of its trigger type links elsewhere');
  assert.ok(followableActionIds([{ actionIds: ['m'], activityType: 'createCard' },
    { actionIds: ['e'], activityType: 'moveCard' }], typeOf).has('m'), 'a rule of another trigger type never shares its plan');
  assert.ok(!followableActionIds([{ actionIds: ['m'], activityType: 'createCard' },
    { actionIds: ['e'], activityType: null }], typeOf).has('m'), 'an unknown trigger type may share any plan');
});
