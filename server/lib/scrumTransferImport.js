import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { EJSON } from 'meteor/ejson';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';
import ScrumEvents from '/models/scrumEvents';
import ScrumDailySnapshots from '/models/scrumDailySnapshots';
import { ScrumImportPending, ScrumImportSteps } from './scrumImportJournal';
const { writeImportPlan, finishImportPlan } = require('/server/lib/scrumImportWriter');
const { dailyObservationId } = require('/server/lib/scrumDailyCapture');
const { normalizeScrumTransfer, remapScrumTransfer, normalizeScrumTransferLosses } = require('/models/lib/scrumTransfer');

function inputMap(rows) {
  return new Map((rows || []).map(row => [row._id || row.id, row._id || row.id]));
}
// Run before creating users, boards or any other import side effects. Mapping
// once with source IDs proves structural references exist in the same file.
export function validateScrumImport(board) {
  if (!board.scrumTransfer) return;
  try {
    const transfer = normalizeScrumTransfer(board.scrumTransfer);
    normalizeScrumTransferLosses(board.scrumTransferLosses);
    const maps = Object.fromEntries(['sprints','releases','events'].map(key => [key,inputMap(transfer[key])]));
    for (const key of ['cards','lists','swimlanes','customFields','users']) maps[key] = inputMap(board[key]);
    remapScrumTransfer(transfer, maps);
    const estimateIds = new Set([transfer.settings.estimateCustomFieldId,
      ...transfer.sprints.flatMap(s => [s.startSnapshot?.estimateCustomFieldId,s.closeSnapshot?.estimateCustomFieldId]),
      ...transfer.dailyObservations.map(row => row.snapshot.estimateCustomFieldId),
    ].filter(Boolean));
    for (const id of estimateIds) if (!(board.customFields || []).some(field => field._id === id && field.type === 'number')) {
      throw new Error('Scrum estimates require a numeric custom field in the imported file');
    }
  } catch (error) { throw new Meteor.Error('invalid-scrum-transfer', error.message); }
}

export async function importScrumTransfer(creator, source, boardId) {
  if (!source.scrumTransfer) return;
  const board = await Boards.findOneAsync(boardId);
  if (!board || !board.hasAdmin(Meteor.userId())) throw new Meteor.Error('not-authorized');
  const normalized = normalizeScrumTransfer(source.scrumTransfer);
  const maps = {};
  for (const key of ['sprints','releases','events']) maps[key] = new Map(normalized[key].map(row => [row._id,Random.id()]));
  for (const key of ['cards','lists','swimlanes','customFields']) maps[key] = new Map(Object.entries(creator[key]));
  maps.users = new Map(Object.entries(creator.members));
  const { transfer, losses } = remapScrumTransfer(normalized, maps);
  const steps = [];
  // All IDs have been allocated and validated before planning documents are
  // persisted. Imported accountabilities are informational, never membership.
  for (const key of ['sprints', 'releases', 'events']) {
    const sourceIds = new Map([...maps[key]].map(([sourceId, targetId]) => [targetId, sourceId]));
    for (const record of transfer[key]) {
      const provenance = record.provenance || { system: 'wekan', recordId: sourceIds.get(record._id),
        ...(typeof source._id === 'string' && source._id.length <= 500 ? { projectId: source._id } : {}) };
      // A fresh incarnation per imported record, chosen in the plan so a
      // resumed import writes the same one (never the source board's).
      steps.push({ kind: 'insert', collection: key, after: { ...record, provenance, boardId, revision: 1,
        incarnation: Random.id(), ...(key === 'sprints' ? { scrumImportPending: true } : {}) } });
    }
  }
  for (const [key, collection] of [['cards',Cards],['lists',Lists],['swimlanes',Swimlanes]]) {
    for (const record of transfer[key]) {
      const current = await collection.findOneAsync({ _id: record._id, boardId }, { fields: { scrum: 1, scrumRevision: 1 } });
      if (!current) {
        throw new Meteor.Error('invalid-scrum-transfer', 'An imported item no longer belongs to the destination board');
      }
      const before = Object.fromEntries(['scrum', 'scrumRevision'].filter(field => Object.hasOwn(current, field)).map(field => [field, current[field]]));
      steps.push({ kind: 'update', collection: key, id: record._id, boardId, before,
        after: { scrum: record.scrum, scrumRevision: 1 } });
    }
  }
  for (const row of transfer.dailyObservations) {
    steps.push({ kind: 'insert', collection: 'dailyObservations', after: { ...row, boardId,
      _id: dailyObservationId(row.sprintId, row.startedAt, row.day) } });
  }
  const report = [...normalizeScrumTransferLosses(source.scrumTransferLosses), ...losses];
  const before = Object.fromEntries(['scrum', 'scrumRevision', 'scrumImportLosses'].filter(field => Object.hasOwn(board, field)).map(field => [field, board[field]]));
  steps.push({ kind: 'update', collection: 'boards', id: boardId, boardId, before,
    after: { scrum: transfer.settings, scrumRevision: 1, scrumImportLosses: report } });
  const identity = await writeImportPlan({ boardId, operationId: Random.id(), userId: Meteor.userId(), steps,
    pending: ScrumImportPending, journal: ScrumImportSteps, equals: EJSON.equals,
    collections: { boards: Boards, cards: Cards, lists: Lists, swimlanes: Swimlanes,
      sprints: ScrumSprints, releases: ScrumReleases, events: ScrumEvents, dailyObservations: ScrumDailySnapshots } });
  // A collector must never record a half-imported active sprint. Interrupted
  // imports keep this marker and cannot be exported as complete transfers.
  await finishImportPlan({ identity, total: steps.length, pending: ScrumImportPending, journal: ScrumImportSteps,
    clearMarkers: () => ScrumSprints.updateAsync({ boardId, _id: { $in: transfer.sprints.map(row => row._id) } },
      { $unset: { scrumImportPending: '' } }, { multi: true }) });
}
