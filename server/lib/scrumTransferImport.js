import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';
import ScrumEvents from '/models/scrumEvents';
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
  // All IDs have been allocated and validated before planning documents are
  // persisted. Imported accountabilities are informational, never membership.
  for (const [key, collection] of [['sprints',ScrumSprints],['releases',ScrumReleases],['events',ScrumEvents]]) {
    const sourceIds = new Map([...maps[key]].map(([sourceId, targetId]) => [targetId, sourceId]));
    for (const record of transfer[key]) {
      const provenance = record.provenance || { system: 'wekan', recordId: sourceIds.get(record._id),
        ...(typeof source._id === 'string' && source._id.length <= 500 ? { projectId: source._id } : {}) };
      await collection.insertAsync({ ...record, provenance, boardId, revision: 1 });
    }
  }
  for (const [key, collection] of [['cards',Cards],['lists',Lists],['swimlanes',Swimlanes]]) {
    for (const record of transfer[key]) {
      if (!await collection.direct.updateAsync({ _id: record._id, boardId }, { $set: { scrum: record.scrum, scrumRevision: 1 } })) {
        throw new Meteor.Error('invalid-scrum-transfer', 'An imported item no longer belongs to the destination board');
      }
    }
  }
  const report = [...normalizeScrumTransferLosses(source.scrumTransferLosses), ...losses];
  await Boards.direct.updateAsync(boardId, { $set: { scrum: transfer.settings, scrumRevision: 1, scrumImportLosses: report } });
}
