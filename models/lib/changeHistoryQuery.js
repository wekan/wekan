'use strict';

// Pure query helpers for the universal change history
// (docs/Features/Reports/History/History.md §6). No Meteor, no database, so they
// are unit-tested directly (tests/changeHistoryQuery.test.cjs) — the same
// discipline as models/lib/undoRedoSelection.js, and for the same reason: the
// selection and filtering rules are where this feature is either right or
// quietly wrong, and neither is visible by reading a Mongo selector.
//
// Three things live here:
//   scopeSelector()   turn a {scope, scopeId, group, userId} request into the
//                     Mongo selector the server queries with
//   matchesSearch()   whether a row matches a search term
//   selectionToIds()  normalise whatever the UI hands back as "checked rows"

/*
 * Container scopes mean "this entity AND its descendants" (History.md §6): a
 * swimlane's history includes its lists' and cards' rows. That is why the WRITE
 * side stores every applicable id column on every row - boardId, swimlaneId,
 * listId, cardId - so the read side is a plain equality on one column instead of
 * a join the database cannot do.
 */
const SCOPE_COLUMN = {
  board: 'boardId',
  swimlane: 'swimlaneId',
  list: 'listId',
  card: 'cardId',
};

const SCOPES = Object.keys(SCOPE_COLUMN);

function scopeSelector({ scope, scopeId, group, userId, entityType, entityId } = {}) {
  const selector = {};

  if (scope !== undefined && scope !== null && scope !== '') {
    const column = SCOPE_COLUMN[scope];
    if (!column) {
      throw new Error(`changeHistory: unknown scope '${scope}' (expected ${SCOPES.join(', ')})`);
    }
    if (typeof scopeId !== 'string' || scopeId.length === 0) {
      throw new Error(`changeHistory: scope '${scope}' needs a scopeId`);
    }
    selector[column] = scopeId;
  } else if (scopeId) {
    throw new Error('changeHistory: scopeId without a scope does not say what to match');
  }

  // A specific entity, for the future per-entity menus (History.md §7a).
  if (entityType) selector.entityType = entityType;
  if (entityId) selector.entityId = entityId;

  // Narrow a card scope to one group of the card details view.
  if (group) selector.group = group;

  // One contributor: the Member-settings view, or an avatar click inside another
  // scope. Combined with the scope above rather than replacing it.
  if (userId) selector.userId = userId;

  return selector;
}

/*
 * Search matches the rendered change-type label and a text projection of the
 * content, case-insensitively (History.md §6). Numbers and booleans inside the
 * content are searchable too - a date change is a number until it is rendered,
 * and "the thing I typed is not found" is the complaint that follows if it is
 * not. Depth is bounded so a pathological blackbox cannot hang the server.
 */
function contentText(value, depth = 0, out = []) {
  if (value === null || value === undefined || depth > 4) return out;
  if (typeof value === 'string') { out.push(value); return out; }
  if (typeof value === 'number' || typeof value === 'boolean') {
    out.push(String(value));
    return out;
  }
  if (value instanceof Date) { out.push(value.toISOString()); return out; }
  if (Array.isArray(value)) {
    for (const item of value) contentText(item, depth + 1, out);
    return out;
  }
  if (typeof value === 'object') {
    for (const key of Object.keys(value)) contentText(value[key], depth + 1, out);
    return out;
  }
  return out;
}

function matchesSearch(row, term) {
  if (typeof term !== 'string') return true;
  const needle = term.trim().toLowerCase();
  if (needle.length === 0) return true;      // an empty search matches everything
  if (!row) return false;

  const haystack = [
    row.changeType,
    row.group,
    row.entityType,
    ...contentText(row.newContent),
    ...contentText(row.previousContent),
  ]
    .filter(part => typeof part === 'string' && part.length > 0)
    .join('\n')
    .toLowerCase();

  return haystack.includes(needle);
}

/*
 * The UI keeps checked rows in a Set on the template instance (History.md §7,
 * and #6479: never on the Blaze data context). It can reach the server as a Set,
 * an array, or an object of id -> checked, so normalise all three and drop
 * anything that is not a usable id. Order is preserved and duplicates removed,
 * which matters because a multi-row restore applies oldest to newest and must
 * not apply the same row twice (History.md §8.4).
 */
function selectionToIds(selected) {
  let candidates;
  if (!selected) candidates = [];
  else if (Array.isArray(selected)) candidates = selected;
  else if (typeof selected.forEach === 'function' && typeof selected.size === 'number') {
    candidates = [...selected];                       // a Set
  } else if (typeof selected === 'object') {
    candidates = Object.keys(selected).filter(key => selected[key]);
  } else if (typeof selected === 'string') candidates = [selected];
  else candidates = [];

  const ids = [];
  const seen = new Set();
  for (const value of candidates) {
    if (typeof value !== 'string' || value.length === 0) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    ids.push(value);
  }
  return ids;
}

module.exports = { scopeSelector, matchesSearch, selectionToIds, SCOPES, SCOPE_COLUMN };
