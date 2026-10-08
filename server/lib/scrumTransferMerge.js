import { Random } from 'meteor/random';
import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import CustomFields from '/models/customFields';
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';
import ScrumEvents from '/models/scrumEvents';
import ScrumDailySnapshots from '/models/scrumDailySnapshots';
import { ScrumImportPending, ScrumImportSteps } from './scrumImportJournal';
import { ScrumSnapshotRows } from './scrumSnapshotStore';
const { writeImportPlan, finishImportPlan } = require('/server/lib/scrumImportWriter');
const { dailyObservationId } = require('/server/lib/scrumDailyCapture');
const { remapScrumTransfer, normalizeScrumTransferLosses } = require('/models/lib/scrumTransfer');
const { planScrumTransferMerge, mergeCardScrum } = require('/models/lib/scrumTransferMerge');
const { chunkSnapshot } = require('/models/lib/scrumSnapshotRows');
const { reportTotals } = require('/models/lib/scrumReports');

// A native Scrum transfer imported INTO an existing board (2026-10-08). What
// matches what is decided by models/lib/scrumTransferMerge.js; this loads the
// board, and writes through the same journaled stage as every Scrum import
// (scrumImportWriter.js), so an interrupted run shows the same warning and is
// finished or discarded the same way (scrumImportRecovery.js). Writes are then
// recorded in Scrum History as one change, which undo reverses like any other.
// The caller (server/scrum.js scrum.importIntoBoard) has checked that the user
// administers the board and holds the board's Scrum lock.

const planningFields = { fields: { _id: 1, name: 1, state: 1, provenance: 1 } };
const cardFields = { _id: 1, title: 1, cardNumber: 1, type: 1, boardId: 1, listId: 1, swimlaneId: 1, scrum: 1, scrumRevision: 1 };
const notLinked = { type: { $nin: ['cardType-linkedCard', 'cardType-linkedBoard'] } };
const MAX_REPORT = 10000;

function sourceCardIds(file) {
  const ids = new Set();
  const transfer = file.scrumTransfer || file;
  const add = id => { if (typeof id === 'string' && id.length <= 200) ids.add(id); };
  for (const row of Array.isArray(transfer.cards) ? transfer.cards : []) add(row?._id);
  for (const sprint of Array.isArray(transfer.sprints) ? transfer.sprints : []) {
    for (const key of ['startSnapshot', 'closeSnapshot']) for (const row of sprint?.[key]?.cards || []) add(row?.cardId);
  }
  for (const row of Array.isArray(transfer.dailyObservations) ? transfer.dailyObservations : []) for (const card of row?.snapshot?.cards || []) add(card?.cardId);
  for (const event of Array.isArray(transfer.events) ? transfer.events : []) for (const id of event?.followUpCardIds || []) add(id);
  return [...ids];
}

async function loadDestination(board, file) {
  const boardId = board._id;
  const ids = sourceCardIds(file);
  const numbers = [...new Set((file.cards || []).map(row => row.cardNumber).filter(Number.isSafeInteger))];
  const [sprints, releases, events, cards, lists, customFields, foreign] = await Promise.all([
    ScrumSprints.find({ boardId }, planningFields).fetchAsync(),
    ScrumReleases.find({ boardId }, planningFields).fetchAsync(),
    ScrumEvents.find({ boardId }, { fields: { _id: 1, provenance: 1, sprintId: 1 } }).fetchAsync(),
    Cards.find({ boardId, ...notLinked, $or: [{ _id: { $in: ids } }, { cardNumber: { $in: numbers } }] }, { fields: cardFields }).fetchAsync(),
    Lists.find({ boardId }, { fields: { _id: 1, title: 1 } }).fetchAsync(),
    CustomFields.find({ boardIds: boardId }, { fields: { _id: 1, name: 1, type: 1 } }).fetchAsync(),
    // A card ID of another board is named in the report, never written.
    Cards.find({ _id: { $in: ids }, boardId: { $ne: boardId } }, { fields: { _id: 1 } }).fetchAsync(),
  ]);
  return { sprints, releases, events, cards, lists, customFields, foreignCardIds: foreign.map(row => row._id),
    memberIds: (board.members || []).filter(member => member.isActive !== false).map(member => member.userId) };
}

const names = (decisions, action) => [...decisions.values()].filter(row => row.action === action).map(row => row.name || '');

export async function importScrumTransferIntoBoard({ userId, boardId, file, dryRun = false, record = async () => {} }) {
  const board = await Boards.findOneAsync(boardId);
  if (!board || !userId || !board.hasAdmin(userId)) throw new Meteor.Error('not-authorized');
  let plan, remapped;
  try {
    const { scrumTransferFileFields } = require('/models/lib/scrumTransferMerge');
    const fields = scrumTransferFileFields(file);
    const destination = await loadDestination(board, fields);
    plan = planScrumTransferMerge(fields, destination, () => Random.id());
    remapped = remapScrumTransfer(plan.prepared, plan.maps);
    plan.cardsById = new Map(destination.cards.map(card => [card._id, card]));
  } catch (error) {
    if (error instanceof Meteor.Error) throw error;
    throw new Meteor.Error('invalid-scrum-transfer', error.message);
  }
  const { transfer } = remapped;
  const losses = [...plan.losses, ...remapped.losses];
  const created = kind => new Set([...plan[kind].values()].filter(row => row.action === 'create').map(row => row.targetId));
  const provenance = new Map([...plan.sprints.values(), ...plan.releases.values(), ...plan.events.values()]
    .filter(row => row.action === 'create').map(row => [row.targetId, row.provenance]));
  const steps = []; const historyRows = [];

  for (const key of ['sprints', 'releases', 'events']) {
    const fresh = created(key);
    for (const row of transfer[key]) {
      if (!fresh.has(row._id)) continue;
      const stored = { ...row };
      if (key === 'sprints') {
        for (const [field, kind] of [['startSnapshot', 'start'], ['closeSnapshot', 'close']]) {
          if (!row[field]) continue;
          const { header, docs } = chunkSnapshot({ boardId, sprintId: row._id, kind, snapshot: row[field] });
          for (const doc of docs) steps.push({ kind: 'insert', collection: 'snapshotRows', after: doc });
          stored[field] = header;
        }
        if (row.startSnapshot || row.closeSnapshot) stored.reportTotals = reportTotals(row);
      }
      const after = { ...stored, provenance: provenance.get(row._id), boardId, revision: 1, incarnation: Random.id() };
      steps.push({ kind: 'insert', collection: key, after: key === 'sprints' ? { ...after, scrumImportPending: true } : after });
      historyRows.push({ kind: `scrum-${key.slice(0, -1)}`, before: null, after });
    }
  }
  for (const row of transfer.dailyObservations) {
    const { header, docs } = chunkSnapshot({ boardId, sprintId: row.sprintId, kind: 'daily', snapshot: row.snapshot });
    for (const doc of docs) steps.push({ kind: 'insert', collection: 'snapshotRows', after: doc });
    steps.push({ kind: 'insert', collection: 'dailyObservations', after: { ...row, boardId, snapshot: header,
      _id: dailyObservationId(row.sprintId, row.startedAt, row.day) } });
  }
  let updated = 0, unchanged = 0;
  for (const row of transfer.cards) {
    const current = plan.cardsById.get(row._id);
    const { scrum, changed, refused } = mergeCardScrum(current.scrum, row.scrum, plan.sprintStates);
    if (refused) losses.push({ path: `cards.${row._id}.scrum.sprintId`, sourceId: refused, reason: 'sprint-finished' });
    if (!changed) { unchanged += 1; continue; }
    updated += 1;
    const scrumRevision = (current.scrumRevision || 0) + 1;
    const before = Object.fromEntries(['scrum', 'scrumRevision'].filter(field => Object.hasOwn(current, field)).map(field => [field, current[field]]));
    steps.push({ kind: 'update', collection: 'cards', id: row._id, boardId, before, after: { scrum, scrumRevision } });
    historyRows.push({ kind: 'card', before: current, after: { ...current, scrum, scrumRevision } });
  }
  const report = normalizeScrumTransferLosses(losses.slice(0, MAX_REPORT));
  const summary = {
    dryRun, sourceBoardId: plan.sourceBoardId,
    sprints: { created: names(plan.sprints, 'create'), matched: names(plan.sprints, 'match'), skipped: names(plan.sprints, 'skip') },
    releases: { created: names(plan.releases, 'create'), matched: names(plan.releases, 'match'), skipped: names(plan.releases, 'skip') },
    events: { created: names(plan.events, 'create').length, matched: names(plan.events, 'match').length },
    // The file's cards with planning that found no card here (cards named only
    // in an old snapshot are not counted).
    cards: { updated, unchanged, unmatched: losses.filter(row => /^cards\.[^.]+$/.test(row.path)).length },
    dailyObservations: transfer.dailyObservations.length,
    losses: report, truncated: losses.length > MAX_REPORT,
  };
  // Nothing new, nothing written: importing the same file again changes nothing.
  if (dryRun || !steps.length) return { ...summary, changed: false };

  const before = Object.fromEntries(['scrum', 'scrumRevision', 'scrumImportLosses'].filter(field => Object.hasOwn(board, field)).map(field => [field, board[field]]));
  // The board's settings stay its own; the report and the revision move on.
  steps.push({ kind: 'update', collection: 'boards', id: boardId, boardId, before,
    after: { scrum: board.scrum || {}, scrumRevision: (board.scrumRevision || 0) + 1, scrumImportLosses: report } });
  const sprintIds = [...created('sprints')];
  const identity = await writeImportPlan({ boardId, operationId: Random.id(), userId, steps,
    pending: ScrumImportPending, journal: ScrumImportSteps, equals: EJSON.equals,
    collections: { boards: Boards, cards: Cards, lists: Lists, swimlanes: Swimlanes,
      sprints: ScrumSprints, releases: ScrumReleases, events: ScrumEvents, dailyObservations: ScrumDailySnapshots,
      snapshotRows: ScrumSnapshotRows } });
  await finishImportPlan({ identity, total: steps.length, pending: ScrumImportPending, journal: ScrumImportSteps,
    clearMarkers: () => ScrumSprints.updateAsync({ boardId, _id: { $in: sprintIds } },
      { $unset: { scrumImportPending: '' } }, { multi: true }) });
  // One History change for the whole import (the caller's batch).
  for (const row of historyRows) await record(boardId, row.kind, row.before, row.after, userId);
  return { ...summary, changed: true };
}
