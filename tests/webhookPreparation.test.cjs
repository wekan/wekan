'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function fixture({ load = async () => {}, translate = (key, params, language) => `${language}:${params.card}`, member = true, user = true } = {}) {
  let language = 'fi', method;
  const requests = [], writes = [], translations = [];
  const context = { structuredClone, process: { env: {} },
    Meteor: { methods: methods => { method = methods.outgoingWebhooks; },
      setTimeout: () => { throw new Error('preparation must not set echo locks'); } },
    check() {}, Integrations: { Const: { TWOWAY: 'two-way' } },
    CardComments: { direct: { updateAsync: async (...args) => writes.push(args) } },
    ReactiveCache: { getUser: async () => user ? { getLanguage: () => language } : null,
      getIntegration: async () => ({ boardId: 'board' }), getBoard: async () => ({ hasMember: () => member }) },
    TAPi18n: { ensureLanguageLoaded: load, __: (...args) => { translations.push(args); return translate(...args); } },
    fetchSafe: async (url, request) => { requests.push({ url, ...request }); return { status: 200 }; },
  };
  const source = fs.readFileSync(require.resolve('../server/notifications/outgoing.js'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  vm.runInNewContext(source, context);
  return { prepare: context.prepareOutgoingWebhook, send: input => method.call({ userId: 'actor', unblock() {} },
    input.integration, input.description, input.params), requests, writes, translations,
    language: value => { language = value; } };
}
const input = type => ({ actorId: 'actor', description: 'act-test',
  integration: { boardId: 'board', url: 'https://example.test/hook', token: 'old-token', type },
  params: { user: 'Person', card: 'Original', url: 'https://example.test/card', customFieldValue: { nested: [0, false, null] }, commentId: 'comment', comment: 'Before' } });
test('preparation freezes nested parameters, endpoint, token and language across asynchronous loading', async () => {
  let entered, release;
  const waiting = new Promise(resolve => { entered = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const loaded = [];
  const f = fixture({ load: async language => { loaded.push(language); entered(); await gate; } });
  const original = input('outgoing');
  const pending = f.prepare(original);
  await waiting;
  original.params.card = 'Changed'; original.params.customFieldValue.nested[0] = 42;
  original.integration.url = 'https://changed.test'; original.integration.token = 'new-token';
  f.language('de'); release();
  const prepared = await pending;
  assert.equal(prepared.url, 'https://example.test/hook');
  assert.equal(prepared.headers['X-Wekan-Token'], 'old-token');
  assert.equal(prepared.language, 'fi'); assert.deepEqual(loaded, ['fi']);
  const body = JSON.parse(prepared.body);
  assert.equal(body.text, 'Person fi:"Original"\nhttps://example.test/card');
  assert.deepEqual(body.customFieldValue, { nested: [0, false, null] });
  assert.equal(f.requests.length, 0); assert.equal(f.writes.length, 0);
});
test('ordinary delivery sends precisely the prepared wire payload; two-way preparation has no lock or writes', async () => {
  for (const type of ['outgoing', 'two-way']) {
    const f = fixture(), data = input(type);
    if (type === 'two-way') delete data.params.commentId;
    const prepared = await f.prepare(data);
    assert.equal(f.requests.length, 0); assert.equal(f.writes.length, 0);
    await f.send(data);
    assert.equal(f.requests.length, 1);
    assert.equal(f.requests[0].body, prepared.body);
    assert.equal(f.requests[0].url, prepared.url);
    assert.deepEqual(structuredClone(f.requests[0].headers), structuredClone(prepared.headers));
  }
  const f = fixture();
  const prepared = await f.prepare(input('two-way'));
  assert.equal(JSON.parse(prepared.body).commentId, 'comment');
  assert.equal(f.requests.length, 0); assert.equal(f.writes.length, 0);
});
test('suppression, missing user, denied membership and preparation failure never send', async () => {
  for (const options of [{ translate: () => '-' }, { user: false }]) {
    const f = fixture(options);
    assert.equal(await f.prepare(input('outgoing')), null);
    await f.send(input('outgoing')); assert.equal(f.requests.length, 0);
  }
  const denied = fixture({ member: false });
  await denied.send(input('outgoing')); assert.equal(denied.requests.length, 0);
  const broken = fixture({ load: async () => { throw new Error('load failed'); } });
  await assert.rejects(broken.prepare(input('outgoing')), /load failed/);
  await assert.rejects(broken.send(input('outgoing')), /load failed/);
  assert.equal(broken.requests.length, 0);
});
