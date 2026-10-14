// Google Keep's notes, as models/lib/apiImport/googlekeep.js fetches them
// from the Keep API, read into WeKan's normalized board (the shape
// models/lib/externalParsers.js parsers return). Plain JavaScript without
// Meteor, so tests/googlekeepApiImport.test.cjs runs it in Node.
//
//   { googlekeep: true, notes: [note] }   (or the API's own { notes: [...] })
//   note: { name: 'notes/...', createTime, updateTime, trashTime, trashed,
//           title, body: { text: { text } }
//                     | { list: { listItems: [item] } },
//           permissions: [{ name, email, role }], attachments: [{ name, mimeType: [] }] }
//   item: { text: { text }, checked, childListItems: [item] }
//
// A note maps to:
//   a text note           -> a card in the list "Notes", the text as description
//   a checklist note      -> a card in the list "Lists", its items as the
//                            checklist "Items"; WeKan checklists are flat, so a
//                            child item follows its parent prefixed "↳ "
//   title                 -> the card title; an untitled note takes its first
//                            line (at most 80 characters)
//   name                  -> the source reference
//   createTime            -> the card's creation date
// Keep has no boards, lists, labels or due dates in its API: everything goes
// to one board "Google Keep", swimlane Default. Reported: trashed notes (not
// imported), attachments (not downloaded), sharing with other people.

export const MAX_GOOGLE_KEEP_NOTES = 20000;
export const MAX_GOOGLE_KEEP_TITLE = 80;
const NOTES = 'Notes';
const LISTS = 'Lists';
const CHECKLIST = 'Items';
const CHILD_MARK = '↳ ';
const DEFAULT_SWIMLANE = 'Default';
const MAX_DEPTH = 8;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => (typeof value === 'string' ? value : '');
const contentText = content => (isObject(content) ? text(content.text) : '');

function readInput(input) {
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch (error) { throw new Error('Google Keep data is not valid JSON'); }
  }
  return input;
}

function isoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// The first non-empty line, cut to the title length.
function firstLine(value) {
  const line = text(value).split(/\r?\n/).map(part => part.trim()).find(Boolean) || '';
  return line.length > MAX_GOOGLE_KEEP_TITLE ? `${line.slice(0, MAX_GOOGLE_KEEP_TITLE - 1)}…` : line;
}

function flattenItems(items, depth, out) {
  for (const item of Array.isArray(items) ? items : []) {
    if (!isObject(item)) continue;
    const title = contentText(item.text).trim();
    if (title) out.push({ title: `${CHILD_MARK.repeat(depth)}${title}`, done: item.checked === true });
    if (depth < MAX_DEPTH) flattenItems(item.childListItems, depth + 1, out);
  }
  return out;
}

export function parseGoogleKeepApi(input) {
  const data = readInput(input);
  if (!isObject(data)) throw new Error('Google Keep data must be a JSON object');
  if (!Array.isArray(data.notes)) throw new Error('Google Keep data needs a notes array');
  if (data.notes.length > MAX_GOOGLE_KEEP_NOTES) throw new Error(`Google Keep data has more than ${MAX_GOOGLE_KEEP_NOTES} notes`);

  const unsupported = [];
  const tasks = [];
  let trashed = 0;
  data.notes.forEach((note, index) => {
    const at = `/notes/${index}`;
    if (!isObject(note)) { unsupported.push({ path: at, reason: 'a Google Keep note that is not an object is not imported' }); return; }
    if (note.trashed === true || note.trashTime) { trashed += 1; return; }
    const body = isObject(note.body) ? note.body : {};
    const isList = isObject(body.list);
    const task = {
      title: '',
      description: '',
      column_name: isList ? LISTS : NOTES,
      swimlane_name: DEFAULT_SWIMLANE,
      tags: [],
    };
    if (isList) {
      const items = flattenItems(body.list.listItems, 0, []);
      if (items.length) task.checklists = [{ title: CHECKLIST, items }];
      task.title = text(note.title).trim() || (items.length ? firstLine(items[0].title) : '');
    } else {
      task.description = contentText(body.text);
      task.title = text(note.title).trim() || firstLine(task.description);
      if (note.body !== undefined && !isObject(body.text)) {
        unsupported.push({ path: `${at}/body`, reason: 'a Google Keep note body that is neither text nor a list is not imported' });
      }
    }
    if (!task.title) task.title = 'Untitled note';
    if (text(note.name)) task.ref = text(note.name);
    const created = isoDate(note.createTime);
    if (created) task.date_creation = created;
    else if (created === undefined) unsupported.push({ path: `${at}/createTime`, reason: `Google Keep createTime "${text(note.createTime)}" is not a date` });

    const attachments = (Array.isArray(note.attachments) ? note.attachments : []).filter(isObject);
    if (attachments.length) {
      const types = [...new Set(attachments.flatMap(a => (Array.isArray(a.mimeType) ? a.mimeType : [])).filter(t => typeof t === 'string'))];
      unsupported.push({ path: `${at}/attachments`,
        reason: `"${task.title}" has ${attachments.length} attachment(s)${types.length ? ` (${types.join(', ')})` : ''}; Google Keep attachments are not downloaded` });
    }
    // The owner is always listed; anyone else means the note is shared.
    const shared = (Array.isArray(note.permissions) ? note.permissions : [])
      .filter(p => isObject(p) && p.role !== 'OWNER' && p.deleted !== true);
    if (shared.length) {
      unsupported.push({ path: `${at}/permissions`,
        reason: `"${task.title}" is shared with ${shared.length} other(s) in Google Keep; sharing is not imported, add them as board members` });
    }
    tasks.push(task);
  });
  if (trashed) unsupported.push({ path: '/notes', reason: `${trashed} trashed Google Keep note(s) are not imported` });

  const columns = [NOTES, LISTS].filter(name => tasks.some(task => task.column_name === name));
  if (!columns.length) columns.push(NOTES);
  return {
    board: { name: 'Google Keep' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: DEFAULT_SWIMLANE }],
    tasks,
    warnings: [],
    unsupported,
  };
}
