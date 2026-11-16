'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const route = '/api/boards/:boardId/custom-fields/:customFieldId/dropdown-items/:dropdownItemId';
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ deny = false, fail = false, stale = false } = {}) {
  const calls = [];
  const document = { _id: 'field', boardIds: ['board'], settings: {
    dropdownItems: [{ _id: 'first', name: 'First' }, { _id: 'second', name: 'Second' }],
  } };
  let handler;
  const context = {
    WebApp: { handlers: Object.fromEntries(['get', 'post', 'put', 'delete'].map(verb => [verb, (url, fn) => {
      if (verb === 'put' && url === route) handler = fn;
    }])) },
    Authentication: { async checkBoardWriteAccess(userId, boardId) {
      calls.push(['access', userId, boardId]);
      if (deny) throw new Error('Forbidden');
    } },
    ReactiveCache: { async getCustomField(selector) {
      calls.push(['read', plain(selector)]);
      if (selector._id !== document._id || !selector.boardIds.$in.some(id => document.boardIds.includes(id))) return null;
      return plain(document);
    } },
    CustomFields: { direct: { async updateAsync(selector, modifier) {
      calls.push(['update', plain(selector), plain(modifier)]);
      if (fail) throw new Error('Update failed');
      // A concurrent removal/reorder no longer matches the captured index.
      if (stale) return 0;
      return 1;
    } } },
    sendJsonResult(res, result) { res.responses.push(plain(result)); },
  };
  const source = fs.readFileSync(path.join(__dirname, '../server/models/customFields.js'), 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('WebApp.handlers.get(')), context);
  assert.equal(typeof handler, 'function');
  return {
    calls, document,
    async rename(params = {}, body = { name: 'Renamed' }, res = { responses: [] }) {
      await handler({ userId: 'member', params: { boardId: 'board', customFieldId: 'field', dropdownItemId: 'second', ...params }, body }, res);
      assert.equal(res.responses.length, 1);
      return res.responses[0];
    },
  };
}

test('rename uses an explicit index and changes only the name, guarded by the option ID at that index', async () => {
  for (const [index, id] of ['first', 'second'].entries()) {
    for (const name of ['Renamed', 'Renamed again']) {
      const f = fixture();
      assert.deepEqual(await f.rename({ dropdownItemId: id }, { name }), { code: 200, data: { _id: id } });
      assert.deepEqual(f.calls.at(-1), ['update', {
        _id: 'field', boardIds: { $in: ['board'] }, [`settings.dropdownItems.${index}._id`]: id,
      }, { $set: { [`settings.dropdownItems.${index}.name`]: name } }]);
      assert.equal(f.calls[0][0], 'access');
    }
  }
});

for (const params of [{ dropdownItemId: 'missing' }, { customFieldId: 'missing' }, { boardId: 'other' }]) {
  test(`unmatched dropdown rename returns 404 without writing: ${JSON.stringify(params)}`, async () => {
    const f = fixture();
    assert.deepEqual(await f.rename(params), { code: 404, data: { error: 'Dropdown item not found' } });
    assert.ok(!f.calls.some(call => call[0] === 'update'));
  });
}

test('a concurrent removal or reorder returns 404 instead of acknowledging an unmatched update', async () => {
  const f = fixture({ stale: true });
  assert.deepEqual(await f.rename(), { code: 404, data: { error: 'Dropdown item not found' } });
});

test('omitting the name retains the existing no-op response without writing', async () => {
  const f = fixture();
  assert.deepEqual(await f.rename({}, {}), { code: 200, data: { _id: 'second' } });
  assert.ok(!f.calls.some(call => call[0] === 'update'));
});

test('authorization runs before reading and database failures never send success', async () => {
  for (const options of [{ deny: true }, { fail: true }]) {
    const f = fixture(options);
    const res = { responses: [] };
    await assert.rejects(f.rename({}, undefined, res), options.deny ? /Forbidden/ : /Update failed/);
    assert.deepEqual(res.responses, []);
    if (options.deny) assert.deepEqual(f.calls, [['access', 'member', 'board']]);
  }
});
