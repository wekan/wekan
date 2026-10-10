'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function fixture({ load = async () => {}, translate = (key, params, language) => `${language}:${params.card}`, member = true, user = true } = {}) {
  let language = 'fi', method, stored = null;
  const requests = [], writes = [], translations = [];
  const context = { structuredClone, process: { env: {} },
    Meteor: { methods: methods => { method = methods.outgoingWebhooks; },
      setTimeout: () => { throw new Error('preparation must not set echo locks'); } },
    check() {}, Integrations: { Const: { TWOWAY: 'two-way' } },
    CardComments: { direct: { updateAsync: async (...args) => writes.push(args) } },
    ReactiveCache: { getUser: async () => user ? { getLanguage: () => language } : null,
      // HookBleed: delivery builds the request from the STORED integration.
      getIntegration: async () => stored, getBoard: async () => ({ hasMember: () => member }),
      getCurrentSetting: async () => ({}),
      getCard: async id => (id === 'card' ? { _id: 'card', boardId: 'board', listId: 'list' } : null) },
    TAPi18n: { ensureLanguageLoaded: load, __: (...args) => { translations.push(args); return translate(...args); } },
    fetchSafe: async (url, request) => { requests.push({ url, ...request }); return { status: 200 }; },
    // #3695: the payload builder outgoing.js imports (stripped below).
    ...require('../models/lib/webhookPayload'), ...require('../models/lib/notificationDelivery'),
  };
  const source = fs.readFileSync(require.resolve('../server/notifications/outgoing.js'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  vm.runInNewContext(source, context);
  return { prepare: context.prepareOutgoingWebhook,
    // Ordinary use: the stored integration is the one the caller names.
    send: (input, { storedIntegration = structuredClone(input.integration), connection = null } = {}) => {
      stored = storedIntegration;
      return method.call({ userId: 'actor', connection, unblock() {} }, input.integration, input.description, input.params);
    }, requests, writes, translations,
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

// HookBleed (2026-10-02): the request came from the CALLER's integration
// object, description and params, so any member could post arbitrary text to
// the board's chat webhook as WeKan, or turn a one-way hook two-way.
test('a client cannot forge what a board webhook sends', async () => {
  const f = fixture();
  const forged = input('two-way');
  forged.description = 'act-anything';
  // A stored ONE-way hook; the caller claims two-way and a message of its own.
  await f.send(forged, { storedIntegration: { boardId: 'board', url: 'https://example.test/hook', token: 'stored', type: 'outgoing' }, connection: {} });
  assert.equal(f.requests.length, 0, 'only the card-opened notification may come from a client');
  // The card-opened notification is sent - built from the stored hook and the
  // card, not from what the client sent.
  const opened = { ...input('two-way'), description: 'CardSelected', params: { cardId: 'card', user: 'Somebody else', text: 'forged text' } };
  await f.send(opened, { storedIntegration: { boardId: 'board', url: 'https://example.test/hook', token: 'stored', type: 'outgoing' }, connection: {} });
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].headers['X-Wekan-Token'], 'stored');
  assert.doesNotMatch(f.requests[0].body, /forged text|Somebody else/);
});
