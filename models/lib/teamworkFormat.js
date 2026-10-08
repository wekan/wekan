// Teamwork.com's Excel task import template, as rows of cells. The workbook is
// opened and written on the server (server/lib/teamworkWorkbook.js); this
// module is plain JavaScript so tests/teamworkFormat.test.cjs runs in Node.
//
// Teamwork imports tasks into a project from Excel (project > List or Table
// view > ... > Import Tasks). Its help article on the Excel import names the
// template's ten columns, in this order, and what each one takes:
//
//   Tasklist | Task | Description | Assign to | Start date | Due date |
//   Priority | Estimated time | Tags | Status
//
//   Assign to       e-mail addresses of users on the site, comma-separated
//   Start / Due     dates in the site's localization format
//   Priority        low, medium or high
//   Estimated time  25, 01:30, 1h 15m, 1h or 2 hours
//   Tags            comma-separated; unknown tags are created
//   Status          Active or Complete
//   Task            "-", "#" or ">" before the name makes the task a subtask
//                   of the task above it; "--", "##" or ">>" a sub-subtask
//
// Teamwork documents no export in this layout (its task list reports have
// no published columns), so this template is what is read and written.
// Confirmed by that article: the column names and order, the value forms
// above and the subtask prefixes. Inferred here: the header row is found by
// name (the article does not say it must be row 1); a bare number of
// estimated time is minutes, as Teamwork's estimate is kept in minutes;
// a top-level task with an empty Tasklist cell stays in the task list of the
// row above it; a subtask is in its parent's task list.
//
// A row maps to:
//   Tasklist              -> a list, in the order task lists first appear
//   Task                  -> the card's title; its prefix depth -> a subtask
//                            card of the nearest shallower task above it
//                            (ref / parent_ref)
//   Description           -> the description
//   Assign to             -> the owner, then further assignees
//   Start date / Due date -> start and due dates
//   Priority              -> custom field Priority (Low, Medium, High)
//   Estimated time        -> custom field Estimated time (hours)
//   Tags                  -> labels
//   Status Complete       -> checkbox custom field Complete, and the due date
//                            marked done
// What has no place is reported: unknown priorities and statuses, estimates
// and dates that cannot be read, a subtask without a task above it, a subtask
// that skips a level, a subtask whose own Tasklist differs from its parent's,
// and rows without a task name.
import { plannerDate, plannerDateOrder } from './plannerFormat.js';

export const TEAMWORK_COLUMNS = ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date',
  'Priority', 'Estimated time', 'Tags', 'Status'];
export const TEAMWORK_PRIORITY = ['low', 'medium', 'high'];
export const TEAMWORK_STATUS = ['Active', 'Complete'];
export const ESTIMATE_FIELD = 'Estimated time (hours)';
export const MAX_TEAMWORK_ROWS = 20000;
const DEFAULT_LIST = 'Tasks';
const PREFIX = /^[-#>]+/;

const key = text => String(text || '').toLowerCase().replace(/\s+/g, '');
const COLUMN_KEYS = TEAMWORK_COLUMNS.map(key);

const isDate = value => value instanceof Date && !Number.isNaN(value.getTime());
const cellText = value => {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  if (typeof value === 'object') {
    // ExcelJS rich text, hyperlink and formula cells.
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text || '').join('');
    if (value.text !== undefined) return cellText(value.text);
    if (value.result !== undefined) return cellText(value.result);
    return '';
  }
  return String(value).trim();
};
const splitComma = text => String(text || '').split(',').map(part => part.trim()).filter(Boolean);
const capital = text => text.charAt(0).toUpperCase() + text.slice(1);

// Minutes from one of the documented forms ("25", "01:30", "1h 15m", "1h",
// "2 hours"), or undefined. Excel may have turned "01:30" into a time of day
// (a Date on 1899-12-30) or a fraction of a day.
export function teamworkEstimateMinutes(value) {
  if (isDate(value)) {
    if (value.getUTCFullYear() > 1900) return undefined;
    return value.getUTCHours() * 60 + value.getUTCMinutes();
  }
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? Math.round(value) : undefined;
  const text = cellText(value).toLowerCase();
  if (!text) return undefined;
  if (/^\d+(\.\d+)?$/.test(text)) return Math.round(Number(text));
  const clock = /^(\d{1,3}):([0-5]\d)$/.exec(text);
  if (clock) return +clock[1] * 60 + +clock[2];
  const words = /^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+)\s*m(?:in(?:ute)?s?)?)?$/.exec(text);
  if (words && (words[1] !== undefined || words[2] !== undefined)) {
    return Math.round(Number(words[1] || 0) * 60 + Number(words[2] || 0));
  }
  return undefined;
}

// "01:30" for 90 minutes: the documented hours:minutes form.
export function teamworkEstimateText(minutes) {
  const total = Math.round(Number(minutes));
  if (!Number.isFinite(total) || total <= 0) return '';
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// sheet: { name, rows } with rows as arrays of cells (strings, numbers, Dates
// or ExcelJS cell objects), top to bottom, at their sheet positions.
export function parseTeamworkSheet(sheet) {
  const rows = sheet && Array.isArray(sheet.rows) ? sheet.rows : Array.isArray(sheet) ? sheet : [];
  if (!rows.length) throw new Error('Teamwork.com workbook is empty');
  if (rows.length > MAX_TEAMWORK_ROWS) throw new Error(`Teamwork.com workbook has more than ${MAX_TEAMWORK_ROWS} rows`);
  const raw = rows.map(row => (Array.isArray(row) ? row : []));
  const headerAt = raw.findIndex(row => {
    const keys = row.map(cell => key(cellText(cell)));
    return keys.includes('tasklist') && keys.includes('task');
  });
  if (headerAt === -1) throw new Error('Teamwork.com workbook needs the Tasklist and Task columns of its import template');
  const header = raw[headerAt].map(cell => key(cellText(cell)));
  const at = name => header.indexOf(key(name));
  const cell = (row, name) => (at(name) === -1 ? undefined : row[at(name)]);
  const text = (row, name) => cellText(cell(row, name));

  const unsupported = [];
  const extra = header.filter(name => name && !COLUMN_KEYS.includes(name));
  if (extra.length) {
    unsupported.push({ path: `/row/${headerAt + 1}`, reason: `columns that are not in Teamwork.com's import template are not imported: ${raw[headerAt].map(cellText).filter(title => extra.includes(key(title))).join(', ')}` });
  }
  const body = raw.slice(headerAt + 1).map((row, index) => ({ row, number: headerAt + index + 2 }))
    .filter(({ row }) => row.some(value => cellText(value)));
  const order = plannerDateOrder(body.flatMap(({ row }) => ['Start date', 'Due date']
    .map(name => (isDate(cell(row, name)) ? '' : text(row, name)))));
  if (order.conflict) {
    unsupported.push({ path: '/dates', reason: 'Teamwork.com dates mix day/month and month/day order; read as month/day' });
  } else if (order.guessed) {
    unsupported.push({ path: '/dates', reason: 'Teamwork.com dates could be day/month or month/day; read as month/day' });
  }

  const columns = [];
  const tasks = [];
  const stack = []; // the open task at each depth, stack[0] top-level
  let list = '';
  for (const { row, number } of body) {
    const path = `/row/${number}`;
    const name = text(row, 'Task');
    const prefix = (PREFIX.exec(name) || [''])[0];
    const title = name.slice(prefix.length).trim();
    if (!title) { unsupported.push({ path, reason: 'a Teamwork.com row without a task name is not imported' }); continue; }
    let depth = prefix.length;
    if (depth > stack.length) {
      unsupported.push({ path: `${path}/Task`, reason: stack.length
        ? `a subtask ${depth} levels deep under a task ${stack.length - 1} levels deep is imported one level below it`
        : 'a subtask without a task above it is imported as a task' });
      depth = stack.length;
    }
    stack.length = depth;
    const parent = depth ? stack[depth - 1] : null;
    const ownList = text(row, 'Tasklist');
    let column;
    if (parent) {
      column = parent.column_name;
      if (ownList && ownList !== column) {
        unsupported.push({ path: `${path}/Tasklist`, reason: `a subtask stays in its parent's task list "${column}", not "${ownList}"` });
      }
    } else {
      list = ownList || list || DEFAULT_LIST;
      column = list;
    }
    if (!columns.includes(column)) columns.push(column);

    const date = columnName => {
      const value = cell(row, columnName);
      if (isDate(value)) {
        return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())).toISOString();
      }
      const valueText = cellText(value);
      const parsed = plannerDate(valueText, order.order);
      if (valueText && !parsed) unsupported.push({ path: `${path}/${columnName}`, reason: `Teamwork.com date "${valueText}" is not a calendar date` });
      return parsed;
    };
    const customFields = {};
    const priority = text(row, 'Priority');
    if (priority) {
      if (TEAMWORK_PRIORITY.includes(priority.toLowerCase())) customFields.Priority = capital(priority.toLowerCase());
      else unsupported.push({ path: `${path}/Priority`, reason: `Teamwork.com priority "${priority}" is not low, medium or high` });
    }
    const estimate = cell(row, 'Estimated time');
    if (cellText(estimate)) {
      const minutes = teamworkEstimateMinutes(estimate);
      if (minutes === undefined) unsupported.push({ path: `${path}/Estimated time`, reason: `Teamwork.com estimated time "${cellText(estimate)}" is not 25, 01:30, 1h 15m, 1h or 2 hours` });
      else if (minutes > 0) customFields[ESTIMATE_FIELD] = Math.round((minutes / 60) * 100) / 100;
    }
    const status = text(row, 'Status');
    const complete = /^complete$/i.test(status);
    if (status && !complete && !/^active$/i.test(status)) {
      unsupported.push({ path: `${path}/Status`, reason: `Teamwork.com status "${status}" is not Active or Complete` });
    }
    if (complete) customFields.Complete = true;
    const people = splitComma(text(row, 'Assign to'));
    const due = date('Due date');
    const started = date('Start date');
    const task = {
      title,
      description: text(row, 'Description'),
      column_name: column,
      swimlane_name: 'Default',
      tags: splitComma(text(row, 'Tags')),
      ref: `teamwork${path}`,
      ...(parent ? { parent_ref: parent.ref } : {}),
      ...(people.length ? { owner_username: people[0] } : {}),
      ...(people.length > 1 ? { assignees: people.slice(1) } : {}),
      ...(started ? { date_started: started } : {}),
      ...(due ? { date_due: due } : {}),
      ...(complete && due ? { due_complete: true } : {}),
      ...(Object.keys(customFields).length ? { custom_fields: customFields } : {}),
    };
    tasks.push(task);
    stack.push(task);
  }
  const sheetName = String((sheet && sheet.name) || '').trim();
  return {
    board: { name: sheetName && !/^sheet\s*\d*$/i.test(sheetName) ? sheetName : 'Imported Teamwork.com tasks' },
    columns: (columns.length ? columns : [DEFAULT_LIST]).map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

const day = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '' : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

// The template's rows for a collected board (models/lib/externalExporters.js);
// server/lib/teamworkWorkbook.js writes them. Dates are date cells, which
// Excel shows in the reader's own format. A subtask follows its parent with
// one "-" per level, when both are in the same list (a Teamwork subtask is in
// its parent's task list); a title's own leading -, # or > would read as a
// subtask prefix, and the template has no escape for it, so it is dropped.
// The template has ten fixed columns: swimlanes, other custom fields,
// checklists, comments and attachments have no place in it.
export function formatTeamworkSheet({ board, items }) {
  const all = Array.isArray(items) ? items : [];
  const byId = new Map(all.map(item => [item.cardId, item]));
  const parentOf = item => {
    const parent = item.parentCardId && byId.get(item.parentCardId);
    return parent && parent !== item && parent.listTitle === item.listTitle ? parent : null;
  };
  const children = new Map();
  const roots = [];
  for (const item of all) {
    const parent = parentOf(item);
    if (parent) {
      if (!children.has(parent.cardId)) children.set(parent.cardId, []);
      children.get(parent.cardId).push(item);
    } else roots.push(item);
  }
  const rows = [TEAMWORK_COLUMNS];
  const seen = new Set();
  const write = (item, depth) => {
    if (seen.has(item)) return;
    seen.add(item);
    const fields = item.customFields || {};
    const people = [item.owner, ...(Array.isArray(item.assignees) ? item.assignees : [])].filter(Boolean);
    const priority = String(fields.Priority || '').toLowerCase();
    const complete = fields.Complete === true || item.dueComplete === true || Boolean(item.endAt);
    const title = String(item.title || '').replace(/^[-#>\s]+/, '').trim() || 'Untitled';
    const values = {
      Tasklist: item.listTitle || DEFAULT_LIST,
      Task: `${'-'.repeat(depth)}${title}`,
      Description: item.description || '',
      'Assign to': people.join(', '),
      'Start date': day(item.startAt),
      'Due date': day(item.dueAt),
      Priority: TEAMWORK_PRIORITY.includes(priority) ? priority : '',
      'Estimated time': teamworkEstimateText(Number(fields[ESTIMATE_FIELD]) * 60),
      Tags: (Array.isArray(item.labels) ? item.labels : []).map(tag => String(tag).replace(/,/g, ' ').trim()).filter(Boolean).join(', '),
      Status: complete ? 'Complete' : 'Active',
    };
    rows.push(TEAMWORK_COLUMNS.map(name => values[name]));
    for (const child of children.get(item.cardId) || []) write(child, depth + 1);
  };
  roots.forEach(item => write(item, 0));
  // A parent loop leaves cards no root reaches: they are written as tasks.
  all.forEach(item => write(item, 0));
  return { name: String((board && board.title) || 'Tasks'), rows };
}
