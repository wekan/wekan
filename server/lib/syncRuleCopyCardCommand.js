'use strict';
// Durable rule copyCard (the structural rule actions of TODO Later). The ordinary action (server/lib/ruleCopyCard.js -> Card.copy
// in models/cards.js) inserts a copy of the card at the bottom of the named
// list and swimlane, then copies its live attachments (the files too), its
// checklists and their items, its subtasks with their checklists, and its
// comments. Of those inserts only three run hooks that record anything:
//   * the copy and each subtask copy: the creation hook's createCard activity;
//   * each attachment copy: its History lifecycle row 'added'.
// Checklists, items and comments are copied with direct inserts, no hooks.
//
// One saved command per rule invocation. Everything the copy will contain is
// decided at capture from the source as it is then, and every document it
// inserts has an id derived from the invocation, so a replay inserts each one
// once. The activities are known before the inserts and saved with the
// command; the attachments' History rows hold the stored document, so they are
// recorded right after the attachments are copied, once.
//
// A copy to ANOTHER board (maintainer decision of 2026-10-02: durable only when
// that board opted into Sync effects too, server/lib/listSyncSteps.js) is the
// same command with that board as `targetBoardId`. Card.copy then maps the
// labels by name and the custom fields to that board, and takes its card
// number; the caller resolves those as it does, and passes them as
// `crossBoard: { labelIds, customFields }`. Everything copied lives on that
// board. Pure: tested by tests/syncRuleCopyCardCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { cardCreationActivity } = require('../../models/lib/cardCreationActivity');
const { prepareChecklistLifecycleHistory } = require('./syncHistoryBatch');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-copy-card-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const commandId = invocationId => sha256(canonical(['sync-rule-copy-card', invocationId]));
const derivedId = (id, kind, sourceId) => sha256(canonical([id, kind, sourceId])).slice(0, 24);
// An attachment id is the file id Meteor-Files stores: a 24-hex ObjectId string.
const attachmentIdFor = (id, sourceId) => sha256(canonical([id, 'attachment', sourceId])).slice(0, 24);

// Whether the action copies onto the card's own board: only then is it durable.
function isSameBoardCopy(action, boardId) {
  return !!action && action.actionType === 'copyCard' && (action.boardId || boardId) === boardId;
}

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  const action = invocation?.action;
  // A legacy action without a board copies onto the card's own board.
  const targetBoardId = action?.boardId || plan.boardId;
  if (!Number.isSafeInteger(index) || index < 0 || action?.actionType !== 'copyCard' || !text(targetBoardId)) fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId,
    actionId: action._id, actionType: 'copyCard', targetBoardId };
}

function creationActivity(base, card, destination, createdAt, kind) {
  const receiptId = sha256(canonical([base._id, kind, card._id]));
  return { receiptId, activity: { _id: `sync-rule-copy-card-${receiptId}`,
    ...cardCreationActivity(base.actorId, card, { title: destination.listTitle }, { title: destination.swimlaneTitle }),
    createdAt: new Date(createdAt), modifiedAt: new Date(createdAt) } };
}

// Capture. The caller resolved, as the ordinary copy does:
//   card        - the source card (raw document);
//   destination - { listId, swimlaneId, listTitle, swimlaneTitle } on the target board;
//   cardNumber  - the board's next card number; sort - the bottom of the list;
//   customFieldIds - the custom fields the actor may read (null: all);
//   dependencies   - the card's dependencies, normalised, whose target is on
//                    the target board (the ones Card.copy keeps);
//   crossBoard  - for another board only: { labelIds, customFields } as
//                 Card.copy maps them there (customFields already limited to
//                 the ones the actor may read);
//   scrum       - models/lib/scrumCopy.js's copy of the card's Scrum metadata;
//   attachments, checklists, items, subtasks, subtaskChecklists, subtaskItems,
//   comments    - the source documents the ordinary copy reads;
//   subtaskDocs - buildCopiedSubtaskFields() of each subtask, in order;
//   commentDocs - buildCopiedComment() of each comment, in order.
// `noop` records that the ordinary action would have copied nothing (its own
// preconditions failed, or this copy would repeat itself down a copy chain).
function prepareRuleCopyCardCommand({ plan, activity, effectId, index, noop = false, card, destination, cardNumber, sort,
  customFieldIds = null, dependencies = [], scrum = {}, attachments = [], checklists = [], items = [],
  subtaskDocs = [], subtaskSources = [], subtaskChecklists = [], subtaskItems = [], commentDocs = [], comments = [],
  crossBoard = null, createdAt }) {
  const base = identity({ plan, activity, effectId, index });
  if (!(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('invalid');
  const command = { ...base, createdAt: new Date(createdAt), noop: Boolean(noop) };
  if (!noop) {
    if (!card || card._id !== base.cardId || card.boardId !== base.boardId || !destination ||
        !text(destination.listId) || !text(destination.swimlaneId) || typeof destination.listTitle !== 'string' ||
        typeof destination.swimlaneTitle !== 'string' || !Number.isSafeInteger(cardNumber) || !Number.isFinite(sort) ||
        subtaskDocs.length !== subtaskSources.length || commentDocs.length !== comments.length) fail('invalid');
    const elsewhere = base.targetBoardId !== base.boardId;
    if (elsewhere !== Boolean(crossBoard) || (crossBoard && (!Array.isArray(crossBoard.labelIds) ||
        !Array.isArray(crossBoard.customFields)))) fail('invalid');
    const newCardId = derivedId(base._id, 'card', card._id);
    // Card.copy's document.
    const doc = { ...copy(card) };
    for (const key of ['_id', '__id', 'scrum', 'scrumRevision', 'syncExternalId', 'syncSourceType', 'syncSourceKey',
      'syncLastSource']) delete doc[key];
    Object.assign(doc, copy(scrum));
    doc.customFields = (Array.isArray(doc.customFields) ? doc.customFields : [])
      .filter(field => !customFieldIds || customFieldIds.includes(field._id));
    if (crossBoard) Object.assign(doc, { labelIds: copy(crossBoard.labelIds), customFields: copy(crossBoard.customFields) });
    doc.cardDependencies = copy(dependencies);
    Object.assign(doc, { _id: newCardId, boardId: base.targetBoardId, swimlaneId: destination.swimlaneId,
      listId: destination.listId, cardNumber, sort });
    const sourceCoverId = card.coverId;
    const copiedCover = sourceCoverId && attachments.some(file => file._id === sourceCoverId)
      ? attachmentIdFor(base._id, sourceCoverId) : null;
    delete doc.coverId;
    const checklistIdOf = id => derivedId(base._id, 'checklist', id);
    const subtaskIdOf = id => derivedId(base._id, 'subtask', id);
    command.card = doc;
    command.coverId = copiedCover;
    command.cardActivity = creationActivity(base, doc, destination, createdAt, 'card');
    command.attachments = attachments.map(file => ({ sourceId: file._id, attachmentId: attachmentIdFor(base._id, file._id) }));
    const checklistDocs = (list, cardId) => list.map(source => ({ ...copy(source), _id: checklistIdOf(source._id),
      cardId, boardId: base.targetBoardId, createdAt: new Date(createdAt) }));
    const itemDocs = (list, cardIdOf) => list.map(source => ({ ...copy(source), _id: derivedId(base._id, 'item', source._id),
      checklistId: checklistIdOf(source.checklistId), cardId: cardIdOf(source), boardId: base.targetBoardId }));
    command.checklists = checklistDocs(checklists, newCardId);
    command.items = itemDocs(items, () => newCardId);
    command.subtasks = subtaskDocs.map((subtaskDoc, i) => {
      const subtaskCard = { ...copy(subtaskDoc), _id: subtaskIdOf(subtaskSources[i]._id), parentId: newCardId };
      return { card: subtaskCard, ...creationActivity(base, subtaskCard, destination, createdAt, 'subtask') };
    });
    const subtaskOf = new Map(subtaskSources.map(source => [source._id, subtaskIdOf(source._id)]));
    command.subtaskChecklists = subtaskChecklists.map(source => ({ ...copy(source), _id: checklistIdOf(source._id),
      cardId: subtaskOf.get(source.cardId), boardId: base.targetBoardId, createdAt: new Date(createdAt) }));
    command.subtaskItems = itemDocs(subtaskItems, source => subtaskOf.get(source.cardId));
    command.comments = commentDocs.map((commentDoc, i) => ({ ...copy(commentDoc), _id: derivedId(base._id, 'comment', comments[i]._id),
      cardId: newCardId, boardId: base.targetBoardId }));
    command.recorded = null;
  }
  command.checksum = sha256(canonical(withoutRecorded(command)));
  return validateRuleCopyCardCommand(command, { plan, activity, effectId, index });
}

function withoutRecorded(row) {
  const { checksum, recorded, ...content } = row;
  return content;
}

// The second phase: each copied attachment's History row, from the attachment
// as it was stored. Saved once on the command; a replay reuses it.
function recordCopiedAttachments(command, stored) {
  if (command.noop || !Array.isArray(stored) || stored.length !== command.attachments.length ||
      stored.some((file, i) => !file || file._id !== command.attachments[i].attachmentId ||
        file.meta?.cardId !== command.card._id)) fail('invalid');
  const where = { boardId: command.card.boardId, listId: command.card.listId, swimlaneId: command.card.swimlaneId,
    cardId: command.card._id };
  return stored.map(file => prepareChecklistLifecycleHistory({ documents: [file], changeType: 'added', where,
    effectId: sha256(canonical([command._id, 'attachment-history', file._id])), userId: command.actorId,
    createdAt: command.createdAt, entityType: 'attachment' }));
}

function validateRuleCopyCardCommand(row, context) {
  const base = identity(context);
  const keys = row?.noop ? [...Object.keys(base), 'createdAt', 'noop', 'checksum']
    : [...Object.keys(base), 'createdAt', 'noop', 'card', 'coverId', 'cardActivity', 'attachments', 'checklists', 'items',
      'subtasks', 'subtaskChecklists', 'subtaskItems', 'comments', 'recorded', 'checksum'];
  if (!row || Object.keys(row).sort().join(',') !== keys.sort().join(',') ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !(row.createdAt instanceof Date) || typeof row.noop !== 'boolean') fail('command-invalid');
  if (row.checksum !== sha256(canonical(withoutRecorded(row)))) fail('command-invalid');
  if (row.noop) return copy(row);
  const card = row.card;
  if (!card || card._id !== derivedId(base._id, 'card', base.cardId) || card.boardId !== base.targetBoardId ||
      !text(card.listId) || !text(card.swimlaneId)) fail('command-invalid');
  const destination = { listTitle: row.cardActivity?.activity?.listName, swimlaneTitle: row.cardActivity?.activity?.swimlaneName };
  if (canonical(creationActivity(base, card, destination, row.createdAt, 'card')) !== canonical(row.cardActivity)) {
    fail('command-invalid');
  }
  for (const subtask of row.subtasks) {
    if (!subtask?.card || subtask.card.boardId !== base.targetBoardId || subtask.card.parentId !== card._id ||
        canonical(creationActivity(base, subtask.card, destination, row.createdAt, 'subtask')) !==
          canonical({ receiptId: subtask.receiptId, activity: subtask.activity })) fail('command-invalid');
  }
  const ownCards = new Set([card._id, ...row.subtasks.map(subtask => subtask.card._id)]);
  const checklistIds = new Set([...row.checklists, ...row.subtaskChecklists].map(list => list._id));
  if ([...row.checklists, ...row.subtaskChecklists].some(list => !ownCards.has(list.cardId) ||
        list.boardId !== base.targetBoardId) ||
      [...row.items, ...row.subtaskItems].some(item => item.boardId !== base.targetBoardId) ||
      [...row.items, ...row.subtaskItems].some(item => !ownCards.has(item.cardId) || !checklistIds.has(item.checklistId)) ||
      row.comments.some(comment => comment.cardId !== card._id || comment.boardId !== base.targetBoardId) ||
      row.attachments.some(file => file.attachmentId !== attachmentIdFor(base._id, file.sourceId)) ||
      (row.coverId !== null && !row.attachments.some(file => file.attachmentId === row.coverId))) fail('command-invalid');
  if (row.recorded !== null) {
    if (!Array.isArray(row.recorded) || row.recorded.length !== row.attachments.length) fail('command-invalid');
    const stored = row.recorded.map(plan => plan?.rows?.[0]?.newContent?.document);
    let expected;
    try { expected = recordCopiedAttachments(row, stored); } catch { fail('command-invalid'); }
    if (canonical(expected) !== canonical(copy(row.recorded))) fail('command-invalid');
  }
  return copy(row);
}

module.exports = { commandId, derivedId, attachmentIdFor, isSameBoardCopy, prepareRuleCopyCardCommand,
  recordCopiedAttachments, validateRuleCopyCardCommand };
