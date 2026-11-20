// Microsoft Lists (and SharePoint lists) as CSV, read and written in plain
// JavaScript so tests/msListsCsv.test.cjs runs the round trip in Node.
//
// Export: a list's command bar, Export > "Export to CSV" (or "Export to CSV
// with schema"). The header row is the columns of the current view, by their
// display names - "Title" first in most lists - and a row per item. A Person
// column is the display name (with schema: the address), several people or
// choices joined with ";" (older SharePoint ";#"), a Yes/No column TRUE or
// FALSE, and dates in the user's regional format or, with schema, ISO 8601
// (models/lib/microsoftCsvDates.js).
//
// Import: Lists > New list > "From CSV" creates a list from such a file,
// taking the first row as the column names and guessing each column's type.
//
// The board view of a list groups its items by a Choice column, so:
//   Status, Progress, Stage, State, Bucket or Board column (the first of
//   these the file has)            -> the list, in the order they first appear
//   Title (else the first column)  -> title
//   Description, Notes, Details,
//   Comments                       -> description (the first there is)
//   Assigned to, Owner, Assignee   -> owner, and assignees after the first
//   Created By                     -> Requested by
//   Start date, Due date (Date due,
//   End date, Target date), Created,
//   Completed date                 -> start, due, created and end dates
//   Tags, Category, Categories,
//   Labels                         -> labels
//   ID                             -> the card's reference
//   any other column               -> a custom field of that name
// Modified, Modified By, Item Type, Path, Content Type, Version, Attachments
// and Compliance Asset Id are SharePoint's own and are reported, not imported.

import { readCsv } from './todoistCsvFormat.js';
import { pagingOf } from './exportPaging.js';
import { microsoftCsvDate, slashOrder, csvCell, csvDay } from './microsoftCsvDates.js';

export const MAX_MS_LISTS_ROWS = 100000;
const NO_STATUS = 'Items';

const ALIASES = {
  status: ['Status', 'Progress', 'Stage', 'State', 'Bucket', 'Board column'],
  title: ['Title', 'Name', 'Item', 'Task'],
  description: ['Description', 'Notes', 'Details', 'Comments'],
  people: ['Assigned to', 'Owner', 'Assignee', 'Assigned'],
  author: ['Created By'],
  start: ['Start date', 'Start'],
  due: ['Due date', 'Date due', 'End date', 'Target date', 'Due'],
  created: ['Created'],
  completed: ['Completed date', 'Date completed', 'Completed on'],
  tags: ['Tags', 'Category', 'Categories', 'Labels'],
  id: ['ID'],
};
const REPORTED = ['Modified', 'Modified By', 'Item Type', 'Path', 'Content Type', 'Version', 'Attachments',
  'Compliance Asset Id', 'Label applied by', 'Retention label', 'Retention label Applied'];

const str = value => (value === undefined || value === null ? '' : String(value));
const split = value => str(value).split(/\s*;#\s*|\s*;\s*/).map(part => part.trim()).filter(part => part && !/^\d+$/.test(part));

export function parseMsListsCsv(text) {
  const rows = readCsv(str(text), 'Microsoft Lists').filter(row => row.some(cell => str(cell).trim()));
  if (rows.length < 2) throw new Error('Microsoft Lists CSV needs a header row and at least one item');
  if (rows.length - 1 > MAX_MS_LISTS_ROWS) throw new Error(`Microsoft Lists CSV has more than ${MAX_MS_LISTS_ROWS} items`);
  const header = rows[0].map(name => str(name).trim());
  const lower = header.map(name => name.toLowerCase());
  const col = {};
  for (const [field, names] of Object.entries(ALIASES)) {
    const at = names.map(name => lower.indexOf(name.toLowerCase())).find(i => i >= 0);
    if (at !== undefined) col[field] = at;
  }
  if (col.title === undefined) col.title = 0;
  const used = new Set(Object.values(col));
  const reported = new Set(REPORTED.map(name => name.toLowerCase()));
  const unsupported = header.filter(name => reported.has(name.toLowerCase()))
    .map(name => ({ path: `/columns/${name}`, reason: `Microsoft Lists column "${name}" is SharePoint's own and is not imported` }));
  const custom = header.map((name, i) => (name && !used.has(i) && !reported.has(name.toLowerCase()) ? { name, i } : null)).filter(Boolean);
  const get = (cells, field) => (col[field] === undefined ? '' : str(cells[col[field]]).trim());
  const order = slashOrder(rows.slice(1).flatMap(cells => ['start', 'due', 'created', 'completed'].map(field => get(cells, field))));

  const columns = [];
  const tasks = [];
  rows.slice(1).forEach((cells, n) => {
    const at = `/row/${n + 2}`;
    const title = get(cells, 'title');
    if (!title) { unsupported.push({ path: at, reason: 'a Microsoft Lists item without a title is not imported' }); return; }
    const column = get(cells, 'status') || NO_STATUS;
    if (!columns.includes(column)) columns.push(column);
    const date = field => {
      const value = get(cells, field);
      const iso = microsoftCsvDate(value, order);
      if (iso === undefined) unsupported.push({ path: `${at}/${header[col[field]]}`, reason: `Microsoft Lists date "${value}" is not a date` });
      return iso || '';
    };
    const people = split(get(cells, 'people'));
    const fields = {};
    for (const { name, i } of custom) {
      const value = str(cells[i]).trim();
      if (!value) continue;
      if (/^(true|false)$/i.test(value)) fields[name] = value.toLowerCase() === 'true';
      else fields[name] = value;
    }
    const ended = date('completed');
    tasks.push({
      title,
      description: get(cells, 'description'),
      column_name: column,
      swimlane_name: 'Default',
      tags: [...new Set(split(get(cells, 'tags')))],
      ...(get(cells, 'id') ? { ref: get(cells, 'id') } : {}),
      ...(people.length ? { owner_username: people[0] } : {}),
      ...(people.length > 1 ? { assignees: people.slice(1) } : {}),
      ...(get(cells, 'author') ? { requested_by: split(get(cells, 'author'))[0] || get(cells, 'author') } : {}),
      ...(date('created') ? { date_creation: date('created') } : {}),
      ...(date('start') ? { date_started: date('start') } : {}),
      ...(date('due') ? { date_due: date('due') } : {}),
      ...(ended ? { date_end: ended } : {}),
      ...(Object.keys(fields).length ? { custom_fields: fields } : {}),
    });
  });
  if (!tasks.length) throw new Error('Microsoft Lists CSV has no items with a title');
  return {
    board: { name: 'Imported Microsoft Lists list' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// ------------------------------------------------------------------ export ---

export const MS_LISTS_EXPORT_COLUMNS = ['Title', 'Status', 'Assigned to', 'Start date', 'Due date', 'Tags', 'Description'];
const RESERVED = new Set(Object.values(ALIASES).flat().concat(MS_LISTS_EXPORT_COLUMNS).map(name => name.toLowerCase()));
// A Lists column name cannot hold these characters.
const columnName = name => str(name).replace(/[~"#%&*:<>?/\\{|}]+/g, ' ').replace(/\s+/g, ' ').trim();

// The file "From CSV" makes a list of: Status is the board view's Choice
// column (the card's list), people and labels joined with "; ", dates as
// YYYY-MM-DD, and each custom field of the board a column of its own.
export function formatMsListsCsv(collected) {
  const { items, all, first } = pagingOf(collected);
  const extra = [];
  for (const item of all) {
    for (const name of Object.keys(item.customFields || {})) {
      const clean = columnName(name);
      if (clean && !RESERVED.has(clean.toLowerCase()) && !extra.some(e => e.clean === clean)) extra.push({ name, clean });
    }
  }
  const header = MS_LISTS_EXPORT_COLUMNS.concat(extra.map(e => e.clean));
  const rows = first ? [header] : [];
  for (const item of items) {
    const fields = item.customFields || {};
    const value = v => (v === true ? 'TRUE' : v === false ? 'FALSE' : v === undefined || v === null ? '' : v);
    rows.push([
      str(item.title).trim() || 'Untitled',
      str(item.listTitle).trim(),
      [item.owner, ...(Array.isArray(item.assignees) ? item.assignees : [])].map(p => str(p).trim()).filter(Boolean).join('; '),
      csvDay(item.startAt),
      csvDay(item.dueAt),
      (Array.isArray(item.labels) ? item.labels : []).map(l => str(l).replace(/;/g, ' ').trim()).filter(Boolean).join('; '),
      str(item.description),
      ...extra.map(e => value(fields[e.name])),
    ]);
  }
  return rows.length ? `${first ? '﻿' : ''}${rows.map(cells => cells.map(csvCell).join(',')).join('\r\n')}\r\n` : '';
}
