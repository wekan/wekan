'use strict';

// Exercise the registered integration PUT handler, including board scope and
// authorization, without starting Meteor. Live database coverage is in Playwright.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { normalizeDeliverySettings } = require('../models/lib/notificationDelivery');
const { publicErrorData } = require('../server/lib/apiResponseHelpers');

const route = '/api/boards/:boardId/integrations/:intId';
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ deny = false, lookupError } = {}) {
  const calls = [];
  const documents = [
    { _id: 'integration', boardId: 'board', title: 'Webhook', enabled: true, activities: ['all'] },
    { _id: 'foreign-integration', boardId: 'other-board', title: 'Other webhook', enabled: true },
  ];
  const matches = (doc, selector) => Object.entries(selector).every(([key, value]) => doc[key] === value);
  let handler;
  const context = {
    WebApp: { handlers: Object.fromEntries(['get', 'post', 'put', 'delete'].map(verb => [verb, (url, fn) => {
      if (verb === 'put' && url === route) handler = fn;
    }])) },
    Authentication: { async checkBoardAdmin(userId, boardId) {
      calls.push(['admin', userId, boardId]);
      if (deny) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    } },
    ReactiveCache: { async getIntegration(selector) {
      calls.push(['lookup', plain(selector)]);
      if (lookupError) throw lookupError;
      return documents.find(doc => matches(doc, selector));
    } },
    Integrations: { direct: { async updateAsync(selector, modifier) {
      calls.push(['update', plain(selector), plain(modifier)]);
      const doc = documents.find(item => matches(item, selector));
      if (!doc) return 0;
      Object.assign(doc, modifier.$set);
      for (const key of Object.keys(modifier.$unset || {})) delete doc[key];
      return 1;
    } } },
    normalizeDeliverySettings,
    publicErrorData,
    sendJsonResult(res, result) { res.responses.push(plain(result)); },
  };
  const source = fs.readFileSync(path.join(__dirname, '../server/models/integrations.js'), 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('WebApp.handlers.get(')), context);
  assert.equal(typeof handler, 'function');
  return {
    calls, documents,
    async put(body = {}, params = {}) {
      const res = { responses: [] };
      await handler({ userId: 'admin', params: { boardId: 'board', intId: 'integration', ...params }, body }, res);
      assert.equal(res.responses.length, 1, 'respond exactly once');
      return res.responses[0];
    },
  };
}

test('a valid integration updates falsy values and keeps the existing response', async () => {
  const f = fixture();
  assert.deepEqual(await f.put({ title: 'Updated webhook', enabled: false, activities: [] }), {
    code: 200, data: { _id: 'integration' },
  });
  assert.deepEqual(f.documents[0], {
    _id: 'integration', boardId: 'board', title: 'Updated webhook', enabled: false, activities: [],
  });
});

test('empty and unchanged updates of an existing integration remain successful', async () => {
  const f = fixture();
  for (const body of [{}, { title: 'Webhook', enabled: true }]) {
    assert.deepEqual(await f.put(body), { code: 200, data: { _id: 'integration' } });
  }
});

for (const [name, params] of [
  ['missing integration', { intId: 'missing' }],
  ['integration belonging to another board', { intId: 'foreign-integration' }],
  ['existing integration under another board', { boardId: 'other-board' }],
]) {
  test(`${name} returns 404 before any field is written or validated`, async () => {
    for (const body of [{}, { title: 'Changed', enabled: false, activities: [] }, { notificationDelivery: 'invalid' }]) {
      const f = fixture();
      const before = plain(f.documents);
      assert.deepEqual(await f.put(body, params), { code: 404, data: { error: 'Integration not found' } });
      assert.deepEqual(f.calls, [
        ['admin', 'admin', params.boardId || 'board'],
        ['lookup', { _id: params.intId || 'integration', boardId: params.boardId || 'board' }],
      ]);
      assert.deepEqual(f.documents, before);
    }
  });
}

test('board authorization precedes lookups for both existing and missing IDs', async () => {
  for (const intId of ['integration', 'missing']) {
    const f = fixture({ deny: true });
    const response = await f.put({ title: 'Changed' }, { intId });
    assert.equal(response.code, 403);
    assert.deepEqual(f.calls, [['admin', 'admin', 'board']]);
    assert.equal(f.documents[0].title, 'Webhook');
  }
});

test('database errors keep their server-error response instead of becoming 404', async () => {
  const f = fixture({ lookupError: new Error('database unavailable') });
  const response = await f.put({ title: 'Changed' });
  assert.equal(response.code, 500);
  assert.equal(f.documents[0].title, 'Webhook');
  assert.ok(!f.calls.some(([name]) => name === 'update'));
});

test('invalid delivery settings still reject an existing integration before writes', async () => {
  const f = fixture();
  const response = await f.put({ title: 'Changed', notificationDelivery: 'invalid' });
  assert.equal(response.code, 400);
  assert.equal(response.data.error, 'invalid-notification-delivery');
  assert.equal(f.documents[0].title, 'Webhook');
  assert.ok(!f.calls.some(([name]) => name === 'update'));
});
