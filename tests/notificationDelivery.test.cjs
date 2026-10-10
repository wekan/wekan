'use strict';
// #3695 / #5171: the shared notification delivery model - content, grouping
// and scheduling for e-mail, the tray and webhooks, set in the Admin Panel, on
// a board, in Member Settings and on each webhook.
//
// Run: node tests/notificationDelivery.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const d = require('../models/lib/notificationDelivery');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
// A translator like TAPi18n's: __key__ placeholders from the English bundle.
const translate = (key, values = {}) => (en[key] ?? key).replace(/__([A-Za-z]+)__/g, (m, name) => (values[name] ?? ''));

test('built-in defaults reproduce the behaviour before these settings, per channel', () => {
  for (const channel of d.CHANNELS) {
    const resolved = d.resolveChannelSettings(channel, []);
    assert.equal(resolved.schedule, 'immediate', channel);
    assert.equal(resolved.quietStart, null, channel);
    for (const key of d.CHANNEL_KEYS[channel]) assert.equal(resolved.from[key], 'default', `${channel}.${key}`);
  }
  assert.equal(d.BUILT_IN.email.layout, 'classic');
  assert.equal(d.BUILT_IN.email.grouping, 'all', 'e-mails were always combined per recipient');
  assert.equal(d.BUILT_IN.tray.grouping, 'none');
  assert.equal(d.BUILT_IN.webhook.grouping, 'none');
  assert.equal(d.BUILT_IN.webhook.text, true);
  assert.deepEqual(d.BUILT_IN.webhook.fields, ['standard']);
  assert.equal(d.webhookQueueTarget(d.resolveChannelSettings('webhook', [])), null, 'a default webhook is never queued');
});

test('precedence: member, then board, then Admin Panel, key by key; webhooks: webhook, board, admin', () => {
  const r = d.resolveChannelSettings('email', [
    ['member', { grouping: 'card' }],
    ['board', { grouping: 'board', layout: 'clear', parts: ['board', 'actor', 'card'] }],
    ['admin', { layout: 'classic', schedule: 'daily', dailyTime: '07:30' }],
  ]);
  assert.equal(r.grouping, 'card'); assert.equal(r.from.grouping, 'member');
  assert.equal(r.layout, 'clear'); assert.equal(r.from.layout, 'board');
  assert.deepEqual(r.parts, ['board', 'actor', 'card']);
  assert.equal(r.schedule, 'daily'); assert.equal(r.dailyTime, '07:30'); assert.equal(r.from.schedule, 'admin');
  const w = d.resolveChannelSettings('webhook', [['integration', { schedule: 'interval', intervalMinutes: 15 }], ['board', { grouping: 'all' }], ['admin', { text: false }]]);
  assert.equal(w.schedule, 'interval'); assert.equal(w.grouping, 'all'); assert.equal(w.text, false);
  // Quiet hours travel together, from one level.
  const q = d.resolveChannelSettings('tray', [['member', { quietStart: '22:00', quietEnd: '07:00' }], ['admin', { quietStart: '12:00', quietEnd: '13:00' }]]);
  assert.equal(q.quietStart, '22:00'); assert.equal(q.quietEnd, '07:00');
});

test('negative: a corrupt stored level is ignored, never trusted', () => {
  const r = d.resolveChannelSettings('email', [['member', { grouping: 'everything', layout: '<b>' }], ['board', 'x'], ['admin', null]]);
  assert.equal(r.grouping, 'all'); assert.equal(r.layout, 'classic');
});

test('normalize keeps only known keys and values', () => {
  assert.deepEqual(d.normalizeChannelSettings('email', { layout: 'clear', parts: ['link', 'board', 'board'], grouping: 'board',
    schedule: 'interval', intervalMinutes: 30, timezone: 'Europe/Helsinki', quietStart: '22:00', quietEnd: '06:30' }),
  { layout: 'clear', parts: ['board', 'link'], grouping: 'board', schedule: 'interval', intervalMinutes: 30,
    quietStart: '22:00', quietEnd: '06:30', timezone: 'Europe/Helsinki' });
  assert.equal(d.normalizeChannelSettings('tray', { grouping: null }), null);
  assert.deepEqual(d.normalizeDeliverySettings({ webhook: { text: false } }, ['webhook']), { webhook: { text: false } });
});

test('negative: invalid settings are rejected', () => {
  const bad = [
    ['email', 'x'], ['email', { token: 'x' }], ['email', { layout: 'html' }], ['email', { parts: ['password'] }],
    ['email', { grouping: 'galaxy' }], ['tray', { grouping: 'all' }], ['email', { schedule: 'weekly' }],
    ['email', { intervalMinutes: 7 }], ['email', { intervalMinutes: '60' }], ['email', { dailyTime: '25:00' }],
    ['email', { dailyTime: '8:00' }], ['email', { timezone: 'Mars/Base' }], ['email', { timezone: '../etc' }],
    ['email', { quietStart: '22:00' }], ['email', { text: true }], ['tray', { fields: ['ids'] }],
    ['webhook', { layout: 'clear' }], ['webhook', { fields: ['secrets'] }], ['webhook', { text: 'yes' }],
    ['email', Object.create({ layout: 'clear' })], ['email', { parts: Array(40).fill('board') }],
  ];
  for (const [channel, value] of bad) {
    assert.throws(() => d.normalizeChannelSettings(channel, value), d.DeliverySettingsError, `${channel} ${JSON.stringify(value)}`);
  }
  assert.throws(() => d.normalizeChannelSettings('sms', {}), /channel/);
  assert.throws(() => d.normalizeDeliverySettings({ webhook: {} }, d.MEMBER_CHANNELS), /channel/,
    'a member level has no webhook delivery');
});

test('schedule: immediate keeps the channel delay; interval and daily follow the local clock', () => {
  const at = new Date('2026-10-10T10:07:00Z');
  assert.equal(d.nextDeliveryAt(at, d.resolveChannelSettings('email', []), { baseDelayMs: 30000 }).toISOString(), '2026-10-10T10:07:30.000Z');
  const every15 = d.resolveChannelSettings('email', [['m', { schedule: 'interval', intervalMinutes: 15, timezone: 'UTC' }]]);
  assert.equal(d.nextDeliveryAt(at, every15).toISOString(), '2026-10-10T10:15:00.000Z');
  // Every notification inside one window shares the same time - one message.
  assert.equal(d.nextDeliveryAt(new Date('2026-10-10T10:14:59Z'), every15).toISOString(), '2026-10-10T10:15:00.000Z');
  // Helsinki is UTC+3 in October: 08:00 local is 05:00Z; after it, the next day.
  const daily = d.resolveChannelSettings('email', [['m', { schedule: 'daily', dailyTime: '08:00', timezone: 'Europe/Helsinki' }]]);
  assert.equal(d.nextDeliveryAt(at, daily).toISOString(), '2026-10-11T05:00:00.000Z');
  assert.equal(d.nextDeliveryAt(new Date('2026-10-10T04:00:00Z'), daily).toISOString(), '2026-10-10T05:00:00.000Z');
  // Across the end of daylight saving (25 Oct 2026 in Helsinki): 08:00 is
  // UTC+2 from that morning on.
  assert.equal(d.nextDeliveryAt(new Date('2026-10-24T06:00:00Z'), daily).toISOString(), '2026-10-25T06:00:00.000Z');
  assert.equal(d.nextDeliveryAt(new Date('2026-10-25T06:30:00Z'), daily).toISOString(), '2026-10-26T06:00:00.000Z');
  // A daily interval is local midnight.
  const midnight = d.resolveChannelSettings('tray', [['m', { schedule: 'interval', intervalMinutes: 1440, timezone: 'Europe/Helsinki' }]]);
  assert.equal(d.nextDeliveryAt(at, midnight).toISOString(), '2026-10-10T21:00:00.000Z');
});

test('schedule: quiet hours hold a delivery until they end, also across midnight', () => {
  const quiet = d.resolveChannelSettings('email', [['m', { quietStart: '22:00', quietEnd: '07:00', timezone: 'UTC' }]]);
  assert.equal(d.nextDeliveryAt(new Date('2026-10-10T23:30:00Z'), quiet, { baseDelayMs: 30000 }).toISOString(), '2026-10-11T07:00:00.000Z');
  assert.equal(d.nextDeliveryAt(new Date('2026-10-10T03:00:00Z'), quiet).toISOString(), '2026-10-10T07:00:00.000Z');
  assert.equal(d.nextDeliveryAt(new Date('2026-10-10T12:00:00Z'), quiet).toISOString(), '2026-10-10T12:00:00.000Z', 'outside: unchanged');
  assert.equal(d.inQuietHours(new Date('2026-10-10T12:00:00Z'), '12:00', '12:00', 'UTC'), false, 'an empty window is no window');
});

test('grouping: keys per board, card or notification, and tray rows', () => {
  assert.equal(d.groupKeyFor('board', { boardId: 'b', cardId: 'c' }), 'board:b');
  assert.equal(d.groupKeyFor('card', { boardId: 'b', cardId: 'c' }), 'card:c');
  assert.equal(d.groupKeyFor('card', { boardId: 'b' }), 'board:b', 'a board event groups with its board');
  assert.equal(d.groupKeyFor('none', { eventId: 'e' }), 'single:e');
  assert.equal(d.groupKeyFor('all', {}), 'all');
  assert.equal(d.groupKeyFor(undefined, {}), null);
  const entries = [{ id: 1, b: 'x', c: 'c1' }, { id: 2, b: 'y', c: 'c2' }, { id: 3, b: 'x', c: 'c1' }, { id: 4, b: 'x', c: 'c3' }];
  const groups = d.groupEntries(entries, () => 'card', e => ({ boardId: e.b, cardId: e.c }));
  assert.deepEqual(groups.map(g => g.entries.map(e => e.id)), [[1, 3], [2], [4]]);
  const mixed = d.groupEntries(entries, e => (e.b === 'x' ? 'board' : 'none'), e => ({ boardId: e.b, cardId: e.c }));
  assert.deepEqual(mixed.map(g => g.entries.map(e => e.id)), [[1, 3, 4], [2]]);
  assert.equal(d.groupEntries(entries, () => 'none', () => ({})).length, 4, 'built-in: every entry alone');
});

const CREATE = {
  user: 'NAME', board: 'Projekt Teilbereich C', list: 'To Do', swimlane: 'Social Network', card: 'TEst',
  cardId: 'c1', boardUrl: 'https://wekan.example/b/b1/projekt', cardUrl: 'https://wekan.example/b/b1/projekt/c1',
  url: 'https://wekan.example/b/b1/projekt/c1',
};

test('content: the reporter\'s clearly arranged item, with the swimlane left out', () => {
  const parts = d.ITEM_PARTS.filter(p => p !== 'swimlane' && p !== 'link');
  const item = d.renderNotificationItem({ description: 'act-createCard', params: CREATE, parts, translate });
  assert.equal(item.text, '[Projekt Teilbereich C]: NAME created card "TEst" to list "To Do"');
  assert.equal(item.html, '<div class="wekan-notification-item"><b><a href="https://wekan.example/b/b1/projekt">Projekt Teilbereich C</a></b>: '
    + '<b>NAME</b> created card <b><a href="https://wekan.example/b/b1/projekt/c1">&quot;TEst&quot;</a></b> to list <b>&quot;To Do&quot;</b></div>');
  const comment = d.renderNotificationItem({ description: 'act-addComment',
    params: { ...CREATE, card: 'Toollandkarte ergänzen', comment: 'Test kommentar bitte ignorieren' }, parts, translate });
  assert.equal(comment.text, '[Projekt Teilbereich C]: NAME commented on card "Toollandkarte ergänzen": "Test kommentar bitte ignorieren" at list "To Do"');
  const noDetails = d.renderNotificationItem({ description: 'act-addComment', params: { ...CREATE, comment: 'secret' },
    parts: ['board', 'actor', 'card'], translate });
  assert.equal(noDetails.text, '[Projekt Teilbereich C]: NAME commented on card "TEst"');
  const withLink = d.renderNotificationItem({ description: 'act-createCard', params: CREATE, parts: d.ITEM_PARTS, translate });
  assert.equal(withLink.text, '[Projekt Teilbereich C]: NAME created card "TEst" to list "To Do" at swimlane "Social Network"\nhttps://wekan.example/b/b1/projekt/c1');
});

test('content: a clause is only dropped where the sentence stays a sentence', () => {
  // "[__board__]" is not a short connector: the value stays.
  const due = d.renderNotificationItem({ description: 'act-newDue', params: CREATE, parts: ['card'], translate });
  assert.match(due.text, /^"To Do"\/"TEst" has 1st due reminder \["Projekt Teilbereich C"\]$/);
  // The first value of a sentence is never removed.
  const list = d.renderNotificationItem({ description: 'act-createList', params: CREATE, parts: [], translate });
  assert.equal(list.text, 'added list "To Do"');
});

test('negative: user content is escaped and only http(s) links are made', () => {
  const evil = { ...CREATE, user: '<img src=x onerror=alert(1)>', board: '<script>alert(1)</script>', card: '"><svg onload=alert(1)>',
    boardUrl: 'javascript:alert(1)', cardUrl: 'https://wekan.example/"onmouseover="x', url: 'data:text/html,x' };
  const item = d.renderNotificationItem({ description: 'act-createCard', params: evil, parts: d.ITEM_PARTS, translate });
  // No markup of their own: every < of user text is &lt;, and no href is
  // anything but http(s).
  assert.doesNotMatch(item.html, /<script|<img|<svg|href="javascript:|href="data:|" ?onmouseover=/);
  assert.deepEqual([...item.html.matchAll(/<([a-z]+)/g)].map(m => m[1]).filter(t => !['div', 'b', 'a', 'br'].includes(t)), []);
  assert.match(item.html, /&lt;script&gt;/);
  assert.match(item.html, /href="https:\/\/wekan\.example\/%22onmouseover=%22x"/, 'a quote in a URL is percent-encoded');
});

test('negative: an admin-only custom field value never reaches a recipient who is not a board admin', () => {
  const params = { customField: 'Salary', customFieldValue: 5000, value: 5000, oldValue: 4000, customFieldAdminOnly: true };
  const member = d.redactForRecipient(params, { isBoardAdmin: false });
  assert.equal(member.customFieldValue, ''); assert.equal(member.value, ''); assert.equal(member.oldValue, '');
  assert.equal(Object.hasOwn(member, 'customFieldAdminOnly'), false);
  assert.equal(d.redactForRecipient(params, { isBoardAdmin: true }).customFieldValue, 5000);
  assert.equal(d.redactForRecipient({ ...params, customFieldAdminOnly: false }).customFieldValue, 5000);
  const item = d.renderNotificationItem({ description: 'act-setCustomField', params: { ...CREATE, ...member },
    parts: d.ITEM_PARTS, translate });
  assert.doesNotMatch(item.text, /5000/);
});

test('webhook queueing: grouping waits the short window, a schedule its time', () => {
  const at = new Date('2026-10-10T10:07:00Z');
  const grouped = d.webhookQueueTarget(d.resolveChannelSettings('webhook', [['i', { grouping: 'board' }]]), { boardId: 'b', eventId: 'e' }, at);
  assert.deepEqual(grouped, { eventId: 'e', groupKey: 'board:b', deliverAt: at.getTime() + d.WEBHOOK_GROUP_WINDOW_MS });
  const hourly = d.webhookQueueTarget(d.resolveChannelSettings('webhook', [['i', { schedule: 'interval', intervalMinutes: 60, timezone: 'UTC' }]]), { eventId: 'e' }, at);
  assert.equal(hourly.groupKey, 'single:e'); assert.equal(new Date(hourly.deliverAt).toISOString(), '2026-10-10T11:00:00.000Z');
});

test('the schema mirrors the validator, so a direct document write cannot store junk either', () => {
  const fields = d.deliverySchemaFields('notificationDelivery');
  assert.deepEqual(fields['notificationDelivery.email.grouping'].allowedValues, [...d.GROUPINGS.email]);
  assert.deepEqual(fields['notificationDelivery.tray.parts.$'].allowedValues, [...d.ITEM_PARTS]);
  assert.deepEqual(fields['notificationDelivery.webhook.intervalMinutes'].allowedValues, [...d.INTERVAL_MINUTES]);
  assert.ok(fields['notificationDelivery.email.dailyTime'].regEx.test('08:00'));
  assert.equal(fields['notificationDelivery.email.text'], undefined);
  const member = d.deliverySchemaFields('profile.notificationDelivery', d.MEMBER_CHANNELS);
  assert.equal(member['profile.notificationDelivery.webhook'], undefined);
});

test('wiring: e-mail, tray and webhooks read the shared model', () => {
  const email = read('server/notifications/email.js');
  assert.match(email, /resolveChannelSettings\('email', \[\s*\['member', memberDelivery\],\s*\['board'/);
  assert.match(email, /params = redactForRecipient\(params, \{ isBoardAdmin \}\);/);
  assert.match(email, /if \(clear\) job\.text = clear\.text;/);
  const outbox = read('server/lib/emailOutbox.js');
  assert.match(outbox, /if \(batchKey === undefined\) batchKey = key;\s*else if \(key !== batchKey\) continue;/);
  const tray = read('server/notifications/trayQueue.js');
  assert.match(tray, /resolveChannelSettings\('tray'/);
  assert.match(tray, /trayReceipts\.deliver\(userId, activityId, showAt === undefined \? \{\} : \{ showAt \}\)/);
  assert.match(read('client/components/notifications/notifications.js'), /!v\.read && trayEntryVisible\(v\)/);
  const outgoing = read('server/notifications/outgoing.js');
  assert.match(outgoing, /resolveChannelSettings\('webhook'/);
  assert.match(outgoing, /if \(!is2way\) \{\s*const delivery = await webhookDeliveryFor\(storedIntegration\);/);
  assert.match(read('server/imports.js'), /import '\/server\/notifications\/webhookQueue';/);
});

test('docs describe the three settings places and every channel', () => {
  const doc = read('docs/Features/Notifications/Notification-Delivery.md');
  for (const word of ['Admin Panel', 'Member Settings', 'Board Settings', 'quiet hours', 'EMAIL_NOTIFICATION_TIMEOUT', 'act-batch']) {
    assert.ok(doc.includes(word), word);
  }
  for (const part of d.ITEM_PARTS) assert.ok(doc.includes(`\`${part}\``), part);
});
