// KanbanFlow, imported through its API: what models/lib/apiImport/kanbanflow.js
// fetches, read into the normalized board the generalized importer
// (models/kanboardCreator.js) creates. Plain JavaScript without Meteor, so
// tests/kanbanflowApiImport.test.cjs runs it in Node.
//
// The input (field names as https://kanbanflow.com/api documents them):
//   { kanbanflow: true,
//     board: { _id, name, columns: [{ uniqueId, name }],
//              swimlanes?: [{ uniqueId, name }],
//              colors: [{ name, value, description }] },
//     tasks: [{ _id, name, description, color, columnId, swimlaneId,
//               totalSecondsSpent, totalSecondsEstimate, responsibleUserId,
//               dates: [{ targetColumnId, status, dateType, dueTimestamp }],
//               subTasks: [{ name, finished, userId, dueDate }],
//               labels: [{ name, pinned }], collaborators: [{ userId }] }],
//     users: [{ _id, fullName, email }],
//     comments: { taskId: [{ _id, text, authorUserId, createdTimestamp }] } }
//
// A board maps to:
//   columns, swimlanes   -> lists and swimlanes, in order ('Default' without)
//   task color           -> card color (cyan -> sky, brown -> saddlebrown); a
//                           color the board describes ("Bug") is also a label
//   labels               -> labels (KanbanFlow labels have no color)
//   subTasks             -> a "Subtasks" checklist
//   dueDate              -> due date, done when its status is 'done'
//   totalSecondsSpent    -> spent time, in hours
//   totalSecondsEstimate -> the number custom field "Estimate (hours)": WeKan
//                           has no estimate on a card, and a label per
//                           estimate would fill the board's label list
//   responsibleUserId    -> owner, collaborators -> further assignees, both by
//                           the user's full name, mapped in the members step
//   comments             -> comments with their author and date

export const MAX_KANBANFLOW_TASKS = 20000;
const DEFAULT_SWIMLANE = 'Default';
const SUBTASKS_CHECKLIST = 'Subtasks';
const ESTIMATE_FIELD = 'Estimate (hours)';

// KanbanFlow's ten task colors and WeKan's names for them.
export const KANBANFLOW_COLORS = {
  yellow: 'yellow', white: 'white', red: 'red', green: 'green', blue: 'blue',
  purple: 'purple', orange: 'orange', cyan: 'sky', brown: 'saddlebrown', magenta: 'magenta',
};

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => (typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
const hours = seconds => Math.round((seconds / 3600) * 100) / 100;

function isoDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function readInput(input) {
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch (error) { throw new Error('KanbanFlow data is not valid JSON'); }
  }
  return input;
}

// A list of { uniqueId, name } as titles in order, a repeated name told
// apart as "Name (2)"; returns the titles and uniqueId -> title.
function named(items, kind, at, unsupported) {
  const titles = [];
  const byId = new Map();
  items.forEach((item, index) => {
    if (!isObject(item)) { unsupported.push({ path: `${at}/${index}`, reason: `a KanbanFlow ${kind} that is not an object is not imported` }); return; }
    const base = text(item.name).trim() || 'Untitled';
    let title = base;
    for (let n = 2; titles.includes(title); n += 1) title = `${base} (${n})`;
    if (title !== base) unsupported.push({ path: `${at}/${index}/name`, reason: `KanbanFlow has two ${kind}s named "${base}"; this one is imported as "${title}"` });
    titles.push(title);
    if (text(item.uniqueId)) byId.set(text(item.uniqueId), title);
  });
  return { titles, byId };
}

export function parseKanbanflowApi(input) {
  const data = readInput(input);
  if (!isObject(data)) throw new Error('KanbanFlow data must be a JSON object');
  if (!isObject(data.board)) throw new Error('KanbanFlow data needs the board (fetch it on the import page)');
  if (!Array.isArray(data.board.columns)) throw new Error('KanbanFlow board needs a columns array');
  if (!Array.isArray(data.tasks)) throw new Error('KanbanFlow data needs a tasks array');
  if (data.tasks.length > MAX_KANBANFLOW_TASKS) throw new Error(`KanbanFlow board has more than ${MAX_KANBANFLOW_TASKS} tasks`);
  const unsupported = [];
  const board = data.board;

  const columns = named(board.columns, 'column', '/board/columns', unsupported);
  if (!columns.titles.length) throw new Error('KanbanFlow board has no columns');
  const lanesIn = Array.isArray(board.swimlanes) ? board.swimlanes : [];
  const lanes = named(lanesIn, 'swimlane', '/board/swimlanes', unsupported);
  if (!lanes.titles.length) lanes.titles.push(DEFAULT_SWIMLANE);

  const users = new Map((Array.isArray(data.users) ? data.users : [])
    .filter(user => isObject(user) && text(user._id))
    .map(user => [text(user._id), text(user.fullName).trim() || text(user.email).trim() || text(user._id)]));
  const userName = id => users.get(text(id)) || text(id);
  const colorLabels = new Map((Array.isArray(board.colors) ? board.colors : [])
    .filter(color => isObject(color) && text(color.description).trim())
    .map(color => [text(color.value || color.name).toLowerCase(), text(color.description).trim()]));
  const comments = isObject(data.comments) ? data.comments : {};
  if (data.commentsLimited) {
    unsupported.push({ path: '/comments', reason: `comments were fetched for the first ${data.commentsLimited} tasks only` });
  }

  const tasks = [];
  data.tasks.forEach((source, index) => {
    const at = `/tasks/${index}`;
    if (!isObject(source)) { unsupported.push({ path: at, reason: 'a KanbanFlow task that is not an object is not imported' }); return; }
    const column = columns.byId.get(text(source.columnId));
    if (!column) { unsupported.push({ path: `${at}/columnId`, reason: `KanbanFlow task "${text(source.name)}" is in a column the board does not have` }); return; }
    let lane = lanes.byId.get(text(source.swimlaneId));
    if (!lane) {
      if (lanes.byId.size && text(source.swimlaneId)) unsupported.push({ path: `${at}/swimlaneId`, reason: `KanbanFlow task "${text(source.name)}" is in a swimlane the board does not have; it is imported into "${lanes.titles[0]}"` });
      lane = lanes.titles[0];
    }
    const task = {
      title: text(source.name).trim(),
      description: text(source.description),
      column_name: column,
      swimlane_name: lane,
      tags: [],
    };
    if (text(source._id)) task.ref = text(source._id);

    const color = text(source.color).trim().toLowerCase();
    if (color) {
      if (KANBANFLOW_COLORS[color]) {
        task.color = KANBANFLOW_COLORS[color];
        // The board's legend for a color ("red: Bug") is what it means.
        if (colorLabels.has(color)) task.tags.push({ name: colorLabels.get(color), color: KANBANFLOW_COLORS[color] });
      } else {
        unsupported.push({ path: `${at}/color`, reason: `KanbanFlow color "${color}" is not a color WeKan can show` });
      }
    }
    for (const label of Array.isArray(source.labels) ? source.labels : []) {
      const name = text(label && label.name).trim();
      if (name && !task.tags.some(t => t.name === name)) task.tags.push({ name });
    }

    const dues = (Array.isArray(source.dates) ? source.dates : []).filter(d => isObject(d) && (d.dateType || 'dueDate') === 'dueDate');
    if (dues.length) {
      const due = isoDate(dues[0].dueTimestamp || dues[0].dueTimestampLocal);
      if (due) {
        task.date_due = due;
        if (dues[0].status === 'done') task.due_complete = true;
      } else {
        unsupported.push({ path: `${at}/dates/0`, reason: `KanbanFlow due date "${text(dues[0].dueTimestamp)}" is not a date` });
      }
      if (text(dues[0].targetColumnId)) {
        unsupported.push({ path: `${at}/dates/0/targetColumnId`, reason: 'KanbanFlow ties this due date to a column; WeKan keeps the date only' });
      }
      if (dues.length > 1) unsupported.push({ path: `${at}/dates`, reason: 'WeKan has one due date per card; only the first KanbanFlow due date is imported' });
    }

    const spent = Number(source.totalSecondsSpent);
    if (Number.isFinite(spent) && spent > 0) task.spent_hours = hours(spent);
    const estimate = Number(source.totalSecondsEstimate);
    if (Number.isFinite(estimate) && estimate > 0) task.custom_fields = { [ESTIMATE_FIELD]: hours(estimate) };

    if (text(source.responsibleUserId)) task.owner_name = userName(source.responsibleUserId);
    const assignees = (Array.isArray(source.collaborators) ? source.collaborators : [])
      .map(c => (isObject(c) && text(c.userId) ? userName(c.userId) : ''))
      .filter(name => name && name !== task.owner_name);
    if (assignees.length) task.assignees = [...new Set(assignees)];

    const subTasks = (Array.isArray(source.subTasks) ? source.subTasks : []).filter(s => isObject(s) && text(s.name).trim());
    if (subTasks.length) {
      task.checklists = [{ title: SUBTASKS_CHECKLIST, items: subTasks.map(s => ({ title: text(s.name).trim(), done: s.finished === true })) }];
      if (subTasks.some(s => text(s.userId) || text(s.dueDate))) {
        unsupported.push({ path: `${at}/subTasks`, reason: 'a KanbanFlow subtask\'s own person and due date have no place on a WeKan checklist item' });
      }
    }

    const taskComments = (Array.isArray(comments[text(source._id)]) ? comments[text(source._id)] : [])
      .filter(c => isObject(c) && text(c.text).trim())
      .map(c => {
        const comment = { text: text(c.text), author: userName(c.authorUserId) };
        const date = isoDate(c.createdTimestamp);
        if (date) comment.date = date;
        return comment;
      });
    if (taskComments.length) task.comments = taskComments;

    tasks.push(task);
  });

  return {
    board: { name: text(board.name).trim() || 'Imported KanbanFlow board' },
    columns: columns.titles.map(title => ({ title })),
    swimlanes: lanes.titles.map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}
