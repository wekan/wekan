// Evernote .enex export files (https://evernote.com/blog/how-evernotes-xml-export-format-works),
// which Evernote, Joplin, Apple Notes importers and many note apps read and
// write. The XML is parsed on the server (server/lib/enexImport.js, with
// htmlparser2); this module maps notes to cards and writes a board as .enex.
// Plain JavaScript: tests/enexFormat.test.cjs runs both directions in Node.
//
//   note title                -> card title
//   note content (ENML)       -> description, as text; each <en-todo> line
//                                -> an item of the checklist "To-do"
//   created / updated         -> creation date
//   tag                       -> label
//   note-attributes
//     reminder-time           -> due date
//     reminder-done-time      -> the card is in the list "Done", its end date
//     author, source-url      -> appended to the description
//   resource (files, images)  -> not imported; counted and reported
// Every other note is in the list "Notes".

export const MAX_ENEX_LENGTH = 256 * 1024 * 1024;
export const MAX_ENEX_NOTES = 50000;
export const ENEX_TODO_MARK = '\u0001';

// 20261116T100000Z -> ISO
export function enexDate(value) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(String(value || '').trim());
  if (!m) return undefined;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
// ISO -> 20261116T100000Z
export function toEnexDate(value) {
  const d = new Date(value || 0);
  if (!value || Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// The card of one note, from what the server read out of its XML:
// { title, text (the content's text, with ENEX_TODO_MARK + 'x' or ' ' before
// each to-do), created, updated, tags, reminderTime, reminderDoneTime,
// author, sourceUrl, resources }.
export function enexNoteToTask(note) {
  const description = [];
  const items = [];
  for (const line of String(note.text || '').split('\n')) {
    if (line.startsWith(ENEX_TODO_MARK)) {
      const title = line.slice(2).trim();
      if (title) items.push({ title, done: line[1] === 'x' });
    } else description.push(line);
  }
  const extra = [note.author && `Author: ${note.author}`, note.sourceUrl].filter(Boolean);
  const done = Boolean(enexDate(note.reminderDoneTime));
  return {
    title: String(note.title || '').trim() || 'Untitled note',
    description: [description.join('\n').replace(/\n{3,}/g, '\n\n').trim(), ...extra].filter(Boolean).join('\n\n'),
    column_name: done ? 'Done' : 'Notes',
    swimlane_name: 'Default',
    date_creation: enexDate(note.created) || enexDate(note.updated),
    date_due: enexDate(note.reminderTime),
    date_end: done ? enexDate(note.reminderDoneTime) : undefined,
    due_complete: done && enexDate(note.reminderTime) ? true : undefined,
    tags: [...new Set((note.tags || []).map(t => String(t).trim()).filter(Boolean))],
    checklists: items.length ? [{ title: 'To-do', items }] : [],
  };
}

export function enexBoard(notes, { name = 'Imported Evernote', cutOff = false } = {}) {
  const tasks = notes.map(enexNoteToTask);
  const resources = notes.reduce((n, note) => n + (Number(note.resources) || 0), 0);
  const unsupported = [];
  if (cutOff) unsupported.push({ path: '/en-export/note', reason: `only the first ${MAX_ENEX_NOTES} notes are imported` });
  if (resources) unsupported.push({ path: '/en-export/note/resource', reason: `${resources} attached file(s) and image(s) are not imported` });
  const lists = ['Notes', ...(tasks.some(t => t.column_name === 'Done') ? ['Done'] : [])];
  return { board: { name }, columns: lists.map(title => ({ title })), swimlanes: [{ name: 'Default' }], tasks, warnings: [], unsupported };
}

// ----- export --------------------------------------------------------------

const xml = value => String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
// CDATA cannot hold "]]>"; it is split across two sections.
const cdata = text => `<![CDATA[${String(text).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

function enml(item) {
  const blocks = [];
  for (const line of String(item.description || '').replace(/\r\n|\r/g, '\n').split('\n')) {
    blocks.push(line.trim() ? `<div>${xml(line)}</div>` : '<div><br/></div>');
  }
  for (const checklist of item.checklists || []) {
    blocks.push(`<div><b>${xml(checklist.title)}</b></div>`);
    for (const it of checklist.items || []) {
      blocks.push(`<div><en-todo checked="${it.done ? 'true' : 'false'}"/>${xml(it.title)}</div>`);
    }
  }
  if ((item.comments || []).length) {
    blocks.push('<hr/>');
    for (const c of item.comments) blocks.push(`<div>${xml(c.author ? `${c.author}: ${c.text}` : c.text)}</div>`);
  }
  return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
    + '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">'
    + `<en-note>${blocks.join('')}</en-note>`;
}

export function formatEnex({ items = [] } = {}, { now = new Date() } = {}) {
  const notes = items.map(item => {
    const created = toEnexDate(item.createdAt);
    const attributes = [
      item.dueAt ? `<reminder-time>${toEnexDate(item.dueAt)}</reminder-time>` : '',
      item.dueAt && item.dueComplete ? `<reminder-done-time>${toEnexDate(item.endAt || item.dueAt)}</reminder-done-time>` : '',
      item.creator ? `<author>${xml(item.creator)}</author>` : '',
    ].join('');
    return [
      '  <note>',
      `    <title>${xml(String(item.title || 'Untitled').slice(0, 255))}</title>`,
      `    <content>${cdata(enml(item))}</content>`,
      created ? `    <created>${created}</created>` : '',
      created ? `    <updated>${created}</updated>` : '',
      ...[...new Set([...(item.labels || []), item.listTitle].filter(Boolean))].map(tag => `    <tag>${xml(tag)}</tag>`),
      attributes ? `    <note-attributes>${attributes}</note-attributes>` : '',
      '  </note>',
    ].filter(Boolean).join('\n');
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export4.dtd">\n'
    + `<en-export export-date="${toEnexDate(now)}" application="WeKan" version="1">\n${notes.join('\n')}\n</en-export>\n`;
}
