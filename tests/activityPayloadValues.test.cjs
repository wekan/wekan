'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture() {
  const hooks = [], deliveries = [], notifications = [];
  const source = fs.readFileSync(require.resolve('../server/models/activities.js'), 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const context = { Meteor: { startup() {}, call(name, integration, description, params, callback) {
    assert.equal(name, 'outgoingWebhooks'); deliveries.push(structuredClone(params)); callback(null);
  } }, Activities: { after: { insert: fn => hooks.push(fn) }, _transform: doc => doc },
    RulesHelper: { executeRules: async () => {} }, getFeatureFlags: () => ({}),
    ACTIVITY_NOTIFICATION_TITLE: {}, Integrations: { Const: { GLOBAL_WEBHOOK_ID: 'global' } },
    ReactiveCache: { getIntegrations: async () => [{ _id: 'integration' }] },
    Notifications: { getUsers: async () => [{ _id: 'watcher' }], notify: (user, title, description, params) => notifications.push(structuredClone(params)) },
    safeDeliver: async fn => fn(), require: id => require(`..${id}`), process: { env: {} }, console,
  };
  vm.runInNewContext(source, context);
  const doc = value => ({ _id: 'activity', activityType: 'setCustomField',
    customFieldId: 'field', customField: async () => ({ name: 'Estimate' }), ...value });
  return { deliveries, notifications, run: value => hooks[1]('author', doc(value)),
    prepare: value => context.prepareActivityNotification('author', doc(value)) };
}
test('actual activity hook forwards zero, false, empty and null to notifications and webhooks', async () => {
  for (const value of [0, false, '', null, 'text', 12]) {
    const f = fixture(); await f.run({ value, oldValue: value, timeValue: value, timeOldValue: value });
    assert.equal(f.deliveries.length, 1); assert.equal(f.notifications.length, 1);
    for (const payload of [f.deliveries[0], f.notifications[0]]) {
      for (const key of ['value', 'oldValue', 'customFieldValue', 'timeValue', 'timeOldValue']) {
        assert.equal(Object.hasOwn(payload, key), true, `${key} must not vanish`);
        assert.equal(payload[key], value);
      }
    }
  }
});
test('absent and undefined values remain absent rather than being invented as empty strings', async () => {
  for (const values of [{}, { value: undefined, oldValue: undefined, timeValue: undefined, timeOldValue: undefined }]) {
    const f = fixture(); await f.run(values);
    for (const payload of [f.deliveries[0], f.notifications[0]]) {
      for (const key of ['value', 'oldValue', 'customFieldValue', 'timeValue', 'timeOldValue']) assert.equal(Object.hasOwn(payload, key), false);
      assert.equal(payload.customField, 'Estimate');
    }
  }
});
async function outgoingPayload(params, type = 'outgoing', attributes) {
  const source = fs.readFileSync(require.resolve('../server/notifications/outgoing.js'), 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  let method, payload;
  const context = { structuredClone, Meteor: { methods: methods => { method = methods.outgoingWebhooks; } },
    check() {}, ReactiveCache: { getUser: async () => ({ getLanguage: () => 'en' }),
      getIntegration: async () => ({ boardId: 'board' }), getBoard: async () => ({ hasMember: () => true }) },
    TAPi18n: { ensureLanguageLoaded: async () => {}, __: () => 'changed' },
    Integrations: { Const: { TWOWAY: 'two-way' } },
    fetchSafe: async (url, request) => { payload = JSON.parse(request.body); return { status: 200 }; },
    process: { env: attributes ? { WEBHOOKS_ATTRIBUTES: attributes } : {} },
  };
  vm.runInNewContext(source, context);
  await method.call({ userId: 'author', unblock() {} }, { boardId: 'board', url: 'https://example.test/hook', type }, 'act-setCustomField', params);
  return payload;
}
test('outgoing HTTP payload preserves falsy configured attributes without widening the attribute list', async () => {
  for (const value of [0, false, '', null]) {
    const f = fixture(); await f.run({ value, oldValue: value });
    const defaultPayload = await outgoingPayload(f.deliveries[0]);
    assert.equal(defaultPayload.customFieldValue, value);
    assert.equal(Object.hasOwn(defaultPayload, 'value'), false, 'default attribute selection is retained');
    const configured = await outgoingPayload(f.deliveries[0], 'outgoing', 'value,oldValue');
    assert.equal(configured.value, value); assert.equal(configured.oldValue, value);
    assert.equal(Object.hasOwn(configured, 'customFieldValue'), false);
    const bidirectional = await outgoingPayload(f.deliveries[0], 'two-way');
    assert.equal(bidirectional.value, value); assert.equal(bidirectional.oldValue, value);
  }
  const absent = await outgoingPayload({ value: undefined }, 'outgoing', 'value,oldValue');
  assert.equal(Object.hasOwn(absent, 'value'), false); assert.equal(Object.hasOwn(absent, 'oldValue'), false);
});

test('shared activity preparation selects the same payload and recipients without notification or webhook writes', async () => {
  const f=fixture(),prepared=await f.prepare({value:0,oldValue:false});
  assert.equal(f.deliveries.length,0);assert.equal(f.notifications.length,0);
  assert.deepEqual(Array.from(prepared.users,user=>user._id),['watcher']);
  await f.run({value:0,oldValue:false});
  assert.deepEqual(structuredClone(prepared.params),f.notifications[0]);
});
