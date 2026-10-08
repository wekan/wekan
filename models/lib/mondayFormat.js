// monday.com's "Export board to Excel" workbook, as rows of cells per sheet.
// The workbook is opened and written on the server (server/lib/mondayWorkbook.js);
// this module is plain JavaScript so tests/mondayFormat.test.cjs runs in Node.
//
// monday documents the export only through the screenshots of its help
// article, and says the layout cannot be changed:
//
//   Ice Cream Flavors                      (row 1: the board's name)
//   New Flavor Ideas                       (a group's name)
//   Name | Ice Cream Maker | Status | ...  (the board's columns, per group)
//   Honey Apricot | Alice | Working on it  (one row per item)
//                                   0/5    (a summary row: no name)
//   (blank row, then the next group)
//
// and, with "+ updates", a second sheet "<board>-updates": Item ID, Item Name,
// Content Type, User, Created At ("27/May/2025 03:26:42 PM"), Update Content.
// Subitems are not documented; community reports show a "Subitems" header row
// after the parent, its rows indented one column - read that way here.
//
// The column titles are the board owner's own, so they are matched by
// meaning, case-insensitively:
//   Name                         -> the card's title
//   Status                       -> the card's list (groups become swimlanes);
//                                   without a Status column, groups are lists
//   Group                        -> the swimlane, in a flat table (see export)
//   Person / People / Owner /
//   Assignee                     -> owner, then further assignees
//   Date / Due date / Deadline   -> due date (YYYY-MM-DD)
//   Timeline ("A - B")           -> start and due dates
//   Tags                         -> labels
//   Item ID                      -> the card's reference
//   Long text / Description /
//   Notes                        -> description
//   any other column             -> a custom field of that name
// Updates become comments on the item they name. Summary rows are skipped.

export const MONDAY_COLUMNS = ['Name', 'Group', 'Status', 'Person', 'Date', 'Timeline', 'Tags', 'Priority', 'Description', 'Item ID'];
const ROLES = [
  ['title', /^name$/i],
  ['status', /^status$/i],
  ['group', /^group$/i],
  ['people', /^(person|people|owner|owners|assignee|assignees)$/i],
  ['due', /^(date|due date|due|deadline)$/i],
  ['timeline', /^timeline$/i],
  ['tags', /^tags?$/i],
  ['id', /^item id$/i],
  ['description', /^(long text|description|notes)$/i],
];
const roleOf = title => (ROLES.find(([, re]) => re.test(String(title || '').trim())) || [])[0];
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

const cellText = value => {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text || '').join('');
    if (value.text !== undefined) return cellText(value.text);
    if (value.result !== undefined) return cellText(value.result);
    return '';
  }
  return String(value).trim();
};

export function mondayDate(text) {
  const value = String(text || '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) {
    const date = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    return date.getUTCDate() === +iso[3] && date.getUTCMonth() === +iso[2] - 1 ? date.toISOString() : undefined;
  }
  // An update's "27/May/2025 03:26:42 PM".
  const long = /^(\d{1,2})\/([A-Za-z]{3})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i.exec(value);
  if (!long || MONTHS[long[2].toLowerCase()] === undefined) return undefined;
  const hour = (+long[4] % 12) + (/pm/i.test(long[7]) ? 12 : 0);
  return new Date(Date.UTC(+long[3], MONTHS[long[2].toLowerCase()], +long[1], hour, +long[5], +long[6])).toISOString();
}

const splitPeople = text => String(text || '').split(',').map(name => name.trim()).filter(Boolean);

// sheets: [{ name, rows }] with rows as arrays of cells, top to bottom.
export function parseMondaySheets(sheets) {
  if (!Array.isArray(sheets) || !sheets.length) throw new Error('monday.com workbook is empty');
  const rows = (sheets[0].rows || []).map(row => (Array.isArray(row) ? row.map(cellText) : []));
  const isHeader = row => /^name$/i.test(row[0] || '');
  if (!rows.some(isHeader)) throw new Error('monday.com workbook has no header row starting with "Name"');
  const unsupported = [];
  const firstHeader = rows.findIndex(isHeader);
  // Row 1 is the board's name when it stands alone above the first group.
  const boardName = firstHeader > 0 && rows[0].filter(Boolean).length >= 1 && firstHeader >= 2 ? rows[0][0] : '';
  const groups = [];
  const tasks = [];
  let header = null;
  let group = '';
  let parent = null;
  let subHeader = null;
  rows.forEach((row, index) => {
    const at = `/row/${index + 1}`;
    const filled = row.filter(Boolean).length;
    if (!filled) { subHeader = null; return; }
    if (index === 0 && boardName) return;
    if (isHeader(row)) { header = row; subHeader = null; parent = null; return; }
    // The subitem header's first column, "Subitems", is the subitem's name.
    if (!row[0] && /^subitems$/i.test(row[1] || '')) { subHeader = ['Name', ...row.slice(2)]; return; }
    if (subHeader && !row[0] && row[1]) {
      const sub = itemFrom(row.slice(1), subHeader, at);
      if (sub) { sub.parent_ref = parent && parent.ref; tasks.push(sub); }
      return;
    }
    if (filled === 1 && row[0] && (!header || rows[index + 1] && isHeader(rows[index + 1]))) {
      group = row[0];
      if (!groups.includes(group)) groups.push(group);
      return;
    }
    if (!row[0]) return; // a summary row
    if (!header) { unsupported.push({ path: at, reason: 'a row before the first header row is not imported' }); return; }
    subHeader = null;
    parent = itemFrom(row, header, at);
    if (parent) tasks.push(parent);
  });

  function itemFrom(cells, titles, at) {
    const task = { title: '', description: '', tags: [], swimlane_name: group || 'Default' };
    const custom = {};
    let status = '';
    titles.forEach((title, column) => {
      const value = cells[column] || '';
      if (!title || !value) return;
      const role = roleOf(title);
      if (role === 'title') task.title = value;
      else if (role === 'status') status = value;
      else if (role === 'group') task.swimlane_name = value;
      else if (role === 'people') {
        const people = splitPeople(value);
        task.owner_username = people[0];
        if (people.length > 1) task.assignees = people.slice(1);
      } else if (role === 'due') {
        const due = mondayDate(value);
        if (due) task.date_due = due;
        else unsupported.push({ path: `${at}/${title}`, reason: `monday.com date "${value}" is not YYYY-MM-DD` });
      } else if (role === 'timeline') {
        const [from, to] = value.split(/\s+-\s+/).map(mondayDate);
        if (from) task.date_started = from;
        if (to && !task.date_due) task.date_due = to;
        if (!from || !to) unsupported.push({ path: `${at}/${title}`, reason: `monday.com timeline "${value}" is not "YYYY-MM-DD - YYYY-MM-DD"` });
      } else if (role === 'tags') task.tags.push(...value.split(',').map(tag => tag.trim()).filter(Boolean));
      else if (role === 'id') task.ref = value;
      else if (role === 'description') task.description = value;
      else custom[title] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
    });
    if (!task.title) { unsupported.push({ path: at, reason: 'a monday.com item without a name is not imported' }); return null; }
    // Without an Item ID column, the row stands in for it, so a subitem can
    // still find its parent.
    if (!task.ref) task.ref = `monday${at}`;
    task.status = status;
    if (Object.keys(custom).length) task.custom_fields = custom;
    return task;
  }

  // Lists: the Status values when the board has a Status column, else groups.
  const byStatus = tasks.some(task => task.status);
  const columns = [];
  for (const task of tasks) {
    task.column_name = byStatus ? (task.status || 'No status') : (task.swimlane_name === 'Default' ? 'Items' : task.swimlane_name);
    if (!byStatus) task.swimlane_name = 'Default';
    delete task.status;
    if (!columns.includes(task.column_name)) columns.push(task.column_name);
  }
  const swimlanes = [...new Set(tasks.map(task => task.swimlane_name))];

  // The updates sheet: comments on the item named by id, else by name.
  const updates = sheets.slice(1).find(sheet => /-updates$/i.test(String(sheet.name || '')));
  if (updates) {
    const urows = (updates.rows || []).map(row => (Array.isArray(row) ? row.map(cellText) : []));
    const uheaderAt = urows.findIndex(row => row.includes('Item Name') && row.includes('Update Content'));
    if (uheaderAt !== -1) {
      const uh = urows[uheaderAt];
      urows.slice(uheaderAt + 1).forEach((row, index) => {
        const get = name => row[uh.indexOf(name)] || '';
        const text = get('Update Content');
        if (!text) return;
        const target = tasks.find(task => get('Item ID') && task.ref === get('Item ID')) || tasks.find(task => task.title === get('Item Name'));
        if (!target) { unsupported.push({ path: `/updates/row/${uheaderAt + index + 2}`, reason: 'an update for an item that is not in the board sheet' }); return; }
        target.comments = target.comments || [];
        target.comments.push({ text, ...(get('User') ? { author: get('User') } : {}), ...(mondayDate(get('Created At')) ? { date: mondayDate(get('Created At')) } : {}) });
      });
    }
  }
  return {
    board: { name: boardName || String(sheets[0].name || '') || 'Imported monday.com board' },
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

// One flat table on the first sheet, header in row 1 and ISO dates: what
// monday.com's own Excel import reads (it imports the first sheet only and
// lets the user pick the header row). Custom fields follow the fixed columns.
export function formatMondaySheets({ board, items }) {
  const extra = [];
  for (const item of items || []) {
    for (const name of Object.keys(item.customFields || {})) {
      if (!extra.includes(name) && !roleOf(name) && !MONDAY_COLUMNS.includes(name)) extra.push(name);
    }
  }
  const header = [...MONDAY_COLUMNS, ...extra];
  const rows = [header];
  for (const item of items || []) {
    const fields = item.customFields || {};
    const values = {
      Name: String(item.title || '').trim() || 'Untitled',
      Group: item.swimlaneTitle && item.swimlaneTitle !== 'Default' ? item.swimlaneTitle : '',
      Status: item.listTitle || '',
      Person: [item.owner, ...(Array.isArray(item.assignees) ? item.assignees : [])].filter(Boolean).join(', '),
      Date: day(item.dueAt),
      Timeline: item.startAt && item.dueAt ? `${day(item.startAt)} - ${day(item.dueAt)}` : '',
      Tags: (Array.isArray(item.labels) ? item.labels : []).map(tag => String(tag).replace(/,/g, ' ')).join(', '),
      Priority: fields.Priority === undefined ? '' : String(fields.Priority),
      Description: item.description || '',
      'Item ID': item.cardId || '',
    };
    rows.push(header.map(name => (name in values ? values[name] : fields[name] === undefined ? '' : fields[name])));
  }
  return { sheets: [{ name: String((board && board.title) || 'board').toLowerCase().slice(0, 31), rows }] };
}
