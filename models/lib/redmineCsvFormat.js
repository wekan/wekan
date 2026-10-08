// Redmine's issues CSV (Issues > "Also available in: CSV"), read and written in
// plain JavaScript so tests/redmineCsv.test.cjs runs the round trip in Node.
//
// How Redmine writes it (lib/redmine/export/csv.rb, query_to_csv in
// app/helpers/queries_helper.rb): a UTF-8 byte order mark, then a header of
// the chosen columns' CAPTIONS IN THE USER'S LANGUAGE, the issue id "#" first.
// The field separator is the one chosen in the export dialog or the locale's
// (',' in English, ';' in locales whose decimal separator is a comma); a
// decimal is written "%.2f" with the locale's decimal separator. Dates and
// times follow the user's date format (English default 10/05/2026 and
// 10/05/2026 09:15 AM). "Parent task" holds the parent's id alone, and
// "Related issues" every relation in one cell as IssueRelation#to_s writes it:
// "Blocked by #12, Related to #7, Precedes (3 days) #9".
//
// Redmine's own importer (app/models/issue_import.rb) reads another shape: one
// column per relation type (Blocks, Blocked by, Related to, ...) holding
// "#12", "12" or a Unique ID, optionally with a delay "12 3d", and a
// Unique ID column that Parent task and the relation columns may refer to.
// Its auto-mapping matches a header with either the English label or the
// field key (subject, assigned_to, relation_blocks, ...), and so does this.
//
// Columns are matched by Redmine's English labels (config/locales/en.yml),
// case-insensitively. A header in another language cannot be told apart from
// custom fields, so a file without a single known English label is refused
// with a message that says so.
//
// A row maps to:
//   Status                        -> a list, in the order statuses first appear
//   Project                       -> a swimlane
//   Tracker                       -> a label
//   # (or Unique ID)              -> the card's reference
//   Parent task                   -> its parent card
//   Related issues, and the
//   per-type relation columns     -> dependencies (one per pair of issues)
//   Subject / Description         -> title / description
//   Assignee / Author / Watchers  -> owner / Requested by / watchers
//   Start date, Due date,
//   Created, Closed               -> start, due, created and end dates
//   Spent time                    -> spent time
//   Last notes                    -> a comment
//   Priority, Category, Target
//   version, Estimated time,
//   % Done, any other column      -> custom fields (Redmine's custom fields are
//                                    columns named after the field)
// Updated, Last updated by, Files, Private, Parent task subject, the total and
// remaining estimates, Total spent time, relation delays and relation types
// WeKan has no equivalent for are reported.

import { readCsv } from './todoistCsvFormat.js';

export const REDMINE_FIELDS = {
  id: '#', project: 'Project', tracker: 'Tracker', parent: 'Parent task', parentSubject: 'Parent task subject',
  status: 'Status', priority: 'Priority', subject: 'Subject', author: 'Author', assignee: 'Assignee',
  watchers: 'Watchers', updated: 'Updated', category: 'Category', version: 'Target version',
  start: 'Start date', due: 'Due date', estimated: 'Estimated time', remaining: 'Estimated remaining time',
  totalEstimated: 'Total estimated time', spent: 'Spent time', totalSpent: 'Total spent time', done: '% Done',
  created: 'Created', closed: 'Closed', lastUpdatedBy: 'Last updated by', relations: 'Related issues',
  files: 'Files', description: 'Description', lastNotes: 'Last notes', private: 'Private', uniqueId: 'Unique ID',
};

// IssueRelation::TYPES with their English labels, and the WeKan dependency
// type each becomes. Precedes, follows and the copies have no WeKan type and
// are kept as related-to, which is reported.
export const REDMINE_RELATIONS = [
  { key: 'relation_relates', label: 'Related to', type: 'related-to' },
  { key: 'relation_duplicates', label: 'Is duplicate of', type: 'duplicates' },
  { key: 'relation_duplicated', label: 'Has duplicate', type: 'is-duplicated-by' },
  { key: 'relation_blocks', label: 'Blocks', type: 'blocks' },
  { key: 'relation_blocked', label: 'Blocked by', type: 'is-blocked-by' },
  { key: 'relation_precedes', label: 'Precedes', type: 'related-to', lossy: true },
  { key: 'relation_follows', label: 'Follows', type: 'related-to', lossy: true },
  { key: 'relation_copied_to', label: 'Copied to', type: 'related-to', lossy: true },
  { key: 'relation_copied_from', label: 'Copied from', type: 'related-to', lossy: true },
];

// The field keys Redmine's importer auto-maps besides the labels.
const IMPORT_KEYS = {
  tracker: 'tracker', subject: 'subject', description: 'description', status: 'status', priority: 'priority',
  category: 'category', assigned_to: 'assignee', fixed_version: 'version', is_private: 'private',
  parent_issue_id: 'parent', start_date: 'start', due_date: 'due', estimated_hours: 'estimated',
  done_ratio: 'done', unique_id: 'uniqueId',
};
const REPORTED = ['updated', 'lastUpdatedBy', 'files', 'private', 'remaining', 'totalEstimated', 'totalSpent'];
const CUSTOM = { priority: 'Priority', category: 'Category', version: 'Target version', estimated: 'Estimated time', done: '% Done' };
const NO_STATUS = 'New';
const INVERSE = { 'related-to': 'related-to', blocks: 'is-blocked-by', 'is-blocked-by': 'blocks',
  duplicates: 'is-duplicated-by', 'is-duplicated-by': 'duplicates', fixes: 'is-fixed-by', 'is-fixed-by': 'fixes' };

// The header's own separator: Redmine's importer guesses between ',' and ';'
// by counting them, and so does this, on the header line outside quotes.
export function redmineSeparator(text) {
  const source = String(text == null ? '' : text).replace(/^﻿/, '');
  let quoted = false;
  let commas = 0;
  let semicolons = 0;
  for (const ch of source) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === '\n' || ch === '\r')) break;
    else if (!quoted && ch === ',') commas += 1;
    else if (!quoted && ch === ';') semicolons += 1;
  }
  return semicolons > commas ? ';' : ',';
}

// The date formats Redmine's settings and importer offer that are numbers
// only: %Y-%m-%d, %Y/%m/%d, %d.%m.%Y, %d-%m-%Y and %m/%d/%Y or %d/%m/%Y
// (`slash` says which, decided for the whole file), with an optional time in
// 24-hour or the English %I:%M %p form. Redmine writes times in the user's
// time zone and the file does not name it, so they are read as UTC. A full
// ISO 8601 timestamp with its zone is read as written.
const TIME = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AaPp])\.?[Mm]\.?)?$/;
export function redmineDate(value, slash = 'mdy') {
  const text = String(value || '').trim();
  if (!text) return undefined;
  if (/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:?\d{2})$/.test(text)) {
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  const [dayPart, ...rest] = text.split(/[\sT]+/);
  let y; let m; let d; let match;
  if ((match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(dayPart))) [, y, m, d] = match;
  else if ((match = /^(\d{1,2})[.-](\d{1,2})[.-](\d{4})$/.exec(dayPart))) [, d, m, y] = match;
  else if ((match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dayPart))) {
    [m, d] = slash === 'dmy' ? [match[2], match[1]] : [match[1], match[2]];
    y = match[3];
  } else return undefined;
  let hours = 0; let minutes = 0; let seconds = 0;
  if (rest.length) {
    const time = TIME.exec(rest.join(' '));
    if (!time) return undefined;
    hours = Number(time[1]); minutes = Number(time[2]); seconds = Number(time[3] || 0);
    if (time[4]) {
      if (hours < 1 || hours > 12) return undefined;
      hours = (hours % 12) + (/p/i.test(time[4]) ? 12 : 0);
    }
    if (hours > 23 || minutes > 59 || seconds > 59) return undefined;
  }
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), hours, minutes, seconds));
  if (Number.isNaN(date.getTime()) || date.getUTCMonth() !== Number(m) - 1 || date.getUTCDate() !== Number(d)) return undefined;
  return date.toISOString();
}

// Day first when some a/b/YYYY date has a > 12 and none has b > 12; month
// first (English's default) otherwise.
function slashOrder(values) {
  let dayFirst = false;
  let monthFirst = false;
  for (const value of values) {
    const match = /^(\d{1,2})\/(\d{1,2})\/\d{4}/.exec(String(value || '').trim());
    if (!match) continue;
    if (Number(match[1]) > 12) dayFirst = true;
    if (Number(match[2]) > 12) monthFirst = true;
  }
  return dayFirst && !monthFirst ? 'dmy' : 'mdy';
}

// A Redmine number: "3.00", or "3,00" where the locale's decimal separator is a comma.
function redmineNumber(value) {
  const text = String(value || '').trim();
  if (!/^-?\d+(?:[.,]\d+)?$/.test(text)) return undefined;
  return Number(text.replace(',', '.'));
}

const issueRef = value => String(value || '').trim().replace(/^#/, '');

export function parseRedmineCsv(text) {
  const rows = readCsv(text, 'Redmine', redmineSeparator(text));
  if (!rows.length) throw new Error('Redmine CSV is empty');
  const header = rows[0].map(cell => cell.trim());
  const byLabel = new Map();
  for (const [field, label] of Object.entries(REDMINE_FIELDS)) byLabel.set(label.toLowerCase(), { field });
  for (const [key, field] of Object.entries(IMPORT_KEYS)) byLabel.set(key, { field });
  for (const relation of REDMINE_RELATIONS) {
    byLabel.set(relation.label.toLowerCase(), { relation });
    byLabel.set(relation.key, { relation });
  }
  const known = header.map(name => byLabel.get(name.toLowerCase()));
  if (!known.some(Boolean)) {
    throw new Error('Redmine CSV headers are not Redmine\'s English column names. Redmine writes the headers in the '
      + 'language of the user who exported, so export again with English as your language (My account), or rename the '
      + 'headers to English (#, Subject, Status, ...)');
  }
  const col = {};
  known.forEach((entry, index) => { if (entry && entry.field && col[entry.field] === undefined) col[entry.field] = index; });
  if (col.subject === undefined) throw new Error('Redmine CSV needs the Subject column');
  const relationCols = known.map((entry, index) => (entry && entry.relation ? { index, ...entry.relation } : null)).filter(Boolean);
  const customCols = header.map((name, index) => (name && !known[index] ? { index, name } : null)).filter(Boolean);
  const get = (cells, field) => (col[field] === undefined ? '' : String(cells[col[field]] || '').trim());

  const unsupported = REPORTED.filter(field => col[field] !== undefined)
    .map(field => ({ path: `/columns/${REDMINE_FIELDS[field]}`, reason: `Redmine column "${REDMINE_FIELDS[field]}" has no WeKan place and is not imported` }));
  if (col.parentSubject !== undefined && col.parent === undefined) {
    unsupported.push({ path: '/columns/Parent task subject', reason: 'Redmine column "Parent task subject" names a parent without its id and is not imported' });
  }
  const dateFields = ['start', 'due', 'created', 'closed'];
  const slash = slashOrder(rows.slice(1).flatMap(cells => dateFields.map(field => get(cells, field))));

  const columns = [];
  const swimlanes = [];
  const tasks = [];
  const links = [];
  rows.slice(1).forEach((cells, index) => {
    const at = `/row/${index + 2}`;
    const title = get(cells, 'subject');
    if (!title) { unsupported.push({ path: at, reason: 'a Redmine row without a subject is not imported' }); return; }
    const status = get(cells, 'status') || NO_STATUS;
    if (!columns.includes(status)) columns.push(status);
    const project = get(cells, 'project') || 'Default';
    if (!swimlanes.includes(project)) swimlanes.push(project);
    const date = field => {
      const value = get(cells, field);
      const iso = redmineDate(value, slash);
      if (value && !iso) unsupported.push({ path: `${at}/${REDMINE_FIELDS[field]}`, reason: `Redmine date "${value}" is not in a numeric date format` });
      return iso;
    };
    const custom = {};
    for (const [field, name] of Object.entries(CUSTOM)) {
      const value = get(cells, field);
      if (!value) continue;
      if (field === 'estimated' || field === 'done') {
        const number = redmineNumber(value);
        if (number === undefined) unsupported.push({ path: `${at}/${name}`, reason: `Redmine ${name} "${value}" is not a number` });
        else custom[name] = number;
      } else custom[name] = value;
    }
    for (const { index: c, name } of customCols) {
      const value = String(cells[c] || '').trim();
      if (value) custom[name] = value;
    }
    const ref = get(cells, 'id') || get(cells, 'uniqueId');
    const spentText = get(cells, 'spent');
    const spent = spentText ? redmineNumber(spentText) : undefined;
    if (spentText && spent === undefined) unsupported.push({ path: `${at}/Spent time`, reason: `Redmine Spent time "${spentText}" is not a number` });
    const tracker = get(cells, 'tracker');
    const owner = get(cells, 'assignee');
    const watchers = get(cells, 'watchers').split(/\r?\n/).map(name => name.trim()).filter(Boolean);
    const notes = get(cells, 'lastNotes');
    const parent = issueRef(get(cells, 'parent'));
    const taskIndex = tasks.length;

    // "Related issues": "<label> [(<delay>)] #<id>", comma-joined.
    const combined = get(cells, 'relations');
    if (combined) {
      for (const part of combined.split(',').map(s => s.trim()).filter(Boolean)) {
        const match = /^(.+?)\s+(?:\(([^)]*)\)\s+)?#(\d+)$/.exec(part);
        const relation = match && REDMINE_RELATIONS.find(r => r.label.toLowerCase() === match[1].trim().toLowerCase());
        if (!relation) { unsupported.push({ path: `${at}/Related issues`, reason: `Redmine relation "${part}" is not one of Redmine's English relation names` }); continue; }
        links.push({ from: taskIndex, ref: match[3], relation, delay: match[2], at: `${at}/Related issues` });
      }
    }
    // The importer's columns: one per type, "#12", "12" or a Unique ID, "12 3d".
    for (const relation of relationCols) {
      const value = String(cells[relation.index] || '').trim();
      if (!value) continue;
      for (const part of value.split(',').map(s => s.trim()).filter(Boolean)) {
        const match = /^(#?\d+|.+?)(?:\s+(-?\d+)d)?$/.exec(part);
        links.push({ from: taskIndex, ref: issueRef(match[1]), relation, delay: match[2], at: `${at}/${header[relation.index]}` });
      }
    }

    const closed = date('closed');
    tasks.push({
      title,
      description: get(cells, 'description'),
      column_name: status,
      swimlane_name: project,
      tags: tracker ? [tracker] : [],
      ...(ref ? { ref: issueRef(ref) } : {}),
      ...(parent ? { parent_ref: parent } : {}),
      ...(owner ? { owner_username: owner } : {}),
      ...(get(cells, 'author') ? { requested_by: get(cells, 'author') } : {}),
      ...(watchers.length ? { watchers } : {}),
      ...(date('created') ? { date_creation: date('created') } : {}),
      ...(date('start') ? { date_started: date('start') } : {}),
      ...(date('due') ? { date_due: date('due') } : {}),
      ...(closed ? { date_end: closed } : {}),
      ...(spent !== undefined && spent > 0 ? { spent_hours: spent } : {}),
      ...(notes ? { comments: [{ text: notes }] } : {}),
      ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
    });
  });

  // Redmine lists a relation on both of its issues ("Blocks #42" on #41,
  // "Blocked by #41" on #42); WeKan keeps it once, on the first card seen.
  const refs = new Map(tasks.map((task, index) => [task.ref, index]).filter(([ref]) => ref));
  const seen = new Set();
  for (const link of links) {
    if (link.relation.lossy) unsupported.push({ path: link.at, reason: `Redmine relation "${link.relation.label}" has no WeKan type and is imported as related-to` });
    if (link.delay) unsupported.push({ path: link.at, reason: `the delay of Redmine relation "${link.relation.label}" (${link.delay}) is not imported` });
    const task = tasks[link.from];
    const target = refs.get(link.ref);
    const type = link.relation.type;
    if (target !== undefined) {
      const key = `${link.from}>${target}:${type}`;
      if (seen.has(key) || seen.has(`${target}>${link.from}:${INVERSE[type]}`)) continue;
      seen.add(key);
    }
    (task.dependencies = task.dependencies || []).push({ ref: link.ref, type });
  }

  return {
    board: { name: 'Imported Redmine issues' },
    columns: columns.map(title => ({ title })),
    swimlanes: (swimlanes.length ? swimlanes : ['Default']).map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

// The relation columns the export writes, by WeKan dependency type. Fixes has
// no Redmine relation and is written as Related to.
const EXPORT_RELATIONS = ['Related to', 'Blocks', 'Blocked by', 'Is duplicate of', 'Has duplicate'];
const RELATION_FOR_TYPE = { 'related-to': 'Related to', blocks: 'Blocks', 'is-blocked-by': 'Blocked by',
  duplicates: 'Is duplicate of', 'is-duplicated-by': 'Has duplicate', fixes: 'Related to', 'is-fixed-by': 'Related to' };
export const REDMINE_EXPORT_COLUMNS = ['Unique ID', 'Project', 'Tracker', 'Status', 'Priority', 'Subject', 'Description',
  'Author', 'Assignee', 'Category', 'Target version', 'Start date', 'Due date', 'Estimated time', '% Done', 'Spent time',
  'Created', 'Closed', 'Parent task', ...EXPORT_RELATIONS];
const RESERVED = new Set(Object.values(CUSTOM).concat(REDMINE_EXPORT_COLUMNS, Object.values(REDMINE_FIELDS),
  REDMINE_RELATIONS.map(r => r.label)).map(name => name.toLowerCase()));

const field = value => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const valid = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const day = value => (valid(value) ? valid(value).toISOString().slice(0, 10) : '');
const time = value => (valid(value) ? valid(value).toISOString().slice(0, 16).replace('T', ' ') : '');
const decimal = value => (value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '');

// The columns Redmine's importer auto-maps, in English, with ',' and a byte
// order mark as Redmine writes UTF-8. The card's id is the Unique ID that
// Parent task and the relation columns refer to, so the importer links
// issues of the same file; dates are %Y-%m-%d, the importer's first format.
// Redmine has no labels: a card's first label is its Tracker.
export function formatRedmineCsv({ items }) {
  const list = Array.isArray(items) ? items : [];
  const extra = [];
  for (const item of list) {
    for (const name of Object.keys(item.customFields || {})) {
      if (!RESERVED.has(name.toLowerCase()) && !extra.includes(name)) extra.push(name);
    }
  }
  const columns = REDMINE_EXPORT_COLUMNS.concat(extra);
  const rows = [columns];
  const ids = new Set(list.map(item => item.cardId).filter(Boolean));
  for (const item of list) {
    const fields = item.customFields || {};
    const relations = {};
    for (const dep of Array.isArray(item.dependencies) ? item.dependencies : []) {
      if (!dep || !ids.has(dep.cardId)) continue;
      const name = RELATION_FOR_TYPE[dep.type] || 'Related to';
      (relations[name] = relations[name] || []).push(dep.cardId);
    }
    const values = {
      'Unique ID': item.cardId || '',
      Project: item.swimlaneTitle && item.swimlaneTitle !== 'Default' ? item.swimlaneTitle : '',
      Tracker: (Array.isArray(item.labels) && item.labels[0]) || '',
      Status: item.listTitle || NO_STATUS,
      Priority: fields.Priority || '',
      Subject: String(item.title || '').trim() || 'Untitled',
      Description: item.description || '',
      Author: item.requestedBy || item.creator || '',
      Assignee: item.owner || '',
      Category: fields.Category || '',
      'Target version': fields['Target version'] || '',
      'Start date': day(item.startAt),
      'Due date': day(item.dueAt),
      'Estimated time': decimal(fields['Estimated time']),
      '% Done': Number.isFinite(Number(fields['% Done'])) && fields['% Done'] !== '' && fields['% Done'] !== undefined
        ? String(Math.round(Number(fields['% Done']))) : '',
      'Spent time': Number(item.spentTime) > 0 ? decimal(item.spentTime) : '',
      Created: time(item.createdAt),
      Closed: time(item.endAt),
      'Parent task': item.parentCardId && ids.has(item.parentCardId) ? item.parentCardId : '',
    };
    for (const name of EXPORT_RELATIONS) values[name] = (relations[name] || []).join(', ');
    for (const name of extra) values[name] = fields[name] === undefined || fields[name] === null ? '' : fields[name];
    rows.push(columns.map(name => values[name]));
  }
  return `﻿${rows.map(cells => cells.map(field).join(',')).join('\r\n')}\r\n`;
}
