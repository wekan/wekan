'use strict';

const METADATA_TYPES = new Set(['board', 'card', 'list', 'swimlane']);
const RECORD_TYPES = new Set(['scrum-sprint', 'scrum-release', 'scrum-event']);
function historyDocument(type, doc) {
  if (!doc) return null;
  if (METADATA_TYPES.has(type)) return { _id: doc._id, boardId: type === 'board' ? doc._id : doc.boardId, scrum: structuredClone(doc.scrum || {}) };
  if (!RECORD_TYPES.has(type)) throw new Error('Unsupported Scrum history record');
  const { revision, updatedAt, updatedBy, rolloverPending, ...content } = doc;
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
module.exports = { METADATA_TYPES, RECORD_TYPES, historyDocument, historyRecords, historySide };
