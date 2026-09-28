'use strict';
const { METADATA_TYPES, RECORD_TYPES } = require('../../models/lib/scrumHistory');
// Preserve unrelated ordinary metadata edits, but fence changes to the Scrum
// snapshot and placement/assignment used to authorize this restoration.
function scrumHistoryWriteSelector(type, current) {
  if ((!METADATA_TYPES.has(type) && !RECORD_TYPES.has(type)) || !current ||
      typeof current._id !== 'string' || !current._id) throw new Error('Scrum History selector conflict');
  const fields = METADATA_TYPES.has(type)
    ? ['scrum', 'scrumRevision', ...(type === 'board' ? [] : ['boardId']),
      ...(type === 'card' ? ['listId', 'swimlaneId', 'assignees'] : [])]
    : [...new Set([...Object.keys(current), 'revision'])].filter(key => key !== '_id');
  const selector = { _id: current._id };
  for (const field of fields) {
    if (field.startsWith('$') || field.includes('.')) throw new Error('Scrum History selector conflict');
    selector[field] = Object.hasOwn(current, field)
      ? { $eq: current[field], $exists: true } : { $exists: false };
  }
  return selector;
}
module.exports = { scrumHistoryWriteSelector };
