// Quire project CSV, read and written in plain JavaScript so
// tests/quireCsv.test.cjs runs the round trip in Node. Columns are matched by
// header name, in any order; Quire's Import CSV guide names the ones it reads
// (first letter capitalized):
//
//   Name, Assignee, Tag, Start, Due, Priority, Status, Description, Parent, ID
//
// Quire's own export (the project menu's Export CSV, or the API's
// export-csv) writes more:
//
//   "ID","ID","ID",Name,Status,Started,Completed,Priority,Start,Due,Duration,
//   Estimate,Time log,Variation,Assignee,Tag,Successors,Created,Created by,
//   Description
//
// A header Quire has several values for is repeated, one column per value,
// unless the export was made with merge, which joins them into one cell with
// ", ". The hierarchy is written three ways, and all three are read:
//   - a Parent column naming the parent task's ID (the import shape);
//   - repeated ID columns, the task's ID in the column of its depth (the
//     sample file Quire's guide links), so the parent is the nearest task
//     above it one column to the left;
//   - one ID cell with the path from the root, "#6, #8" (the API's example).
// Dates are written "Jun 2, 2026"; ISO 8601 days and times are read too.
// Priority is Low, Medium, High or Urgent (the API's -1, 0, 1, 2; Medium is
// Quire's default). Status is the name of one of the project's statuses.
// A text that a spreadsheet could take for a formula is written after a ',
// which is removed on import.
//
// A row maps to:
//   Status                 -> a list, in the order statuses first appear
//   Name / Description     -> title / description
//   ID / Parent            -> the card's reference / its parent card
//   Assignee (repeated)    -> owner, then further assignees
//   Tag (repeated)         -> labels
//   Start (or Started),
//   Due, Completed, Created -> start, due, end and created dates
//   Created by             -> Requested by
//   Priority               -> the "Priority" custom field (Medium is left out)
// Reported: Duration, Estimate, Time log, Variation, Successors, a Started
// date beside a Start date, any other column, unknown priorities and dates
// that cannot be read.

import { readCsv } from './todoistCsvFormat.js';

export const QUIRE_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const PRIORITY_NUMBERS = { '-1': 'Low', 0: 'Medium', 1: 'High', 2: 'Urgent' };
const DEFAULT_PRIORITY = 'Medium';
const DEFAULT_STATUS = 'To-Do';
const READ = new Set(['id', 'name', 'parent', 'assignee', 'tag', 'start', 'started', 'due', 'completed', 'priority',
  'status', 'description', 'created', 'created by']);
const FORMULA = /^'(?=[+\-=@])/;
const NEEDS_QUOTE = /^[+\-=@]/;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const unformula = text => String(text || '').replace(FORMULA, '');

const utcDay = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date.toISOString() : undefined;
};

// "Jun 2, 2026" (what Quire writes), "2 Jun 2026", "2026-06-02" or an ISO
// 8601 time, as ISO; a day alone is that calendar day at UTC midnight.
// Anything else - a day/month order Quire might use in another locale - is
// undefined, so it is reported rather than guessed.
export function quireDate(value) {
  const text = String(value || '').trim();
  if (!text) return undefined;
  let match = /^([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})$/.exec(text);
  if (match) {
    const month = MONTHS.indexOf(match[1].toLowerCase()) + 1;
    return month ? utcDay(+match[3], month, +match[2]) : undefined;
  }
  match = /^(\d{1,2}) ([A-Za-z]{3})[a-z]*\.?,? (\d{4})$/.exec(text);
  if (match) {
    const month = MONTHS.indexOf(match[2].toLowerCase()) + 1;
    return month ? utcDay(+match[3], month, +match[1]) : undefined;
  }
  match = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(text);
  if (match) return utcDay(+match[1], +match[2], +match[3]);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// "#6", "6" -> "#6"; any other ID is kept as written.
const taskId = value => {
  const text = unformula(value).trim();
  return /^#?\d+$/.test(text) ? `#${text.replace(/^#/, '')}` : text;
};
const split = value => unformula(value).split(',').map(part => part.trim()).filter(Boolean);

export function parseQuireCsv(text) {
  const rows = readCsv(text, 'Quire');
  if (!rows.length) throw new Error('Quire CSV is empty');
  const header = rows[0].map(cell => cell.trim());
  const lower = header.map(name => name.toLowerCase());
  if (!lower.includes('name')) throw new Error('Quire CSV needs the Name column');
  const at = name => lower.reduce((found, cell, index) => (cell === name ? found.concat(index) : found), []);
  const all = (cells, name) => at(name).map(index => String(cells[index] || '').trim());
  const get = (cells, name) => unformula(all(cells, name).find(Boolean) || '');
  const unsupported = [...new Set(header.filter((name, index) => name && !READ.has(lower[index])))]
    .map(name => ({ path: `/columns/${name}`, reason: `Quire column "${name}" has no WeKan place and is not imported` }));
  const idColumns = at('id');
  const columns = [];
  const tasks = [];
  const lastAtDepth = [];
  rows.slice(1).forEach((cells, index) => {
    const where = `/row/${index + 2}`;
    const title = get(cells, 'name');
    if (!title) { unsupported.push({ path: where, reason: 'a Quire row without a name is not imported' }); return; }
    // The hierarchy: an explicit Parent wins; otherwise the ID path, or the
    // depth of the ID column the ID was written in.
    const idCells = idColumns.map(column => String(cells[column] || '').trim());
    const filled = idCells.map((cell, depth) => ({ cell, depth })).filter(entry => entry.cell);
    const path = filled.flatMap(entry => split(entry.cell)).map(taskId);
    const ref = path.length ? path[path.length - 1] : '';
    let parent = taskId(get(cells, 'parent'));
    if (!parent && path.length > 1) parent = path[path.length - 2];
    if (!parent && filled.length === 1 && filled[0].depth > 0) parent = lastAtDepth[filled[0].depth - 1] || '';
    if (filled.length === 1) {
      lastAtDepth[filled[0].depth] = ref;
      lastAtDepth.length = filled[0].depth + 1;
    }
    const status = get(cells, 'status') || DEFAULT_STATUS;
    if (!columns.includes(status)) columns.push(status);
    const date = name => {
      const value = get(cells, name.toLowerCase());
      const iso = quireDate(value);
      if (value && !iso) unsupported.push({ path: `${where}/${name}`, reason: `Quire date "${value}" could not be read` });
      return iso;
    };
    const custom = {};
    const priority = get(cells, 'priority');
    const named = QUIRE_PRIORITIES.find(p => p.toLowerCase() === priority.toLowerCase()) || PRIORITY_NUMBERS[priority];
    if (named && named !== DEFAULT_PRIORITY) custom.Priority = named;
    else if (priority && !named) {
      unsupported.push({ path: `${where}/Priority`, reason: `Quire priority "${priority}" is not one of ${QUIRE_PRIORITIES.join(', ')}` });
    }
    const start = date('Start');
    const started = date('Started');
    if (start && started) unsupported.push({ path: `${where}/Started`, reason: 'Quire\'s Started date is not kept beside its Start date' });
    const people = [...new Set(all(cells, 'assignee').flatMap(split))];
    const created = date('Created');
    const due = date('Due');
    const completed = date('Completed');
    tasks.push({
      title,
      description: get(cells, 'description'),
      column_name: status,
      swimlane_name: 'Default',
      tags: [...new Set(all(cells, 'tag').flatMap(split))],
      ...(ref ? { ref } : {}),
      ...(parent && parent !== ref ? { parent_ref: parent } : {}),
      ...(people.length ? { owner_username: people[0] } : {}),
      ...(people.length > 1 ? { assignees: people.slice(1) } : {}),
      ...(get(cells, 'created by') ? { requested_by: get(cells, 'created by') } : {}),
      ...(created ? { date_creation: created } : {}),
      ...(start || started ? { date_started: start || started } : {}),
      ...(due ? { date_due: due } : {}),
      ...(completed ? { date_end: completed } : {}),
      ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
    });
  });
  return {
    board: { name: 'Imported Quire project' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// One CSV field, with the formula guard and RFC 4180 quoting.
const field = value => {
  let text = value === undefined || value === null ? '' : String(value);
  if (NEEDS_QUOTE.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
// "Jun 2, 2026", the way Quire writes a date, read at UTC.
export function quireDateText(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}
const repeat = (value, count) => Array.from({ length: Math.max(0, count) }, () => value);

// Quire's import columns, with the export's Completed, Created and Created by
// beside them (Quire ignores columns it does not import). Cards are numbered
// #1, #2 ... in export order, and Parent names the parent card's number; an
// Assignee or Tag column is repeated as often as the busiest card needs, as
// Quire's own export does.
export function formatQuireCsv({ items }) {
  const list = items || [];
  const numbers = new Map(list.map((item, index) => [item.cardId, `#${index + 1}`]));
  const people = item => [...new Set([item.owner, ...(Array.isArray(item.assignees) ? item.assignees : [])]
    .map(name => String(name || '').replace(/,/g, ' ').trim()).filter(Boolean))];
  const tags = item => [...new Set((Array.isArray(item.labels) ? item.labels : [])
    .map(label => String(label || '').replace(/,/g, ' ').trim()).filter(Boolean))];
  const assignees = Math.max(1, ...list.map(item => people(item).length));
  const tagCount = Math.max(1, ...list.map(item => tags(item).length));
  const header = ['ID', 'Parent', 'Name', 'Status', 'Completed', 'Priority', 'Start', 'Due',
    ...repeat('Assignee', assignees), ...repeat('Tag', tagCount), 'Created', 'Created by', 'Description'];
  const rows = [header];
  list.forEach((item, index) => {
    const fields = item.customFields || {};
    const priority = QUIRE_PRIORITIES.find(p => p.toLowerCase() === String(fields.Priority || '').toLowerCase());
    const who = people(item);
    const labels = tags(item);
    rows.push([
      `#${index + 1}`,
      numbers.get(item.parentCardId) || '',
      String(item.title || '').trim() || 'Untitled',
      String(item.listTitle || '').trim() || DEFAULT_STATUS,
      quireDateText(item.endAt),
      priority || DEFAULT_PRIORITY,
      quireDateText(item.startAt),
      quireDateText(item.dueAt),
      ...who, ...repeat('', assignees - who.length),
      ...labels, ...repeat('', tagCount - labels.length),
      quireDateText(item.createdAt),
      item.requestedBy || item.creator || '',
      item.description || '',
    ]);
  });
  return `${rows.map(cells => cells.map(field).join(',')).join('\r\n')}\r\n`;
}
