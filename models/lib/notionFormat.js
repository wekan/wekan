// Notion's "Markdown & CSV" export of a database, read as a board, and the
// CSV that Notion's own CSV import (Settings > Import > CSV, or a database's
// Merge with CSV) reads, written. Plain JavaScript, so
// tests/notionFormat.test.cjs runs the round trip in Node; the export .zip is
// opened on the server (server/lib/notionArchive.js).
//
// What Notion documents (its help pages "Export your content" and "Import
// data into Notion"):
//   - Markdown & CSV exports a full-page database as a CSV file, with a
//     Markdown file for each of its pages; a non-database page is a Markdown
//     file. Only the current or the default view is exported.
//   - Include subpages / Create folders for subpages put pages in nested
//     folders, or all in one folder.
//   - A re-upload does not recreate a workspace, but the CSV importer turns a
//     CSV into a database: the first row is the header, rows are pages,
//     columns are properties, the file is UTF-8, dates import as MM/DD/YYYY,
//     and merging into a database needs headers that match its property names.
// What is only observed by third-party converters, and so is read leniently
// and never required:
//   - every exported file and folder name ends in a space and a 32-hex page
//     id ("Tasks 1a2b...c6.csv"), removed from names here;
//   - some databases also have a "<name> <id>_all.csv" with every row, not
//     only the exported view's; it is preferred when both are there;
//   - the first column is the title; multi-select and person cells are
//     joined with ", "; dates are written "October 8, 2026", with a time
//     "October 8, 2026 3:04 PM", and a range "A → B"; checkboxes "Yes"/"No";
//     relations are the related page's title and its encoded path or URL;
//   - a row's page file is "# Title", a blank line, one "Property: value"
//     line per non-empty property, a blank line, then the page body.
//
// A board view is only a view: the property it groups by is an ordinary
// column, and which one is not exported. The import cannot ask, so a column
// named Status is the list; without one, the first column whose values look
// like a select's is, and the choice is said in the import report.
//
// A column maps to:
//   Name / Title (else the first)  -> card title
//   Status (else a select column)  -> list, in the order values first appear
//   Tags / Labels / Categories /
//   Multi-select                   -> labels (split on ",")
//   Assignee / Assignees / Owner /
//   Person / People / Responsible  -> owner, then further assignees
//   Created by                     -> Requested by
//   Description / Notes            -> description, before the page body
//   a date column named Start      -> start date
//   Created / Created time         -> creation date
//   Completed / Done / End date    -> end date
//   the first other date column    -> due date; a range "A → B" is start
//                                     and due
//   Swimlane (what WeKan writes)   -> swimlane
//   Yes/No columns                 -> checkbox custom fields
//   number columns                 -> number custom fields
//   every other column             -> text custom fields
// Reported, never guessed: relation columns, Last edited time, the second and
// later date columns' meaning (they are kept as text fields), the page files
// that match no row, nested subpages, images and other files in the export,
// and links in a page body that point into the export.

import { readCsv } from './todoistCsvFormat.js';

export const MAX_NOTION_CSV_CHARS = 32 * 1024 * 1024;
export const MAX_NOTION_DATABASES = 50;
export const NOTION_EXPORT_COLUMNS = ['Name', 'Status', 'Assignee', 'Tags', 'Start', 'Due', 'Description'];
const NO_STATUS = 'No Status';
const RANGE = /\s+(?:→|->)\s+/;
const ID_SUFFIX = /\s+[0-9a-f]{32}$/i;

const str = value => (value === undefined || value === null ? '' : String(value));
const lower = value => str(value).trim().toLowerCase();

// "Tasks 1a2b...c6_all.csv" or "Tasks 1a2b...c6" -> "Tasks".
export function stripNotionId(name) {
  let text = str(name).replace(/^.*[\\/]/, '').trim();
  text = text.replace(/\.(csv|md)$/i, '').replace(/_all$/i, '');
  return text.replace(ID_SUFFIX, '').trim();
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october',
  'november', 'december'];
const utc = (y, m, d, h = 0, min = 0) => {
  const date = new Date(Date.UTC(y, m - 1, d, h, min));
  return Number.isNaN(date.getTime()) || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d ? undefined : date;
};
const clock = (hours, minutes, meridiem) => {
  let h = Number(hours);
  const m = Number(minutes || 0);
  if (meridiem) {
    if (h < 1 || h > 12) return undefined;
    h = (h % 12) + (/^p/i.test(meridiem) ? 12 : 0);
  }
  return h > 23 || m > 59 ? undefined : [h, m];
};

// One Notion date cell (not a range) as ISO; undefined when it is not one.
// Notion writes no time zone in the export (a "(GMT+3)" style suffix is read
// when present); times without one are taken as UTC.
export function notionDate(value) {
  let text = str(value).trim();
  if (!text) return undefined;
  let offset = 0;
  const zone = /\s*\((?:GMT|UTC)(?:([+-])(\d{1,2})(?::?(\d{2}))?)?\)$/i.exec(text);
  if (zone) {
    if (zone[1]) offset = (zone[1] === '-' ? -1 : 1) * (Number(zone[2]) * 60 + Number(zone[3] || 0));
    text = text.slice(0, zone.index).trim();
  }
  let date;
  let match = /^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*([AaPp][Mm])?)?$/.exec(text);
  if (match) {
    const month = MONTHS.findIndex(name => name === match[1].toLowerCase() || (match[1].length >= 3 && name.startsWith(match[1].toLowerCase())));
    if (month === -1) return undefined;
    const time = match[4] ? clock(match[4], match[5], match[6]) : [0, 0];
    if (!time) return undefined;
    date = utc(Number(match[3]), month + 1, Number(match[2]), time[0], time[1]);
  } else if ((match = /^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(text))) {
    date = utc(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4] || 0), Number(match[5] || 0));
  } else if ((match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*([AaPp][Mm])?)?$/.exec(text))) {
    // MM/DD/YYYY: the format Notion's CSV import reads, and WeKan's export writes.
    const time = match[4] ? clock(match[4], match[5], match[6]) : [0, 0];
    if (!time) return undefined;
    date = utc(Number(match[3]), Number(match[1]), Number(match[2]), time[0], time[1]);
  }
  if (!date) return undefined;
  return new Date(date.getTime() - offset * 60000).toISOString();
}

// A date cell, a single date or a range: { start, end } as ISO, or undefined.
export function notionDateRange(value) {
  const text = str(value).trim();
  if (!text) return undefined;
  const parts = text.split(RANGE);
  if (parts.length > 2) return undefined;
  if (parts.length === 2) {
    const start = notionDate(parts[0]);
    // "October 8, 2026 3:00 PM → 5:00 PM": the end is a time on the same day.
    let end = notionDate(parts[1]);
    if (!end && start) {
      const time = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/.exec(parts[1].trim());
      const hm = time && clock(time[1], time[2], time[3]);
      if (hm) end = notionDate(`${parts[0].trim().replace(/\s+\d{1,2}:\d{2}\s*([AaPp][Mm])?$/, '')} ${time[0]}`);
    }
    return start && end ? { start, end } : undefined;
  }
  const single = notionDate(text);
  return single ? { start: single } : undefined;
}

const splitList = value => str(value).split(',').map(part => part.trim()).filter(Boolean);
const TITLE = /^(name|title|task|task name|page)$/;
const STATUS = /^status$/;
const LABELS = /^(tags?|labels?|categor(y|ies)|multi-?select)$/;
const PEOPLE = /^(assignees?|assigned to|owners?|person|people|responsible|members?)$/;
const CREATOR = /^created by$/;
const DESCRIPTION = /^(description|notes?)$/;
const SWIMLANE = /^swimlane$/;
const START = /^(start|start date|starts|begin|begins)$/;
const CREATED = /^(created|created time|created at|date created)$/;
const EDITED = /^(last edited|last edited time|updated|last updated)$/;
const ENDED = /^(completed|completed on|completed at|done|done on|end|end date|finished|finished on)$/;
const DUE_NAME = /(due|deadline|date)/;
const RELATION = /\.md\)|(?:^|[\s(])https?:\/\/(?:www\.)?notion\.(?:so|site|com)\//i;
const YES_NO = /^(yes|no)$/i;
const UNSAFE_NAMES = new Set(['__proto__', 'constructor', 'prototype']);

// What kind of property a column holds, from its name and its values.
function classify(name, values) {
  const filled = values.filter(v => v.trim() !== '');
  const key = lower(name);
  if (filled.length && filled.some(v => RELATION.test(v))) return 'relation';
  if (filled.length && filled.every(v => notionDateRange(v))) return 'date';
  if (filled.length && filled.every(v => YES_NO.test(v.trim()))) return 'checkbox';
  if (filled.length && filled.every(v => /^-?\d+(\.\d+)?$/.test(v.trim()))) return 'number';
  if (LABELS.test(key)) return 'labels';
  if (PEOPLE.test(key)) return 'people';
  if (CREATOR.test(key)) return 'creator';
  if (DESCRIPTION.test(key)) return 'description';
  if (SWIMLANE.test(key)) return 'swimlane';
  return 'text';
}

// Does a text column look like a single select: short, one value per cell,
// and fewer distinct values than rows (or a handful)?
function looksLikeSelect(values) {
  const filled = values.map(v => v.trim()).filter(Boolean);
  if (!filled.length) return false;
  if (filled.some(v => v.length > 60 || /[\r\n]/.test(v) || /,\s/.test(v))) return false;
  const distinct = new Set(filled).size;
  return distinct <= Math.max(1, Math.min(20, Math.ceil(filled.length * 0.75)));
}

// A row's page file: drop "# Title" and the "Property: value" lines, keep the body.
export function notionPageBody(text, headers) {
  const names = new Set((headers || []).map(lower));
  const lines = str(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i += 1;
  let heading = '';
  if (i < lines.length && /^#\s+/.test(lines[i])) { heading = lines[i].replace(/^#\s+/, '').trim(); i += 1; }
  while (i < lines.length && !lines[i].trim()) i += 1;
  while (i < lines.length) {
    const prop = /^([^:\n]{1,200}):\s?(.*)$/.exec(lines[i]);
    if (!prop || !names.has(lower(prop[1]))) break;
    i += 1;
  }
  while (i < lines.length && !lines[i].trim()) i += 1;
  return { heading, body: lines.slice(i).join('\n').replace(/\s+$/, '') };
}

const normalTitle = value => lower(value).replace(/[^\p{L}\p{N}]+/gu, '');

// One database: its CSV text and the page files of its rows.
function parseDatabase(database, index, swimlaneName, state) {
  const { unsupported, warnings, columns } = state;
  const at = `/databases/${index}`;
  const label = database.name ? `"${database.name}"` : 'the CSV';
  const csv = str(database.csv);
  if (csv.length > MAX_NOTION_CSV_CHARS) throw new Error(`Notion CSV is larger than ${MAX_NOTION_CSV_CHARS} characters`);
  const rows = readCsv(csv, 'Notion');
  if (!rows.length) {
    unsupported.push({ path: at, reason: `Notion database ${label} is empty` });
    return [];
  }
  const header = rows[0].map(cell => cell.replace(/^﻿/, '').trim());
  const body = rows.slice(1);
  const values = c => body.map(cells => str(cells[c]));
  let titleCol = header.findIndex(name => TITLE.test(lower(name)));
  if (titleCol === -1) titleCol = 0;
  const kinds = header.map((name, c) => (c === titleCol ? 'title' : classify(name, values(c))));
  // The list column: Status by name, else the first select-looking text column.
  let groupCol = header.findIndex((name, c) => c !== titleCol && STATUS.test(lower(name)));
  if (groupCol === -1) {
    groupCol = header.findIndex((name, c) => kinds[c] === 'text' && !UNSAFE_NAMES.has(name) && looksLikeSelect(values(c)));
    if (groupCol !== -1) {
      warnings.push({ path: `${at}/columns/${header[groupCol]}`, reason: `Notion database ${label} has no Status column; "${header[groupCol]}" looks like a select and its values became the lists` });
    } else {
      warnings.push({ path: `${at}/columns`, reason: `Notion database ${label} has no Status column and no select-like column; every card is in the list "${NO_STATUS}"` });
    }
  }
  if (groupCol !== -1) kinds[groupCol] = 'group';
  // Dates: start, creation, end by name, the first other one is the due date.
  header.forEach((name, c) => {
    if (kinds[c] !== 'date') return;
    const key = lower(name);
    if (START.test(key)) kinds[c] = 'start';
    else if (CREATED.test(key)) kinds[c] = 'created';
    else if (EDITED.test(key)) kinds[c] = 'edited';
    else if (ENDED.test(key)) kinds[c] = 'end';
  });
  let dueCol = header.findIndex((name, c) => kinds[c] === 'date' && DUE_NAME.test(lower(name)));
  if (dueCol === -1) dueCol = kinds.indexOf('date');
  if (dueCol !== -1) kinds[dueCol] = 'due';
  header.forEach((name, c) => {
    if (kinds[c] === 'date') {
      warnings.push({ path: `${at}/columns/${name}`, reason: `Notion date column "${name}" is not the due date ("${header[dueCol]}" is); it is kept as a text field` });
      kinds[c] = 'text';
    }
  });
  // Only the first person column is the owner and assignees.
  const peopleCol = kinds.indexOf('people');
  header.forEach((name, c) => {
    // A property name is the user's own text; these would reach an object's prototype.
    if (UNSAFE_NAMES.has(name) && !['title', 'group'].includes(kinds[c])) {
      unsupported.push({ path: `${at}/columns/${c + 1}`, reason: `Notion column "${name}" is not imported: the name is reserved` });
      kinds[c] = 'skip';
      return;
    }
    if (kinds[c] === 'people' && c !== peopleCol) kinds[c] = 'text';
    if (kinds[c] === 'relation') {
      unsupported.push({ path: `${at}/columns/${name}`, reason: `Notion relation column "${name}" links to other pages; relations are not imported` });
    }
    if (kinds[c] === 'edited') {
      unsupported.push({ path: `${at}/columns/${name}`, reason: `Notion column "${name}" (last edited time) has no WeKan place and is not imported` });
    }
  });

  const pool = (Array.isArray(database.pages) ? database.pages : [])
    .map(page => ({ name: stripNotionId(page.name), text: str(page.text), used: false }));
  const parsedPages = pool.map(page => ({ page, ...notionPageBody(page.text, header) }));
  const findPage = title => {
    const want = normalTitle(title);
    if (!want) return undefined;
    const exact = parsedPages.find(p => !p.page.used && normalTitle(p.heading) === want)
      || parsedPages.find(p => !p.page.used && normalTitle(p.page.name) === want)
      // Notion shortens long file names; a prefix of the title is the same page.
      || parsedPages.find(p => !p.page.used && !p.heading && normalTitle(p.page.name).length >= 20 && want.startsWith(normalTitle(p.page.name)));
    if (exact) exact.page.used = true;
    return exact;
  };

  const tasks = [];
  body.forEach((cells, r) => {
    const rowAt = `${at}/row/${r + 2}`;
    const get = c => (c === -1 ? '' : str(cells[c]).trim());
    const title = get(titleCol);
    if (!title) { unsupported.push({ path: rowAt, reason: 'a Notion row without a title is not imported' }); return; }
    const status = groupCol === -1 ? NO_STATUS : get(groupCol) || NO_STATUS;
    if (!columns.includes(status)) columns.push(status);
    const task = { title, column_name: status, swimlane_name: swimlaneName, tags: [] };
    const custom = {};
    const description = [];
    header.forEach((name, c) => {
      const value = get(c);
      if (!value) return;
      switch (kinds[c]) {
        case 'labels': task.tags.push(...splitList(value)); break;
        case 'people': {
          const people = splitList(value);
          task.owner_username = people[0];
          if (people.length > 1) task.assignees = people.slice(1);
          break;
        }
        case 'creator': task.requested_by = splitList(value)[0]; break;
        case 'description': description.push(value); break;
        case 'swimlane': task.swimlane_name = value; break;
        case 'start': task.date_started = notionDateRange(value).start; break;
        case 'created': task.date_creation = notionDateRange(value).start; break;
        case 'end': task.date_end = notionDateRange(value).end || notionDateRange(value).start; break;
        case 'due': {
          const range = notionDateRange(value);
          if (range.end) {
            if (!task.date_started) task.date_started = range.start;
            task.date_due = range.end;
          } else task.date_due = range.start;
          break;
        }
        case 'checkbox': custom[name] = /^yes$/i.test(value); break;
        case 'number': custom[name] = Number(value); break;
        case 'text': custom[name] = value; break;
        default: break;
      }
    });
    const page = findPage(title);
    if (page) {
      if (page.body) description.push(page.body);
      if (/\]\((?!https?:|mailto:|#)[^)\s]+\)/i.test(page.body)) {
        unsupported.push({ path: `${rowAt}/page`, reason: `the page of "${title}" links to files or pages inside the export; they are not imported and the links are kept as text` });
      }
    }
    if (description.length) task.description = description.join('\n\n');
    if (Object.keys(custom).length) task.custom_fields = custom;
    if (!task.tags.length) delete task.tags;
    tasks.push(task);
  });
  const unmatched = pool.filter(page => !page.used).length;
  if (unmatched) {
    unsupported.push({ path: `${at}/pages`, reason: `${unmatched} page file(s) of Notion database ${label} match no row and are not imported` });
  }
  return tasks;
}

// The import: the text of one database CSV, or what server/lib/notionArchive.js
// read from the export .zip: { databases: [{ name, csv, pages: [{ name, text }] }],
// assets, nested, other }.
export function parseNotionExport(input) {
  let source = input;
  if (typeof source === 'string') {
    if (!source.trim()) throw new Error('Notion CSV is empty');
    source = { databases: [{ name: '', csv: source, pages: [] }] };
  }
  if (!source || typeof source !== 'object' || !Array.isArray(source.databases)) {
    throw new Error('Notion import needs a database CSV or the Markdown & CSV export .zip');
  }
  const databases = source.databases.filter(db => db && str(db.csv).trim());
  if (!databases.length) throw new Error('Notion export has no database CSV');
  if (databases.length > MAX_NOTION_DATABASES) throw new Error(`Notion export has more than ${MAX_NOTION_DATABASES} databases`);
  const state = { unsupported: [], warnings: [], columns: [] };
  const several = databases.length > 1;
  const tasks = [];
  const swimlanes = [];
  databases.forEach((database, index) => {
    const name = stripNotionId(database.name) || (several ? `Database ${index + 1}` : '');
    const swimlane = several ? name : 'Default';
    tasks.push(...parseDatabase({ ...database, name }, index, swimlane, state));
  });
  for (const task of tasks) if (!swimlanes.includes(task.swimlane_name)) swimlanes.push(task.swimlane_name);
  if (num(source.assets)) {
    state.unsupported.push({ path: '/files', reason: `${source.assets} image(s) or other file(s) in the Notion export are not imported` });
  }
  if (num(source.nested)) {
    state.unsupported.push({ path: '/subpages', reason: `${source.nested} nested subpage file(s) in the Notion export are not imported` });
  }
  if (num(source.other)) {
    state.unsupported.push({ path: '/pages', reason: `${source.other} Markdown page(s) outside any database are not imported` });
  }
  for (const entry of Array.isArray(source.skipped) ? source.skipped : []) state.unsupported.push(entry);
  const first = stripNotionId(databases[0].name);
  return {
    board: { name: !several && first ? first : 'Imported Notion database' },
    columns: state.columns.map(title => ({ title })),
    swimlanes: (swimlanes.length ? swimlanes : ['Default']).map(name => ({ name })),
    tasks,
    warnings: state.warnings,
    unsupported: state.unsupported,
  };
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// One CSV field, RFC 4180 quoting.
const field = value => {
  const text = str(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
// MM/DD/YYYY, the date format Notion's CSV import reads; a day in UTC.
const usDate = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}/${date.getUTCFullYear()}`;
};

// The CSV Notion's CSV import reads: the title first, one column per
// property, UTF-8. A Swimlane column is written when the board has more than
// one swimlane; custom fields follow in the order they first appear.
export function formatNotionCsv({ items } = {}) {
  const list = Array.isArray(items) ? items : [];
  const lanes = new Set(list.map(item => str(item.swimlaneTitle) || 'Default'));
  const withLanes = lanes.size > 1;
  const customNames = [];
  for (const item of list) {
    for (const name of Object.keys(item.customFields || {})) {
      if (!customNames.includes(name) && !UNSAFE_NAMES.has(name) && !NOTION_EXPORT_COLUMNS.some(c => lower(c) === lower(name)) && lower(name) !== 'swimlane') {
        customNames.push(name);
      }
    }
  }
  const columns = [...NOTION_EXPORT_COLUMNS, ...(withLanes ? ['Swimlane'] : []), ...customNames];
  const rows = [columns];
  for (const item of list) {
    const people = [item.owner, ...(Array.isArray(item.assignees) ? item.assignees : [])]
      .map(person => str(person).replace(/,/g, ' ').trim()).filter(Boolean);
    const values = {
      Name: str(item.title).trim() || 'Untitled',
      Status: str(item.listTitle),
      Assignee: [...new Set(people)].join(', '),
      Tags: (Array.isArray(item.labels) ? item.labels : []).map(label => str(label).replace(/,/g, ' ').trim()).filter(Boolean).join(', '),
      Start: usDate(item.startAt),
      Due: usDate(item.dueAt),
      Description: str(item.description),
      Swimlane: str(item.swimlaneTitle) || 'Default',
    };
    const fields = item.customFields || {};
    for (const name of customNames) {
      const value = fields[name];
      values[name] = typeof value === 'boolean' ? (value ? 'Yes' : 'No')
        : value === undefined || value === null ? '' : str(value);
    }
    rows.push(columns.map(name => values[name] || ''));
  }
  return `${rows.map(cells => cells.map(field).join(',')).join('\r\n')}\r\n`;
}
