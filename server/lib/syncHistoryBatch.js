'use strict';
const { diffFields, groupForField, valueFromContent } = require('../../models/lib/changeHistoryGroups');
const { positionChange } = require('../../models/lib/timeHistory');
const { canonical, sha256, rowHashIsValid, PROTECTED } = require('../../models/lib/changeHistoryIntegrity');
const { prepareSyncOperationMutation } = require('./syncOperationMutation');
const { EJSON } = require('bson');
const { syncOperationEffectId } = require('./syncOperationApply');
const { exactFieldSelector } = require('../../models/lib/exactFieldSelector');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-history-plan-invalid'); };

// Old History rows predate integrity hashing. Keep their exact observed
// payload privately; never install a retroactive hash or accept a damaged one.
const unhashed = row => row && (!Object.hasOwn(row, 'integrityHash') ||
  row.integrityHash === null || row.integrityHash === '');
function legacySnapshot(row) {
  const snapshot = { ...row };
  delete snapshot.superseded;
  return snapshot;
}
function redoTarget(row) {
  if (!row || row.undone !== true || row.superseded === true) fail();
  const legacyRow = unhashed(row) ? legacySnapshot(row) : null;
  if (!legacyRow && !rowHashIsValid(row)) fail();
  if (legacyRow && canonical(copy(legacyRow)) !== canonical(legacyRow)) fail();
  return { _id: row._id, boardId: row.boardId, userId: row.userId,
    undoneAt: row.undoneAt, ...(legacyRow
      ? { legacyRow, snapshotHash: sha256(canonical(legacyRow)) }
      : { integrityHash: row.integrityHash }) };
}

// Prepare BEFORE mutation and persist this exact plan in the owning journal.
// The caller supplies the redo candidates; retries never invalidate newly
// undone rows.
//
// The rows are CONTENT only (maintainer decision of 2026-09-30): no
// previousHash and no integrityHash. Each row is linked to the board's chain
// when it is appended (persistSyncFieldHistory), exactly like an ordinary
// edit, so a plan never holds the chain between planning and writing and
// ordinary History is never blocked or queued behind a Sync batch.
// The card fields a planned History row may record: Sync's own, and the ones
// durable rule card actions change (server/lib/syncRuleCardCommand.js).
const SYNC_FIELDS = ['title', 'description', 'spentTime', 'customFields', 'archived'];
const RULE_CARD_FIELDS = ['labelIds', 'color', 'dueComplete', 'startAt', 'endAt', 'dueAt', 'receivedAt', 'members'];
// ...and the checklist item field durable rule checklist actions change
// (server/lib/syncRuleChecklistCommand.js), recorded on the item.
const RULE_CHECKLIST_ITEM_FIELDS = ['isFinished'];
// ...and a card's placement, which durable rule moves change
// (server/lib/syncRuleMoveCommand.js). It is not a field: the hook records one
// `position` row for boardId, swimlaneId, listId and sort together
// (models/lib/timeHistory.js positionChange), and so does the plan.
const RULE_CARD_POSITION_FIELDS = ['position'];
// ...and the fields a durable rule move to another board maps there
// (server/lib/syncRuleMoveBoardCommand.js), each recorded in its group as the
// hook records it.
const RULE_CARD_MOVE_BOARD_FIELDS = ['labelIds', 'members', 'customFields', 'cardDependencies'];
// ...and a checklist's creation or removal, which durable rule addChecklist
// and removeChecklist record (server/lib/syncRuleChecklistLifecycleCommand.js):
// one lifecycle row per checklist, holding the whole document as the hook
// does (server/models/changeHistoryHooks.js recordLifecycle).
const RULE_CHECKLIST_LIFECYCLE = ['checklist-lifecycle'];
const POSITION_KEYS = 'boardId,lastMoveReason,listId,sort,swimlaneId';
const entityOf = fields => (fields === RULE_CHECKLIST_ITEM_FIELDS ? 'checklistItem'
  : fields === RULE_CHECKLIST_LIFECYCLE ? 'checklist'
    : [SYNC_FIELDS, RULE_CARD_FIELDS, RULE_CARD_POSITION_FIELDS, RULE_CARD_MOVE_BOARD_FIELDS].includes(fields) ? 'card' : fail());
const lifecycleRowId = (effectId, entityId) => `sync-history-${sha256(canonical([effectId, 'lifecycle', entityId]))}`;
// The rows one checklist creation or removal records. `documents` are the
// checklists as stored (the JSON round trip the hook makes), `where` the card's
// placement the hook locates them by.
function prepareChecklistLifecycleHistory({ documents, changeType, where, effectId, userId, createdAt, redoRows = [],
  entityType = 'checklist' }) {
  if (!['checklist', 'checklistItem', 'attachment'].includes(entityType) ||
      !/^[a-f0-9]{64}$/.test(effectId) || typeof userId !== 'string' || !userId || !Array.isArray(documents) ||
      !['added', 'removed'].includes(changeType) || !where || !(createdAt instanceof Date) ||
      !Number.isFinite(createdAt.getTime())) fail();
  const rows = documents.map(document => {
    const snapshot = JSON.parse(JSON.stringify(document));
    return { _id: lifecycleRowId(effectId, snapshot._id), boardId: where.boardId, swimlaneId: where.swimlaneId ?? null,
      listId: where.listId, cardId: where.cardId, entityType, entityId: snapshot._id,
      group: entityType === 'attachment' ? 'attachments' : 'checklists',
      changeType, previousContent: changeType === 'removed' ? { document: snapshot } : null,
      newContent: changeType === 'added' ? { document: snapshot } : null,
      userId, batchId: `sync-${effectId}`, restoredFromId: null, restoredByUserId: null, createdAt: new Date(createdAt),
      undone: false, undoneAt: null, superseded: false, isCheckpoint: false };
  });
  if (!Array.isArray(redoRows) || redoRows.length > 10000) fail();
  const plan = { effectId, boardId: where.boardId, userId, rows, redo: rows.length ? redoRows.map(redoTarget) : [] };
  validatePlan(plan, RULE_CHECKLIST_LIFECYCLE);
  return copy(plan);
}
function prepareSyncFieldHistory({ step, effectId, userId, createdAt, redoRows = [], ...rest }) {
  prepareSyncOperationMutation(step);
  if (Object.keys(rest).length) fail();
  // Ordinary creation records an activity, not field-by-field History. Its
  // separate durable activity adapter must still acknowledge downstream work.
  return prepareCardFieldHistory({ before: step.kind === 'create' ? null : step.before, after: step.after,
    effectId, userId, createdAt, redoRows, fields: SYNC_FIELDS });
}
// The rows one planned card change records, one per changed field, with the
// redo rows it supersedes. `fields` bounds which fields may be recorded.
// For a checklist item, `entityId` is the item and `cardId` its card.
function prepareCardFieldHistory({ before, after, effectId, userId, createdAt, redoRows = [], fields: allowed,
  entityId = after?._id, cardId = after?._id }) {
  const entityType = entityOf(allowed);
  if (!/^[a-f0-9]{64}$/.test(effectId) || typeof userId !== 'string' || !userId ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime()) || !after ||
      typeof entityId !== 'string' || !entityId || typeof cardId !== 'string' || !cardId) fail();
  const fields = [...new Set([...Object.keys(before || {}), ...Object.keys(after)])].sort();
  const changes = before === null ? [] : allowed === RULE_CARD_POSITION_FIELDS
    ? [positionChange(before, after, fields)].filter(Boolean)
    : diffFields(entityType, before, after, fields);
  const rows = changes.map(change => {
    const row = { _id: `sync-history-${sha256(canonical([effectId, change.field || change.group]))}`,
      boardId: after.boardId, swimlaneId: after.swimlaneId ?? null, listId: after.listId,
      cardId, entityType, entityId, group: change.group,
      changeType: change.changeType, previousContent: change.previousContent, newContent: change.newContent,
      userId, batchId: `sync-${effectId}`, restoredFromId: null, restoredByUserId: null,
      createdAt: new Date(createdAt), undone: false, undoneAt: null, superseded: false,
      isCheckpoint: false };
    return row;
  });
  if (!Array.isArray(redoRows) || redoRows.length > 10000) fail();
  const redo = rows.length ? redoRows.map(redoTarget) : [];
  const plan = { effectId, boardId: after.boardId, userId, rows, redo };
  validatePlan(plan, allowed);
  return copy(plan);
}
// One planner per preparation attempt. The journal invokes it in index order;
// index zero also resets a reused planner after interrupted preparation. Once
// persisted, replay reads these plans and never invokes the planner again.
function createSyncHistoryPlanner(options) {
  const captured = copy(options);
  let operationId, nextIndex, boardId, redoRows;
  return (step, context) => {
    const effectId = syncOperationEffectId(context.operationId, context.index);
    const first = context.index === 0;
    if (!first && (operationId !== context.operationId || nextIndex !== context.index ||
        boardId !== step.after?.boardId)) fail();
    const plan = prepareSyncFieldHistory({ ...captured, step, effectId,
      redoRows: first ? captured.redoRows ?? [] : redoRows });
    // Advance only after successful validation. Baseline-only changes do not
    // consume the original redo candidates.
    operationId = context.operationId;
    boardId = step.after.boardId;
    nextIndex = context.index + 1;
    redoRows = plan.rows.length ? [] : (first ? captured.redoRows ?? [] : redoRows);
    return plan;
  };
}

const ROW_KEYS = '_id,batchId,boardId,cardId,changeType,createdAt,entityId,entityType,group,isCheckpoint,listId,newContent,previousContent,restoredByUserId,restoredFromId,superseded,swimlaneId,undone,undoneAt,userId';
// A planned `position` row: the hook's shape, both snapshots complete.
function validatePositionRow(plan, row, ids) {
  const snapshot = content => content && !Array.isArray(content) && typeof content === 'object' &&
    Object.keys(content).sort().join(',') === POSITION_KEYS &&
    ['boardId', 'listId'].every(key => typeof content[key] === 'string' && content[key]) &&
    (content.swimlaneId === null || typeof content.swimlaneId === 'string') &&
    (content.sort === null || Number.isFinite(content.sort)) && typeof content.lastMoveReason === 'string';
  if (Object.keys(row).sort().join(',') !== ROW_KEYS || row.group !== 'position' || row.changeType !== 'moved' ||
      row._id !== `sync-history-${sha256(canonical([plan.effectId, 'position']))}` || ids.has(row._id) ||
      row.boardId !== plan.boardId || row.userId !== plan.userId || row.batchId !== `sync-${plan.effectId}` ||
      row.entityType !== 'card' || row.cardId !== row.entityId || typeof row.entityId !== 'string' || !row.entityId ||
      typeof row.listId !== 'string' || !row.listId || !(row.createdAt instanceof Date) ||
      !Number.isFinite(row.createdAt.getTime()) || row.restoredFromId !== null || row.restoredByUserId !== null ||
      row.isCheckpoint !== false || row.undone !== false || row.undoneAt !== null || row.superseded !== false ||
      !snapshot(row.previousContent) || !snapshot(row.newContent)) fail();
  ids.add(row._id);
}
function validateLifecycleRow(plan, row, ids) {
  const document = content => content && Object.keys(content).join(',') === 'document' && content.document &&
    typeof content.document === 'object' && !Array.isArray(content.document) && content.document._id === row.entityId &&
    canonical(JSON.parse(JSON.stringify(content.document))) === canonical(content.document);
  const added = row.changeType === 'added';
  // A checklist or one of its items, in the Checklists group as the hook records
  // them, or a copied attachment in the Attachments group.
  if (Object.keys(row).sort().join(',') !== ROW_KEYS ||
      row.group !== (row.entityType === 'attachment' ? 'attachments' : 'checklists') ||
      !['checklist', 'checklistItem', 'attachment'].includes(row.entityType) ||
      !['added', 'removed'].includes(row.changeType) || typeof row.entityId !== 'string' || !row.entityId ||
      row._id !== lifecycleRowId(plan.effectId, row.entityId) || ids.has(row._id) ||
      row.boardId !== plan.boardId || row.userId !== plan.userId || row.batchId !== `sync-${plan.effectId}` ||
      typeof row.cardId !== 'string' || !row.cardId || typeof row.listId !== 'string' || !row.listId ||
      !(row.createdAt instanceof Date) || !Number.isFinite(row.createdAt.getTime()) || row.restoredFromId !== null ||
      row.restoredByUserId !== null || row.isCheckpoint !== false || row.undone !== false || row.undoneAt !== null ||
      row.superseded !== false || !document(added ? row.newContent : row.previousContent) ||
      (added ? row.previousContent : row.newContent) !== null) fail();
  ids.add(row._id);
}
function validatePlan(plan, allowed = SYNC_FIELDS) {
  const entityType = entityOf(allowed);
  if (!plan || Object.keys(plan).sort().join(',') !== 'boardId,effectId,redo,rows,userId' ||
      typeof plan.effectId !== 'string' || !/^[a-f0-9]{64}$/.test(plan.effectId) ||
      !['boardId', 'userId'].every(key => typeof plan[key] === 'string' && plan[key]) ||
      !Array.isArray(plan.rows) || plan.rows.length > 16 || !Array.isArray(plan.redo) || plan.redo.length > 10000 ||
      (!plan.rows.length && plan.redo.length)) fail();
  const ids = new Set();
  for (const row of plan.rows) {
    if (allowed === RULE_CARD_POSITION_FIELDS) { validatePositionRow(plan, row, ids); continue; }
    if (allowed === RULE_CHECKLIST_LIFECYCLE) { validateLifecycleRow(plan, row, ids); continue; }
    const field = row.newContent?.field || row.previousContent?.field;
    const keys = '_id,batchId,boardId,cardId,changeType,createdAt,entityId,entityType,group,isCheckpoint,listId,newContent,previousContent,restoredByUserId,restoredFromId,superseded,swimlaneId,undone,undoneAt,userId';
    if (Object.keys(row).sort().join(',') !== keys || !allowed.includes(field) ||
        !(row.createdAt instanceof Date) || !Number.isFinite(row.createdAt.getTime()) ||
        !['entityId', 'listId'].every(key => typeof row[key] === 'string' && row[key]) ||
        row._id !== `sync-history-${sha256(canonical([plan.effectId, field]))}` ||
        ids.has(row._id) || row.boardId !== plan.boardId || row.userId !== plan.userId ||
        row.batchId !== `sync-${plan.effectId}` || row.entityType !== entityType ||
        (entityType === 'card' ? row.cardId !== row.entityId : typeof row.cardId !== 'string' || !row.cardId) ||
        row.group !== groupForField(entityType, field) || !['added', 'removed', 'edited'].includes(row.changeType) ||
        row.restoredFromId !== null || row.restoredByUserId !== null ||
        row.isCheckpoint !== false || row.undone !== false || row.undoneAt !== null || row.superseded !== false) fail();
    for (const content of [row.previousContent, row.newContent]) {
      if (content !== null) {
        if (content.field !== field) fail();
        valueFromContent(content);
      }
    }
    ids.add(row._id);
  }
  for (const row of plan.redo) {
    if (Object.keys(row).sort().join(',') !== (Object.hasOwn(row, 'legacyRow')
        ? '_id,boardId,legacyRow,snapshotHash,undoneAt,userId' : '_id,boardId,integrityHash,undoneAt,userId') ||
        typeof row._id !== 'string' || !row._id || ids.has(row._id) ||
        row.boardId !== plan.boardId || row.userId !== plan.userId ||
        !/^[a-f0-9]{64}$/.test(Object.hasOwn(row, 'legacyRow') ? row.snapshotHash : row.integrityHash) || !(row.undoneAt instanceof Date) ||
        !Number.isFinite(row.undoneAt.getTime())) fail();
    if (Object.hasOwn(row, 'legacyRow')) {
      const legacy = row.legacyRow;
      if (!legacy || Array.isArray(legacy) || typeof legacy !== 'object' ||
          !unhashed(legacy) || Object.hasOwn(legacy, 'superseded') || legacy.undone !== true ||
          ['_id', 'boardId', 'userId', 'undoneAt'].some(key => canonical(legacy[key]) !== canonical(row[key])) ||
          Object.keys(legacy).some(key => key.startsWith('$') || key.includes('.')) ||
          canonical(copy(legacy)) !== canonical(legacy) || sha256(canonical(legacy)) !== row.snapshotHash) fail();
    }
    ids.add(row._id);
  }
  if (Buffer.byteLength(EJSON.stringify(plan)) > 15 * 1024 * 1024) fail();
}

// Sync writes only as a writer the board's History gate admits, and links each
// planned row to the chain as it appends it (maintainer decision of
// 2026-09-30). history.admitHistoryWriter decides the mode: on a board still
// on the legacy path it holds a writer token for the whole batch, so a chain
// migration waits for it; on a coordinated board each row is appended through
// the chain head like any ordinary edit. history.appendSyncHistoryRow does the
// linking and is idempotent by row _id. There is no default for either: an
// adapter without them is refused, never silently written around the gate.
async function persistSyncFieldHistory({ history, plan, assertCurrent, fields = SYNC_FIELDS }) {
  entityOf(fields);
  validatePlan(plan, fields);
  if (typeof assertCurrent !== 'function' || typeof history?.admitHistoryWriter !== 'function' ||
      typeof history?.appendSyncHistoryRow !== 'function') fail();
  // Do not let a collection adapter mutate the journal's verification inputs.
  plan = copy(plan);
  return history.admitHistoryWriter({ boardId: plan.boardId, work: async ({ mode, assertCurrent: writerCurrent, fencedInsert }) => {
    if (!['legacy', 'coordinated'].includes(mode) || typeof writerCurrent !== 'function') fail();
    return writeSyncFieldHistory({ history, plan, mode, fencedInsert,
      assertCurrent: async () => { await assertCurrent(); await writerCurrent(); } });
  } });
}
// The saved row is this plan's row: its hash holds, its protected content is
// the planned content (the chain link is whatever it was appended after), and
// it is not a checkpoint. Mutable undo flags may have changed since.
function isPlannedRow(saved, row) {
  return !!saved && saved._id === row._id && rowHashIsValid(saved) && saved.isCheckpoint === row.isCheckpoint &&
    PROTECTED.filter(key => key !== 'previousHash').every(key => canonical(saved[key]) === canonical(row[key]));
}
async function writeSyncFieldHistory({ history, plan, mode, fencedInsert, assertCurrent }) {
  for (const target of plan.redo) {
    await assertCurrent();
    let error;
    try {
      const selector = target.legacyRow
        ? exactFieldSelector(target.legacyRow, [...new Set([...Object.keys(target.legacyRow), 'integrityHash'])])
        : { ...target, undone: true };
      await history.updateAsync({ ...selector, superseded: { $ne: true } }, { $set: { superseded: true } });
    } catch (failure) { error = failure; }
    await assertCurrent();
    let saved;
    try { saved = await history.findOneAsync(target._id); } catch (failure) { throw error || failure; }
    const matches = target.legacyRow
      ? saved && canonical(legacySnapshot(saved)) === canonical(target.legacyRow)
      : rowHashIsValid(saved) && Object.keys(target).every(key => canonical(saved[key]) === canonical(target[key]));
    if (!saved || saved.superseded !== true || !matches) {
      throw error || new Error('sync-history-redo-unconfirmed');
    }
  }
  for (const row of plan.rows) {
    await assertCurrent();
    let error;
    try { await history.appendSyncHistoryRow({ row: copy(row), mode, assertCurrent, fencedInsert }); }
    catch (failure) { error = failure; }
    await assertCurrent();
    let saved;
    try { saved = await history.findOneAsync(row._id); } catch (failure) { throw error || failure; }
    if (!isPlannedRow(saved, row)) throw error || new Error('sync-history-event-unconfirmed');
  }
  await assertCurrent();
  return plan.effectId;
}
function validateSyncFieldHistory(plan, step, effectId) {
  validatePlan(plan);
  if (plan.effectId !== effectId || plan.boardId !== step.after?.boardId) fail();
  const expected = prepareSyncFieldHistory({ step, effectId, userId: plan.userId,
    createdAt: plan.rows[0]?.createdAt || new Date(0) });
  if (canonical(expected.rows) !== canonical(plan.rows)) fail();
  return true;
}
module.exports = { createSyncHistoryPlanner, prepareSyncFieldHistory, prepareCardFieldHistory, persistSyncFieldHistory,
  validateSyncFieldHistory, isPlannedRow, SYNC_FIELDS, RULE_CARD_FIELDS, RULE_CHECKLIST_ITEM_FIELDS,
  RULE_CARD_POSITION_FIELDS, RULE_CARD_MOVE_BOARD_FIELDS, RULE_CHECKLIST_LIFECYCLE, prepareChecklistLifecycleHistory };
