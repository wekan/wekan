'use strict';

// Exercise the registered handler; Playwright covers the real database and hooks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const route = '/api/boards/:boardId/custom-fields/:customFieldId';
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ deny = false, fail = false } = {}) {
  const calls = [];
  let document = { _id: 'field', boardIds: ['board'], name: 'Retained field' };
  let handler;
  const context = {
    WebApp: { handlers: Object.fromEntries(['get', 'post', 'put', 'delete'].map(verb => [verb, (url, fn) => {
      if (verb === 'delete' && url === route) handler = fn;
    }])) },
    Authentication: { async checkBoardWriteAccess(userId, boardId) {
      calls.push(['access', userId, boardId]);
      if (deny) throw new Error('Forbidden');
    } },
    CustomFields: { async removeAsync(selector) {
      calls.push(['remove', plain(selector)]);
      if (fail) throw new Error('Deletion failed');
      if (!document || selector._id !== document._id || !selector.boardIds.$in.some(id => document.boardIds.includes(id))) return 0;
      document = null;
      return 1;
    } },
    sendJsonResult(res, result) { res.responses.push(plain(result)); },
  };
  const source = fs.readFileSync(path.join(__dirname, '../server/models/customFields.js'), 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('WebApp.handlers.get(')), context);
  assert.equal(typeof handler, 'function');
  return {
    calls,
    get document() { return document; },
    async remove(params = {}, res = { responses: [] }) {
      await handler({ userId: 'member', params: { boardId: 'board', customFieldId: 'field', ...params } }, res);
      assert.equal(res.responses.length, 1);
      return res.responses[0];
    },
  };
}

for (const params of [{ customFieldId: 'missing' }, { boardId: 'other' }]) {
  test(`unmatched deletion returns 404 and leaves the field intact: ${JSON.stringify(params)}`, async () => {
    const f = fixture();
    const before = plain(f.document);
    assert.deepEqual(await f.remove(params), { code: 404, data: { error: 'Custom field not found' } });
    assert.deepEqual(f.document, before);
  });
}

test('a matching deletion keeps the existing success response and repeated deletion returns 404', async () => {
  const f = fixture();
  assert.deepEqual(await f.remove(), { code: 200, data: { _id: 'field' } });
  assert.equal(f.document, null);
  assert.deepEqual(f.calls, [
    ['access', 'member', 'board'],
    ['remove', { _id: 'field', boardIds: { $in: ['board'] } }],
  ]);
  assert.deepEqual(await f.remove(), { code: 404, data: { error: 'Custom field not found' } });
});

test('authorization precedes deletion and an unauthorized request sends no success', async () => {
  const f = fixture({ deny: true });
  const res = { responses: [] };
  await assert.rejects(f.remove({}, res), /Forbidden/);
  assert.deepEqual(f.calls, [['access', 'member', 'board']]);
  assert.deepEqual(res.responses, []);
  assert.ok(f.document);
});

test('a failed deletion propagates its error without acknowledging success', async () => {
  const f = fixture({ fail: true });
  const res = { responses: [] };
  await assert.rejects(f.remove({}, res), /Deletion failed/);
  assert.deepEqual(res.responses, []);
  assert.ok(f.document);
});
