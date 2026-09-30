// todo.txt (the todotxt/todo.txt format specification on GitHub): one task per
// line, as written and read by the todo.txt CLI and the many apps that share it.
// Import and export live together so tests/todoTxt.test.cjs runs the round
// trip in plain Node - no Meteor import here.
//
//   x 2026-10-09 2026-09-01 Replace pump +plant @workshop due:2026-10-10 list:Done
//   (A) 2026-09-01 Order valves +plant t:2026-09-20
//
// A line maps to a card:
//   x (complete)          -> the "Done" list, unless list: says otherwise
//   (A) priority          -> label "priority:A" (pri:A on a completed task)
//   completion date       -> end date; creation date -> creation date
//   +project              -> label "project"; @context -> label "@context"
//   due:YYYY-MM-DD        -> due date; t:YYYY-MM-DD (threshold) -> start date
//   list:Name             -> the WeKan list (this exporter's extension;
//                            underscores stand for spaces)
// Any other key:value stays in the title, so nothing is dropped. todo.txt has
// no description, comments or members: an export leaves them out, and says so.

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PRIORITY = /^\(([A-Z])\)$/;
const KNOWN_KEYS = new Set(['due', 't', 'list', 'pri']);
export const MAX_TODO_TXT_LINES = 10000;

const unspace = value => String(value).replace(/_/g, ' ');
const respace = value => String(value).trim().replace(/\s+/g, '_');

export function parseTodoTxt(text) {
  const lines = String(text == null ? '' : text).split(/\r\n|\r|\n/);
  if (lines.length > MAX_TODO_TXT_LINES) throw new Error(`todo.txt has more than ${MAX_TODO_TXT_LINES} lines`);
  const tasks = [];
  const unsupported = [];
  lines.forEach((line, index) => {
    const words = line.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;
    let done = false;
    let priority;
    if (words[0] === 'x') { done = true; words.shift(); }
    else if (PRIORITY.test(words[0])) { priority = PRIORITY.exec(words.shift())[1]; }
    let completed;
    let created;
    if (done && DATE.test(words[0] || '')) {
      completed = words.shift();
      if (DATE.test(words[0] || '')) created = words.shift();
    } else if (DATE.test(words[0] || '')) {
      created = words.shift();
    }
    const tags = [];
    const meta = {};
    const title = [];
    for (const word of words) {
      const project = /^\+(\S+)$/.exec(word);
      const context = /^@(\S+)$/.exec(word);
      const pair = /^([^:\s]+):([^:\s]+)$/.exec(word);
      if (project) tags.push(unspace(project[1]));
      else if (context) tags.push(`@${unspace(context[1])}`);
      else if (pair && KNOWN_KEYS.has(pair[1]) && !Object.hasOwn(meta, pair[1])) meta[pair[1]] = pair[2];
      else title.push(word);
    }
    if (!priority && /^[A-Z]$/.test(meta.pri || '')) priority = meta.pri;
    if (priority) tags.unshift(`priority:${priority}`);
    for (const key of ['due', 't']) {
      if (meta[key] !== undefined && !DATE.test(meta[key])) {
        unsupported.push({ path: `/${index}/${key}`, reason: `${key}: is not a YYYY-MM-DD date` });
        delete meta[key];
      }
    }
    tasks.push({
      title: title.join(' ') || 'Imported task',
      description: '',
      column_name: meta.list ? unspace(meta.list) : (done ? 'Done' : 'To Do'),
      swimlane_name: 'Default',
      tags,
      ...(meta.due ? { date_due: meta.due } : {}),
      ...(meta.t ? { date_started: meta.t } : {}),
      ...(created ? { date_creation: created } : {}),
      ...(done && completed ? { date_end: completed } : {}),
    });
  });
  const columns = [...new Set(tasks.map(task => task.column_name))];
  return {
    board: { name: 'Imported todo.txt' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// The same terminal-list heuristic as the other formatters.
function isClosed(listTitle) {
  return /done|closed|complete|archiv|finished/i.test(listTitle || '');
}
const day = value => (value ? String(value).slice(0, 10) : '');

export function formatTodoTxt({ items }) {
  return (items || []).map(item => {
    const done = isClosed(item.listTitle);
    const labels = Array.isArray(item.labels) ? item.labels : [];
    const priority = labels.map(name => /^priority:([A-Z])$/.exec(name)).find(Boolean);
    const head = [];
    if (done) {
      head.push('x');
      // todo.txt allows a completion date only together with a creation date.
      if (day(item.endAt) && day(item.createdAt)) head.push(day(item.endAt));
    } else if (priority) {
      head.push(`(${priority[1]})`);
    }
    if (day(item.createdAt)) head.push(day(item.createdAt));
    const title = String(item.title || '').replace(/\s+/g, ' ').trim() || 'Untitled';
    const tail = labels.filter(name => !/^priority:[A-Z]$/.test(name))
      .map(name => (name.startsWith('@') ? `@${respace(name.slice(1))}` : `+${respace(name)}`));
    if (done && priority) tail.push(`pri:${priority[1]}`);
    if (day(item.dueAt)) tail.push(`due:${day(item.dueAt)}`);
    if (day(item.startAt)) tail.push(`t:${day(item.startAt)}`);
    if (item.listTitle) tail.push(`list:${respace(item.listTitle)}`);
    return [...head, title, ...tail].join(' ');
  }).join('\n') + ((items || []).length ? '\n' : '');
}
