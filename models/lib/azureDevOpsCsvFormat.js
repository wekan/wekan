// Azure DevOps Boards work items as CSV, read and written in plain
// JavaScript so tests/azureDevOpsCsv.test.cjs runs the round trip in Node.
//
// Export: Boards > Queries, run a query, then "Export to CSV" (or Work items >
// Export to CSV). The header row is the query's column names - "ID", "Work
// Item Type", "Title", "Assigned To", "State", "Tags" and whatever columns the
// query shows - and a tree query writes "Title 1", "Title 2", ... instead of
// "Title", one column per level, each row's title in the column of its level.
// A person is "Display Name <address>", tags are joined with "; ", and dates
// are in the exporting user's regional format (models/lib/microsoftCsvDates.js).
//
// Import: Boards > Work items > Import from CSV reads the same file. A row
// with an empty ID is a new work item; "Work Item Type" and "Title" (or
// "Title 1", ...) are required, and every other column has to be a field of
// that work item type in the project's process.
//
// A row maps to:
//   Board Column, else State      -> the list, in the order they first appear
//   Board Lane                    -> the swimlane
//   Work Item Type, Tags          -> labels
//   ID                            -> the card's reference; Parent (an ID), or
//                                    the row above at the level above in a
//                                    tree query, is its parent card
//   Title / Title N               -> title
//   Description, Acceptance
//   Criteria, Repro Steps         -> description (HTML read as text)
//   Assigned To / Created By      -> owner / Requested by
//   Created Date, Start Date,
//   Target Date (or Due Date,
//   Finish Date), Closed Date     -> created, start, due and end dates
//   Completed Work                -> spent time
//   Priority, Story Points, Effort, Severity, Area Path, Iteration Path,
//   Original Estimate, Remaining Work, Value Area, Risk, Business Value,
//   Reason and any other column   -> custom fields
// Changed Date, Changed By, Rev, History and the Board Column Done flag have
// no WeKan place and are reported.

import { readCsv } from './todoistCsvFormat.js';
import { pagingOf } from './exportPaging.js';
import { vikunjaHtmlToText, vikunjaHtml } from './vikunjaFormat.js';
import { microsoftCsvDate, slashOrder, csvCell, csvDay } from './microsoftCsvDates.js';

export const MAX_AZURE_DEVOPS_ROWS = 100000;
const DEFAULT_SWIMLANE = 'Default';
const NO_STATE = 'New';

const FIELDS = {
  id: 'ID', type: 'Work Item Type', title: 'Title', state: 'State', boardColumn: 'Board Column',
  boardLane: 'Board Lane', assignedTo: 'Assigned To', createdBy: 'Created By', tags: 'Tags',
  description: 'Description', acceptance: 'Acceptance Criteria', repro: 'Repro Steps', parent: 'Parent',
  created: 'Created Date', start: 'Start Date', target: 'Target Date', due: 'Due Date', finish: 'Finish Date',
  closed: 'Closed Date', completed: 'Completed Work',
};
const REPORTED = ['Changed Date', 'Changed By', 'Rev', 'History', 'Board Column Done', 'Activated Date', 'Activated By',
  'Resolved Date', 'Resolved By', 'Closed By', 'State Change Date'];
// The work item types of the four built-in processes (Basic, Agile, Scrum,
// CMMI): a card's label of one of these names is its type on export.
export const AZURE_DEVOPS_TYPES = ['Epic', 'Feature', 'User Story', 'Product Backlog Item', 'Requirement', 'Bug', 'Task',
  'Issue', 'Impediment', 'Test Case', 'Change Request', 'Review', 'Risk'];
// Their states: a list of one of these names is written as the State.
export const AZURE_DEVOPS_STATES = ['New', 'Active', 'Resolved', 'Closed', 'Removed', 'To Do', 'Doing', 'Done',
  'In Progress', 'Approved', 'Committed', 'Proposed'];
// The fields an exported custom field is written back into - only when a card
// of the board has one, so a board that never came from Azure DevOps is not
// given columns its process may not have.
const BACK_FIELDS = ['Priority', 'Story Points', 'Effort', 'Severity', 'Area Path', 'Iteration Path',
  'Original Estimate', 'Remaining Work', 'Value Area', 'Risk', 'Business Value'];

const str = value => (value === undefined || value === null ? '' : String(value));
const htmlText = value => {
  const source = str(value).trim();
  return source ? vikunjaHtmlToText(source, { checklists: false }).text : '';
};
const number = value => {
  const n = Number(str(value).trim().replace(',', '.'));
  return str(value).trim() && Number.isFinite(n) ? n : undefined;
};

// "Display Name <address>" -> the display name; a bare name stays.
export function azureDevOpsPerson(value) {
  const text = str(value).trim();
  const match = /^(.*?)\s*<([^<>]+)>$/.exec(text);
  if (!match) return text;
  return match[1].trim() || match[2].trim();
}

export function parseAzureDevOpsCsv(text) {
  const rows = readCsv(str(text), 'Azure DevOps').filter(row => row.some(cell => str(cell).trim()));
  if (!rows.length) throw new Error('Azure DevOps CSV is empty');
  if (rows.length - 1 > MAX_AZURE_DEVOPS_ROWS) throw new Error(`Azure DevOps CSV has more than ${MAX_AZURE_DEVOPS_ROWS} rows`);
  const header = rows[0].map(name => str(name).trim());
  const index = new Map(header.map((name, i) => [name.toLowerCase(), i]));
  const col = name => index.get(name.toLowerCase());
  const levels = header.map((name, i) => {
    const match = /^title\s+(\d+)$/i.exec(name);
    return match ? { level: Number(match[1]), i } : null;
  }).filter(Boolean).sort((a, b) => a.level - b.level);
  if (col(FIELDS.title) === undefined && !levels.length) {
    throw new Error('Not an Azure DevOps CSV: it needs the Title column (or Title 1, Title 2, ... from a tree query)');
  }
  const known = new Set([...Object.values(FIELDS), ...REPORTED].map(name => name.toLowerCase()));
  const custom = header.map((name, i) => (name && !known.has(name.toLowerCase()) && !/^title\s+\d+$/i.test(name) ? { name, i } : null)).filter(Boolean);
  const unsupported = REPORTED.filter(name => col(name) !== undefined)
    .map(name => ({ path: `/columns/${name}`, reason: `Azure DevOps column "${name}" has no WeKan place and is not imported` }));
  const get = (cells, field) => (col(field) === undefined ? '' : str(cells[col(field)]).trim());
  const dateNames = [FIELDS.created, FIELDS.start, FIELDS.target, FIELDS.due, FIELDS.finish, FIELDS.closed];
  const order = slashOrder(rows.slice(1).flatMap(cells => dateNames.map(name => get(cells, name))));

  const columns = [];
  const swimlanes = [];
  const tasks = [];
  const lastAtLevel = [];
  rows.slice(1).forEach((cells, n) => {
    const at = `/row/${n + 2}`;
    let title = get(cells, FIELDS.title);
    let level = 0;
    if (!title) {
      const filled = levels.find(l => str(cells[l.i]).trim());
      if (filled) { title = str(cells[filled.i]).trim(); level = filled.level; }
    }
    if (!title) { unsupported.push({ path: at, reason: 'an Azure DevOps row without a title is not imported' }); return; }
    const column = get(cells, FIELDS.boardColumn) || get(cells, FIELDS.state) || NO_STATE;
    if (!columns.includes(column)) columns.push(column);
    const swimlane = get(cells, FIELDS.boardLane) || DEFAULT_SWIMLANE;
    if (!swimlanes.includes(swimlane)) swimlanes.push(swimlane);
    const date = name => {
      const value = get(cells, name);
      const iso = microsoftCsvDate(value, order);
      if (iso === undefined) unsupported.push({ path: `${at}/${name}`, reason: `Azure DevOps date "${value}" is not a date` });
      return iso || '';
    };
    const ref = get(cells, FIELDS.id) || `row-${n + 2}`;
    let parent = get(cells, FIELDS.parent);
    if (!parent && level > 1) parent = lastAtLevel[level - 1] || '';
    if (level) { lastAtLevel[level] = ref; lastAtLevel.length = level + 1; }
    const type = get(cells, FIELDS.type);
    const tags = [...(type ? [type] : []), ...get(cells, FIELDS.tags).split(/\s*;\s*/).map(t => t.trim()).filter(Boolean)];
    const description = [
      htmlText(get(cells, FIELDS.description)),
      ...[[FIELDS.acceptance, 'Acceptance Criteria'], [FIELDS.repro, 'Repro Steps']]
        .map(([name, label]) => (htmlText(get(cells, name)) ? `${label}:\n${htmlText(get(cells, name))}` : '')),
    ].filter(Boolean).join('\n\n');
    const fields = {};
    for (const { name, i } of custom) {
      const value = str(cells[i]).trim();
      if (value) fields[name] = number(value) !== undefined && !/path$/i.test(name) ? number(value) : value;
    }
    const owner = azureDevOpsPerson(get(cells, FIELDS.assignedTo));
    const author = azureDevOpsPerson(get(cells, FIELDS.createdBy));
    const spent = number(get(cells, FIELDS.completed));
    const due = date(FIELDS.target) || date(FIELDS.due) || date(FIELDS.finish);
    tasks.push({
      title,
      description,
      column_name: column,
      swimlane_name: swimlane,
      tags: [...new Set(tags)],
      ref,
      ...(parent ? { parent_ref: parent } : {}),
      ...(owner ? { owner_username: owner } : {}),
      ...(author ? { requested_by: author } : {}),
      ...(date(FIELDS.created) ? { date_creation: date(FIELDS.created) } : {}),
      ...(date(FIELDS.start) ? { date_started: date(FIELDS.start) } : {}),
      ...(due ? { date_due: due } : {}),
      ...(date(FIELDS.closed) ? { date_end: date(FIELDS.closed) } : {}),
      ...(spent > 0 ? { spent_hours: spent } : {}),
      ...(Object.keys(fields).length ? { custom_fields: fields } : {}),
    });
  });
  if (!tasks.length) throw new Error('Azure DevOps CSV has no work items');
  return {
    board: { name: 'Imported Azure DevOps work items' },
    columns: columns.map(title => ({ title })),
    swimlanes: swimlanes.map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

// ------------------------------------------------------------------ export ---

export const AZURE_DEVOPS_EXPORT_COLUMNS = ['ID', 'Work Item Type', 'Title', 'Assigned To', 'State', 'Tags', 'Description'];
const typeOf = labels => {
  const found = (Array.isArray(labels) ? labels : [])
    .map(label => AZURE_DEVOPS_TYPES.find(type => type.toLowerCase() === str(label).trim().toLowerCase())).find(Boolean);
  return found || 'Task';
};
const stateOf = listTitle => AZURE_DEVOPS_STATES.find(state => state.toLowerCase() === str(listTitle).trim().toLowerCase()) || '';
// An Azure DevOps tag cannot hold "," or ";".
const tagText = value => str(value).replace(/[,;]+/g, ' ').replace(/\s+/g, ' ').trim();

// The file "Import from CSV" reads: every row a new work item (an empty ID),
// of the type its first type-named label gives (else Task), in the State its
// list is named after when that is a state of the built-in processes - a list
// of another name is written as a tag, and the work item takes its type's
// first state. The description is written as the HTML the field holds.
export function formatAzureDevOpsCsv(collected) {
  const { items, all, first } = pagingOf(collected);
  const extra = BACK_FIELDS.filter(name => all.some(item => item.customFields && item.customFields[name] !== undefined
    && item.customFields[name] !== ''));
  const columns = AZURE_DEVOPS_EXPORT_COLUMNS.concat(extra);
  const rows = first ? [columns] : [];
  for (const item of items) {
    const type = typeOf(item.labels);
    const state = stateOf(item.listTitle);
    const tags = (Array.isArray(item.labels) ? item.labels : []).filter(label => str(label).trim().toLowerCase() !== type.toLowerCase())
      .concat(state || !str(item.listTitle).trim() ? [] : [item.listTitle]).map(tagText).filter(Boolean);
    const fields = item.customFields || {};
    const values = {
      ID: '',
      'Work Item Type': type,
      Title: str(item.title).trim() || 'Untitled',
      'Assigned To': str(item.owner).trim(),
      State: state,
      Tags: [...new Set(tags)].join('; '),
      Description: str(item.description).trim() ? vikunjaHtml(item.description, item.checklists || []) : '',
    };
    for (const name of extra) values[name] = fields[name] === undefined || fields[name] === null ? '' : fields[name];
    rows.push(columns.map(name => values[name]));
  }
  return rows.length ? `${first ? '﻿' : ''}${rows.map(cells => cells.map(csvCell).join(',')).join('\r\n')}\r\n` : '';
}

export { csvDay };
