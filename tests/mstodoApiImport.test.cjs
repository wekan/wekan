'use strict';

// Microsoft To Do import from Microsoft Graph: the client
// (models/lib/apiImport/mstodo.js) with a fake request, and the parser
// (models/lib/mstodoApiFormat.js). The fixtures follow Graph v1.0's todoTaskList
// and todoTask resources as Microsoft documents them; no Microsoft data or code
// is copied.
// Run: node tests/mstodoApiImport.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const GRAPH = 'https://graph.microsoft.com/v1.0';
const TOKEN = 'eyJ0eXAiOiJKV1QiLCJub25jZSI6InRlc3QifQ.test-token';

function graphTask(overrides = {}) {
  return {
    '@odata.etag': 'W/"abc"',
    id: 'AAMkAGI2TGuLAAA=',
    title: 'Write the report',
    body: { content: '<html><head><style>p{}</style></head><body><p>First &amp; <b>bold</b></p><p>Line&nbsp;two<br>three &#228;&#x2764;</p></body></html>', contentType: 'html' },
    importance: 'high',
    status: 'inProgress',
    isReminderOn: true,
    reminderDateTime: { dateTime: '2026-10-20T07:00:00.0000000', timeZone: 'UTC' },
    dueDateTime: { dateTime: '2026-10-21T00:00:00.0000000', timeZone: 'UTC' },
    startDateTime: { dateTime: '2026-10-15T00:00:00.0000000', timeZone: 'UTC' },
    createdDateTime: '2026-10-01T09:30:12.1234567Z',
    lastModifiedDateTime: '2026-10-02T10:00:00.0000000Z',
    categories: ['Work', 'Blue category', 'Work'],
    hasAttachments: true,
    recurrence: { pattern: { type: 'weekly', interval: 1, daysOfWeek: ['monday'] }, range: { type: 'noEnd', startDate: '2026-10-19' } },
    checklistItems: [
      { id: 's1', displayName: 'Collect numbers', isChecked: true, createdDateTime: '2026-10-01T09:31:00Z' },
      { id: 's2', displayName: 'Write summary', isChecked: false },
      { id: 's3', displayName: '  ' },
    ],
    linkedResources: [{ id: 'l1', webUrl: 'https://example.com/report', applicationName: 'Contoso', displayName: 'Report draft' }],
    ...overrides,
  };
}

function graphData() {
  return {
    mstodo: true,
    lists: [
      { id: 'list-1', displayName: 'Tasks', wellknownListName: 'defaultList', tasks: [
        graphTask(),
        { id: 'AAMkDone', title: 'Book flights', body: { content: 'Plain\ntext', contentType: 'text' }, importance: 'normal',
          status: 'completed', isReminderOn: false, completedDateTime: { dateTime: '2026-10-03T12:00:00.0000000', timeZone: 'UTC' },
          dueDateTime: { dateTime: '2026-10-04T00:00:00.0000000', timeZone: 'UTC' }, createdDateTime: '2026-09-30T08:00:00Z', categories: [] },
      ] },
      { id: 'list-2', displayName: 'Home', wellknownListName: 'none', tasks: [
        { id: 'w', title: 'Ask the plumber', status: 'waitingOnOthers', importance: 'low', body: { content: '', contentType: 'text' } },
        { id: 'd', title: 'Paint', status: 'deferred', importance: 'normal', dueDateTime: { dateTime: 'not a date', timeZone: 'UTC' } },
        'not a task',
      ] },
      { id: 'list-3', displayName: 'Home', wellknownListName: 'none', tasks: [] },
    ],
  };
}

// A fake Graph: answers from `routes`, records every call.
function fakeGraph(routes) {
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, options });
    if (!(url in routes)) { const error = new Error(`not found ${url}`); error.status = 404; throw error; }
    return routes[url];
  };
  return { request, calls };
}

async function main() {
  const client = await import('../models/lib/apiImport/mstodo.js');
  const { parseMicrosoftTodoApi, mstodoBodyText, mstodoDate, MAX_MSTODO_CARDS } = await import('../models/lib/mstodoApiFormat.js');
  const { API_IMPORT_SERVICES, cleanApiImportCredentials } = require('../models/lib/apiImportServices.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

  await test('the service is registered with one secret token field', async () => {
    const service = API_IMPORT_SERVICES.find(s => s.key === 'mstodo');
    assert.equal(service.name, 'Microsoft To Do');
    assert.deepEqual(service.fields.map(f => [f.name, f.secret === true]), [['token', true]]);
    assert.deepEqual(cleanApiImportCredentials('mstodo', { token: TOKEN }), { token: TOKEN });
    assert.throws(() => cleanApiImportCredentials('mstodo', { token: TOKEN, url: 'https://evil.example' }), /Unexpected/);
  });

  await test('list: all lists first, then every list over @odata.nextLink pages', async () => {
    const { request, calls } = fakeGraph({
      [`${GRAPH}/me/todo/lists`]: { value: [{ id: 'list-1', displayName: 'Tasks', wellknownListName: 'defaultList' }],
        '@odata.nextLink': `${GRAPH}/me/todo/lists?$skip=1` },
      [`${GRAPH}/me/todo/lists?$skip=1`]: { value: [{ id: 'list-2', displayName: 'Home' }, { displayName: 'no id' }] },
    });
    const lists = await client.list({ token: TOKEN }, request);
    assert.deepEqual(lists, [
      { id: 'all', name: 'Microsoft To Do (all lists)' },
      { id: 'list-1', name: 'Tasks' },
      { id: 'list-2', name: 'Home' },
    ]);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.options.method, 'GET');
      assert.equal(call.options.headers.Authorization, `Bearer ${TOKEN}`);
      assert.ok(!call.url.includes(TOKEN), 'the token is never in the URL');
      assert.equal(call.options.body, undefined);
    }
  });

  await test('fetch all: every list with its tasks, checklistItems expanded, paged', async () => {
    const tasksUrl = id => `${GRAPH}/me/todo/lists/${encodeURIComponent(id)}/tasks?$expand=checklistItems`;
    const { request, calls } = fakeGraph({
      [`${GRAPH}/me/todo/lists`]: { value: [
        { id: 'AAMk=1', displayName: 'Tasks', wellknownListName: 'defaultList' },
        { id: 'list-2', displayName: 'Home' },
      ] },
      [tasksUrl('AAMk=1')]: { value: [{ id: 't1', title: 'One' }], '@odata.nextLink': `${GRAPH}/me/todo/lists/AAMk%3D1/tasks?$skiptoken=x` },
      [`${GRAPH}/me/todo/lists/AAMk%3D1/tasks?$skiptoken=x`]: { value: [{ id: 't2', title: 'Two' }] },
      [tasksUrl('list-2')]: { value: [] },
    });
    const data = await client.fetch({ token: TOKEN }, 'all', request);
    assert.deepEqual(data, { mstodo: true, lists: [
      { id: 'AAMk=1', displayName: 'Tasks', wellknownListName: 'defaultList', tasks: [{ id: 't1', title: 'One' }, { id: 't2', title: 'Two' }] },
      { id: 'list-2', displayName: 'Home', wellknownListName: 'none', tasks: [] },
    ] });
    assert.ok(calls[1].url.endsWith('/lists/AAMk%3D1/tasks?$expand=checklistItems'), 'the list id is encoded');
    assert.ok(calls.every(call => call.options.headers.Authorization === `Bearer ${TOKEN}` && !call.url.includes(TOKEN)));
    // The parser reads what the client fetched.
    assert.deepEqual(parseMicrosoftTodoApi(data).columns, [{ title: 'Tasks' }, { title: 'Home' }]);
  });

  await test('fetch one list: only that list; an unknown id is refused', async () => {
    const { request, calls } = fakeGraph({
      [`${GRAPH}/me/todo/lists`]: { value: [{ id: 'a', displayName: 'A' }, { id: 'b', displayName: 'B' }] },
      [`${GRAPH}/me/todo/lists/b/tasks?$expand=checklistItems`]: { value: [{ id: 'x', title: 'X' }] },
    });
    const data = await client.fetch({ token: TOKEN }, 'b', request);
    assert.deepEqual(data.lists.map(l => l.id), ['b']);
    assert.ok(!calls.some(call => call.url.includes('/lists/a/')));
    await assert.rejects(client.fetch({ token: TOKEN }, 'nope', request), /no such list/);
    await assert.rejects(client.fetch({ token: TOKEN }, '', request), /Choose/);
  });

  await test('negative: a next link to another host is refused before it is requested', async () => {
    for (const next of ['https://evil.example/v1.0/me/todo/lists?$skip=1', 'http://graph.microsoft.com/v1.0/me/todo/lists',
      'https://graph.microsoft.com.evil.example/x', 'https://user:pw@graph.microsoft.com/x', 'not a url']) {
      const { request, calls } = fakeGraph({ [`${GRAPH}/me/todo/lists`]: { value: [], '@odata.nextLink': next } });
      await assert.rejects(client.list({ token: TOKEN }, request), /next page link/, next);
      assert.equal(calls.length, 1, `${next} is not requested`);
    }
  });

  await test('negative: no token, a wrong answer, an HTTP error and endless pages', async () => {
    await assert.rejects(client.list({}, async () => ({ value: [] })), /token is required/);
    await assert.rejects(client.list({ token: '  ' }, async () => ({ value: [] })), /token is required/);
    await assert.rejects(client.list({ token: TOKEN }, async () => ({ error: 'x' })), /did not answer/);
    const failing = async () => { const error = new Error('HTTP 401'); error.status = 401; throw error; };
    await assert.rejects(client.list({ token: TOKEN }, failing), error => error.status === 401);
    let count = 0;
    const endless = async () => { count += 1; return { value: [], '@odata.nextLink': `${GRAPH}/me/todo/lists?$skip=${count}` }; };
    await assert.rejects(client.list({ token: TOKEN }, endless), /more than 1000 pages/);
    assert.equal(count, client.MAX_MSTODO_PAGES);
    const many = async url => (url.endsWith('/me/todo/lists') ? { value: [{ id: 'a' }] }
      : { value: new Array(client.MAX_MSTODO_TASKS + 1).fill({ id: 't' }) });
    await assert.rejects(client.fetch({ token: TOKEN }, 'all', many), /more than 50000 tasks/);
  });

  await test('parse: lists, tasks and every todoTask field mapped', async () => {
    const board = parseMicrosoftTodoApi(graphData());
    assert.equal(board.board.name, 'Microsoft To Do');
    assert.deepEqual(board.columns, [{ title: 'Tasks' }, { title: 'Home' }, { title: 'Home (2)' }]);
    assert.deepEqual(board.swimlanes, [{ name: 'Default' }]);
    assert.deepEqual(board.warnings, []);
    assert.equal(board.tasks.length, 4);
    const [first, done, waiting, deferred] = board.tasks;
    assert.equal(first.title, 'Write the report');
    assert.equal(first.ref, 'AAMkAGI2TGuLAAA=');
    assert.equal(first.column_name, 'Tasks');
    assert.equal(first.swimlane_name, 'Default');
    assert.equal(first.description, 'First & bold\nLine two\nthree ä❤\n\nLinked:\n- Report draft: https://example.com/report');
    assert.equal(first.date_due, '2026-10-21T00:00:00.000Z');
    assert.equal(first.date_started, '2026-10-15T00:00:00.000Z');
    assert.equal(first.date_creation, '2026-10-01T09:30:12.123Z');
    assert.equal(first.archived, undefined);
    assert.deepEqual(first.tags, [{ name: 'Work' }, { name: 'Blue category' }, { name: 'High importance', color: 'red' },
      { name: 'In progress', color: 'blue' }]);
    assert.deepEqual(first.checklists, [{ title: 'Steps', items: [{ title: 'Collect numbers', done: true }, { title: 'Write summary', done: false }] }]);

    assert.equal(done.description, 'Plain\ntext');
    assert.equal(done.archived, true);
    assert.equal(done.date_end, '2026-10-03T12:00:00.000Z');
    assert.equal(done.due_complete, true);
    assert.deepEqual(done.tags, []);
    assert.equal(done.checklists, undefined);

    assert.equal(waiting.column_name, 'Home');
    assert.deepEqual(waiting.tags, [{ name: 'Waiting on others', color: 'orange' }]);
    assert.equal(waiting.description, '');
    assert.deepEqual(deferred.tags, [{ name: 'Deferred', color: 'gray' }]);
    assert.equal(deferred.date_due, undefined);

    const reasons = board.unsupported.map(u => `${u.path}: ${u.reason}`).join('\n');
    assert.match(reasons, /\/lists\/0\/tasks\/0\/reminderDateTime: .*reminder .*2026-10-20T07:00:00\.000Z/);
    assert.match(reasons, /\/lists\/0\/tasks\/0\/recurrence: .*repeat \(weekly\)/);
    assert.match(reasons, /\/lists\/0\/tasks\/0\/attachments: /);
    assert.match(reasons, /\/lists\/1\/tasks\/1\/dueDateTime: .*not a date/);
    assert.match(reasons, /\/lists\/1\/tasks\/2: .*not an object/);
    assert.match(reasons, /\/lists\/2\/displayName: .*"Home \(2\)"/);
    assert.doesNotMatch(reasons, /tasks\/1\/reminder/, 'a reminder that is off is not reported');
  });

  await test('parse: one list names the board; JSON text is read', async () => {
    const one = { mstodo: true, lists: [{ id: 'x', displayName: 'Groceries', tasks: [{ title: 'Milk' }] }] };
    const board = parseMicrosoftTodoApi(JSON.stringify(one));
    assert.equal(board.board.name, 'Groceries');
    assert.equal(board.tasks[0].title, 'Milk');
    assert.equal(board.tasks[0].ref, undefined);
  });

  await test('helpers: body text and Graph dates', async () => {
    assert.equal(mstodoBodyText({ content: '<ul><li>a</li><li>b &lt;c&gt;</li></ul><script>x()</script>', contentType: 'html' }), '- a\n- b <c>');
    assert.equal(mstodoBodyText({ content: '  <b>not html</b> ', contentType: 'text' }), '<b>not html</b>');
    assert.equal(mstodoBodyText(null), '');
    assert.equal(mstodoBodyText({ content: '&bogus; &#0;', contentType: 'html' }), '&bogus; &#0;');
    assert.equal(mstodoDate({ dateTime: '2026-01-02T03:04:05.0000000', timeZone: 'UTC' }), '2026-01-02T03:04:05.000Z');
    assert.equal(mstodoDate('2026-01-02T03:04:05+02:00'), '2026-01-02T01:04:05.000Z');
    assert.equal(mstodoDate(null), null);
    assert.equal(mstodoDate({ dateTime: 'x' }), undefined);
    assert.equal(mstodoDate({}), undefined);
  });

  await test('negative: wrong shapes are refused with a clear error', async () => {
    for (const bad of [null, [], 'not json {', '[]', { lists: [] }, { mstodo: true }, { mstodo: 'yes', lists: [] },
      { mstodo: true, lists: {} }, { value: [{ id: 'a' }] }]) {
      assert.throws(() => parseMicrosoftTodoApi(bad), /Microsoft To Do/, JSON.stringify(bad));
    }
    assert.throws(() => parseMicrosoftTodoApi({ mstodo: true, lists: [] }), /no lists/);
    assert.throws(() => parseMicrosoftTodoApi({ mstodo: true, lists: ['x'] }), /no lists/);
    const big = { mstodo: true, lists: [{ displayName: 'A', tasks: new Array(MAX_MSTODO_CARDS + 1).fill({ title: 't' }) }] };
    assert.throws(() => parseMicrosoftTodoApi(big), /more than 50000 tasks/);
  });

  await test('docs: the page has its sections in order', async () => {
    const doc = read('docs/Features/ImportExport/Microsoft-To-Do/Microsoft-To-Do.md');
    const sections = doc.split('\n').filter(line => line.startsWith('## ')).map(line => line.slice(3));
    assert.deepEqual(sections, ['How to import', 'How to import many boards at once', 'How to export',
      'How to export all boards at once', 'Format details', 'What is kept', 'What is not kept', 'REST API',
      'How it is built and tested', 'Sources']);
    assert.match(doc, /Tasks\.Read/);
    assert.match(doc, /POST \/api\/boards\/import\/mstodo/);
    assert.match(read('releases/live-tests/mstodo-import.mjs'), /WEKAN_LIVE_MSTODO_TOKEN/);
  });

  console.log(`\nmstodoApiImport: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
