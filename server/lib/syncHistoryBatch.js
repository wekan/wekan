'use strict';
const { diffFields, groupForField, valueFromContent } = require('../../models/lib/changeHistoryGroups');
const { canonical, sha256, hashHistoryRow, rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');
const { prepareSyncOperationMutation } = require('./syncOperationMutation');
const { EJSON } = require('bson');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-history-plan-invalid'); };

// Prepare BEFORE mutation and persist this exact plan in the owning journal.
// The caller supplies the observed chain head and redo candidates; retries
// never select a new head or invalidate newly undone rows.
function prepareSyncFieldHistory({ step, effectId, userId, createdAt, previousHash = null, redoRows = [] }) {
  prepareSyncOperationMutation(step);
  if (step.kind === 'create' || !/^[a-f0-9]{64}$/.test(effectId) || typeof userId !== 'string' || !userId ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime()) ||
      (previousHash !== null && !/^[a-f0-9]{64}$/.test(previousHash))) fail();
  const after = step.after;
  const fields = [...new Set([...Object.keys(step.before), ...Object.keys(after)])].sort();
  const rows = diffFields('card', step.before, after, fields).map(change => {
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
  const redo = rows.length ? redoRows.map(row => {
    if (!rowHashIsValid(row) || row.undone !== true || row.superseded === true) fail();
    return { _id: row._id, boardId: row.boardId, userId: row.userId,
      integrityHash: row.integrityHash, undoneAt: row.undoneAt };
  }) : [];
  const plan = { effectId, boardId: after.boardId, userId, rows, redo };
  validatePlan(plan);
  return copy(plan);
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
    if (Object.keys(row).sort().join(',') !== '_id,boardId,integrityHash,undoneAt,userId' ||
        typeof row._id !== 'string' || !row._id || ids.has(row._id) ||
        row.boardId !== plan.boardId || row.userId !== plan.userId ||
        !/^[a-f0-9]{64}$/.test(row.integrityHash) || !(row.undoneAt instanceof Date) ||
        !Number.isFinite(row.undoneAt.getTime())) fail();
    ids.add(row._id);
  }
  if (Buffer.byteLength(EJSON.stringify(plan)) > 15 * 1024 * 1024) fail();
}

async function persistSyncFieldHistory({ history, plan, assertCurrent }) {
  validatePlan(plan);
  if (typeof assertCurrent !== 'function') fail();
  // Do not let a collection adapter mutate the journal's verification inputs.
  plan = copy(plan);
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
      await history.updateAsync({ ...target, undone: true, superseded: { $ne: true } }, { $set: { superseded: true } });
    } catch (failure) { error = failure; }
    await assertCurrent();
    let saved;
    try { saved = await history.findOneAsync(target._id); } catch (failure) { throw error || failure; }
    if (!saved || saved.superseded !== true || !rowHashIsValid(saved) ||
        Object.keys(target).some(key => canonical(saved[key]) !== canonical(target[key]))) {
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
module.exports = { prepareSyncFieldHistory, persistSyncFieldHistory };
