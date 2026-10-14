'use strict';

// KanbanFlow through its API: the client (models/lib/apiImport/kanbanflow.js)
// with a fake request, and the parser (models/lib/kanbanflowApiFormat.js).
// The fixtures are written here from the fields https://kanbanflow.com/api
// documents.
// Run: node tests/kanbanflowApiImport.test.cjs

const assert = require('node:assert/strict');

const TOKEN = 'kf-secret-token-123';
const AUTH = `Basic ${Buffer.from(`apiToken:${TOKEN}`).toString('base64')}`;

const BOARD = {
  _id: 'b1',
  name: 'Product',
  columns: [{ uniqueId: 'c1', name: 'To-do' }, { uniqueId: 'c2', name: 'Do today' }, { uniqueId: 'c3', name: 'Done' }],
  swimlanes: [{ uniqueId: 's1', name: 'Team A' }, { uniqueId: 's2', name: 'Team B' }],
  colors: [{ name: 'Red', value: 'red', description: 'Bug' }, { name: 'Green', value: 'green', description: '' }],
};
const USERS = [{ _id: 'u1', fullName: 'Ann Smith', email: 'ann@example.com' }, { _id: 'u2', fullName: 'Bob Jones', email: 'bob@example.com' }];

function task(id, fields = {}) {
  return { _id: id, name: `Task ${id}`, description: '', color: 'yellow', columnId: 'c1', swimlaneId: 's1',
    totalSecondsSpent: 0, totalSecondsEstimate: 0, ...fields };
}

const FULL_TASK = task('t1', {
  name: 'Fix login',
  description: 'Users cannot log in',
  color: 'red',
  totalSecondsSpent: 5400,
  totalSecondsEstimate: 7200,
  responsibleUserId: 'u1',
  dates: [{ targetColumnId: 'c3', status: 'done', dateType: 'dueDate', dueTimestamp: '2026-03-15T10:00:00Z', dueTimestampLocal: '2026-03-15T12:00:00+02:00' }],
  subTasks: [{ name: 'Reproduce', finished: true }, { name: 'Patch', finished: false, userId: 'u2', dueDate: '2026-03-14' }],
  labels: [{ name: 'backend', pinned: true }, { name: 'urgent', pinned: false }],
  collaborators: [{ userId: 'u2' }, { userId: 'u1' }],
});

// A fake KanbanFlow: column c1/s1 holds more tasks than one answer.
function fakeKanbanflow({ fail } = {}) {
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, options });
    if (fail && fail(url)) { const error = new Error('HTTP 401'); error.status = 401; throw error; }
    const u = new URL(url);
    assert.equal(u.origin, 'https://kanbanflow.com');
    const path = u.pathname.replace('/api/v1', '');
    if (path === '/board') return BOARD;
    if (path === '/users') return USERS;
    if (path === '/tasks' && !u.searchParams.get('startTaskId')) {
      return [
        { columnId: 'c1', columnName: 'To-do', swimlaneId: 's1', tasksLimited: true, nextTaskId: 't3', tasks: [FULL_TASK, task('t2')] },
        { columnId: 'c2', columnName: 'Do today', swimlaneId: 's2', tasksLimited: false, tasks: [task('t5', { columnId: 'c2', swimlaneId: 's2' })] },
        { columnId: 'c3', columnName: 'Done', swimlaneId: 's1', tasksLimited: false, tasks: [] },
      ];
    }
    if (path === '/tasks') {
      assert.equal(u.searchParams.get('columnId'), 'c1');
      assert.equal(u.searchParams.get('swimlaneId'), 's1');
      if (u.searchParams.get('startTaskId') === 't3') {
        return [{ columnId: 'c1', swimlaneId: 's1', tasksLimited: true, nextTaskId: 't4', tasks: [task('t3')] }];
      }
      if (u.searchParams.get('startTaskId') === 't4') {
        return [{ columnId: 'c1', swimlaneId: 's1', tasksLimited: false, tasks: [task('t4')] }];
      }
    }
    const comments = /^\/tasks\/([^/]+)\/comments$/.exec(path);
    if (comments) {
      return comments[1] === 't1'
        ? [{ _id: 'm1', text: 'Seen it too', authorUserId: 'u2', createdTimestamp: '2026-03-10T09:00:00Z' }, { _id: 'm2', text: '  ' }]
        : [];
    }
    throw new Error(`unexpected request ${url}`);
  };
  return { request, calls };
}

async function main() {
  const client = await import('../models/lib/apiImport/kanbanflow.js');
  const { parseKanbanflowApi, KANBANFLOW_COLORS, MAX_KANBANFLOW_TASKS } = await import('../models/lib/kanbanflowApiFormat.js');
  const { apiImportService } = require('../models/lib/apiImportServices.js');

  // The service entry the client answers to.
  const service = apiImportService('kanbanflow');
  assert.deepEqual(service.fields.map(f => f.name), ['token']);
  assert.equal(service.fields[0].secret, true);

  // --- client: list ---
  {
    const { request, calls } = fakeKanbanflow();
    assert.deepEqual(await client.list({ token: TOKEN }, request), [{ id: 'b1', name: 'Product' }]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://kanbanflow.com/api/v1/board');
    assert.equal(calls[0].options.method, 'GET');
    assert.equal(calls[0].options.headers.Authorization, AUTH);
  }

  // --- client: fetch, with paging and comments ---
  const { request, calls } = fakeKanbanflow();
  const data = await client.fetch({ token: TOKEN }, 'b1', request);
  assert.equal(data.kanbanflow, true);
  assert.equal(data.board, BOARD);
  assert.deepEqual(data.tasks.map(t => t._id), ['t1', 't2', 't3', 't4', 't5'], 'tasksLimited column paged through');
  assert.ok(data.tasks.every(t => t.columnId && t.swimlaneId));
  assert.deepEqual(data.users, USERS);
  assert.deepEqual(Object.keys(data.comments), ['t1']);
  assert.equal(data.comments.t1[0].text, 'Seen it too');
  for (const call of calls) {
    assert.equal(call.options.headers.Authorization, AUTH, `Basic auth on ${call.url}`);
    assert.ok(!call.url.includes(TOKEN), 'the token is never in a URL');
    assert.ok(!call.url.includes(encodeURIComponent(TOKEN)));
  }
  const pages = calls.filter(c => c.url.includes('startTaskId='));
  assert.equal(pages.length, 2);
  assert.ok(pages[0].url.includes('columnId=c1') && pages[0].url.includes('swimlaneId=s1') && pages[0].url.includes('startTaskId=t3'));
  assert.equal(calls.filter(c => /\/comments$/.test(c.url)).length, 5, 'one comments request per task');

  // Negative: errors propagate with their status; no token, another board.
  {
    const { request: failing } = fakeKanbanflow({ fail: url => url.endsWith('/board') });
    await assert.rejects(client.list({ token: TOKEN }, failing), error => error.status === 401);
    const { request: failingComments } = fakeKanbanflow({ fail: url => url.endsWith('/comments') });
    await assert.rejects(client.fetch({ token: TOKEN }, 'b1', failingComments), error => error.status === 401);
    await assert.rejects(client.list({}, request), /token is required/);
    await assert.rejects(client.list({ token: '' }, request), /token is required/);
    await assert.rejects(client.fetch({ token: TOKEN }, 'other', request), /another KanbanFlow board/);
    await assert.rejects(client.list({ token: TOKEN }, async () => [1, 2]), /did not return a board/);
    await assert.rejects(client.list({ token: TOKEN }, async () => ({ name: 'x' })), /did not return a board/);
  }
  // Bounded: a column that never stops paging ends at the cap.
  {
    let n = 0;
    const endless = async url => {
      if (url.endsWith('/board')) return BOARD;
      if (url.endsWith('/users')) return [];
      if (url.endsWith('/comments')) return [];
      n += 1;
      return [{ columnId: 'c1', tasksLimited: true, nextTaskId: `n${n}`, tasks: [task(`x${n}`)] }];
    };
    const big = await client.fetch({ token: TOKEN }, '', endless);
    assert.ok(big.tasks.length <= client.MAX_KANBANFLOW_FETCH_TASKS);
    assert.equal(big.commentsLimited, undefined, 'under the comment bound');
  }

  // --- parser: every field ---
  const parsed = parseKanbanflowApi(data);
  assert.deepEqual(parsed.board, { name: 'Product' });
  assert.deepEqual(parsed.columns, [{ title: 'To-do' }, { title: 'Do today' }, { title: 'Done' }]);
  assert.deepEqual(parsed.swimlanes, [{ name: 'Team A' }, { name: 'Team B' }]);
  assert.equal(parsed.tasks.length, 5);
  const t1 = parsed.tasks[0];
  assert.equal(t1.title, 'Fix login');
  assert.equal(t1.description, 'Users cannot log in');
  assert.equal(t1.column_name, 'To-do');
  assert.equal(t1.swimlane_name, 'Team A');
  assert.equal(t1.ref, 't1');
  assert.equal(t1.color, 'red');
  assert.deepEqual(t1.tags, [{ name: 'Bug', color: 'red' }, { name: 'backend' }, { name: 'urgent' }]);
  assert.equal(t1.date_due, '2026-03-15T10:00:00.000Z');
  assert.equal(t1.due_complete, true);
  assert.equal(t1.spent_hours, 1.5);
  assert.deepEqual(t1.custom_fields, { 'Estimate (hours)': 2 });
  assert.equal(t1.owner_name, 'Ann Smith');
  assert.deepEqual(t1.assignees, ['Bob Jones'], 'the owner is not repeated as an assignee');
  assert.deepEqual(t1.checklists, [{ title: 'Subtasks', items: [{ title: 'Reproduce', done: true }, { title: 'Patch', done: false }] }]);
  assert.deepEqual(t1.comments, [{ text: 'Seen it too', author: 'Bob Jones', date: '2026-03-10T09:00:00.000Z' }]);
  assert.ok(parsed.unsupported.some(u => u.path === '/tasks/0/subTasks'));
  assert.ok(parsed.unsupported.some(u => u.path === '/tasks/0/dates/0/targetColumnId'));
  const t5 = parsed.tasks.find(t => t.ref === 't5');
  assert.equal(t5.column_name, 'Do today');
  assert.equal(t5.swimlane_name, 'Team B');
  assert.equal(t5.color, 'yellow');
  assert.deepEqual(t5.tags, []);
  for (const key of ['date_due', 'due_complete', 'spent_hours', 'custom_fields', 'owner_name', 'assignees', 'checklists', 'comments']) {
    assert.equal(t5[key], undefined, `an empty task has no ${key}`);
  }
  // From JSON text as well (the REST API and a pasted fetch).
  assert.deepEqual(parseKanbanflowApi(JSON.stringify(data)), parsed);

  // Colors: all ten, cyan and brown renamed.
  assert.deepEqual(Object.keys(KANBANFLOW_COLORS).sort(),
    ['blue', 'brown', 'cyan', 'green', 'magenta', 'orange', 'purple', 'red', 'white', 'yellow']);
  assert.equal(KANBANFLOW_COLORS.cyan, 'sky');
  assert.equal(KANBANFLOW_COLORS.brown, 'saddlebrown');
  const { WEKAN_COLOR_HEX } = await import('../models/lib/kanriFormat.js');
  for (const name of Object.values(KANBANFLOW_COLORS)) assert.ok(WEKAN_COLOR_HEX[name], `${name} is a WeKan color`);

  // No swimlanes: Default. Unknown column: reported, not guessed. Odd color and date: reported.
  {
    const p = parseKanbanflowApi({ board: { name: '', columns: [{ uniqueId: 'c1', name: 'A' }, { uniqueId: 'c2', name: 'A' }] },
      tasks: [task('a', { swimlaneId: undefined, color: 'teal', dates: [{ dateType: 'dueDate', status: 'active', dueTimestamp: 'soon' }] }),
        task('b', { columnId: 'zz' }), 'junk'], users: [] });
    assert.deepEqual(p.swimlanes, [{ name: 'Default' }]);
    assert.deepEqual(p.columns, [{ title: 'A' }, { title: 'A (2)' }]);
    assert.equal(p.board.name, 'Imported KanbanFlow board');
    assert.equal(p.tasks.length, 1);
    assert.equal(p.tasks[0].swimlane_name, 'Default');
    assert.equal(p.tasks[0].color, undefined);
    assert.equal(p.tasks[0].date_due, undefined);
    assert.equal(p.tasks[0].due_complete, undefined);
    const paths = p.unsupported.map(u => u.path);
    for (const path of ['/board/columns/1/name', '/tasks/0/color', '/tasks/0/dates/0', '/tasks/1/columnId', '/tasks/2']) {
      assert.ok(paths.includes(path), `reported: ${path}`);
    }
  }
  // An active due date is not done; a user without a name falls back to email.
  {
    const p = parseKanbanflowApi({ board: { columns: [{ uniqueId: 'c1', name: 'A' }] }, users: [{ _id: 'u9', email: 'x@example.com' }],
      tasks: [task('a', { responsibleUserId: 'u9', dates: [{ dateType: 'dueDate', status: 'active', dueTimestamp: '2026-01-01T00:00:00Z' }] })] });
    assert.equal(p.tasks[0].date_due, '2026-01-01T00:00:00.000Z');
    assert.equal(p.tasks[0].due_complete, undefined);
    assert.equal(p.tasks[0].owner_name, 'x@example.com');
  }
  // The comment bound is reported.
  assert.ok(parseKanbanflowApi({ ...data, commentsLimited: 5000 }).unsupported.some(u => u.path === '/comments'));

  // Negative: wrong shapes are refused with a clear message.
  assert.throws(() => parseKanbanflowApi('{not json'), /not valid JSON/);
  assert.throws(() => parseKanbanflowApi([]), /must be a JSON object/);
  assert.throws(() => parseKanbanflowApi(null), /must be a JSON object/);
  assert.throws(() => parseKanbanflowApi({ tasks: [] }), /needs the board/);
  assert.throws(() => parseKanbanflowApi({ board: { name: 'x' }, tasks: [] }), /columns array/);
  assert.throws(() => parseKanbanflowApi({ board: { columns: [{ uniqueId: 'c1', name: 'A' }] } }), /tasks array/);
  assert.throws(() => parseKanbanflowApi({ board: { columns: [] }, tasks: [] }), /no columns/);
  // A Kanri or Trello document is not KanbanFlow.
  assert.throws(() => parseKanbanflowApi({ title: 'Kanri', columns: [] }), /needs the board/);
  assert.throws(() => parseKanbanflowApi({ board: { columns: [{ uniqueId: 'c1', name: 'A' }] },
    tasks: new Array(MAX_KANBANFLOW_TASKS + 1).fill(null) }), /more than 20000 tasks/);

  console.log('kanbanflowApiImport: all tests passed');
}

main().catch(error => { console.error(error); process.exit(1); });
