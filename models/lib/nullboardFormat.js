// Nullboard board files (.nbx), read and written in plain JavaScript so
// tests/nullboardFormat.test.cjs runs the round trip in Node.
//
// Nullboard (apankrat/nullboard, nullboard.html) exports a board as plain
// JSON despite the .nbx extension: JSON.stringify of one board object, or of
// an array of them for "Export all boards". Its importer, checkImport(),
// requires every board to have the keys format, id, revision, title and lists,
// a non-empty id and revision, an array of lists, and format 20190412
// (NB.blobVersion); anything else is refused. A board is
//   { format: 20190412, id: <epoch ms>, revision: <int>, title,
//     lists: [ { title, notes: [ { text, raw, min } ] } ] }
// and that is all there is: no dates, labels, people, comments, attachments
// or checklists.
//
// A note is free text with line breaks. It maps to a card:
//   list                    -> a list, in order (a repeated or empty title is
//                              made unique, since WeKan matches lists by title)
//   note text, first line   -> the card's title (the first non-blank line)
//   note text, the rest     -> the card's description
//   raw: true               -> the label "raw" (a raw note is drawn without a
//                              card frame, as a heading inside the list)
//   min: true               -> reported once: collapsed is Nullboard's view
//                              state and a WeKan card has no collapsed state
//   board title             -> the board's title
// An array of boards imports its first board; the others are reported, since
// one import creates one board.
//
// Export writes one board object Nullboard's importer accepts. A note's text
// is the card title, then the description on the following lines, then each
// checklist as a title line and "[ ]" / "[x]" item lines, so checklist items
// survive as readable text. A card labelled "raw" becomes a raw note. Other
// labels, dates, people and comments have no place in a Nullboard note and
// are not written.

export const NULLBOARD_FORMAT = 20190412;
export const NULLBOARD_RAW_LABEL = 'raw';
const REQUIRED = ['format', 'id', 'revision', 'title', 'lists'];

// The checks of Nullboard's own checkImport(), with its messages.
function checkBoard(board, at) {
  if (!board || typeof board !== 'object' || Array.isArray(board)) {
    throw new Error(`Nullboard file${at}: a board must be a JSON object`);
  }
  for (const key of REQUIRED) {
    if (!Object.prototype.hasOwnProperty.call(board, key)) {
      throw new Error(`Nullboard file${at}: required board properties are missing (${key})`);
    }
  }
  if (!board.id || !board.revision || !Array.isArray(board.lists)) {
    throw new Error(`Nullboard file${at}: required board properties are empty`);
  }
  if (Number(board.format) !== NULLBOARD_FORMAT) {
    throw new Error(`Nullboard file${at}: unsupported blob format "${board.format}", expecting "${NULLBOARD_FORMAT}"`);
  }
}

// The first non-blank line is the title; everything after it the description.
export function splitNoteText(text) {
  const lines = String(text).split(/\r\n|\r|\n/);
  const first = lines.findIndex(line => line.trim());
  if (first === -1) return { title: '', description: '' };
  return { title: lines[first].trim(), description: lines.slice(first + 1).join('\n').replace(/\s+$/, '') };
}

export function parseNullboard(input) {
  let data = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input.replace(/^﻿/, ''));
    } catch (error) {
      throw new Error('Nullboard file is not valid JSON');
    }
  }
  const boards = Array.isArray(data) ? data : [data];
  if (!boards.length) throw new Error('Nullboard file holds no board');
  boards.forEach((board, index) => checkBoard(board, Array.isArray(data) ? ` board ${index + 1}` : ''));
  const [board] = boards;
  const unsupported = boards.slice(1).map((other, index) => ({
    path: `/${index + 1}`,
    reason: `Nullboard board "${String(other.title || '')}" is not imported: one import creates one board, import its own export`,
  }));

  const columns = [];
  const tasks = [];
  let collapsed = 0;
  board.lists.forEach((list, listIndex) => {
    const at = `/lists/${listIndex}`;
    const base = (list && typeof list.title === 'string' && list.title.trim()) || 'Untitled list';
    let title = base;
    for (let n = 2; columns.includes(title); n += 1) title = `${base} (${n})`;
    if (list && typeof list.title === 'string' && list.title.trim() && title !== base) {
      unsupported.push({ path: `${at}/title`, reason: `a second Nullboard list "${base}" is imported as "${title}"` });
    }
    columns.push(title);
    const notes = list && Array.isArray(list.notes) ? list.notes : [];
    if (list && list.notes !== undefined && !Array.isArray(list.notes)) {
      unsupported.push({ path: `${at}/notes`, reason: 'Nullboard list notes are not an array and are not imported' });
    }
    notes.forEach((note, noteIndex) => {
      const path = `${at}/notes/${noteIndex}`;
      if (!note || typeof note.text !== 'string') {
        unsupported.push({ path, reason: 'a Nullboard note without text is not imported' });
        return;
      }
      const { title: cardTitle, description } = splitNoteText(note.text);
      if (!cardTitle) {
        unsupported.push({ path, reason: 'an empty Nullboard note is not imported' });
        return;
      }
      if (note.min === true) collapsed += 1;
      tasks.push({
        title: cardTitle,
        description,
        column_name: title,
        swimlane_name: 'Default',
        tags: note.raw === true ? [NULLBOARD_RAW_LABEL] : [],
      });
    });
  });
  if (collapsed) {
    unsupported.push({ path: '/lists/notes/min',
      reason: `${collapsed} collapsed Nullboard note(s) are imported expanded: a WeKan card has no collapsed state` });
  }
  return {
    board: { name: (typeof board.title === 'string' && board.title.trim()) || 'Imported Nullboard' },
    columns: columns.map(name => ({ title: name })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

function noteText(item) {
  const parts = [String(item.title || '').replace(/\s*[\r\n]+\s*/g, ' ').trim() || 'Untitled'];
  const description = String(item.description || '').replace(/\s+$/, '');
  if (description) parts.push(description);
  for (const checklist of Array.isArray(item.checklists) ? item.checklists : []) {
    const entries = Array.isArray(checklist.items) ? checklist.items : [];
    if (!entries.length) continue;
    parts.push([String(checklist.title || '').trim() || 'Checklist',
      ...entries.map(entry => `[${entry.done ? 'x' : ' '}] ${String(entry.title || '').trim()}`)].join('\n'));
  }
  // The title is the first line; a blank line separates the blocks after it.
  return [parts[0], parts.slice(1).join('\n\n')].filter(Boolean).join('\n');
}

// One board object that Nullboard's importer accepts. The id is the board's
// creation time in epoch milliseconds, as Nullboard makes its own ids, so a
// second export of the same board is offered as an overwrite in Nullboard.
export function formatNullboard({ board, lists, items }) {
  const created = board && board.createdAt ? new Date(board.createdAt).getTime() : NaN;
  const out = {
    format: NULLBOARD_FORMAT,
    id: Number.isFinite(created) && created > 0 ? created : Date.now(),
    revision: 1,
    title: String((board && board.title) || 'WeKan board'),
    lists: [],
  };
  const all = Array.isArray(items) ? items : [];
  const used = new Set();
  const notesOf = cards => cards.map(item => {
    used.add(item);
    return {
      text: noteText(item),
      raw: (Array.isArray(item.labels) ? item.labels : []).includes(NULLBOARD_RAW_LABEL),
      min: false,
    };
  });
  for (const list of Array.isArray(lists) ? lists : []) {
    const cards = all.filter(item => (list._id && item.listId ? item.listId === list._id : item.listTitle === list.title));
    out.lists.push({ title: String(list.title || ''), notes: notesOf(cards) });
  }
  // Cards whose list was not passed are kept in a list of their own name.
  for (const item of all) {
    if (used.has(item)) continue;
    const title = String(item.listTitle || 'List');
    let list = out.lists.find(entry => entry.title === title && entry.extra);
    if (!list) { list = { title, notes: [], extra: true }; out.lists.push(list); }
    list.notes.push(...notesOf([item]));
  }
  out.lists.forEach(list => { delete list.extra; });
  return `${JSON.stringify(out)}\n`;
}
