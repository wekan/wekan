'use strict';

const METADATA_TYPES = new Set(['board', 'card', 'list', 'swimlane']);
const RECORD_TYPES = new Set(['scrum-sprint', 'scrum-release', 'scrum-event']);
function historyDocument(type, doc) {
  if (!doc) return null;
  if (METADATA_TYPES.has(type)) return { _id: doc._id, boardId: type === 'board' ? doc._id : doc.boardId, scrum: structuredClone(doc.scrum || {}) };
  if (!RECORD_TYPES.has(type)) throw new Error('Unsupported Scrum history record');
  // `incarnation` identifies one lifetime of the record (maintainer decision
  // of 2026-09-30), not its content: History must never carry an old one back
  // into a restored record, which gets a fresh one.
  // The rollover's progress is the background job's, not the sprint's
  // content: an undo never restores it.
  const { revision, updatedAt, updatedBy, rolloverPending, rolloverTotal, rolloverDone, rolloverError, rolloverLease, incarnation,
    ...content } = doc;
  return structuredClone(content);
}
function historyRecords(changes) {
  const records = new Map();
  for (const change of changes) {
    const key = `${change.entityType}:${change.entityId}`;
    const existing = records.get(key);
    records.set(key, { type: change.entityType, id: change.entityId,
      before: existing ? existing.before : historyDocument(change.entityType, change.previousContent),
      after: historyDocument(change.entityType, change.newContent) });
  }
  return [...records.values()].sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
}
function historySide(records, side) {
  return { records: records.map(row => ({ type: row.type, id: row.id, document: row[side] })) };
}
// A batch too large for one History row (a sprint closed over many thousands
// of cards, maintainer decision of 2026-10-03: sprints with no card cap) is
// recorded as several rows sharing a batchId, each at most PART_RECORDS
// records and PART_BYTES per side, so a row, its restore journal and its
// restored copy stay far below MongoDB's document limit. A record is in exactly
// one part, so the parts apply independently; undo and redo walk the whole
// batch (server/models/changeHistory.js). `size` measures one side's BSON.
const PART_RECORDS = 1000;
const PART_BYTES = 3 * 1024 * 1024;
function historyParts(records, size, limits = {}) {
  const maxRecords = limits.records || PART_RECORDS, maxBytes = limits.bytes || PART_BYTES;
  const parts = [];
  let part = [], bytes = 0;
  for (const row of records) {
    const cost = Math.max(size(row.before), size(row.after));
    if (part.length && (part.length >= maxRecords || bytes + cost > maxBytes)) { parts.push(part); part = []; bytes = 0; }
    part.push(row); bytes += cost;
  }
  if (part.length) parts.push(part);
  return parts;
}
module.exports = { METADATA_TYPES, RECORD_TYPES, historyDocument, historyRecords, historySide, historyParts,
  PART_RECORDS, PART_BYTES };
