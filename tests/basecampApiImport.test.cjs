'use strict';

// Basecamp import from its API: the client (models/lib/apiImport/basecamp.js)
// with a fake request, and the parser (models/lib/basecampApiFormat.js). The
// fixtures follow the JSON bc3-api documents (sections/projects.md,
// card_tables.md, card_table_cards.md, todolists.md, todos.md, comments.md).
// Run: node tests/basecampApiImport.test.cjs

const assert = require('node:assert/strict');

const ROOT = 'https://3.basecampapi.com/999999999';
const ana = { id: 1, name: 'Ana Smith', email_address: 'ana@example.com' };
const ben = { id: 2, name: 'Ben Jones', email_address: 'ben@example.com' };

const cardsOfTriage = [{
  id: 501, title: 'New landing page', content: '<div>First <b>draft</b> &amp; images<br>Line two</div><ul><li>one</li><li>two</li></ul>',
  due_on: '2026-11-01', completed: false, assignees: [ana, ben], creator: ana, created_at: '2026-10-01T09:00:00.000Z',
  steps: [{ id: 9, title: 'Sketch', completed: true }, { id: 10, title: 'Review', completed: false }, { title: '' }],
  comments_count: 2, comments_url: `${ROOT}/buckets/77/recordings/501/comments.json`,
}];
const cardsOfDone = [{ id: 502, title: 'Logo', content: '<p>Done &#8212; shipped&nbsp;now</p>', due_on: '2026-09-01', completed: true,
  assignees: [], comments_count: 0, comments_url: `${ROOT}/buckets/77/recordings/502/comments.json` }];

function routes() {
  return {
    [`${ROOT}/projects.json?page=1`]: [{ id: 77, name: 'Website' }, { id: 78, name: '  ' }, { name: 'no id' }],
    [`${ROOT}/projects.json?page=2`]: [{ id: 79, name: 'Office' }],
    [`${ROOT}/projects.json?page=3`]: [],
    [`${ROOT}/projects/77.json`]: { id: 77, name: 'Website', created_at: '2026-01-01T00:00:00.000Z', dock: [
      { id: 300, name: 'kanban_board', title: 'Card Table', enabled: true },
      { id: 400, name: 'todoset', title: 'To-dos', enabled: true },
      { id: 500, name: 'message_board', title: 'Message Board', enabled: true },
      { id: 301, name: 'kanban_board', title: 'Off', enabled: false },
    ] },
    [`${ROOT}/card_tables/300.json`]: { id: 300, title: 'Design', type: 'Kanban::Board', lists: [
      { id: 31, title: 'Triage', type: 'Kanban::Triage', cards_url: `${ROOT}/buckets/77/card_tables/lists/31/cards.json` },
      { id: 32, title: 'Done', type: 'Kanban::DoneColumn' },
      { id: 33, title: 'Not now', type: 'Kanban::NotNowColumn' },
    ] },
    [`${ROOT}/card_tables/lists/31/cards.json?page=1`]: cardsOfTriage,
    [`${ROOT}/card_tables/lists/31/cards.json?page=2`]: [],
    [`${ROOT}/card_tables/lists/32/cards.json?page=1`]: cardsOfDone,
    [`${ROOT}/card_tables/lists/32/cards.json?page=2`]: [],
    [`${ROOT}/card_tables/lists/33/cards.json?page=1`]: [],
    [`${ROOT}/buckets/77/recordings/501/comments.json?page=1`]: [
      { id: 1, content: '<div>Looks <em>good</em></div>', creator: ben, created_at: '2026-10-02T10:00:00.000Z' }],
    [`${ROOT}/buckets/77/recordings/501/comments.json?page=2`]: [
      { id: 2, content: '<div>Thanks</div>', creator: ana, created_at: '2026-10-02T11:00:00.000Z' }],
    [`${ROOT}/buckets/77/recordings/501/comments.json?page=3`]: [],
    [`${ROOT}/todosets/400/todolists.json?page=1`]: [{ id: 41, title: 'Launch', name: 'Launch' }],
    [`${ROOT}/todosets/400/todolists.json?page=2`]: [],
    [`${ROOT}/todolists/41/todos.json?page=1`]: [{ id: 601, content: 'Write press release', title: 'Write press release',
      description: '<div>For &lt;all&gt; media</div>', starts_on: '2026-10-10', due_on: '2026-10-20', completed: false,
      assignees: [ben], created_at: '2026-10-05T08:00:00.000Z', comments_count: 0 }],
    [`${ROOT}/todolists/41/todos.json?page=2`]: [],
    [`${ROOT}/todolists/41/todos.json?completed=true&page=1`]: [{ id: 602, content: 'Book venue', title: 'Book venue',
      description: '', due_on: '2026-09-15', completed: true, assignees: [], comments_count: 1,
      comments_url: 'https://evil.example/999999999/recordings/602/comments.json' }],
    [`${ROOT}/todolists/41/todos.json?completed=true&page=2`]: [],
  };
}

function fakeRequest(table = routes()) {
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, options });
    if (!(url in table)) { const error = new Error(`404 ${url}`); error.status = 404; throw error; }
    return JSON.parse(JSON.stringify(table[url]));
  };
  return { request, calls };
}

async function main() {
  const client = await import('../models/lib/apiImport/basecamp.js');
  const { parseBasecampApi, basecampText, MAX_BASECAMP_TASKS } = await import('../models/lib/basecampApiFormat.js');
  const credentials = { account: '999999999', token: 'secret-token' };

  // list: pages until an empty one, headers on every call.
  {
    const { request, calls } = fakeRequest();
    const projects = await client.list(credentials, request);
    assert.deepEqual(projects, [{ id: '77', name: 'Website' }, { id: '78', name: '78' }, { id: '79', name: 'Office' }]);
    assert.equal(calls.length, 3, 'paged to the empty third page');
    for (const { url, options } of calls) {
      assert.equal(options.method, 'GET');
      assert.equal(options.headers.Authorization, 'Bearer secret-token');
      assert.equal(options.headers['User-Agent'], 'WeKan (https://wekan.fi)');
      assert.ok(!url.includes('secret-token'), 'the token is never in a URL');
    }
  }

  // Negative: the account must be digits, the token present.
  for (const account of ['1/../x', '../1', 'abc', '', '12 34', '1?x=2']) {
    const { request, calls } = fakeRequest();
    await assert.rejects(client.list({ account, token: 't' }, request), /account id/);
    assert.equal(calls.length, 0, `nothing is requested for account ${JSON.stringify(account)}`);
  }
  await assert.rejects(client.list({ account: '1', token: ' ' }, fakeRequest().request), /access token/);
  await assert.rejects(client.fetch(credentials, '77/../1', fakeRequest().request), /Choose a Basecamp project/);
  await assert.rejects(client.fetch(credentials, '', fakeRequest().request), /Choose a Basecamp project/);

  // fetch: card tables, to-dos, comments only when counted and only from Basecamp.
  const { request, calls } = fakeRequest();
  const data = await client.fetch(credentials, 77, request);
  assert.equal(data.basecamp, true);
  assert.equal(data.project.name, 'Website');
  assert.equal(data.cardTables.length, 1, 'a disabled card table is skipped');
  assert.deepEqual(data.cardTables[0].lists.map(l => [l.title, l.type, l.cards.length]),
    [['Triage', 'Kanban::Triage', 1], ['Done', 'Kanban::DoneColumn', 1], ['Not now', 'Kanban::NotNowColumn', 0]]);
  assert.equal(data.cardTables[0].lists[0].cards[0].comments.length, 2, 'comments are paged');
  assert.equal(data.cardTables[0].lists[1].cards[0].comments.length, 0);
  assert.ok(!calls.some(c => c.url.includes('recordings/502')), 'no comments are fetched for comments_count 0');
  assert.ok(!calls.some(c => c.url.includes('evil.example')), 'a comments_url off Basecamp is not followed');
  assert.deepEqual(data.todolists.map(l => [l.title, l.todos.map(t => t.title)]), [['Launch', ['Write press release', 'Book venue']]]);
  assert.ok(calls.every(c => c.url.startsWith(`${ROOT}/`)));

  // Negative: an error status propagates.
  {
    const table = routes();
    const failing = async (url) => { if (url.includes('card_tables/300')) { const e = new Error('Forbidden'); e.status = 403; throw e; } return table[url]; };
    await assert.rejects(client.fetch(credentials, '77', failing), error => error.status === 403);
    const unauthorized = async () => { const e = new Error('Unauthorized'); e.status = 401; throw e; };
    await assert.rejects(client.list(credentials, unauthorized), error => error.status === 401);
  }
  // Negative: a non-array page and endless pages stop.
  await assert.rejects(client.list(credentials, async () => ({ error: 'x' })), /unexpected answer/);
  {
    let n = 0;
    await assert.rejects(client.list(credentials, async () => [{ id: ++n, name: 'p' }]), /too many pages|more than/);
  }

  // The parser: every field.
  const board = parseBasecampApi(JSON.stringify(data));
  assert.equal(board.board.name, 'Website');
  assert.deepEqual(board.swimlanes, [{ name: 'Design' }, { name: 'To-dos' }]);
  assert.deepEqual(board.columns.map(c => c.title), ['Triage', 'Done', 'Not now', 'Launch']);
  assert.deepEqual(board.swimlane_columns, { Design: ['Triage', 'Done', 'Not now'], 'To-dos': ['Launch'] });
  assert.deepEqual(board.warnings, []);
  assert.deepEqual(board.unsupported, []);
  const [landing, logo, press, venue] = board.tasks;
  assert.deepEqual(landing, {
    title: 'New landing page',
    description: 'First draft & images\nLine two\none\ntwo',
    column_name: 'Triage', swimlane_name: 'Design', tags: [], ref: '501',
    owner_name: 'Ana Smith', assignees: ['Ben Jones'],
    date_due: '2026-11-01T00:00:00.000Z', date_creation: '2026-10-01T09:00:00.000Z',
    comments: [
      { text: 'Looks good', author: 'Ben Jones', authorName: 'Ben Jones', date: '2026-10-02T10:00:00.000Z' },
      { text: 'Thanks', author: 'Ana Smith', authorName: 'Ana Smith', date: '2026-10-02T11:00:00.000Z' },
    ],
    checklists: [{ title: 'Steps', items: [{ title: 'Sketch', done: true }, { title: 'Review', done: false }] }],
  });
  assert.equal(logo.description, 'Done — shipped now');
  assert.equal(logo.due_complete, true);
  assert.equal(logo.archived, undefined, 'a card in Done is not archived');
  assert.equal(logo.owner_name, undefined);
  assert.deepEqual(press, {
    title: 'Write press release', description: 'For <all> media', column_name: 'Launch', swimlane_name: 'To-dos', tags: [],
    ref: '601', owner_name: 'Ben Jones', date_due: '2026-10-20T00:00:00.000Z', date_started: '2026-10-10T00:00:00.000Z',
    date_creation: '2026-10-05T08:00:00.000Z',
  });
  assert.equal(venue.archived, true, 'a completed to-do is archived');
  assert.equal(venue.due_complete, true);
  assert.equal(venue.comments, undefined);

  // HTML to text.
  assert.equal(basecampText('<p>a</p><p>b</p>'), 'a\nb');
  assert.equal(basecampText('x&#x41;&#65;&unknown;'), 'xAA&unknown;');
  assert.equal(basecampText(null), '');

  // Parser negatives: wrong shapes, bad dates, the cap.
  for (const bad of [null, [], 'not json', '{}', { basecamp: true }, { basecamp: true, project: {}, cardTables: {} },
    { basecamp: true, project: { name: 'x' }, cardTables: [], todolists: [] }, { lists: [] }]) {
    assert.throws(() => parseBasecampApi(bad), Error, `rejects ${JSON.stringify(bad)}`);
  }
  assert.throws(() => parseBasecampApi('nope'), /not valid JSON/);
  const odd = parseBasecampApi({ basecamp: true, project: { name: '' }, cardTables: [{ title: 'T', lists: [
    { title: 'A', cards: [{ title: 'x', due_on: 'soon' }, 7] }, { title: 'A', cards: [] }, 'x'] }, 5] });
  assert.equal(odd.board.name, 'Imported Basecamp project');
  assert.deepEqual(odd.swimlane_columns.T, ['A', 'A (2)']);
  assert.deepEqual(odd.unsupported.map(u => u.path),
    ['/cardTables/0/lists/0/cards/0/due_on', '/cardTables/0/lists/0/cards/1', '/cardTables/0/lists/2', '/cardTables/1']);
  const many = { basecamp: true, project: { name: 'Big' }, todolists: [{ title: 'L', todos: Array.from({ length: MAX_BASECAMP_TASKS + 1 }, () => ({ title: 't' })) }] };
  assert.throws(() => parseBasecampApi(many), /more than/);

  console.log('basecampApiImport.test.cjs: all tests passed');
}

main().catch(error => { console.error(error); process.exit(1); });
