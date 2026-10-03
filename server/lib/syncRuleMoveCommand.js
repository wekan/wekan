'use strict';
// Durable rule moves on the card's own board (maintainer decisions of
// 2026-10-02: "durable moves next", and the rule stage's guard follows a move
// the same rule plan saved). moveCardToTop / moveCardToBottom put the card at
// the top or bottom of the list and swimlane RulesHelper.moveCardTarget
// resolves - its own place, or another list or swimlane of its board. Card.move
// (models/cards.js) then writes:
//
//   * the fields that change - listId, swimlaneId, sort - and, when the list
//     changes, lastMoveReason '' (a rule gives no reason); listEnteredAt is the
//     before-update hook's (models/lib/cardListEntry.js);
//   * one `position` History row, from the collection hook
//     (server/models/changeHistoryHooks.js, models/lib/timeHistory.js);
//   * one legacy UserPositionHistory row, which Ctrl+Z still reads, after
//     clearing the actor's redo stack on that board (trackChange);
//   * when the list or the swimlane changes, the moveCard activity of the
//     update hook (models/cards.js cardMove) - which runs the board's rules for
//     the moved card - and the attachments' meta.listId / meta.swimlaneId.
// A move that changes nothing writes nothing, as Card.move returns early.
//
// One saved command per rule invocation carries the place before and after -
// computed once, at capture - and those effects. Replays apply the saved
// command, never the rule's current configuration. A move to ANOTHER board
// also relabels, renumbers and maps custom fields; it is not this command's.
// Pure: tested by tests/syncRuleMoveCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { prepareCardFieldHistory, RULE_CARD_POSITION_FIELDS } = require('./syncHistoryBatch');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-move-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const RULE_MOVE_ACTIONS = ['moveCardToTop', 'moveCardToBottom'];

// A move that stays on the card's own board (its list may be another one).
function isSameBoardMove(action, boardId) {
  return !!action && RULE_MOVE_ACTIONS.includes(action.actionType) && (action.boardId || boardId) === boardId;
}
// The narrower question: a move to the top or bottom of the card's own list
// and swimlane.
function isInPlaceMove(action, boardId) {
  return isSameBoardMove(action, boardId) && (!action.listName || action.listName === '*') && action.swimlaneName === '*';
}

// The type durable Sync eligibility checks: a move, copy or link elsewhere is
// not durable, so it is reported under a name no durable set contains.
function durableRuleActionType(action, boardId) {
  if (!action) return null;
  // A copy and a link are durable on the card's own board only
  // (syncRuleCopyCardCommand.js, syncRuleLinkCardCommand.js).
  if (['copyCard', 'linkCard'].includes(action.actionType)) {
    return (action.boardId || boardId) === boardId ? action.actionType : `${action.actionType}:elsewhere`;
  }
  // A move-all is durable on the card's own board (syncRuleMoveAllCommand.js).
  if (action.actionType === 'moveAllCardsInList') {
    return (action.boardId || boardId) === boardId ? action.actionType : `${action.actionType}:elsewhere`;
  }
  if (!RULE_MOVE_ACTIONS.includes(action.actionType)) return action.actionType;
  return isSameBoardMove(action, boardId) ? action.actionType : `${action.actionType}:elsewhere`;
}

const commandId = invocationId => sha256(canonical(['sync-rule-move', invocationId]));
const effectIdFor = id => sha256(canonical(['sync-rule-move-effect', id]));
const legacyIdFor = id => `sync-rule-move-${sha256(canonical([id, 'user-position']))}`;

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  const action = invocation?.action;
  if (!Number.isSafeInteger(index) || index < 0 || !isSameBoardMove(action, plan.boardId)) fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId,
    actionType: action.actionType };
}

const placementOf = (base, place) => ({ boardId: base.boardId, swimlaneId: place.swimlaneId, listId: place.listId,
  sort: place.sort, lastMoveReason: place.lastMoveReason });
const moved = (before, after) => before.listId !== after.listId || before.swimlaneId !== after.swimlaneId;
const unchanged = (before, after) => !moved(before, after) && before.sort === after.sort;

function legacyRow(base, before, after, createdAt) {
  const state = place => ({ boardId: base.boardId, swimlaneId: place.swimlaneId, listId: place.listId, sort: place.sort });
  return { _id: legacyIdFor(base._id), userId: base.actorId, boardId: base.boardId, entityType: 'card', entityId: base.cardId,
    actionType: 'move', previousState: state(before), newState: state(after),
    previousSort: before.sort, previousSwimlaneId: before.swimlaneId, previousListId: before.listId,
    previousBoardId: base.boardId, newSort: after.sort, newSwimlaneId: after.swimlaneId, newListId: after.listId,
    newBoardId: base.boardId, createdAt: new Date(createdAt), isCheckpoint: false, undone: false };
}

// The update hook's moveCard activity (models/cards.js cardMove).
function moveActivity(base, before, after, titles, createdAt) {
  const receiptId = sha256(canonical([base._id, 'activity']));
  return { receiptId, activity: { _id: `sync-rule-move-${receiptId}`, userId: base.actorId, oldListId: before.listId,
    activityType: 'moveCard', moveReason: after.lastMoveReason || '', listName: titles.listName, listId: after.listId,
    boardId: base.boardId, cardId: base.cardId, cardTitle: titles.cardTitle, swimlaneName: titles.swimlaneName,
    swimlaneId: after.swimlaneId, oldSwimlaneId: before.swimlaneId,
    createdAt: new Date(createdAt), modifiedAt: new Date(createdAt) } };
}

function effectsFor({ base, before, after, titles, createdAt, redoRows }) {
  if (unchanged(before, after)) return { history: null, userPosition: null, move: null };
  const history = prepareCardFieldHistory({ before: { _id: base.cardId, ...placementOf(base, before) },
    after: { _id: base.cardId, ...placementOf(base, after) }, effectId: effectIdFor(base._id), userId: base.actorId,
    createdAt, redoRows, fields: RULE_CARD_POSITION_FIELDS });
  return { history, userPosition: legacyRow(base, before, after, createdAt),
    move: moved(before, after) ? moveActivity(base, before, after, titles, createdAt) : null };
}

// The board the command's card is on: the plan's, or - when an earlier move
// of this same plan took the card to another board (2026-10-03) - that
// board, saved as `onBoard`. A command made on the plan's board has no
// `onBoard`, as every command did before.
const boardOf = command => command.onBoard || command.boardId;

// Capture from the card as it is now. `target` is RulesHelper.moveCardTarget's
// ({ boardId, listId, swimlaneId, sort }); `titles` the destination list's and
// swimlane's titles and the card's (for the moveCard activity); `redoRows` the
// actor's undone rows the move supersedes.
function prepareRuleMoveCommand({ plan, activity, effectId, index, card, target, titles, createdAt, redoRows = [],
  cardBoardId = plan?.boardId }) {
  const identityBase = identity({ plan, activity, effectId, index });
  if (!text(cardBoardId)) fail('card-invalid');
  const base = cardBoardId === identityBase.boardId ? identityBase : { ...identityBase, onBoard: cardBoardId };
  if (!card || card._id !== base.cardId || card.boardId !== boardOf(base) || !text(card.listId) || !text(card.swimlaneId) ||
      !target || !text(target.listId) || !text(target.swimlaneId) || !Number.isFinite(target.sort) ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('card-invalid');
  if (target.boardId !== boardOf(base)) fail('elsewhere');
  const reason = typeof card.lastMoveReason === 'string' ? card.lastMoveReason : '';
  const before = { listId: card.listId, swimlaneId: card.swimlaneId, sort: Number.isFinite(card.sort) ? card.sort : null,
    lastMoveReason: reason };
  // Card.move sets lastMoveReason only when the list (or board) changes.
  const after = { listId: target.listId, swimlaneId: target.swimlaneId, sort: target.sort,
    lastMoveReason: target.listId !== card.listId ? '' : reason };
  const savedTitles = { listName: String(titles?.listName ?? ''), swimlaneName: String(titles?.swimlaneName ?? ''),
    cardTitle: String(titles?.cardTitle ?? card.title ?? '') };
  const command = { ...base, before, after, titles: savedTitles, createdAt: new Date(createdAt),
    effects: effectsFor({ base: { ...base, boardId: boardOf(base) }, before, after, titles: savedTitles, createdAt, redoRows }) };
  command.checksum = sha256(canonical(command));
  return validateRuleMoveCommand(command, { plan, activity, effectId, index });
}

function validPlace(place) {
  return !!place && Object.keys(place).sort().join(',') === 'lastMoveReason,listId,sort,swimlaneId' &&
    text(place.listId) && text(place.swimlaneId) && (place.sort === null || Number.isFinite(place.sort)) &&
    typeof place.lastMoveReason === 'string';
}

function validateRuleMoveCommand(row, context) {
  const base = identity(context);
  const elsewhere = !!row && Object.hasOwn(row, 'onBoard');
  const keys = [...Object.keys(base), ...(elsewhere ? ['onBoard'] : []), 'before', 'after', 'titles', 'createdAt', 'effects', 'checksum']
    .sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys || (elsewhere && (!text(row.onBoard) || row.onBoard === base.boardId)) ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !(row.createdAt instanceof Date) || !validPlace(row.before) || !validPlace(row.after) ||
      !Number.isFinite(row.after.sort) || !row.titles || Object.keys(row.titles).sort().join(',') !== 'cardTitle,listName,swimlaneName' ||
      Object.values(row.titles).some(value => typeof value !== 'string') ||
      !row.effects || Object.keys(row.effects).sort().join(',') !== 'history,move,userPosition') fail('command-invalid');
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  // The saved reason is Card.move's, and the saved effects are what that move
  // writes (the redo targets are the capture's, checked when they are written).
  const reasonOk = row.after.listId !== row.before.listId ? row.after.lastMoveReason === ''
    : row.after.lastMoveReason === row.before.lastMoveReason;
  const expected = effectsFor({ base: { ...base, boardId: boardOf(row) }, before: row.before, after: row.after, titles: row.titles,
    createdAt: row.createdAt, redoRows: [] });
  if (expected.history) expected.history.redo = row.effects.history ? row.effects.history.redo : null;
  if (!reasonOk || canonical(expected) !== canonical(row.effects)) fail('command-invalid');
  return copy(row);
}

// The card at a saved place: a card with no usable sort was captured as null,
// which matches a missing or null sort.
function placeSelector(command, place) {
  return { _id: command.cardId, boardId: boardOf(command), listId: place.listId, swimlaneId: place.swimlaneId,
    sort: place.sort === null ? null : { $eq: place.sort } };
}
// The update Card.move makes: only what changes.
function moveModifier(command) {
  const { before, after } = command;
  const set = {};
  if (after.listId !== before.listId) { set.listId = after.listId; set.lastMoveReason = after.lastMoveReason; }
  if (after.swimlaneId !== before.swimlaneId) set.swimlaneId = after.swimlaneId;
  if (after.sort !== before.sort) set.sort = after.sort;
  return { $set: set };
}

// For a move-all (syncRuleMoveAllCommand.js): the same effects and update for
// each card it moves, `base` naming that card's unit ({ _id, actorId, boardId,
// cardId }).
module.exports = { RULE_MOVE_ACTIONS, isSameBoardMove, isInPlaceMove, durableRuleActionType, commandId, effectIdFor,
  legacyIdFor, prepareRuleMoveCommand, validateRuleMoveCommand, placeSelector, moveModifier, effectsFor, validPlace, boardOf };
