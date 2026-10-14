// KanbanFlow's API client for the API import (models/lib/apiImportServices.js).
// Plain Node, no Meteor: tests/kanbanflowApiImport.test.cjs drives it with a
// fake `request`, releases/live-tests/kanbanflow-import.mjs with plain fetch.
//
// A KanbanFlow API token belongs to ONE board (board menu -> Settings -> API &
// Webhooks), so list() returns that board and fetch() reads it. The token is
// sent as HTTP Basic auth, user "apiToken", never in a URL
// (https://kanbanflow.com/api).
//
// fetch() returns what models/lib/kanbanflowApiFormat.js reads:
//   { kanbanflow: true, board, tasks: [task with columnId/swimlaneId],
//     users: [{ _id, fullName, email }], comments: { [taskId]: [comment] } }

const API = 'https://kanbanflow.com/api/v1';
// Bounds, so one board cannot keep the server fetching for ever.
export const MAX_KANBANFLOW_FETCH_TASKS = 20000;
export const MAX_KANBANFLOW_COMMENT_TASKS = 5000;
const PAGE_SIZE = 100;
const MAX_PAGES_PER_CELL = Math.ceil(MAX_KANBANFLOW_FETCH_TASKS / PAGE_SIZE);
const COMMENT_CONCURRENCY = 4;

function headers(credentials) {
  const token = credentials && typeof credentials.token === 'string' ? credentials.token : '';
  if (!token) throw new Error('token is required');
  return {
    Authorization: `Basic ${Buffer.from(`apiToken:${token}`, 'utf8').toString('base64')}`,
    Accept: 'application/json',
  };
}

const get = (request, credentials, path) => request(`${API}${path}`, { method: 'GET', headers: headers(credentials) });

async function readBoard(credentials, request) {
  const board = await get(request, credentials, '/board');
  if (!board || typeof board !== 'object' || Array.isArray(board) || !Array.isArray(board.columns)) {
    throw new Error('KanbanFlow did not return a board');
  }
  return board;
}

export async function list(credentials, request) {
  const board = await readBoard(credentials, request);
  return [{ id: String(board._id || ''), name: String(board.name || 'KanbanFlow board') }];
}

// One answer of GET /tasks: an array of { columnId, swimlaneId?, tasks,
// tasksLimited, nextTaskId }, one per column (and swimlane).
const cellsOf = answer => (Array.isArray(answer) ? answer : answer && typeof answer === 'object' ? [answer] : []);

export async function fetch(credentials, id, request) {
  const board = await readBoard(credentials, request);
  if (id && board._id && String(id) !== String(board._id)) throw new Error('This token belongs to another KanbanFlow board');

  const tasks = [];
  const seen = new Set();
  const add = (cell, task) => {
    if (!task || typeof task !== 'object' || seen.has(task._id)) return;
    if (tasks.length >= MAX_KANBANFLOW_FETCH_TASKS) throw new Error(`KanbanFlow board has more than ${MAX_KANBANFLOW_FETCH_TASKS} tasks`);
    seen.add(task._id);
    tasks.push({ ...task, columnId: task.columnId || cell.columnId, swimlaneId: task.swimlaneId || cell.swimlaneId });
  };
  for (const cell of cellsOf(await get(request, credentials, '/tasks'))) {
    (Array.isArray(cell.tasks) ? cell.tasks : []).forEach(task => add(cell, task));
    // A column with more tasks than one answer holds: page through it.
    let next = cell.tasksLimited ? cell.nextTaskId : null;
    for (let page = 0; next && page < MAX_PAGES_PER_CELL; page += 1) {
      const query = new URLSearchParams({ columnId: String(cell.columnId), startTaskId: String(next), limit: String(PAGE_SIZE) });
      if (cell.swimlaneId) query.set('swimlaneId', String(cell.swimlaneId));
      const more = cellsOf(await get(request, credentials, `/tasks?${query}`))
        .find(c => c.columnId === cell.columnId && (!cell.swimlaneId || c.swimlaneId === cell.swimlaneId));
      if (!more) break;
      (Array.isArray(more.tasks) ? more.tasks : []).forEach(task => add(cell, task));
      next = more.tasksLimited && more.nextTaskId !== next ? more.nextTaskId : null;
    }
  }

  const users = await get(request, credentials, '/users');

  // Comments are one request per task: for the first MAX_KANBANFLOW_COMMENT_TASKS.
  const comments = {};
  const withComments = tasks.slice(0, MAX_KANBANFLOW_COMMENT_TASKS);
  let at = 0;
  const worker = async () => {
    while (at < withComments.length) {
      const task = withComments[at++];
      const answer = await get(request, credentials, `/tasks/${encodeURIComponent(task._id)}/comments`);
      if (Array.isArray(answer) && answer.length) comments[task._id] = answer;
    }
  };
  await Promise.all(Array.from({ length: COMMENT_CONCURRENCY }, worker));

  return {
    kanbanflow: true,
    board,
    tasks,
    users: Array.isArray(users) ? users : [],
    comments,
    ...(tasks.length > MAX_KANBANFLOW_COMMENT_TASKS ? { commentsLimited: MAX_KANBANFLOW_COMMENT_TASKS } : {}),
  };
}
