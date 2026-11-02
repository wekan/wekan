'use strict';

// #6862: a REST "get one" that finds nothing answers 404, not 200 with an empty body.
// The scoped card GET (/api/boards/:b/lists/:l/cards/:c) did, which an API client
// cannot tell from a card with no fields; the list, swimlane, custom field,
// comment and integration GETs had the same shape, and the user GET threw a
// TypeError for an unknown name. The board check stays FIRST in each, so a
// stranger learns nothing about which ids exist.
//
// Run: node tests/restSingleItem404.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { cardWithChecklists } = require('../server/lib/checklistDeadlines');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

// The source of one registered GET route: from `WebApp.handlers.get(` to its closing
// parenthesis, found by balancing, ignoring strings and comments.
function routeSource(source, route) {
  const at = source.search(new RegExp(`WebApp\\.handlers\\.get\\(\\s*'${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  assert.ok(at >= 0, `route ${route}`);
  let depth = 0;
  for (let i = source.indexOf('(', at); i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "'" || ch === '"' || ch === '`') { for (i += 1; source[i] !== ch; i += (source[i] === '\\' ? 2 : 1)); continue; }
    if (ch === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i); continue; }
    if (ch === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i) + 1; continue; }
    if (ch === '(') depth += 1;
    if (ch === ')' && --depth === 0) return source.slice(at, i + 1);
  }
  throw new Error(`unbalanced ${route}`);
}

// Run a route against a cache that finds `found` (or nothing).
async function run(file, route, { found, params, access = async () => {} }) {
  const calls = [];
  const responses = [];
  let handler;
  const finder = name => async selector => {
    calls.push([name, plain(selector)]);
    return name === 'getChecklists' || name === 'getChecklistItems' ? [] : found;
  };
  const context = {
    console,
    WebApp: { handlers: { get(url, callback) { assert.equal(url, route); handler = callback; } } },
    Authentication: {
      async checkBoardAccess(userId, boardId) { calls.push(['access', boardId]); await access(userId, boardId); },
      async checkUserId() { calls.push(['admin']); },
    },
    ReactiveCache: new Proxy({}, { get: (_, name) => (String(name).startsWith('get') ? finder(String(name)) : undefined) }),
    sendJsonResult(_res, result) { responses.push(plain(result)); },
    publicErrorData: error => ({ code: 500, data: { error: String(error.message) } }),
    httpStatusForError: () => 500,
    extractErrorMessage: error => String(error.message),
    integrationFieldsFor: async () => ({ _id: 1 }),
    withoutSecrets: value => value,
    cardWithChecklists,
  };
  vm.runInNewContext(routeSource(read(file), route), context);
  await handler({ userId: 'member', params }, {});
  return { calls, responses };
}

const ROUTES = [
  ['server/models/cards.js', '/api/boards/:boardId/lists/:listId/cards/:cardId', { boardId: 'b', listId: 'l', cardId: 'c' }, 'Card not found'],
  ['server/models/lists.js', '/api/boards/:boardId/lists/:listId', { boardId: 'b', listId: 'l' }, 'List not found'],
  ['server/models/swimlanes.js', '/api/boards/:boardId/swimlanes/:swimlaneId', { boardId: 'b', swimlaneId: 's' }, 'Swimlane not found'],
  ['server/models/customFields.js', '/api/boards/:boardId/custom-fields/:customFieldId', { boardId: 'b', customFieldId: 'f' }, 'Custom field not found'],
  ['server/models/cardComments.js', '/api/boards/:boardId/cards/:cardId/comments/:commentId', { boardId: 'b', cardId: 'c', commentId: 'x' }, 'Comment not found'],
  ['server/models/integrations.js', '/api/boards/:boardId/integrations/:intId', { boardId: 'b', intId: 'i' }, 'Integration not found'],
];

for (const [file, route, params, message] of ROUTES) {
  test(`${route}: nothing found is 404 "${message}", after the board check`, async () => {
    const { calls, responses } = await run(file, route, { found: undefined, params });
    assert.deepEqual(responses, [{ code: 404, data: { error: message } }]);
    assert.equal(calls[0][0], 'access', 'the board is checked before anything is looked up');
  });

  test(`${route}: something found is 200 with it`, async () => {
    const { responses } = await run(file, route, { found: { _id: 'thing', title: 'T' }, params });
    assert.equal(responses.length, 1);
    assert.equal(responses[0].code, 200);
    assert.equal(responses[0].data._id, 'thing');
  });

  test(`${route}: a stranger gets the access error for an existing and for a missing id, never a 404`, async () => {
    const denied = async () => { throw Object.assign(new Error('Forbidden'), { error: 'Forbidden' }); };
    for (const found of [undefined, { _id: 'thing' }]) {
      const { calls, responses } = await run(file, route, { found, params, access: denied }).catch(error => ({ calls: [], responses: [], error }));
      assert.ok(!responses.some(r => r.code === 404), 'a 404 would say the id does not exist');
      assert.ok(!calls.some(([name]) => name.startsWith('get')), 'nothing was looked up for a stranger');
    }
  });
}

test('the scoped card GET still returns the card with its checklists', async () => {
  const card = { _id: 'c', boardId: 'b', listId: 'l', archived: false, title: 'Example' };
  const { responses } = await run('server/models/cards.js', ROUTES[0][1], { found: card, params: ROUTES[0][2] });
  assert.equal(responses[0].code, 200);
  assert.equal(responses[0].data.title, 'Example');
  assert.ok(Array.isArray(responses[0].data.checklists));
});

test('the scoped card GET asks for an active card of that board and list only', async () => {
  const { calls } = await run('server/models/cards.js', ROUTES[0][1], { found: undefined, params: ROUTES[0][2] });
  assert.deepEqual(calls[1], ['getCard', { _id: 'c', listId: 'l', boardId: 'b', archived: false }]);
});

test('the user GET: an unknown id and name is 404, not a TypeError', async () => {
  const { responses } = await run('server/models/users.js', '/api/users/:userId', { found: undefined, params: { userId: 'nobody' } });
  assert.deepEqual(responses, [{ code: 404, data: { error: 'User not found' } }]);
});

test('negative, anywhere in server/models: no single-item GET route answers 200 without a not-found branch', () => {
  // Every GET route that ends in an id parameter must have a 404 (or throw a typed
  // not-found), except the ones that cannot miss: the board is checked to exist by
  // the access check, and a custom-field search returns a list.
  const EXEMPT = new Set(['/api/boards/:boardId', '/api/boards/:boardId/cardsByCustomField/:customFieldId/:customFieldValue']);
  const gaps = [];
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach(entry => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return entry.name === 'tests' ? null : walk(rel);
    if (!entry.name.endsWith('.js')) return null;
    const source = read(rel);
    for (const m of source.matchAll(/WebApp\.handlers\.get\(\s*'([^']+:\w+)'/g)) {
      if (EXEMPT.has(m[1])) continue;
      if (!/404|NotFound|not-found|notFound/.test(routeSource(source, m[1]))) gaps.push(`${rel} ${m[1]}`);
    }
    return null;
  });
  walk('server');
  assert.deepEqual(gaps, []);
});
