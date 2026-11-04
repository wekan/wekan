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

test('every handler that updates an integration looks it up on that board first', () => {
  const updating = source.split(/\nWebApp\.handlers\./).slice(1)
    .filter(block => /Integrations\.direct\.updateAsync/.test(block));
  assert.ok(updating.length >= 3, 'PUT and both activities routes are found');
  for (const block of updating) {
    const update = block.indexOf('Integrations.direct.updateAsync');
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

function run(handlerUrl, verb, integrations) {
  const calls = [];
  let handler;
  const context = {
    WebApp: { handlers: Object.fromEntries(['get', 'post', 'put', 'delete'].map(v => [v, (url, fn) => {
      if (v === verb && url === handlerUrl) handler = fn;
    }])) },
    Authentication: { async checkBoardAdmin() {} },
    ReactiveCache: { async getIntegration(selector) {
      return integrations.find(i => i._id === selector._id && i.boardId === selector.boardId);
    } },
    Integrations: { direct: { async updateAsync(...args) { calls.push(args); return 1; } } },
    normalizeDeliverySettings: x => x,
    publicErrorData,
    sendJsonResult(res, result) { res.responses.push(JSON.parse(JSON.stringify(result))); },
  };
  vm.runInNewContext(source.slice(source.indexOf('WebApp.handlers.get(')), context);
  return {
    calls,
    async call(params, body) {
      const res = { responses: [] };
      await handler({ userId: 'u', params, body }, res);
      return res.responses[0];
    },
  };
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
