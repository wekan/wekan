'use strict';
const { diffFields, groupForField, valueFromContent } = require('../../models/lib/changeHistoryGroups');
const { canonical, sha256, hashHistoryRow, rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');
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
// The caller supplies the observed chain head and redo candidates; retries
// never select a new head or invalidate newly undone rows.
function prepareSyncFieldHistory({ step, effectId, userId, createdAt, previousHash = null, redoRows = [] }) {
  prepareSyncOperationMutation(step);
  if (!/^[a-f0-9]{64}$/.test(effectId) || typeof userId !== 'string' || !userId ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime()) ||
      (previousHash !== null && !/^[a-f0-9]{64}$/.test(previousHash))) fail();
  const after = step.after;
  const fields = [...new Set([...Object.keys(step.before || {}), ...Object.keys(after)])].sort();
  // Ordinary creation records an activity, not field-by-field History. Its
  // separate durable activity adapter must still acknowledge downstream work.
  const changes = step.kind === 'create' ? [] : diffFields('card', step.before, after, fields);
  const rows = changes.map(change => {
    const row = { _id: `sync-history-${sha256(canonical([effectId, change.field]))}`,
      boardId: after.boardId, swimlaneId: after.swimlaneId ?? null, listId: after.listId,
      cardId: after._id, entityType: 'card', entityId: after._id, group: change.group,
      changeType: change.changeType, previousContent: change.previousContent, newContent: change.newContent,
      userId, batchId: `sync-${effectId}`, restoredFromId: null, restoredByUserId: null,
      createdAt: new Date(createdAt), undone: false, undoneAt: null, superseded: false,
      isCheckpoint: false, previousHash };
    row.integrityHash = hashHistoryRow(row);
    previousHash = row.integrityHash;
    return row;
  });
  if (!Array.isArray(redoRows) || redoRows.length > 10000) fail();
  const redo = rows.length ? redoRows.map(redoTarget) : [];
  const plan = { effectId, boardId: after.boardId, userId, rows, redo };
  validatePlan(plan);
  return copy(plan);
}
// One planner per preparation attempt. The journal invokes it in index order;
// index zero also resets a reused planner after interrupted preparation. Once
// persisted, replay reads these plans and never invokes the planner again.
function createSyncHistoryPlanner(options) {
  const captured = copy(options);
  let operationId, nextIndex, boardId, previousHash, redoRows;
  return (step, context) => {
    const effectId = syncOperationEffectId(context.operationId, context.index);
    const first = context.index === 0;
    if (!first && (operationId !== context.operationId || nextIndex !== context.index ||
        boardId !== step.after?.boardId)) fail();
    const plan = prepareSyncFieldHistory({ ...captured, step, effectId,
      previousHash: first ? captured.previousHash ?? null : previousHash,
      redoRows: first ? captured.redoRows ?? [] : redoRows });
    // Advance only after successful validation. Baseline-only changes neither
    // break the chain nor consume the original redo candidates.
    operationId = context.operationId;
    boardId = step.after.boardId;
    nextIndex = context.index + 1;
    previousHash = plan.rows.at(-1)?.integrityHash ?? (first ? captured.previousHash ?? null : previousHash);
    redoRows = plan.rows.length ? [] : (first ? captured.redoRows ?? [] : redoRows);
    return plan;
  };
}

function validatePlan(plan) {
  if (!plan || Object.keys(plan).sort().join(',') !== 'boardId,effectId,redo,rows,userId' ||
      typeof plan.effectId !== 'string' || !/^[a-f0-9]{64}$/.test(plan.effectId) ||
      !['boardId', 'userId'].every(key => typeof plan[key] === 'string' && plan[key]) ||
      !Array.isArray(plan.rows) || plan.rows.length > 16 || !Array.isArray(plan.redo) || plan.redo.length > 10000 ||
      (!plan.rows.length && plan.redo.length)) fail();
  const ids = new Set();
  let previous;
  for (const row of plan.rows) {
    const field = row.newContent?.field || row.previousContent?.field;
    const keys = '_id,batchId,boardId,cardId,changeType,createdAt,entityId,entityType,group,integrityHash,isCheckpoint,listId,newContent,previousContent,previousHash,restoredByUserId,restoredFromId,superseded,swimlaneId,undone,undoneAt,userId';
    if (Object.keys(row).sort().join(',') !== keys || !['title', 'description', 'spentTime', 'customFields', 'archived'].includes(field) ||
        !(row.createdAt instanceof Date) || !Number.isFinite(row.createdAt.getTime()) ||
        !['entityId', 'listId'].every(key => typeof row[key] === 'string' && row[key]) ||
        row._id !== `sync-history-${sha256(canonical([plan.effectId, field]))}` ||
        ids.has(row._id) || row.boardId !== plan.boardId || row.userId !== plan.userId ||
        row.batchId !== `sync-${plan.effectId}` || row.entityType !== 'card' || row.cardId !== row.entityId ||
        row.group !== groupForField('card', field) || !['added', 'removed', 'edited'].includes(row.changeType) ||
        row.restoredFromId !== null || row.restoredByUserId !== null ||
        (row.previousHash !== null && !/^[a-f0-9]{64}$/.test(row.previousHash)) ||
        row.isCheckpoint !== false || row.undone !== false || row.undoneAt !== null || row.superseded !== false ||
        !rowHashIsValid(row) || (previous && row.previousHash !== previous)) fail();
    for (const content of [row.previousContent, row.newContent]) {
      if (content !== null) {
        if (content.field !== field) fail();
        valueFromContent(content);
      }
    }
    ids.add(row._id); previous = row.integrityHash;
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

// Sync's rows are hashed when they are PLANNED (previousHash is fixed then),
// so they may only be written as a writer the board's History gate admits:
// history.admitHistoryWriter holds a legacy writer token for the whole batch,
// which makes a chain migration wait for it, and it refuses on a board whose
// chain is already coordinated instead of forking it. There is no default: an
// adapter without it is refused, never silently written around the gate.
async function persistSyncFieldHistory({ history, plan, assertCurrent }) {
  validatePlan(plan);
  if (typeof assertCurrent !== 'function' || typeof history?.admitHistoryWriter !== 'function') fail();
  // Do not let a collection adapter mutate the journal's verification inputs.
  plan = copy(plan);
  return history.admitHistoryWriter({ boardId: plan.boardId, work: async ({ assertCurrent: writerCurrent }) => {
    if (typeof writerCurrent !== 'function') fail();
    return writeSyncFieldHistory({ history, plan, assertCurrent: async () => { await assertCurrent(); await writerCurrent(); } });
  } });
}
async function writeSyncFieldHistory({ history, plan, assertCurrent }) {
  if (plan.rows[0]?.previousHash) {
    await assertCurrent();
    const predecessor = await history.findOneAsync({ boardId: plan.boardId,
      integrityHash: plan.rows[0].previousHash });
    if (!rowHashIsValid(predecessor) || predecessor.boardId !== plan.boardId ||
        predecessor.integrityHash !== plan.rows[0].previousHash) {
      throw new Error('sync-history-predecessor-unconfirmed');
    }
  }
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
    let saved = await history.findOneAsync(row._id), error;
    if (!saved) {
      await assertCurrent();
      try { await history.insertAsync(copy(row)); } catch (failure) { error = failure; }
      await assertCurrent();
      try { saved = await history.findOneAsync(row._id); } catch (failure) { throw error || failure; }
    }
    // Mutable undo flags may have changed since a previous successful attempt.
    if (!saved || saved._id !== row._id || !rowHashIsValid(saved) ||
        saved.integrityHash !== row.integrityHash || saved.isCheckpoint !== row.isCheckpoint) {
      throw error || new Error('sync-history-event-unconfirmed');
    }
  }
  await assertCurrent();
  return plan.effectId;
}
function validateSyncFieldHistory(plan, step, effectId) {
  validatePlan(plan);
  if (plan.effectId !== effectId || plan.boardId !== step.after?.boardId) fail();
  const expected = prepareSyncFieldHistory({ step, effectId, userId: plan.userId,
    createdAt: plan.rows[0]?.createdAt || new Date(0), previousHash: plan.rows[0]?.previousHash || null });
  if (canonical(expected.rows) !== canonical(plan.rows)) fail();
  return true;
}
module.exports = { createSyncHistoryPlanner, prepareSyncFieldHistory, persistSyncFieldHistory, validateSyncFieldHistory };
