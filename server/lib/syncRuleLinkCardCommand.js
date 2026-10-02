'use strict';
// Durable rule linkCard (the structural rule actions of TODO Later). The ordinary action (server/rulesHelper.js -> Card.link in
// models/cards.js) inserts a copy of the card, minus its id and labels, as
// type 'cardType-linkedCard' pointing at the card (`linkedId`), at the target
// RulesHelper.linkCardTarget resolves; the insert hook writes its createCard
// activity, which runs the linked card's own rules.
//
// One saved command per rule invocation: the linked card is built once, its id
// is derived from the invocation so a replay inserts it once, and its creation
// activity - known before the insert - is saved with the command. A link to
// ANOTHER board (maintainer decision of 2026-10-02) is the same command with
// that board as `targetBoardId`: eligibility (listSyncSteps.js) takes it only
// when that board opted into Sync effects too, since the activity runs that
// board's rules through the stored stages. Pure: tested by
// tests/syncRuleLinkCardCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { cardCreationActivity } = require('../../models/lib/cardCreationActivity');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-link-card-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const commandId = invocationId => sha256(canonical(['sync-rule-link-card', invocationId]));
const linkedCardIdFor = id => sha256(canonical([id, 'linked-card'])).slice(0, 24);

function isSameBoardLink(action, boardId) {
  return !!action && action.actionType === 'linkCard' && (action.boardId || boardId) === boardId;
}
// A legacy action without a board links on the card's own board.
const targetBoardOf = (action, boardId) => action.boardId || boardId;

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  const action = invocation?.action;
  if (!Number.isSafeInteger(index) || index < 0 || action?.actionType !== 'linkCard' ||
      !text(targetBoardOf(action, plan.boardId))) fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId,
    actionType: 'linkCard', targetBoardId: targetBoardOf(action, plan.boardId) };
}

// Card.link's document.
function linkedCard(base, source, target) {
  const doc = copy(source);
  doc.linkedId = doc.linkedId || doc._id;
  for (const key of ['_id', '__id', 'labelIds']) delete doc[key];
  return { ...doc, _id: linkedCardIdFor(base._id), boardId: base.targetBoardId, swimlaneId: target.swimlaneId,
    listId: target.listId, type: 'cardType-linkedCard' };
}

function creation(base, card, list, swimlane, createdAt) {
  const receiptId = sha256(canonical([base._id, 'activity']));
  return { receiptId, activity: { _id: `sync-rule-link-card-${receiptId}`,
    ...cardCreationActivity(base.actorId, card, list, swimlane), createdAt: new Date(createdAt),
    modifiedAt: new Date(createdAt) } };
}

// Capture. `source` is the rule's card (raw document), `target` what
// RulesHelper.linkCardTarget resolved, `list` and `swimlane` its documents.
// Without both the ordinary insert fails at its activity, so this refuses.
// `cardBoardId`: where the card is - the plan's board, unless a cross-board
// move of this plan put it elsewhere (2026-10-03); Card.link links it from there.
function prepareRuleLinkCardCommand({ plan, activity, effectId, index, source, target, list, swimlane, createdAt,
  cardBoardId = plan?.boardId }) {
  const base = identity({ plan, activity, effectId, index });
  if (!source || source._id !== base.cardId || source.boardId !== cardBoardId || !target ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('invalid');
  if (!text(target.listId) || !text(target.swimlaneId) || !list || !swimlane || list._id !== target.listId ||
      swimlane._id !== target.swimlaneId || list.boardId !== base.targetBoardId ||
      swimlane.boardId !== base.targetBoardId) {
    fail('target-missing');
  }
  const card = linkedCard(base, source, target);
  const command = { ...base, createdAt: new Date(createdAt), card,
    ...creation(base, card, { title: list.title || '' }, { title: swimlane.title || '' }, createdAt) };
  command.checksum = sha256(canonical(command));
  return validateRuleLinkCardCommand(command, { plan, activity, effectId, index });
}

function validateRuleLinkCardCommand(row, context) {
  const base = identity(context);
  const keys = [...Object.keys(base), 'createdAt', 'card', 'receiptId', 'activity', 'checksum'].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !(row.createdAt instanceof Date) || !row.card || !row.activity) fail('command-invalid');
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  const card = row.card;
  if (card._id !== linkedCardIdFor(base._id) || card.boardId !== base.targetBoardId || card.type !== 'cardType-linkedCard' ||
      !text(card.linkedId) || !text(card.listId) || !text(card.swimlaneId) || Object.hasOwn(card, 'labelIds')) {
    fail('command-invalid');
  }
  const expected = creation(base, card, { title: row.activity.listName }, { title: row.activity.swimlaneName }, row.createdAt);
  if (canonical(expected) !== canonical({ receiptId: row.receiptId, activity: row.activity })) fail('command-invalid');
  return copy(row);
}

module.exports = { commandId, linkedCardIdFor, isSameBoardLink, prepareRuleLinkCardCommand, validateRuleLinkCardCommand };
