'use strict';
// Durable rule createCard (the structural rule actions of TODO Later). The
// ordinary action (server/rulesHelper.js) inserts { title, listId, swimlaneId,
// sort: 0, boardId } at the target RulesHelper.createCardTarget resolves, and
// the insert hook writes the createCard activity
// (models/lib/cardCreationActivity.js) - which in turn runs the new card's own
// rules. No History row is written for a new card.
//
// One saved command per rule invocation: the target and title are resolved
// once, the new card's id is derived from the invocation so a replay inserts
// it once, and the activity - fully known before the insert - is saved with
// the command. Replays apply the saved command, never the rule's current
// configuration. Pure: tested by tests/syncRuleCreateCardCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { cardCreationActivity } = require('../../models/lib/cardCreationActivity');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-create-card-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const commandId = invocationId => sha256(canonical(['sync-rule-create-card', invocationId]));
const newCardIdFor = id => sha256(canonical([id, 'card'])).slice(0, 24);

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  if (!Number.isSafeInteger(index) || index < 0 || invocation?.action?.actionType !== 'createCard') fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId,
    actionType: 'createCard' };
}

function creation(base, target, list, swimlane, createdAt) {
  const card = { _id: newCardIdFor(base._id), boardId: base.boardId, listId: target.listId,
    swimlaneId: target.swimlaneId, title: target.title };
  const receiptId = sha256(canonical([base._id, 'activity']));
  const activity = { _id: `sync-rule-create-card-${receiptId}`,
    ...cardCreationActivity(base.actorId, card, list, swimlane), createdAt: new Date(createdAt),
    modifiedAt: new Date(createdAt) };
  return { card, receiptId, activity };
}

// Capture. `target` is RulesHelper.createCardTarget's; `list` and `swimlane`
// the documents it named. Without both the ordinary insert fails at its
// activity, so the command refuses rather than create a card nothing lists.
function prepareRuleCreateCardCommand({ plan, activity, effectId, index, target, list, swimlane, createdAt }) {
  const base = identity({ plan, activity, effectId, index });
  if (!target || target.boardId !== base.boardId || typeof target.title !== 'string' ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('invalid');
  if (!text(target.listId) || !text(target.swimlaneId) || !list || !swimlane || list._id !== target.listId ||
      swimlane._id !== target.swimlaneId || list.boardId !== base.boardId || swimlane.boardId !== base.boardId) {
    fail('target-missing');
  }
  const command = { ...base, createdAt: new Date(createdAt),
    ...creation(base, target, { title: list.title || '' }, { title: swimlane.title || '' }, createdAt) };
  command.checksum = sha256(canonical(command));
  return validateRuleCreateCardCommand(command, { plan, activity, effectId, index });
}

function validateRuleCreateCardCommand(row, context) {
  const base = identity(context);
  const keys = [...Object.keys(base), 'createdAt', 'card', 'receiptId', 'activity', 'checksum'].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !(row.createdAt instanceof Date) || !row.card || !row.activity) fail('command-invalid');
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  // The saved card and activity are what that target makes, exactly.
  const expected = creation(base, { boardId: base.boardId, listId: row.card.listId, swimlaneId: row.card.swimlaneId,
    title: row.card.title }, { title: row.activity.listName }, { title: row.activity.swimlaneName }, row.createdAt);
  if (canonical(expected) !== canonical({ card: row.card, receiptId: row.receiptId, activity: row.activity }) ||
      !text(row.card.listId) || !text(row.card.swimlaneId) || typeof row.activity.listName !== 'string' ||
      typeof row.activity.swimlaneName !== 'string') fail('command-invalid');
  return copy(row);
}

module.exports = { commandId, newCardIdFor, prepareRuleCreateCardCommand, validateRuleCreateCardCommand };
