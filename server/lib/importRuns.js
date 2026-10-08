'use strict';
// Board import runs: a record of every board import, written BEFORE the import
// writes anything, so an import that stops halfway leaves a trace instead of a
// partial board nobody knows about.
//
// The run is created with the id the new board WILL have, chosen here, and the
// creators insert the board with that id and the run's id stamped on it
// (models/lib/importPipeline.js plannedBoardFields). So the link between a run
// and its board is durable before the board exists: there is no moment in
// which a board was created that no run names.
//
// While the import runs, a heartbeat renews `touchedAt` and the current stage.
// When it ends the run is marked finished, or failed. A run that is still
// "running" with no heartbeat for `staleMs`, or that failed after its board was
// created, is flagged ONCE as interrupted; the caller writes one Recovery event
// for it. An administrator then KEEPS the partial board as it is, or DISCARDS
// it: the board, which carries this run's id, and every document whose boardId
// is that board's - the board id was allocated for this run, so no other board
// can share it.
//
// There is no "finish" or "resume": that needs the source document, and it is
// deliberately not kept (docs/Features/ImportExport/Import-Run-Recovery.md).
// An interrupted import is completed by discarding it and importing the file
// again. The Scrum stage keeps its own private plan and resumes from it
// (server/lib/scrumImportRecovery.js); this module only reports that checkpoint
// and never discards a board whose Scrum writer or offline recovery is active.
//
// Meteor-free; collections are raw MongoDB collections, injected.
const { randomUUID, randomInt } = require('node:crypto');

const RUN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Meteor's Random.id() alphabet and length, so the board id looks like every
// other board id.
const ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
const DEFAULT_STALE_MS = 10 * 60 * 1000;
const HEARTBEAT_MS = 30 * 1000;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const LIST_LIMIT = 50;
const STAGE = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const SOURCE = /^[a-z][a-z0-9-]{0,31}$/;

// Collections whose documents belong to a board through `boardId`. The order
// is children before parents, so a discard that stops halfway never leaves a
// card without its list while the list is still there to be found.
const BOARD_OWNED = ['activities', 'card_comments', 'checklistItems', 'checklists', 'cards', 'lists',
  'swimlanes', 'integrations', 'rules', 'triggers', 'actions', 'scrumEvents', 'scrumDailySnapshots',
  'scrumSnapshotRows', 'scrumRolloverRows', 'scrumSprints', 'scrumReleases', 'scrumImportSteps'];
// What Problems -> Recovery counts for a run, so the administrator sees what a
// discard would remove.
const COUNTED = { swimlanes: 'swimlanes', lists: 'lists', cards: 'cards', checklists: 'checklists',
  comments: 'card_comments' };

const fail = reason => { throw Object.assign(new Error(`import-run-${reason}`), { reason }); };

function newBoardId() {
  let id = '';
  for (let i = 0; i < 17; i++) id += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
  return id;
}

// Before the first write. Returns the run, whose boardId the creator must use.
async function startRun({ runs, userId, source, now = () => new Date() }) {
  if (typeof source !== 'string' || !SOURCE.test(source)) fail('invalid');
  const at = now();
  const run = { _id: randomUUID(), version: 1, state: 'running', userId: typeof userId === 'string' ? userId : null,
    source, boardId: newBoardId(), startedAt: at, touchedAt: at, stage: 'start' };
  await runs.insertOne(run);
  return run;
}

// Renew the heartbeat. Returns false when the run is no longer running - it
// was flagged interrupted because its heartbeat stopped - and the writer must
// stop: an administrator may be discarding its board.
async function touchRun({ runs, runId, stage, now = () => new Date() }) {
  const set = { touchedAt: now() };
  if (typeof stage === 'string' && STAGE.test(stage)) set.stage = stage;
  return (await runs.updateOne({ _id: runId, state: 'running' }, { $set: set })).matchedCount === 1;
}

// The import returned. A run flagged interrupted meanwhile (its heartbeat was
// late) that nobody has decided on yet is finished all the same.
async function finishRun({ runs, runId, boardId, now = () => new Date() }) {
  return (await runs.updateOne({ _id: runId, state: { $in: ['running', 'interrupted'] }, boardId },
    { $set: { state: 'finished', finishedAt: now() }, $unset: { interruptedAt: '' } })).matchedCount === 1;
}

// The import threw. Only the error's code is kept: a message can carry the
// imported data. A run that failed before its board existed created nothing
// that a discard could remove (placeholder members are shared and inert), so
// it is closed as empty and never shown.
async function failRun({ runs, boards, runId, error, now = () => new Date() }) {
  const run = await runs.findOne({ _id: runId });
  if (!run) return false;
  const code = String(error?.error || error?.code || error?.name || 'error').slice(0, 64);
  const board = await boards.findOne({ _id: run.boardId }, { projection: { _id: 1 } });
  return (await runs.updateOne({ _id: runId, state: 'running' },
    { $set: { state: board ? 'failed' : 'failed-empty', finishedAt: now(), errorCode: code } })).matchedCount === 1;
}

// Flag runs that stopped. Each run is flagged by exactly one conditional
// update, so two servers scanning together, or a scan every few minutes,
// return it once; the caller records one Recovery event per returned run.
// Old closed runs are removed after `retentionMs`.
async function scanRuns({ runs, now = () => new Date(), staleMs = DEFAULT_STALE_MS, retentionMs = RETENTION_MS,
  limit = 100 }) {
  const at = now();
  const flagged = [];
  const candidates = await runs.find({ $or: [
    { state: 'running', touchedAt: { $lt: new Date(at.getTime() - staleMs) } },
    { state: 'failed' },
  ] }).sort({ startedAt: 1 }).limit(limit).toArray();
  for (const run of candidates) {
    const selector = run.state === 'running'
      ? { _id: run._id, state: 'running', touchedAt: run.touchedAt }
      : { _id: run._id, state: 'failed' };
    const result = await runs.updateOne(selector,
      { $set: { state: 'interrupted', interruptedAt: at, interruptedFrom: run.state } });
    if (result.modifiedCount === 1) flagged.push({ ...run, state: 'interrupted', interruptedAt: at, interruptedFrom: run.state });
  }
  await runs.deleteMany({ state: { $in: ['finished', 'failed-empty', 'discarded', 'kept'] },
    $or: [{ finishedAt: { $lt: new Date(at.getTime() - retentionMs) } },
      { decidedAt: { $lt: new Date(at.getTime() - retentionMs) } }] });
  return flagged;
}

// What the board of a run holds now. Counts only; never titles or contents.
async function describeBoard({ db, boardId }) {
  const board = await db.collection('boards').findOne({ _id: boardId },
    { projection: { _id: 1, title: 1, archived: 1, importRunId: 1 } });
  const counts = {};
  for (const [key, name] of Object.entries(COUNTED)) counts[key] = await db.collection(name).countDocuments({ boardId });
  counts.attachments = await db.collection('attachments').countDocuments({ 'meta.boardId': boardId });
  const scrum = await db.collection('scrumImportPending').findOne({ _id: boardId },
    { projection: { state: 1, next: 1, total: 1, leaseUntil: 1 } });
  return { board, counts, scrum: scrum ? { state: scrum.state, next: scrum.next, total: scrum.total } : null };
}

function describeRun(run, { board, counts, scrum }) {
  return { runId: run._id, source: run.source, userId: run.userId, boardId: run.boardId,
    boardTitle: board?.title || '', boardExists: !!board, boardArchived: !!board?.archived,
    foreignBoard: !!board && board.importRunId !== run._id,
    state: run.state, interruptedFrom: run.interruptedFrom || null, stage: run.stage || null,
    errorCode: run.errorCode || null, startedAt: run.startedAt || null, touchedAt: run.touchedAt || null,
    interruptedAt: run.interruptedAt || null, counts, scrum };
}

// Problems -> Recovery: every run waiting for a decision, or whose discard
// stopped halfway, with what its board holds now.
async function listInterruptedRuns({ db, limit = LIST_LIMIT }) {
  const rows = await db.collection('importRuns').find({ state: { $in: ['interrupted', 'discarding'] } })
    .sort({ interruptedAt: 1, _id: 1 }).limit(limit + 1).toArray();
  const result = [];
  for (const run of rows.slice(0, limit)) result.push(describeRun(run, await describeBoard({ db, boardId: run.boardId })));
  return { rows: result, truncated: rows.length > limit };
}

// A Scrum stage still being written, or claimed by the offline recovery
// command, belongs to that writer: the board is not discarded under it.
async function scrumBusy(db, boardId, at) {
  if (await db.collection('scrumImportRecoveryLocks').findOne({ _id: boardId }, { projection: { _id: 1 } })) return true;
  const pending = await db.collection('scrumImportPending').findOne({ _id: boardId }, { projection: { leaseUntil: 1 } });
  return !!(pending && pending.leaseUntil instanceof Date && pending.leaseUntil > at);
}

// Remove what a discarded run left, by the board id allocated for it. Safe to
// repeat: what is gone is not counted again, and nothing outside the board is
// selected. Custom fields are shared between boards through `boardIds`; only
// those that belong to this board alone are removed. Attachments are not
// deleted here: their records and files go with the board through its own
// removal (the one hard delete of attachments, server/models/boards.js), so
// any still carrying this board id are only counted, for the audit row.
async function sweepBoard({ db, boardId }) {
  const removed = {};
  for (const name of BOARD_OWNED) {
    const { deletedCount } = await db.collection(name).deleteMany({ boardId });
    if (deletedCount) removed[name] = deletedCount;
  }
  const fields = await db.collection('customFields').deleteMany({ boardIds: [boardId] });
  if (fields.deletedCount) removed.customFields = fields.deletedCount;
  const pending = await db.collection('scrumImportPending').deleteOne({ _id: boardId });
  if (pending.deletedCount) removed.scrumImportPending = pending.deletedCount;
  const left = await db.collection('attachments').countDocuments({ 'meta.boardId': boardId });
  return { removed, attachmentsLeft: left };
}

function checkArgs(runId, operator) {
  if (typeof runId !== 'string' || !RUN_ID.test(runId) || typeof operator !== 'string' || !operator ||
      operator.length > 200) fail('invalid');
}

// The administrator's discard. Refused unless the run is interrupted (or its
// discard stopped halfway), its board is the one it created, and no Scrum
// writer holds the board. The decision is written first (state discarding),
// so a discard that stops halfway is finished by the next one rather than
// left as a half-removed board. `removeBoard` removes the board through the
// application, so its own removal hooks run (attachment files, history);
// the sweep that follows removes whatever is left by the board id.
async function discardRun({ db, runId, operator, removeBoard, now = () => new Date() }) {
  checkArgs(runId, operator);
  if (typeof removeBoard !== 'function') fail('invalid');
  const runs = db.collection('importRuns');
  let run = await runs.findOne({ _id: runId });
  if (!run) fail('missing');
  if (run.state === 'discarded') {
    // Discarding again changes nothing that is not already gone.
    const swept = await sweepBoard({ db, boardId: run.boardId });
    return { runId, boardId: run.boardId, status: 'already-discarded', decidedNow: false, ...swept };
  }
  if (!['interrupted', 'discarding'].includes(run.state)) fail('not-interrupted');
  const board = await db.collection('boards').findOne({ _id: run.boardId }, { projection: { _id: 1, importRunId: 1 } });
  // A board with this id that this run did not create is never touched.
  if (board && board.importRunId !== run._id) fail('foreign-board');
  const at = now();
  if (await scrumBusy(db, run.boardId, at)) fail('scrum-busy');
  let decidedNow = false;
  if (run.state === 'interrupted') {
    const decided = await runs.updateOne({ _id: runId, state: 'interrupted' },
      { $set: { state: 'discarding', decision: 'discard', decidedBy: operator, decidedAt: at } });
    decidedNow = decided.modifiedCount === 1;
    run = await runs.findOne({ _id: runId });
    if (!run || !['discarding', 'discarded'].includes(run.state)) fail('not-interrupted');
  }
  let attachments = 0;
  if (board) {
    attachments = await db.collection('attachments').countDocuments({ 'meta.boardId': run.boardId });
    await removeBoard(run.boardId);
  }
  const { removed, attachmentsLeft } = await sweepBoard({ db, boardId: run.boardId });
  if (board) Object.assign(removed, { boards: 1 }, attachments > attachmentsLeft ? { attachments: attachments - attachmentsLeft } : {});
  await runs.updateOne({ _id: runId, state: 'discarding' }, { $set: { state: 'discarded', discardedAt: now() } });
  return { runId, boardId: run.boardId, status: 'discarded', decidedNow, removed, attachmentsLeft };
}

// The administrator keeps the partial board as it is. Only the run changes.
async function keepRun({ db, runId, operator, now = () => new Date() }) {
  checkArgs(runId, operator);
  const runs = db.collection('importRuns');
  const run = await runs.findOne({ _id: runId });
  if (!run) fail('missing');
  if (run.state === 'kept') return { runId, boardId: run.boardId, status: 'already-kept', decidedNow: false };
  if (run.state !== 'interrupted') fail('not-interrupted');
  const decided = await runs.updateOne({ _id: runId, state: 'interrupted' },
    { $set: { state: 'kept', decision: 'keep', decidedBy: operator, decidedAt: now() } });
  if (decided.modifiedCount !== 1) {
    const current = await runs.findOne({ _id: runId });
    if (current?.state === 'kept') return { runId, boardId: run.boardId, status: 'already-kept', decidedNow: false };
    fail('not-interrupted');
  }
  const pending = await db.collection('scrumImportPending').findOne({ _id: run.boardId }, { projection: { state: 1 } });
  return { runId, boardId: run.boardId, status: 'kept', decidedNow: true, scrumPending: pending?.state || null };
}

// Wrap the creator's own async methods so each one names the current stage
// and refuses to start once the run was fenced (its heartbeat was overtaken)
// or aborted (the method's deadline answered the client). Only methods that
// already return a promise are wrapped, so no caller's contract changes.
function instrumentCreator(creator, gate) {
  const seen = new Set(['constructor', 'create']);
  for (let proto = Object.getPrototypeOf(creator); proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (seen.has(name)) continue;
      seen.add(name);
      const fn = Object.getOwnPropertyDescriptor(proto, name)?.value;
      if (typeof fn !== 'function' || fn.constructor?.name !== 'AsyncFunction') continue;
      creator[name] = async function stage(...args) {
        gate(name);
        return fn.apply(this, args);
      };
    }
  }
}

// Run one import under a run record. `execute` calls the creator; the creator
// reads creator.importRun for the board id and stamp (plannedBoardFields).
// Returns { promise, abort }: abort() is for the caller's deadline - the
// client has been told the import stopped, so the writer stops at its next
// stage and its heartbeat ends; the run is then flagged like any other.
function trackImport({ runs, boards, userId, source, creator, execute, heartbeatMs = HEARTBEAT_MS,
  now = () => new Date(), timers = globalThis }) {
  const state = { stage: 'start', fenced: false, aborted: false };
  let timer = null;
  const stop = () => { if (timer) { timers.clearInterval(timer); timer = null; } };
  const promise = (async () => {
    const run = await startRun({ runs, userId, source, now });
    creator.importRun = { runId: run._id, boardId: run.boardId };
    instrumentCreator(creator, name => {
      if (state.fenced || state.aborted) {
        throw Object.assign(new Error('import-aborted'), { error: 'import-aborted' });
      }
      state.stage = name;
    });
    const beat = async () => {
      if (state.aborted) return;
      try { if (!await touchRun({ runs, runId: run._id, stage: state.stage, now })) state.fenced = true; }
      catch (_) { /* the next beat tries again; staleness decides */ }
    };
    timer = timers.setInterval(beat, heartbeatMs);
    if (timer && typeof timer.unref === 'function') timer.unref();
    try {
      const boardId = await execute();
      stop();
      await finishRun({ runs, runId: run._id, boardId: run.boardId, now });
      return boardId;
    } catch (error) {
      stop();
      try { await failRun({ runs, boards, runId: run._id, error, now }); } catch (_) { /* the scan flags it as stale */ }
      throw error;
    }
  })();
  return { promise, abort() { state.aborted = true; stop(); } };
}

// One line for Problems -> Recovery: what stopped, where, and what is there.
function describeInterruption(run, { counts, scrum, board } = {}) {
  const parts = [`Board import ${run._id} (${run.source}) started ${run.startedAt?.toISOString?.() || ''}` +
    ` stopped at stage ${run.stage || 'unknown'}` +
    (run.interruptedFrom === 'failed' ? ` with error ${run.errorCode || 'unknown'}` : ' without finishing') + '.'];
  if (!board) parts.push(`Its board ${run.boardId} was not created.`);
  else if (counts) {
    parts.push(`Board ${run.boardId} has ${counts.swimlanes} swimlanes, ${counts.lists} lists, ${counts.cards} cards, ` +
      `${counts.checklists} checklists, ${counts.comments} comments and ${counts.attachments} attachments so far.`);
  }
  if (scrum) parts.push(`Its Scrum stage has its own checkpoint (${scrum.state}, ${scrum.next} of ${scrum.total} steps).`);
  parts.push('Keep or discard it in Admin Panel -> Problems -> Recovery.');
  return parts.join(' ');
}

module.exports = { startRun, touchRun, finishRun, failRun, scanRuns, listInterruptedRuns, describeBoard,
  describeInterruption, discardRun, keepRun, sweepBoard, trackImport, instrumentCreator, newBoardId, BOARD_OWNED, DEFAULT_STALE_MS, HEARTBEAT_MS,
  RETENTION_MS, RUN_ID };
