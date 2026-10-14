// Google Tasks, as models/lib/apiImport/googletasks.js fetches it, read into
// the normalized board the generalized importer creates (models/kanboardCreator.js).
// Each task list is a list, each top-level task a card in `position` order,
// and subtasks a "Subtasks" checklist on their parent.

export const MAX_GOOGLE_TASKS = 20000;
const DEFAULT_SWIMLANE = 'Default';
const SUBTASKS_CHECKLIST = 'Subtasks';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => (typeof value === 'string' ? value : '');

function isoDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// Google's `due` is a date at midnight UTC; the time part is not used.
function dueDate(value) {
  const iso = isoDate(value);
  return iso ? `${iso.slice(0, 10)}T00:00:00.000Z` : iso;
}

// Position strings are zero-padded, so they sort as text.
const byPosition = (a, b) => (text(a.position) < text(b.position) ? -1 : text(a.position) > text(b.position) ? 1 : 0);

function linkLines(links) {
  return (Array.isArray(links) ? links : [])
    .filter(link => isObject(link) && text(link.link).trim())
    .map(link => {
      const label = text(link.description).trim() || text(link.type).trim();
      return label ? `${label}: ${text(link.link).trim()}` : text(link.link).trim();
    });
}

function readInput(input) {
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch (error) { throw new Error('Google Tasks data is not valid JSON'); }
  }
  return input;
}

export function parseGoogleTasksApi(input) {
  const data = readInput(input);
  if (!isObject(data) || data.googletasks !== true || !Array.isArray(data.lists)) {
    throw new Error('Google Tasks data must be an object with googletasks: true and a lists array');
  }
  const total = data.lists.reduce((sum, item) => sum + (isObject(item) && Array.isArray(item.tasks) ? item.tasks.length : 0), 0);
  if (total > MAX_GOOGLE_TASKS) throw new Error(`Google Tasks data has more than ${MAX_GOOGLE_TASKS} tasks`);

  const unsupported = [];
  const columns = [];
  const tasks = [];
  data.lists.forEach((taskList, listIndex) => {
    const at = `/lists/${listIndex}`;
    if (!isObject(taskList)) { unsupported.push({ path: at, reason: 'a Google Tasks list that is not an object is not imported' }); return; }
    if (taskList.tasks !== undefined && !Array.isArray(taskList.tasks)) throw new Error('Google Tasks list tasks must be an array');
    const base = text(taskList.title).trim() || 'Untitled';
    let title = base;
    for (let n = 2; columns.includes(title); n += 1) title = `${base} (${n})`;
    if (title !== base) unsupported.push({ path: `${at}/title`, reason: `Google Tasks has two lists named "${base}"; this one is imported as "${title}"` });
    columns.push(title);

    const items = [];
    let deleted = 0;
    (taskList.tasks || []).forEach((task, taskIndex) => {
      const taskAt = `${at}/tasks/${taskIndex}`;
      if (!isObject(task)) { unsupported.push({ path: taskAt, reason: 'a Google task that is not an object is not imported' }); return; }
      if (task.deleted === true) { deleted += 1; return; }
      items.push({ task, at: taskAt });
    });
    if (deleted) unsupported.push({ path: `${at}/tasks`, reason: `${deleted} deleted Google task(s) are not imported` });

    const ids = new Set(items.map(({ task }) => text(task.id)).filter(Boolean));
    const isSubtask = ({ task }) => text(task.parent) && ids.has(text(task.parent)) && text(task.parent) !== text(task.id);
    const children = new Map();
    items.filter(isSubtask).sort((a, b) => byPosition(a.task, b.task)).forEach(item => {
      const parent = text(item.task.parent);
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(item);
    });

    items.filter(item => !isSubtask(item)).sort((a, b) => byPosition(a.task, b.task)).forEach(({ task, at: taskAt }) => {
      const card = {
        title: text(task.title).trim() || 'Untitled',
        description: [text(task.notes), ...linkLines(task.links)].filter(Boolean).join('\n'),
        column_name: title,
        swimlane_name: DEFAULT_SWIMLANE,
      };
      if (text(task.id)) card.ref = text(task.id);
      if (text(task.parent)) {
        unsupported.push({ path: `${taskAt}/parent`, reason: `the parent of Google task "${card.title}" is not in the data; it is imported as its own card` });
      }
      const due = dueDate(task.due);
      if (due) card.date_due = due;
      else if (due === undefined) unsupported.push({ path: `${taskAt}/due`, reason: `Google Tasks due date "${text(task.due)}" is not a date` });
      if (task.status === 'completed') {
        card.archived = true;
        const end = isoDate(task.completed);
        if (end) card.date_end = end;
      }
      const subtasks = children.get(text(task.id)) || [];
      if (subtasks.length) {
        card.checklists = [{
          title: SUBTASKS_CHECKLIST,
          items: subtasks.map(({ task: sub }) => ({ title: text(sub.title).trim() || 'Untitled', done: sub.status === 'completed' })),
        }];
        subtasks.forEach(({ task: sub, at: subAt }) => {
          const lost = ['notes', 'due', 'links'].filter(key => (key === 'links' ? linkLines(sub.links).length : text(sub[key])));
          if (lost.length) {
            unsupported.push({ path: subAt, reason: `the ${lost.join(', ')} of subtask "${text(sub.title).trim() || 'Untitled'}" are not kept: a checklist item has only a title and done` });
          }
        });
      }
      tasks.push(card);
    });
  });
  if (!columns.length) throw new Error('Google Tasks data has no task lists');
  return {
    board: { name: columns.length === 1 ? columns[0] : 'Google Tasks' },
    columns: columns.map(name => ({ title: name })),
    swimlanes: [{ name: DEFAULT_SWIMLANE }],
    tasks,
    warnings: [],
    unsupported,
  };
}
