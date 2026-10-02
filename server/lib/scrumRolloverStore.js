// A sprint close's rollover plan, outside the sprint document (maintainer
// decision of 2026-10-03: sprints with no card cap). The close writes one row
// per card - its revision, and its Scrum metadata before and after - in chunks
// here, then marks the sprint `rolloverPending: true`; the rollover applies a
// chunk and removes it, and clears the mark when none is left. A plan kept in
// the sprint document before this (an array) is still finished as it was.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ensureIndex } from '/server/lib/mongoStartup';
const { calculateObjectSize } = require('bson');
const { SNAPSHOT_CHUNK } = require('/models/lib/scrumSnapshotRows');
// A card's Scrum metadata may carry long texts, so a chunk is bounded by bytes
// as well as by rows.
const CHUNK_BYTES = 4 * 1024 * 1024;

export const ScrumRolloverRows = new Mongo.Collection('scrumRolloverRows');
ScrumRolloverRows.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(ScrumRolloverRows, { boardId: 1 });
  await ensureIndex(ScrumRolloverRows, { sprintId: 1, chunk: 1 });
  await ensureIndex(ScrumRolloverRows, { sprintId: 1, 'rows.cardId': 1 });
  const Boards = require('/models/boards').default;
  Boards.after.remove(async (_userId, board) => { await ScrumRolloverRows.rawCollection().deleteMany({ boardId: board._id }); });
});

// A sprint with a rollover still to finish, in either form.
export const ROLLOVER_PENDING = { $or: [{ rolloverPending: true }, { 'rolloverPending.0': { $exists: true } }] };
export const hasRolloverPending = sprint => sprint?.rolloverPending === true ||
  (Array.isArray(sprint?.rolloverPending) && sprint.rolloverPending.length > 0);

// Write the plan before the sprint is marked. Called under the board's Scrum
// lock with the sprint still active, so any chunk of it is left over from a
// close that never marked the sprint, and is replaced.
export async function storeRolloverPlan({ boardId, sprintId, rows }) {
  const raw = ScrumRolloverRows.rawCollection();
  await raw.deleteMany({ sprintId });
  let chunk = 0, part = [], bytes = 0;
  const flush = async () => {
    await raw.insertOne({ _id: `${sprintId}:rollover:${chunk}`, boardId, sprintId, chunk, rows: part });
    chunk += 1; part = []; bytes = 0;
  };
  for (const row of rows) {
    const cost = calculateObjectSize(row);
    if (part.length && (part.length >= SNAPSHOT_CHUNK || bytes + cost > CHUNK_BYTES)) await flush();
    part.push(row); bytes += cost;
  }
  if (part.length) await flush();
}

// The next chunk still to apply, or null.
export function nextRolloverChunk(sprintId) {
  return ScrumRolloverRows.rawCollection().findOne({ sprintId }, { sort: { chunk: 1 } });
}
export function finishRolloverChunk(chunk) {
  return ScrumRolloverRows.rawCollection().deleteOne({ _id: chunk._id });
}

// Whether the pending rollover touches a card this reader may see.
export async function rolloverTouches(sprint, cardIds) {
  if (Array.isArray(sprint.rolloverPending)) return sprint.rolloverPending.some(row => cardIds.has(row.cardId));
  if (sprint.rolloverPending !== true) return false;
  return !!await ScrumRolloverRows.rawCollection().findOne({ sprintId: sprint._id, 'rows.cardId': { $in: [...cardIds] } },
    { projection: { _id: 1 } });
}
