// Taskwarrior JSON (https://taskwarrior.org/docs/design/task/): what
// `task export` writes and `task import` reads - a JSON array of task
// objects, or one object per line as older versions write it. Import and
// export live together so tests/taskwarrior.test.cjs runs the round trip in
// plain Node - no Meteor import here.
//
//   {"uuid":"…","status":"pending","entry":"20260901T120000Z",
//    "description":"Order valves","project":"Plant.Pumps","priority":"H",
//    "tags":["shop"],"due":"20261010T000000Z","depends":["…"],
//    "annotations":[{"entry":"20260902T080000Z","description":"Call the vendor"}]}
//
// A task maps to a card:
//   description             -> title
//   status                  -> list: completed -> Done, waiting -> Waiting,
//                              pending with a start time -> In Progress,
//                              other pending -> To Do (unless wekanlist says)
//   project                 -> label "project:<name>"
//   priority H/M/L          -> label "priority:H" ...
//   tags                    -> labels
//   entry / due / scheduled / end -> creation / due / start / end dates
//   annotations             -> comments
//   depends                 -> "is blocked by" dependencies
//   uuid                    -> the source id the dependencies resolve by
//   wekanlist, wekandescription -> WeKan's own attributes: Taskwarrior keeps
//                              unknown attributes as orphaned UDAs, so list
//                              names and descriptions survive a round trip
// A deleted task is not imported, and a recurring task's template is not
// either (its instances are ordinary tasks); both are reported, as is every
// other attribute WeKan has no place for. Taskwarrior has no members.

const COMPACT = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;
const PRIORITIES = ['H', 'M', 'L'];
// Computed or bookkeeping attributes: nothing is lost by not importing them.
const IGNORED = new Set(['id', 'urgency', 'modified', 'mask', 'imask', 'start']);
const MAPPED = new Set(['uuid', 'status', 'description', 'entry', 'due', 'scheduled', 'end', 'project', 'priority', 'tags',
  'annotations', 'depends', 'wekanlist', 'wekandescription']);
export const MAX_TASKWARRIOR_TASKS = 10000;

// "20260901T120000Z" (Taskwarrior's own form) or an ISO date, as ISO; else undefined.
export function taskwarriorDate(value) {
  if (typeof value !== 'string' || !value) return undefined;
  const compact = COMPACT.exec(value);
  const iso = compact ? `${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6]}Z` : value;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function compactDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function readTasks(text) {
  const source = String(text == null ? '' : text).trim();
  if (!source) return [];
  if (source.startsWith('[')) {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed)) throw new Error('Taskwarrior export is not a JSON array');
    return parsed;
  }
  // One JSON object per line, as `task export` wrote before 2.4.
  return source.split(/\r\n|\r|\n/).filter(line => line.trim()).map((line, index) => {
    try { return JSON.parse(line.trim().replace(/,$/, '')); } catch (error) {
      throw new Error(`Taskwarrior line ${index + 1} is not a JSON object`);
    }
  });
}

const words = value => (Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [])
  .map(item => String(item).trim()).filter(Boolean);

export function parseTaskwarrior(text) {
  const tasks = readTasks(text);
  if (tasks.length > MAX_TASKWARRIOR_TASKS) throw new Error(`Taskwarrior export has more than ${MAX_TASKWARRIOR_TASKS} tasks`);
  const normalized = [];
  const unsupported = [];
  tasks.forEach((task, index) => {
    const at = `/${index}`;
    if (!task || typeof task !== 'object' || Array.isArray(task)) {
      unsupported.push({ path: at, reason: 'not a task object' });
      return;
    }
    if (task.status === 'deleted') {
      unsupported.push({ path: `${at}/status`, reason: 'a deleted task is not imported' });
      return;
    }
    if (task.status === 'recurring') {
      unsupported.push({ path: `${at}/status`, reason: 'a recurring template is not imported; its instances are' });
      return;
    }
    for (const key of Object.keys(task)) {
      if (!MAPPED.has(key) && !IGNORED.has(key)) {
        unsupported.push({ path: `${at}/${key}`, reason: `Taskwarrior attribute ${key} has no WeKan field` });
      }
    }
    const done = task.status === 'completed';
    const column = typeof task.wekanlist === 'string' && task.wekanlist.trim() ? task.wekanlist.trim()
      : done ? 'Done' : task.status === 'waiting' ? 'Waiting' : task.start ? 'In Progress' : 'To Do';
    const tags = [];
    if (typeof task.project === 'string' && task.project) tags.push(`project:${task.project}`);
    if (PRIORITIES.includes(task.priority)) tags.push(`priority:${task.priority}`);
    tags.push(...words(task.tags));
    for (const key of ['entry', 'due', 'scheduled', 'end']) {
      if (task[key] !== undefined && !taskwarriorDate(task[key])) {
        unsupported.push({ path: `${at}/${key}`, reason: `${key} is not a Taskwarrior date` });
      }
    }
    const comments = (Array.isArray(task.annotations) ? task.annotations : [])
      .filter(note => note && typeof note.description === 'string' && note.description.trim())
      .map(note => ({ text: note.description, date: taskwarriorDate(note.entry) }));
    const dependencies = words(task.depends).map(ref => ({ ref, type: 'is-blocked-by' }));
    normalized.push({
      ...(typeof task.uuid === 'string' && task.uuid ? { ref: task.uuid } : {}),
      title: typeof task.description === 'string' && task.description.trim() ? task.description.trim() : 'Imported task',
      description: typeof task.wekandescription === 'string' ? task.wekandescription : '',
      column_name: column,
      swimlane_name: 'Default',
      tags,
      ...(taskwarriorDate(task.due) ? { date_due: taskwarriorDate(task.due) } : {}),
      ...(taskwarriorDate(task.scheduled) ? { date_started: taskwarriorDate(task.scheduled) } : {}),
      ...(taskwarriorDate(task.entry) ? { date_creation: taskwarriorDate(task.entry) } : {}),
      ...(done && taskwarriorDate(task.end) ? { date_end: taskwarriorDate(task.end) } : {}),
      ...(comments.length ? { comments } : {}),
      ...(dependencies.length ? { dependencies } : {}),
    });
  });
  const columns = [...new Set(normalized.map(task => task.column_name))];
  return {
    board: { name: 'Imported Taskwarrior' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks: normalized,
    warnings: [],
    unsupported,
  };
}

// The same terminal-list heuristic as the other formatters.
function isClosed(listTitle) {
  return /done|closed|complete|archiv|finished/i.test(listTitle || '');
}

// A Taskwarrior uuid must be an RFC 4122 UUID; a WeKan card id is not, so the
// card id is spread over one deterministically: the same card always exports
// with the same uuid.
export function taskwarriorUuid(cardId) {
  let hex = '';
  const source = String(cardId);
  for (let round = 0; hex.length < 32; round += 1) {
    let h = 0x811c9dc5 ^ round;
    for (let i = 0; i < source.length; i += 1) {
      h ^= source.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    hex += h.toString(16).padStart(8, '0');
  }
  hex = hex.slice(0, 32).split('');
  hex[12] = '4';
  hex[16] = ['8', '9', 'a', 'b'][parseInt(hex[16], 16) % 4];
  hex = hex.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function formatTaskwarrior({ items }) {
  const tasks = (items || []).map(item => {
    const done = isClosed(item.listTitle);
    const labels = Array.isArray(item.labels) ? item.labels : [];
    const priority = labels.map(name => /^priority:([HML])$/.exec(name)).find(Boolean);
    const project = labels.map(name => /^project:(.+)$/.exec(name)).find(Boolean);
    const tags = labels.filter(name => !/^priority:[HML]$/.test(name) && !/^project:.+$/.test(name))
      .map(name => String(name).trim().replace(/\s+/g, '_')).filter(Boolean);
    const task = {
      uuid: taskwarriorUuid(item.cardId || item.title),
      status: done ? 'completed' : 'pending',
      description: String(item.title || '').replace(/\s+/g, ' ').trim() || 'Untitled',
    };
    if (compactDate(item.createdAt)) task.entry = compactDate(item.createdAt);
    if (done && compactDate(item.endAt)) task.end = compactDate(item.endAt);
    if (compactDate(item.dueAt)) task.due = compactDate(item.dueAt);
    if (compactDate(item.startAt)) task.scheduled = compactDate(item.startAt);
    if (project) task.project = project[1];
    if (priority) task.priority = priority[1];
    if (tags.length) task.tags = tags;
    const annotations = (Array.isArray(item.comments) ? item.comments : [])
      .filter(comment => comment && typeof comment.text === 'string' && comment.text.trim())
      .map(comment => ({ ...(compactDate(comment.date) ? { entry: compactDate(comment.date) } : {}),
        description: comment.author ? `${comment.author}: ${comment.text}` : comment.text }));
    if (annotations.length) task.annotations = annotations;
    if (item.listTitle) task.wekanlist = item.listTitle;
    if (item.description) task.wekandescription = item.description;
    return task;
  });
  return `${JSON.stringify(tasks, null, 2)}\n`;
}
