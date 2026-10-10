'use strict';
// #3695: choose what outgoing webhooks (Rocket.Chat, Slack, ...) send - the
// human `text` or not, and which groups of structured properties - at the
// Admin Panel, board and webhook level; and let a member leave their own name
// out of webhooks. Nothing changes until somebody changes a setting.
//
// Run: node tests/webhookPayloadSettings.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const lib = require('../models/lib/webhookPayload');
const delivery = require('../models/lib/notificationDelivery');
const {
  GROUP_KEYS, WEBHOOK_PAYLOAD_GROUPS, BUILT_IN,
  normalizeMemberWebhookSettings, buildWebhookBody, combineWebhookBodies,
} = lib;
// The webhook channel of the shared delivery model.
const normalizeWebhookPayloadSettings = value => delivery.normalizeChannelSettings('webhook', value);
const resolveWebhookPayloadSettings = ({ integration, board, admin } = {}) =>
  delivery.resolveChannelSettings('webhook', [['integration', integration], ['board', board], ['admin', admin]]);

// The built-in list in server/notifications/outgoing.js, read from the source
// so these tests follow it.
const LEGACY = (() => {
  const src = read('server/notifications/outgoing.js');
  const start = src.indexOf("process.env.WEBHOOKS_ATTRIBUTES.split(',')) || [");
  const block = src.slice(start, src.indexOf('];', start)).replace(/^\s*\/\/.*$/gm, '');
  return [...block.matchAll(/'([A-Za-z]+)'/g)].map(m => m[1]);
})();

// A joinMember activity's parameters, as server/models/activities.js builds them.
const PARAMS = Object.freeze({
  activityId: 'act1', user: 'Actor Person', username: 'actor', userId: 'actorId',
  userEmails: [{ address: 'actor@example.test' }], atEmails: [{ address: 'x@example.test' }],
  watchers: ['w1'], board: 'Board', boardId: 'b1', boardUrl: 'https://w.test/b/b1/board',
  list: 'Todo', listId: 'l1', swimlane: 'Default', swimlaneId: 's1',
  card: 'Card', cardId: 'c1', url: 'https://w.test/b/b1/board/c1', cardUrl: 'https://w.test/b/b1/board/c1',
  description: 'Card body', member: 'Joined Person', memberUsername: 'joined', memberId: 'joinedId',
  checklist: 'Release', checklistId: 'cl1', checklistItem: 'Ship', checklistItemId: 'ci1',
  comment: 'hello', commentId: 'cm1', timeKey: 'dueAt', timeValue: '2026-10-10',
});

test('the built-in default is the payload WeKan always sent: text + the standard attribute list', () => {
  assert.deepEqual(BUILT_IN, { text: true, fields: ['standard'] });
  const resolved = resolveWebhookPayloadSettings({});
  assert.equal(resolved.text, true); assert.deepEqual(resolved.fields, ['standard']);
  assert.equal(resolved.from.text, 'default'); assert.equal(resolved.from.fields, 'default');
  assert.equal(resolved.grouping, 'none'); assert.equal(resolved.schedule, 'immediate');
  const body = buildWebhookBody({ description: 'act-joinMember', params: PARAMS, text: 'T', settings: resolved, legacyAttributes: LEGACY });
  // Exactly what the old loop produced: text, the present legacy keys in list
  // order, then description.
  const expected = { text: 'T' };
  for (const key of LEGACY) if (PARAMS[key] !== undefined) expected[key] = PARAMS[key];
  expected.description = 'act-joinMember';
  assert.deepEqual(body, expected);
  assert.deepEqual(Object.keys(body), Object.keys(expected));
});

test('text can be switched off, leaving only properties', () => {
  const body = buildWebhookBody({ description: 'act-joinMember', params: PARAMS, text: 'T',
    settings: { text: false, fields: ['people'] }, legacyAttributes: LEGACY });
  assert.equal(Object.hasOwn(body, 'text'), false);
  assert.deepEqual(body, { member: 'Joined Person', memberUsername: 'joined', memberId: 'joinedId', description: 'act-joinMember' });
});

test('each field group adds exactly its own properties', () => {
  for (const group of GROUP_KEYS.filter(g => g !== 'standard')) {
    const body = buildWebhookBody({ description: 'act-x', params: PARAMS, text: 'T', settings: { text: false, fields: [group] } });
    const keys = Object.keys(body).filter(k => k !== 'description');
    for (const key of keys) assert.ok(WEBHOOK_PAYLOAD_GROUPS[group].includes(key), `${group} sent ${key}`);
  }
  const names = buildWebhookBody({ description: 'act-x', params: PARAMS, settings: { text: false, fields: ['names'] } });
  assert.equal(names.checklist, 'Release'); assert.equal(names.checklistItem, 'Ship'); assert.equal(names.list, 'Todo');
  const links = buildWebhookBody({ description: 'act-x', params: PARAMS, settings: { text: false, fields: ['links'] } });
  assert.equal(links.boardUrl, PARAMS.boardUrl); assert.equal(links.cardUrl, PARAMS.cardUrl);
  const details = buildWebhookBody({ description: 'act-x', params: PARAMS, settings: { text: false, fields: ['details'] } });
  assert.equal(details.cardDescription, 'Card body', 'the card description travels as cardDescription');
  assert.equal(details.description, 'act-x', 'description stays the event name');
  assert.equal(details.comment, 'hello'); assert.equal(details.timeKey, 'dueAt');
});

test('groups add to the standard list, and an empty list sends only the event', () => {
  const body = buildWebhookBody({ description: 'act-x', params: PARAMS, text: 'T',
    settings: { text: true, fields: ['standard', 'names'] }, legacyAttributes: LEGACY });
  assert.equal(body.text, 'T'); assert.equal(body.checklist, 'Release'); assert.equal(body.cardId, 'c1');
  assert.deepEqual(buildWebhookBody({ description: 'act-x', params: PARAMS, text: 'T', settings: { text: false, fields: [] }, legacyAttributes: LEGACY }),
    { description: 'act-x' });
});

test('negative: no group ever sends e-mail addresses, watchers or the internal admin-only flag', () => {
  const body = buildWebhookBody({ description: 'act-x', params: { ...PARAMS, customFieldAdminOnly: true },
    text: 'T', settings: { text: true, fields: [...GROUP_KEYS] }, legacyAttributes: LEGACY });
  for (const key of ['userEmails', 'atEmails', 'watchers', 'customFieldAdminOnly', 'token', 'password', 'services', 'emails']) {
    assert.equal(Object.hasOwn(body, key), false, key);
  }
  for (const group of GROUP_KEYS) {
    for (const key of WEBHOOK_PAYLOAD_GROUPS[group]) assert.ok(!/email|password|token|secret|services|watchers/i.test(key), key);
  }
});

test('negative: an admin-only custom field value is never sent, in any mode', () => {
  const params = { ...PARAMS, customField: 'Salary', customFieldId: 'cf1', customFieldValue: 5000, value: 5000, oldValue: 4000, customFieldAdminOnly: true };
  for (const settings of [BUILT_IN, { text: true, fields: [...GROUP_KEYS] }]) {
    const body = buildWebhookBody({ description: 'act-setCustomField', params, text: 'T', settings, legacyAttributes: [...LEGACY, 'value', 'oldValue'] });
    for (const key of ['customFieldValue', 'value', 'oldValue']) assert.equal(Object.hasOwn(body, key), false, key);
  }
  const open = buildWebhookBody({ description: 'act-setCustomField', params: { ...params, customFieldAdminOnly: undefined },
    text: 'T', settings: BUILT_IN, legacyAttributes: LEGACY });
  assert.equal(open.customFieldValue, 5000, 'an ordinary custom field keeps its value');
});

test('a member who asked to be left out is named nowhere in the body', () => {
  const all = { text: true, fields: [...GROUP_KEYS] };
  const actorHidden = buildWebhookBody({ description: 'act-joinMember', params: PARAMS, text: 'A member joined', settings: all, legacyAttributes: LEGACY, hiddenUserIds: ['actorId'] });
  for (const key of ['user', 'username', 'userId']) assert.equal(Object.hasOwn(actorHidden, key), false, key);
  assert.equal(actorHidden.member, 'Joined Person');
  const memberHidden = buildWebhookBody({ description: 'act-joinMember', params: PARAMS, text: 'T', settings: all, legacyAttributes: LEGACY, hiddenUserIds: ['joinedId'] });
  for (const key of ['member', 'memberUsername', 'memberId']) assert.equal(Object.hasOwn(memberHidden, key), false, key);
  assert.equal(memberHidden.username, 'actor');
  assert.equal(lib.memberHidesIdentity({ profile: { webhookHideIdentity: true } }), true);
  assert.equal(lib.memberHidesIdentity({ profile: { webhookHideIdentity: 'yes' } }), false);
  assert.equal(lib.memberHidesIdentity(null), false);
});

test('precedence: webhook, then board, then Admin Panel, then built-in - per setting', () => {
  const admin = { text: false, fields: ['ids'] };
  const board = { fields: ['names'] };
  const integration = { text: true };
  const r = resolveWebhookPayloadSettings({ integration, board, admin });
  assert.equal(r.text, true); assert.equal(r.from.text, 'integration');
  assert.deepEqual(r.fields, ['names']); assert.equal(r.from.fields, 'board');
  const noBoard = resolveWebhookPayloadSettings({ integration: {}, admin });
  assert.equal(noBoard.text, false); assert.deepEqual(noBoard.fields, ['ids']); assert.equal(noBoard.from.fields, 'admin');
  // A corrupt stored level is ignored, never trusted.
  const corrupt = resolveWebhookPayloadSettings({ integration: { fields: ['passwords'] }, board: 'x', admin: { text: 'no' } });
  assert.deepEqual(corrupt.fields, ['standard']); assert.equal(corrupt.text, true);
});

test('normalize keeps known values in canonical order and clears with null', () => {
  assert.deepEqual(normalizeWebhookPayloadSettings({ text: false, fields: ['details', 'ids', 'ids'] }), { text: false, fields: ['ids', 'details'] });
  assert.deepEqual(normalizeWebhookPayloadSettings({ fields: [] }), { fields: [] });
  assert.equal(normalizeWebhookPayloadSettings(null), null);
  assert.deepEqual(combineWebhookBodies([{ text: 'a', cardId: 'c' }]), { text: 'a', cardId: 'c' }, 'a batch of one is the immediate payload');
  assert.deepEqual(combineWebhookBodies([{ text: 'a' }, { description: 'x' }]),
    { text: 'a', description: 'act-batch', count: 2, items: [{ text: 'a' }, { description: 'x' }] });
  assert.throws(() => combineWebhookBodies([]), /empty/);
  assert.equal(normalizeWebhookPayloadSettings({ text: null, fields: null }), null);
  assert.deepEqual(normalizeMemberWebhookSettings({ hideIdentity: true }), { hideIdentity: true });
  assert.deepEqual(normalizeMemberWebhookSettings({ hideIdentity: null }), { hideIdentity: false });
});

test('negative: invalid settings are rejected', () => {
  const bad = [
    'x', [], 5, { text: 'yes' }, { text: 1 }, { fields: 'ids' }, { fields: ['ids', 'secrets'] },
    { fields: [1] }, { fields: ['__proto__'] }, { token: 'x' }, { text: true, extra: 1 },
    { fields: Array(40).fill('ids') }, Object.create({ text: true }),
  ];
  for (const value of bad) {
    assert.throws(() => normalizeWebhookPayloadSettings(value), /setting|text|field|group|object|list/, JSON.stringify(value));
  }
  for (const value of [null, 'x', { hideIdentity: 'yes' }, { hideIdentity: true, text: false }]) {
    assert.throws(() => normalizeMemberWebhookSettings(value), /setting|hideIdentity|object/);
  }
});

// End to end through prepareOutgoingWebhook, with the stored levels.
function outgoingFixture({ setting = {}, board = {}, users = {} } = {}) {
  const source = read('server/notifications/outgoing.js').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const context = { structuredClone, process: { env: {} },
    Meteor: { methods() {} }, check() {}, Integrations: { Const: { TWOWAY: 'two-way', GLOBAL_WEBHOOK_ID: '_global' } },
    ReactiveCache: {
      getUser: async id => ({ _id: id, getLanguage: () => 'en', profile: (users[id] || {}).profile || {} }),
      getBoard: async id => (id === 'b1' ? board : null),
      getCurrentSetting: async () => setting,
    },
    TAPi18n: { ensureLanguageLoaded: async () => {},
      __: (key, params) => (key === 'webhook-someone' ? 'A member' : `added member ${params.member} to ${params.card}`) },
    ...lib, ...delivery,
  };
  vm.runInNewContext(source, context);
  return async (integration, params = PARAMS) => {
    const prepared = await context.prepareOutgoingWebhook({ integration, description: 'act-joinMember', params, actorId: 'actorId' });
    return JSON.parse(prepared.body);
  };
}
const boardHook = { boardId: 'b1', url: 'https://hook.test', type: 'outgoing-webhooks' };
const globalHook = { boardId: '_global', url: 'https://hook.test', type: 'outgoing-webhooks' };

test('end to end: nothing configured sends the old payload', async () => {
  const send = outgoingFixture();
  const body = await send(boardHook);
  assert.equal(body.text, 'Actor Person added member Joined Person to "Card"\nhttps://w.test/b/b1/board/c1');
  assert.equal(body.member, 'Joined Person'); assert.equal(body.cardId, 'c1');
  assert.equal(Object.hasOwn(body, 'checklist'), false, 'new fields are opt-in');
  assert.equal(Object.hasOwn(body, 'userEmails'), false);
});

test('end to end: the Admin Panel default, the board default and the webhook each take effect', async () => {
  const send = outgoingFixture({ setting: { notificationDelivery: { webhook: { text: false } } },
    board: { notificationDelivery: { webhook: { fields: ['people'] } } } });
  assert.deepEqual(await send(boardHook), { member: 'Joined Person', memberUsername: 'joined', memberId: 'joinedId', description: 'act-joinMember' });
  // The board default does not reach the instance's global webhook.
  const global = await send(globalHook);
  assert.equal(Object.hasOwn(global, 'text'), false); assert.equal(global.cardId, 'c1');
  // The webhook's own setting wins.
  const own = await send({ ...boardHook, notificationDelivery: { webhook: { text: true, fields: ['ids'] } } });
  assert.ok(own.text); assert.equal(own.checklistId, 'cl1'); assert.equal(Object.hasOwn(own, 'member'), false);
});

test('end to end: a member who hid their identity is not named in text or properties, two-way included', async () => {
  const send = outgoingFixture({ users: { joinedId: { profile: { webhookHideIdentity: true } }, actorId: { profile: { webhookHideIdentity: true } } } });
  const body = await send({ ...boardHook, notificationDelivery: { webhook: { fields: ['standard', 'actor', 'people'] } } });
  assert.doesNotMatch(JSON.stringify(body), /Joined Person|joinedId|Actor Person|actorId|"joined"|"actor"/);
  assert.equal(body.text, 'A member added member A member to "Card"\nhttps://w.test/b/b1/board/c1');
  const twoWay = await send({ ...boardHook, type: 'two-way' });
  assert.doesNotMatch(JSON.stringify(twoWay), /Joined Person|joinedId|Actor Person|actorId|actor@example/);
  assert.equal(twoWay.commentId, 'cm1', 'two-way keeps the ids its reply needs');
});

test('wiring: settings are stored with validation, saved through one guarded method, and shown in all three places', () => {
  for (const file of ['models/integrations.js', 'models/boards.js', 'models/settings.js']) {
    assert.match(read(file), /\.\.\.deliverySchemaFields\('notificationDelivery'/, file);
  }
  const schema = delivery.deliverySchemaFields('notificationDelivery', ['webhook']);
  assert.deepEqual(schema['notificationDelivery.webhook.fields.$'].allowedValues, [...GROUP_KEYS]);
  assert.equal(schema['notificationDelivery.webhook.text'].type, Boolean);
  const users = read('models/users.js');
  assert.match(users, /'profile\.webhookHideIdentity': \{[\s\S]*?type: Boolean,/);
  assert.match(users, /deliverySchemaFields\('profile\.notificationDelivery', MEMBER_CHANNELS\)/);
  const method = read('server/methods/notificationDelivery.js');
  assert.match(method, /if \(!this\.userId\) throw new Meteor\.Error\('not-authorized'\)/);
  assert.match(method, /if \(scope === 'admin'\) \{\s*if \(!isInstanceAdmin\) throw/);
  assert.match(method, /integration\.boardId === Integrations\.Const\.GLOBAL_WEBHOOK_ID\) \{\s*if \(!isInstanceAdmin\) throw/);
  assert.match(method, /allowIsBoardAdminOrSiteAdmin\(this\.userId, board\)/);
  assert.match(method, /if \(targetId && targetId !== this\.userId\) throw new Meteor\.Error\('not-authorized'\)/);
  assert.match(method, /Meteor\.users\.updateAsync\(this\.userId,/, 'a member writes only their own profile');
  assert.match(method, /if \(!MEMBER_CHANNELS\.includes\(channel\)\) throw/, 'a member cannot set a board webhook');
  assert.match(method, /normalizeChannelSettings\(channel, settings\)/);
  assert.match(read('server/imports.js'), /import '\/server\/methods\/notificationDelivery';/);
  // REST: validated before ANY field of the PUT is written.
  const rest = read('server/models/integrations.js');
  const validate = rest.indexOf("normalizeDeliverySettings(req.body.notificationDelivery, ['webhook'])");
  assert.ok(validate > 0 && validate < rest.indexOf("req.body.hasOwnProperty('enabled')"));
  // UI: Admin Panel, Board Settings and Member Settings (the shared popup),
  // and each one-way webhook's own form.
  assert.match(read('client/components/settings/notificationSettingsPopup.jade'), /\+notificationDeliverySettings\(scope=\.\.\/scope targetId=deliveryTargetId channel=channel\)/);
  assert.match(read('client/components/settings/notificationSettingsPopup.js'), /return scope === 'admin' \|\| scope === 'member';/);
  assert.match(read('client/components/sidebar/sidebar.jade'), /\+notificationDeliverySettings\(scope="integration" targetId=_id channel="webhook"\)/);
  const features = read('client/features/settings.js');
  assert.match(features, /notificationDeliverySettings\.jade/); assert.match(features, /notificationDeliverySettings\.js/);
  assert.match(read('server/publications/settings.js'), /notificationDelivery: 1,/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['webhook-payload-text', 'webhook-payload-fields', 'notification-delivery-invalid',
    'webhook-hide-identity', 'webhook-someone', ...GROUP_KEYS.map(g => `webhook-payload-field-${g}`)]) {
    assert.equal(typeof en[key], 'string', key);
  }
});

test('docs list every payload property and the settings', () => {
  const doc = read('docs/Features/Webhooks/Webhook-data.md');
  for (const group of GROUP_KEYS) {
    for (const key of WEBHOOK_PAYLOAD_GROUPS[group]) assert.match(doc, new RegExp('`' + key + '`'), key);
  }
  assert.match(doc, /Member Settings/); assert.match(doc, /Admin Panel/); assert.match(doc, /WEBHOOKS_ATTRIBUTES/);
});
