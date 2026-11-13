'use strict';

// Execute the registered REST handler; live schema/database coverage is in Playwright.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const route = '/api/boards/:boardId/custom-fields/:customFieldId';
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ deny = false } = {}) {
  const calls = [];
  const document = { _id: 'field', boardIds: ['board'], name: 'Original', type: 'text', settings: {}, showOnCard: true };
  let handler;
  const context = {
    WebApp: { handlers: Object.fromEntries(['get', 'post', 'put', 'delete'].map(verb => [verb, (url, fn) => {
      if (verb === 'put' && url === route) handler = fn;
    }])) },
    Authentication: { async checkBoardWriteAccess(userId, boardId) {
      calls.push(['access', userId, boardId]);
      if (deny) throw new Error('Forbidden');
    } },
    CustomFields: { direct: { async updateAsync(selector, modifier) {
      calls.push(['update', plain(selector), plain(modifier)]);
      const fields = plain(modifier.$set);
      if ('settings' in fields && typeof fields.settings !== 'object') throw new Error('Invalid settings');
      if ('type' in fields && !['text', 'number'].includes(fields.type)) throw new Error('Invalid type');
      if (selector._id !== document._id || !selector.boardIds.$in.some(id => document.boardIds.includes(id))) return 0;
      Object.assign(document, fields);
      return 1;
    } } },
    sendJsonResult(res, result) { res.responses.push(plain(result)); },
  };
  const source = fs.readFileSync(path.join(__dirname, '../server/models/customFields.js'), 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('WebApp.handlers.get(')), context);
  assert.equal(typeof handler, 'function');
  return {
    calls, document,
    async put(body, params = {}) {
      const res = { responses: [] };
      await handler({ userId: 'member', params: { boardId: 'board', customFieldId: 'field', ...params }, body }, res);
      assert.equal(res.responses.length, 1);
      return res.responses[0];
    },
  };
}

for (const invalid of [{ settings: 'invalid' }, { type: 'invalid' }]) {
  test(`a rejected ${Object.keys(invalid)[0]} update leaves accompanying fields unchanged`, async () => {
    const f = fixture();
    const before = plain(f.document);
    await assert.rejects(f.put({ name: 'Changed', ...invalid }), /Invalid/);
    assert.deepEqual(f.document, before);
  });
}

test('accepted fields are saved together, including false values, with the existing response', async () => {
  const f = fixture();
  const body = {
    name: 'Changed', type: 'number', settings: {}, showOnCard: false,
    automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false, showSumAtTopOfList: false,
  };
  assert.deepEqual(await f.put(body), { code: 200, data: { _id: 'field' } });
  assert.deepEqual(f.document, { _id: 'field', boardIds: ['board'], ...body });
  assert.deepEqual(f.calls, [
    ['access', 'member', 'board'],
    ['update', { _id: 'field', boardIds: { $in: ['board'] } }, { $set: body }],
  ]);
});

test('empty or unsupported updates retain the successful response without a write', async () => {
  for (const body of [{}, { boardIds: ['other'], adminOnly: true, readOnly: true, unexpected: 'value' }]) {
    const f = fixture();
    const before = plain(f.document);
    assert.deepEqual(await f.put(body), { code: 200, data: { _id: 'field' } });
    assert.deepEqual(f.document, before);
    assert.deepEqual(f.calls, [['access', 'member', 'board']]);
  }
});

test('only own properties are accepted', async () => {
  const f = fixture();
  const body = Object.assign(Object.create({ name: 'Inherited', type: 'number' }), { showOnCard: false });
  await f.put(body);
  assert.equal(f.document.name, 'Original');
  assert.equal(f.document.type, 'text');
  assert.equal(f.document.showOnCard, false);
});

test('the update stays scoped to its board and field', async () => {
  for (const params of [{ boardId: 'other' }, { customFieldId: 'missing' }]) {
    const f = fixture();
    const before = plain(f.document);
    await f.put({ name: 'Changed' }, params);
    assert.deepEqual(f.document, before);
  }
});

test('authorization runs before any write', async () => {
  const f = fixture({ deny: true });
  await assert.rejects(f.put({ name: 'Changed', settings: 'invalid' }), /Forbidden/);
  assert.deepEqual(f.calls, [['access', 'member', 'board']]);
  assert.equal(f.document.name, 'Original');
});
