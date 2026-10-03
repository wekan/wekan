'use strict';
// Durable rule sortList (the structural rule actions of TODO Later). The
// ordinary action (server/rulesHelper.js) re-sorts the cards of the rule card's
// list - or the named list on the same board - in the rule card's swimlane, by
// name, creation, modification or due date (models/lib/ruleSortList.js), and
// gives each card its index as `sort` with a plain update. Each update the
// hook sees writes one `position` History row; there is no activity, and no
// card leaves its list.
//
// One saved command per rule invocation: the order is decided once at capture,
// and each card whose sort changes is a unit with its sort before and after and
// its planned position row. Replays apply the saved command, never the rule's
// current configuration. Pure: tested by tests/syncRuleSortListCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { prepareCardFieldHistory, RULE_CARD_POSITION_FIELDS } = require('./syncHistoryBatch');
const { sortListOrder } = require('../../models/lib/ruleSortList');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-sort-list-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const commandId = invocationId => sha256(canonical(['sync-rule-sort-list', invocationId]));
const unitEffectId = (id, cardId) => sha256(canonical(['sync-rule-sort-list-effect', id, cardId]));

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  if (!Number.isSafeInteger(index) || index < 0 || invocation?.action?.actionType !== 'sortList') fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId,
    actionType: 'sortList' };
}

const finiteOrNull = value => (Number.isFinite(value) ? value : null);
// The board the sorted list is on: the plan's, or - when an earlier move of
// this same plan took the card to another board (2026-10-03) - that board,
// saved as `onBoard`; a command on the plan's board has none, as before.
const boardOf = command => command.onBoard || command.boardId;
function placement(base, unit, sort) {
  return { _id: unit.cardId, boardId: boardOf(base), swimlaneId: unit.swimlaneId, listId: unit.listId, sort,
    lastMoveReason: unit.lastMoveReason };
}
function unitHistory(base, unit, createdAt, redoRows) {
  return prepareCardFieldHistory({ before: placement(base, unit, unit.before), after: placement(base, unit, unit.after),
    effectId: unitEffectId(base._id, unit.cardId), userId: base.actorId, createdAt, redoRows,
    fields: RULE_CARD_POSITION_FIELDS, entityId: unit.cardId, cardId: unit.cardId });
}

// Capture. `cards` are the cards List.cardsUnfiltered(swimlaneId) returns for
// the list the ordinary action resolves; `sortField` the action's.
function prepareRuleSortListCommand({ plan, activity, effectId, index, listId, swimlaneId, cards, sortField,
  createdAt, redoRows = [], cardBoardId = plan?.boardId }) {
  const identityBase = identity({ plan, activity, effectId, index });
  if (!text(cardBoardId)) fail('invalid');
  const base = cardBoardId === identityBase.boardId ? identityBase : { ...identityBase, onBoard: cardBoardId };
  if (!text(listId) || !Array.isArray(cards) || cards.length > 10000 ||
      cards.some(card => !card || !text(card._id) || card.boardId !== boardOf(base) || card.listId !== listId) ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('invalid');
  const units = sortListOrder(cards, sortField).map((card, i) => ({ cardId: card._id, listId: card.listId,
    swimlaneId: card.swimlaneId ?? null, lastMoveReason: typeof card.lastMoveReason === 'string' ? card.lastMoveReason : '',
    before: finiteOrNull(card.sort), after: i }))
    .filter(unit => unit.before !== unit.after)
    .map(unit => ({ ...unit, history: unitHistory(base, unit, createdAt, redoRows) }));
  const command = { ...base, listId, swimlaneId: swimlaneId ?? null, createdAt: new Date(createdAt), units };
  command.checksum = sha256(canonical(command));
  return validateRuleSortListCommand(command, { plan, activity, effectId, index });
}

function validateRuleSortListCommand(row, context) {
  const identityBase = identity(context);
  const elsewhere = !!row && Object.hasOwn(row, 'onBoard');
  const base = elsewhere ? { ...identityBase, onBoard: row.onBoard } : identityBase;
  const keys = [...Object.keys(base), 'listId', 'swimlaneId', 'createdAt', 'units', 'checksum'].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      (elsewhere && (!text(row.onBoard) || row.onBoard === identityBase.boardId)) ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !text(row.listId) || !(row.createdAt instanceof Date) || !Array.isArray(row.units) || row.units.length > 10000) {
    fail('command-invalid');
  }
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  const seen = new Set();
  for (const unit of row.units) {
    if (!unit || Object.keys(unit).sort().join(',') !== 'after,before,cardId,history,lastMoveReason,listId,swimlaneId' ||
        !text(unit.cardId) || seen.has(unit.cardId) || unit.listId !== row.listId ||
        !(unit.before === null || Number.isFinite(unit.before)) || !Number.isSafeInteger(unit.after) || unit.after < 0 ||
        unit.before === unit.after || typeof unit.lastMoveReason !== 'string') fail('command-invalid');
    seen.add(unit.cardId);
    // The saved row is what that sort change records, exactly.
    const expected = unitHistory(base, unit, row.createdAt, []);
    if (canonical(expected.rows) !== canonical(unit.history.rows)) fail('command-invalid');
  }
  return copy(row);
}

// The unit's card at a saved sort, in its list: a card with no usable sort
// was captured as null, which matches a missing or null sort.
function unitSelector(command, unit, sort) {
  return { _id: unit.cardId, boardId: boardOf(command), listId: unit.listId, sort: sort === null ? null : { $eq: sort } };
}

module.exports = { commandId, prepareRuleSortListCommand, validateRuleSortListCommand, unitSelector, boardOf };
