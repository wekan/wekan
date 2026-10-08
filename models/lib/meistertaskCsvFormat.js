// MeisterTask project CSV, read and written in plain JavaScript so
// tests/meistertaskCsv.test.cjs runs the round trip in Node.
//
// MeisterTask writes and reads two CSV shapes, matched here by header name:
//
//   Import (Home > + next to Projects > Import > CSV; MeisterTask's own
//   sample file):
//     project,section,name,notes,due_date,status,tags
//   Export (project name > Export project > CSV):
//     id,token,name,notes,created_at,updated_at,status,due_date,
//     status_updated_at,assignee,section,tags
//
// WeKan exports the import shape, the one MeisterTask reads back, and imports
// either. A row maps to:
//   section                 -> a list, in the order sections first appear
//   name / notes            -> the card's title / description
//   status 1 / 2            -> open / completed; a completed task's end date
//                              is status_updated_at (or completed_at)
//   status 8 / 16           -> binned / archived: an archived card
//   due_date, created_at    -> due and created dates (ISO 8601, or a date)
//   assignee                -> the owner, by full name
//   tags ("a; b")           -> labels
//   id                      -> the card's source reference
//   project                 -> the board's title (the first row's)
// Columns MeisterTask may add to an export (checklists, comments, custom
// fields, tracked time) have no documented shape and are reported by name.

import { readCsv } from './todoistCsvFormat.js';

export const MEISTERTASK_IMPORT_COLUMNS = ['project', 'section', 'name', 'notes', 'due_date', 'status', 'tags'];
const KNOWN = new Set([...MEISTERTASK_IMPORT_COLUMNS, 'id', 'token', 'created_at', 'updated_at',
  'status_updated_at', 'completed_at', 'assignee']);
const STATUS = { 1: 'open', 2: 'completed', 8: 'binned', 16: 'archived' };
const NO_SECTION = 'No section';

// "2021-04-26T07:35:13+00:00", "2021-04-26" or "2021-04-26 07:35:13", as ISO.
const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;
export function meistertaskDate(value) {
  const text = String(value || '').trim();
  const match = ISO.exec(text);
  if (!match) return undefined;
  if (!match[4]) {
    const day = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
    return day.getUTCMonth() === +match[2] - 1 && day.getUTCDate() === +match[3] ? day.toISOString() : undefined;
  }
  const zone = match[7] ? match[7].replace(/^([+-]\d{2})(\d{2})$/, '$1:$2') : 'Z';
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] || '00'}${zone}`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function parseMeisterTaskCsv(text) {
  const rows = readCsv(text, 'MeisterTask');
  if (!rows.length) throw new Error('MeisterTask CSV is empty');
  const header = rows[0].map(cell => cell.trim().toLowerCase());
  if (!header.includes('name') || !header.includes('section')) {
    throw new Error('MeisterTask CSV needs the name and section columns');
  }
  const get = (cells, name) => (header.indexOf(name) === -1 ? '' : String(cells[header.indexOf(name)] || '').trim());
  const unsupported = header
    .filter(name => name && !KNOWN.has(name))
    .map(name => ({ path: `/columns/${name}`, reason: `MeisterTask column "${name}" has no documented format and is not imported` }));
  const columns = [];
  const tasks = [];
  let project = '';
  rows.slice(1).forEach((cells, index) => {
    const at = `/row/${index + 2}`;
    const title = get(cells, 'name');
    if (!title) { unsupported.push({ path: at, reason: 'a MeisterTask row without a name is not imported' }); return; }
    project = project || get(cells, 'project');
    const section = get(cells, 'section') || NO_SECTION;
    if (!columns.includes(section)) columns.push(section);
    const date = name => {
      const value = get(cells, name);
      const iso = meistertaskDate(value);
      if (value && !iso) unsupported.push({ path: `${at}/${name}`, reason: `MeisterTask date "${value}" is not an ISO 8601 date` });
      return iso;
    };
    const statusText = get(cells, 'status');
    const status = statusText ? STATUS[statusText] : 'open';
    if (!status) unsupported.push({ path: `${at}/status`, reason: `MeisterTask status "${statusText}" is not 1, 2, 8 or 16; imported as open` });
    const due = date('due_date');
    const created = date('created_at');
    const ended = status === 'completed' ? (date('completed_at') || date('status_updated_at')) : undefined;
    const owner = get(cells, 'assignee');
    tasks.push({
      title,
      description: get(cells, 'notes'),
      column_name: section,
      swimlane_name: 'Default',
      tags: get(cells, 'tags').split(';').map(tag => tag.trim()).filter(Boolean),
      ...(get(cells, 'id') ? { ref: get(cells, 'id') } : {}),
      ...(owner ? { owner_username: owner } : {}),
      ...(due ? { date_due: due } : {}),
      ...(created ? { date_creation: created } : {}),
      ...(ended ? { date_end: ended } : {}),
      ...(status === 'binned' || status === 'archived' ? { archived: true } : {}),
    });
  });
  return {
    board: { name: project || 'Imported MeisterTask' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

const field = value => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const isoSeconds = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
};

// The import shape MeisterTask reads back. A card with an end date is
// completed; an archived card is not exported (WeKan exports none).
export function formatMeisterTaskCsv({ board, items }) {
  const project = (board && board.title) || 'WeKan board';
  const rows = [MEISTERTASK_IMPORT_COLUMNS];
  for (const item of items || []) {
    rows.push([
      project,
      item.listTitle || NO_SECTION,
      String(item.title || '').trim() || 'Untitled',
      item.description || '',
      isoSeconds(item.dueAt),
      item.endAt ? '2' : '1',
      (Array.isArray(item.labels) ? item.labels : []).map(tag => String(tag).replace(/;/g, ',').trim()).filter(Boolean).join('; '),
    ]);
  }
  return `${rows.map(cells => cells.map(field).join(',')).join('\r\n')}\r\n`;
}
