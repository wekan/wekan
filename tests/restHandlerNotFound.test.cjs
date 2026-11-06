'use strict';

// A REST handler that throws Meteor.Error(404) answers HTTP 500: WebApp
// handlers are plain connect handlers, and a Meteor.Error has no HTTP status.
// The not-found answer is sendJsonResult(res, { code: 404, ... }) and return.
// #6876 fixed the card archive/restore endpoints; the custom-field endpoint
// had the same shape. The negative test below keeps it gone everywhere.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '_build', '.build', '.tools', '.meteor', 'tests', '.git']);

function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.(js|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// The text of every WebApp.handlers.<verb>( ... ) call, found by balancing
// parentheses outside strings, comments and template literals.
function handlerBlocks(source) {
  const blocks = [];
  const re = /WebApp\.handlers\.(get|post|put|delete|patch|use)\(/g;
  let m;
  while ((m = re.exec(source))) {
    let depth = 0;
    let i = m.index + m[0].length - 1;
    let quote = null;
    for (; i < source.length; i++) {
      const c = source[i];
      if (quote) {
        if (c === '\\') i++;
        else if (c === quote) quote = null;
        continue;
      }
      if (c === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i); if (i < 0) break; continue; }
      if (c === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i) + 1; continue; }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '(') depth++;
      else if (c === ')' && --depth === 0) break;
    }
    blocks.push({ start: m.index, text: source.slice(m.index, i + 1) });
    re.lastIndex = i + 1;
  }
  return blocks;
}

test('no REST handler answers not-found by throwing Meteor.Error(404)', () => {
  const offenders = [];
  let handlers = 0;
  for (const file of sourceFiles(root)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const block of handlerBlocks(source)) {
      handlers++;
      if (/throw\s+new\s+Meteor\.Error\(\s*404\b/.test(block.text)) {
        const line = source.slice(0, block.start).split('\n').length;
        offenders.push(`${path.relative(root, file)}:${line}`);
      }
    }
  }
  assert.ok(handlers > 50, `found the REST handlers (${handlers})`);
  assert.deepEqual(offenders, []);
});

const route = '/api/boards/:boardId/lists/:listId/cards/:cardId/customFields/:customFieldId';

function customFieldFixture() {
  const card = { _id: 'card', boardId: 'board', listId: 'list', archived: false,
    customFields: [{ _id: 'cf', value: 'old' }] };
  const writes = [];
  let handler;
  const source = fs.readFileSync(path.join(root, 'server/models/cards.js'), 'utf8');
  const start = source.indexOf(`WebApp.handlers.post(\n  '${route}'`);
  assert.notEqual(start, -1, 'custom-field route exists');
  const block = handlerBlocks(source.slice(start))[0].text;
  vm.runInNewContext(`${block};`, {
    WebApp: { handlers: { post(url, fn) { handler = fn; } } },
    Authentication: { async checkBoardWriteAccess() {} },
    async assertListNotRefused() {},
    ReactiveCache: {
      async getBoard(id) { return { _id: id }; },
      async getCard(selector) {
        return Object.entries(selector).every(([k, v]) => card[k] === v) ? card : null;
      },
    },
    Cards: {
      direct: { async updateAsync(selector, modifier) { writes.push(modifier); } },
      async findOneAsync() { return card; },
    },
    require(name) {
      assert.equal(name, '/server/models/customFieldLinks');
      return { async propagateLinkedCustomFields() {} };
    },
    Meteor: { Error: class extends Error {} },
    sendJsonResult(res, result) { res.results.push(JSON.parse(JSON.stringify(result))); },
  });
  return {
    card, writes,
    async post(params) {
      const res = { results: [] };
      await handler({ userId: 'member', body: { value: 'new' }, params: {
        boardId: 'board', listId: 'list', cardId: 'card', customFieldId: 'cf', ...params,
      } }, res);
      assert.equal(res.results.length, 1, 'respond exactly once');
      return res.results[0];
    },
  };
}

test('custom-field update of a matching card still writes and answers 200', async () => {
  const f = customFieldFixture();
  const result = await f.post({});
  assert.equal(result.code, 200);
  assert.deepEqual(result.data.customFields, [{ _id: 'cf', value: 'new' }]);
  assert.equal(f.writes.length, 1);
});

for (const [name, params, archived] of [
  ['a missing card', { cardId: 'missing' }],
  ['a card on the wrong list', { listId: 'other' }],
  ['a card on the wrong board', { boardId: 'other' }],
  ['an archived card', {}, true],
]) {
  test(`custom-field update of ${name} answers JSON 404 without writing`, async () => {
    const f = customFieldFixture();
    if (archived) f.card.archived = true;
    assert.deepEqual(await f.post(params), { code: 404, data: { error: 'Card not found' } });
    assert.deepEqual(f.writes, []);
  });
}
