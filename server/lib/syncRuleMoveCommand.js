'use strict';
// Durable rule moves (maintainer decision of 2026-10-02: "durable moves
// next"). This first step covers the move that stays in place: moveCardToTop
// and moveCardToBottom whose list and swimlane are '*' on the card's own
// board. That move changes only the card's `sort`, and ordinarily writes
// (Card.move in models/cards.js):
//
//   * the card's new sort,
//   * one `position` History row, from the collection hook
//     (server/models/changeHistoryHooks.js, models/lib/timeHistory.js), and
//   * one legacy UserPositionHistory row, which Ctrl+Z still reads, after
//     clearing the actor's redo stack on that board (trackChange).
//
// No activity: an in-place move is not a moveCard. One saved command per rule
// invocation carries the sort before and after - computed once, at capture,
// from the destination's sorts exactly as the ordinary action computes it -
// and those two rows. Replays apply the saved command, never the rule's
// current configuration. A move to another list, swimlane or board relabels,
// renumbers, maps custom fields and re-syncs checklists and attachments; it
// is not durable yet, and a board with such a rule keeps direct Sync
// (durableRuleActionType below). Pure: tested by
// tests/syncRuleMoveCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { prepareCardFieldHistory, RULE_CARD_POSITION_FIELDS } = require('./syncHistoryBatch');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-move-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const RULE_MOVE_ACTIONS = ['moveCardToTop', 'moveCardToBottom'];

// A move that stays in the card's own list and swimlane on its own board.
// An unset listName means "the card's current list" (#6472).
function isInPlaceMove(action, boardId) {
  return !!action && RULE_MOVE_ACTIONS.includes(action.actionType) &&
    (!action.listName || action.listName === '*') && action.swimlaneName === '*' &&
    (action.boardId || boardId) === boardId;
}

// The type durable Sync eligibility checks: a move elsewhere is not durable,
// so it is reported under a name no durable set contains.
function durableRuleActionType(action, boardId) {
  if (!action) return null;
  // A copy is durable on the card's own board only (syncRuleCopyCardCommand.js).
  // ...and so is a link (syncRuleLinkCardCommand.js).
  if (['copyCard', 'linkCard'].includes(action.actionType)) {
    return (action.boardId || boardId) === boardId ? action.actionType : `${action.actionType}:elsewhere`;
  }
  if (!RULE_MOVE_ACTIONS.includes(action.actionType)) return action.actionType;
  return isInPlaceMove(action, boardId) ? action.actionType : `${action.actionType}:elsewhere`;
}

// The ordinary action's sort: one above the smallest or below the largest
// finite sort among the destination's cards, 0 as the bound when it has none.
function targetSort(actionType, bound) {
  const base = bound === null ? 0 : bound;
  return actionType === 'moveCardToTop' ? base - 1 : base + 1;
}
function boundOf(actionType, sorts) {
  const finite = (Array.isArray(sorts) ? sorts : []).filter(Number.isFinite);
  if (!finite.length) return null;
  return actionType === 'moveCardToTop' ? Math.min(...finite) : Math.max(...finite);
}

const commandId = invocationId => sha256(canonical(['sync-rule-move', invocationId]));
const effectIdFor = id => sha256(canonical(['sync-rule-move-effect', id]));
const legacyIdFor = id => `sync-rule-move-${sha256(canonical([id, 'user-position']))}`;

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  const action = invocation?.action;
  if (!Number.isSafeInteger(index) || index < 0 || !isInPlaceMove(action, plan.boardId)) fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId,
    actionType: action.actionType };
}

// What Card.move compares: a sort equal to the card's own is a no-op.
function placement(card, sort) {
  return { boardId: card.boardId, swimlaneId: card.swimlaneId, listId: card.listId, sort,
    lastMoveReason: typeof card.lastMoveReason === 'string' ? card.lastMoveReason : '' };
}

function legacyRow({ id, actorId, before, after, createdAt }) {
  const state = value => ({ boardId: value.boardId, swimlaneId: value.swimlaneId, listId: value.listId, sort: value.sort });
  return { _id: legacyIdFor(id), userId: actorId, boardId: before.boardId, entityType: 'card', entityId: before.cardId,
    actionType: 'move', previousState: state(before), newState: state(after),
    previousSort: before.sort, previousSwimlaneId: before.swimlaneId, previousListId: before.listId,
    previousBoardId: before.boardId, newSort: after.sort, newSwimlaneId: after.swimlaneId, newListId: after.listId,
    newBoardId: after.boardId, createdAt: new Date(createdAt), isCheckpoint: false, undone: false };
}

function effectsFor({ base, card, before, after, createdAt, redoRows }) {
  if (before.sort === after.sort) return { history: null, userPosition: null };
  const changeId = effectIdFor(base._id);
  const at = placement(card, before.sort), to = placement(card, after.sort);
  const history = prepareCardFieldHistory({ before: { _id: base.cardId, ...at }, after: { _id: base.cardId, ...to },
    effectId: changeId, userId: base.actorId, createdAt, redoRows, fields: RULE_CARD_POSITION_FIELDS });
  return { history, userPosition: legacyRow({ id: base._id, actorId: base.actorId,
    before: { ...at, cardId: base.cardId }, after: to, createdAt }) };
}

// Capture from the card as it is now. `sorts` are the sorts of the cards in
// the card's list and swimlane (List.cardsUnfiltered), as the ordinary action
// reads them; `redoRows` are the actor's undone rows the move supersedes.
function prepareRuleMoveCommand({ plan, activity, effectId, index, card, sorts, createdAt, redoRows = [] }) {
  const base = identity({ plan, activity, effectId, index });
  if (!card || card._id !== base.cardId || card.boardId !== base.boardId || !text(card.listId) || !text(card.swimlaneId) ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('card-invalid');
  const bound = boundOf(base.actionType, sorts);
  const before = { sort: Number.isFinite(card.sort) ? card.sort : null };
  const after = { sort: targetSort(base.actionType, bound) };
  const command = { ...base, listId: card.listId, swimlaneId: card.swimlaneId,
    lastMoveReason: typeof card.lastMoveReason === 'string' ? card.lastMoveReason : '', bound, before, after,
    createdAt: new Date(createdAt), effects: effectsFor({ base, card, before, after, createdAt, redoRows }) };
  command.checksum = sha256(canonical(command));
  return validateRuleMoveCommand(command, { plan, activity, effectId, index });
}

function validateRuleMoveCommand(row, context) {
  const base = identity(context);
  const keys = [...Object.keys(base), 'listId', 'swimlaneId', 'lastMoveReason', 'bound', 'before', 'after', 'createdAt',
    'effects', 'checksum'].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !text(row.listId) || !text(row.swimlaneId) || typeof row.lastMoveReason !== 'string' ||
      !(row.createdAt instanceof Date) || !(row.bound === null || Number.isFinite(row.bound)) ||
      !row.before || Object.keys(row.before).join(',') !== 'sort' ||
      !(row.before.sort === null || Number.isFinite(row.before.sort)) ||
      !row.after || Object.keys(row.after).join(',') !== 'sort' ||
      !row.effects || Object.keys(row.effects).sort().join(',') !== 'history,userPosition') fail('command-invalid');
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  // The saved after-sort is what this action makes of the saved bound, and the
  // saved effects are what that change writes.
  if (row.after.sort !== targetSort(base.actionType, row.bound)) fail('command-invalid');
  const card = { boardId: base.boardId, listId: row.listId, swimlaneId: row.swimlaneId, lastMoveReason: row.lastMoveReason };
  const redo = row.effects.history ? row.effects.history.redo : [];
  const expected = row.before.sort === row.after.sort ? { history: null, userPosition: null } : (() => {
    const at = placement(card, row.before.sort), to = placement(card, row.after.sort);
    return { history: { ...prepareCardFieldHistory({ before: { _id: base.cardId, ...at }, after: { _id: base.cardId, ...to },
      effectId: effectIdFor(base._id), userId: base.actorId, createdAt: row.createdAt, fields: RULE_CARD_POSITION_FIELDS }),
    redo: copy(redo) },
    userPosition: legacyRow({ id: base._id, actorId: base.actorId, before: { ...at, cardId: base.cardId }, after: to,
      createdAt: row.createdAt }) };
  })();
  if (canonical(expected) !== canonical(row.effects)) fail('command-invalid');
  return copy(row);
}

// The card at a saved sort, in its saved place. A card with no usable sort
// was captured as null, which matches a missing or null sort.
function sortSelector(command, sort) {
  return { _id: command.cardId, boardId: command.boardId, listId: command.listId, swimlaneId: command.swimlaneId,
    sort: sort === null ? null : { $eq: sort } };
}

module.exports = { RULE_MOVE_ACTIONS, isInPlaceMove, durableRuleActionType, commandId, effectIdFor, legacyIdFor,
  prepareRuleMoveCommand, validateRuleMoveCommand, sortSelector };
