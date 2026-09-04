'use strict';

// Which group of the card details view a changed field belongs to, and what a
// history row should store for it.
// docs/Features/Reports/History/History.md §3 (groups) and §4 (content shapes).
//
// Pure and Meteor-free so it is unit-tested directly
// (tests/changeHistoryGroups.test.cjs). It is the table that phase 5 - "roll out
// to every remaining group/entity" - is made of: recording a new field is an
// entry here, not another call site.
//
// WHY A TABLE AND NOT A CALL PER SETTER. §5 suggests "a thin, central choke
// point ... recording history next to Activities.insert avoids sprinkling calls
// everywhere". A hook that diffs the changed fields is that choke point: it
// catches the REST API, imports and rules-engine writes too, none of which go
// through the client setters. The price is that the hook has to be told which
// fields matter and which are noise - that is this file.

/*
 * field -> group, per entity type. A field absent from these maps is NOT
 * recorded: modifiedAt, dateLastActivity, sort bookkeeping and the denormalised
 * counters change on almost every write, and a history full of them is a
 * history nobody reads.
 */
const CARD_FIELDS = {
  title: 'title',
  description: 'description',
  labelIds: 'labels',
  members: 'members',
  assignees: 'assignees',
  requesters: 'members',
  assigners: 'assignees',
  receivedAt: 'dates',
  startAt: 'dates',
  dueAt: 'dates',
  endAt: 'dates',
  dueComplete: 'dates',
  spentTime: 'dates',
  isOvertime: 'dates',
  customFields: 'customFields',
  color: 'title',
  vote: 'customFields',
  poker: 'customFields',
  archived: 'lifecycle',
  deletedAt: 'lifecycle',
  // Position is recorded explicitly by Card.move, which knows the whole move as
  // one change; the hook would otherwise report the same drag as up to four
  // separate field edits.
};

const LIST_FIELDS = {
  title: 'title',
  color: 'title',
  wipLimit: 'title',
  archived: 'lifecycle',
  deletedAt: 'lifecycle',
};

const SWIMLANE_FIELDS = {
  title: 'title',
  color: 'title',
  archived: 'lifecycle',
  deletedAt: 'lifecycle',
};

const CHECKLIST_FIELDS = {
  title: 'checklists',
  hideCheckedChecklistItems: 'checklists',
  hideAllChecklistItems: 'checklists',
};

const CHECKLIST_ITEM_FIELDS = {
  title: 'checklists',
  isFinished: 'checklists',
};

const COMMENT_FIELDS = {
  text: 'comments',
};

const FIELDS_BY_ENTITY = {
  card: CARD_FIELDS,
  list: LIST_FIELDS,
  swimlane: SWIMLANE_FIELDS,
  checklist: CHECKLIST_FIELDS,
  checklistItem: CHECKLIST_ITEM_FIELDS,
  comment: COMMENT_FIELDS,
};

/* Fields that are never worth a row, whatever the entity. */
const NEVER_RECORD = new Set([
  '_id', 'modifiedAt', 'dateLastActivity', 'createdAt', 'updatedAt',
  'sort', 'subtaskSort', 'boardId', 'swimlaneId', 'listId', 'cardId', 'parentId',
]);

function groupForField(entityType, field) {
  if (NEVER_RECORD.has(field)) return null;
  const map = FIELDS_BY_ENTITY[entityType];
  if (!map) return null;
  return map[field] || null;
}

/*
 * The content a row stores for one field (§4: blackbox, "each entity/group
 * stores what it needs"). Kept deliberately simple and uniform - `{ field,
 * value }` - because the restore side reads it back by field name, and a
 * bespoke shape per field would mean a bespoke applier per field.
 *
 * A Date becomes a number so the row survives a JSON round trip through the
 * snap's database merge unchanged; anything unserialisable is dropped rather
 * than stored as something a restore would write back wrong.
 */
function contentForField(field, value) {
  if (value === undefined) return null;
  if (value === null) return { field, value: null };
  if (value instanceof Date) return { field, value: value.getTime(), isDate: true };
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return { field, value };
  }
  if (Array.isArray(value)) {
    // Label ids, member ids, custom field values: arrays of scalars or plain
    // objects, which is what every array field on these entities holds.
    try {
      return { field, value: JSON.parse(JSON.stringify(value)) };
    } catch {
      return null;
    }
  }
  if (type === 'object') {
    try {
      return { field, value: JSON.parse(JSON.stringify(value)) };
    } catch {
      return null;
    }
  }
  return null;
}

/* Turn stored content back into the value to write. The inverse of the above. */
function valueFromContent(content) {
  if (!content || typeof content !== 'object') return undefined;
  if (!('value' in content)) return undefined;
  if (content.isDate) {
    return content.value === null ? null : new Date(content.value);
  }
  return content.value;
}

/*
 * Did this field actually change? Collection hooks fire for a write whether or
 * not the value differs, and a history of "set the title to the title it
 * already had" is noise that pushes the real changes off the first page.
 */
function changed(before, after) {
  if (before === after) return false;
  if (before instanceof Date || after instanceof Date) {
    const a = before instanceof Date ? before.getTime() : before;
    const b = after instanceof Date ? after.getTime() : after;
    return a !== b;
  }
  if (before === null || before === undefined) {
    return !(after === null || after === undefined);
  }
  if (after === null || after === undefined) return true;
  if (typeof before === 'object' || typeof after === 'object') {
    try {
      return JSON.stringify(before) !== JSON.stringify(after);
    } catch {
      return true;
    }
  }
  return true;
}

/*
 * The whole diff for one update: every recordable field that really changed.
 * Returns [{ field, group, previousContent, newContent, changeType }].
 *
 * changeType follows what the value did rather than what the caller called it:
 * empty -> value is 'added', value -> empty is 'removed', otherwise 'edited'.
 * That is what lets the History table say "removed" for clearing a due date
 * without every caller having to decide.
 */
function isEmpty(value) {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function diffFields(entityType, previous, next, fieldNames) {
  const changes = [];
  const fields = Array.isArray(fieldNames)
    ? fieldNames
    : Object.keys(next || {});
  for (const field of fields) {
    const group = groupForField(entityType, field);
    if (!group) continue;
    const before = previous ? previous[field] : undefined;
    const after = next ? next[field] : undefined;
    if (!changed(before, after)) continue;

    const previousContent = contentForField(field, before);
    const newContent = contentForField(field, after);
    if (previousContent === null && newContent === null) continue;

    let changeType = 'edited';
    if (isEmpty(before) && !isEmpty(after)) changeType = 'added';
    else if (!isEmpty(before) && isEmpty(after)) changeType = 'removed';

    changes.push({ field, group, changeType, previousContent, newContent });
  }
  return changes;
}

module.exports = {
  groupForField,
  contentForField,
  valueFromContent,
  changed,
  diffFields,
  FIELDS_BY_ENTITY,
  NEVER_RECORD,
};
