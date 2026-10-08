// Businessmap (formerly Kanbanize) Excel workbooks, as rows of cells per sheet.
// The workbook is opened and written on the server
// (server/lib/businessmapWorkbook.js); this module is plain JavaScript so
// tests/businessmapFormat.test.cjs runs in Node.
//
// Businessmap's knowledge base documents both directions:
//   - export: Advanced Search, Configure results, Download writes an Excel
//     sheet with the columns the user picked (plus "Links" and "Subtasks"
//     tabs when those were chosen);
//   - import: Board sidebar, Import reads an .xls/.xlsx file, at most 100
//     cards per run, whose header names are matched in any order. A Card ID
//     or Custom Card ID column makes the row update that existing card, which
//     is the round trip the knowledge base recommends.
// The header names are localized to the account language. Only the English
// names are known, so only they are read here; a workbook whose header has
// none of them is refused with that explanation.
//
// Documented import columns, and what they become:
//   Title                         -> the card's title
//   Description                   -> description
//   Card ID                       -> the card's reference (for Parent and Links)
//                                    and the custom field Card ID, so an export
//                                    can update the same Businessmap cards
//   Custom Card ID                -> custom field (the reference without Card ID)
//   Priority (low, average,
//   high, critical)               -> custom field Priority
//   Owner / Co-Owners             -> owner, then further assignees
//   Color (#067DB7)               -> card color
//   Size (a number)               -> custom field Size
//   Tags                          -> labels: comma-separated when a comma is
//                                    present, otherwise space-separated
//   Deadline                      -> due date: MM/DD/YYYY, DD-MM-YYYY or
//                                    YYYY-MM-DD, 1970-01-01 ... 2037-12-31
//   Type / Type name              -> custom field Type
//   Column / Column name          -> the list
//   Lane / Lane name              -> the swimlane
//   Workflow name                 -> custom field Workflow name, and the
//                                    swimlane when there is no Lane
//   Board name                    -> the board's title
//   Comment (repeatable)          -> comments
//   Links ("Parents: 1; Children:
//   2, 3"; also Relatives,
//   Predecessors, Successors)     -> parent, subtasks and dependencies
//   Parent                        -> the parent card
//   Created at / Creation Date    -> created date
//   Start Date / End Date         -> start and end dates
//   Archived at / Archivation date-> the card is archived
//   Planned Start / Planned End /
//   Track                         -> custom fields
//   any other column              -> a custom field of that name (Businessmap
//                                    custom fields are columns by their name)
// Reported: Template and Board ID (Businessmap's own), other sheets, values
// that are not what the column documents, rows without a title.

// WeKan's palette as hex, for Businessmap's hex-only Color column.
import { NAMED_COLOR_HEX } from './contrastColor.js';

export const BUSINESSMAP_PRIORITIES = ['low', 'average', 'high', 'critical'];
const LINK_TYPES = {
  parent: 'parents', parents: 'parents',
  child: 'children', children: 'children',
  relative: 'relatives', relatives: 'relatives',
  predecessor: 'predecessors', predecessors: 'predecessors',
  successor: 'successors', successors: 'successors',
};
const ROLES = [
  ['title', /^title$/i],
  ['description', /^description$/i],
  ['cardId', /^card id$/i],
  ['customId', /^custom card id$/i],
  ['priority', /^priority$/i],
  ['owner', /^owner$/i],
  ['coOwners', /^co-?owners?$/i],
  ['color', /^colou?r$/i],
  ['size', /^size$/i],
  ['tags', /^tags?$/i],
  ['deadline', /^deadline$/i],
  ['template', /^template$/i],
  ['type', /^type( name)?$/i],
  ['column', /^column( name)?$/i],
  ['lane', /^lane( name)?$/i],
  ['workflow', /^workflow name$/i],
  ['boardName', /^board name$/i],
  ['boardId', /^board id$/i],
  ['comment', /^comments?( \d+)?$/i],
  ['links', /^links$/i],
  ['parent', /^parent( card id)?$/i],
  ['created', /^(created at|creation date)$/i],
  ['archived', /^(archived at|archivation date)$/i],
  ['start', /^start date$/i],
  ['end', /^end date$/i],
  ['plannedStart', /^planned start$/i],
  ['plannedEnd', /^planned end$/i],
  ['track', /^track$/i],
];
// The roles whose column also names a WeKan custom field.
const FIELD_OF_ROLE = {
  cardId: 'Card ID', customId: 'Custom Card ID', priority: 'Priority', size: 'Size', type: 'Type',
  workflow: 'Workflow name', plannedStart: 'Planned Start', plannedEnd: 'Planned End', track: 'Track',
};
export const businessmapRole = title => (ROLES.find(([, re]) => re.test(String(title || '').trim())) || [])[0];

const cellText = value => {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text || '').join('').trim();
    if (value.text !== undefined) return cellText(value.text);
    if (value.result !== undefined) return cellText(value.result);
    return '';
  }
  return String(value).trim();
};
// A cell that is a Date (an Excel date cell) or a formula resulting in one.
const cellDate = value => {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && value.result instanceof Date) return value.result;
  return undefined;
};

const utcDay = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : undefined;
};
const DEADLINE_FROM = Date.UTC(1970, 0, 1);
const DEADLINE_TO = Date.UTC(2037, 11, 31);

// A Businessmap date as an ISO string, or undefined. The three documented
// forms are MM/DD/YYYY, DD-MM-YYYY and YYYY-MM-DD; the knowledge base's own
// example table writes MM/DD/YY (10/28/21), read as 20YY. An Excel date cell
// keeps its time. `deadline` applies the documented 1970-2037 range.
export function businessmapDate(value, { deadline = false } = {}) {
  let date = cellDate(value);
  if (date && Number.isNaN(date.getTime())) date = undefined;
  if (!date) {
    const text = cellText(value);
    let m;
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text))) date = utcDay(+m[1], +m[2], +m[3]);
    else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})$/.exec(text))) date = utcDay(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[1], +m[2]);
    else if ((m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(text))) date = utcDay(+m[3], +m[2], +m[1]);
  }
  if (!date) return undefined;
  if (deadline && (date.getTime() < DEADLINE_FROM || date.getTime() >= DEADLINE_TO + 86400000)) return undefined;
  return date.toISOString();
}

// Tags: comma-separated when a comma is present, otherwise space-separated.
export function businessmapTags(text) {
  const value = String(text || '');
  return value.split(value.includes(',') ? ',' : /\s+/).map(tag => tag.trim()).filter(Boolean);
}

const splitNames = text => String(text || '').split(/[,;]/.test(text) ? /[,;]/ : /\s+/).map(name => name.trim()).filter(Boolean);
const fieldValue = value => (typeof value === 'number' ? value : /^-?\d+(\.\d+)?$/.test(cellText(value)) ? Number(cellText(value)) : cellText(value));

// "Parents: 1234; Children: 5678, 8765" as { parents: ['1234'], children: [...] };
// a part whose type is not one of the five is returned in `unknown`.
export function businessmapLinks(text) {
  const links = { parents: [], children: [], relatives: [], predecessors: [], successors: [], unknown: [] };
  for (const part of String(text || '').split(';').map(p => p.trim()).filter(Boolean)) {
    const m = /^([A-Za-z]+)\s*:\s*(.*)$/.exec(part);
    const type = m && LINK_TYPES[m[1].toLowerCase()];
    if (!type) { links.unknown.push(part); continue; }
    links[type].push(...m[2].split(/[,\s]+/).map(id => id.trim()).filter(Boolean));
  }
  return links;
}

const HEADER_ROLES = ['title', 'cardId', 'customId'];
const isHeader = row => row.some(cell => HEADER_ROLES.includes(businessmapRole(cellText(cell))));

// sheets: [{ name, rows }] with rows as arrays of raw cells, top to bottom.
export function parseBusinessmapSheets(sheets) {
  if (!Array.isArray(sheets) || !sheets.length) throw new Error('Businessmap workbook is empty');
  const table = sheets.map(sheet => ({
    name: String((sheet && sheet.name) || ''),
    rows: ((sheet && sheet.rows) || []).map(row => (Array.isArray(row) ? Array.from(row, cell => (cell === undefined ? null : cell)) : [])),
  }));
  // The cards are on the first sheet with a header row naming Title, Card ID
  // or Custom Card ID; the export puts its own header in row 1, a hand-made
  // import file may have a few lines above it.
  let sheetIndex = -1;
  let headerAt = -1;
  table.some((sheet, index) => {
    const at = sheet.rows.slice(0, 20).findIndex(isHeader);
    if (at === -1) return false;
    sheetIndex = index;
    headerAt = at;
    return true;
  });
  if (sheetIndex === -1) {
    throw new Error('Businessmap workbook has no header row with Title or Card ID. Headers are read by their English names; '
      + 'a file exported from an account in another language needs its headers renamed to the English ones (Title, Column, Lane, Owner, Deadline ...)');
  }
  const unsupported = [];
  table.forEach((sheet, index) => {
    if (index !== sheetIndex && sheet.rows.some(row => row.some(cell => cellText(cell)))) {
      unsupported.push({ path: `/sheet/${sheet.name}`, reason: `the "${sheet.name}" sheet is not imported; Links and Parent columns of the card sheet are` });
    }
  });
  const { name: sheetName, rows } = table[sheetIndex];
  const header = rows[headerAt].map(cellText);
  const roles = header.map(businessmapRole);
  if (headerAt > 0) unsupported.push({ path: '/row/1', reason: `${headerAt} row(s) above the header are not imported` });
  if (roles.includes('boardId')) unsupported.push({ path: '/Board ID', reason: 'Board ID names a Businessmap board; the cards are imported into one new board' });

  const tasks = [];
  const pendingLinks = [];
  let boardName = '';
  rows.slice(headerAt + 1).forEach((row, offset) => {
    const at = `/row/${headerAt + offset + 2}`;
    if (!row.some(cell => cellText(cell))) return;
    const task = { title: '', description: '', tags: [] };
    const custom = {};
    const comments = [];
    let column = '';
    let lane = '';
    let workflow = '';
    let links = null;
    header.forEach((title, index) => {
      const raw = row[index];
      const value = cellText(raw);
      if (!title || !value) return;
      const role = roles[index];
      const where = `${at}/${title}`;
      switch (role) {
        case 'title': task.title = value; break;
        case 'description': task.description = value; break;
        case 'cardId': task.ref = value; custom['Card ID'] = fieldValue(raw); break;
        case 'customId': custom['Custom Card ID'] = value; break;
        case 'priority':
          if (BUSINESSMAP_PRIORITIES.includes(value.toLowerCase())) custom.Priority = value.toLowerCase();
          else {
            custom.Priority = value;
            unsupported.push({ path: where, reason: `Businessmap priority "${value}" is not low, average, high or critical; kept as written` });
          }
          break;
        case 'owner': task.owner_username = value; break;
        case 'coOwners': task.assignees = splitNames(value); break;
        case 'color': {
          const hex = /^#?([0-9a-fA-F]{6})$/.exec(value);
          if (hex) task.color = `#${hex[1].toLowerCase()}`;
          else unsupported.push({ path: where, reason: `Businessmap color "${value}" is not a hex color like #067DB7` });
          break;
        }
        case 'size': {
          const size = Number(value);
          if (Number.isFinite(size) && size >= 0) custom.Size = size;
          else unsupported.push({ path: where, reason: `Businessmap size "${value}" is not a number` });
          break;
        }
        case 'tags': task.tags.push(...businessmapTags(value)); break;
        case 'deadline': {
          const due = businessmapDate(raw, { deadline: true });
          if (due) task.date_due = due;
          else unsupported.push({ path: where, reason: `Businessmap deadline "${value}" is not MM/DD/YYYY, DD-MM-YYYY or YYYY-MM-DD between 1970 and 2037` });
          break;
        }
        case 'template': unsupported.push({ path: where, reason: `the Businessmap card template "${value}" is not imported` }); break;
        case 'type': case 'plannedStart': case 'plannedEnd': case 'track': custom[FIELD_OF_ROLE[role]] = value; break;
        case 'workflow': workflow = value; custom['Workflow name'] = value; break;
        case 'column': column = value; break;
        case 'lane': lane = value; break;
        case 'boardName': if (!boardName) boardName = value; break;
        case 'boardId': break;
        case 'comment': comments.push({ text: value }); break;
        case 'links': links = businessmapLinks(value); break;
        case 'parent': task.parent_ref = value; break;
        case 'created': case 'start': case 'end': {
          const date = businessmapDate(raw);
          const field = { created: 'date_creation', start: 'date_started', end: 'date_end' }[role];
          if (date) task[field] = date;
          else unsupported.push({ path: where, reason: `Businessmap date "${value}" is not MM/DD/YYYY, DD-MM-YYYY or YYYY-MM-DD` });
          break;
        }
        case 'archived':
          task.archived = true;
          unsupported.push({ path: where, reason: 'the card is archived; its Businessmap archive date is not kept' });
          break;
        default: custom[title] = fieldValue(raw);
      }
    });
    if (!task.title) {
      if (!task.ref) { unsupported.push({ path: at, reason: 'a Businessmap row without a Title or Card ID is not imported' }); return; }
      task.title = `Card ${task.ref}`;
      unsupported.push({ path: at, reason: `a blank Title (it keeps the existing title in Businessmap); named "${task.title}"` });
    }
    if (!task.ref && custom['Custom Card ID']) task.ref = String(custom['Custom Card ID']);
    task.column_name = column || 'No column';
    task.swimlane_name = lane || workflow || 'Default';
    if (comments.length) task.comments = comments;
    if (Object.keys(custom).length) task.custom_fields = custom;
    if (links) pendingLinks.push({ index: tasks.length, links, at });
    tasks.push(task);
  });

  // Links: Parents and Children are subtasks (a card has one parent in
  // WeKan), Predecessors and Successors are blocking dependencies, Relatives
  // related ones. A relation written on both cards is kept once.
  const byRef = new Map();
  tasks.forEach((task, index) => { if (task.ref && !byRef.has(task.ref)) byRef.set(task.ref, index); });
  const seen = new Set();
  const addDependency = (index, ref, type, key) => {
    if (seen.has(key)) return;
    seen.add(key);
    tasks[index].dependencies = tasks[index].dependencies || [];
    tasks[index].dependencies.push({ ref, type });
  };
  for (const { index, links, at } of pendingLinks) {
    const task = tasks[index];
    const where = `${at}/Links`;
    links.unknown.forEach(part => unsupported.push({ path: where, reason: `Businessmap link "${part}" is not Parents, Children, Relatives, Predecessors or Successors` }));
    links.parents.forEach(ref => {
      if (!task.parent_ref) task.parent_ref = ref;
      else if (task.parent_ref !== ref) unsupported.push({ path: where, reason: `a further parent ${ref}; a WeKan card has one parent` });
    });
    links.children.forEach(ref => {
      const child = byRef.get(ref);
      if (child === undefined) unsupported.push({ path: where, reason: `child card ${ref} is not part of this import` });
      else if (!tasks[child].parent_ref) tasks[child].parent_ref = task.ref;
      else if (tasks[child].parent_ref !== task.ref) unsupported.push({ path: where, reason: `child card ${ref} already has another parent` });
    });
    const self = task.ref || `#${index}`;
    links.predecessors.forEach(ref => addDependency(index, ref, 'is-blocked-by', `block:${ref}>${self}`));
    links.successors.forEach(ref => {
      const target = byRef.get(ref);
      if (target === undefined || !task.ref) addDependency(index, ref, 'blocks', `block:${self}>${ref}`);
      else addDependency(target, self, 'is-blocked-by', `block:${self}>${ref}`);
    });
    links.relatives.forEach(ref => addDependency(index, ref, 'related-to', `rel:${[String(self), ref].sort().join('|')}`));
  }

  const columns = [...new Set(tasks.map(task => task.column_name))];
  const swimlanes = [...new Set(tasks.map(task => task.swimlane_name))];
  const genericSheet = !sheetName || /^(sheet\s*\d*|export|search results?)$/i.test(sheetName);
  return {
    board: { name: boardName || (genericSheet ? '' : sheetName) || 'Imported Businessmap board' },
    columns: columns.map(title => ({ title })),
    swimlanes: (swimlanes.length ? swimlanes : ['Default']).map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

const day = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};
const PRIORITY_SYNONYMS = {
  low: 'low', lowest: 'low', minor: 'low',
  average: 'average', medium: 'average', normal: 'average',
  high: 'high', major: 'high',
  critical: 'critical', urgent: 'critical', highest: 'critical', blocker: 'critical',
};
// A custom field value as one spreadsheet cell.
const cellValue = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return value;
  if (value instanceof Date) return day(value);
  if (Array.isArray(value)) return value.map(cellValue).filter(v => v !== '').join(', ');
  return '';
};
const ROLE_FIELDS = new Set(Object.values(FIELD_OF_ROLE));

// The documented import columns on the first sheet, header in row 1: what
// Businessmap's import reads (at most 100 cards per run, so a larger board is
// imported there in parts). Card ID and Parent are written only from the
// Card ID custom field an import from Businessmap keeps, because a Card ID
// updates that existing Businessmap card; WeKan's own ids are not Businessmap
// ids. Columns no card has a value for are left out, other custom fields
// follow by name, and comments go to repeated Comment columns.
export function formatBusinessmapSheets({ board, items }) {
  const list = Array.isArray(items) ? items : [];
  const cardIdOf = new Map(list.map(item => [item.cardId, (item.customFields || {})['Card ID']]));
  const rows = list.map(item => {
    const fields = item.customFields || {};
    const color = typeof item.color === 'string'
      ? (/^#[0-9a-fA-F]{6}$/.test(item.color) ? item.color.toUpperCase() : (NAMED_COLOR_HEX[item.color] || '').toUpperCase()) : '';
    const labels = (Array.isArray(item.labels) ? item.labels : []).map(tag => String(tag).replace(/,/g, ' ').trim()).filter(Boolean);
    const size = Number(fields.Size);
    const parentId = item.parentCardId ? cardIdOf.get(item.parentCardId) : undefined;
    return {
      'Card ID': fields['Card ID'] ?? '',
      'Custom Card ID': fields['Custom Card ID'] ?? '',
      Title: String(item.title || '').trim() || 'Untitled',
      Description: item.description || '',
      Column: item.listTitle || '',
      Lane: item.swimlaneTitle && item.swimlaneTitle !== 'Default' ? item.swimlaneTitle : '',
      'Workflow name': fields['Workflow name'] ?? '',
      Owner: item.owner || '',
      'Co-Owners': (Array.isArray(item.assignees) ? item.assignees : []).filter(Boolean).join(', '),
      Priority: PRIORITY_SYNONYMS[String(fields.Priority ?? '').trim().toLowerCase()] || '',
      Color: color,
      Size: fields.Size !== undefined && fields.Size !== '' && Number.isFinite(size) && size >= 0 ? size : '',
      // A lone tag with a space keeps a trailing comma, so it is not split.
      Tags: labels.length === 1 && /\s/.test(labels[0]) ? `${labels[0]},` : labels.join(', '),
      Deadline: day(item.dueAt),
      'Start Date': day(item.startAt),
      'End Date': day(item.endAt),
      Type: fields.Type ?? '',
      'Planned Start': fields['Planned Start'] ?? '',
      'Planned End': fields['Planned End'] ?? '',
      Track: fields.Track ?? '',
      Parent: parentId ?? '',
      comments: (Array.isArray(item.comments) ? item.comments : [])
        .map(c => String((c && c.text) || '').trim() && (c.author ? `${c.author}: ${String(c.text).trim()}` : String(c.text).trim()))
        .filter(Boolean),
      extra: Object.fromEntries(Object.entries(fields)
        .filter(([name]) => !ROLE_FIELDS.has(name) && !businessmapRole(name))
        .map(([name, value]) => [name, cellValue(value)])),
    };
  });
  const always = ['Title', 'Description', 'Column', 'Lane', 'Owner', 'Co-Owners', 'Tags', 'Deadline', 'Color'];
  const optional = ['Card ID', 'Custom Card ID', 'Workflow name', 'Priority', 'Size', 'Type', 'Start Date', 'End Date', 'Planned Start', 'Planned End', 'Track', 'Parent'];
  const order = ['Card ID', 'Custom Card ID', 'Title', 'Description', 'Workflow name', 'Column', 'Lane', 'Owner', 'Co-Owners',
    'Priority', 'Color', 'Size', 'Tags', 'Deadline', 'Start Date', 'End Date', 'Type', 'Planned Start', 'Planned End', 'Track', 'Parent'];
  const named = order.filter(name => always.includes(name) || (optional.includes(name) && rows.some(row => row[name] !== '')));
  const extra = [];
  rows.forEach(row => Object.keys(row.extra).forEach(name => { if (!extra.includes(name)) extra.push(name); }));
  const commentColumns = Math.max(0, ...rows.map(row => row.comments.length));
  const header = [...named, ...Array(commentColumns).fill('Comment'), ...extra];
  const out = [header];
  for (const row of rows) {
    out.push([
      ...named.map(name => row[name]),
      ...Array.from({ length: commentColumns }, (_, i) => row.comments[i] || ''),
      ...extra.map(name => (row.extra[name] === undefined ? '' : row.extra[name])),
    ]);
  }
  return { sheets: [{ name: String((board && board.title) || 'Cards').slice(0, 31), rows: out }] };
}
