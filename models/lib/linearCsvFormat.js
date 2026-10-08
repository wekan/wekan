// Linear's CSV export (Settings > Administration > Import / Export > Export
// data, or a view's export), read and written in plain JavaScript so
// tests/linearCsv.test.cjs runs the round trip in Node. Columns are matched by
// header name: Linear has added columns over time (Triaged, SLA Status,
// Initiatives, milestones). The values follow Linear's own CSV importer in its
// open-source @linear/import package: priority names, labels joined by ", ",
// and a leading ' that Linear adds to text an spreadsheet could read as a
// formula, which is removed.
//
//   ID,Team,Title,Description,Status,Estimate,Priority,Project ID,Project,
//   Creator,Assignee,Labels,Cycle Number,Cycle Name,Cycle Start,Cycle End,
//   Created,Updated,Started,Triaged,Completed,Canceled,Archived,Due Date,
//   Parent issue,Initiatives,Project Milestone ID,Project Milestone,SLA Status
//
// A row maps to:
//   Status                  -> a list, in the order statuses first appear
//   Team                    -> a swimlane
//   ID / Parent issue       -> the card's reference / its parent card
//   Title / Description     -> title / description
//   Assignee / Creator      -> owner / Requested by
//   Labels                  -> labels
//   Created, Started,
//   Completed or Canceled,
//   Due Date                -> created, start, end and due dates
//   Archived (any date)     -> an archived card
//   Priority, Estimate,
//   Project, Cycle          -> custom fields ("No priority" is left out)
// Columns with no WeKan place (Updated, Triaged, the cycle's dates,
// Initiatives, milestones, SLA Status) are reported once, by name.

import { readCsv } from './todoistCsvFormat.js';

export const LINEAR_COLUMNS = ['ID', 'Team', 'Title', 'Description', 'Status', 'Estimate', 'Priority', 'Project ID',
  'Project', 'Creator', 'Assignee', 'Labels', 'Cycle Number', 'Cycle Name', 'Cycle Start', 'Cycle End', 'Created',
  'Updated', 'Started', 'Triaged', 'Completed', 'Canceled', 'Archived', 'Due Date', 'Parent issue', 'Initiatives',
  'Project Milestone ID', 'Project Milestone', 'SLA Status'];
export const LINEAR_PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
const READ = new Set(['ID', 'Id', 'Team', 'Title', 'Description', 'Status', 'Estimate', 'Priority', 'Project ID', 'Project',
  'Creator', 'Assignee', 'Labels', 'Cycle Number', 'Cycle Name', 'Created', 'Started', 'Completed', 'Canceled', 'Archived',
  'Due Date', 'Parent issue']);
const FORMULA = /^'(?=[+\-=@∑√∏<>＜＞≤≥＝≠±÷×])/;
const NEEDS_QUOTE = /^[+\-=@∑√∏<>＜＞≤≥＝≠±÷×]/;
const NO_STATUS = 'No status';

const unformula = text => String(text || '').replace(FORMULA, '');

// Linear does not document its date format; it writes ISO 8601, and its own
// importer reads dates with Date. A day alone is a calendar day in UTC.
export function linearDate(value) {
  const text = String(value || '').trim();
  if (!text) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const date = new Date(`${text}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? undefined : date.toISOString();
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(text)) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function parseLinearCsv(text) {
  const rows = readCsv(text, 'Linear');
  if (!rows.length) throw new Error('Linear CSV is empty');
  const header = rows[0].map(cell => cell.trim());
  if (!header.includes('Title') || !header.includes('Status')) throw new Error('Linear CSV needs the Title and Status columns');
  const col = name => (header.indexOf(name) !== -1 ? header.indexOf(name) : name === 'ID' ? header.indexOf('Id') : -1);
  const get = (cells, name) => (col(name) === -1 ? '' : unformula(String(cells[col(name)] || '').trim()));
  const unsupported = header
    .filter(name => name && !READ.has(name))
    .map(name => ({ path: `/columns/${name}`, reason: `Linear column "${name}" has no WeKan place and is not imported` }));
  const columns = [];
  const swimlanes = [];
  const tasks = [];
  rows.slice(1).forEach((cells, index) => {
    const at = `/row/${index + 2}`;
    const title = get(cells, 'Title');
    if (!title) { unsupported.push({ path: at, reason: 'a Linear row without a title is not imported' }); return; }
    const status = get(cells, 'Status') || NO_STATUS;
    if (!columns.includes(status)) columns.push(status);
    const team = get(cells, 'Team') || 'Default';
    if (!swimlanes.includes(team)) swimlanes.push(team);
    const date = name => {
      const value = get(cells, name);
      const iso = linearDate(value);
      if (value && !iso) unsupported.push({ path: `${at}/${name}`, reason: `Linear date "${value}" is not an ISO 8601 date` });
      return iso;
    };
    const custom = {};
    const priority = get(cells, 'Priority');
    if (LINEAR_PRIORITIES.includes(priority)) custom.Priority = priority;
    else if (priority && priority !== 'No priority') unsupported.push({ path: `${at}/Priority`, reason: `Linear priority "${priority}" is not one of ${LINEAR_PRIORITIES.join(', ')}` });
    const estimate = get(cells, 'Estimate');
    if (estimate) {
      if (Number.isFinite(Number(estimate))) custom.Estimate = Number(estimate);
      else unsupported.push({ path: `${at}/Estimate`, reason: `Linear estimate "${estimate}" is not a number` });
    }
    if (get(cells, 'Project')) custom.Project = get(cells, 'Project');
    const cycle = get(cells, 'Cycle Name') || (get(cells, 'Cycle Number') ? `Cycle ${get(cells, 'Cycle Number')}` : '');
    if (cycle) custom.Cycle = cycle;
    const canceled = date('Canceled');
    const ended = date('Completed') || canceled;
    if (canceled) custom.Canceled = true;
    const archived = get(cells, 'Archived');
    if (archived) date('Archived');
    const owner = get(cells, 'Assignee');
    tasks.push({
      title,
      description: get(cells, 'Description'),
      column_name: status,
      swimlane_name: team,
      tags: get(cells, 'Labels').split(',').map(label => label.trim()).filter(Boolean),
      ...(get(cells, 'ID') ? { ref: get(cells, 'ID') } : {}),
      ...(get(cells, 'Parent issue') ? { parent_ref: get(cells, 'Parent issue') } : {}),
      ...(owner ? { owner_username: owner } : {}),
      ...(get(cells, 'Creator') ? { requested_by: get(cells, 'Creator') } : {}),
      ...(date('Created') ? { date_creation: date('Created') } : {}),
      ...(date('Started') ? { date_started: date('Started') } : {}),
      ...(date('Due Date') ? { date_due: date('Due Date') } : {}),
      ...(ended ? { date_end: ended } : {}),
      ...(archived ? { archived: true } : {}),
      ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
    });
  });
  return {
    board: { name: 'Imported Linear issues' },
    columns: columns.map(title => ({ title })),
    swimlanes: (swimlanes.length ? swimlanes : ['Default']).map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

// One CSV field, with Linear's own formula guard and RFC 4180 quoting.
const field = value => {
  let text = value === undefined || value === null ? '' : String(value);
  if (NEEDS_QUOTE.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const iso = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

// Linear's export columns, in its order; what WeKan has no value for is empty.
export function formatLinearCsv({ items }) {
  const rows = [LINEAR_COLUMNS];
  for (const item of items || []) {
    const fields = item.customFields || {};
    const canceled = fields.Canceled === true || fields.Canceled === 'true';
    const values = {
      ID: item.cardId || '',
      Team: item.swimlaneTitle && item.swimlaneTitle !== 'Default' ? item.swimlaneTitle : '',
      Title: String(item.title || '').trim() || 'Untitled',
      Description: item.description || '',
      Status: item.listTitle || NO_STATUS,
      Estimate: Number.isFinite(Number(fields.Estimate)) && fields.Estimate !== '' && fields.Estimate !== undefined ? String(fields.Estimate) : '',
      Priority: LINEAR_PRIORITIES.includes(fields.Priority) ? fields.Priority : 'No priority',
      Project: fields.Project || '',
      Creator: item.creator || item.requestedBy || '',
      Assignee: item.owner || '',
      Labels: (Array.isArray(item.labels) ? item.labels : []).map(label => String(label).replace(/,/g, ' ')).join(', '),
      'Cycle Name': fields.Cycle || '',
      Created: iso(item.createdAt),
      Started: iso(item.startAt),
      Completed: canceled ? '' : iso(item.endAt),
      Canceled: canceled ? iso(item.endAt) : '',
      'Due Date': item.dueAt ? iso(item.dueAt).slice(0, 10) : '',
      'Parent issue': item.parentCardId || '',
    };
    rows.push(LINEAR_COLUMNS.map(name => values[name] || ''));
  }
  return `${rows.map(cells => cells.map(field).join(',')).join('\r\n')}\r\n`;
}
