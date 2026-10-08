'use strict';

// Field identity and array position remain visible; only the value is private.
// Keeping positions is essential for the existing dotted-index card editors.
function mayReadField(definition, boardId, adminBoards) {
  if (!definition) return false;
  if (boardId && !(definition.boardIds || []).includes(boardId)) return false;
  if (!definition.adminOnly) return true;
  const boards = boardId ? [boardId] : definition.boardIds;
  return !!boards?.length && boards.every(id => adminBoards.has(id));
}
function redact(value, definitions, adminBoards, boardId, seen = new WeakMap()) {
  if (!value || typeof value !== 'object' || value instanceof Date ||
      ArrayBuffer.isView(value) || value._bsontype || typeof value.typeName === 'function') return value;
  if (seen.has(value)) return seen.get(value);
  const result = Array.isArray(value) ? [] : {};
  seen.set(value, result);
  const scope = value.boardId || boardId;
  for (const [key, item] of Object.entries(value)) {
    if (['integrityHash', 'previousHash'].includes(key) && !adminBoards.has(scope)) {
      // A digest of a hidden low-entropy value is itself a guessing oracle.
      result[key] = null;
    } else if ((key === 'customFields' || (key === 'value' && value.field === 'customFields')) && Array.isArray(item)) {
      result[key] = item.map(field => field && Object.hasOwn(field, 'value') &&
        !mayReadField(definitions.get(field._id), scope, adminBoards)
        ? { _id: field._id, value: null } : redact(field, definitions, adminBoards, scope, seen));
    } else if (['value', 'oldValue', 'newValue'].includes(key) && value.customFieldId &&
        !mayReadField(definitions.get(value.customFieldId), scope, adminBoards)) {
      result[key] = null;
    } else result[key] = redact(item, definitions, adminBoards, scope, seen);
  }
  return result;
}
function containsFields(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return false;
  seen.add(value);
  return Object.hasOwn(value, 'customFields') || Object.hasOwn(value, 'customFieldId') || Object.hasOwn(value, 'integrityHash') ||
    Object.hasOwn(value, 'previousHash') || value.field === 'customFields' ||
    Object.values(value).some(child => containsFields(child, seen));
}
// #3143: a read-only field is readable by every member, writable only by an
// admin of every board it belongs to (like reading an adminOnly one).
function mayWriteField(definition, boardId, adminBoards) {
  if (!mayReadField(definition, boardId, adminBoards)) return false;
  if (!definition.readOnly) return true;
  const boards = boardId ? [boardId] : definition.boardIds;
  return !!boards?.length && boards.every(id => adminBoards.has(id));
}
// The values of the read-only fields this user may not write, empty ones
// included as null: setting an empty read-only field is a write too.
function writeProtectedValues(card, definitions, adminBoards) {
  return (card?.customFields || []).filter(field => field && definitions.get(field._id)?.readOnly &&
    mayReadField(definitions.get(field._id), card.boardId, adminBoards) &&
    !mayWriteField(definitions.get(field._id), card.boardId, adminBoards))
    .map(field => ({ _id: field._id, value: field.value === undefined ? null : field.value }))
    .filter(field => field.value !== null)
    .sort((a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0));
}
// Compare ALL protected values, including deletion, reindexing, whole-array and
// non-$set updates. The caller applies the modifier with Meteor's own engine.
function protectedValues(card, definitions, adminBoards) {
  return (card?.customFields || []).filter(field => field && field.value !== null && field.value !== undefined &&
    !mayReadField(definitions.get(field._id), card.boardId, adminBoards));
}
module.exports = { mayReadField, mayWriteField, redact, containsFields, protectedValues, writeProtectedValues };

// Value searches must not become an oracle for a value hidden in the response.
// Bind every value predicate to a readable field ID, including lazy-window
// selectors and global search. Unknown array operators fail closed.
function scopeFieldSelector(selector, definitions, adminBoards) {
  const ids = [...definitions.values()].filter(d => mayReadField(d, null, adminBoards)).map(d => d._id);
  function visit(value) {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== 'object' || value instanceof RegExp || value instanceof Date) return value;
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === 'customFields') {
        result[key] = child?.$elemMatch && !Object.keys(child).some(k => k !== '$elemMatch')
          ? { $elemMatch: { $and: [child.$elemMatch, { _id: { $in: ids } }] } }
          : { $elemMatch: { _id: { $in: [] } } };
      } else if (key === 'customFields.value') {
        result.customFields = { $elemMatch: { _id: { $in: ids }, value: child } };
      } else if (key.startsWith('customFields.')) {
        // Arbitrary positional/nested predicates are not a supported search API.
        result._id = { $in: [] };
      } else result[key] = visit(child);
    }
    return result;
  }
  return visit(selector);
}
module.exports.scopeFieldSelector = scopeFieldSelector;

function containsFieldQuery(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, item]) => key === 'customFields' || key.startsWith('customFields.') || containsFieldQuery(item));
}
module.exports.containsFieldQuery = containsFieldQuery;
