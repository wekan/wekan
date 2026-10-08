import ScrumHistoryPending from '/server/lib/scrumHistoryPending';
import { ScrumImportPending } from '/server/lib/scrumImportJournal';
import { canEditCardOrLinkedCard, editableCardIds } from '/server/lib/linkedCardPermission';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import CustomFields from '/models/customFields';
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';
import ScrumEvents from '/models/scrumEvents';
import ScrumDailySnapshots from '/models/scrumDailySnapshots';
import { captureOneSprint } from '/server/scrumDailySnapshots';
import { canUserSeeBoard } from '/server/lib/visibleBoardIds';
import { canUpdateCard } from '/server/permissions/cards';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');
const { dailyHistoryRows } = require('/models/lib/scrumDailyHistory');
const { reportTotals, sprintReport } = require('/models/lib/scrumReports');
const { withoutRows, SNAPSHOT_CHUNK } = require('/models/lib/scrumSnapshotRows');
import { storeSnapshot, snapshotRows, withSnapshotRows, withDailyRows } from '/server/lib/scrumSnapshotStore';
import { ROLLOVER_PENDING, hasRolloverPending, storeRolloverPlan, nextRolloverChunk, finishRolloverChunk,
  rolloverTouches } from '/server/lib/scrumRolloverStore';
const { replaySprintScope, changesOf: scopeChangesOf, MAX_SCOPE_REPLAY_ROWS } = require('/models/lib/scrumScopeReplay');
import ChangeHistory from '/models/changeHistory';
import RecoveryEvents from '/models/recoveryEvents';
import { recordRecoveryAudit } from '/server/lib/recoveryAudit';
const { DEFAULT_SCRUM_SETTINGS, normalizeScrumSettings, normalizeScrumMetadata,
  normalizeScrumRecord, sprintSnapshot, scrumRevisionSelector, validateScrumRevision,
  cardReleaseIds, applyCardReleaseChange } = require('/models/lib/scrum');

const { loadScrumSnapshotInputs } = require('./lib/scrumSnapshotInputs');
const { assertScrumLifecycleSize } = require('./lib/scrumLifecycleSize');

const collections = { sprint: ScrumSprints, release: ScrumReleases, event: ScrumEvents };
const queues = new Map();
let historyRecorder = async () => {};
let historyBatchRunner = async (boardId, userId, operation) => operation();
export function setScrumHistoryBatchRunner(runner) { historyBatchRunner = runner; }
let nameHistoryBatch = () => {};
export function setScrumHistoryBatchNamer(namer) { nameHistoryBatch = namer; }
// Existing History owns persistence and compound-operation grouping.
export function setScrumHistoryRecorder(recorder) { historyRecorder = recorder; }
export async function recordScrumChange(boardId, kind, before, after, userId) {
  await historyRecorder({ boardId, entityType: kind, entityId: (after || before)._id,
    previousContent: before || null, newContent: after || null, userId });
}
function conflict() { throw new Meteor.Error('scrum-conflict', 'Scrum data changed. Reload before saving.'); }
function invalid(reason) { throw new Meteor.Error('invalid-scrum', reason); }
function validate(fn) { try { return fn(); } catch (error) { invalid(error.message); } }
function expect(doc, expected, field = 'revision') {
  if (expected === null || expected === undefined) return;
  validate(() => validateScrumRevision(expected));
  if ((doc[field] || 0) !== expected) conflict();
}
export async function withScrumBoardLock(boardId, operation) {
  // Serialize this process's lifecycle operations. Database compare-and-set guards also
  // detect writers on other instances; this is not a multi-document transaction.
  const previous = queues.get(boardId) || Promise.resolve();
  const current = previous.catch(() => {}).then(operation);
  queues.set(boardId, current);
  try { return await current; } finally { if (queues.get(boardId) === current) queues.delete(boardId); }
}
async function locked(boardId, operation) {
  const userId = Meteor.userId();
  return withScrumBoardLock(boardId, () => historyBatchRunner(boardId, userId, operation));
}
async function boardFor(userId, boardId, admin = false) {
  check(boardId, String);
  if (!boardId || boardId.length > 200) invalid('Invalid board identifier');
  if (!(await canUserSeeBoard(userId, boardId))) throw new Meteor.Error('not-authorized');
  const board = await Boards.findOneAsync(boardId);
  if (!board || (admin && (!userId || !board.hasAdmin(userId)))) throw new Meteor.Error('not-authorized');
  return board;
}
async function references(boardId, metadata) {
  if (metadata.sprintId && !(await ScrumSprints.findOneAsync({ _id: metadata.sprintId, boardId }))) invalid('Reference does not belong to this board');
  // Every release of a card (several since 2026-10-08), or a swimlane's one,
  // must be this board's: one read for all of them.
  const releaseIds = cardReleaseIds(metadata);
  if (releaseIds.length && await ScrumReleases.find({ _id: { $in: releaseIds }, boardId }, { fields: { _id: 1 } }).countAsync() !== releaseIds.length) {
    invalid('Reference does not belong to this board');
  }
  for (const sprintId of metadata.pastSprintIds || []) {
    if (!(await ScrumSprints.findOneAsync({ _id: sprintId, boardId }))) invalid('Historical sprint does not belong to this board');
  }
}
function cardSelector(board, userId) {
  return { boardId: board._id, ...(assignedOnlyCardScope(board, userId) || {}) };
}
const cardFields = { title: 1, boardId: 1, listId: 1, swimlaneId: 1, archived: 1,
  dueComplete: 1, scrum: 1, scrumRevision: 1, 'poker.estimation': 1, customFields: 1,
  members: 1, assignees: 1, sort: 1, type: 1, linkedId: 1, parentId: 1 };
export async function getScrumBoardData(userId, boardId) {
  const board = await boardFor(userId, boardId);
  const [cards, lists, swimlanes, sprints, releases, events, customFields] = await Promise.all([
    Cards.find(cardSelector(board, userId), { fields: cardFields }).fetchAsync(),
    Lists.find({ boardId }, { fields: { title: 1, archived: 1, scrum: 1, scrumRevision: 1, sort: 1 } }).fetchAsync(),
    Swimlanes.find({ boardId }, { fields: { title: 1, archived: 1, scrum: 1, scrumRevision: 1, sort: 1 } }).fetchAsync(),
    ScrumSprints.find({ boardId }).fetchAsync(), ScrumReleases.find({ boardId }).fetchAsync(),
    ScrumEvents.find({ boardId }).fetchAsync(),
    CustomFields.find({ boardIds: boardId, type: 'number' }, { fields: { name: 1, type: 1 } }).fetchAsync(),
  ]);
  const visible = new Set(cards.map(card => card._id));
  const restricted = !!assignedOnlyCardScope(board, userId);
  for (let index = 0; index < sprints.length; index += 1) {
    let sprint = sprints[index];
    // Rollover checkpoints contain internal preconditions, not public card data.
    sprint.rolloverPending = restricted ? await rolloverTouches(sprint, visible) : hasRolloverPending(sprint);
    if (restricted && (sprint.startSnapshot || sprint.closeSnapshot)) {
      sprint = await withSnapshotRows(sprint);
      for (const name of ['startSnapshot', 'closeSnapshot']) {
        if (!sprint[name]) continue;
        const rows = sprint[name].cards.filter(row => visible.has(row.cardId));
        sprint[name] = { ...sprint[name], cards: rows, partial: true,
          missingEstimates: rows.filter(row => row.estimate === null).length,
          totalEstimate: rows.reduce((sum, row) => sum + (row.estimate ?? 0), 0) };
      }
    }
    // The report is computed here, from the rows a reader may see or from the
    // totals saved with the sprint; the client gets the report and the
    // snapshots' headers, never their rows (2026-10-03: sprints with no card
    // cap), nor totals a restricted reader may not see.
    sprint.report = sprint.startSnapshot || sprint.closeSnapshot ? sprintReport(sprint) : null;
    for (const name of ['startSnapshot', 'closeSnapshot']) if (sprint[name]) sprint[name] = withoutRows(sprint[name]);
    delete sprint.reportTotals;
    delete sprint.rolloverLease;
    sprints[index] = sprint;
  }
  for (const event of events) event.followUpCardIds = (event.followUpCardIds || []).filter(id => visible.has(id));
  // Rendering a capability is not an attempted mutation. Keep write guards'
  // denial logging for actual writes, without blocking read-only viewers.
  const importPending = sprints.some(sprint => sprint.scrumImportPending) ||
    !!await ScrumImportPending.findOneAsync(boardId, { fields: { _id: 1 } });
  // One batch for all cards (linkedCardPermission.js editableCardIds).
  const editable = importPending ? new Set() : await editableCardIds(userId, cards, board);
  for (const card of cards) card.canWrite = editable.has(card._id);
  return { boardId, settings: { ...DEFAULT_SCRUM_SETTINGS, ...(board.scrum || {}) },
    settingsRevision: board.scrumRevision || 0, sprints, releases, events, cards, lists, swimlanes, customFields,
    importLosses: userId && board.hasAdmin(userId) ? (board.scrumImportLosses || []) : [],
    importPending, canAdmin: !importPending && !!userId && board.hasAdmin(userId),
    // An interrupted import's checkpoint, which an administrator can finish or
    // discard online (scrum.resumeImport, scrum.discardImport).
    canRecoverImport: importPending && !!userId && board.hasAdmin(userId) &&
      !!await ScrumImportPending.findOneAsync(boardId, { fields: { _id: 1 } }),
    canWrite: !importPending && !!userId && allowIsBoardMemberWithWriteAccess(userId, board),
    // A large undo or redo running in the background (scrumBatchJobs.js):
    // its progress, not whose it is.
    historyJob: await batchJobProgress(boardId),
    partial: restricted };
}
async function batchJobProgress(boardId) {
  const { ScrumBatchJobs } = require('/server/lib/scrumBatchJobs');
  const job = await ScrumBatchJobs.findOneAsync(boardId, { fields: { direction: 1, done: 1, total: 1, state: 1, error: 1 } });
  return job ? { direction: job.direction, done: job.done, total: job.total, state: job.state, error: job.error || '' } : null;
}
async function ensureSettings(boardId, settings, board) {
  if (settings.estimateSource === 'customField') {
    if (!settings.estimateCustomFieldId || !(await CustomFields.findOneAsync({ _id: settings.estimateCustomFieldId, boardIds: boardId, type: 'number' }))) invalid('Select a numeric field on this board');
  }
  for (const id of [settings.productOwnerId, settings.scrumMasterId, ...settings.developerIds].filter(Boolean)) {
    if (!board.hasMember(id)) invalid('Scrum accountabilities must reference active board members');
  }
}
export async function assertNoPendingScrumImport(boardId) {
  if (await ScrumImportPending.findOneAsync(boardId, { fields: { _id: 1 } }) ||
      await ScrumSprints.findOneAsync({ boardId, scrumImportPending: true }, { fields: { _id: 1 } })) {
    throw new Meteor.Error('scrum-import-pending', 'The Scrum import is incomplete. Scrum edits and report exports are unavailable.');
  }
}
async function pending(boardId) {
  await assertNoPendingScrumImport(boardId);
  if (await ScrumHistoryPending.findOneAsync(boardId)) throw new Meteor.Error('scrum-history-pending', 'Retry the interrupted Scrum History operation first.');
  if (await ScrumSprints.findOneAsync({ boardId, ...ROLLOVER_PENDING })) {
    throw new Meteor.Error('scrum-rollover-pending', 'Finish the pending sprint rollover first');
  }
}
async function saveRecord(userId, kind, boardId, recordId, changes, expectedRevision) {
  check(recordId, Match.OneOf(String, null)); check(changes, Object);
  check(expectedRevision, Match.OneOf(Number, null));
  await boardFor(userId, boardId, true); await pending(boardId);
  const collection = collections[kind];
  const before = recordId && await collection.findOneAsync({ _id: recordId, boardId });
  if (recordId && !before) throw new Meteor.Error('not-found');
  if (before && expectedRevision === null) conflict();
  if (before) expect(before, expectedRevision);
  if (kind === 'sprint' && before && before.state !== 'planned') invalid('Only planned sprints can be edited');
  const clean = validate(() => normalizeScrumRecord(kind, changes));
  const after = { ...(before || {}), ...clean, boardId };
  if (kind !== 'event' && !after.name) invalid('Name is required');
  if (after.plannedStart && after.plannedEnd && after.plannedStart > after.plannedEnd) invalid('Start must precede end');
  if (kind === 'event') {
    if (!after.sprintId || !after.kind || !after.startsAt) invalid('Sprint, event kind and date are required');
    await references(boardId, after);
    const board = await boardFor(userId, boardId, true);
    for (const id of after.followUpCardIds || []) if (!(await Cards.findOneAsync({ ...cardSelector(board, userId), _id: id }))) invalid('Follow-up card does not belong to this board');
  }
  const now = new Date();
  after.revision = (before?.revision || 0) + 1; after.updatedAt = now; after.updatedBy = userId;
  if (!before) {
    after.createdAt = now; after.createdBy = userId; if (kind !== 'event') after.state = after.state || 'planned';
    // One lifetime of this record (maintainer decision of 2026-09-30): Scrum
    // History tells it from a record deleted and recreated under the same _id.
    after.incarnation = Random.id();
  }
  if (before) {
    const { _id, ...fields } = after;
    if (!(await collection.updateAsync({ _id: recordId, boardId, revision: before.revision }, { $set: fields }))) conflict();
  } else after._id = await collection.insertAsync(after);
  await recordScrumChange(boardId, `scrum-${kind}`, before, after, userId);
  return after;
}
async function updateMetadata(userId, kind, boardId, recordId, metadata, expectedRevision) {
  check(recordId, String); check(metadata, Object); check(expectedRevision, Match.OneOf(Number, null));
  const board = await boardFor(userId, boardId);
  await pending(boardId);
  const collection = { card: Cards, list: Lists, swimlane: Swimlanes }[kind];
  const before = await collection.findOneAsync({ _id: recordId, boardId });
  if (!before) throw new Meteor.Error('not-found');
  const scoped = !assignedOnlyCardScope(board, userId) || (before.assignees || []).includes(userId);
  const allowed = kind === 'card'
    ? scoped && await canUpdateCard(userId, before, ['scrum'], { $set: { scrum: metadata } })
    : allowIsBoardMemberWithWriteAccess(userId, board);
  if (!userId || !allowed) throw new Meteor.Error('not-authorized');
  expect(before, expectedRevision, 'scrumRevision');
  const clean = validate(() => normalizeScrumMetadata(kind, metadata));
  // A card's releases: the list, its legacy first entry, both kept in step
  // (models/lib/scrum.js applyCardReleaseChange).
  const scrum = kind === 'card' ? validate(() => applyCardReleaseChange(before.scrum || {}, clean)) : { ...(before.scrum || {}), ...clean };
  await references(boardId, scrum);
  if (kind === 'card') {
    // Historical membership is lifecycle evidence, never editable by a metadata form.
    if (Object.prototype.hasOwnProperty.call(clean, 'pastSprintIds') && JSON.stringify(clean.pastSprintIds) !== JSON.stringify(before.scrum?.pastSprintIds || [])) invalid('Historical sprint membership is read-only');
    if (scrum.sprintId) {
      const target = await ScrumSprints.findOneAsync(scrum.sprintId);
      if (!['planned', 'active'].includes(target.state) && scrum.sprintId !== before.scrum?.sprintId) invalid('Cannot assign work to a finished sprint');
    }
    if (before.scrum?.sprintId && scrum.sprintId !== before.scrum.sprintId) scrum.pastSprintIds = [...new Set([...(before.scrum.pastSprintIds || []), before.scrum.sprintId])];
  }
  const scrumRevision = (before.scrumRevision || 0) + 1;
  if (!(await collection.updateAsync({ _id: recordId, boardId, ...scrumRevisionSelector(before) }, { $set: { scrum, scrumRevision } }))) conflict();
  const after = { ...before, scrum, scrumRevision };
  await recordScrumChange(boardId, kind, before, after, userId);
  return { _id: recordId, scrum, scrumRevision };
}
async function sprintFor(userId, boardId, sprintId, expectedRevision) {
  check(sprintId, String); check(expectedRevision, Number);
  const board = await boardFor(userId, boardId, true);
  const sprint = await ScrumSprints.findOneAsync({ _id: sprintId, boardId });
  if (!sprint) throw new Meteor.Error('not-found');
  expect(sprint, expectedRevision);
  return { board, sprint };
}
async function updateSprint(userId, before, fields) {
  const after = { ...before, ...fields, revision: before.revision + 1, updatedAt: new Date(), updatedBy: userId };
  try { assertScrumLifecycleSize(before, after); }
  catch (error) {
    if (error.code === 'scrum-document-too-large') invalid(error.message);
    throw error;
  }
  const { _id, ...set } = after;
  if (!(await ScrumSprints.updateAsync({ _id, boardId: before.boardId, revision: before.revision }, { $set: set }))) conflict();
  await recordScrumChange(before.boardId, 'scrum-sprint', before, after, userId);
  return after;
}
// The History batch of one close: its sprint row and every chunk of its
// rollover, written by the background job below, share it, so one undo or
// redo walks the whole close (server/models/changeHistory.js).
const closeBatchId = (sprintId, revision) => `scrum-close-${sprintId}-${revision}`;

// One step of a rollover: one chunk of its plan applied, or the plan
// finished. A durable checkpoint makes retries safe if a database failure
// interrupts a close. Never overwrite a card edited or moved after the close
// snapshot. Returns true when nothing is left.
async function rolloverStep(userId, sprint) {
  const apply = async (row, card) => {
    if (!card || card.boardId !== sprint.boardId) conflict();
    if (JSON.stringify(card.scrum || {}) === JSON.stringify(row.after)) return;
    if (JSON.stringify(card.scrum || {}) !== JSON.stringify(row.before) || (card.scrumRevision || 0) !== row.revision) conflict();
    if (!(await Cards.updateAsync({ _id: card._id, boardId: sprint.boardId, ...scrumRevisionSelector(card) }, {
      $set: { scrum: row.after, scrumRevision: row.revision + 1 },
    }))) conflict();
    await recordScrumChange(sprint.boardId, 'card', card, { ...card, scrum: row.after, scrumRevision: row.revision + 1 }, userId);
  };
  if (Array.isArray(sprint.rolloverPending)) {
    // A plan kept in the sprint document before 2026-10-03, finished as it was.
    for (const row of sprint.rolloverPending) {
      await apply(row, await Cards.findOneAsync({ _id: row.cardId, boardId: sprint.boardId }));
      await ScrumSprints.updateAsync({ _id: sprint._id, revision: sprint.revision }, { $pull: { rolloverPending: { cardId: row.cardId } } });
    }
    return true;
  }
  if (sprint.rolloverPending !== true) return true;
  // The plan in chunks (scrumRolloverStore.js): a chunk's cards read at once,
  // applied, the chunk removed and counted; then the mark.
  const chunk = await nextRolloverChunk(sprint._id);
  if (chunk) {
    if (chunk.boardId !== sprint.boardId) conflict();
    const cards = new Map((await Cards.find({ _id: { $in: chunk.rows.map(row => row.cardId) }, boardId: sprint.boardId })
      .fetchAsync()).map(card => [card._id, card]));
    for (const row of chunk.rows) await apply(row, cards.get(row.cardId));
    await finishRolloverChunk(chunk);
    await ScrumSprints.rawCollection().updateOne({ _id: sprint._id, revision: sprint.revision }, { $inc: { rolloverDone: chunk.rows.length } });
    return false;
  }
  await ScrumSprints.rawCollection().updateOne({ _id: sprint._id, revision: sprint.revision, rolloverPending: true },
    { $unset: { rolloverPending: '', rolloverTotal: '', rolloverDone: '', rolloverError: '', rolloverLease: '' } });
  return true;
}

// The rollover runs in the background, chunk by chunk, each chunk under the
// board's lock and recorded in the close's History batch (maintainer decision
// of 2026-10-03: large sprints close without the browser waiting on one
// call). It resumes after a restart from what is left of the plan, and a
// failure is kept on the sprint for the Scrum view to show; closing again
// retries it.
const rollovers = new Map();
// The job, started once; it rejects with the failure after keeping it on the
// sprint. A sprint of one chunk is rolled over inside the close itself.
export function startRollover(sprintId) {
  if (!rollovers.has(sprintId)) {
    const job = runRollover(sprintId).catch(async error => {
      await ScrumSprints.rawCollection().updateOne({ _id: sprintId, rolloverPending: { $exists: true } },
        { $set: { rolloverError: String(error.reason || error.message || error).slice(0, 500) } }).catch(() => {});
      throw error;
    }).finally(() => rollovers.delete(sprintId));
    rollovers.set(sprintId, job);
  }
  return rollovers.get(sprintId);
}
const INLINE_ROLLOVER = SNAPSHOT_CHUNK;
// For tests and callers that must wait: the running job, if any.
export function rolloverJob(sprintId) { return (rollovers.get(sprintId) || Promise.resolve()).catch(() => {}); }
// One server at a time runs a rollover: each step first takes or renews a
// lease on the sprint, which a server that went away loses when it runs out.
// Another server's live lease means the job is running there, and this one
// leaves it alone. Card writes stay compare-and-set, so a server paused past
// its lease cannot write over the one that took over.
const SERVER_ID = Random.id();
const ROLLOVER_LEASE_MS = 60000;
async function claimRollover(sprintId) {
  const now = new Date();
  const { matchedCount } = await ScrumSprints.rawCollection().updateOne({ _id: sprintId,
    $or: [{ rolloverLease: { $exists: false } }, { 'rolloverLease.owner': SERVER_ID }, { 'rolloverLease.until': { $lt: now } }] },
  { $set: { rolloverLease: { owner: SERVER_ID, until: new Date(now.getTime() + ROLLOVER_LEASE_MS) } } });
  return matchedCount === 1;
}
async function runRollover(sprintId) {
  if (!await claimRollover(sprintId)) return;
  await ScrumSprints.rawCollection().updateOne({ _id: sprintId }, { $unset: { rolloverError: '' } });
  for (;;) {
    const sprint = await ScrumSprints.findOneAsync(sprintId);
    if (!sprint || !(sprint.rolloverPending === true || Array.isArray(sprint.rolloverPending))) return;
    if (!await claimRollover(sprintId)) return;
    const userId = sprint.updatedBy;
    const finished = await withScrumBoardLock(sprint.boardId, () => historyBatchRunner(sprint.boardId, userId,
      () => rolloverStep(userId, sprint), { batchId: closeBatchId(sprint._id, sprint.closedFromRevision) }));
    if (finished) return;
  }
}
Meteor.startup(async () => {
  // Rollovers a restart interrupted continue where their plan stopped.
  for (const sprint of await ScrumSprints.find(ROLLOVER_PENDING, { fields: { _id: 1 } }).fetchAsync()) startRollover(sprint._id).catch(() => {});
});
export async function getScrumDailyHistory(userId, boardId, sprintId) {
  check(boardId, String); check(sprintId, String);
  if (!sprintId || sprintId.length > 200) invalid('Invalid sprint identifier');
  const board = await boardFor(userId, boardId);
  await assertNoPendingScrumImport(boardId);
  const sprint = await ScrumSprints.findOneAsync({ _id: sprintId, boardId });
  if (!sprint) throw new Meteor.Error('not-found');
  const partial = !!assignedOnlyCardScope(board, userId);
  if (!sprint.startSnapshot) return { rows: [], partial, truncated: false, sprintName: sprint.name };
  const visible = partial ? await Cards.find(cardSelector(board, userId), { fields: { _id: 1 } }).fetchAsync() : null;
  const visibleIds = visible && new Set(visible.map(card => card._id));
  // Reading also collects today's first observation. Stored captures use the
  // full sprint; only the response is restricted to the reader's cards.
  await captureOneSprint(sprint);
  const cursor = ScrumDailySnapshots.rawCollection().find({ boardId, sprintId,
    startedAt: new Date(sprint.startSnapshot.at) },
  { sort: { capturedAt: -1 }, limit: 367, batchSize: 1 });
  const rows = []; let truncated = false;
  try {
    for await (const sample of cursor) {
      if (rows.length === 366) { truncated = true; break; }
      rows.push(...dailyHistoryRows([await withDailyRows(sample)], visibleIds));
    }
  } finally { await cursor.close(); }
  return { rows: rows.reverse(), partial, truncated, sprintName: sprint.name };
}
// Every recorded change to a started sprint's scope, estimates and completed
// work, replayed from History (models/lib/scrumScopeReplay.js). The cards are
// every card the sprint held at its start, holds now, or held in between.
export async function getScrumScopeHistory(userId, boardId, sprintId) {
  check(boardId, String); check(sprintId, String);
  if (!sprintId || sprintId.length > 200) invalid('Invalid sprint identifier');
  const board = await boardFor(userId, boardId);
  await assertNoPendingScrumImport(boardId);
  const stored = await ScrumSprints.findOneAsync({ _id: sprintId, boardId });
  if (!stored) throw new Meteor.Error('not-found');
  const partial = !!assignedOnlyCardScope(board, userId);
  if (!stored.startSnapshot || !(stored.startedAt instanceof Date)) return { points: [], partial, sprintName: stored.name };
  // The snapshots' rows, wherever they are kept (scrumSnapshotStore.js).
  const sprint = await withSnapshotRows(stored);
  const raw = ChangeHistory.rawCollection();
  const since = { $gte: sprint.startedAt };
  const ids = new Set(sprint.startSnapshot.cards.map(row => row.cardId));
  for (const card of await Cards.find({ boardId, 'scrum.sprintId': sprintId }, { fields: { _id: 1 } }).fetchAsync()) {
    ids.add(card._id);
  }
  const scrumRows = await raw.find({ boardId, group: 'scrum', createdAt: since },
    { sort: { createdAt: 1 }, limit: MAX_SCOPE_REPLAY_ROWS + 1 }).toArray();
  for (const row of scrumRows) {
    for (const [cardId, , before, after] of scopeChangesOf(row)) if (before === sprintId || after === sprintId) ids.add(cardId);
  }
  const visible = partial ? new Set((await Cards.find(cardSelector(board, userId), { fields: { _id: 1 } })
    .fetchAsync()).map(card => card._id)) : null;
  const cardIds = [...ids].filter(id => !visible || visible.has(id));
  const cards = await Cards.find({ _id: { $in: cardIds } }, { fields: { scrum: 1, customFields: 1, poker: 1,
    dueComplete: 1, listId: 1, archived: 1 }, transform: null }).fetchAsync();
  const fieldRows = await raw.find({ boardId, entityType: 'card', entityId: { $in: cardIds },
    group: { $in: ['customFields', 'dates', 'position', 'lifecycle'] }, createdAt: since },
  { sort: { createdAt: 1 }, limit: MAX_SCOPE_REPLAY_ROWS + 1 }).toArray();
  const lists = await Lists.find({ boardId, 'scrum.category': 'done' }, { fields: { _id: 1 } }).fetchAsync();
  const rows = [...scrumRows, ...fieldRows];
  const result = replaySprintScope({ sprint, cards, rows, doneListIds: lists.map(list => list._id), now: new Date() });
  return { ...result, truncated: result.truncated || scrumRows.length > MAX_SCOPE_REPLAY_ROWS ||
    fieldRows.length > MAX_SCOPE_REPLAY_ROWS, partial, sprintName: sprint.name };
}
async function recoverScrumImportOnline(userId, boardId, action) {
  await boardFor(userId, boardId, true);
  const { recoverImport, discardPreparingImport, ScrumRecoveryError } = require('/server/lib/scrumImportRecovery');
  const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
  return withScrumBoardLock(boardId, async () => {
    // The whole import is being discarded (server/lib/importRuns.js): its
    // board is going, so its Scrum stage is not finished onto it.
    if (await db.collection('importRuns').findOne({ boardId, state: 'discarding' }, { projection: { _id: 1 } })) {
      throw new Meteor.Error('scrum-import-recovery', 'The import of this board is being discarded.');
    }
    try {
      return action === 'discard' ? await discardPreparingImport(db, boardId)
        : await recoverImport(db, boardId, { apply: true, online: true });
    } catch (error) {
      if (error instanceof ScrumRecoveryError) throw new Meteor.Error('scrum-import-recovery', error.message);
      throw error;
    }
  });
}
// A Scrum History checkpoint that a conflict has stranded
// (server/lib/scrumHistoryRecovery.js). Any member who can write sees that one
// blocks the board, and whether it is theirs; a board administrator sees what
// it holds and resolves it - the same role that finishes an interrupted Scrum
// import, since both are the board's Scrum data and nobody outside the board
// needs to act. Each resolution, and each failed one, is a row in Admin Panel
// -> Problems -> Recovery.
async function inspectScrumHistoryCheckpointOnline(userId, boardId) {
  const board = await boardFor(userId, boardId);
  if (!userId || !allowIsBoardMemberWithWriteAccess(userId, board)) throw new Meteor.Error('not-authorized');
  const { inspectScrumHistoryCheckpoint } = require('/server/lib/scrumHistoryRecovery');
  const report = await inspectScrumHistoryCheckpoint(MongoInternals.defaultRemoteCollectionDriver().mongo.db, boardId);
  if (!report.present) return null;
  if (board.hasAdmin(userId)) return { ...report, canResolve: true };
  return { present: true, key: report.key, direction: report.direction, stuck: report.stuck,
    own: report.userId === userId, canResolve: false };
}
async function resolveScrumHistoryCheckpointOnline(userId, connection, boardId, key, action) {
  check(key, String); check(action, Match.OneOf('rollback', 'discard'));
  const board = await boardFor(userId, boardId, true);
  const { resolveScrumHistoryCheckpoint, describeResolution, ScrumHistoryRecoveryError } = require('/server/lib/scrumHistoryRecovery');
  const user = await Meteor.users.findOneAsync(userId, { fields: { username: 1 } });
  const who = `Board admin ${user?.username || userId} (${userId})`;
  const audit = async entry => {
    try {
      await recordRecoveryAudit({ type: RecoveryEvents.types.SCRUM_HISTORY_CHECKPOINT_RESOLVED, user, connection,
        boards: [board], ...entry });
    } catch (error) { /* the record never decides the resolution */ }
  };
  let result;
  try {
    result = await withScrumBoardLock(boardId, () => resolveScrumHistoryCheckpoint(
      MongoInternals.defaultRemoteCollectionDriver().mongo.db, boardId, { action, key, online: true, actor: userId }));
  } catch (error) {
    await audit({ done: false, detail: `${who} could not ${action === 'rollback' ? 'roll back' : 'discard'} the stopped ` +
      `Scrum History operation ${key} on board ${boardId}: ${error.message || error.reason || 'unknown error'}` });
    if (error instanceof ScrumHistoryRecoveryError) throw new Meteor.Error('scrum-history-recovery', error.message);
    throw error;
  }
  if (result.changed) {
    await audit({ done: true, deletedData: result.removedRecords > 0, severity: 'warning',
      detail: describeResolution({ ...result, boardId }, who) });
  }
  return result;
}
const methods = {
  async 'scrum.getBoardData'(boardId) { check(boardId, String); return getScrumBoardData(this.userId, boardId); },
  async 'scrum.getDailyHistory'(boardId, sprintId) { return getScrumDailyHistory(this.userId, boardId, sprintId); },
  async 'scrum.getScopeHistory'(boardId, sprintId) { return getScrumScopeHistory(this.userId, boardId, sprintId); },
  // An interrupted Scrum import, finished or discarded online by a board
  // administrator (server/lib/scrumImportRecovery.js), once its writer's lease
  // has run out.
  async 'scrum.resumeImport'(boardId) { return recoverScrumImportOnline(this.userId, boardId, 'resume'); },
  async 'scrum.discardImport'(boardId) { return recoverScrumImportOnline(this.userId, boardId, 'discard'); },
  // A native Scrum transfer imported INTO this board (2026-10-08): sprints and
  // releases matched or created, cards matched, never a new board
  // (server/lib/scrumTransferMerge.js). A board administrator's, through the
  // journaled import stage, recorded in History as one change; `dryRun`
  // returns what would change and writes nothing.
  async 'scrum.importIntoBoard'(boardId, file, options = {}) {
    check(boardId, String); check(file, Object); check(options, { dryRun: Match.Optional(Boolean) });
    const userId = this.userId;
    return locked(boardId, async () => {
      await boardFor(userId, boardId, true); await pending(boardId);
      const { importScrumTransferIntoBoard } = require('/server/lib/scrumTransferMerge');
      return importScrumTransferIntoBoard({ userId, boardId, file, dryRun: options.dryRun === true, record: recordScrumChange });
    });
  },
  // A Scrum History undo or redo stopped on a conflict, inspected by a member
  // and rolled back or discarded by a board administrator.
  async 'scrum.inspectHistoryCheckpoint'(boardId) { check(boardId, String); return inspectScrumHistoryCheckpointOnline(this.userId, boardId); },
  async 'scrum.resolveHistoryCheckpoint'(boardId, key, action) {
    check(boardId, String);
    return resolveScrumHistoryCheckpointOnline(this.userId, this.connection, boardId, key, action);
  },
  async 'scrum.configure'(boardId, changes, expectedRevision = null) {
    check(boardId, String); check(changes, Object); check(expectedRevision, Match.OneOf(Number, null));
    return locked(boardId, async () => {
      const before = await boardFor(this.userId, boardId, true); await pending(boardId);
      expect(before, expectedRevision, 'scrumRevision');
      const scrum = { ...DEFAULT_SCRUM_SETTINGS, ...(before.scrum || {}), ...validate(() => normalizeScrumSettings(changes)) };
      scrum.visibility = { ...(before.scrum?.visibility || {}), ...(scrum.visibility || {}) };
      await ensureSettings(boardId, scrum, before);
      const previous = { ...DEFAULT_SCRUM_SETTINGS, ...(before.scrum || {}) };
      const policyChanged = ['estimateSource', 'estimateCustomFieldId', 'estimateUnit', 'completionPolicy'].some(key => scrum[key] !== previous[key]);
      if (policyChanged && await ScrumSprints.findOneAsync({ boardId, state: 'active' })) invalid('Cannot change estimate units or completion policy during an active sprint');
      const scrumRevision = (before.scrumRevision || 0) + 1;
      if (!(await Boards.updateAsync({ _id: boardId, ...scrumRevisionSelector(before) }, { $set: { scrum, scrumRevision } }))) conflict();
      await recordScrumChange(boardId, 'board', before, { ...before, scrum, scrumRevision }, this.userId);
      return { settings: scrum, settingsRevision: scrumRevision };
    });
  },
  async 'scrum.startSprint'(boardId, sprintId, expectedRevision) {
    check(boardId, String); check(sprintId, String); check(expectedRevision, Number);
    return locked(boardId, async () => {
      const { board, sprint } = await sprintFor(this.userId, boardId, sprintId, expectedRevision); await pending(boardId);
      if (sprint.state !== 'planned') invalid('Only a planned sprint can start');
      if (!sprint.plannedStart || !sprint.plannedEnd || sprint.plannedStart > sprint.plannedEnd) invalid('Valid planned start and end dates are required');
      const settings = { ...DEFAULT_SCRUM_SETTINGS, ...(board.scrum || {}) };
      await ensureSettings(boardId, settings, board);
      if (sprint.capacity != null && sprint.capacityUnit !== settings.estimateUnit) invalid('Capacity and estimates must use the same unit');
      const { cards, lists } = await loadScrumSnapshotInputs({ cards: Cards, lists: Lists,
        boardId, sprintId, includeArchived: false });
      const startedAt = new Date();
      // The rows go to their own documents (scrumSnapshotStore.js); the sprint
      // keeps the header and the report's totals, computed from all of them.
      const snapshot = validate(() => sprintSnapshot(cards, settings, lists, startedAt));
      const startSnapshot = await storeSnapshot({ boardId, sprintId, kind: 'start', snapshot });
      return updateSprint(this.userId, sprint, { state: 'active', startedAt, startSnapshot,
        reportTotals: reportTotals({ startSnapshot: snapshot }) });
    });
  },
  async 'scrum.closeSprint'(boardId, sprintId, expectedRevision, rolloverSprintId = null) {
    check(boardId, String); check(sprintId, String); check(expectedRevision, Number); check(rolloverSprintId, Match.OneOf(String, null));
    const userId = this.userId;
    // A sprint of up to one chunk of cards is closed and rolled over in one
    // History row, as always; a larger one names its batch, and its rollover
    // continues in the background under that name.
    const inline = async closed => {
      // Another server running this rollover (its lease is live) is left to it.
      if (!await claimRollover(closed._id)) throw new Meteor.Error('scrum-rollover-running', 'The rollover is running on another server.');
      try { while (!(await rolloverStep(userId, await ScrumSprints.findOneAsync(closed._id)))); }
      catch (error) {
        await ScrumSprints.rawCollection().updateOne({ _id: closed._id, rolloverPending: { $exists: true } },
          { $set: { rolloverError: String(error.reason || error.message || error).slice(0, 500) } }).catch(() => {});
        throw error;
      }
      return ScrumSprints.findOneAsync(closed._id);
    };
    const small = sprint => Array.isArray(sprint.rolloverPending) || (sprint.rolloverTotal || 0) <= INLINE_ROLLOVER;
    const result = await withScrumBoardLock(boardId, () => historyBatchRunner(boardId, userId, async () => {
      const board = await boardFor(this.userId, boardId, true);
      const sprint = await ScrumSprints.findOneAsync({ _id: sprintId, boardId });
      if (!sprint) throw new Meteor.Error('not-found');
      await assertNoPendingScrumImport(boardId);
      // A retry must not bypass the exclusion used by every other Scrum write.
      if (await ScrumHistoryPending.findOneAsync(boardId)) throw new Meteor.Error('scrum-history-pending', 'Retry the interrupted Scrum History operation first.');
      // A retry of the same close resumes its rollover, if it stopped.
      if (sprint.state === 'closed' && sprint.closedFromRevision === expectedRevision && sprint.rolloverSprintId === rolloverSprintId) {
        if (sprint.rolloverPending && small(sprint) && !rollovers.has(sprint._id)) {
          await ScrumSprints.rawCollection().updateOne({ _id: sprint._id }, { $unset: { rolloverError: '' } });
          return inline(sprint);
        }
        return sprint;
      }
      expect(sprint, expectedRevision); await pending(boardId);
      if (sprint.state !== 'active') invalid('Only an active sprint can close');
      if (rolloverSprintId && (rolloverSprintId === sprintId || !(await ScrumSprints.findOneAsync({ _id: rolloverSprintId, boardId, state: 'planned' })))) invalid('Rollover must target a planned sprint on this board');
      const settings = { ...DEFAULT_SCRUM_SETTINGS, ...(board.scrum || {}) };
      const { cards, lists } = await loadScrumSnapshotInputs({ cards: Cards, lists: Lists,
        boardId, sprintId, includeArchived: true });
      const completedAt = new Date();
      const fullClose = validate(() => sprintSnapshot(cards, settings, lists, completedAt));
      const done = new Map(fullClose.cards.map(row => [row.cardId, row.done]));
      const closeSnapshot = await storeSnapshot({ boardId, sprintId, kind: 'close', snapshot: fullClose });
      const totals = reportTotals({ startSnapshot: { cards: await snapshotRows(sprint, 'startSnapshot') },
        closeSnapshot: fullClose });
      // The plan goes to its own chunks before the sprint is marked
      // (scrumRolloverStore.js), so its size is not the sprint document's.
      await storeRolloverPlan({ boardId, sprintId, rows: cards.map(card => ({ cardId: card._id, revision: card.scrumRevision || 0,
        before: card.scrum || {}, after: { ...(card.scrum || {}), sprintId: done.get(card._id) || card.archived ? null : rolloverSprintId,
          pastSprintIds: [...new Set([...(card.scrum?.pastSprintIds || []), sprintId])] } })) });
      const closed = await updateSprint(this.userId, sprint, { state: 'closed', completedAt, closeSnapshot, reportTotals: totals,
        closedFromRevision: sprint.revision, rolloverSprintId,
        ...(cards.length ? { rolloverPending: true, rolloverTotal: cards.length, rolloverDone: 0 } : {}) });
      if (!closed.rolloverPending) return closed;
      if (small(closed)) return inline(closed);
      nameHistoryBatch(closeBatchId(sprintId, closed.closedFromRevision));
      return closed;
    }));
    // More cards follow in the background while the Scrum view shows the
    // progress; a retry of a stopped one starts it again.
    if (result.rolloverPending && !small(result)) startRollover(result._id).catch(() => {});
    return result;
  },
  async 'scrum.cancelSprint'(boardId, sprintId, expectedRevision, reason) {
    check(boardId, String); check(sprintId, String); check(expectedRevision, Number); check(reason, String);
    if (!reason.trim() || reason.length > 10000) invalid('Cancellation reason is required');
    return locked(boardId, async () => {
      const { sprint } = await sprintFor(this.userId, boardId, sprintId, expectedRevision); await pending(boardId);
      if (!['planned', 'active'].includes(sprint.state)) invalid('Sprint is already finished');
      return updateSprint(this.userId, sprint, { state: 'cancelled', cancelledAt: new Date(), cancellationReason: reason });
    });
  },
};
for (const kind of ['Sprint', 'Release', 'Event']) {
  methods[`scrum.save${kind}`] = async function(boardId, id, changes, expectedRevision = null) {
    check(boardId, String); check(id, Match.OneOf(String, null)); check(changes, Object); check(expectedRevision, Match.OneOf(Number, null));
    return locked(boardId, () => saveRecord(this.userId, kind.toLowerCase(), boardId, id, changes, expectedRevision));
  };
}
for (const kind of ['Card', 'List', 'Swimlane']) {
  methods[`scrum.update${kind}`] = async function(boardId, id, metadata, expectedRevision = null) {
    check(boardId, String); check(id, String); check(metadata, Object); check(expectedRevision, Match.OneOf(Number, null));
    return locked(boardId, () => updateMetadata(this.userId, kind.toLowerCase(), boardId, id, metadata, expectedRevision));
  };
}
Meteor.methods(methods);
DDPRateLimiter.addRule({ type: 'method', name: name => Object.prototype.hasOwnProperty.call(methods, name),
  connectionId: () => true }, 120, 60000);
