// Todoist project CSV (https://todoist.com/help/articles/360000748525): what
// Todoist's "Export as a template" writes and "Import from template" reads.
// Import and export live together so tests/todoistCsv.test.cjs runs the round
// trip in plain Node - no Meteor import here.
//
//   TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,DATE_LANG,
//   TIMEZONE,DURATION,DURATION_UNIT,DEADLINE,DEADLINE_LANG
//   meta,view_style=board,,,,,,,,,,,,
//   section,To Do,,,,,,,,,,,,
//   task,Order valves @shop,Two of them,1,1,Alice (123),Bob (456),2026-10-10,en,UTC,,,,
//   task,Check the flange,,4,2,,,,,,,,,
//   note,Call the vendor,,,,Alice (123),,,,,,,,
//
// A row maps to:
//   section                    -> a list, in file order; tasks before the first
//                                 section go to "No section"
//   task, INDENT 1             -> a card in the current list
//   task, INDENT 2 and deeper  -> an item of the card's "Sub-tasks" checklist
//   note                       -> a comment on the task above it
//   CONTENT                    -> title; each @label in it -> a label
//   DESCRIPTION                -> description
//   PRIORITY 1, 2, 3           -> label p1, p2, p3 (1 is Todoist's highest;
//                                 4 is its default, "no priority")
//   RESPONSIBLE "Name (id)"    -> the card's owner, mapped like other imports
//   DATE                       -> due date, or the start date when there is
//                                 also a DEADLINE, which is then the due date
//   meta                       -> board settings; view_style is read, not kept
// A DATE in words ("every monday", "tomorrow") is Todoist's own natural
// language and is reported, as are DURATION, a note with no task above it and
// a TYPE Todoist does not define. Todoist exports no completed tasks.

export const TODOIST_COLUMNS = ['TYPE', 'CONTENT', 'DESCRIPTION', 'PRIORITY', 'INDENT', 'AUTHOR', 'RESPONSIBLE',
  'DATE', 'DATE_LANG', 'TIMEZONE', 'DURATION', 'DURATION_UNIT', 'DEADLINE', 'DEADLINE_LANG'];
export const MAX_TODOIST_ROWS = 20000;
const NO_SECTION = 'No section';
const LABEL = /(^|\s)@([^\s@]+)/g;

// RFC 4180: quoted fields may hold commas, line breaks and doubled quotes.
export function readCsv(text) {
  const source = String(text == null ? '' : text).replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { field += '"'; i += 1; } else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"' && field === '') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
    if (rows.length > MAX_TODOIST_ROWS) throw new Error(`Todoist CSV has more than ${MAX_TODOIST_ROWS} rows`);
  }
  if (quoted) throw new Error('Todoist CSV has an unclosed quote');
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(cells => cells.some(cell => cell.trim() !== ''));
}

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/;
// "2026-10-10" or "2026-10-10 14:30" (in TIMEZONE when that is UTC or empty),
// as ISO; undefined for anything else - Todoist's natural-language dates.
export function todoistDate(value, timezone) {
  const match = ISO_DAY.exec(String(value || '').trim());
  if (!match) return undefined;
  if (match[4] && timezone && !/^(UTC|GMT|Etc\/UTC)$/i.test(timezone.trim())) return undefined;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], +(match[4] || 0), +(match[5] || 0)));
  return Number.isNaN(date.getTime()) || date.getUTCMonth() !== +match[2] - 1 ? undefined : date.toISOString();
}

const person = value => {
  const text = String(value || '').trim();
  return text ? text.replace(/\s*\(\d+\)\s*$/, '').trim() || undefined : undefined;
};

export function parseTodoistCsv(text) {
  const rows = readCsv(text);
  if (!rows.length) throw new Error('Todoist CSV is empty');
  const header = rows[0].map(cell => cell.trim().toUpperCase());
  if (!header.includes('TYPE') || !header.includes('CONTENT')) {
    throw new Error('Todoist CSV needs the TYPE and CONTENT columns');
  }
  const col = name => header.indexOf(name);
  const cell = (cells, name) => (col(name) === -1 ? '' : String(cells[col(name)] || '').trim());
  const columns = [];
  const tasks = [];
  const unsupported = [];
  let list = null;
  let card = null;
  rows.slice(1).forEach((cells, index) => {
    const at = `/row/${index + 2}`;
    const type = cell(cells, 'TYPE').toLowerCase();
    const content = cell(cells, 'CONTENT');
    if (type === 'meta') return;
    if (type === 'section') {
      list = content || NO_SECTION;
      if (!columns.includes(list)) columns.push(list);
      card = null;
      return;
    }
    if (type === 'note') {
      if (!card) { unsupported.push({ path: at, reason: 'a note with no task above it is not imported' }); return; }
      if (content) card.comments.push({ text: content, ...(person(cell(cells, 'AUTHOR')) ? { author: person(cell(cells, 'AUTHOR')) } : {}) });
      return;
    }
    if (type !== 'task') {
      unsupported.push({ path: at, reason: `Todoist row type ${type || '(empty)'} is not imported` });
      return;
    }
    const labels = [];
    const title = content.replace(LABEL, (all, space, name) => { labels.push(name); return space; }).replace(/\s+/g, ' ').trim()
      || 'Imported task';
    const indent = Number.parseInt(cell(cells, 'INDENT'), 10) || 1;
    if (indent > 1) {
      if (!card) { unsupported.push({ path: at, reason: 'a sub-task with no task above it is not imported' }); return; }
      if (!card.checklists.length) card.checklists.push({ title: 'Sub-tasks', items: [] });
      card.checklists[0].items.push({ title, done: false });
      return;
    }
    if (!list) { list = NO_SECTION; if (!columns.includes(list)) columns.push(list); }
    const priority = Number.parseInt(cell(cells, 'PRIORITY'), 10);
    if (priority >= 1 && priority <= 3) labels.unshift(`p${priority}`);
    const timezone = cell(cells, 'TIMEZONE');
    const dateText = cell(cells, 'DATE');
    const deadlineText = cell(cells, 'DEADLINE');
    const date = todoistDate(dateText, timezone);
    const deadline = todoistDate(deadlineText, timezone);
    if (dateText && !date) unsupported.push({ path: `${at}/DATE`, reason: `Todoist date "${dateText}" is not a calendar date` });
    if (deadlineText && !deadline) unsupported.push({ path: `${at}/DEADLINE`, reason: `Todoist deadline "${deadlineText}" is not a calendar date` });
    if (cell(cells, 'DURATION')) unsupported.push({ path: `${at}/DURATION`, reason: 'Todoist duration has no WeKan field' });
    const owner = person(cell(cells, 'RESPONSIBLE'));
    card = {
      title,
      description: cell(cells, 'DESCRIPTION'),
      column_name: list,
      swimlane_name: 'Default',
      tags: labels,
      ...(owner ? { owner_username: owner } : {}),
      ...(deadline ? { date_due: deadline, ...(date ? { date_started: date } : {}) } : date ? { date_due: date } : {}),
      comments: [],
      checklists: [],
    };
    tasks.push(card);
  });
  for (const task of tasks) {
    if (!task.comments.length) delete task.comments;
    if (!task.checklists.length) delete task.checklists;
  }
  return {
    board: { name: 'Imported Todoist' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// One CSV field: quoted when it holds a comma, a quote or a line break.
const field = value => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// "2026-10-10", or "2026-10-10 14:30" when the time is not midnight UTC.
function csvDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.toISOString().slice(0, 10);
  const time = date.toISOString().slice(11, 16);
  return time === '00:00' ? day : `${day} ${time}`;
}

export function formatTodoistCsv({ items }) {
  const row = values => TODOIST_COLUMNS.map(name => values[name] || '');
  const rows = [TODOIST_COLUMNS, row({ TYPE: 'meta', CONTENT: 'view_style=board' })];
  const lists = [];
  for (const item of items || []) if (!lists.includes(item.listTitle || NO_SECTION)) lists.push(item.listTitle || NO_SECTION);
  for (const list of lists) {
    if (list !== NO_SECTION) rows.push(row({ TYPE: 'section', CONTENT: list }));
    for (const item of (items || []).filter(it => (it.listTitle || NO_SECTION) === list)) {
      const labels = Array.isArray(item.labels) ? item.labels : [];
      const priority = labels.map(name => /^p([123])$/.exec(name)).find(Boolean);
      const tags = labels.filter(name => !/^p[123]$/.test(name)).map(name => `@${String(name).trim().replace(/\s+/g, '_')}`);
      const start = csvDate(item.startAt);
      const due = csvDate(item.dueAt);
      const dated = start && due ? { DATE: start, DEADLINE: due } : due ? { DATE: due } : {};
      rows.push(row({
        TYPE: 'task',
        CONTENT: [String(item.title || '').replace(/\s+/g, ' ').trim() || 'Untitled', ...tags].join(' '),
        DESCRIPTION: item.description || '',
        PRIORITY: priority ? priority[1] : '4',
        INDENT: '1',
        RESPONSIBLE: item.owner || '',
        ...dated,
        ...(dated.DATE ? { DATE_LANG: 'en', TIMEZONE: 'UTC' } : {}),
        ...(dated.DEADLINE ? { DEADLINE_LANG: 'en' } : {}),
      }));
      for (const checklist of Array.isArray(item.checklists) ? item.checklists : []) {
        for (const entry of Array.isArray(checklist.items) ? checklist.items : []) {
          // Todoist exports no completed tasks, so a finished item is left out too.
          if (!entry.done) rows.push(row({ TYPE: 'task', CONTENT: entry.title, PRIORITY: '4', INDENT: '2' }));
        }
      }
      for (const comment of Array.isArray(item.comments) ? item.comments : []) {
        if (comment && typeof comment.text === 'string' && comment.text.trim()) {
          rows.push(row({ TYPE: 'note', CONTENT: comment.text, AUTHOR: comment.author || '' }));
        }
      }
    }
  }
  return `${rows.map(cells => cells.map(field).join(',')).join('\r\n')}\r\n`;
}
