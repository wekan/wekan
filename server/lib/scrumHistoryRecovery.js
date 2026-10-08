'use strict';
// Resolve a Scrum History checkpoint that a conflict has stranded.
//
// An undo, redo or restore of Scrum data keeps a private checkpoint
// (scrumHistoryPending, one per board) until every write and its History
// records are confirmed, and every other Scrum edit on the board waits for it
// (server/scrum.js). Only the original user can retry it, with the same plan,
// so when somebody else has since changed one of its records - or its History
// row changed, or its author lost write access - every retry fails the same way
// and the board's Scrum edits stay blocked for good.
//
// A board administrator (online, server/scrum.js) or an operator with every
// writer stopped (offline, releases/recover-scrum-history.cjs) can now resolve
// such a checkpoint, and ONLY such a one: a checkpoint that has not stopped on a
// conflict belongs to its author, who can retry it.
//
//  - rollback: every record the operation wrote goes back to the "before" value
//    the checkpoint saved, with its original revision - the board is as it was
//    before the undo or redo began. Offered only when every record is still
//    either the checkpoint's "before" or its "after" (nobody else changed any of
//    them), and no History record of the operation has been written.
//  - discard: the checkpoint is removed and no record is written. Records the
//    operation had already written keep their values; the result and the
//    Problems -> Recovery row say how many, so nothing partial is silent.
//
// Both are idempotent: they name the checkpoint they resolve (its operation),
// and one that is gone - resolved by an earlier call or another server - is a
// no-op, never another checkpoint. The resolver claims the checkpoint by
// compare-and-set (displacing its worker, scrumHistoryOwnership.js, which then
// stops at its next guard), waits for a write already past its guard to land,
// and checks every record again before and after its own writes.
//
// Pure Node and the MongoDB driver's API: the server passes its own database,
// the offline command a MongoClient's.
const { randomUUID } = require('node:crypto');
const { canonical, rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');
const { METADATA_TYPES } = require('../../models/lib/scrumHistory');
const { contentForDirection } = require('../../models/lib/changeHistoryGroups');
const { memberCan } = require('../../models/lib/boardRoleCapabilities');
const { scrumHistorySelector } = require('./scrumHistoryOwnership');
const { scrumHistoryWriteState } = require('./scrumHistoryWriteState');
const { scrumHistoryWriteSelector } = require('./scrumHistoryWriteSelector');

const COLLECTIONS = { board: 'boards', card: 'cards', list: 'lists', swimlane: 'swimlanes',
  'scrum-sprint': 'scrumSprints', 'scrum-release': 'scrumReleases', 'scrum-event': 'scrumEvents' };
// Online, after claiming: a write a displaced worker had already guarded is
// one database round trip from landing. Offline every writer has stopped.
const SETTLE_MS = 2000;
// An online resolution in progress; a crashed one is taken over after this.
const RESOLVE_LEASE_MS = 5 * 60 * 1000;
const TARGET_REPORT_LIMIT = 50;
// What a retry records on its checkpoint when it fails for a reason a further
// retry would meet again (server/lib/scrumHistory.js). A displaced worker's
// failure is never recorded: its record is fenced by its worker id.
const RETRY_FAILURES = new Set(['scrum-conflict', 'not-authorized', 'invalid-scrum-reference',
  'invalid-scrum-history', 'invalid-scrum']);
// Fields a rollback leaves alone on a planning record: the record's lifetime,
// its bookkeeping and a rollover's job state, none of which is History content
// (models/lib/scrumHistory.js historyDocument).
const KEEP = new Set(['_id', 'revision', 'updatedAt', 'updatedBy', 'incarnation',
  'rolloverPending', 'rolloverTotal', 'rolloverDone', 'rolloverError', 'rolloverLease']);

class ScrumHistoryRecoveryError extends Error {}
const fail = message => { throw new ScrumHistoryRecoveryError(message); };
const CHANGED = 'A Scrum record changed while the checkpoint was being resolved. Inspect it again.';
const TAKEN = 'Another recovery took over this checkpoint. Inspect it again.';

const hasOperation = checkpoint => typeof checkpoint.operationId === 'string' && checkpoint.operationId.length > 0;
// The name a caller resolves a checkpoint by: its operation, or for a
// checkpoint saved before operations had IDs, its History row.
const checkpointKey = checkpoint => hasOperation(checkpoint) ? checkpoint.operationId : `row:${checkpoint.rowId}`;
const keySelector = checkpoint => hasOperation(checkpoint) ? { operationId: checkpoint.operationId }
  : { operationId: { $exists: false }, rowId: checkpoint.rowId };

function targetsOf(checkpoint) {
  scrumHistorySelector(checkpoint);
  const seen = new Set();
  return checkpoint.content.records.map((entry, index) => {
    const before = checkpoint.before.records[index];
    if (!entry || !before || !Object.hasOwn(COLLECTIONS, entry.type) || typeof entry.id !== 'string' || !entry.id ||
        before.type !== entry.type || before.id !== entry.id || seen.has(`${entry.type}:${entry.id}`)) {
      throw new Error('Malformed Scrum History checkpoint');
    }
    seen.add(`${entry.type}:${entry.id}`);
    return { index, type: entry.type, id: entry.id, after: entry.document ?? null, before: before.document ?? null,
      revision: checkpoint.revisions[index], incarnation: checkpoint.incarnations?.[index] };
  });
}
// A record is back at its "before" value - or never left it, for a target
// whose before and after are the same.
const atBefore = (target, state) => state === 'pending' ||
  (state === 'applied' && canonical(target.before) === canonical(target.after));
function stateOf(target, current) {
  try {
    return scrumHistoryWriteState({ type: target.type, current, before: target.before, after: target.after,
      revision: target.revision, incarnation: target.incarnation });
  } catch (error) { return 'conflict'; }
}
async function readTargets(db, targets) {
  const byType = new Map();
  for (const target of targets) {
    if (!byType.has(target.type)) byType.set(target.type, []);
    byType.get(target.type).push(target.id);
  }
  const found = new Map();
  for (const [type, ids] of byType) {
    for (let start = 0; start < ids.length; start += 500) {
      const docs = await db.collection(COLLECTIONS[type]).find({ _id: { $in: ids.slice(start, start + 500) } }).toArray();
      for (const doc of docs) found.set(`${type}:${doc._id}`, doc);
    }
  }
  return targets.map(target => found.get(`${target.type}:${target.id}`) || null);
}

// Everything a decision needs, read fresh from the database.
async function examine(db, boardId, now) {
  const checkpoint = await db.collection('scrumHistoryPending').findOne({ _id: boardId });
  if (!checkpoint) return { present: false };
  const reasons = [];
  let targets = null, states = [], currents = [];
  try { targets = targetsOf(checkpoint); } catch (error) { reasons.push('malformed'); }
  if (targets) {
    currents = await readTargets(db, targets);
    states = targets.map((target, index) => stateOf(target, currents[index]));
    if (states.includes('conflict')) reasons.push('target-conflict');
  }
  const direction = checkpoint.direction;
  const row = typeof checkpoint.rowId === 'string' ? await db.collection('changeHistory').findOne({ _id: checkpoint.rowId }) : null;
  if (!row || !rowHashIsValid(row) || row.boardId !== boardId || row.entityType !== 'scrum' ||
      (direction !== 'restore' && row.userId !== checkpoint.userId) || (direction === 'redo' && row.superseded) ||
      canonical(contentForDirection(row, direction) ?? null) !== canonical(checkpoint.content ?? null)) reasons.push('source-changed');
  const board = await db.collection('boards').findOne({ _id: boardId }, { projection: { _id: 1, title: 1, members: 1 } });
  if (!board) reasons.push('board-missing');
  const author = typeof checkpoint.userId === 'string'
    ? await db.collection('users').findOne({ _id: checkpoint.userId }, { projection: { _id: 1 } }) : null;
  if (board && (!author || !memberCan(board.members, checkpoint.userId, 'write'))) reasons.push('author-cannot-retry');
  if (checkpoint.lastFailure && RETRY_FAILURES.has(checkpoint.lastFailure.error)) reasons.push('retry-failed');
  // History of the operation already written says it was applied; rolling the
  // records back under it would make that record false.
  const recorded = hasOperation(checkpoint) && !!await db.collection('changeHistory').findOne(
    { boardId, batchId: checkpoint.operationId, changeType: 'restored' }, { projection: { _id: 1 } });
  const count = state => states.filter(value => value === state).length;
  const stuck = reasons.length > 0;
  const rollbackBlocked = !stuck ? 'This undo or redo has not stopped on a conflict; its author can retry it.'
    : !targets ? 'The checkpoint is damaged; it can only be discarded.'
      : !board ? 'The board no longer exists; the checkpoint can only be discarded.'
        : count('conflict') ? 'Someone changed some of its records since; rolling back would overwrite their changes. It can only be discarded.'
          : recorded ? 'Its History records were already written; it can only be discarded.' : null;
  const resolving = checkpoint.resolving && typeof checkpoint.resolving === 'object' ? checkpoint.resolving : null;
  return { present: true, checkpoint, targets, states, currents, board, reasons, stuck, recorded, rollbackBlocked,
    key: checkpointKey(checkpoint), counts: { total: targets ? targets.length : 0, applied: count('applied'),
      pending: count('pending'), conflicted: count('conflict') },
    busy: !!resolving && !resolving.offline && resolving.at instanceof Date && now - resolving.at < RESOLVE_LEASE_MS,
    resolving };
}

// What a board administrator or an operator sees: no record contents.
async function inspectScrumHistoryCheckpoint(db, boardId, { now = () => new Date() } = {}) {
  const found = await examine(db, boardId, now());
  if (!found.present) return { present: false };
  const { checkpoint, targets, states } = found;
  return { present: true, key: found.key, boardId, rowId: checkpoint.rowId ?? null, userId: checkpoint.userId ?? null,
    direction: checkpoint.direction ?? null, stuck: found.stuck, reasons: found.reasons, ...found.counts,
    canRollback: !found.rollbackBlocked, rollbackBlocked: found.rollbackBlocked, canDiscard: found.stuck,
    historyRecorded: found.recorded,
    resolving: found.resolving ? { action: found.resolving.action ?? null, offline: !!found.resolving.offline,
      at: found.resolving.at ?? null } : null,
    busy: found.busy,
    lastFailure: checkpoint.lastFailure ? { error: checkpoint.lastFailure.error ?? null, at: checkpoint.lastFailure.at ?? null } : null,
    targets: (targets || []).slice(0, TARGET_REPORT_LIMIT).map((target, index) => ({ type: target.type, id: target.id, state: states[index] })),
    moreTargets: Math.max(0, (targets || []).length - TARGET_REPORT_LIMIT) };
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function resolveScrumHistoryCheckpoint(db, boardId, { action, key, offline = false, online = false, actor = null,
  now = () => new Date(), settleMs = offline ? 0 : SETTLE_MS, sleep = wait } = {}) {
  if (!['rollback', 'discard'].includes(action)) fail('Choose rollback or discard.');
  if (typeof key !== 'string' || !key || key.length > 300) fail('Name the checkpoint to resolve, as its inspection reported it.');
  if (offline === online) fail('Resolve online from WeKan, or stop every writer and select offline recovery.');
  const pending = db.collection('scrumHistoryPending');
  const absent = { changed: false, state: 'absent', action, key };
  const first = await examine(db, boardId, now());
  // Idempotence: resolved already, or a different operation's checkpoint.
  if (!first.present || first.key !== key) return absent;
  if (!first.stuck) fail(first.rollbackBlocked);
  if (action === 'rollback' && first.rollbackBlocked) fail(first.rollbackBlocked);
  const original = first.checkpoint;
  if (online && first.resolving?.offline) fail('An offline recovery of this checkpoint started; finish it offline.');
  if (online && first.busy) fail('Another administrator is resolving this checkpoint; try again in a few minutes.');

  const token = randomUUID();
  const claimed = await pending.updateOne({ _id: boardId, ...keySelector(original),
    worker: Object.hasOwn(original, 'worker') ? { $eq: original.worker } : { $exists: false } },
  { $set: { worker: token, resolving: { token, action, offline: !!offline, by: actor || null, at: now() } } });
  if (!claimed.matchedCount) {
    const again = await pending.findOne({ _id: boardId });
    if (!again || checkpointKey(again) !== key) return absent;
    fail('The checkpoint changed while it was being claimed. Inspect it again.');
  }
  // Held, and renewed: a later claim or a finished operation displaces us.
  const held = async () => {
    if (!(await pending.updateOne({ _id: boardId, worker: token }, { $set: { 'resolving.at': now() } })).matchedCount) fail(TAKEN);
  };
  try {
    if (settleMs > 0) await sleep(settleMs);
    await held();
    const second = await examine(db, boardId, now());
    if (!second.present || second.key !== key || second.checkpoint.worker !== token) fail(TAKEN);
    if (!second.stuck) fail(second.rollbackBlocked);
    if (action === 'rollback' && second.rollbackBlocked) fail(second.rollbackBlocked);
    let reverted = 0, removedRecords = 0, recreatedRecords = 0, batchJobRemoved = false;
    if (action === 'rollback') {
      for (let index = second.targets.length - 1; index >= 0; index -= 1) {
        const target = second.targets[index];
        if (atBefore(target, second.states[index])) continue;
        const collection = db.collection(COLLECTIONS[target.type]);
        await held();
        const current = await collection.findOne({ _id: target.id });
        const state = stateOf(target, current);
        if (atBefore(target, state)) continue;
        if (state !== 'applied') fail(CHANGED);
        if (!target.before) {
          // The operation created it: remove exactly what it created.
          if (!(await collection.deleteOne(scrumHistoryWriteSelector(target.type, current))).deletedCount) fail(CHANGED);
          removedRecords += 1;
        } else if (!current) {
          // The operation removed it: the same record again, same lifetime.
          const incarnation = target.incarnation?.before;
          try {
            await collection.insertOne({ ...structuredClone(target.before), revision: target.revision, updatedAt: now(),
              ...(typeof incarnation === 'string' && incarnation ? { incarnation } : {}) });
          } catch (error) { if (error && error.code === 11000) fail(CHANGED); throw error; }
          recreatedRecords += 1;
        } else if (METADATA_TYPES.has(target.type)) {
          if (!(await collection.updateOne(scrumHistoryWriteSelector(target.type, current),
            { $set: { scrum: structuredClone(target.before.scrum || {}), scrumRevision: target.revision } })).matchedCount) fail(CHANGED);
        } else {
          const { _id, ...fields } = structuredClone(target.before);
          const unset = Object.fromEntries(Object.keys(current).filter(field => !KEEP.has(field) && !Object.hasOwn(fields, field))
            .map(field => [field, '']));
          const modifier = { $set: { ...fields, revision: target.revision } };
          if (Object.keys(unset).length) modifier.$unset = unset;
          if (!(await collection.updateOne(scrumHistoryWriteSelector(target.type, current), modifier)).matchedCount) fail(CHANGED);
        }
        reverted += 1;
      }
    } else {
      // A large undo or redo stopped on this row cannot continue past a
      // discarded one; its stopped job would block undo and redo for good.
      const jobs = db.collection('scrumBatchJobs');
      const job = await jobs.findOne({ _id: boardId });
      if (job && job.state === 'failed' && job.userId === original.userId && job.direction === original.direction) {
        batchJobRemoved = (await jobs.deleteOne({ _id: boardId, state: 'failed', userId: job.userId,
          direction: job.direction })).deletedCount === 1;
      }
    }
    await held();
    const final = await examine(db, boardId, now());
    if (!final.present || final.key !== key || final.checkpoint.worker !== token) fail(TAKEN);
    if (action === 'rollback' ? final.states.some((state, index) => !atBefore(final.targets[index], state)) || final.recorded
      : canonical(final.states) !== canonical(second.states)) fail(CHANGED);
    if (!(await pending.deleteOne({ _id: boardId, ...keySelector(original), worker: token })).deletedCount) fail(TAKEN);
    return { changed: true, state: action === 'rollback' ? 'rolled-back' : 'discarded', action, key, boardId,
      boardTitle: second.board?.title ?? null, rowId: original.rowId ?? null, userId: original.userId ?? null,
      direction: original.direction ?? null, reasons: second.reasons, ...second.counts, reverted, removedRecords,
      recreatedRecords, batchJobRemoved, offline: !!offline };
  } catch (error) {
    // Let its author retry, or another resolution start, without waiting for
    // the lease. Records already rolled back are the checkpoint's "before"
    // values, which a retry and a later rollback both accept.
    await pending.updateOne({ _id: boardId, worker: token }, { $unset: { resolving: '' } }).catch(() => {});
    throw error;
  }
}

// One line for Problems -> Recovery.
function describeResolution(result, who) {
  const what = result.state === 'rolled-back'
    ? `rolled back ${result.reverted} of ${result.total} records to their values before it`
    : `discarded its checkpoint and left the records as they were (${result.applied} of ${result.total} already written, ` +
      `${result.pending} not written, ${result.conflicted} changed by someone else since)`;
  return `${who} resolved the stopped Scrum History ${result.direction} of user ${result.userId} ` +
    `(History row ${result.rowId}, operation ${result.key}) on board ${result.boardId}: ${what}. ` +
    `Why it was stuck: ${result.reasons.join(', ')}.` +
    (result.removedRecords ? ` Removed ${result.removedRecords} planning records the ${result.direction} had created.` : '') +
    (result.batchJobRemoved ? ' The stopped large undo or redo of that batch was ended.' : '');
}

module.exports = { ScrumHistoryRecoveryError, inspectScrumHistoryCheckpoint, resolveScrumHistoryCheckpoint,
  describeResolution, checkpointKey, RETRY_FAILURES, SETTLE_MS, RESOLVE_LEASE_MS, COLLECTIONS };
