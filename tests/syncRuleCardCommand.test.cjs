'use strict';
// Durable rule card-field actions (server/lib/syncRuleCardCommand.js).
// Run: node tests/syncRuleCardCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const C = require('../server/lib/syncRuleCardCommand');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

async function fixture(action) {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', ...action }) });
  f.card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'T', labelIds: ['old'], color: 'red',
    dueComplete: false };
  f.prepare = over => C.prepareRuleCardCommand({ plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0,
    card: f.card, createdAt: new Date(1000), ...over });
  return f;
}

test('each action changes exactly its field, as the ordinary action would', async () => {
  const cases = [
    [{ actionType: 'addLabel', labelId: 'new' }, { labelIds: ['old', 'new'] }],
    [{ actionType: 'addLabel', labelId: 'old' }, { labelIds: ['old'] }],
    [{ actionType: 'removeLabel', labelId: 'old' }, { labelIds: [] }],
    [{ actionType: 'removeAllLabels' }, { labelIds: [] }],
    [{ actionType: 'setColor', selectedColor: 'green' }, { color: 'green' }],
    [{ actionType: 'setColor', selectedColor: 'white' }, { color: null }],
    [{ actionType: 'markCardComplete' }, { dueComplete: true }],
    [{ actionType: 'markCardIncomplete' }, { dueComplete: false }],
  ];
  for (const [action, after] of cases) {
    const f = await fixture(action), command = f.prepare();
    assert.deepEqual(command.after, after, action.actionType);
    assert.equal(command._id, C.commandId(f.plan.actions[0].id));
    assert.deepEqual(C.validateRuleCardCommand(command, { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 }), command);
  }
});

test('History records the changed field; label activities only when the label really changed', async () => {
  const added = (await fixture({ actionType: 'addLabel', labelId: 'new' })).prepare();
  assert.deepEqual(added.effects.history.rows.map(row => [row.group, row.newContent.field]), [['labels', 'labelIds']]);
  assert.deepEqual(added.effects.activities.map(row => [row.activity.activityType, row.activity.labelId]), [['addedLabel', 'new']]);
  const removed = (await fixture({ actionType: 'removeLabel', labelId: 'old' })).prepare();
  assert.deepEqual(removed.effects.activities.map(row => row.activity.activityType), ['removedLabel']);
  const same = (await fixture({ actionType: 'addLabel', labelId: 'old' })).prepare();
  assert.deepEqual([same.effects.history.rows.length, same.effects.activities.length], [0, 0], 'nothing changed, nothing recorded');
  // The ordinary removeAllLabels writes $set, which records no removedLabel activity.
  const cleared = (await fixture({ actionType: 'removeAllLabels' })).prepare();
  assert.deepEqual([cleared.effects.history.rows.length, cleared.effects.activities.length], [1, 0]);
  const colour = (await fixture({ actionType: 'setColor', selectedColor: 'blue' })).prepare();
  assert.equal(colour.effects.history.rows[0].group, 'title');
});

test('a missing field stays missing on removeLabel, and selectors tell absent from null', async () => {
  const f = await fixture({ actionType: 'removeLabel', labelId: 'x' });
  delete f.card.labelIds;
  const command = f.prepare();
  assert.deepEqual([command.before, command.after], [{}, {}]);
  assert.deepEqual(C.fieldSelector(command, command.before), { _id: 'card', boardId: 'board', labelIds: { $exists: false } });
  const g = await fixture({ actionType: 'addLabel', labelId: 'x' });
  const added = g.prepare();
  assert.deepEqual(C.fieldSelector(added, added.after).labelIds, { $eq: ['old', 'x'] });
});

test('tampering, linked cards and other action types are refused (negative)', async () => {
  const f = await fixture({ actionType: 'addLabel', labelId: 'new' }), command = f.prepare();
  const context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  for (const change of [{ after: { labelIds: ['evil'] } }, { cardId: 'other' }, { field: 'color' }, { extra: 1 }]) {
    const tampered = { ...command, ...change };
    const { checksum, ...content } = tampered;
    assert.throws(() => C.validateRuleCardCommand({ ...tampered, checksum: sha256(canonical(content)) }, context), /command-invalid/);
  }
  assert.throws(() => C.validateRuleCardCommand({ ...command, checksum: 'f'.repeat(64) }, context), /command-invalid/);
  // A linked card without the card it links to, or with another one, is refused.
  const linked = { ...f.card, type: 'cardType-linkedCard', linkedId: 'real' };
  assert.throws(() => f.prepare({ card: linked }), /card-invalid/);
  assert.throws(() => f.prepare({ card: linked, real: { ...f.card, _id: 'someone-else' } }), /card-invalid/);
  assert.throws(() => f.prepare({ card: linked, real: { ...f.card, _id: 'real', type: 'cardType-linkedCard' } }),
    /card-invalid/);
  assert.throws(() => f.prepare({ card: { ...f.card, boardId: 'other' } }), /card-invalid/);
  const other = await fixture({ actionType: 'moveCardToTop' });
  assert.throws(() => other.prepare(), /sync-rule-card-invalid/);
  assert.deepEqual(Object.keys(C.RULE_CARD_ACTIONS).sort(), ['addAssignee', 'addLabel', 'addMember', 'markCardComplete',
    'markCardIncomplete', 'removeAllLabels', 'removeAssignee', 'removeDate', 'removeLabel', 'removeMember', 'setColor', 'setDate',
    'setDateRelative', 'updateDate']);
  const badDate = await fixture({ actionType: 'updateDate', dateField: 'createdAt' });
  assert.throws(() => badDate.prepare(), /sync-rule-card-invalid/, 'only the four card dates');
});

test('date actions follow the ordinary action and its timing activity', async () => {
  const now = new Date(1000);
  // setDate fills only an unset date.
  const unset = await fixture({ actionType: 'setDate', dateField: 'startAt' });
  const filled = unset.prepare();
  assert.deepEqual(filled.after, { startAt: now });
  const act = filled.effects.activities[0].activity;
  assert.deepEqual([act.activityType, act.timeKey, act.timeValue, act.timeOldValue, act.cardTitle],
    ['a-startAt', 'startAt', now, '', 'T'], 'as server/models/cards.js writes it');
  assert.deepEqual(filled.effects.history.rows.map(row => [row.group, row.changeType]), [['dates', 'added']]);
  const set = await fixture({ actionType: 'setDate', dateField: 'startAt' }); set.card.startAt = new Date(5);
  const kept = set.prepare();
  assert.deepEqual([kept.after, kept.effects.activities.length, kept.effects.history.rows.length], [{ startAt: new Date(5) }, 0, 0]);
  // updateDate always sets; removeDate unsets, with no timeValue.
  const update = await fixture({ actionType: 'updateDate', dateField: 'dueAt' }); update.card.dueAt = new Date(5);
  assert.deepEqual(update.prepare().after, { dueAt: now });
  const remove = await fixture({ actionType: 'removeDate', dateField: 'dueAt' }); remove.card.dueAt = new Date(5);
  const removed = remove.prepare();
  assert.deepEqual(removed.after, {});
  const gone = removed.effects.activities[0].activity;
  assert.ok(!Object.hasOwn(gone, 'timeValue')); assert.deepEqual(gone.timeOldValue, new Date(5));
  assert.equal(removed.effects.history.rows[0].changeType, 'removed');
  // setDateRelative is relative to the capture time, so a replay is identical.
  const relative = await fixture({ actionType: 'setDateRelative', dateField: 'endAt', days: 2, unit: 'days' });
  const planned = relative.prepare();
  assert.deepEqual(planned.after, { endAt: new Date(1000 + 2 * 86400000) });
  assert.deepEqual(C.validateRuleCardCommand(planned, { plan: relative.plan, activity: relative.activity,
    effectId: relative.effectId, index: 0 }), planned);
});

test('member actions add and remove the resolved people, one activity per real change', async () => {
  const people = [{ userId: 'u1', username: 'one' }, { userId: 'u2', username: 'two' }];
  const add = await fixture({ actionType: 'addMember', username: '{assignees}' });
  add.card.members = ['u1'];
  const added = add.prepare({ targets: people });
  assert.deepEqual(added.after, { members: ['u1', 'u2'] });
  assert.deepEqual(added.targets, people, 'the people are saved, not re-resolved on replay');
  assert.deepEqual(added.effects.activities.map(row => [row.activity.activityType, row.activity.memberId, row.activity.username]),
    [['joinMember', 'u2', 'two']], 'u1 was already a member');
  assert.deepEqual(added.effects.history.rows.map(row => row.group), ['members']);
  const remove = await fixture({ actionType: 'removeMember', username: '*' });
  remove.card.members = ['u1', 'u3'];
  const removed = remove.prepare({ targets: people });
  assert.deepEqual(removed.after, { members: ['u3'] });
  assert.deepEqual(removed.effects.activities.map(row => row.activity.activityType), ['unjoinMember']);
  const nobody = await fixture({ actionType: 'addMember', username: 'ghost' });
  delete nobody.card.members;
  const none = nobody.prepare({ targets: [] });
  assert.deepEqual([none.before, none.after, none.effects.activities.length], [{}, {}, 0], 'no one resolved, nothing written');
  // Negative: targets on another action, malformed targets, tampered targets.
  const label = await fixture({ actionType: 'addLabel', labelId: 'x' });
  assert.throws(() => label.prepare({ targets: people }), /sync-rule-card-invalid/);
  assert.throws(() => add.prepare({ targets: [{ userId: '' }] }), /sync-rule-card-invalid/);
  const { checksum, ...content } = { ...added, targets: [...people, { userId: 'u9', username: 'nine' }] };
  assert.throws(() => C.validateRuleCardCommand({ ...content, checksum: sha256(canonical(content)) },
    { plan: add.plan, activity: add.activity, effectId: add.effectId, index: 0 }), /command-invalid/);
});

// #4294: the assignee actions are the member actions on card.assignees, with
// the activities the assignees hook writes (joinAssignee / unjoinAssignee).
test('assignee actions add and remove the resolved people on assignees, not members', async () => {
  const people = [{ userId: 'u1', username: 'one' }, { userId: 'u2', username: 'two' }];
  const add = await fixture({ actionType: 'addAssignee', username: '{creator}' });
  add.card.assignees = ['u1'];
  add.card.members = ['m1'];
  const added = add.prepare({ targets: people });
  assert.deepEqual(added.after, { assignees: ['u1', 'u2'] });
  assert.deepEqual(added.before, { assignees: ['u1'] }, 'only the assignees field is read and written');
  assert.deepEqual(added.effects.activities.map(row => [row.activity.activityType, row.activity.assigneeId, row.activity.memberId]),
    [['joinAssignee', 'u2', undefined]]);
  assert.deepEqual(added.effects.history.rows.map(row => row.group), ['assignees']);
  const remove = await fixture({ actionType: 'removeAssignee', username: '*' });
  remove.card.assignees = ['u1', 'u3'];
  const removed = remove.prepare({ targets: people });
  assert.deepEqual(removed.after, { assignees: ['u3'] });
  assert.deepEqual(removed.effects.activities.map(row => row.activity.activityType), ['unjoinAssignee']);
});

// The ordinary setters write a linked card's field on the card it links to
// (getRealId), so the command's subject, History row and activity are that
// card's - on its own board and list.
test('a linked card\'s field is written on the card it links to', async () => {
  const f = await fixture({ actionType: 'addLabel', labelId: 'new' });
  const real = { ...f.card, _id: 'real', boardId: 'origin', listId: 'origin-list', swimlaneId: 'origin-lane' };
  const command = f.prepare({ card: { ...f.card, type: 'cardType-linkedCard', linkedId: 'real', labelIds: [] }, real });
  assert.deepEqual(command.subject, { cardId: 'real', boardId: 'origin' });
  assert.deepEqual([command.cardId, command.boardId, command.listId], ['card', 'board', 'origin-list'], 'the plan stays the rule card\'s');
  assert.deepEqual(command.after, { labelIds: ['old', 'new'] }, 'from the real card\'s labels');
  const [activity] = command.effects.activities.map(row => row.activity);
  assert.deepEqual([activity.cardId, activity.boardId, activity.listId], ['real', 'origin', 'origin-list']);
  assert.deepEqual(command.effects.history.rows.map(row => [row.entityId, row.boardId]), [['real', 'origin']]);
  assert.deepEqual(C.fieldSelector(command, command.before), { _id: 'real', boardId: 'origin', labelIds: { $eq: ['old'] } });
  assert.deepEqual(C.validateRuleCardCommand(command, { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 }),
    command);
  // An ordinary card is its own subject.
  assert.deepEqual(f.prepare().subject, { cardId: 'card', boardId: 'board' });
  assert.equal(C.realCardId({ _id: 'x', type: 'cardType-linkedBoard', linkedId: 'b' }), 'x', 'getRealId: linked cards only');
});
