// Which column of a CSV/TSV text or an Excel sheet holds which card field, and
// what the rows become. The import page asks the person to confirm the
// columns (client/components/import/csvMapping.js), the server checks what it
// is sent and the CSV creator (models/csvCreator.js) writes the plan this
// module makes. Plain JavaScript with no Meteor, so tests/csvImportMapping.test.cjs
// runs it in Node.
//
// A header is recognised by the English names other tools use AND by the
// names WeKan's own CSV and Excel exports write. Those exports translate their
// headers into the exporting user's language, so a WeKan export made in
// Finnish says "Otsikko", not "Title": the import is given every language's
// value of the i18n keys below (server/lib/importHeaderNames.js) and matches
// against them too.

// Every field the mapping step offers, in the order it shows them.
//   field      - the key used in a mapping's `columns`
//   label      - the i18n key the step shows for it
//   exportKeys - the i18n keys WeKan's exports write as this column's header
//   aliases    - English header names, lowercase
export const CSV_IMPORT_FIELDS = [
  { field: 'title', label: 'title', exportKeys: ['title'],
    aliases: ['title', 'name', 'card', 'card title', 'card name', 'task', 'task name', 'summary', 'subject'] },
  { field: 'description', label: 'description', exportKeys: ['description'],
    aliases: ['description', 'desc', 'details', 'notes', 'body'] },
  { field: 'list', label: 'list', exportKeys: ['list'],
    aliases: ['list', 'list name', 'stage', 'status', 'state', 'column'] },
  { field: 'swimlane', label: 'swimlane', exportKeys: ['swimlane'], aliases: ['swimlane', 'lane'] },
  { field: 'owner', label: 'owner', exportKeys: ['owner'], aliases: ['owner', 'creator', 'created by', 'author'] },
  { field: 'members', label: 'members', exportKeys: ['members'], aliases: ['members', 'member'] },
  { field: 'assignees', label: 'assignee', exportKeys: ['assignee'],
    aliases: ['assignee', 'assignees', 'assigned to'] },
  { field: 'labels', label: 'labels', exportKeys: ['labels'], aliases: ['labels', 'label', 'tags', 'tag'] },
  { field: 'receivedAt', label: 'card-received', exportKeys: ['card-received'],
    aliases: ['received', 'received at', 'received date'] },
  { field: 'startAt', label: 'card-start', exportKeys: ['card-start'],
    aliases: ['start', 'start date', 'start at'] },
  { field: 'dueAt', label: 'card-due', exportKeys: ['card-due'],
    aliases: ['due', 'due date', 'due at', 'deadline'] },
  { field: 'endAt', label: 'card-end', exportKeys: ['card-end'],
    aliases: ['end', 'end date', 'end at', 'finish date', 'finished at'] },
  { field: 'createdAt', label: 'createdAt', exportKeys: ['createdAt'],
    aliases: ['created at', 'creation date', 'created'] },
  { field: 'modifiedAt', label: 'last-modified-at', exportKeys: ['last-modified-at'],
    aliases: ['modified at', 'updated at', 'update date', 'modified on', 'last modified at'] },
  { field: 'requestedBy', label: 'requested-by', exportKeys: ['requested-by'],
    aliases: ['requested by', 'requester'] },
  { field: 'assignedBy', label: 'assigned-by', exportKeys: ['assigned-by'],
    aliases: ['assigned by', 'assigner'] },
  { field: 'parentCard', label: 'parent-card', exportKeys: ['parent-card'], aliases: ['parent card', 'parent'] },
  { field: 'spentTime', label: 'spent-time-hours', exportKeys: ['spent-time-hours'],
    aliases: ['spent time', 'spent time (hours)'] },
  { field: 'isOvertime', label: 'overtime-hours', exportKeys: ['overtime-hours'],
    aliases: ['overtime', 'overtime (hours)'] },
  { field: 'archived', label: 'archived', exportKeys: ['archived'], aliases: ['archived'] },
];

export const CSV_IMPORT_FIELD_NAMES = CSV_IMPORT_FIELDS.map(f => f.field);

// Columns WeKan's exports write that are not imported: they still show that a
// row is a WeKan export header. The Excel export's second sheet ("Activity")
// is recognised by its own keys and skipped.
export const EXPORT_ONLY_KEYS = ['number', 'last-activity', 'voting'];
export const ACTIVITY_SHEET_KEYS = ['activity', 'card'];

export const HEADER_I18N_KEYS = [
  ...new Set([...CSV_IMPORT_FIELDS.flatMap(f => f.exportKeys), ...EXPORT_ONLY_KEYS, ...ACTIVITY_SHEET_KEYS]),
];

// A list name every card goes into when the file has no list column and the
// request names none (a REST import, "Import many boards"). The page sends
// the same text translated.
export const DEFAULT_LIST_NAME = 'To do';
export const MAX_LIST_NAME = 255;
const MAX_COLUMNS = 10000;

// The separator of a CSV/TSV text, from its first line: a tab when the line
// has one, so a TSV value that holds a comma stays one value; otherwise a
// semicolon when the line has more of them than commas (a spreadsheet saved in
// a locale whose decimal mark is a comma), otherwise a comma.
export function csvSeparatorOf(text) {
  const first = String(text == null ? '' : text).replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0];
  if (first.includes('\t')) return '\t';
  return (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
}

// Only the header keys of one language's translation file.
export function pickHeaderTranslations(data) {
  const out = {};
  for (const key of HEADER_I18N_KEYS) {
    if (data && typeof data[key] === 'string' && data[key].trim()) out[key] = data[key];
  }
  return out;
}

export function normalizeHeader(value) {
  if (value == null) return '';
  return String(value).replace(/\s+/g, ' ').trim().replace(/:$/, '').trim().toLocaleLowerCase();
}

const isCustomFieldHeader = header => normalizeHeader(header).startsWith('customfield');

// For each language, header text -> i18n keys it is the translation of.
// Built once per translations object: a workbook's header search asks for it
// for every row it looks at.
const indexCache = new WeakMap();
function translationIndex(translations) {
  if (translations && typeof translations === 'object' && indexCache.has(translations)) {
    return indexCache.get(translations);
  }
  const index = {};
  for (const [lang, keys] of Object.entries(translations || {})) {
    const map = new Map();
    for (const [key, value] of Object.entries(keys || {})) {
      const name = normalizeHeader(value);
      if (!name) continue;
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(key);
    }
    index[lang] = map;
  }
  if (translations && typeof translations === 'object') indexCache.set(translations, index);
  return index;
}

const fieldByExportKey = new Map();
CSV_IMPORT_FIELDS.forEach(f => f.exportKeys.forEach(key => fieldByExportKey.set(key, f.field)));
const fieldByAlias = new Map();
CSV_IMPORT_FIELDS.forEach(f => f.aliases.forEach(alias => { if (!fieldByAlias.has(alias)) fieldByAlias.set(alias, f.field); }));

// The language whose export headers match the most cells of this row. English
// wins a tie, so an English file is read with English names first.
function bestLanguage(names, index) {
  let best = null;
  let bestCount = 0;
  for (const [lang, map] of Object.entries(index)) {
    const count = names.filter(name => name && map.has(name)).length;
    if (count > bestCount || (count === bestCount && count > 0 && lang === 'en')) {
      best = lang;
      bestCount = count;
    }
  }
  return best;
}

// The candidate fields of one header, best first: the file's own language,
// then the English names, then any language.
function candidatesFor(name, lang, index) {
  const out = [];
  const add = field => { if (field && !out.includes(field)) out.push(field); };
  const keysIn = map => (map && map.get(name)) || [];
  if (lang) keysIn(index[lang]).forEach(key => add(fieldByExportKey.get(key)));
  add(fieldByAlias.get(name));
  for (const map of Object.values(index)) keysIn(map).forEach(key => add(fieldByExportKey.get(key)));
  return out;
}

// What the header names say, as a mapping: { columns: { field: index },
// customFieldColumns: [] }. A file with no recognised title column takes its
// first ordinary column as the title, so a plain one-column list of tasks
// still imports.
export function guessCsvMapping(header, translations = {}) {
  const row = Array.isArray(header) ? header : [];
  const names = row.map(normalizeHeader);
  const index = translationIndex(translations);
  const lang = bestLanguage(names, index);
  const layout = exportLayoutOf(names, lang, index);
  if (layout) return { columns: layout, customFieldColumns: [] };
  const columns = {};
  const taken = new Set();
  names.forEach((name, i) => {
    if (!name || isCustomFieldHeader(name)) return;
    const field = candidatesFor(name, lang, index).find(f => !taken.has(f));
    if (field) {
      columns[field] = i;
      taken.add(field);
    }
  });
  if (columns.title === undefined) {
    const used = new Set(Object.values(columns));
    const first = names.findIndex((name, i) => name && !used.has(i) && !isCustomFieldHeader(name)
      && !knownHeader(name, index));
    if (first !== -1) columns.title = first;
  }
  return { columns, customFieldColumns: [] };
}

// The column order of WeKan's own exports: models/exporter.js (CSV/TSV) and
// models/server/ExporterExcel.js (the Excel table).
export const CSV_EXPORT_LAYOUT = ['title', 'description', 'list', 'swimlane', 'owner', 'requested-by',
  'assigned-by', 'members', 'assignee', 'labels', 'card-start', 'card-due', 'card-end', 'overtime-hours',
  'spent-time-hours', 'createdAt', 'last-modified-at', 'last-activity', 'voting', 'archived'];
export const EXCEL_EXPORT_LAYOUT = ['number', 'title', 'description', 'parent-card', 'owner', 'createdAt',
  'last-modified-at', 'card-received', 'card-start', 'card-due', 'card-end', 'list', 'swimlane', 'assignee',
  'members', 'requested-by', 'assigned-by', 'labels', 'overtime-hours', 'spent-time-hours'];

// A header that is exactly one of WeKan's export layouts, in one language, is
// read by position. Some languages translate two of these keys with the same
// word ("Owner" and "Assigned By" are one word in Latvian), and a name alone
// cannot say which of the two columns is which; their places can.
function exportLayoutOf(names, lang, index) {
  const map = lang && index[lang];
  if (!map) return null;
  for (const layout of [CSV_EXPORT_LAYOUT, EXCEL_EXPORT_LAYOUT]) {
    if (names.length < layout.length) continue;
    const fits = layout.every((key, i) => (map.get(names[i]) || []).includes(key));
    const rest = names.slice(layout.length).every(name => !name || isCustomFieldHeader(name));
    if (!fits || !rest) continue;
    const columns = {};
    layout.forEach((key, i) => {
      const field = fieldByExportKey.get(key);
      if (field) columns[field] = i;
    });
    return columns;
  }
  return null;
}

function knownHeader(name, index) {
  if (fieldByAlias.has(name)) return true;
  return Object.values(index).some(map => map.has(name));
}

// How much a row looks like a header: the number of its cells that are a
// known column name, and whether one of them is the title.
export function scoreHeaderRow(row, translations = {}) {
  const index = translationIndex(translations);
  const names = (Array.isArray(row) ? row : []).map(normalizeHeader);
  const lang = bestLanguage(names, index);
  let score = 0;
  let hasTitle = false;
  let activity = 0;
  names.forEach(name => {
    if (!name) return;
    const keys = [];
    if (lang && index[lang].has(name)) keys.push(...index[lang].get(name));
    else for (const map of Object.values(index)) if (map.has(name)) keys.push(...map.get(name));
    const alias = fieldByAlias.get(name);
    if (keys.length || alias || isCustomFieldHeader(name)) score += 1;
    if (alias === 'title' || keys.includes('title')) hasTitle = true;
    if (keys.some(key => ACTIVITY_SHEET_KEYS.includes(key))) activity += 1;
  });
  return { score, hasTitle, activity };
}

// The row of a sheet that is its header: row 1 when it has a title column,
// otherwise the row among the first 30 with the most known column names - a
// WeKan Excel export puts the board's title, description, dates and members
// above its table, whose header is row 7. A row below row 1 needs several
// known names, so a stray "Title" in a sheet's notes is not taken for one.
export function findHeaderRow(rows, translations = {}) {
  const limit = Math.min((rows || []).length, 30);
  let best = -1;
  let bestScore = 0;
  for (let i = 0; i < limit; i += 1) {
    const { score, hasTitle, activity } = scoreHeaderRow(rows[i], translations);
    if (!hasTitle || activity >= 2) continue;
    if (i === 0 && score >= 1) return 0;
    if (score >= 4 && score > bestScore) {
      best = i;
      bestScore = score;
    }
  }
  return best;
}

// Type check for the importBoard method's check(): the shape only. Whether the
// column numbers exist in the file is checked against its header by
// validateCsvMapping().
export function isCsvMappingShape(mapping) {
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) return false;
  if (Object.getPrototypeOf(mapping) !== Object.prototype && Object.getPrototypeOf(mapping) !== null) return false;
  const allowed = ['columns', 'listName', 'customFieldColumns'];
  if (Object.keys(mapping).some(key => !allowed.includes(key))) return false;
  const isIndex = v => Number.isInteger(v) && v >= 0 && v < MAX_COLUMNS;
  if (mapping.columns !== undefined) {
    const { columns } = mapping;
    if (!columns || typeof columns !== 'object' || Array.isArray(columns)) return false;
    for (const [field, value] of Object.entries(columns)) {
      if (!CSV_IMPORT_FIELD_NAMES.includes(field) || !isIndex(value)) return false;
    }
  }
  if (mapping.listName !== undefined
    && (typeof mapping.listName !== 'string' || mapping.listName.length > MAX_LIST_NAME)) return false;
  if (mapping.customFieldColumns !== undefined) {
    const list = mapping.customFieldColumns;
    if (!Array.isArray(list) || list.length > 1000 || !list.every(isIndex)) return false;
  }
  return true;
}

// A mapping sent with an import, checked against the file's header. Returns a
// clean copy; throws an Error naming what is wrong.
export function validateCsvMapping(mapping, headerLength) {
  if (!isCsvMappingShape(mapping)) throw new Error('The column mapping is not valid');
  const columns = { ...(mapping.columns || {}) };
  for (const [field, index] of Object.entries(columns)) {
    if (index >= headerLength) throw new Error(`The file has no column ${index + 1} for ${field}`);
  }
  const customFieldColumns = [...(mapping.customFieldColumns || [])];
  const used = new Set(Object.values(columns));
  const seen = new Set();
  for (const index of customFieldColumns) {
    if (index >= headerLength) throw new Error(`The file has no column ${index + 1}`);
    if (seen.has(index)) throw new Error(`Column ${index + 1} is chosen twice as a custom field`);
    if (used.has(index)) throw new Error(`Column ${index + 1} is already a card field`);
    seen.add(index);
  }
  const listName = typeof mapping.listName === 'string' ? mapping.listName.trim() : '';
  return { columns, customFieldColumns, ...(listName ? { listName } : {}) };
}

// The mapping an import uses: the one sent with it, checked, or the guess.
export function resolveCsvMapping(header, mapping, translations = {}) {
  const length = Array.isArray(header) ? header.length : 0;
  if (mapping !== undefined && mapping !== null) return validateCsvMapping(mapping, length);
  return guessCsvMapping(header, translations);
}

// The CustomField-NAME-TYPE[-OPTIONS] columns WeKan's CSV export writes, and
// the ordinary columns the mapping chose to import as text custom fields.
export function customFieldsOf(header, mapping) {
  const used = new Set(Object.values(mapping.columns || {}));
  const fields = [];
  (header || []).forEach((cell, position) => {
    const text = typeof cell === 'string' ? cell.trim() : '';
    if (used.has(position) || !text.toLowerCase().startsWith('customfield')) return;
    const parts = text.split('-');
    const name = parts[1] || text;
    const type = parts[2] || 'text';
    if (type === 'dropdown' || type === 'dropdownMultiSelect') {
      fields.push({ name, type, options: (parts.slice(3).join('-') || '').split('/').filter(Boolean), position });
    } else if (type === 'currency') {
      fields.push({ name, type, currencyCode: parts[3] || '', position });
    } else {
      fields.push({ name, type, position });
    }
  });
  (mapping.customFieldColumns || []).forEach(position => {
    if (fields.some(f => f.position === position)) return;
    const name = String((header || [])[position] == null ? '' : header[position]).trim() || `#${position + 1}`;
    fields.push({ name, type: 'text', position });
  });
  return fields;
}

const cellString = value => {
  if (value == null) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  return String(value);
};
const blank = value => cellString(value).trim() === '';

// People cells: WeKan's CSV writes usernames separated by spaces, other tools
// commas or semicolons.
export function splitPeople(value) {
  return [...new Set(cellString(value).split(/[\s,;]+/).map(s => s.trim()).filter(Boolean))];
}

// Requested By and Assigned By: usernames and free text, separated by commas.
export function splitByField(value) {
  return cellString(value).split(/\s*[,;]\s*/).map(s => s.trim()).filter(Boolean);
}

// Labels: WeKan's CSV writes `name-color` separated by spaces, its Excel
// table names separated by commas.
export function splitLabels(value) {
  const out = [];
  for (const token of cellString(value).split(/[\s,]+/)) {
    if (!token) continue;
    const dash = token.lastIndexOf('-');
    const label = dash > 0 && /^[a-z]+$/.test(token.slice(dash + 1))
      ? { name: token.slice(0, dash), color: token.slice(dash + 1) }
      : { name: token, color: 'black' };
    if (!out.some(l => l.name === label.name && l.color === label.color)) out.push(label);
  }
  return out;
}

// A date cell: a Date from a workbook, ISO 8601 text, or whatever JavaScript's
// date parser reads. An empty or unreadable cell is no date.
export function parseCellDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : new Date(value.getTime());
  const text = cellString(value).trim();
  if (!text) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const truthy = value => /^(true|yes|1|x)$/i.test(cellString(value).trim());

// What the rows become: the lists, swimlanes, labels and custom fields of the
// board, and one entry per card. rows[0] is the header. Cards go to the list
// their list cell names; with no list column, or an empty list cell, to ONE
// list - the mapping's listName or `defaultListName` - never one per row.
export function planCsvBoard(rows, mapping, { defaultListName = DEFAULT_LIST_NAME, defaultSwimlaneName = 'Default' } = {}) {
  const header = (rows && rows[0]) || [];
  const columns = (mapping && mapping.columns) || {};
  const at = (row, field) => (columns[field] === undefined ? undefined : row[columns[field]]);
  const fallbackList = (mapping && mapping.listName) || defaultListName;
  const lists = [];
  const swimlanes = [];
  const labels = [];
  const addUnique = (array, name) => { if (!array.includes(name)) array.push(name); return name; };
  const customFields = customFieldsOf(header, mapping || {});
  const cards = [];
  for (let r = 1; r < (rows || []).length; r += 1) {
    const row = rows[r] || [];
    const listCell = cellString(at(row, 'list')).trim();
    const list = addUnique(lists, listCell || fallbackList);
    const swimlaneCell = cellString(at(row, 'swimlane')).trim();
    const swimlane = addUnique(swimlanes, swimlaneCell || defaultSwimlaneName);
    const cardLabels = splitLabels(at(row, 'labels'));
    cardLabels.forEach(label => {
      if (!labels.some(l => l.name === label.name && l.color === label.color)) labels.push(label);
    });
    const card = {
      row: r,
      title: cellString(at(row, 'title')),
      list,
      swimlane,
      labels: cardLabels,
      owner: splitPeople(at(row, 'owner'))[0],
      members: splitPeople(at(row, 'members')),
      assignees: splitPeople(at(row, 'assignees')),
      requestedBy: splitByField(at(row, 'requestedBy')),
      assignedBy: splitByField(at(row, 'assignedBy')),
      customValues: [],
    };
    if (!blank(at(row, 'description'))) card.description = cellString(at(row, 'description'));
    for (const field of ['receivedAt', 'startAt', 'dueAt', 'endAt', 'createdAt', 'modifiedAt']) {
      const date = parseCellDate(at(row, field));
      if (date) card[field] = date;
    }
    if (!blank(at(row, 'parentCard'))) card.parentTitle = cellString(at(row, 'parentCard')).trim();
    const spent = parseFloat(cellString(at(row, 'spentTime')).replace(',', '.'));
    if (Number.isFinite(spent)) card.spentTime = spent;
    if (truthy(at(row, 'isOvertime'))) card.isOvertime = true;
    if (truthy(at(row, 'archived'))) card.archived = true;
    customFields.forEach((field, fieldIndex) => {
      const raw = row[field.position];
      if (blank(raw)) return;
      card.customValues.push({ fieldIndex, value: field.type === 'date' ? parseCellDate(raw) : cellString(raw).trim() });
    });
    cards.push(card);
  }
  if (!lists.length) lists.push(fallbackList);
  if (!swimlanes.length) swimlanes.push(defaultSwimlaneName);
  return { lists, swimlanes, labels, customFields, cards };
}

// One cell of an ExcelJS worksheet as a value the import reads: a formula
// cell is its last calculated result, rich text its text, a hyperlink its
// text, a date stays a Date, an error cell is empty.
export function cellValue(value) {
  if (value == null) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map(part => (part && part.text) || '').join('');
    if ('formula' in value || 'sharedFormula' in value) return cellValue(value.result);
    if ('text' in value) return cellValue(value.text);
    if ('error' in value) return '';
  }
  return String(value);
}

// The rows of an ExcelJS worksheet, at their sheet positions (rows[0] is
// row 1; an empty row is []), each cell read with cellValue(), the cells a
// merge hides empty.
export function worksheetRows(worksheet) {
  const rows = [];
  if (!worksheet) return rows;
  worksheet.eachRow((row, number) => {
    while (rows.length < number - 1) rows.push([]);
    const cells = [];
    const count = Array.isArray(row.values) ? row.values.length - 1 : 0;
    for (let c = 1; c <= count; c += 1) {
      const cell = row.getCell(c);
      // A merged range is one value: its other cells report the first
      // cell's value again, which would read as several equal columns.
      const merged = cell.isMerged && cell.master && cell.master.address !== cell.address;
      cells.push(merged ? '' : cellValue(cell.value));
    }
    rows.push(cells);
  });
  return rows;
}

// Dates are carried as ISO text, the shape the CSV text import has too.
const asText = row => row.map(cell => (cell instanceof Date ? cell.toISOString() : cellString(cell)));

// The boards in a workbook: every sheet whose header is found is a board, its
// rows from the header down. A sheet without one - WeKan's Activity sheet, an
// empty or notes sheet - is skipped and named in `skipped`. When no sheet has
// a header, the first sheet's first row is the header, as before.
//   sheets: [{ name, rows }] from worksheetRows()
//   returns { boards: [{ title, sheet, rows }], skipped: [sheet names] }
export function excelSheetsToBoards(sheets, translations = {}) {
  const boards = [];
  const skipped = [];
  for (const sheet of sheets || []) {
    const rows = sheet.rows || [];
    const at = findHeaderRow(rows, translations);
    if (at === -1) {
      skipped.push(sheet.name);
      continue;
    }
    // Above a header below row 1, WeKan's export writes the board's title in A1.
    const top = at > 0 ? (rows[0] || []).filter(cell => !blank(cell)) : [];
    const title = top.length === 1 ? cellString(top[0]).trim() : '';
    const body = rows.slice(at).filter((row, i) => i === 0 || row.some(cell => !blank(cell)));
    boards.push({ title: title || (sheets.length > 1 ? sheet.name : ''), sheet: sheet.name, rows: body.map(asText) });
  }
  if (!boards.length) {
    const first = (sheets || []).find(sheet => (sheet.rows || []).some(row => row.some(cell => !blank(cell))));
    if (first) {
      const body = first.rows.filter(row => row.some(cell => !blank(cell)));
      boards.push({ title: '', sheet: first.name, rows: body.map(asText) });
      return { boards, skipped: skipped.filter(name => name !== first.name) };
    }
  }
  return { boards, skipped };
}

// The mapping for one board of a workbook: the one the person confirmed
// applies to every sheet with the same header as the first board's (the
// "Export all boards" workbook has the same columns on every sheet); a sheet
// with other columns is read by its header names.
export function mappingForSheet(mapping, boards, index) {
  if (!mapping || !boards[index]) return undefined;
  const same = JSON.stringify(boards[index].rows[0]) === JSON.stringify(boards[0].rows[0]);
  return same ? mapping : undefined;
}
