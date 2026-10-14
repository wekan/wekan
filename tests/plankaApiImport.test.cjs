'use strict';

// Planka, imported from its REST API: the client (models/lib/apiImport/planka.js)
// with a fake `request`, and the parser (models/lib/plankaApiFormat.js). The
// fixtures are written here from the shapes Planka's server returns
// (server/api/controllers/boards/show.js and the models in
// plankanban/planka, v1 and v2). No Planka code is copied.
// Run: node tests/plankaApiImport.test.cjs

const assert = require('node:assert/strict');

const users = [
  { id: '100', username: 'ann', name: 'Ann Example', email: 'ann@example.com' },
  { id: '101', username: 'bob', name: 'Bob Example' },
];

// Planka v2: typed lists, task lists, isDueCompleted, commentsTotal.
function v2Board() {
  return {
    item: { id: '1', name: 'Website', projectId: '9' },
    included: {
      users,
      boardMemberships: [{ id: 'm1', boardId: '1', userId: '100', role: 'editor' }],
      labels: [
        { id: 'l1', name: 'bug', color: 'berry-red', position: 1 },
        { id: 'l2', name: 'later', color: 'antique-blue', position: 2 },
        { id: 'l3', name: null, color: 'egg-yellow', position: 3 },
        { id: 'l4', name: 'odd', color: 'no-such-color', position: 4 },
      ],
      lists: [
        { id: 'a', type: 'archive', position: null, name: null },
        { id: 't', type: 'trash', position: null, name: null },
        { id: 'L2', type: 'closed', position: 2, name: 'Done' },
        { id: 'L1', type: 'active', position: 1, name: 'Todo' },
        { id: 'L3', type: 'active', position: 3, name: 'Todo' },
      ],
      cards: [
        { id: 'c2', listId: 'L2', position: 1, name: 'Ship it', description: null, dueDate: null, commentsTotal: 0, createdAt: '2025-01-02T00:00:00.000Z' },
        { id: 'c1', listId: 'L1', position: 1, name: 'Write copy', description: 'Draft *it*', dueDate: '2025-06-01T12:00:00.000Z',
          isDueCompleted: true, creatorUserId: '100', commentsTotal: 2, createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'c3', listId: 'a', prevListId: 'L2', position: 1, name: 'Old one', commentsTotal: 0 },
        { id: 'c4', listId: 't', position: 2, name: 'Thrown away', commentsTotal: 0 },
        { id: 'c5', listId: 'L3', position: 1, name: 'Bad date', dueDate: 'soon', commentsTotal: 0 },
      ],
      cardMemberships: [{ id: 'cm1', cardId: 'c1', userId: '101' }, { id: 'cm2', cardId: 'c1', userId: '999' }],
      cardLabels: [
        { id: 'cl1', cardId: 'c1', labelId: 'l1' }, { id: 'cl2', cardId: 'c1', labelId: 'l2' },
        { id: 'cl3', cardId: 'c1', labelId: 'l3' }, { id: 'cl4', cardId: 'c1', labelId: 'l4' },
      ],
      taskLists: [{ id: 'tl1', cardId: 'c1', name: 'Steps', position: 1 }, { id: 'tl0', cardId: 'c1', name: 'First', position: 0 }],
      tasks: [
        { id: 't2', taskListId: 'tl1', position: 2, name: 'Outro', isCompleted: false },
        { id: 't1', taskListId: 'tl1', position: 1, name: 'Intro', isCompleted: true },
        { id: 't3', taskListId: 'tl0', position: 1, name: 'Plan', isCompleted: true },
      ],
      attachments: [{ id: 'at1', cardId: 'c1', name: 'a.png' }],
      customFieldValues: [],
      projects: [{ id: '9', name: 'Marketing' }],
    },
  };
}

// Planka v1: untyped lists, tasks on the card, isDueDateCompleted.
function v1Board() {
  return {
    item: { id: '2', name: 'Old Planka', projectId: '9' },
    included: {
      users,
      labels: [{ id: 'l1', name: 'ops', color: 'lagoon-blue' }],
      lists: [{ id: 'L1', position: 65535, name: 'Backlog' }, { id: 'L0', position: 1, name: 'Inbox' }],
      cards: [{ id: 'c1', listId: 'L1', position: 1, name: 'Deploy', dueDate: '2024-03-01T00:00:00.000Z', isDueDateCompleted: true, creatorUserId: '101' }],
      cardMemberships: [{ cardId: 'c1', userId: '100' }],
      cardLabels: [{ cardId: 'c1', labelId: 'l1' }],
      tasks: [{ id: 't1', cardId: 'c1', position: 1, name: 'Build', isCompleted: true }],
      attachments: [],
    },
  };
}

// A fake Planka: records every call, answers by method and path.
function fakePlanka({ version = 2, board = v2Board(), failBoard } = {}) {
  const calls = [];
  const request = async (url, { method = 'GET', headers = {}, body } = {}) => {
    calls.push({ url, method, headers, body });
    const path = new URL(url).pathname + new URL(url).search;
    const fail = status => { const error = new Error(`HTTP ${status}`); error.status = status; throw error; };
    if (method === 'POST' && path === '/planka/api/access-tokens') {
      if (body.password !== 'secret-pw') fail(401);
      return { item: 'tok123' };
    }
    if (method === 'DELETE' && path === '/planka/api/access-tokens/me') return { item: 'tok123' };
    if (headers.Authorization !== 'Bearer tok123') fail(401);
    if (path === '/planka/api/projects') {
      return { items: [{ id: '9', name: 'Marketing' }], included: { boards: [
        { id: '2', projectId: '9', name: 'Second', position: 2 }, { id: '1', projectId: '9', name: 'Website', position: 1 }] } };
    }
    if (/^\/planka\/api\/boards\//.test(path)) { if (failBoard) fail(failBoard); return board; }
    let match = /^\/planka\/api\/cards\/(\w+)\/comments(\?beforeId=(\w+))?$/.exec(path);
    if (match) {
      if (version !== 2) fail(404);
      if (match[1] !== 'c1') return { items: [], included: { users: [] } };
      // 51 comments over two pages, newest first.
      const all = Array.from({ length: 51 }, (_, i) => ({ id: `k${100 + i}`, text: `note ${i}`, userId: i === 50 ? '102' : '100', createdAt: `2025-02-01T00:00:${String(i % 60).padStart(2, '0')}.000Z` })).reverse();
      const start = match[3] ? all.findIndex(c => c.id === match[3]) + 1 : 0;
      return { items: all.slice(start, start + 50), included: { users: [{ id: '102', username: 'cara', name: 'Cara Former' }] } };
    }
    match = /^\/planka\/api\/cards\/(\w+)\/actions$/.exec(path);
    if (match) {
      return { items: [
        { id: 'x2', type: 'moveCard', data: {}, userId: '100' },
        { id: 'x1', type: 'commentCard', data: { text: 'v1 note' }, userId: '100', createdAt: '2024-01-01T00:00:00.000Z' },
      ], included: { users } };
    }
    return fail(404);
  };
  return { request, calls };
}

const credentials = { url: 'https://planka.example.com/planka', username: 'ann', password: 'secret-pw' };

async function main() {
  const { parsePlankaApi, plankaLabelColor, MAX_PLANKA_CARDS } = await import('../models/lib/plankaApiFormat.js');
  const client = await import('../models/lib/apiImport/planka.js');
  const { WEKAN_COLOR_HEX } = await import('../models/lib/kanriFormat.js');
  const { API_IMPORT_SERVICES } = require('../models/lib/apiImportServices.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

  await test('planka is a service with url, username and a secret password', async () => {
    const service = API_IMPORT_SERVICES.find(s => s.key === 'planka');
    assert.deepEqual(service.fields.map(f => [f.name, Boolean(f.secret)]), [['url', false], ['username', false], ['password', true]]);
  });

  await test('a v2 board maps lists, cards, dates, members, labels, task lists and comments', async () => {
    const parsed = parsePlankaApi({ planka: v2Board(), comments: { c1: [
      { text: 'Hello', userId: '100', createdAt: '2025-02-01T00:00:00.000Z' },
      { text: 'From a former member', userId: '102' },
      { text: '   ' }] }, commentUsers: { 102: { username: 'cara', name: 'Cara Former' } } });
    assert.equal(parsed.board.name, 'Website');
    assert.deepEqual(parsed.columns.map(c => c.title), ['Todo', 'Done', 'Todo (2)'], 'by position, repeated name gets (2)');
    assert.deepEqual(parsed.swimlanes, [{ name: 'Default' }]);
    assert.deepEqual(parsed.warnings, []);
    const c1 = parsed.tasks.find(t => t.ref === 'c1');
    assert.equal(c1.title, 'Write copy');
    assert.equal(c1.description, 'Draft *it*');
    assert.equal(c1.column_name, 'Todo');
    assert.equal(c1.swimlane_name, 'Default');
    assert.equal(c1.date_due, '2025-06-01T12:00:00.000Z');
    assert.equal(c1.due_complete, true);
    assert.equal(c1.date_creation, '2025-01-01T00:00:00.000Z');
    assert.equal(c1.owner_username, 'ann');
    assert.deepEqual(c1.assignees, ['bob'], 'an unknown member is left out');
    assert.deepEqual(c1.tags, [{ name: 'bug', color: 'red' }, { name: 'later', color: '#6c99bb' },
      { name: 'egg-yellow', color: 'yellow' }, { name: 'odd' }]);
    assert.deepEqual(c1.checklists, [
      { title: 'First', items: [{ title: 'Plan', done: true }] },
      { title: 'Steps', items: [{ title: 'Intro', done: true }, { title: 'Outro', done: false }] }]);
    assert.deepEqual(c1.comments, [
      { text: 'Hello', author: 'ann', authorName: 'Ann Example', date: '2025-02-01T00:00:00.000Z' },
      { text: 'From a former member', author: 'cara', authorName: 'Cara Former' }]);
    const c2 = parsed.tasks.find(t => t.ref === 'c2');
    assert.equal(c2.column_name, 'Done');
    assert.equal(c2.description, '');
    assert.equal(c2.date_due, undefined);
    assert.equal(c2.archived, undefined);
    const c3 = parsed.tasks.find(t => t.ref === 'c3');
    assert.equal(c3.archived, true, 'an archive-list card is archived');
    assert.equal(c3.column_name, 'Done', 'in the list it came from');
    assert.equal(parsed.tasks.some(t => t.ref === 'c4'), false, 'a trash card is not imported');
    const reasons = parsed.unsupported.map(u => u.reason).join('\n');
    assert.match(reasons, /two lists named "Todo"/);
    assert.match(reasons, /1 card\(s\) in the Planka trash/);
    assert.match(reasons, /1 Planka attachment/);
    assert.match(reasons, /due date "soon" is not a date/);
  });

  await test('every mapped label color is a WeKan color name or a hex', async () => {
    for (const name of ['muddy-grey', 'berry-red', 'pink-tulip', 'pirate-gold', 'turquoise-sea']) {
      const color = plankaLabelColor(name);
      assert.ok(WEKAN_COLOR_HEX[color] || /^#[0-9a-f]{6}$/.test(color), `${name} -> ${color}`);
    }
    assert.equal(plankaLabelColor('LAGOON-BLUE'), 'blue');
    assert.equal(plankaLabelColor('nope'), undefined);
  });

  await test('a v1 board maps tasks on the card and isDueDateCompleted; JSON text is read too', async () => {
    const parsed = parsePlankaApi(JSON.stringify({ planka: v1Board(), comments: { c1: [{ text: 'v1 note', userId: '100' }] } }));
    assert.equal(parsed.board.name, 'Old Planka');
    assert.deepEqual(parsed.columns.map(c => c.title), ['Inbox', 'Backlog']);
    const [task] = parsed.tasks;
    assert.equal(task.column_name, 'Backlog');
    assert.equal(task.due_complete, true);
    assert.equal(task.owner_username, 'bob');
    assert.deepEqual(task.assignees, ['ann']);
    assert.deepEqual(task.tags, [{ name: 'ops', color: 'blue' }]);
    assert.deepEqual(task.checklists, [{ title: 'Tasks', items: [{ title: 'Build', done: true }] }]);
    assert.equal(task.comments[0].author, 'ann');
  });

  await test('wrong shapes are refused with a clear error', async () => {
    assert.throws(() => parsePlankaApi('not json'), /not valid JSON/);
    assert.throws(() => parsePlankaApi([]), /must be an object/);
    assert.throws(() => parsePlankaApi({ item: {} }), /must be an object/);
    assert.throws(() => parsePlankaApi({ planka: { item: {} } }), /needs "item" and "included"/);
    assert.throws(() => parsePlankaApi({ planka: { item: {}, included: { lists: [] } } }), /needs lists and cards/);
    const big = v1Board();
    big.included.cards = Array.from({ length: MAX_PLANKA_CARDS + 1 }, (_, i) => ({ id: `c${i}`, listId: 'L1' }));
    assert.throws(() => parsePlankaApi({ planka: big }), /more than 20000 cards/);
  });

  await test('the client logs in, lists boards as "project / board" and logs out', async () => {
    const { request, calls } = fakePlanka();
    const boards = await client.list(credentials, request);
    assert.deepEqual(boards, [{ id: '1', name: 'Marketing / Website' }, { id: '2', name: 'Marketing / Second' }]);
    assert.deepEqual(calls[0].body, { emailOrUsername: 'ann', password: 'secret-pw' });
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls.at(-1).method, 'DELETE');
    assert.ok(calls.every(c => !c.url.includes('secret-pw')), 'the password is never in a URL');
  });

  await test('fetch reads the board and v2 comments over pages, oldest first, and parses', async () => {
    const { request, calls } = fakePlanka();
    const data = await client.fetch(credentials, '1', request);
    assert.equal(data.planka.item.name, 'Website');
    assert.equal(data.comments.c1.length, 51);
    assert.equal(data.comments.c1[0].text, 'note 0');
    assert.equal(data.commentUsers['102'].username, 'cara');
    assert.ok(calls.some(c => c.url.endsWith('/comments?beforeId=k101')), 'the second page');
    assert.ok(!calls.some(c => /cards\/c2\//.test(c.url)), 'a card with commentsTotal 0 is not asked');
    assert.ok(calls.every(c => !c.url.includes('secret-pw')));
    const parsed = parsePlankaApi(data);
    assert.equal(parsed.tasks.find(t => t.ref === 'c1').comments.at(-1).author, 'cara');
  });

  await test('fetch falls back to v1 comment actions when /comments is 404', async () => {
    const { request, calls } = fakePlanka({ version: 1, board: v1Board() });
    const data = await client.fetch(credentials, '2', request);
    assert.deepEqual(data.comments, { c1: [{ text: 'v1 note', userId: '100', createdAt: '2024-01-01T00:00:00.000Z' }] });
    assert.ok(calls.some(c => c.url.endsWith('/api/cards/c1/actions')));
  });

  await test('errors keep their status; bad input is refused before any request', async () => {
    const wrong = fakePlanka();
    await assert.rejects(client.list({ ...credentials, password: 'wrong' }, wrong.request), error => error.status === 401);
    const failing = fakePlanka({ failBoard: 403 });
    await assert.rejects(client.fetch(credentials, '1', failing.request), error => error.status === 403);
    assert.equal(failing.calls.at(-1).method, 'DELETE', 'logged out even after a failure');
    const none = fakePlanka();
    await assert.rejects(client.fetch(credentials, '../x', none.request), /Choose a Planka board/);
    await assert.rejects(client.list({ ...credentials, url: 'ftp://x' }, none.request), /must start with/);
    await assert.rejects(client.list({ ...credentials, password: '' }, none.request), /username and password/);
    assert.equal(none.calls.length, 0);
    const noToken = async () => ({ pendingToken: 'p' });
    await assert.rejects(client.list(credentials, noToken), /did not log in/);
  });

  console.log(`\nplankaApiImport: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
