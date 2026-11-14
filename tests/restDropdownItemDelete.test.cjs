'use strict';

// Exercise the registered handler; Playwright covers the database and browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const route = '/api/boards/:boardId/custom-fields/:customFieldId/dropdown-items/:dropdownItemId';
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ deny = false, fail = false } = {}) {
  const calls = [];
  const document = { _id: 'field', boardIds: ['board'], settings: {
    dropdownItems: [{ _id: 'remove', name: 'Remove option' }, { _id: 'keep', name: 'Keep option' }],
  } };
  let handler;
  const context = {
    WebApp: { handlers: Object.fromEntries(['get', 'post', 'put', 'delete'].map(verb => [verb, (url, fn) => {
      if (verb === 'delete' && url === route) handler = fn;
    }])) },
    Authentication: { async checkBoardWriteAccess(userId, boardId) {
      calls.push(['access', userId, boardId]);
      if (deny) throw new Error('Forbidden');
    } },
    CustomFields: { direct: { async updateAsync(selector, modifier) {
      calls.push(['update', plain(selector), plain(modifier)]);
      if (fail) throw new Error('Update failed');
      if (selector._id !== document._id || !selector.boardIds.$in.some(id => document.boardIds.includes(id))) return 0;
      if (selector['settings.dropdownItems._id'] !== undefined && !document.settings.dropdownItems.some(item => item._id === selector['settings.dropdownItems._id'])) return 0;
      document.settings.dropdownItems = document.settings.dropdownItems.filter(item => item._id !== modifier.$pull['settings.dropdownItems']._id);
      return 1;
    } } },
    sendJsonResult(res, result) { res.responses.push(plain(result)); },
  };
  const source = fs.readFileSync(path.join(__dirname, '../server/models/customFields.js'), 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('WebApp.handlers.get(')), context);
  assert.equal(typeof handler, 'function');
  return {
    calls, document,
    async remove(params = {}, res = { responses: [] }) {
      await handler({ userId: 'member', params: { boardId: 'board', customFieldId: 'field', dropdownItemId: 'remove', ...params } }, res);
      assert.equal(res.responses.length, 1);
      return res.responses[0];
    },
  };
}

for (const params of [{ dropdownItemId: 'missing' }, { customFieldId: 'missing' }, { boardId: 'other' }]) {
  test(`unmatched dropdown deletion returns 404 without changes: ${JSON.stringify(params)}`, async () => {
    const f = fixture();
    const before = plain(f.document);
    assert.deepEqual(await f.remove(params), { code: 404, data: { error: 'Dropdown item not found' } });
    assert.deepEqual(f.document, before);
  });
}

test('a matching deletion retains sibling options and the success response, then returns 404 on repetition', async () => {
  const f = fixture();
  assert.deepEqual(await f.remove(), { code: 200, data: { _id: 'field' } });
  assert.deepEqual(f.document.settings.dropdownItems, [{ _id: 'keep', name: 'Keep option' }]);
  assert.deepEqual(await f.remove(), { code: 404, data: { error: 'Dropdown item not found' } });
  assert.equal(f.calls[0][0], 'access');
});

test('authorization precedes the update and database failures do not send success', async () => {
  for (const options of [{ deny: true }, { fail: true }]) {
    const f = fixture(options);
    const before = plain(f.document);
    const res = { responses: [] };
    await assert.rejects(f.remove({}, res), options.deny ? /Forbidden/ : /Update failed/);
    assert.deepEqual(res.responses, []);
    assert.deepEqual(f.document, before);
    if (options.deny) assert.deepEqual(f.calls, [['access', 'member', 'board']]);
  }
});
