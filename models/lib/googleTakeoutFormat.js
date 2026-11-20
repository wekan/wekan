// Google Takeout (https://takeout.google.com): one .zip of several Google
// products, read into ONE board with a swimlane per product. The server
// (server/lib/chatArchives.js readGoogleTakeout) opens the zip and hands this
// module what it found; each product maps the way its own import does:
//
//   Tasks/Tasks.json          task lists -> lists, tasks -> cards (notes the
//                             description, due date, a completed task tagged
//                             "done" with its end date, a subtask's parent)
//   Keep/*.json               notes -> cards in "Notes" or "Archived" (trashed
//                             notes are left out), the checklist, labels,
//                             color, pinned as a label, links in the description
//   Mail/*.mbox               conversations -> mail cards in "Inbox"
//                             (models/lib/mailFormat.js), for Board View / Email
//   Calendar/*.ics            tasks and events (models/lib/icalendarFormat.js),
//                             for Calendar and Gantt
//   Google Chat/Groups/*      spaces and direct messages -> cards whose
//                             comments are the messages, for Board View / Chat
//                             (models/lib/chatExportFormats.js)
//
// Plain JavaScript: tests/googleTakeoutFormat.test.cjs runs it in Node.

import { parseMailMessages, MAIL_INBOX_LIST } from './mailFormat.js';
import { parseICalendar } from './icalendarFormat.js';
import { parseGoogleChat } from './chatExportFormats.js';

const KEEP_COLORS = {
  RED: 'red', ORANGE: 'orange', YELLOW: 'yellow', GREEN: 'green', TEAL: 'paleturquoise', BLUE: 'sky',
  CERULEAN: 'blue', PURPLE: 'purple', PINK: 'pink', BROWN: 'saddlebrown', GRAY: 'gray',
};
const clean = value => (typeof value === 'string' ? value.trim() : '');
const usec = value => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? new Date(Math.floor(n / 1000)).toISOString() : undefined;
};

export function parseTakeoutTasks(json) {
  const lists = json && Array.isArray(json.items) ? json.items : [];
  const columns = [];
  const tasks = [];
  for (const list of lists) {
    const column = clean(list && list.title) || 'Tasks';
    if (!columns.includes(column)) columns.push(column);
    for (const task of Array.isArray(list && list.items) ? list.items : []) {
      if (!task || task.deleted === true) continue;
      const done = task.status === 'completed';
      tasks.push({
        ref: task.id,
        parent_ref: task.parent || undefined,
        title: clean(task.title) || 'Untitled task',
        description: [clean(task.notes), ...(Array.isArray(task.links) ? task.links.map(l => clean(l && l.link)) : [])]
          .filter(Boolean).join('\n\n'),
        column_name: column,
        date_due: task.due,
        date_end: done ? task.completed : undefined,
        due_complete: done && task.due ? true : undefined,
        date_creation: task.updated,
        tags: done ? ['done'] : [],
      });
    }
  }
  return { columns, tasks };
}

export function parseKeepNotes(notes) {
  const tasks = [];
  let trashed = 0;
  let files = 0;
  for (const note of Array.isArray(notes) ? notes : []) {
    if (!note || typeof note !== 'object') continue;
    if (note.isTrashed === true) { trashed += 1; continue; }
    files += Array.isArray(note.attachments) ? note.attachments.length : 0;
    const items = (Array.isArray(note.listContent) ? note.listContent : [])
      .map(item => ({ title: clean(item && item.text), done: item && item.isChecked === true })).filter(item => item.title);
    const links = (Array.isArray(note.annotations) ? note.annotations : [])
      .map(a => [clean(a && a.title), clean(a && a.url)].filter(Boolean).join(' - ')).filter(Boolean);
    const text = clean(note.textContent);
    tasks.push({
      title: clean(note.title) || text.split('\n')[0].slice(0, 200) || (items[0] && items[0].title) || 'Untitled note',
      description: [clean(note.title) ? text : text.split('\n').slice(1).join('\n').trim(), ...links].filter(Boolean).join('\n\n'),
      column_name: note.isArchived === true ? 'Archived' : 'Notes',
      color: KEEP_COLORS[String(note.color || '').toUpperCase()],
      date_creation: usec(note.createdTimestampUsec) || usec(note.userEditedTimestampUsec),
      tags: [...(Array.isArray(note.labels) ? note.labels.map(l => clean(l && l.name)) : []),
        ...(note.isPinned === true ? ['pinned'] : [])].filter(Boolean),
      checklists: items.length ? [{ title: 'Checklist', items }] : [],
    });
  }
  return { tasks, trashed, files };
}

// found: { tasks: [Tasks.json object], keep: [note object], mail: [decoded
// message], calendars: [.ics text], chat: [{ name, members, messages }],
// skipped: [path] } - the products the zip held.
export function parseGoogleTakeout(found = {}) {
  const columns = [];
  const swimlanes = [];
  const tasks = [];
  const unsupported = [];
  const add = (swimlane, part) => {
    if (!part.tasks.length) return;
    swimlanes.push(swimlane);
    for (const column of part.columns) if (!columns.includes(column)) columns.push(column);
    for (const task of part.tasks) tasks.push({ ...task, swimlane_name: swimlane });
    unsupported.push(...(part.unsupported || []).map(u => ({ ...u, path: `/${swimlane}${u.path}` })));
  };
  // Mail first, so its Inbox is the board's first list: Board View / Email
  // reads the Inbox from the first list.
  if ((found.mail || []).length) {
    const mail = parseMailMessages(found.mail);
    add('Mail', { columns: [MAIL_INBOX_LIST], tasks: mail.tasks, unsupported: mail.unsupported });
  }
  for (const json of found.tasks || []) {
    const part = parseTakeoutTasks(json);
    add('Tasks', { ...part, unsupported: [] });
  }
  if ((found.keep || []).length) {
    const keep = parseKeepNotes(found.keep);
    const extra = [];
    if (keep.trashed) extra.push({ path: '/notes', reason: `${keep.trashed} note(s) in the Keep trash are not imported` });
    if (keep.files) extra.push({ path: '/notes/attachments', reason: `${keep.files} Keep attachment(s) are not imported` });
    add('Keep', { columns: [...new Set(keep.tasks.map(t => t.column_name))], tasks: keep.tasks, unsupported: extra });
  }
  for (const ics of found.calendars || []) {
    try {
      const calendar = parseICalendar(ics);
      add('Calendar', { columns: calendar.columns.map(c => c.title), tasks: calendar.tasks, unsupported: calendar.unsupported });
    } catch (error) {
      unsupported.push({ path: '/Calendar', reason: `a calendar could not be read: ${error.message}` });
    }
  }
  if ((found.chat || []).length) {
    const chat = parseGoogleChat(found.chat);
    add('Google Chat', { columns: chat.columns.map(c => c.title), tasks: chat.tasks, unsupported: chat.unsupported });
  }
  for (const path of found.skipped || []) {
    unsupported.push({ path: `/${path}`, reason: 'this Google product has no place on a board and is not imported' });
  }
  if (!tasks.length) throw new Error('This Google Takeout .zip has no Tasks, Keep, Mail, Calendar or Google Chat data');
  return {
    board: { name: 'Google Takeout' },
    columns: columns.map(title => ({ title })),
    swimlanes: [...new Set(swimlanes)].map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}
