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
//   checklists: [{ title, items: [{ title, done }] }]
//   comments:   [{ text, author, date }]
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
  const author = text(comment.author).trim();
  const userId = (author && members[author]) || null;
  return {
    text: userId || !author ? body : `${author}: ${body}`,
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

export function planImportedTask(task, { members = {}, allowedColors = [] } = {}) {
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
  const ownerKey = task.owner_id || task.owner_username || task.owner_name;
  return {
    card,
    memberId: (ownerKey && members[ownerKey]) || null,
    checklists: importedChecklists(task.checklists),
    comments: (Array.isArray(task.comments) ? task.comments : [])
      .map(comment => importedComment(comment, members))
      .filter(Boolean),
  };
}
