// Planning Sync, the server side (2026-10-08): reads the board's sprints and
// releases for models/lib/listSyncPlanning.js to match, creates the ones a run
// needs, and records a direct-path card's planning change in Scrum History.
// The card writes themselves go through server/listSync.js like every other
// Sync field: conditionally on the direct path, and as saved steps on the
// durable one (server/lib/listSyncSteps.js), whose History plan records the
// same Scrum row (server/lib/syncHistoryBatch.js) so undo works alike.
import { Random } from 'meteor/random';
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';
import ScrumHistoryPending from '/server/lib/scrumHistoryPending';
import { ScrumImportPending } from '/server/lib/scrumImportJournal';
import { ROLLOVER_PENDING } from '/server/lib/scrumRolloverStore';
import { withScrumBoardLock, recordScrumChange } from '/server/scrum';
const { normalizeScrumRecord } = require('/models/lib/scrum');

const LIMIT = 10000;
const collections = { sprint: ScrumSprints, release: ScrumReleases };
const projection = { _id: 1, boardId: 1, name: 1, state: 1, provenance: 1 };

// Whether a run may write planning to this board now: Scrum is enabled, and
// no Scrum import, History restore or sprint rollover is unfinished - the
// same operations that hold back a manual planning edit (server/scrum.js).
// The reason is a code, never data.
export async function planningUnavailable(board) {
  if (!board || board.scrum?.enabled !== true) return 'scrum-disabled';
  if (await ScrumImportPending.findOneAsync(board._id, { fields: { _id: 1 } }) ||
      await ScrumSprints.findOneAsync({ boardId: board._id, scrumImportPending: true }, { fields: { _id: 1 } })) return 'scrum-import-pending';
  if (await ScrumHistoryPending.findOneAsync(board._id, { fields: { _id: 1 } })) return 'scrum-history-pending';
  if (await ScrumSprints.findOneAsync({ boardId: board._id, ...ROLLOVER_PENDING }, { fields: { _id: 1 } })) return 'scrum-rollover-pending';
  return null;
}

// This board's sprints and releases - only this board's.
export async function readBoardPlanningRecords(boardId) {
  const [sprints, releases] = await Promise.all([
    ScrumSprints.find({ boardId }, { fields: projection, limit: LIMIT }).fetchAsync(),
    ScrumReleases.find({ boardId }, { fields: projection, limit: LIMIT }).fetchAsync(),
  ]);
  return { sprints, releases };
}

// Create the records a run's planned card changes name. Each has the id
// resolvePlanningRecords derived from its source, so a retried or replayed run
// finds the record it made instead of making another; an upsert that inserts
// nothing made nothing, and records no History. Each creation is a Scrum
// History row of the actor's, like a sprint or release made by hand.
export async function createPlanningRecords({ boardId, create, actorId, now = new Date(), assertCurrent }) {
  if (!create.length) return 0;
  return withScrumBoardLock(boardId, async () => {
    let made = 0;
    for (const { kind, document } of create) {
      const collection = collections[kind];
      if (!collection || document.boardId !== boardId) throw new Error('sync-planning-record-invalid');
      const { _id, boardId: _board, state, ...content } = document;
      // The record's content passes the same validation a manual one does.
      const clean = normalizeScrumRecord(kind, kind === 'release' ? { ...content, state } : content);
      const record = { ...clean, _id, boardId, state, revision: 1, createdAt: now, createdBy: actorId,
        updatedAt: now, updatedBy: actorId, incarnation: Random.id() };
      if (assertCurrent) await assertCurrent();
      const { _id: id, ...fields } = record;
      const result = await collection.upsertAsync({ _id: id }, { $setOnInsert: { ...fields } });
      const saved = await collection.findOneAsync({ _id: id, boardId }, { fields: { _id: 1 } });
      if (!saved) throw new Error('sync-planning-record-unconfirmed');
      if (result?.insertedId) {
        made += 1;
        await recordScrumChange(boardId, `scrum-${kind}`, null, record, actorId);
      }
    }
    return made;
  });
}

// The direct path's History for a card whose planning it changed: the Scrum
// row a manual change records (server/scrum.js updateMetadata).
export async function recordPlanningHistory({ card, scrum, actorId }) {
  const before = { _id: card._id, boardId: card.boardId, listId: card.listId, swimlaneId: card.swimlaneId,
    scrum: card.scrum || {} };
  await recordScrumChange(card.boardId, 'card', before, { ...before, scrum }, actorId);
}
