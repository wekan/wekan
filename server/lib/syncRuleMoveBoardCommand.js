'use strict';
// Durable rule moves to ANOTHER board (maintainer decision of 2026-10-02: a
// rule effect on another board is durable only when that board opted into
// Sync effects too). moveCardToTop / moveCardToBottom with the action's board
// set to another board: RulesHelper.moveCardTarget resolves the place there,
// and Card.move (models/cards.js) then writes, in one update,
//
//   * boardId, swimlaneId, listId, sort, and lastMoveReason '' (a rule gives no
//     reason); listEnteredAt is the before-update hook's;
//   * labelIds - the new board's labels with the names of the card's labels;
//   * cardNumber - the new board's next number;
//   * customFields - mapped to the new board (mapCustomFieldsToBoard, which
//     shares a definition the new board lacks);
//   * members and watchers - only the new board's active members, written only
//     when someone is dropped;
//   * cardDependencies - [] (dependencies only connect cards on one board);
//
// and its hooks write: one `position` History row and one row per changed
// group among labels, members, custom fields and dependencies
// (server/models/changeHistoryHooks.js); the moveCardBoard activity (cardMove);
// a set/unsetCustomField activity per custom field whose id changed
// (cardCustomFields); the card's addedLabel activities re-pointed at the new
// labels by position, or removed (updateActivities); the checklists' and items'
// boardId; the inbound dependencies of the cards left behind; the attachments'
// placement; and Card.move's legacy UserPositionHistory row.
//
// One saved command per rule invocation holds all of that, decided at capture.
// The runner applies the update conditionally with the hooks' records
// deferred, then writes each record from the command, idempotently.
//
// The plan's later actions act on the card on its new board, as the ordinary
// engine's do (2026-10-03, storedRulePlans.js ruleCardNow); eligibility
// (server/lib/listSyncSteps.js) lifts such a move only when every action that
// can follow it is one that follows the card. Pure: tested by
// tests/syncRuleMoveBoardCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { prepareCardFieldHistory, RULE_CARD_POSITION_FIELDS, RULE_CARD_MOVE_BOARD_FIELDS } = require('./syncHistoryBatch');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-move-board-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const RULE_MOVE_ACTIONS = ['moveCardToTop', 'moveCardToBottom'];
// The card fields a move to another board may change besides its place.
const MOVED_FIELDS = ['labelIds', 'cardNumber', 'customFields', 'members', 'watchers', 'cardDependencies', 'scrum',
  'scrumRevision'];
const { movedScrumMetadata } = require('../../models/lib/scrumCopy');

const commandId = invocationId => sha256(canonical(['sync-rule-move-board', invocationId]));
const effectIdFor = (id, part) => sha256(canonical(['sync-rule-move-board-effect', id, part]));
const legacyIdFor = id => `sync-rule-move-board-${sha256(canonical([id, 'user-position']))}`;

function isOtherBoardMove(action, boardId) {
  return !!action && RULE_MOVE_ACTIONS.includes(action.actionType) && text(action.boardId) && action.boardId !== boardId;
}

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  const action = invocation?.action;
  // Later actions of the plan follow the card (2026-10-03); eligibility lets
  // only those that can follow it into a plan with such a move.
  if (!Number.isSafeInteger(index) || index < 0 || !isOtherBoardMove(action, plan.boardId)) fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId,
    actionType: action.actionType, targetBoardId: action.boardId };
}

// The fields among MOVED_FIELDS the card has (absent ones stay absent).
function presentFields(card) {
  return Object.fromEntries(MOVED_FIELDS.filter(field => card[field] !== undefined).map(field => [field, copy(card[field])]));
}

// Card.move's members and watchers: only the new board's active members, and
// only written when someone is dropped.
function filtered(list, allowed) {
  const current = Array.isArray(list) ? list : [];
  const kept = current.filter(id => allowed.includes(id));
  return kept.length === current.length ? undefined : kept;
}

// updateActivities (models/cards.js), once: each addedLabel activity of the
// card is re-pointed at the new label at the same position, or removed.
function labelActivityRewrites(activities, oldLabelIds, newLabelIds, boardId) {
  return activities.map(({ _id, labelId }) => {
    const at = (oldLabelIds || []).indexOf(labelId);
    return at !== -1 && newLabelIds.length > at ? { _id, labelId: newLabelIds[at], boardId } : { _id, remove: true };
  });
}

// cardCustomFields (models/cards.js): one activity per custom field id whose
// value differs, compared by id.
function customFieldActivities(base, before, after, place, createdAt) {
  const values = list => new Map((list || []).filter(field => field && typeof field._id === 'string')
    .map(field => [field._id, field.value ?? null]));
  const was = values(before), is = values(after), rows = [];
  for (const customFieldId of new Set([...was.keys(), ...is.keys()])) {
    const value = is.get(customFieldId) ?? null;
    if (canonical(was.get(customFieldId) ?? null) === canonical(value)) continue;
    const receiptId = sha256(canonical([base._id, 'custom-field', customFieldId]));
    rows.push({ receiptId, activity: { _id: `sync-rule-move-board-${receiptId}`, userId: base.actorId, customFieldId,
      ...(value === null ? {} : { value }), activityType: value === null ? 'unsetCustomField' : 'setCustomField',
      boardId: base.targetBoardId, cardId: base.cardId, listId: place.listId, swimlaneId: place.swimlaneId,
      createdAt: new Date(createdAt), modifiedAt: new Date(createdAt) } });
  }
  return rows;
}

function effectsFor({ base, before, after, titles, labelActivities, createdAt, redoRows }) {
  const position = prepareCardFieldHistory({
    before: { _id: base.cardId, ...before.place }, after: { _id: base.cardId, ...after.place },
    effectId: effectIdFor(base._id, 'position'), userId: base.actorId, createdAt, redoRows,
    fields: RULE_CARD_POSITION_FIELDS });
  const fields = prepareCardFieldHistory({
    before: { _id: base.cardId, ...before.place, ...before.fields }, after: { _id: base.cardId, ...after.place, ...after.fields },
    effectId: effectIdFor(base._id, 'fields'), userId: base.actorId, createdAt, redoRows: [],
    fields: RULE_CARD_MOVE_BOARD_FIELDS });
  const state = place => ({ boardId: place.boardId, swimlaneId: place.swimlaneId, listId: place.listId, sort: place.sort });
  const userPosition = { _id: legacyIdFor(base._id), userId: base.actorId, boardId: base.boardId, entityType: 'card',
    entityId: base.cardId, actionType: 'move', previousState: state(before.place), newState: state(after.place),
    previousSort: before.place.sort, previousSwimlaneId: before.place.swimlaneId, previousListId: before.place.listId,
    previousBoardId: base.boardId, newSort: after.place.sort, newSwimlaneId: after.place.swimlaneId,
    newListId: after.place.listId, newBoardId: base.targetBoardId, createdAt: new Date(createdAt), isCheckpoint: false,
    undone: false };
  const receiptId = sha256(canonical([base._id, 'activity']));
  // cardMove's moveCardBoard activity. It names no list; durable delivery takes
  // such board-level activities (2026-10-03), and no rule trigger exists for it
  // (server/triggersDef.js).
  const move = { _id: `sync-rule-move-board-${receiptId}`, userId: base.actorId, activityType: 'moveCardBoard',
    moveReason: '', boardName: titles.boardName, boardId: base.targetBoardId, oldBoardId: base.boardId,
    oldBoardName: titles.oldBoardName, cardId: base.cardId, swimlaneName: titles.swimlaneName,
    swimlaneId: after.place.swimlaneId, oldSwimlaneId: before.place.swimlaneId,
    createdAt: new Date(createdAt), modifiedAt: new Date(createdAt) };
  return { history: [position, fields], userPosition, move,
    customFields: customFieldActivities(base, before.fields.customFields, after.fields.customFields, after.place, createdAt),
    labelActivities: labelActivityRewrites(labelActivities, before.fields.labelIds, after.fields.labelIds,
      base.targetBoardId) };
}

// One card's move, as Card.move makes it. `base` names it: { _id, actorId,
// boardId, targetBoardId, cardId } - the command's, or a move-all unit's.
//   card       - the card (raw document) on the board it leaves;
//   target     - { boardId, listId, swimlaneId, sort } (sort null: its own);
//   mapped     - { labelIds, cardNumber, customFields } for the target board;
//   allowedMemberIds - the target board's active members;
//   titles     - { boardName, oldBoardName, swimlaneName } for the activity;
//   labelActivities - the card's addedLabel activities, { _id, labelId };
//   redoRows   - the actor's undone History rows on the target board.
function buildMove({ base, card, target, mapped, allowedMemberIds, titles, labelActivities = [], createdAt,
  redoRows = [] }) {
  if (!card || card._id !== base.cardId || card.boardId !== base.boardId || !text(card.listId) || !text(card.swimlaneId) ||
      !target || target.boardId !== base.targetBoardId || !text(target.listId) || !text(target.swimlaneId) ||
      !(target.sort === null || Number.isFinite(target.sort)) || !mapped || !Array.isArray(mapped.labelIds) ||
      !Array.isArray(mapped.customFields) || !Number.isSafeInteger(mapped.cardNumber) ||
      !Array.isArray(allowedMemberIds) || !titles ||
      !Array.isArray(labelActivities) || labelActivities.some(row => !row || !text(row._id)) ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('invalid');
  const sort = Number.isFinite(card.sort) ? card.sort : null;
  const before = { place: { boardId: base.boardId, listId: card.listId, swimlaneId: card.swimlaneId, sort,
    lastMoveReason: typeof card.lastMoveReason === 'string' ? card.lastMoveReason : '' },
  fields: presentFields(card) };
  const fields = { labelIds: copy(mapped.labelIds), cardNumber: mapped.cardNumber, customFields: copy(mapped.customFields),
    cardDependencies: [], ...copy(movedScrumMetadata(card, base.targetBoardId, mapped.scrumPlanning || null)) };
  for (const field of ['members', 'watchers']) {
    const kept = filtered(card[field], allowedMemberIds);
    if (kept !== undefined) fields[field] = kept;
    else if (card[field] !== undefined) fields[field] = copy(card[field]);
  }
  // Card.move without a sort keeps the card's own.
  const after = { place: { boardId: base.targetBoardId, listId: target.listId, swimlaneId: target.swimlaneId,
    sort: target.sort === null ? sort : target.sort, lastMoveReason: '' }, fields };
  const savedTitles = { boardName: String(titles.boardName ?? ''), oldBoardName: String(titles.oldBoardName ?? ''),
    swimlaneName: String(titles.swimlaneName ?? '') };
  const savedLabels = labelActivities.map(row => ({ _id: row._id, labelId: row.labelId ?? null }));
  return { before, after, titles: savedTitles, labelActivities: savedLabels,
    effects: effectsFor({ base, before, after, titles: savedTitles, labelActivities: savedLabels, createdAt, redoRows }) };
}

function validPlace(place, boardId) {
  return !!place && Object.keys(place).sort().join(',') === 'boardId,lastMoveReason,listId,sort,swimlaneId' &&
    place.boardId === boardId && text(place.listId) && text(place.swimlaneId) &&
    (place.sort === null || Number.isFinite(place.sort)) && typeof place.lastMoveReason === 'string';
}

// A saved move: its places and fields, and the effects they make.
function validMove(move, base, createdAt) {
  if (!move.before || !move.after ||
      !validPlace(move.before.place, base.boardId) || !validPlace(move.after.place, base.targetBoardId) ||
      move.after.place.lastMoveReason !== '' ||
      [move.before.fields, move.after.fields].some(fields => !fields ||
        Object.keys(fields).some(key => !MOVED_FIELDS.includes(key))) ||
      !Array.isArray(move.after.fields.labelIds) || !Array.isArray(move.after.fields.customFields) ||
      !Number.isSafeInteger(move.after.fields.cardNumber) || canonical(move.after.fields.cardDependencies) !== canonical([]) ||
      !move.titles || Object.keys(move.titles).sort().join(',') !== 'boardName,oldBoardName,swimlaneName' ||
      !Array.isArray(move.labelActivities)) return false;
  // The saved effects are what this move writes (the redo targets are the
  // capture's, checked when they are written).
  const expected = effectsFor({ base, before: move.before, after: move.after, titles: move.titles,
    labelActivities: move.labelActivities, createdAt, redoRows: [] });
  expected.history[0].redo = move.effects?.history?.[0]?.redo ?? null;
  return canonical(expected) === canonical(move.effects);
}

// The board a single move takes the card from: the plan's, or - when an
// earlier move of this same plan already took it to another board
// (2026-10-03) - that board, saved as `fromBoard`. A command from the plan's
// board has none, as before; a move onto the board the card is on is refused.
const fromBoardOf = command => command.fromBoard || command.boardId;
const moveBaseOf = (base, row) => (row && row.fromBoard ? { ...base, boardId: row.fromBoard } : base);

// Capture of a single move: `target` is RulesHelper.moveCardTarget's.
function prepareRuleMoveBoardCommand({ plan, activity, effectId, index, target, createdAt, fromBoardId = plan?.boardId, ...rest }) {
  const base = identity({ plan, activity, effectId, index });
  if (!target || !Number.isFinite(target.sort) || !text(fromBoardId) || fromBoardId === base.targetBoardId) fail('invalid');
  const moved = fromBoardId === base.boardId ? {} : { fromBoard: fromBoardId };
  const command = { ...base, ...moved, ...buildMove({ base: moveBaseOf(base, moved), target, createdAt, ...rest }),
    createdAt: new Date(createdAt) };
  command.checksum = sha256(canonical(command));
  return validateRuleMoveBoardCommand(command, { plan, activity, effectId, index });
}

function validateRuleMoveBoardCommand(row, context) {
  const base = identity(context);
  const elsewhere = !!row && Object.hasOwn(row, 'fromBoard');
  const keys = [...Object.keys(base), ...(elsewhere ? ['fromBoard'] : []), 'before', 'after', 'titles', 'labelActivities',
    'createdAt', 'effects', 'checksum'].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      (elsewhere && (!text(row.fromBoard) || row.fromBoard === base.boardId || row.fromBoard === base.targetBoardId)) ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !(row.createdAt instanceof Date) || !Number.isFinite(row.after?.place?.sort)) fail('command-invalid');
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content)) || !validMove(row, moveBaseOf(base, row), row.createdAt)) fail('command-invalid');
  return copy(row);
}

// moveAllCardsInList onto another board (server/rulesHelper.js): every card
// of the list named fromListName on the plan's board goes to the list named
// listName there, each through Card.move with its own swimlane and no sort -
// so it keeps its sort, and the update's consistency hook
// (server/lib/cardBoardConsistency.js) puts it in that board's default
// swimlane, its own being on the board it leaves. One unit per card, each a
// whole move with its own records; the rule's own card may be among them, and
// later actions follow it like a single move's.
const moveAllCommandId = invocationId => sha256(canonical(['sync-rule-move-all-board', invocationId]));
const unitIdFor = (id, cardId) => sha256(canonical([id, 'unit', cardId]));
function isOtherBoardMoveAll(action, boardId) {
  return !!action && action.actionType === 'moveAllCardsInList' && text(action.boardId) && action.boardId !== boardId;
}
function moveAllIdentity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  const action = invocation?.action;
  if (!Number.isSafeInteger(index) || index < 0 || !isOtherBoardMoveAll(action, plan.boardId)) fail('invalid');
  return { _id: moveAllCommandId(invocation.id), version: 1, invocationId: invocation.id,
    planId: planId(effectId, activity._id), planHash: sha256(canonical(plan)), actorId: plan.actorId,
    boardId: plan.boardId, cardId: plan.cardId, actionType: 'moveAllCardsInList', targetBoardId: action.boardId };
}
// Each unit leaves the board the list is on: the plan's, or - when an
// earlier move of this same plan took the rule's card to another board
// (2026-10-03) - that board, saved as `fromBoard` as a single move saves it.
const unitBase = (base, cardId) => ({ _id: unitIdFor(base._id, cardId), actorId: base.actorId,
  boardId: base.fromBoard || base.boardId, targetBoardId: base.targetBoardId, cardId });

// Capture: `moves` are one { card, target, mapped, allowedMemberIds, titles,
// labelActivities } per card of the list, in order; none when the ordinary
// action would move nothing (no list to move from or to).
function prepareRuleMoveAllBoardCommand({ plan, activity, effectId, index, moves = [], createdAt, redoRows = [],
  fromBoardId = plan?.boardId }) {
  const identityBase = moveAllIdentity({ plan, activity, effectId, index });
  if (!Array.isArray(moves) || moves.length > 10000 || !(createdAt instanceof Date) || !text(fromBoardId) ||
      fromBoardId === identityBase.targetBoardId) fail('invalid');
  const base = fromBoardId === identityBase.boardId ? identityBase : { ...identityBase, fromBoard: fromBoardId };
  const units = moves.map((move, i) => ({ cardId: move.card?._id,
    ...buildMove({ base: unitBase(base, move.card?._id), createdAt, ...move, redoRows: i === 0 ? redoRows : [] }) }));
  const command = { ...base, createdAt: new Date(createdAt), units };
  command.checksum = sha256(canonical(command));
  return validateRuleMoveAllBoardCommand(command, { plan, activity, effectId, index });
}

function validateRuleMoveAllBoardCommand(row, context) {
  const identityBase = moveAllIdentity(context);
  const elsewhere = !!row && Object.hasOwn(row, 'fromBoard');
  const base = elsewhere ? { ...identityBase, fromBoard: row.fromBoard } : identityBase;
  const keys = [...Object.keys(base), 'createdAt', 'units', 'checksum'].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      (elsewhere && (!text(row.fromBoard) || row.fromBoard === identityBase.boardId || row.fromBoard === identityBase.targetBoardId)) ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !(row.createdAt instanceof Date) || !Array.isArray(row.units) || row.units.length > 10000) fail('command-invalid');
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  const seen = new Set();
  for (const unit of row.units) {
    if (!unit || Object.keys(unit).sort().join(',') !== 'after,before,cardId,effects,labelActivities,titles' ||
        !text(unit.cardId) || seen.has(unit.cardId) || unit.after.place.sort !== unit.before.place.sort ||
        !validMove(unit, unitBase(base, unit.cardId), row.createdAt)) fail('command-invalid');
    seen.add(unit.cardId);
  }
  return copy(row);
}

// A unit as the selectors and modifier below read a command.
const unitMove = (command, unit) => ({ ...unit, actorId: command.actorId, boardId: command.fromBoard || command.boardId });

const placeOf = (command, place) => ({ _id: command.cardId, boardId: place.boardId, listId: place.listId,
  swimlaneId: place.swimlaneId, sort: place.sort === null ? null : { $eq: place.sort } });
// The card as captured: its place and the fields the move maps, exactly as
// they were read (an absent field matching only an absent one), so a card
// changed since capture is not moved with a stale mapping.
function beforeSelector(command) {
  const selector = placeOf(command, command.before.place);
  for (const field of MOVED_FIELDS) {
    const fields = command.before.fields;
    selector[field] = Object.hasOwn(fields, field) ? { $eq: fields[field] } : { $exists: false };
  }
  return selector;
}
// The card moved: at its new place under the number taken for it. The mapped
// arrays are not compared - the schema may normalise them on write.
function afterSelector(command) {
  return { ...placeOf(command, command.after.place), cardNumber: command.after.fields.cardNumber };
}
// Card.move's update: the place, the reason and every moved field.
function moveModifier(command) {
  const { place, fields } = command.after;
  return { $set: { boardId: place.boardId, swimlaneId: place.swimlaneId, listId: place.listId,
    ...(place.sort === null ? {} : { sort: place.sort }), lastMoveReason: '', ...copy(fields) } };
}

module.exports = { RULE_MOVE_ACTIONS, MOVED_FIELDS, commandId, legacyIdFor, isOtherBoardMove, labelActivityRewrites,
  prepareRuleMoveBoardCommand, validateRuleMoveBoardCommand, beforeSelector, afterSelector, moveModifier, fromBoardOf,
  moveAllCommandId, unitIdFor, isOtherBoardMoveAll, prepareRuleMoveAllBoardCommand, validateRuleMoveAllBoardCommand,
  unitMove };
