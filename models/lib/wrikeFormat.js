// Wrike's Excel import template, read and written as rows of cells. The
// workbook itself is opened and written on the server
// (server/lib/wrikeWorkbook.js); this module is plain JavaScript so
// tests/wrikeFormat.test.cjs runs the round trip in Node.
//
// Wrike does not document the columns of its own Excel export, only of its
// Excel import ("Formatting XLS Files for Import to Wrike", and the official
// sample excel_import_sample.xls, sheet "Tasks"). WeKan reads and writes that
// documented import shape:
//
//   Key | Parent Task | Title | Status | Priority | Assigned To | Start Date |
//   Duration | End Date | Depends On | Start Date Constraint | Description |
//   <custom fields, right of Description>
//
//   1   |   | /Folder 1/             |        |        |                      (a folder row)
//   2   |   | Task 1                 | Active | Normal | Name Surname <name@company.com> | 2015-09-24 | 2 days | 2015-09-25 | ...
//   3   |   | Task 2                 | Active | Normal | ... | 2SS | ...
//   6   |   | /Folder 2/Subfolder 1/ |        |        |                      (a nested folder)
//   16  |   | /Project/              | Green  |        | ...                  (a project row: its status, owner, dates)
//
// Header names are matched case-insensitively (the help article writes them
// in lowercase, the sample in Title Case). Only Title is required here.
//
// A row maps to:
//   Title "/A/B/"               -> a folder or project: the tasks below it
//                                  belong to it, so it is the swimlane "A/B"
//                                  (folders group tasks across statuses, which
//                                  is what a swimlane does on a WeKan board)
//   Title / Description         -> the card's title / description
//   Key                         -> the card's source reference
//   Parent Task                 -> the parent card (a subtask), by Key; a
//                                  folder's Key puts the task in that folder
//   Status / Custom Status      -> the list: "Custom Status", the status of a
//                                  custom workflow, wins over Status, its
//                                  status group (Active, Completed, Deferred,
//                                  Cancelled). A group the status's name does
//                                  not imply is reported: a WeKan list has no
//                                  group, and the rule that keeps it comes from
//                                  importing the Wrike workflow in Rules
//                                  (models/lib/wrikeWorkflow.js)
//   Workflow                    -> the board's title, when every task names
//                                  the same one
//   Assigned To ("Name <email>",
//   comma-separated)            -> the owner, then further assignees, by name
//   Start Date / End Date       -> start and due dates (date cells, or
//                                  YYYY-MM-DD text)
//   Depends On ("13FS, 2SS")    -> is-blocked-by dependencies on those Keys
//   Priority, Duration          -> custom fields of those names
//   any other column            -> a custom field of that name (Effort,
//                                  Billing type, Budget and Wrike's own custom
//                                  fields among them)
// What has no WeKan place is reported: a start date constraint, a folder or
// project's own status, assignee and dates, a Default task or project
// workflow on a task row, the
// SS/FF/SF kind of a dependency (it is kept as is-blocked-by), dependencies
// on folders, bad dates and keys, and a task's repeated rows (Wrike's export
// writes a task once per folder it is tagged in, with the same Key).

import { wrikeGroupForName, wrikeWorkflowFromBoard } from './wrikeWorkflow.js';

export const WRIKE_COLUMNS = ['Key', 'Parent Task', 'Title', 'Status', 'Priority', 'Assigned To', 'Start Date',
  'Duration', 'End Date', 'Depends On', 'Start Date Constraint', 'Description'];
// The workflow columns Wrike's import needs for a custom status, in the order
// the help article lists them: Workflow left of Status, Custom Status right.
export const WRIKE_WORKFLOW_COLUMNS = ['Default task workflow', 'Default project workflow', 'Workflow', 'Status', 'Custom Status'];
// What WeKan's export writes: the documented columns with the workflow ones in
// place of Status.
export const WRIKE_EXPORT_COLUMNS = ['Key', 'Parent Task', 'Title', ...WRIKE_WORKFLOW_COLUMNS,
  ...WRIKE_COLUMNS.slice(WRIKE_COLUMNS.indexOf('Status') + 1)];
export const WRIKE_DATE_COLUMNS = ['Start Date', 'End Date', 'Start Date Constraint'];
export const WRIKE_STATUSES = ['Active', 'Completed', 'Deferred', 'Cancelled'];
export const WRIKE_PRIORITIES = ['High', 'Normal', 'Low'];
// Wrike's own export stops at 65,000 rows.
export const MAX_WRIKE_ROWS = 65000;
const MAX_KEY = 999999;

const ROLES = {
  key: 'key',
  'parent task': 'parent',
  title: 'title',
  status: 'status',
  'custom status': 'customStatus',
  priority: 'priority',
  'assigned to': 'people',
  'start date': 'start',
  duration: 'duration',
  'end date': 'end',
  'depends on': 'depends',
  'start date constraint': 'constraint',
  description: 'description',
  'default task workflow': 'defaultWorkflow',
  'default project workflow': 'defaultWorkflow',
  workflow: 'workflow',
};
const roleOf = title => ROLES[String(title || '').trim().toLowerCase()];

const pad = n => String(n).padStart(2, '0');
const cellText = value => {
  if (value === undefined || value === null) return '';
  // A date cell: its day, as ExcelJS reads it (UTC).
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  if (typeof value === 'object') {
    // ExcelJS rich text, hyperlink and formula cells.
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text || '').join('');
    if (value.text !== undefined) return cellText(value.text);
    if (value.result !== undefined) return cellText(value.result);
    return '';
  }
  return String(value).trim();
};

// A day as an ISO timestamp at 00:00 UTC: YYYY-MM-DD text (what a date cell
// becomes above), or an Excel serial day number in a cell without a date
// format. Anything else is undefined, and reported by the caller.
export function wrikeDate(text) {
  const value = String(text === undefined || text === null ? '' : text).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]00:00(?::00(?:\.000)?)?Z?)?$/.exec(value);
  if (iso) {
    const date = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    return date.getUTCDate() === +iso[3] && date.getUTCMonth() === +iso[2] - 1 ? date.toISOString() : undefined;
  }
  if (/^\d{1,7}$/.test(value) && +value > 0 && +value < 2958466) {
    return new Date(Math.round((+value - 25569) * 86400000)).toISOString();
  }
  return undefined;
}

// "Name Surname <name@company.com>, Other <o@x.com>" -> ['Name Surname', 'Other'].
// A person written only as an address is that address.
export function wrikePeople(text) {
  const people = [];
  const re = /([^,<>]*)(?:<([^<>]*)>)?\s*(?:,|$)/g;
  let match;
  const value = String(text || '');
  while ((match = re.exec(value)) && match[0] !== '') {
    const name = match[1].trim();
    const email = (match[2] || '').trim();
    if (name || email) people.push(name || email);
  }
  return people;
}

const DEPENDENCY = /^(\d+)\s*(FS|SS|FF|SF)?$/i;

// rows: the "Tasks" sheet as arrays of cells, top to bottom (rows[0] is row 1).
export function parseWrikeRows(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Wrike workbook is empty');
  if (rows.length > MAX_WRIKE_ROWS) throw new Error(`Wrike workbook has more than ${MAX_WRIKE_ROWS} rows`);
  const cells = rows.map(row => (Array.isArray(row) ? row.map(cellText) : []));
  const headerAt = cells.findIndex(row => row.some(cell => roleOf(cell) === 'title'));
  if (headerAt === -1) throw new Error('Wrike workbook has no header row with a "Title" column');
  const header = cells[headerAt];
  const unsupported = [];
  cells.slice(0, headerAt).forEach((row, index) => {
    if (row.some(Boolean)) unsupported.push({ path: `/row/${index + 1}`, reason: 'a row above the header row is not imported' });
  });
  const column = role => header.findIndex(title => roleOf(title) === role);
  const at = { };
  ['key', 'parent', 'title', 'status', 'customStatus', 'workflow', 'priority', 'people', 'start', 'duration', 'end',
    'depends', 'constraint', 'description'].forEach(role => { at[role] = column(role); });
  const get = (row, role) => (at[role] === -1 ? '' : row[at[role]] || '');
  const isFolder = title => /^\/.*\/$/.test(title);
  const folderName = title => title.split('/').map(part => part.trim()).filter(Boolean).join('/') || 'Default';

  // Folder keys first, so a Parent Task or Depends On can name a folder that
  // comes later in the sheet.
  const folders = new Map();
  cells.slice(headerAt + 1).forEach(row => {
    const title = get(row, 'title');
    if (isFolder(title) && get(row, 'key')) folders.set(get(row, 'key'), folderName(title));
  });

  const tasks = [];
  const workflows = new Set();
  const seen = new Set();
  let folder = 'Default';
  cells.slice(headerAt + 1).forEach((row, offset) => {
    const path = `/row/${headerAt + offset + 2}`;
    if (!row.some(Boolean)) return;
    const title = get(row, 'title');
    const key = get(row, 'key');
    if (isFolder(title)) {
      folder = folderName(title);
      const kept = ['status', 'people', 'start', 'duration', 'end', 'description'].filter(role => get(row, role));
      if (kept.length) unsupported.push({ path, reason: `a Wrike folder or project's own ${kept.map(role => header[at[role]]).join(', ')} is not imported` });
      return;
    }
    if (!title) { unsupported.push({ path, reason: 'a Wrike row without a Title is not imported' }); return; }
    if (key && seen.has(key)) {
      unsupported.push({ path, reason: `a repeated row of the task with Key ${key} (a task in several folders) is imported once` });
      return;
    }
    if (key) seen.add(key);
    if (!key) unsupported.push({ path, reason: 'a Wrike task without a Key cannot be a parent or a dependency' });
    else if (!/^\d+$/.test(key) || +key < 1 || +key > MAX_KEY) unsupported.push({ path: `${path}/Key`, reason: `Wrike Key "${key}" is not an integer between 1 and ${MAX_KEY}` });

    const task = {
      title,
      description: get(row, 'description'),
      ref: key || `wrike${path}`,
      swimlane_name: folder,
      column_name: get(row, 'customStatus') || get(row, 'status') || 'Active',
      tags: [],
    };
    const group = get(row, 'status');
    if (get(row, 'customStatus') && WRIKE_STATUSES.includes(group) && wrikeGroupForName(get(row, 'customStatus')) !== group) {
      unsupported.push({ path: `${path}/${header[at.status]}`, reason: `the ${group} status group of "${get(row, 'customStatus')}" is not kept by the list: import the Wrike workflow in Rules to add the rule that does what it does` });
    }
    if (get(row, 'workflow')) workflows.add(get(row, 'workflow'));
    const parent = get(row, 'parent');
    if (parent && folders.has(parent)) task.swimlane_name = folders.get(parent);
    else if (parent) task.parent_ref = parent;
    const people = wrikePeople(get(row, 'people'));
    if (people.length) task.owner_username = people[0];
    if (people.length > 1) task.assignees = people.slice(1);
    for (const [role, field] of [['start', 'date_started'], ['end', 'date_due']]) {
      const value = get(row, role);
      if (!value) continue;
      const date = wrikeDate(value);
      if (date) task[field] = date;
      else unsupported.push({ path: `${path}/${header[at[role]]}`, reason: `Wrike date "${value}" is not a date` });
    }
    const constraint = get(row, 'constraint');
    if (constraint) unsupported.push({ path: `${path}/${header[at.constraint]}`, reason: `a Wrike start date constraint (${constraint}) is not imported` });
    const dependencies = [];
    String(get(row, 'depends')).split(/[,;]/).map(part => part.trim()).filter(Boolean).forEach(part => {
      const match = DEPENDENCY.exec(part);
      if (!match) { unsupported.push({ path: `${path}/${header[at.depends]}`, reason: `Wrike dependency "${part}" is not <Key><FS|SS|FF|SF>` }); return; }
      if (folders.has(match[1])) { unsupported.push({ path: `${path}/${header[at.depends]}`, reason: `a dependency on the folder with Key ${match[1]} is not imported` }); return; }
      const kind = (match[2] || 'FS').toUpperCase();
      if (kind !== 'FS') unsupported.push({ path: `${path}/${header[at.depends]}`, reason: `the ${kind} kind of Wrike dependency "${part}" is kept as is-blocked-by` });
      dependencies.push({ ref: match[1], type: 'is-blocked-by' });
    });
    if (dependencies.length) task.dependencies = dependencies;
    const custom = {};
    if (get(row, 'priority')) custom.Priority = get(row, 'priority');
    if (get(row, 'duration')) custom.Duration = get(row, 'duration');
    header.forEach((name, index) => {
      const value = row[index];
      if (!name || !value) return;
      const role = roleOf(name);
      if (role === 'defaultWorkflow') unsupported.push({ path: `${path}/${name}`, reason: `the Wrike ${name} "${value}" of a task is not imported` });
      else if (!role) custom[name] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
    });
    if (Object.keys(custom).length) task.custom_fields = custom;
    tasks.push(task);
  });

  const columns = [...new Set(tasks.map(task => task.column_name))];
  const swimlanes = [...new Set(tasks.map(task => task.swimlane_name))];
  return {
    board: { name: workflows.size === 1 ? [...workflows][0] : 'Imported Wrike board' },
    columns: columns.map(title => ({ title })),
    swimlanes: (swimlanes.length ? swimlanes : ['Default']).map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

const day = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};
const PRIORITY_ALIASES = { urgent: 'High', highest: 'High', high: 'High', medium: 'Normal', normal: 'Normal', low: 'Low', lowest: 'Low' };

// The import template on a "Tasks" sheet, as Wrike's Excel import reads it:
// a folder row "/<swimlane>/" above the cards of each swimlane but Default,
// sequential Keys, Parent Task by Key, dates as YYYY-MM-DD (written as date
// cells by server/lib/wrikeWorkbook.js), and the custom fields to the right of
// Description. A card's list is its custom status in the workflow named after
// the board - the one the "Wrike workflow" export describes, which has to
// exist in Wrike for its import to use it - and each folder row makes that
// workflow its tasks' default.
export function formatWrikeRows({ board, items, lists, workflowRules }) {
  const list = Array.isArray(items) ? items : [];
  const boardLists = Array.isArray(lists) && lists.length ? lists
    : [...new Set(list.map(item => item.listTitle).filter(Boolean))].map(title => ({ title }));
  const { workflow, statusOf } = wrikeWorkflowFromBoard({ boardTitle: board && board.title, lists: boardLists, rules: workflowRules });
  const workflowName = workflow.data[0].name;
  const extra = [];
  for (const item of list) {
    for (const name of Object.keys(item.customFields || {})) {
      if (!extra.includes(name) && !roleOf(name) && !['priority', 'duration'].includes(name.toLowerCase())) extra.push(name);
    }
  }
  const header = [...WRIKE_EXPORT_COLUMNS, ...extra];
  const rows = [header];
  const lanes = [];
  for (const item of list) {
    const lane = item.swimlaneTitle && item.swimlaneTitle !== 'Default' ? item.swimlaneTitle : 'Default';
    if (!lanes.includes(lane)) lanes.push(lane);
  }
  // Default first: its cards need no folder row.
  lanes.sort((a, b) => (a === 'Default' ? -1 : b === 'Default' ? 1 : 0));
  const keyOf = new Map();
  let next = 1;
  const order = [];
  for (const lane of lanes) {
    if (lane !== 'Default') order.push({ folder: lane, key: next++ });
    for (const item of list) {
      const itemLane = item.swimlaneTitle && item.swimlaneTitle !== 'Default' ? item.swimlaneTitle : 'Default';
      if (itemLane !== lane) continue;
      keyOf.set(item.cardId, next);
      order.push({ item, key: next++ });
    }
  }
  for (const { folder, item, key } of order) {
    if (folder) {
      const path = folder.split('/').map(part => part.trim()).filter(Boolean).join('/');
      rows.push(header.map(name => (name === 'Key' ? key : name === 'Title' ? `/${path || 'Folder'}/` : name === 'Default task workflow' ? workflowName : '')));
      continue;
    }
    const fields = item.customFields || {};
    const fieldOf = wanted => Object.keys(fields).find(name => name.toLowerCase() === wanted);
    const priority = fieldOf('priority') ? PRIORITY_ALIASES[String(fields[fieldOf('priority')]).trim().toLowerCase()] || '' : '';
    const values = {
      Key: key,
      'Parent Task': item.parentCardId && keyOf.has(item.parentCardId) ? keyOf.get(item.parentCardId) : '',
      Title: String(item.title || '').trim() || 'Untitled',
      Workflow: workflowName,
      Status: statusOf(item.listTitle).group,
      'Custom Status': statusOf(item.listTitle).name,
      Priority: priority,
      'Assigned To': [item.owner, ...(Array.isArray(item.assignees) ? item.assignees : [])].filter(Boolean).join(', '),
      'Start Date': day(item.startAt),
      Duration: fieldOf('duration') ? String(fields[fieldOf('duration')]) : '',
      'End Date': day(item.dueAt),
      'Depends On': '',
      'Start Date Constraint': '',
      Description: item.description || '',
    };
    rows.push(header.map(name => (name in values ? values[name] : fields[name] === undefined ? '' : fields[name])));
  }
  return { sheet: 'Tasks', rows };
}
