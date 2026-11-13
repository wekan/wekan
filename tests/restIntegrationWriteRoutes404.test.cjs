'use strict';

// Every integration route that WRITES must answer 404 for an integration that is not on the
// board in the URL (#6862 did GET; PR #6871 did PUT). The two activities routes had the same
// fault: they updated nothing and answered 200 with `data: null`. This pins the shape over the
// whole file, so a new write route cannot bring it back.
//
// Run: node tests/restIntegrationWriteRoutes404.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { publicErrorData } = require('../server/lib/apiResponseHelpers');

const file = path.join(__dirname, '..', 'server/models/integrations.js');
const source = fs.readFileSync(file, 'utf8');

test('every handler that updates or deletes an integration looks it up on that board first', () => {
  const updating = source.split(/\nWebApp\.handlers\./).slice(1)
    .filter(block => /Integrations\.direct\.(update|remove)Async/.test(block));
  assert.ok(updating.length >= 4, 'PUT, both activities routes and DELETE are found');
  for (const block of updating) {
    const update = block.search(/Integrations\.direct\.(update|remove)Async/);
    const guard = block.indexOf('integrationOr404(');
    assert.ok(guard > -1 && guard < update, `${block.split('\n')[0]} checks before it writes`);
    // and only after board-admin authorization, so the answer tells nobody anything
    assert.ok(block.indexOf('checkBoardAdmin') < guard, `${block.split('\n')[0]} authorizes first`);
  }
});

test('negative: the check is not the old "write, then answer 200 with whatever is there"', () => {
  assert.match(source, /async function integrationOr404\(/);
  assert.match(source, /code: 404, data: \{ error: 'Integration not found' \}/);
});

function run(handlerUrl, verb, integrations, { deny = false, lookupError, removeError } = {}) {
  const calls = [];
  const lookups = [];
  let handler;
  const context = {
    WebApp: { handlers: Object.fromEntries(['get', 'post', 'put', 'delete'].map(v => [v, (url, fn) => {
      if (v === verb && url === handlerUrl) handler = fn;
    }])) },
    Authentication: { async checkBoardAdmin() {
      if (deny) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    } },
    ReactiveCache: { async getIntegration(selector) {
      lookups.push(selector);
      if (lookupError) throw lookupError;
      return integrations.find(i => i._id === selector._id && i.boardId === selector.boardId);
    } },
    Integrations: { direct: {
      async updateAsync(...args) { calls.push(args); return 1; },
      async removeAsync(...args) {
        calls.push(args);
        if (removeError) throw removeError;
        return 1;
      },
    } },
    normalizeDeliverySettings: x => x,
    publicErrorData,
    sendJsonResult(res, result) { res.responses.push(JSON.parse(JSON.stringify(result))); },
  };
  vm.runInNewContext(source.slice(source.indexOf('WebApp.handlers.get(')), context);
  return {
    calls, lookups,
    async call(params, body) {
      const res = { responses: [] };
      await handler({ userId: 'u', params, body }, res);
      assert.equal(res.responses.length, 1, 'respond exactly once');
      return res.responses[0];
    },
  };
}

const deleteUrl = '/api/boards/:boardId/integrations/:intId';

test('DELETE answers 404 without removing anything for missing, foreign and repeated IDs', async () => {
  const integrations = [{ _id: 'i1', boardId: 'b1' }, { _id: 'i2', boardId: 'b2' }];
  const r = run(deleteUrl, 'delete', integrations);
  for (const params of [{ boardId: 'b1', intId: 'missing' }, { boardId: 'b1', intId: 'i2' }]) {
    assert.deepEqual(await r.call(params), { code: 404, data: { error: 'Integration not found' } });
  }
  assert.equal(r.calls.length, 0);
  assert.deepEqual(await r.call({ boardId: 'b1', intId: 'i1' }), { code: 200, data: { _id: 'i1' } });
  assert.deepEqual(JSON.parse(JSON.stringify(r.calls)), [[{ _id: 'i1', boardId: 'b1' }]]);
  integrations.shift();
  assert.deepEqual(await r.call({ boardId: 'b1', intId: 'i1' }), { code: 404, data: { error: 'Integration not found' } });
  assert.equal(r.calls.length, 1);
});

test('DELETE checks authorization before looking up existing or missing integrations', async () => {
  const r = run(deleteUrl, 'delete', [{ _id: 'i1', boardId: 'b1' }], { deny: true });
  for (const intId of ['i1', 'missing']) {
    assert.equal((await r.call({ boardId: 'b1', intId })).code, 403);
  }
  assert.equal(r.lookups.length, 0);
  assert.equal(r.calls.length, 0);
});

for (const operation of ['lookup', 'remove']) {
  test(`DELETE preserves server errors from ${operation} instead of reporting 404 or success`, async () => {
    const r = run(deleteUrl, 'delete', [{ _id: 'i1', boardId: 'b1' }], {
      [`${operation}Error`]: new Error('database unavailable'),
    });
    assert.equal((await r.call({ boardId: 'b1', intId: 'i1' })).code, 500);
    assert.equal(r.calls.length, operation === 'lookup' ? 0 : 1);
  });
}

for (const verb of ['post', 'delete']) {
  test(`${verb.toUpperCase()} .../activities answers 404 and writes nothing for a missing or foreign integration`, async () => {
    const url = '/api/boards/:boardId/integrations/:intId/activities';
    const r = run(url, verb, [{ _id: 'i1', boardId: 'b1' }, { _id: 'i2', boardId: 'b2' }]);
    assert.deepEqual(await r.call({ boardId: 'b1', intId: 'nope' }, { activities: ['a'] }), { code: 404, data: { error: 'Integration not found' } });
    assert.deepEqual(await r.call({ boardId: 'b1', intId: 'i2' }, { activities: ['a'] }), { code: 404, data: { error: 'Integration not found' } });
    assert.equal(r.calls.length, 0, 'no write happened');
    // positive: its own integration is still updated
    const ok = await r.call({ boardId: 'b1', intId: 'i1' }, { activities: ['a'] });
    assert.equal(ok.code, 200);
    assert.equal(r.calls.length, 1);
  });
}
