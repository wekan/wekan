'use strict';

// Google Tasks API import: the client (models/lib/apiImport/googletasks.js)
// with a fake request, and the parser (models/lib/googletasksApiFormat.js).
// Fixtures follow the Tasks API v1 TaskList and Task resources
// (https://developers.google.com/workspace/tasks/reference/rest).
// Run: node tests/googletasksApiImport.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const TOKEN = 'ya29.a0AfB_live-looking-token';

function fixture() {
  return {
    googletasks: true,
    lists: [
      {
        id: 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTA6MDow',
        title: 'My Tasks',
        tasks: [
          { id: 'tB', title: 'Second', status: 'needsAction', position: '00000000000000000001', updated: '2026-05-02T08:00:00.000Z' },
          {
            id: 'tA', title: 'Plan trip', notes: 'Book early', status: 'needsAction',
            due: '2026-06-01T00:00:00.000Z', position: '00000000000000000000',
            links: [{ type: 'email', description: 'Flight offer', link: 'https://mail.google.com/mail/#all/abc' }, { link: 'https://example.com/x' }],
            updated: '2026-05-01T10:00:00.000Z', webViewLink: 'https://tasks.google.com/task/tA',
          },
          { id: 's2', title: 'Hotel', parent: 'tA', status: 'needsAction', position: '00000000000000000001', notes: 'Near station' },
          { id: 's1', title: 'Flights', parent: 'tA', status: 'completed', completed: '2026-05-03T09:00:00.000Z', position: '00000000000000000000' },
          { id: 'tC', title: 'Done thing', status: 'completed', completed: '2026-05-04T12:30:00.000Z', hidden: true, position: '00000000000000000002' },
          { id: 'tD', title: 'Gone', status: 'needsAction', deleted: true, position: '00000000000000000003' },
          { id: 'orphan', title: 'Lost child', parent: 'missing', status: 'needsAction', position: '00000000000000000004' },
        ],
      },
      { id: 'L2', title: 'Work', tasks: [{ id: 'w1', title: 'Report', status: 'needsAction', due: '2026-07-10T00:00:00.000Z', position: '0' }] },
      { id: 'L3', title: 'Work', tasks: [] },
    ],
  };
}

// A fake Google: lists in two pages, tasks of each list.
function fakeGoogle({ repeatToken = false, failStatus = 0 } = {}) {
  const calls = [];
  const lists = [{ id: 'L1', title: 'My Tasks', updated: 'x' }, { id: 'L2', title: 'Work' }];
  const request = async (url, options) => {
    calls.push({ url, options });
    if (failStatus) { const error = new Error(`HTTP ${failStatus}`); error.status = failStatus; throw error; }
    const u = new URL(url);
    if (u.pathname === '/tasks/v1/users/@me/lists') {
      if (!u.searchParams.get('pageToken')) return { kind: 'tasks#taskLists', items: [lists[0]], nextPageToken: 'p2' };
      return { items: [lists[1]], ...(repeatToken ? { nextPageToken: 'p2' } : {}) };
    }
    if (u.pathname === '/tasks/v1/users/@me/lists/L2') return lists[1];
    const match = /^\/tasks\/v1\/lists\/([^/]+)\/tasks$/.exec(u.pathname);
    if (match) {
      assert.equal(u.searchParams.get('showCompleted'), 'true');
      assert.equal(u.searchParams.get('showHidden'), 'true');
      if (match[1] === 'L1' && !u.searchParams.get('pageToken')) return { items: [{ id: 'a', title: 'A', position: '0' }], nextPageToken: 't2' };
      if (match[1] === 'L1') return { items: [{ id: 'b', title: 'B', position: '1' }] };
      return { items: [{ id: 'c', title: 'C', position: '0' }] };
    }
    throw new Error(`unexpected ${url}`);
  };
  return { request, calls };
}

async function main() {
  const client = await import('../models/lib/apiImport/googletasks.js');
  const { parseGoogleTasksApi, MAX_GOOGLE_TASKS } = await import('../models/lib/googletasksApiFormat.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  const { apiImportService, cleanApiImportCredentials } = require('../models/lib/apiImportServices.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

  await test('the service takes one secret token', async () => {
    assert.deepEqual(apiImportService('googletasks').fields.map(f => [f.name, f.secret]), [['token', true]]);
    assert.deepEqual(cleanApiImportCredentials('googletasks', { token: TOKEN }), { token: TOKEN });
    assert.throws(() => cleanApiImportCredentials('googletasks', {}), /token is required/);
  });

  await test('list: "all" first, then every list across pages, with a Bearer header', async () => {
    const { request, calls } = fakeGoogle();
    const choices = await client.list({ token: TOKEN }, request);
    assert.deepEqual(choices, [{ id: 'all', name: 'Google Tasks (all lists)' }, { id: 'L1', name: 'My Tasks' }, { id: 'L2', name: 'Work' }]);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, 'https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100');
    assert.match(calls[1].url, /pageToken=p2$/);
    for (const call of calls) {
      assert.equal(call.options.method, 'GET');
      assert.equal(call.options.headers.Authorization, `Bearer ${TOKEN}`);
    }
  });

  await test('fetch all: every list and its tasks across pages; the token is never in a URL', async () => {
    const { request, calls } = fakeGoogle();
    const data = await client.fetch({ token: TOKEN }, 'all', request);
    assert.deepEqual(data, { googletasks: true, lists: [
      { id: 'L1', title: 'My Tasks', tasks: [{ id: 'a', title: 'A', position: '0' }, { id: 'b', title: 'B', position: '1' }] },
      { id: 'L2', title: 'Work', tasks: [{ id: 'c', title: 'C', position: '0' }] },
    ] });
    assert.ok(calls.some(c => c.url === 'https://tasks.googleapis.com/tasks/v1/lists/L1/tasks?maxResults=100&showCompleted=true&showHidden=true'));
    assert.ok(calls.every(c => !c.url.includes(TOKEN) && !c.url.includes('access_token')));
    assert.equal(parseGoogleTasksApi(data).board.name, 'Google Tasks');
  });

  await test('fetch one list: its title, and only its tasks', async () => {
    const { request, calls } = fakeGoogle();
    const data = await client.fetch({ token: TOKEN }, 'L2', request);
    assert.deepEqual(data, { googletasks: true, lists: [{ id: 'L2', title: 'Work', tasks: [{ id: 'c', title: 'C', position: '0' }] }] });
    assert.equal(calls.length, 2);
    assert.equal(parseGoogleTasksApi(data).board.name, 'Work');
  });

  await test('negative: a repeated page token aborts, an error status propagates, no token is refused', async () => {
    await assert.rejects(client.list({ token: TOKEN }, fakeGoogle({ repeatToken: true }).request), /repeated a page token/);
    await assert.rejects(client.fetch({ token: TOKEN }, 'all', fakeGoogle({ repeatToken: true }).request), /repeated a page token/);
    await assert.rejects(client.list({ token: TOKEN }, fakeGoogle({ failStatus: 401 }).request), error => error.status === 401);
    await assert.rejects(client.fetch({ token: TOKEN }, 'L2', fakeGoogle({ failStatus: 403 }).request), error => error.status === 403);
    const { request, calls } = fakeGoogle();
    await assert.rejects(client.list({ token: '' }, request), /token is required/);
    await assert.rejects(client.list({}, request), /token is required/);
    await assert.rejects(client.fetch({ token: TOKEN }, '', request), /Choose/);
    assert.equal(calls.length, 0, 'nothing is sent without a token');
  });

  await test('negative: endless paging and too many tasks are bounded', async () => {
    let n = 0;
    const endless = async () => ({ items: [], nextPageToken: `p${n += 1}` });
    await assert.rejects(client.list({ token: TOKEN }, endless), /too many pages/);
    const huge = async url => (url.includes('/users/@me/lists?')
      ? { items: [{ id: 'L1', title: 'Big' }] }
      : { items: Array.from({ length: client.MAX_TASKS + 1 }, (_, i) => ({ id: String(i) })) });
    await assert.rejects(client.fetch({ token: TOKEN }, 'all', huge), /more than 20000/);
  });

  await test('a list id is encoded into the path', async () => {
    const urls = [];
    await client.fetch({ token: TOKEN }, 'a/b?c', async url => { urls.push(url); return url.includes('/tasks?') ? { items: [] } : { title: 'X' }; });
    assert.equal(urls[0], 'https://tasks.googleapis.com/tasks/v1/users/@me/lists/a%2Fb%3Fc');
    assert.match(urls[1], /\/lists\/a%2Fb%3Fc\/tasks\?/);
  });

  await test('parse: lists, cards by position, notes and links, due, completed, subtasks', async () => {
    const board = parseGoogleTasksApi(fixture());
    assert.equal(board.board.name, 'Google Tasks');
    assert.deepEqual(board.columns.map(c => c.title), ['My Tasks', 'Work', 'Work (2)']);
    assert.deepEqual(board.swimlanes, [{ name: 'Default' }]);
    assert.deepEqual(board.warnings, []);
    assert.deepEqual(board.tasks.map(t => t.title), ['Plan trip', 'Second', 'Done thing', 'Lost child', 'Report']);
    const [trip, second, done, orphan, report] = board.tasks;
    assert.deepEqual(trip, {
      title: 'Plan trip',
      description: 'Book early\nFlight offer: https://mail.google.com/mail/#all/abc\nhttps://example.com/x',
      column_name: 'My Tasks', swimlane_name: 'Default', ref: 'tA', date_due: '2026-06-01T00:00:00.000Z',
      checklists: [{ title: 'Subtasks', items: [{ title: 'Flights', done: true }, { title: 'Hotel', done: false }] }],
    });
    assert.equal(second.archived, undefined);
    assert.equal(second.description, '');
    assert.equal(done.archived, true);
    assert.equal(done.date_end, '2026-05-04T12:30:00.000Z');
    assert.equal(orphan.ref, 'orphan');
    assert.equal(report.column_name, 'Work');
    assert.equal(report.date_due, '2026-07-10T00:00:00.000Z');
    const paths = board.unsupported.map(u => u.path);
    assert.ok(paths.includes('/lists/0/tasks'), 'deleted tasks are counted');
    assert.match(board.unsupported.find(u => u.path === '/lists/0/tasks').reason, /^1 deleted/);
    assert.ok(paths.includes('/lists/0/tasks/6/parent'), 'an orphan subtask is reported');
    assert.ok(paths.includes('/lists/0/tasks/2'), 'notes of a subtask are reported lost');
    assert.ok(paths.includes('/lists/2/title'), 'a repeated list title is reported');
    // What KanboardCreator then writes.
    const plan = planImportedTask(done);
    assert.equal(plan.card.archived, true);
    assert.ok(plan.card.endAt instanceof Date || typeof plan.card.endAt === 'string');
  });

  await test('parse: JSON text, one list names the board, a due time is ignored', async () => {
    const data = { googletasks: true, lists: [{ id: 'x', title: 'Groceries', tasks: [{ id: '1', title: 'Milk', due: '2026-03-05T15:45:00.000Z' }] }] };
    const board = parseGoogleTasksApi(JSON.stringify(data));
    assert.equal(board.board.name, 'Groceries');
    assert.equal(board.tasks[0].date_due, '2026-03-05T00:00:00.000Z');
  });

  await test('negative: wrong shapes and bad values are rejected or reported', async () => {
    assert.throws(() => parseGoogleTasksApi('not json'), /not valid JSON/);
    assert.throws(() => parseGoogleTasksApi(null), /googletasks: true/);
    assert.throws(() => parseGoogleTasksApi([]), /googletasks: true/);
    assert.throws(() => parseGoogleTasksApi({ lists: [] }), /googletasks: true/);
    assert.throws(() => parseGoogleTasksApi({ googletasks: true, lists: {} }), /googletasks: true/);
    assert.throws(() => parseGoogleTasksApi({ googletasks: true, lists: [] }), /no task lists/);
    assert.throws(() => parseGoogleTasksApi({ googletasks: true, lists: [{ title: 'A', tasks: 'x' }] }), /must be an array/);
    assert.throws(() => parseGoogleTasksApi({ planka: true, items: [] }), /googletasks: true/);
    const many = { googletasks: true, lists: [{ title: 'A', tasks: Array.from({ length: MAX_GOOGLE_TASKS + 1 }, (_, i) => ({ id: String(i) })) }] };
    assert.throws(() => parseGoogleTasksApi(many), /more than 20000/);
    const board = parseGoogleTasksApi({ googletasks: true, lists: [null, { title: '', tasks: [5, { id: 'q', title: '', due: 'soon' }] }] });
    assert.deepEqual(board.columns, [{ title: 'Untitled' }]);
    assert.equal(board.tasks[0].title, 'Untitled');
    assert.equal(board.tasks[0].date_due, undefined);
    assert.deepEqual(board.unsupported.map(u => u.path), ['/lists/0', '/lists/1/tasks/0', '/lists/1/tasks/1/due']);
    // A task that names itself as parent is a card, not its own checklist.
    const self = parseGoogleTasksApi({ googletasks: true, lists: [{ title: 'A', tasks: [{ id: 'z', title: 'Z', parent: 'z' }] }] });
    assert.equal(self.tasks.length, 1);
    assert.equal(self.tasks[0].checklists, undefined);
  });

  await test('the docs page has its sections in order', async () => {
    const doc = read('docs/Features/Board-Sidebar/Board-Settings/Import-Export/Google-Tasks/Google-Tasks.md');
    const sections = doc.split('\n').filter(line => line.startsWith('## ')).map(line => line.slice(3));
    assert.deepEqual(sections, ['How to import', 'How to import many boards at once', 'How to export', 'How to export all boards at once',
      'Format details', 'What is kept', 'What is not kept', 'REST API', 'How it is built and tested', 'Sources']);
    assert.match(doc, /POST \/api\/boards\/import\/googletasks/);
    assert.match(read('releases/live-tests/googletasks-import.mjs'), /WEKAN_LIVE_GOOGLE_TASKS_TOKEN/);
    assert.doesNotMatch(read('releases/live-tests/googletasks-import.mjs'), /method: '(POST|PUT|PATCH|DELETE)'/, 'the live test only reads');
  });

  console.log(`\ngoogletasksApiImport: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
