'use strict';

// What KanboardCreator writes for one normalized task, decided without a
// database so every external format's mapping can be tested in plain Node.
//
// The normalized task (see models/lib/externalParsers.js) carries, beyond the
// original title/description/column/swimlane/due/owner/tags:
//   date_started, date_end, date_creation   - dates (see importedDate)
//   archived                                - true for a closed/done-and-archived item
//   color                                   - a WeKan card color or a hex value
//   spent_hours                             - time already spent, in hours
//   assignees: [source user key]            - more people besides the owner
//   checklists: [{ title, items: [{ title, done }] }]
//   comments:   [{ text, author, authorName, date }]
//   watchers:   [source user key]           - who follows the item
// Every one of them is optional; a task without them imports as before.

const HEX6 = /^#?([0-9a-fA-F]{6})$/;

// A source date, or undefined when there is none. Kanboard sends unix seconds
// as a digit string and "0" for "no date"; a date that does not parse is
// dropped rather than stored as an Invalid Date.
export function importedDate(value) {
  if (value === undefined || value === null || value === '' || value === false) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : new Date(value.getTime());
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    // Seconds unless the number is already too large to be a seconds value
    // for any date before the year 5138.
    const date = new Date(n < 1e11 ? n * 1000 : n);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (typeof value !== 'string') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// A card color WeKan's schema accepts: a palette name, or '#rrggbb'. Source
// hex values without the '#' (Nextcloud Deck's '0082c9') are accepted.
export function importedColor(value, allowedColors = []) {
  if (typeof value !== 'string' || !value) return undefined;
  const name = value.toLowerCase();
  if (allowedColors.includes(name)) return name;
  const hex = HEX6.exec(value);
  return hex ? `#${hex[1].toLowerCase()}` : undefined;
}

function text(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

// A comment is attributed to the mapped WeKan user when the source author was
// mapped. Otherwise it is posted by the importing user, and the source
// author's name leads the text so who wrote it is not lost.
export function importedComment(comment, members = {}) {
  const body = text(comment && comment.text).trim();
  if (!body) return null;
  // `author` is the key members are mapped by; `authorName`, when the source
  // has one (Jira's account id vs display name), is what a reader sees.
  const author = text(comment.author).trim();
  const shown = text(comment.authorName).trim() || author;
  const userId = (author && members[author]) || null;
  return {
    text: userId || !shown ? body : `${shown}: ${body}`,
    userId,
    createdAt: importedDate(comment.date),
  };
}

export function importedChecklists(checklists) {
  if (!Array.isArray(checklists)) return [];
  return checklists
    .map((checklist, index) => ({
      title: text(checklist && checklist.title).trim() || 'Checklist',
      sort: index,
      items: (Array.isArray(checklist && checklist.items) ? checklist.items : [])
        .map(item => ({ title: text(item && item.title).trim(), isFinished: Boolean(item && item.done) }))
        .filter(item => item.title)
        .map((item, sort) => ({ ...item, sort })),
    }))
    .filter(checklist => checklist.items.length);
}

// `boardMemberIds` are the new board's members. A source watcher becomes a
// card watcher only when mapped to one of them: watching grants no access,
// but a watcher outside a private board must not receive its notifications.
export function planImportedTask(task, { members = {}, allowedColors = [], boardMemberIds = [] } = {}) {
  const card = {
    title: text(task.title) || 'Imported task',
    description: text(task.description),
    archived: task.archived === true,
  };
  if (task.requested_by) card.requestedBy = String(task.requested_by);
  if (task.assigned_by) card.assignedBy = String(task.assigned_by);
  const dates = {
    dueAt: task.date_due,
    startAt: task.date_started,
    endAt: task.date_end,
    createdAt: task.date_creation,
  };
  for (const [field, value] of Object.entries(dates)) {
    const date = importedDate(value);
    if (date) card[field] = date;
  }
  const color = importedColor(task.color, allowedColors);
  if (color) card.color = color;
  const spent = Number(task.spent_hours);
  if (task.spent_hours !== undefined && task.spent_hours !== null && Number.isFinite(spent) && spent > 0) {
    card.spentTime = spent;
  }
  // The owner first, then any further assignees (Deck, GitHub and Asana can
  // have several); only source identities that were mapped become members.
  const keys = [task.owner_id || task.owner_username || task.owner_name]
    .concat(Array.isArray(task.assignees) ? task.assignees : []);
  const memberIds = [...new Set(keys
    .filter(key => (typeof key === 'string' && key) || (typeof key === 'number' && Number.isFinite(key)))
    .map(key => members[key])
    .filter(Boolean))];
  const watcherKeys = (Array.isArray(task.watchers) ? task.watchers : [])
    .filter(key => (typeof key === 'string' && key) || (typeof key === 'number' && Number.isFinite(key)));
  const watcherIds = [...new Set(watcherKeys.map(key => members[key]).filter(id => id && boardMemberIds.includes(id)))];
  return {
    card,
    memberIds,
    watcherIds,
    unwatchedCount: watcherKeys.length - watcherKeys.filter(key => watcherIds.includes(members[key])).length,
    checklists: importedChecklists(task.checklists),
    comments: (Array.isArray(task.comments) ? task.comments : [])
      .map(comment => importedComment(comment, members))
      .filter(Boolean),
  };
}

// --- Board-level relationships ------------------------------------------------
// Tasks may carry, besides the fields above:
//   ref                               - the source's id for this item
//   parent_ref                        - the ref of its parent item
//   dependencies: [{ ref, type }]     - links to other items; type is a WeKan
//                                       dependency type (blocks, is-blocked-by,
//                                       related-to, ...)
//   custom_fields: { name: value }    - values of source custom fields
// Relationships resolve only between items of the same import, after every
// card exists; a reference to anything else is reported, never guessed.

export const MAX_IMPORTED_CUSTOM_FIELDS = 50;
const MAX_CUSTOM_FIELD_NAME = 100;
const MAX_CUSTOM_FIELD_TEXT = 10000;
const DEPENDENCY_TYPES = ['related-to', 'blocks', 'is-blocked-by', 'fixes', 'is-fixed-by', 'duplicates', 'is-duplicated-by'];

function customFieldValue(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    const parts = value.map(customFieldValue).filter(v => v !== undefined).map(String);
    return parts.length ? parts.join(', ').slice(0, MAX_CUSTOM_FIELD_TEXT) : undefined;
  }
  if (typeof value === 'object') {
    const named = value.name || value.title || value.value || value.display_value;
    return customFieldValue(typeof named === 'object' ? undefined : named);
  }
  return String(value).slice(0, MAX_CUSTOM_FIELD_TEXT);
}

// One WeKan custom field per distinct source field name, typed from the values
// actually present: all numbers -> number, all booleans -> checkbox, else text.
export function planImportedCustomFields(tasks) {
  const values = new Map();
  const unsupported = [];
  (Array.isArray(tasks) ? tasks : []).forEach(task => {
    const fields = task && task.custom_fields;
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return;
    for (const [rawName, rawValue] of Object.entries(fields)) {
      const name = String(rawName).trim().slice(0, MAX_CUSTOM_FIELD_NAME);
      const value = customFieldValue(rawValue);
      if (!name || value === undefined) continue;
      if (!values.has(name)) {
        if (values.size >= MAX_IMPORTED_CUSTOM_FIELDS) {
          if (!unsupported.some(u => u.path === '/custom_fields')) {
            unsupported.push({ path: '/custom_fields', reason: `more than ${MAX_IMPORTED_CUSTOM_FIELDS} custom fields; the rest are not imported` });
          }
          continue;
        }
        values.set(name, []);
      }
      values.get(name).push(value);
    }
  });
  const fields = [...values.entries()].map(([name, list]) => ({
    name,
    type: list.every(v => typeof v === 'number') ? 'number'
      : list.every(v => typeof v === 'boolean') ? 'checkbox' : 'text',
  }));
  return { fields, unsupported };
}

// The [{ name, value }] a card stores for its task, given the planned fields.
export function importedCustomFieldValues(task, fields) {
  const source = task && task.custom_fields;
  if (!source || typeof source !== 'object' || Array.isArray(source)) return [];
  const byName = new Map(fields.map(field => [field.name, field]));
  const out = [];
  for (const [rawName, rawValue] of Object.entries(source)) {
    const field = byName.get(String(rawName).trim().slice(0, MAX_CUSTOM_FIELD_NAME));
    let value = customFieldValue(rawValue);
    if (!field || value === undefined) continue;
    if (field.type === 'text') value = String(value);
    out.push({ name: field.name, value });
  }
  return out;
}

// Parent and dependency links between tasks, as task indexes.
export function planImportedLinks(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  const byRef = new Map();
  const unsupported = [];
  list.forEach((task, index) => {
    const ref = task && task.ref;
    if (ref === undefined || ref === null || ref === '') return;
    if (byRef.has(String(ref))) {
      unsupported.push({ path: `/tasks/${index}/ref`, reason: 'duplicate source id; links resolve to the first item' });
      return;
    }
    byRef.set(String(ref), index);
  });
  const parents = [];
  const dependencies = [];
  list.forEach((task, index) => {
    if (!task) return;
    if (task.parent_ref !== undefined && task.parent_ref !== null && task.parent_ref !== '') {
      const parent = byRef.get(String(task.parent_ref));
      if (parent === undefined) {
        unsupported.push({ path: `/tasks/${index}/parent_ref`, reason: 'parent is not part of this import' });
      } else if (parent === index || createsCycle(list, byRef, index, parent)) {
        unsupported.push({ path: `/tasks/${index}/parent_ref`, reason: 'parent link would form a cycle' });
      } else {
        parents.push({ index, parent });
      }
    }
    const deps = [];
    (Array.isArray(task.dependencies) ? task.dependencies : []).forEach(dep => {
      const target = dep && byRef.get(String(dep.ref));
      if (target === undefined) {
        unsupported.push({ path: `/tasks/${index}/dependencies`, reason: 'linked item is not part of this import' });
        return;
      }
      if (target === index || deps.some(d => d.target === target)) return;
      deps.push({ target, type: DEPENDENCY_TYPES.includes(dep.type) ? dep.type : 'related-to' });
    });
    if (deps.length) dependencies.push({ index, deps });
  });
  return { parents, dependencies, unsupported };
}

function createsCycle(list, byRef, index, parent) {
  const seen = new Set([index]);
  let current = parent;
  while (current !== undefined) {
    if (seen.has(current)) return true;
    seen.add(current);
    const ref = list[current] && list[current].parent_ref;
    current = ref === undefined || ref === null || ref === '' ? undefined : byRef.get(String(ref));
  }
  return false;
}
