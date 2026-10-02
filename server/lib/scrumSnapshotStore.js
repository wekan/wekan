// A sprint's start and close snapshot rows, outside the sprint document
// (maintainer decision of 2026-10-03: sprints with no card cap). The sprint
// keeps a header - when, the estimate settings, the totals and how many rows
// in how many chunks - and the rows live here in chunks of SNAPSHOT_CHUNK.
// A chunk is immutable and named by its sprint, kind, the snapshot's time and
// its number, so a retried start or close, an undo or a redo, finds the same
// rows; a snapshot taken again (a restarted sprint) has another time and its
// own rows. Snapshots stored inline before this keep working: a header
// without `stored` still carries its `cards`.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ensureIndex } from '/server/lib/mongoStartup';
const { EJSON } = require('bson');
const { chunkSnapshot } = require('/models/lib/scrumSnapshotRows');

export const ScrumSnapshotRows = new Mongo.Collection('scrumSnapshotRows');
ScrumSnapshotRows.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(ScrumSnapshotRows, { boardId: 1 });
  await ensureIndex(ScrumSnapshotRows, { sprintId: 1, kind: 1, at: 1, chunk: 1 });
  const Boards = require('/models/boards').default;
  Boards.after.remove(async (_userId, board) => { await ScrumSnapshotRows.rawCollection().deleteMany({ boardId: board._id }); });
});

// Write a snapshot's rows and return its header. Idempotent: a chunk already
// written must hold the same rows.
export async function storeSnapshot({ boardId, sprintId, kind, snapshot }) {
  const raw = ScrumSnapshotRows.rawCollection();
  const { header, docs } = chunkSnapshot({ boardId, sprintId, kind, snapshot });
  for (const doc of docs) {
    try { await raw.insertOne(doc); } catch (error) {
      if (error.code !== 11000 || !EJSON.equals(await raw.findOne({ _id: doc._id }), doc)) throw error;
    }
  }
  return header;
}

// A snapshot's rows: inline for an older snapshot, from the chunks otherwise.
export async function snapshotRows(sprint, key) {
  const snapshot = sprint && sprint[key];
  if (!snapshot) return [];
  return storedRows({ sprintId: sprint._id, kind: key === 'startSnapshot' ? 'start' : 'close', snapshot });
}
// A daily observation's snapshot is stored the same way, as kind 'daily' at
// its capture time.
export async function withDailyRows(observation) {
  const { snapshot } = observation;
  if (snapshot.stored !== 'rows') return observation;
  const { stored, chunks, rowCount, ...header } = snapshot;
  return { ...observation, snapshot: { ...header,
    cards: await storedRows({ sprintId: observation.sprintId, kind: 'daily', snapshot }) } };
}
// Forget the rows of a daily capture that lost the race to another one.
export function discardRows({ sprintId, kind, at }) {
  return ScrumSnapshotRows.rawCollection().deleteMany({ sprintId, kind, at: new Date(at) });
}
async function storedRows({ sprintId, kind, snapshot }) {
  if (snapshot.stored !== 'rows') return snapshot.cards || [];
  const chunks = await ScrumSnapshotRows.rawCollection().find({ sprintId, kind, at: new Date(snapshot.at) },
    { sort: { chunk: 1 } }).toArray();
  if (chunks.length !== snapshot.chunks || chunks.some((chunk, i) => chunk.chunk !== i)) {
    throw new Meteor.Error('scrum-snapshot-missing', 'A sprint snapshot is incomplete.');
  }
  const rows = chunks.flatMap(chunk => chunk.rows);
  if (rows.length !== snapshot.rowCount) throw new Meteor.Error('scrum-snapshot-missing', 'A sprint snapshot is incomplete.');
  return rows;
}

// The sprint with its snapshots' rows in place, as the reports, the replay and
// the transfer read them.
export async function withSnapshotRows(sprint) {
  const result = { ...sprint };
  for (const key of ['startSnapshot', 'closeSnapshot']) {
    if (!sprint[key]) continue;
    const { stored, chunks, rowCount, ...header } = sprint[key];
    result[key] = { ...header, cards: await snapshotRows(sprint, key) };
  }
  return result;
}
