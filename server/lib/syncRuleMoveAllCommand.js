'use strict';
// Durable rule moveAllCardsInList on the card's own board (maintainer decision
// of 2026-10-02: the rule stage's guard follows a move the same rule plan
// saved). The ordinary action (server/rulesHelper.js) moves every card of the
// list named fromListName (List.cardsUnfiltered()) to the list named listName,
// each card keeping its swimlane and its sort, through Card.move - so each
// writes what a single rule move writes when its list changes
// (syncRuleMoveCommand.js): the update with lastMoveReason '', the position
// History row, the legacy UserPositionHistory row, the attachments' placement
// and the moveCard activity, which runs the board's rules for that card.
//
// One saved command per rule invocation: the cards and their places are taken
// once, each card a unit with the effects of its own move. A unit may be the
// rule's own card; the guard then finds it where this plan put it. Replays
// apply the saved command. A move-all to ANOTHER board is not this command's.
// Pure: tested by tests/syncRuleMoveAllCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { effectsFor, validPlace } = require('./syncRuleMoveCommand');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-move-all-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const commandId = invocationId => sha256(canonical(['sync-rule-move-all', invocationId]));
const unitIdFor = (id, cardId) => sha256(canonical([id, 'unit', cardId]));

function isSameBoardMoveAll(action, boardId) {
  return !!action && action.actionType === 'moveAllCardsInList' && (action.boardId || boardId) === boardId;
}

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  if (!Number.isSafeInteger(index) || index < 0 || !isSameBoardMoveAll(invocation?.action, plan.boardId)) fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId,
    actionType: 'moveAllCardsInList' };
}

// The board the lists are on: the plan's, or - when an earlier move of this
// same plan took the rule's card to another board (2026-10-03) - that board,
// saved as `onBoard`; a command on the plan's board has none, as before.
const boardOf = command => command.onBoard || command.boardId;

function unitBase(base, cardId) {
  return { _id: unitIdFor(base._id, cardId), actorId: base.actorId, boardId: boardOf(base), cardId };
}

function unitFor(base, card, to, titles, createdAt, redoRows) {
  const reason = typeof card.lastMoveReason === 'string' ? card.lastMoveReason : '';
  const sort = Number.isFinite(card.sort) ? card.sort : null;
  const before = { listId: card.listId, swimlaneId: card.swimlaneId, sort, lastMoveReason: reason };
  // Card.move with no sort keeps the card's own; a list change resets the reason.
  const after = { listId: to.listId, swimlaneId: card.swimlaneId, sort, lastMoveReason: to.listId !== card.listId ? '' : reason };
  const unitTitles = { listName: titles.listName, swimlaneName: titles.swimlanes[card.swimlaneId] ?? '', cardTitle: card.title ?? '' };
  return { cardId: card._id, before, after, titles: unitTitles,
    effects: effectsFor({ base: unitBase(base, card._id), before, after, titles: unitTitles, createdAt, redoRows }) };
}

// Capture. `from` and `to` are the lists the ordinary action resolves by
// title ({ _id, title }); `cards` the cards of `from`; `swimlaneTitles` maps
// each of their swimlanes to its title (for the moveCard activities). Without
// both lists the ordinary action does nothing, and so does this command.
function prepareRuleMoveAllCommand({ plan, activity, effectId, index, from, to, cards = [], swimlaneTitles = {},
  createdAt, redoRows = [], cardBoardId = plan?.boardId }) {
  const identityBase = identity({ plan, activity, effectId, index });
  if (!text(cardBoardId)) fail('invalid');
  const base = cardBoardId === identityBase.boardId ? identityBase : { ...identityBase, onBoard: cardBoardId };
  if (!(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime()) || !Array.isArray(cards) ||
      cards.length > 10000) fail('invalid');
  const command = { ...base, createdAt: new Date(createdAt), units: [] };
  if (from && to) {
    if (!text(from._id) || !text(to._id) || cards.some(card => !card || !text(card._id) || card.boardId !== boardOf(base) ||
        card.listId !== from._id || !text(card.swimlaneId))) fail('invalid');
    const titles = { listName: String(to.title ?? ''), swimlanes: swimlaneTitles };
    command.units = cards.filter(card => card.listId !== to._id)
      .map(card => unitFor(base, card, { listId: to._id }, titles, createdAt, redoRows));
  }
  command.checksum = sha256(canonical(command));
  return validateRuleMoveAllCommand(command, { plan, activity, effectId, index });
}

function validateRuleMoveAllCommand(row, context) {
  const identityBase = identity(context);
  const elsewhere = !!row && Object.hasOwn(row, 'onBoard');
  const base = elsewhere ? { ...identityBase, onBoard: row.onBoard } : identityBase;
  const keys = [...Object.keys(base), 'createdAt', 'units', 'checksum'].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      (elsewhere && (typeof row.onBoard !== 'string' || !row.onBoard || row.onBoard === identityBase.boardId)) ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !(row.createdAt instanceof Date) || !Array.isArray(row.units) || row.units.length > 10000) fail('command-invalid');
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  const seen = new Set();
  for (const unit of row.units) {
    if (!unit || Object.keys(unit).sort().join(',') !== 'after,before,cardId,effects,titles' || !text(unit.cardId) ||
        seen.has(unit.cardId) || !validPlace(unit.before) || !validPlace(unit.after) ||
        unit.after.swimlaneId !== unit.before.swimlaneId || unit.after.sort !== unit.before.sort ||
        unit.after.listId === unit.before.listId || unit.after.lastMoveReason !== '') fail('command-invalid');
    seen.add(unit.cardId);
    const expected = effectsFor({ base: unitBase(base, unit.cardId), before: unit.before, after: unit.after, titles: unit.titles,
      createdAt: row.createdAt, redoRows: [] });
    if (expected.history) expected.history.redo = unit.effects.history ? unit.effects.history.redo : null;
    if (canonical(expected) !== canonical(unit.effects)) fail('command-invalid');
  }
  return copy(row);
}

// A unit's card at a saved place.
function unitSelector(command, unit, place) {
  return { _id: unit.cardId, boardId: boardOf(command), listId: place.listId, swimlaneId: place.swimlaneId,
    sort: place.sort === null ? null : { $eq: place.sort } };
}

module.exports = { commandId, unitIdFor, isSameBoardMoveAll, prepareRuleMoveAllCommand, validateRuleMoveAllCommand,
  unitSelector, boardOf };
