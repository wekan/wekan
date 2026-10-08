// TickTick's backup CSV (Settings > Account > Backup & Import > Generate
// backup; Import backup reads the same file), read and written in plain
// JavaScript so tests/ticktickCsv.test.cjs runs the round trip in Node.
// TickTick publishes no specification; the layout below is what its backups
// contain (versions 7.1 and 7.2), as Vikunja's TickTick migrator also reads it.
//
//   "Date: 2026-06-29+0000"
//   "Version: 7.2"
//   "Status:
//   0 Normal
//   1 Completed
//   2 Archived"
//   "Folder Name","List Name","Title","Kind","Tags","Content","Is Check list",
//   "Start Date","Due Date","Reminder","Repeat","Priority","Status",
//   "Created Time","Completed Time","Order","Timezone","Is All Day",
//   "Is Floating","Column Name","Column Order","View Mode","taskId",
//   "parentId"[,"projectKind"]
//
// The header row is found by its first cell, and columns by name: 7.2 added
// projectKind. A row maps to:
//   List Name                -> a swimlane (one per TickTick list)
//   Column Name              -> a list ("Tasks" when the list has no columns)
//   Title / Content          -> title / description; in a checklist, lines
//                               starting ▫ (open) or ▪ (done) are its items
//   Tags ("a, b")            -> labels
//   Start / Due / Created /
//   Completed Time           -> start, due, created and end dates; an all-day
//                               date is the calendar day in its Timezone
//   Status 1 / 2 / -1        -> completed / archived / label "won't do"
//   Priority 1 / 3 / 5       -> custom field Priority Low / Medium / High
//   Folder Name              -> custom field Folder
//   taskId / parentId        -> the card's reference / its parent card
// Reported: reminders, repeat rules and unknown status or priority codes.

import { readCsv } from './todoistCsvFormat.js';

export const TICKTICK_COLUMNS = ['Folder Name', 'List Name', 'Title', 'Kind', 'Tags', 'Content', 'Is Check list',
  'Start Date', 'Due Date', 'Reminder', 'Repeat', 'Priority', 'Status', 'Created Time', 'Completed Time', 'Order',
  'Timezone', 'Is All Day', 'Is Floating', 'Column Name', 'Column Order', 'View Mode', 'taskId', 'parentId', 'projectKind'];
const PRIORITY = { 1: 'Low', 3: 'Medium', 5: 'High' };
const PRIORITY_CODE = { Low: '1', Medium: '3', High: '5' };
const OPEN = '▫';
const DONE = '▪';
const NO_COLUMN = 'Tasks';

// "2026-10-08T00:00:00+0000", as ISO. For an all-day date, the calendar day
// it falls on in `timezone`, at midnight UTC, so the day does not move.
export function ticktickDate(value, { allDay = false, timezone = '' } = {}) {
  const text = String(value || '').trim();
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-]\d{2}):?(\d{2})$/.exec(text);
  if (!match) return undefined;
  const date = new Date(`${match[1]}${match[2]}:${match[3]}`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (!allDay) return date.toISOString();
  let day = date.toISOString().slice(0, 10);
  try {
    if (timezone) day = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  } catch (e) { /* an unknown time zone keeps the UTC day */ }
  return `${day}T00:00:00.000Z`;
}

export function parseTickTickCsv(text) {
  const rows = readCsv(text, 'TickTick');
  const headerAt = rows.findIndex(cells => String(cells[0] || '').trim() === 'Folder Name');
  if (headerAt === -1) throw new Error('TickTick backup has no header row starting with "Folder Name"');
  const header = rows[headerAt].map(cell => cell.trim());
  if (!header.includes('Title') || !header.includes('List Name')) throw new Error('TickTick backup needs the List Name and Title columns');
  const get = (cells, name) => (header.indexOf(name) === -1 ? '' : String(cells[header.indexOf(name)] || '').trim());
  const columns = [];
  const swimlanes = [];
  const tasks = [];
  const unsupported = [];
  rows.slice(headerAt + 1).forEach((cells, index) => {
    const at = `/row/${headerAt + index + 2}`;
    const title = get(cells, 'Title');
    if (!title) { unsupported.push({ path: at, reason: 'a TickTick row without a title is not imported' }); return; }
    const lane = get(cells, 'List Name') || 'Default';
    if (!swimlanes.includes(lane)) swimlanes.push(lane);
    const list = get(cells, 'Column Name') || NO_COLUMN;
    if (!columns.includes(list)) columns.push(list);
    // "Is All Day" is about the start and due dates; created and completed
    // times are always moments.
    const allDay = get(cells, 'Is All Day') === 'true';
    const date = name => {
      const value = get(cells, name);
      const iso = ticktickDate(value, { allDay: allDay && (name === 'Start Date' || name === 'Due Date'), timezone: get(cells, 'Timezone') });
      if (value && !iso) unsupported.push({ path: `${at}/${name}`, reason: `TickTick date "${value}" is not in its backup format` });
      return iso;
    };
    const items = [];
    const description = [];
    String(cells[header.indexOf('Content')] || '').split(/\r\n|\r|\n/).forEach(line => {
      if (line.startsWith(OPEN) || line.startsWith(DONE)) items.push({ title: line.slice(1).trim(), done: line.startsWith(DONE) });
      else description.push(line);
    });
    const tags = get(cells, 'Tags').split(',').map(tag => tag.trim()).filter(Boolean);
    const custom = {};
    const priority = get(cells, 'Priority');
    if (PRIORITY[priority]) custom.Priority = PRIORITY[priority];
    else if (priority && priority !== '0') unsupported.push({ path: `${at}/Priority`, reason: `TickTick priority "${priority}" is not 0, 1, 3 or 5` });
    if (get(cells, 'Folder Name')) custom.Folder = get(cells, 'Folder Name');
    const status = get(cells, 'Status') || '0';
    if (status === '-1') tags.push("won't do");
    else if (!['0', '1', '2'].includes(status)) unsupported.push({ path: `${at}/Status`, reason: `TickTick status "${status}" is not 0, 1 or 2; imported as open` });
    if (get(cells, 'Reminder')) unsupported.push({ path: `${at}/Reminder`, reason: 'TickTick reminders have no WeKan place' });
    if (get(cells, 'Repeat')) unsupported.push({ path: `${at}/Repeat`, reason: `repeating task "${get(cells, 'Repeat')}" is imported once` });
    const ended = status === '1' || status === '2' ? date('Completed Time') : undefined;
    tasks.push({
      title,
      description: description.join('\n').trim(),
      column_name: list,
      swimlane_name: lane,
      tags,
      ...(get(cells, 'taskId') ? { ref: get(cells, 'taskId') } : {}),
      ...(get(cells, 'parentId') ? { parent_ref: get(cells, 'parentId') } : {}),
      ...(date('Start Date') ? { date_started: date('Start Date') } : {}),
      ...(date('Due Date') ? { date_due: date('Due Date') } : {}),
      ...(date('Created Time') ? { date_creation: date('Created Time') } : {}),
      ...(ended ? { date_end: ended } : {}),
      ...(status === '2' ? { archived: true } : {}),
      ...(items.length ? { checklists: [{ title: 'Checklist', items }] } : {}),
      ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
    });
  });
  return {
    board: { name: 'Imported TickTick backup' },
    columns: columns.map(title => ({ title })),
    swimlanes: (swimlanes.length ? swimlanes : ['Default']).map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

const quoted = value => `"${String(value === undefined || value === null ? '' : value).replace(/"/g, '""')}"`;
const stamp = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : `${date.toISOString().slice(0, 19)}+0000`;
};
const midnight = value => Boolean(value) && new Date(value).toISOString().slice(11, 19) === '00:00:00';

// A backup TickTick's Import backup reads: the preamble, the 7.2 header, and
// one row per card, every field quoted as TickTick writes them. The board is
// one TickTick list; its WeKan lists are that list's kanban columns.
export function formatTickTickCsv({ board, lists, items }, now = new Date()) {
  const listName = (board && board.title) || 'WeKan board';
  const order = (Array.isArray(lists) ? lists : []).map(list => list.title);
  const ids = new Map((items || []).map((item, index) => [item.cardId, String(index + 1)]));
  const lines = [
    quoted(`Date: ${now.toISOString().slice(0, 10)}+0000`),
    quoted('Version: 7.2'),
    quoted('Status: \n0 Normal\n1 Completed\n2 Archived'),
    TICKTICK_COLUMNS.map(quoted).join(','),
  ];
  (items || []).forEach((item, index) => {
    const fields = item.customFields || {};
    const checklist = (Array.isArray(item.checklists) ? item.checklists : []).flatMap(list => (Array.isArray(list.items) ? list.items : []));
    const content = [item.description || '', ...checklist.map(entry => `${entry.done ? DONE : OPEN}${entry.title}`)]
      .filter(Boolean).join('\n');
    const labels = (Array.isArray(item.labels) ? item.labels : []).map(label => String(label).replace(/,/g, ' ').trim()).filter(Boolean);
    const wontDo = labels.includes("won't do");
    const allDay = [item.startAt, item.dueAt].filter(Boolean).every(midnight);
    const values = {
      'Folder Name': fields.Folder || '',
      'List Name': listName,
      Title: String(item.title || '').trim() || 'Untitled',
      Kind: checklist.length ? 'CHECKLIST' : 'TEXT',
      Tags: labels.filter(label => label !== "won't do").join(', '),
      Content: content,
      'Is Check list': checklist.length ? 'Y' : 'N',
      'Start Date': stamp(item.startAt),
      'Due Date': stamp(item.dueAt),
      Priority: PRIORITY_CODE[fields.Priority] || '0',
      Status: wontDo ? '-1' : item.endAt ? '1' : '0',
      'Created Time': stamp(item.createdAt),
      'Completed Time': item.endAt ? stamp(item.endAt) : '',
      Order: String(index * 1099511627776),
      Timezone: 'UTC',
      'Is All Day': item.startAt || item.dueAt ? String(allDay) : '',
      'Is Floating': 'false',
      'Column Name': item.listTitle || NO_COLUMN,
      'Column Order': String(Math.max(0, order.indexOf(item.listTitle))),
      'View Mode': 'kanban',
      taskId: ids.get(item.cardId) || String(index + 1),
      parentId: item.parentCardId && ids.has(item.parentCardId) ? ids.get(item.parentCardId) : '',
      projectKind: 'TASK',
    };
    lines.push(TICKTICK_COLUMNS.map(name => quoted(values[name] || '')).join(','));
  });
  return `${lines.join('\n')}\n`;
}
