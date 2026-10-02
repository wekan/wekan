import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';
import ScrumEvents from '/models/scrumEvents';
import ScrumDailySnapshots from '/models/scrumDailySnapshots';
import ScrumHistoryPending from './scrumHistoryPending';
import { ScrumImportPending } from './scrumImportJournal';
import { withSnapshotRows, withDailyRows } from './scrumSnapshotStore';
import { hasRolloverPending } from './scrumRolloverStore';
const { normalizeScrumTransfer, SCRUM_TRANSFER_FORMAT } = require('/models/lib/scrumTransfer');

// Call only after the existing export route has authorized the board and scope.
// Never export private recovery checkpoints or destination revision counters.
export async function exportScrumTransfer(boardId, cardIds, listIds, swimlaneIds, scoped = false, includeCustomFields = true) {
  const [board, cards, lists, swimlanes, sprints, releases, events] = await Promise.all([
    Boards.findOneAsync(boardId),
    Cards.find({ boardId, _id: { $in: cardIds }, scrum: { $exists: true } }, { fields: { scrum: 1 } }).fetchAsync(),
    Lists.find({ boardId, _id: { $in: listIds }, scrum: { $exists: true } }, { fields: { scrum: 1 } }).fetchAsync(),
    Swimlanes.find({ boardId, _id: { $in: swimlaneIds }, scrum: { $exists: true } }, { fields: { scrum: 1 } }).fetchAsync(),
    ScrumSprints.find({ boardId }).fetchAsync(), ScrumReleases.find({ boardId }).fetchAsync(), ScrumEvents.find({ boardId }).fetchAsync(),
  ]);
  // The transfer carries snapshots whole, their rows included, wherever they
  // are kept (scrumSnapshotStore.js).
  for (let index = 0; index < sprints.length; index += 1) sprints[index] = await withSnapshotRows(sprints[index]);
  if (!board) throw new Error('Board no longer exists');
  if (await ScrumImportPending.findOneAsync(boardId, { fields: { _id: 1 } })) {
    throw new Error('Finish the pending Scrum operation before exporting');
  }
  if (!board.scrum && !cards.length && !lists.length && !swimlanes.length && !sprints.length && !releases.length && !events.length) return null;
  if (await ScrumHistoryPending.findOneAsync(boardId) || sprints.some(s => s.scrumImportPending || hasRolloverPending(s))) {
    throw new Error('Finish the pending Scrum operation before exporting');
  }
  const sprintIds = new Set(); const releaseIds = new Set();
  for (const row of [...cards, ...swimlanes]) {
    if (row.scrum.sprintId) sprintIds.add(row.scrum.sprintId);
    for (const id of row.scrum.pastSprintIds || []) sprintIds.add(id);
    if (row.scrum.releaseId) releaseIds.add(row.scrum.releaseId);
  }
  // Rollover destinations remain structural references, even in a scoped file.
  let changed = true;
  while (changed) {
    changed = false;
    for (const sprint of sprints) if (sprintIds.has(sprint._id) && sprint.rolloverSprintId && !sprintIds.has(sprint.rolloverSprintId)) {
      sprintIds.add(sprint.rolloverSprintId); changed = true;
    }
  }
  const visibleCards = new Set(cardIds); const visibleLists = new Set(listIds);
  const losses = [];
  const clean = record => {
    const { boardId: ignoredBoard, revision, rolloverPending, closedFromRevision, scrumImportPending, reportTotals,
      ...data } = record;
    return data;
  };
  const metadata = rows => rows.map(row => ({ _id: row._id, scrum: row.scrum }));
  const transfer = { format: SCRUM_TRANSFER_FORMAT, settings: board.scrum || {}, cards: metadata(cards), lists: metadata(lists), swimlanes: metadata(swimlanes),
    sprints: sprints.filter(s => !scoped || sprintIds.has(s._id)).map(clean),
    releases: releases.filter(r => !scoped || releaseIds.has(r._id)).map(clean),
    events: events.filter(e => !scoped || sprintIds.has(e.sprintId)).map(clean) };
  function filterSnapshot(snapshot, path) {
    snapshot.cards = snapshot.cards.filter(card => {
      if (visibleCards.has(card.cardId) && visibleLists.has(card.listId)) return true;
      losses.push({ path, sourceId: card.cardId, reason: 'card-or-list-not-exported' });
      snapshot.partial = true; return false;
    });
    snapshot.missingEstimates = snapshot.cards.filter(c => c.estimate === null).length;
    snapshot.totalEstimate = snapshot.cards.reduce((sum, c) => sum + (c.estimate ?? 0), 0);
  }
  for (const sprint of transfer.sprints) for (const key of ['startSnapshot', 'closeSnapshot']) {
    if (sprint[key]) filterSnapshot(sprint[key], `sprints.${sprint._id}.${key}`);
  }
  transfer.dailyObservations = [];
  const cursor = ScrumDailySnapshots.rawCollection().find({ boardId,
    sprintId: { $in: transfer.sprints.map(sprint => sprint._id) } },
  { sort: { capturedAt: 1, _id: 1 }, limit: 10001, batchSize: 1 });
  try {
    // No cap on the cards a day observed (maintainer decision of 2026-10-03);
    // the number of observed days keeps its limit.
    for await (const stored of cursor) {
      if (transfer.dailyObservations.length >= 10000) {
        throw new Error('Daily Scrum history exceeds the native transfer limit');
      }
      const row = await withDailyRows(stored);
      filterSnapshot(row.snapshot, `dailyObservations.${row.sprintId}.${row.day}`);
      const { sprintId, startedAt, day, capturedAt, snapshot, consistency } = row;
      transfer.dailyObservations.push({ sprintId, startedAt, day, capturedAt, snapshot, consistency });
    }
  } finally { await cursor.close(); }
  for (const event of transfer.events) event.followUpCardIds = (event.followUpCardIds || []).filter(id => {
    if (visibleCards.has(id)) return true;
    losses.push({ path: `events.${event._id}.followUpCardIds`, sourceId: id, reason: 'card-not-exported' }); return false;
  });
  if (!includeCustomFields) {
    const references = new Set([transfer.settings.estimateCustomFieldId,
      ...transfer.sprints.flatMap(s => [s.startSnapshot?.estimateCustomFieldId, s.closeSnapshot?.estimateCustomFieldId]),
      ...transfer.dailyObservations.map(row => row.snapshot.estimateCustomFieldId),
    ].filter(Boolean));
    for (const sourceId of references) losses.push({ path: 'customFields', sourceId, reason: 'estimate-field-not-exported' });
  }
  return { transfer: normalizeScrumTransfer(transfer), losses };
}

export function scrumTransferUserIds(transfer) {
  if (!transfer) return [];
  return [...new Set([transfer.settings.productOwnerId, transfer.settings.scrumMasterId,
    ...(transfer.settings.developerIds || []),
    ...[...transfer.sprints, ...transfer.releases, ...transfer.events].flatMap(row => [row.createdBy, row.updatedBy]),
  ].filter(Boolean))];
}
