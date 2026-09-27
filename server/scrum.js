import ScrumHistoryPending from '/server/lib/scrumHistoryPending';
import { ScrumImportPending } from '/server/lib/scrumImportJournal';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
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
const { DEFAULT_SCRUM_SETTINGS, normalizeScrumSettings, normalizeScrumMetadata,
  normalizeScrumRecord, sprintSnapshot, scrumRevisionSelector, validateScrumRevision } = require('/models/lib/scrum');

const { loadScrumSnapshotInputs } = require('./lib/scrumSnapshotInputs');
const { assertScrumLifecycleSize } = require('./lib/scrumLifecycleSize');

const collections = { sprint: ScrumSprints, release: ScrumReleases, event: ScrumEvents };
const queues = new Map();
let historyRecorder = async () => {};
let historyBatchRunner = async (boardId, userId, operation) => operation();
export function setScrumHistoryBatchRunner(runner) { historyBatchRunner = runner; }
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
  for (const [field, collection] of [['sprintId', ScrumSprints], ['releaseId', ScrumReleases]]) {
    if (metadata[field] && !(await collection.findOneAsync({ _id: metadata[field], boardId }))) invalid('Reference does not belong to this board');
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
  for (const sprint of sprints) {
    // Rollover checkpoints contain internal preconditions, not public card data.
    sprint.rolloverPending = (sprint.rolloverPending || []).some(row => visible.has(row.cardId));
    if (restricted) for (const name of ['startSnapshot', 'closeSnapshot']) {
      if (!sprint[name]) continue;
      const rows = sprint[name].cards.filter(row => visible.has(row.cardId));
      sprint[name] = { ...sprint[name], cards: rows, partial: true,
        missingEstimates: rows.filter(row => row.estimate === null).length,
        totalEstimate: rows.reduce((sum, row) => sum + (row.estimate ?? 0), 0) };
    }
  }
  for (const event of events) event.followUpCardIds = (event.followUpCardIds || []).filter(id => visible.has(id));
  // Rendering a capability is not an attempted mutation. Keep write guards'
  // denial logging for actual writes, without blocking read-only viewers.
  const importPending = sprints.some(sprint => sprint.scrumImportPending) ||
    !!await ScrumImportPending.findOneAsync(boardId, { fields: { _id: 1 } });
  for (const card of cards) card.canWrite = !importPending && !!userId && await canEditCardOrLinkedCard(userId, card, board, { recordDenial: false });
  return { boardId, settings: { ...DEFAULT_SCRUM_SETTINGS, ...(board.scrum || {}) },
    settingsRevision: board.scrumRevision || 0, sprints, releases, events, cards, lists, swimlanes, customFields,
    importLosses: userId && board.hasAdmin(userId) ? (board.scrumImportLosses || []) : [],
    importPending, canAdmin: !importPending && !!userId && board.hasAdmin(userId),
    canWrite: !importPending && !!userId && allowIsBoardMemberWithWriteAccess(userId, board),
    partial: restricted };
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
  if (await ScrumSprints.findOneAsync({ boardId, 'rolloverPending.0': { $exists: true } })) {
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
  if (!before) { after.createdAt = now; after.createdBy = userId; if (kind !== 'event') after.state = after.state || 'planned'; }
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
  const scrum = { ...(before.scrum || {}), ...clean };
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
async function resumeRollover(userId, sprint) {
  // A durable checkpoint makes retries safe if a database failure interrupts a
  // close. Never overwrite a card edited or moved after the close snapshot.
  for (const row of sprint.rolloverPending || []) {
    const card = await Cards.findOneAsync({ _id: row.cardId, boardId: sprint.boardId });
    if (!card) conflict();
    if (JSON.stringify(card.scrum || {}) !== JSON.stringify(row.after)) {
      if (JSON.stringify(card.scrum || {}) !== JSON.stringify(row.before) || (card.scrumRevision || 0) !== row.revision) conflict();
      if (!(await Cards.updateAsync({ _id: card._id, boardId: sprint.boardId, ...scrumRevisionSelector(card) }, {
        $set: { scrum: row.after, scrumRevision: row.revision + 1 },
      }))) conflict();
      await recordScrumChange(sprint.boardId, 'card', card, { ...card, scrum: row.after, scrumRevision: row.revision + 1 }, userId);
    }
    await ScrumSprints.updateAsync({ _id: sprint._id, revision: sprint.revision }, { $pull: { rolloverPending: { cardId: row.cardId } } });
  }
  return await ScrumSprints.findOneAsync(sprint._id);
}
export async function getScrumDailyHistory(userId, boardId, sprintId) {
  check(boardId, String); check(sprintId, String);
  if (!sprintId || sprintId.length > 200) invalid('Invalid sprint identifier');
  const board = await boardFor(userId, boardId);
  await assertNoPendingScrumImport(boardId);
  const sprint = await ScrumSprints.findOneAsync({ _id: sprintId, boardId });
  if (!sprint) throw new Meteor.Error('not-found');
  const partial = !!assignedOnlyCardScope(board, userId);
  if (!sprint.startSnapshot) return { rows: [], partial, truncated: false, sprintName: sprint.name };
  const visible = partial ? await Cards.find(cardSelector(board, userId),
    { fields: { _id: 1 }, limit: 10001 }).fetchAsync() : null;
  if (visible?.length > 10000) invalid('Daily Scrum report exceeds its card-scope limit');
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
      rows.push(...dailyHistoryRows([sample], visibleIds));
    }
  } finally { await cursor.close(); }
  return { rows: rows.reverse(), partial, truncated, sprintName: sprint.name };
}
const methods = {
  async 'scrum.getBoardData'(boardId) { check(boardId, String); return getScrumBoardData(this.userId, boardId); },
  async 'scrum.getDailyHistory'(boardId, sprintId) { return getScrumDailyHistory(this.userId, boardId, sprintId); },
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
      return updateSprint(this.userId, sprint, { state: 'active', startedAt,
        startSnapshot: validate(() => sprintSnapshot(cards, settings, lists, startedAt)) });
    });
  },
  async 'scrum.closeSprint'(boardId, sprintId, expectedRevision, rolloverSprintId = null) {
    check(boardId, String); check(sprintId, String); check(expectedRevision, Number); check(rolloverSprintId, Match.OneOf(String, null));
    return locked(boardId, async () => {
      const board = await boardFor(this.userId, boardId, true);
      const sprint = await ScrumSprints.findOneAsync({ _id: sprintId, boardId });
      if (!sprint) throw new Meteor.Error('not-found');
      await assertNoPendingScrumImport(boardId);
      // A retry must not bypass the exclusion used by every other Scrum write.
      if (await ScrumHistoryPending.findOneAsync(boardId)) throw new Meteor.Error('scrum-history-pending', 'Retry the interrupted Scrum History operation first.');
      if (sprint.state === 'closed' && sprint.closedFromRevision === expectedRevision && sprint.rolloverSprintId === rolloverSprintId) return resumeRollover(this.userId, sprint);
      expect(sprint, expectedRevision); await pending(boardId);
      if (sprint.state !== 'active') invalid('Only an active sprint can close');
      if (rolloverSprintId && (rolloverSprintId === sprintId || !(await ScrumSprints.findOneAsync({ _id: rolloverSprintId, boardId, state: 'planned' })))) invalid('Rollover must target a planned sprint on this board');
      const settings = { ...DEFAULT_SCRUM_SETTINGS, ...(board.scrum || {}) };
      const { cards, lists } = await loadScrumSnapshotInputs({ cards: Cards, lists: Lists,
        boardId, sprintId, includeArchived: true });
      const completedAt = new Date();
      const closeSnapshot = validate(() => sprintSnapshot(cards, settings, lists, completedAt));
      const done = new Map(closeSnapshot.cards.map(row => [row.cardId, row.done]));
      const rolloverPending = cards.map(card => ({ cardId: card._id, revision: card.scrumRevision || 0,
        before: card.scrum || {}, after: { ...(card.scrum || {}), sprintId: done.get(card._id) || card.archived ? null : rolloverSprintId,
          pastSprintIds: [...new Set([...(card.scrum?.pastSprintIds || []), sprintId])] } }));
      const closed = await updateSprint(this.userId, sprint, { state: 'closed', completedAt, closeSnapshot,
        closedFromRevision: sprint.revision, rolloverSprintId, rolloverPending });
      return resumeRollover(this.userId, closed);
    });
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
