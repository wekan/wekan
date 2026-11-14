'use strict';

// A REST write that changes nothing answers 404 (or 409), never 200.
//
// #6900, #6905 and #6906 fixed the integration, custom-field and dropdown-item
// deletions, which answered 200 when their selector matched nothing. The same
// shape was in the swimlane, list, card, dependency and domain deletions, the
// custom-field and dropdown-item updates, the board-member add and remove, and
// the token deletion, so an API client could not tell a change from a typo in
// an id. The card deletion was worse than a wrong status: it found the card by
// board alone but removed it by board AND list, so a card id with a wrong list
// id lost its checklists, comments and attachments while the card stayed -
// and since only the named list was asked, a member could strip the children
// of a card in a list that refuses them (ListLockBleed, GHSA-4734-8vrg-8j3w).
//
// Each route runs here against stub collections that record every write: the
// missing record is 404 with no write, the present one is 200 with it. The
// last test reads every id-addressed REST write in server/ and fails on one
// with no not-found answer, so the shape cannot come back in another route.
//
// Run: node tests/restWriteRoutes404.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const plain = value => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

// The source of `WebApp.handlers.<verb>(` at `at`, to its closing parenthesis,
// found by balancing and skipping strings and comments.
function callSource(source, at) {
  let depth = 0;
  for (let i = source.indexOf('(', at); i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "'" || ch === '"' || ch === '`') { for (i += 1; source[i] !== ch; i += (source[i] === '\\' ? 2 : 1)); continue; }
    if (ch === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i); continue; }
    if (ch === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i) + 1; continue; }
    if (ch === '(') depth += 1;
    if (ch === ')' && --depth === 0) return source.slice(at, i + 1);
  }
  throw new Error('unbalanced');
}

function routeSource(file, verb, route) {
  const source = read(file);
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const at = source.search(new RegExp(`WebApp\\.handlers\\.${verb}\\(\\s*'${escaped}'`));
  assert.ok(at >= 0, `${verb} ${route} in ${file}`);
  return callSource(source, at);
}

function functionSource(file, name) {
  const source = read(file);
  const at = source.indexOf(`function ${name}(`);
  assert.ok(at >= 0, `${name} in ${file}`);
  const open = source.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}' && --depth === 0) return source.slice(at, i + 1);
  }
  throw new Error(`unbalanced ${name}`);
}

class MeteorError extends Error {
  constructor(error, reason) { super(reason || error); this.error = error; this.reason = reason; }
}

// A collection stub: every write is recorded in `writes`.
function collection(name, writes, { find = () => undefined, count = 1 } = {}) {
  const ops = {
    async findOneAsync(selector, options) { return find(plain(selector), options); },
    async updateAsync(selector, modifier) { writes.push([name, 'update', plain(selector), plain(modifier)]); return count; },
    async removeAsync(selector) { writes.push([name, 'remove', plain(selector)]); return count; },
    async insertAsync(doc) { writes.push([name, 'insert', plain(doc)]); return 'new'; },
  };
  return { ...ops, direct: ops };
}

// Registers one route in a fresh context and calls it with `params`/`body`.
async function call(file, verb, route, { params, body = {}, cache = {}, extra = {}, prelude = '' }) {
  const writes = [];
  const responses = [];
  let handler;
  const context = {
    console,
    WebApp: { handlers: { [verb](url, fn) { assert.equal(url, route); handler = fn; } } },
    Authentication: {
      async checkBoardWriteAccess() {}, async checkBoardAdmin() {}, async checkBoardAccess() {},
      async checkUserId() {}, checkLoggedIn() {},
    },
    Meteor: { Error: MeteorError, async callAsync(...args) { writes.push(['Meteor', 'call', plain(args)]); } },
    ReactiveCache: new Proxy({}, {
      get: (_, key) => async (...args) => (cache[key] ? cache[key](...args.map(plain)) : undefined),
    }),
    publicErrorData: error => (error.error === 'not-found'
      ? { code: 404, data: { error: error.reason } }
      : { code: error.statusCode || 500, data: { error: String(error.message) } }),
    httpStatusForError: error => error.statusCode || 500,
    extractErrorMessage: error => String(error.message),
    sendJsonResult(_res, result) { responses.push(plain(result)); },
    check(value) { if (typeof value !== 'string') throw new Error('Match failed'); },
    require: () => ({ record() {} }),
    Random: { id: () => 'rnd' },
    writes,
    ...extra(writes),
  };
  for (const name of ['Swimlanes', 'Lists', 'Cards', 'CustomFields', 'Users', 'Boards', 'Activities']) {
    if (!context[name]) context[name] = collection(name, writes);
  }
  vm.runInNewContext(`${prelude}\n${routeSource(file, verb, route)}`, context);
  assert.equal(typeof handler, 'function', `${verb} ${route} registered`);
  await handler({ userId: 'caller', params, body }, {});
  assert.equal(responses.length, 1, 'one response');
  return { response: responses[0], writes };
}
const none = () => ({});

test('swimlane deletion: a swimlane not on the board is 404 and nothing is removed', async () => {
  const route = '/api/boards/:boardId/swimlanes/:swimlaneId';
  const lane = { _id: 's', boardId: 'b' };
  const getSwimlane = sel => (sel._id === lane._id && sel.boardId === lane.boardId ? lane : undefined);
  for (const params of [{ boardId: 'b', swimlaneId: 'missing' }, { boardId: 'other', swimlaneId: 's' }]) {
    const r = await call('server/models/swimlanes.js', 'delete', route, { params, cache: { getSwimlane }, extra: none });
    assert.deepEqual(r.response, { code: 404, data: { error: 'Swimlane not found' } });
    assert.deepEqual(r.writes, []);
  }
  const ok = await call('server/models/swimlanes.js', 'delete', route, { params: { boardId: 'b', swimlaneId: 's' }, cache: { getSwimlane }, extra: none });
  assert.deepEqual(ok.response, { code: 200, data: { _id: 's' } });
  assert.deepEqual(ok.writes, [['Swimlanes', 'remove', { _id: 's', boardId: 'b' }]]);
});

test('list deletion: a missing or already deleted list is 404 and nothing is soft-deleted', async () => {
  const route = '/api/boards/:boardId/lists/:listId';
  const lists = { live: { _id: 'live', boardId: 'b' }, gone: { _id: 'gone', boardId: 'b', deletedAt: new Date(0) } };
  const extra = writes => ({
    Lists: collection('Lists', writes, { find: sel => (lists[sel._id] && lists[sel._id].boardId === sel.boardId ? lists[sel._id] : undefined) }),
    async softRemoveList({ list }) { writes.push(['Lists', 'softRemove', list._id]); },
  });
  for (const listId of ['missing', 'gone']) {
    const r = await call('server/models/lists.js', 'delete', route, { params: { boardId: 'b', listId }, extra });
    assert.deepEqual(r.response, { code: 404, data: { error: 'List not found' } }, listId);
    assert.deepEqual(r.writes, []);
  }
  const other = await call('server/models/lists.js', 'delete', route, { params: { boardId: 'other', listId: 'live' }, extra });
  assert.equal(other.response.code, 404, "another board's list");
  const ok = await call('server/models/lists.js', 'delete', route, { params: { boardId: 'b', listId: 'live' }, extra });
  assert.deepEqual(ok.response, { code: 200, data: { _id: 'live' } });
  assert.deepEqual(ok.writes, [['Lists', 'softRemove', 'live']]);
});

// The card route keeps its board-scoped lookup and its security record; only
// what happens after it is under test.
function cardDelete(card, { refused = [] } = {}) {
  const asked = [];
  const extra = writes => ({
    async assertListNotRefused(_userId, _board, listId) {
      asked.push(listId);
      if (refused.includes(listId)) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    },
    async cardRemover(_userId, c) { writes.push(['Cards', 'cardRemover', c._id]); },
    noteAuthorSpoof() {},
    buildDeleteCardActivity: a => ({ activityType: 'deleteCard', cardId: a.cardId }),
  });
  const cache = { getCard: sel => (card && sel._id === card._id && (!sel.boardId || sel.boardId === card.boardId) ? card : undefined) };
  return { asked, run: params => call('server/models/cards.js', 'delete', '/api/boards/:boardId/lists/:listId/cards/:cardId', { params, cache, extra }) };
}

test('card deletion: a missing card is 404 and nothing is removed', async () => {
  const { run } = cardDelete(null);
  const r = await run({ boardId: 'b', listId: 'l', cardId: 'missing' });
  assert.deepEqual(r.response, { code: 404, data: { error: 'Card not found' } });
  assert.deepEqual(r.writes, []);
});

test('negative: a card named with the wrong list keeps its checklists, comments and attachments', async () => {
  const card = { _id: 'c', boardId: 'b', listId: 'real', swimlaneId: 's', title: 'T' };
  const { run, asked } = cardDelete(card);
  const r = await run({ boardId: 'b', listId: 'wrong', cardId: 'c' });
  assert.deepEqual(r.response, { code: 404, data: { error: 'Card not found' } });
  assert.deepEqual(r.writes, [], 'no cardRemover, no removal, no activity');
  assert.deepEqual(asked, ['wrong', 'real'], "the card's own list is asked too");
});

test('negative: naming a writable list does not reach a card in a list that refuses the caller', async () => {
  const card = { _id: 'c', boardId: 'b', listId: 'locked', swimlaneId: 's', title: 'T' };
  const { run } = cardDelete(card, { refused: ['locked'] });
  await assert.rejects(run({ boardId: 'b', listId: 'open', cardId: 'c' }), /Forbidden/);
});

test('card deletion in its own list still removes it, its children first, and records the activity', async () => {
  const card = { _id: 'c', boardId: 'b', listId: 'l', swimlaneId: 's', title: 'T' };
  const r = await cardDelete(card).run({ boardId: 'b', listId: 'l', cardId: 'c' });
  assert.deepEqual(r.response, { code: 200, data: { _id: 'c' } });
  assert.deepEqual(r.writes, [
    ['Cards', 'cardRemover', 'c'],
    ['Cards', 'remove', { _id: 'c', listId: 'l', boardId: 'b' }],
    ['Activities', 'insert', { activityType: 'deleteCard', cardId: 'c' }],
  ]);
});

function dependencyRoute(verb, body) {
  const card = { _id: 'c', boardId: 'b', cardDependencies: [{ cardId: 't', type: 'blocks' }] };
  const prelude = functionSource('server/models/dependencies.js', 'hasDependencyOn');
  const extra = () => ({ async checkRestDependencyAccess() {}, DEPENDENCY_TYPE_IDS: ['blocks'] });
  const cache = { getCard: sel => (sel._id === card._id && sel.boardId === card.boardId ? card : undefined) };
  return targetId => call('server/models/dependencies.js', verb, '/api/boards/:boardId/cards/:cardId/dependencies/:targetId',
    { params: { boardId: 'b', cardId: 'c', targetId }, body, cache, extra, prelude });
}

for (const [verb, body] of [['delete', {}], ['put', { color: 'red' }]]) {
  test(`dependency ${verb}: a dependency the card does not have is 404 and the card is not written`, async () => {
    const run = dependencyRoute(verb, body);
    const r = await run('other');
    assert.deepEqual(r.response, { code: 404, data: { error: 'Dependency not found' } });
    assert.deepEqual(r.writes, []);
    const ok = await run('t');
    assert.deepEqual(ok.response, { code: 200, data: { _id: 'c' } });
    assert.equal(ok.writes.length, 1);
  });
}

test('domain deletion: a domain the board does not have is 404 and the domains are not rewritten', async () => {
  const board = { _id: 'b', domains: [{ domain: 'example.com' }] };
  const extra = () => ({ allowIsBoardAdmin: () => true });
  const cache = { getBoard: () => board };
  const run = domain => call('server/models/boards.js', 'delete', '/api/boards/:boardId/domains/:domain', { params: { boardId: 'b', domain }, cache, extra });
  const r = await run('missing.example');
  assert.deepEqual(r.response, { code: 404, data: { error: 'Domain not found' } });
  assert.deepEqual(r.writes, []);
  const ok = await run('Example.COM');
  assert.equal(ok.response.code, 200, 'normalised as before');
  assert.deepEqual(ok.writes, [['Meteor', 'call', ['setBoardDomains', [], 'b']]]);
});

const FIELD = { _id: 'f', boardIds: ['b'], settings: { dropdownItems: [{ _id: 'item', name: 'One' }] } };
const getCustomField = sel => (sel._id === FIELD._id && sel.boardIds.$in.some(id => FIELD.boardIds.includes(id)) ? FIELD : undefined);

for (const [verb, route, body, extraParams, message] of [
  ['put', '/api/boards/:boardId/custom-fields/:customFieldId', { name: 'Renamed' }, {}, 'Custom field not found'],
  ['put', '/api/boards/:boardId/custom-fields/:customFieldId', {}, {}, 'Custom field not found'],
  ['post', '/api/boards/:boardId/custom-fields/:customFieldId/dropdown-items', { items: ['Two'] }, {}, 'Custom field not found'],
  ['put', '/api/boards/:boardId/custom-fields/:customFieldId/dropdown-items/:dropdownItemId', { name: 'Uno' }, { dropdownItemId: 'item' }, 'Dropdown item not found'],
]) {
  test(`${verb} ${route} ${JSON.stringify(body)}: a field not on the board is 404 and nothing is written`, async () => {
    for (const params of [{ boardId: 'b', customFieldId: 'missing' }, { boardId: 'other', customFieldId: 'f' }]) {
      const r = await call('server/models/customFields.js', verb, route, { params: { ...params, ...extraParams }, body, cache: { getCustomField }, extra: none });
      assert.deepEqual(r.response, { code: 404, data: { error: message } });
      assert.deepEqual(r.writes, []);
    }
    const ok = await call('server/models/customFields.js', verb, route, { params: { boardId: 'b', customFieldId: 'f', ...extraParams }, body, cache: { getCustomField }, extra: none });
    assert.equal(ok.response.code, 200);
    assert.equal(ok.writes.length, Object.keys(body).length ? 1 : 0);
  });
}

test('negative: renaming a dropdown item the field does not have is 404 and nothing is written', async () => {
  const route = '/api/boards/:boardId/custom-fields/:customFieldId/dropdown-items/:dropdownItemId';
  const r = await call('server/models/customFields.js', 'put', route, {
    params: { boardId: 'b', customFieldId: 'f', dropdownItemId: 'missing' }, body: { name: 'X' }, cache: { getCustomField }, extra: none,
  });
  assert.deepEqual(r.response, { code: 404, data: { error: 'Dropdown item not found' } });
  assert.deepEqual(r.writes, []);
});

function memberRoute(action, members) {
  const board = { _id: 'b', title: 'Board', members };
  const users = { member: { _id: 'member' }, admin: { _id: 'admin' }, outsider: { _id: 'outsider' } };
  const cache = {
    getBoard: id => (id === 'b' ? board : undefined),
    getBoards: () => [board],
    getUser: sel => (typeof sel === 'string' ? users[sel] : undefined),
  };
  const extra = () => ({
    allowIsBoardAdmin: (_userId, b) => !!b,
    boardMemberRoleToFlags: () => ({}),
  });
  return (params, body = { action }) => call('server/models/users.js', 'post', `/api/boards/:boardId/members/:userId/${action}`, { params, body, cache, extra });
}

test('member removal: an unknown board, user or non-member is 404, the last admin is 409, nothing is written', async () => {
  const run = memberRoute('remove', [
    { userId: 'admin', isActive: true, isAdmin: true },
    { userId: 'member', isActive: true, isAdmin: false },
    { userId: 'gone', isActive: false, isAdmin: false },
  ]);
  for (const [params, expected] of [
    [{ boardId: 'missing', userId: 'member' }, { code: 404, data: { error: 'Board not found' } }],
    [{ boardId: 'b', userId: 'nobody' }, { code: 404, data: { error: 'User not found' } }],
    [{ boardId: 'b', userId: 'outsider' }, { code: 404, data: { error: 'Member not found' } }],
    [{ boardId: 'b', userId: 'admin' }, { code: 409, data: { error: 'The last board admin cannot be removed' } }],
  ]) {
    const r = await run(params);
    assert.deepEqual(r.response, expected, JSON.stringify(params));
    assert.deepEqual(r.writes, []);
  }
  const ok = await run({ boardId: 'b', userId: 'member' });
  assert.deepEqual(ok.response, { code: 200, data: [{ _id: 'b', title: 'Board' }] });
  assert.deepEqual(ok.writes, [['Boards', 'update', 'b', { $set: { 'members.1.isActive': false, 'members.1.isAdmin': false } }]]);
});

test('negative: an inactive entry before the active one is not the one deactivated', async () => {
  const run = memberRoute('remove', [
    { userId: 'admin', isActive: true, isAdmin: true },
    { userId: 'member', isActive: false, isAdmin: false },
    { userId: 'member', isActive: true, isAdmin: false },
  ]);
  const ok = await run({ boardId: 'b', userId: 'member' });
  assert.deepEqual(ok.writes, [['Boards', 'update', 'b', { $set: { 'members.2.isActive': false, 'members.2.isAdmin': false } }]]);
});

test('member addition: an unknown board or user is 404, not 200 with no data', async () => {
  const run = memberRoute('add', [{ userId: 'admin', isActive: true, isAdmin: true }]);
  for (const [params, expected] of [
    [{ boardId: 'missing', userId: 'member' }, { code: 404, data: { error: 'Board not found' } }],
    [{ boardId: 'b', userId: 'nobody' }, { code: 404, data: { error: 'User not found' } }],
  ]) {
    const r = await run(params);
    assert.deepEqual(r.response, expected);
    assert.deepEqual(r.writes, []);
  }
});

// Every REST write in server/ whose path names a record by id (any parameter
// but the board, which every board check already answers 404 for) must have a
// not-found answer. A route whose parameter is not a record is listed with
// the reason.
const NOT_A_RECORD = {
  'POST /api/boards/import/:source': ':source names the import format, not a record',
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (full.endsWith('.js')) out.push(full);
  }
  return out;
}

function idAddressedWrites() {
  const found = [];
  for (const file of walk(path.join(root, 'server'))) {
    const source = fs.readFileSync(file, 'utf8');
    const re = /WebApp\.handlers\.(delete|put|post|patch)\(\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(source))) {
      const params = (m[2].match(/:\w+/g) || []).filter(p => p !== ':boardId');
      if (!params.length) continue;
      const body = callSource(source, m.index);
      if (!/\.(updateAsync|removeAsync|upsertAsync|insertAsync)\(|callAsync\(|callAsUser\(|softRemoveList|cardRemover|destroyToken/.test(body)) continue;
      found.push({ key: `${m[1].toUpperCase()} ${m[2]}`, file: path.relative(root, file), body });
    }
  }
  return found;
}

const hasNotFound = body => /code: 404|'not-found'|Or404\(|notFound|=== 0/.test(body);

test('negative: no id-addressed REST write in server/ lacks a not-found answer', () => {
  const routes = idAddressedWrites();
  assert.ok(routes.length >= 40, `found the REST writes (${routes.length})`);
  for (const key of ['DELETE /api/boards/:boardId/swimlanes/:swimlaneId', 'POST /api/boards/:boardId/members/:userId/add']) {
    assert.ok(routes.some(r => r.key === key), `${key} is scanned`);
  }
  const missing = routes.filter(r => !NOT_A_RECORD[r.key] && !hasNotFound(r.body)).map(r => `${r.key} (${r.file})`);
  assert.deepEqual(missing, [], 'answer 404 when the record the path names is not found');
  for (const key of Object.keys(NOT_A_RECORD)) assert.ok(routes.some(r => r.key === key), `${key} still exists`);
});

test('the scan catches the shape it is for', () => {
  const before = "WebApp.handlers.delete('/api/boards/:boardId/swimlanes/:swimlaneId', async function(req, res) {\n"
    + '  await Swimlanes.removeAsync({ _id: req.params.swimlaneId });\n  sendJsonResult(res, { code: 200 });\n});';
  assert.equal(hasNotFound(callSource(before, 0)), false);
  assert.equal(hasNotFound("if (!x) { sendJsonResult(res, { code: 404, data: {} }); }"), true);
});

test('negative: the card deletion checks the list before it removes anything, and every cardRemover caller scopes its card', () => {
  const handler = routeSource('server/models/cards.js', 'delete', '/api/boards/:boardId/lists/:listId/cards/:cardId');
  const check = handler.indexOf('card.listId !== paramListId');
  assert.ok(check > 0, 'the card is required to be in the named list');
  for (const write of ['cardRemover(', 'Cards.direct.removeAsync(', 'Activities.insertAsync(']) {
    assert.ok(handler.indexOf(write) > check, `${write} comes after the list check`);
  }
  // Its own list is asked as well as the named one (ListLockBleed).
  assert.match(handler, /assertListNotRefused\(req\.userId, await ReactiveCache\.getBoard\(paramBoardId\), card\.listId, 'write', 'rest:card-delete-other-list'\)/);
  // Every other REST caller of cardRemover removes by the same keys it looked
  // the card up with, so no child can be removed for a card that stays.
  const source = read('server/models/cards.js');
  const callers = [];
  const re = /WebApp\.handlers\.(delete|put|post|patch)\(\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(source))) {
    const body = callSource(source, m.index);
    if (body.includes('cardRemover(') && !m[2].endsWith('/lists/:listId/cards/:cardId')) callers.push([m[2], body]);
  }
  assert.ok(callers.some(([route]) => route === '/api/boards/:boardId/cards/bulk'), 'the bulk deletion is checked');
  for (const [route, body] of callers) {
    assert.match(body, /getCard\(\{ _id: cardId, boardId: paramBoardId \}\)[\s\S]*Cards\.direct\.removeAsync\(\{ _id: cardId, boardId: paramBoardId \}\)/, route);
  }
});
