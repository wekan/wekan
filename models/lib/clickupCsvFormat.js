// ClickUp's task CSV, read and written in plain JavaScript so
// tests/clickupCsv.test.cjs runs the round trip in Node.
//
// Two documented shapes, matched by header name:
//   Workspace export (Settings > Imports / Exports > Export Items):
//     Task ID, Task Link, Task Type, Task Custom ID, Task Name, Task Content,
//     Status, Date created, Date created Text, Due date, Due date Text,
//     Start date, Start date Text, Parent ID, Subtask IDs, Attachments,
//     Assignees, Tags, Priority, List Name, Folder Name/Path, Space Name,
//     Time Estimated, Time Estimated Text, Checklists, Comments,
//     Assigned Comments, Time Spent, Time Spent Text, Rolled Up Time,
//     Rolled Up Time Text
//   Spreadsheets importer: Task ID, Task Name, Status, Priority (1-4),
//     Date created, Due date, Start date, Description content, List, Tags,
//     Task assignee, Checklist, Subtask IDs, Task type, Time Estimate
//
// A row maps to:
//   Status                     -> a list, in the order statuses first appear
//   List Name / List           -> a swimlane (a ClickUp list)
//   Space Name                 -> the board's title (the first row's)
//   Task ID / Parent ID /
//   Subtask IDs                -> the card's reference and its parent card
//   Task Name / Task Content   -> title / description; Attachments (JSON
//                                 [{title, url}]) are added as links
//   Assignees "[A,B]"          -> owner, then further assignees
//   Tags "[a,b]"               -> labels
//   the date columns           -> created, due and start dates: Unix
//                                 milliseconds, or ISO 8601 text
//   Time Spent (ms)            -> spent hours
//   Priority (name or 1-4),
//   Task Type, Task Custom ID,
//   Folder Name/Path,
//   Time Estimated (ms)        -> custom fields
//   Checklist (importer)       -> a checklist, comma-delimited
// The export's Checklists and Comments cells have no documented format and
// are reported, as are dates that are neither milliseconds nor ISO 8601.

import { readCsv } from './todoistCsvFormat.js';
import { markdownLink } from './markdownLink.js';

export const CLICKUP_COLUMNS = ['Task ID', 'Task Link', 'Task Type', 'Task Custom ID', 'Task Name', 'Task Content', 'Status',
  'Date created', 'Date created Text', 'Due date', 'Due date Text', 'Start date', 'Start date Text', 'Parent ID', 'Subtask IDs',
  'Attachments', 'Assignees', 'Tags', 'Priority', 'List Name', 'Folder Name/Path', 'Space Name', 'Time Estimated',
  'Time Estimated Text', 'Checklists', 'Comments', 'Assigned Comments', 'Time Spent', 'Time Spent Text', 'Rolled Up Time',
  'Rolled Up Time Text'];
const PRIORITY = { 1: 'Urgent', 2: 'High', 3: 'Normal', 4: 'Low', urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' };
const HOUR = 3600000;
const NO_STATUS = 'No status';

// "[A,B]", "A,B" or "A, B" -> ['A', 'B'].
const list = text => String(text || '').trim().replace(/^\[|\]$/g, '').split(',').map(part => part.trim()).filter(Boolean);

export function clickupDate(value) {
  const text = String(value || '').trim();
  if (!text) return undefined;
  if (/^\d{10,14}$/.test(text)) {
    const date = new Date(Number(text));
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const date = new Date(`${text}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? undefined : date.toISOString();
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(text)) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function parseClickUpCsv(text) {
  const rows = readCsv(text, 'ClickUp');
  if (!rows.length) throw new Error('ClickUp CSV is empty');
  const header = rows[0].map(cell => cell.trim());
  if (!header.includes('Task Name')) throw new Error('ClickUp CSV needs the Task Name column');
  const get = (cells, ...names) => {
    for (const name of names) {
      const index = header.indexOf(name);
      if (index !== -1 && String(cells[index] || '').trim()) return String(cells[index]).trim();
    }
    return '';
  };
  const columns = [];
  const swimlanes = [];
  const tasks = [];
  const unsupported = [];
  let space = '';
  const childParent = new Map();
  rows.slice(1).forEach((cells, index) => {
    const at = `/row/${index + 2}`;
    const title = get(cells, 'Task Name');
    if (!title) { unsupported.push({ path: at, reason: 'a ClickUp row without a task name is not imported' }); return; }
    space = space || get(cells, 'Space Name');
    const status = get(cells, 'Status') || NO_STATUS;
    if (!columns.includes(status)) columns.push(status);
    const lane = get(cells, 'List Name', 'List') || 'Default';
    if (!swimlanes.includes(lane)) swimlanes.push(lane);
    const date = (...names) => {
      const value = get(cells, ...names);
      const iso = clickupDate(value);
      if (value && !iso) unsupported.push({ path: `${at}/${names[0]}`, reason: `ClickUp date "${value}" is neither milliseconds nor ISO 8601` });
      return iso;
    };
    const custom = {};
    const priority = get(cells, 'Priority');
    if (PRIORITY[priority.toLowerCase()]) custom.Priority = PRIORITY[priority.toLowerCase()];
    else if (priority) unsupported.push({ path: `${at}/Priority`, reason: `ClickUp priority "${priority}" is not urgent, high, normal, low or 1-4` });
    const type = get(cells, 'Task Type', 'Task type');
    if (type && type.toLowerCase() !== 'task') custom['Task Type'] = type;
    if (get(cells, 'Task Custom ID')) custom['Custom ID'] = get(cells, 'Task Custom ID');
    if (get(cells, 'Folder Name/Path')) custom.Folder = get(cells, 'Folder Name/Path');
    const estimate = Number(get(cells, 'Time Estimated', 'Time Estimate'));
    if (estimate > 0) custom['Time Estimate (hours)'] = Math.round((estimate / HOUR) * 100) / 100;
    const spent = Number(get(cells, 'Time Spent', 'Time Tracked'));
    let description = get(cells, 'Task Content', 'Description content');
    const attachments = get(cells, 'Attachments');
    if (attachments && attachments !== '[]') {
      try {
        const links = JSON.parse(attachments).filter(a => a && /^https?:\/\//i.test(String(a.url || '')))
          .map(a => markdownLink(String(a.title || a.url), a.url));
        if (links.length) description = [description, links.join('\n')].filter(Boolean).join('\n\n');
      } catch (e) {
        unsupported.push({ path: `${at}/Attachments`, reason: 'ClickUp attachments are not the documented JSON list' });
      }
    }
    for (const name of ['Checklists', 'Comments', 'Assigned Comments']) {
      const value = get(cells, name);
      if (value && value !== '0' && value !== '[]') unsupported.push({ path: `${at}/${name}`, reason: `ClickUp ${name} cells have no documented format and are not imported` });
    }
    const items = list(get(cells, 'Checklist'));
    const people = list(get(cells, 'Assignees', 'Task assignee'));
    const id = get(cells, 'Task ID');
    list(get(cells, 'Subtask IDs')).forEach(child => { if (id) childParent.set(child, id); });
    tasks.push({
      title,
      description,
      column_name: status,
      swimlane_name: lane,
      tags: list(get(cells, 'Tags')),
      ...(id ? { ref: id } : {}),
      ...(get(cells, 'Parent ID') ? { parent_ref: get(cells, 'Parent ID') } : {}),
      ...(people.length ? { owner_username: people[0] } : {}),
      ...(people.length > 1 ? { assignees: people.slice(1) } : {}),
      ...(date('Date created') ? { date_creation: date('Date created') } : {}),
      ...(date('Due date') ? { date_due: date('Due date') } : {}),
      ...(date('Start date') ? { date_started: date('Start date') } : {}),
      ...(spent > 0 ? { spent_hours: Math.round((spent / HOUR) * 100) / 100 } : {}),
      ...(items.length ? { checklists: [{ title: 'Checklist', items: items.map(item => ({ title: item, done: false })) }] } : {}),
      ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
    });
  });
  // A Subtask IDs list is the same link seen from the parent.
  for (const task of tasks) if (!task.parent_ref && task.ref && childParent.has(task.ref)) task.parent_ref = childParent.get(task.ref);
  return {
    board: { name: space || 'Imported ClickUp tasks' },
    columns: columns.map(title => ({ title })),
    swimlanes: (swimlanes.length ? swimlanes : ['Default']).map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

const field = value => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const millis = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : String(date.getTime());
};
const isoText = value => (millis(value) ? new Date(value).toISOString() : '');
const bracket = values => (values.length ? `[${values.map(v => String(v).replace(/[,[\]]/g, ' ').trim()).join(',')}]` : '');

// The workspace export's columns, in its order, and the Spreadsheets
// importer's own Checklist column (comma-delimited), since the export's
// Checklists cell has no documented format: ClickUp's importer maps them by
// these names.
export const CLICKUP_EXPORT_COLUMNS = [...CLICKUP_COLUMNS, 'Checklist'];
export function formatClickUpCsv({ board, items }) {
  const ids = new Map((items || []).map(item => [item.cardId, item.cardId]));
  const children = new Map();
  (items || []).forEach(item => {
    if (item.parentCardId && ids.has(item.parentCardId)) {
      children.set(item.parentCardId, [...(children.get(item.parentCardId) || []), item.cardId]);
    }
  });
  const rows = [CLICKUP_EXPORT_COLUMNS];
  for (const item of items || []) {
    const fields = item.customFields || {};
    const priority = PRIORITY[String(fields.Priority || '').toLowerCase()];
    const estimate = Number(fields['Time Estimate (hours)']);
    const checklist = (Array.isArray(item.checklists) ? item.checklists : []).flatMap(list => (Array.isArray(list.items) ? list.items : []));
    const values = {
      'Task ID': item.cardId || '',
      'Task Type': fields['Task Type'] || 'Task',
      'Task Custom ID': fields['Custom ID'] || '',
      'Task Name': String(item.title || '').trim() || 'Untitled',
      'Task Content': item.description || '',
      Status: item.listTitle || NO_STATUS,
      'Date created': millis(item.createdAt),
      'Date created Text': isoText(item.createdAt),
      'Due date': millis(item.dueAt),
      'Due date Text': isoText(item.dueAt),
      'Start date': millis(item.startAt),
      'Start date Text': isoText(item.startAt),
      'Parent ID': item.parentCardId && ids.has(item.parentCardId) ? item.parentCardId : '',
      'Subtask IDs': bracket(children.get(item.cardId) || []),
      Attachments: '[]',
      Assignees: bracket([item.owner, ...(Array.isArray(item.assignees) ? item.assignees : [])].filter(Boolean)),
      Tags: bracket(Array.isArray(item.labels) ? item.labels : []),
      Priority: priority ? priority.toLowerCase() : '',
      'List Name': item.swimlaneTitle && item.swimlaneTitle !== 'Default' ? item.swimlaneTitle : '',
      'Folder Name/Path': fields.Folder || '',
      'Space Name': (board && board.title) || '',
      'Time Estimated': estimate > 0 ? String(Math.round(estimate * HOUR)) : '',
      Checklist: checklist.map(entry => String(entry.title || '').replace(/,/g, ' ')).join(','),
    };
    rows.push(CLICKUP_EXPORT_COLUMNS.map(name => values[name] || ''));
  }
  return `${rows.map(cells => cells.map(field).join(',')).join('\r\n')}\r\n`;
}
