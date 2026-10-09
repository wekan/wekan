// Microsoft Planner's "Export plan to Excel" workbook, read and written as rows
// of cells. The workbook itself is opened and written on the server
// (server/lib/plannerWorkbook.js); this module is plain JavaScript so
// tests/plannerFormat.test.cjs runs the round trip in Node.
//
// The export (Planner: the plan's ... menu > Export as Excel; classic
// Planner: Export plan to Excel) is one sheet,
// "Tasks", laid out as Planner writes it:
//
//   Plan name       | Release plan
//   Plan ID         | 11aa22bb33cc
//   Date of export  | 10/06/2020
//   (blank row)
//   Task ID | Task Name | Bucket Name | Progress | Priority | Assigned To |
//   Created By | Created Date | Start Date | Due Date | Late |
//   Completed Date | Completed By | Description |
//   Completed Checklist Items | Checklist Items | Labels
//   <one row per task>
//
// Columns are found by their header, not their position: newer exports add
// "Is Recurring" after "Due Date", and the order has changed before. These
// names follow a real export: the test data of the plannr package, copied to
// tests/fixtures/planner/ (its README says where it comes from).
//
// A row maps to:
//   Bucket Name                 -> a list, in the order buckets first appear
//   Task Name / Description     -> the card's title / description
//   Task ID                     -> the card's source reference
//   Assigned To ("A;B")         -> the owner, then further assignees
//   Created By                  -> Requested by
//   Created / Start / Due /
//   Completed Date              -> created, start, due and end dates
//   Progress, Priority,
//   Completed By                -> custom fields of those names, so they
//                                  survive and export back
//   Checklist Items ("a;b;c")   -> a checklist
//   Labels ("a;b")              -> labels
// What has no WeKan place is reported: which checklist items were done
// (Planner exports only a count, "2/3"), a recurring task's repeat, and an
// unknown progress or priority value. "Late" is derived from the due date and
// is not stored.

export const PLANNER_COLUMNS = ['Task ID', 'Task Name', 'Bucket Name', 'Progress', 'Priority', 'Assigned To',
  'Created By', 'Created Date', 'Start Date', 'Due Date', 'Late', 'Completed Date', 'Completed By',
  'Description', 'Completed Checklist Items', 'Checklist Items', 'Labels'];
export const PLANNER_PROGRESS = ['Not started', 'In progress', 'Completed'];
export const PLANNER_PRIORITY = ['Urgent', 'Important', 'Medium', 'Low'];
export const MAX_PLANNER_ROWS = 20000;
const NO_BUCKET = 'No bucket';
const SEPARATOR = ';';

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
const splitList = text => String(text || '').split(SEPARATOR).map(part => part.trim()).filter(Boolean);

// Planner writes dates as text in the exporting user's locale: 10/02/2020 in
// the US, 02/10/2020 or 02.10.2020 elsewhere. Which number is the month is
// decided once for the whole file: a first number above 12 anywhere means
// day/month, a second number above 12 means month/day; a file where every date
// could be either is read as month/day, Planner's default, and reported.
const NUMERIC_DATE = /^(\d{1,2})([/.-])(\d{1,2})\2(\d{4})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;

export function plannerDateOrder(texts) {
  let dayFirst = false;
  let monthFirst = false;
  let ambiguous = false;
  for (const text of texts) {
    const match = NUMERIC_DATE.exec(String(text || '').trim());
    if (!match) continue;
    const first = +match[1];
    const second = +match[3];
    if (match[2] === '.') dayFirst = true;
    else if (first > 12) dayFirst = true;
    else if (second > 12) monthFirst = true;
    else if (first !== second) ambiguous = true;
  }
  if (dayFirst && monthFirst) return { order: 'mdy', conflict: true };
  if (dayFirst) return { order: 'dmy' };
  return { order: 'mdy', guessed: ambiguous && !monthFirst };
}

export function plannerDate(text, order = 'mdy') {
  const value = String(text || '').trim();
  if (!value) return undefined;
  if (ISO_DATE.test(value)) {
    const date = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  const match = NUMERIC_DATE.exec(value);
  if (!match) return undefined;
  const month = order === 'dmy' ? +match[3] : +match[1];
  const day = order === 'dmy' ? +match[1] : +match[3];
  const date = new Date(Date.UTC(+match[4], month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.toISOString() : undefined;
}

// rows: arrays of cells (strings, numbers, Dates or ExcelJS cell objects), top
// to bottom, empty rows included or left out.
export function parsePlannerRows(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Planner workbook is empty');
  if (rows.length > MAX_PLANNER_ROWS) throw new Error(`Planner workbook has more than ${MAX_PLANNER_ROWS} rows`);
  const texts = rows.map(row => (Array.isArray(row) ? row.map(cellText) : []));
  const headerAt = texts.findIndex(row => row.includes('Task Name') && row.includes('Bucket Name'));
  if (headerAt === -1) throw new Error('Planner workbook needs the Task Name and Bucket Name columns');
  const header = texts[headerAt];
  const meta = {};
  texts.slice(0, headerAt).forEach(row => { if (row[0]) meta[row[0]] = row[1] || ''; });
  const col = name => header.indexOf(name);
  const get = (row, name) => (col(name) === -1 ? '' : row[col(name)] || '');

  const body = texts.slice(headerAt + 1).map((row, index) => ({ row, number: headerAt + index + 2 }))
    .filter(({ row }) => row.some(Boolean));
  const dateColumns = ['Created Date', 'Start Date', 'Due Date', 'Completed Date'];
  const order = plannerDateOrder(body.flatMap(({ row }) => dateColumns.map(name => get(row, name))));
  const unsupported = [];
  if (order.conflict) {
    unsupported.push({ path: '/dates', reason: 'Planner dates mix day/month and month/day order; read as month/day' });
  } else if (order.guessed) {
    unsupported.push({ path: '/dates', reason: 'Planner dates could be day/month or month/day; read as month/day, Planner\'s default' });
  }

  const columns = [];
  const tasks = [];
  for (const { row, number } of body) {
    const at = `/row/${number}`;
    const title = get(row, 'Task Name');
    if (!title) { unsupported.push({ path: at, reason: 'a Planner row without a task name is not imported' }); continue; }
    const bucket = get(row, 'Bucket Name') || NO_BUCKET;
    if (!columns.includes(bucket)) columns.push(bucket);
    const people = splitList(get(row, 'Assigned To'));
    const date = name => {
      const text = get(row, name);
      const value = plannerDate(text, order.order);
      if (text && !value) unsupported.push({ path: `${at}/${name}`, reason: `Planner date "${text}" is not a calendar date` });
      return value;
    };
    const customFields = {};
    const progress = get(row, 'Progress');
    if (progress) {
      if (PLANNER_PROGRESS.includes(progress)) customFields.Progress = progress;
      else unsupported.push({ path: `${at}/Progress`, reason: `Planner progress "${progress}" is not one of ${PLANNER_PROGRESS.join(', ')}` });
    }
    const priority = get(row, 'Priority');
    if (priority) {
      if (PLANNER_PRIORITY.includes(priority)) customFields.Priority = priority;
      else unsupported.push({ path: `${at}/Priority`, reason: `Planner priority "${priority}" is not one of ${PLANNER_PRIORITY.join(', ')}` });
    }
    if (get(row, 'Completed By')) customFields['Completed By'] = get(row, 'Completed By');
    const items = splitList(get(row, 'Checklist Items'));
    const doneCount = /^(\d+)\s*\/\s*\d+$/.exec(get(row, 'Completed Checklist Items'));
    if (items.length && doneCount && +doneCount[1] > 0) {
      unsupported.push({ path: `${at}/Completed Checklist Items`,
        reason: `Planner exports how many checklist items are done (${get(row, 'Completed Checklist Items')}), not which; all are imported as not done` });
    }
    if (/^(true|yes)$/i.test(get(row, 'Is Recurring'))) {
      unsupported.push({ path: `${at}/Is Recurring`, reason: 'a recurring Planner task is imported once; its repeat has no place in the export' });
    }
    const due = date('Due Date');
    const task = {
      title,
      description: get(row, 'Description'),
      column_name: bucket,
      swimlane_name: 'Default',
      tags: splitList(get(row, 'Labels')),
      ...(get(row, 'Task ID') ? { ref: get(row, 'Task ID') } : {}),
      ...(people.length ? { owner_username: people[0] } : {}),
      ...(people.length > 1 ? { assignees: people.slice(1) } : {}),
      ...(get(row, 'Created By') ? { requested_by: get(row, 'Created By') } : {}),
      ...(due ? { date_due: due } : {}),
      ...(date('Start Date') ? { date_started: date('Start Date') } : {}),
      ...(date('Created Date') ? { date_creation: date('Created Date') } : {}),
      ...(date('Completed Date') ? { date_end: date('Completed Date') } : {}),
      ...(Object.keys(customFields).length ? { custom_fields: customFields } : {}),
      ...(items.length ? { checklists: [{ title: 'Checklist', items: items.map(item => ({ title: item, done: false })) }] } : {}),
    };
    tasks.push(task);
  }
  return {
    board: { name: meta['Plan name'] || 'Imported Microsoft Planner' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// MM/DD/YYYY, the format Planner itself writes by default.
export function plannerDateText(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const two = n => String(n).padStart(2, '0');
  return `${two(date.getUTCMonth() + 1)}/${two(date.getUTCDate())}/${date.getUTCFullYear()}`;
}

// The rows of a Planner workbook for a collected board
// (models/lib/externalExporters.js); server/lib/plannerWorkbook.js writes them.
export function formatPlannerRows({ board, items }, now = new Date()) {
  const rows = [
    ['Plan name', (board && board.title) || 'WeKan board'],
    ['Plan ID', (board && board._id) || ''],
    ['Date of export', plannerDateText(now)],
    [],
    PLANNER_COLUMNS,
  ];
  for (const item of items || []) {
    const fields = item.customFields || {};
    const completed = fields.Progress === 'Completed' || (!PLANNER_PROGRESS.includes(fields.Progress) && Boolean(item.endAt));
    const progress = PLANNER_PROGRESS.includes(fields.Progress) ? fields.Progress : completed ? 'Completed' : 'Not started';
    const checklist = (Array.isArray(item.checklists) ? item.checklists : [])
      .flatMap(list => (Array.isArray(list.items) ? list.items : []));
    const people = [item.owner, ...(Array.isArray(item.assignees) ? item.assignees : [])].filter(Boolean);
    const due = item.dueAt ? new Date(item.dueAt) : null;
    const values = {
      'Task ID': item.cardId || '',
      'Task Name': String(item.title || '').trim() || 'Untitled',
      'Bucket Name': item.listTitle || NO_BUCKET,
      Progress: progress,
      Priority: PLANNER_PRIORITY.includes(fields.Priority) ? fields.Priority : 'Medium',
      'Assigned To': people.join(SEPARATOR),
      'Created By': item.creator || item.requestedBy || '',
      'Created Date': plannerDateText(item.createdAt),
      'Start Date': plannerDateText(item.startAt),
      'Due Date': plannerDateText(item.dueAt),
      Late: due && !completed && due.getTime() < now.getTime() ? 'true' : 'false',
      'Completed Date': completed ? plannerDateText(item.endAt) : '',
      'Completed By': completed ? String(fields['Completed By'] || '') : '',
      Description: item.description || '',
      'Completed Checklist Items': checklist.length ? `${checklist.filter(entry => entry.done).length}/${checklist.length}` : '',
      'Checklist Items': checklist.map(entry => String(entry.title || '').replace(/;/g, ',').trim()).filter(Boolean).join(SEPARATOR),
      Labels: (Array.isArray(item.labels) ? item.labels : []).map(name => String(name).replace(/;/g, ',')).join(SEPARATOR),
    };
    rows.push(PLANNER_COLUMNS.map(name => values[name]));
  }
  return { sheet: 'Tasks', rows };
}
