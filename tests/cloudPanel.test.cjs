'use strict';

// models/lib/cloudPanel.js: the Cloud Panel's rules, as data.
// Run: node tests/cloudPanel.test.cjs

const assert = require('node:assert/strict');
const C = require('../models/lib/cloudPanel.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('settings: the Cloud Panel Domain and one SuperAdmin, by username or e-mail', () => {
  assert.deepEqual(C.normalizeCloudSettings({ domain: 'HTTPS://Cloud.Example.com:443/', superAdminUsername: ' Boss ' }),
    { domain: 'cloud.example.com', superAdminUsername: 'boss' });
  assert.deepEqual(C.normalizeCloudSettings({}), { domain: '', superAdminUsername: '' }, 'empty: the panel is off');
  assert.throws(() => C.normalizeCloudSettings({ domain: 'not a domain' }), /domain name/);
  assert.throws(() => C.normalizeCloudSettings({ adminUsernames: ['a'] }), /Unsupported/);
});

test('who: the SuperAdmin is an administrator whose username or e-mail is named; customers by their addresses', () => {
  const settings = { domain: 'cloud.example.com', superAdminUsername: 'boss@example.com' };
  const boss = { username: 'boss', isAdmin: true, emails: [{ address: 'Boss@Example.com' }] };
  assert.equal(C.isCloudAdmin(boss, settings), true);
  assert.equal(C.isCloudAdmin({ ...boss, isAdmin: false }, settings), false, 'negative: named, but not an administrator');
  assert.equal(C.isCloudAdmin({ ...boss, loginDisabled: true }, settings), false, 'negative: disabled');
  assert.equal(C.isCloudAdmin({ username: 'other', isAdmin: true }, settings), false, 'negative: another administrator');
  assert.equal(C.isCloudAdmin(boss, { domain: 'x.example.com', superAdminUsername: '' }), false, 'negative: nobody when empty');
  assert.equal(C.isCloudHost('Cloud.Example.com:443', settings), true);
  assert.equal(C.isCloudHost('customer1.example.com', settings), false, 'negative: a customer domain never shows the panel');
  assert.equal(C.isCloudHost('cloud.example.com', { domain: '' }), false, 'negative: no domain, no panel');
  const domains = [
    { _id: 'd1', customerEmail: 'anna@customer.fi' },
    { _id: 'd2', billingEmail: 'billing@customer.fi', customerUsernames: ['ben'] },
    { _id: 'd3', customerEmail: 'someone@else.fi' },
  ];
  const anna = { username: 'anna', emails: [{ address: 'ANNA@customer.fi' }, { address: 'billing@customer.fi' }] };
  assert.deepEqual(C.customerDomains(anna, domains).map(d => d._id), ['d1', 'd2']);
  assert.deepEqual(C.customerDomains({ username: 'ben' }, domains).map(d => d._id), ['d2']);
  assert.deepEqual(C.customerDomains({ username: 'eve', emails: [{ address: 'eve@x.fi' }] }, domains), [], 'negative: nobody else\'s');
});

test('domains: own database and container, or shared; dates and e-mail addresses checked', () => {
  const d = C.normalizeDomain({ domain: 'Customer1.WeKan.team', customerName: 'Customer 1', customerEmail: 'A@B.fi', mode: 'own',
    upstream: 'wekan-customer1:8080', startDate: '2027-01-01', endDate: '2027-12-31',
    database: { host: 'mongodb', port: 27017, database: 'wekan_customer1', username: 'wekan', password: 'p@ss:w/rd' } });
  assert.equal(d.domain, 'customer1.wekan.team');
  assert.equal(d.customerEmail, 'a@b.fi');
  assert.equal(C.mongoUrlOf(d.database), 'mongodb://wekan:p%40ss%3Aw%2Frd@mongodb:27017/wekan_customer1?authSource=wekan_customer1');
  assert.equal(C.mongoUrlOf(C.normalizeDatabase({ host: 'db', database: 'w', replicaSet: 'rs0' })), 'mongodb://db:27017/w?replicaSet=rs0',
    'a database without a password');
  assert.equal(C.normalizeDomain({ domain: 'wekan.customer.com', mode: 'shared' }).upstream, '', 'a shared domain needs no container');
  assert.throws(() => C.normalizeDomain({ domain: 'a.example.com', mode: 'own' }), /upstream/);
  assert.throws(() => C.normalizeDomain({ domain: 'a.example.com', mode: 'both' }), /own database or shares/);
  assert.throws(() => C.normalizeDomain({ domain: 'a.example.com', mode: 'shared', startDate: '2027-02-01', endDate: '2027-01-01' }), /End Date/);
  assert.throws(() => C.normalizeDomain({ domain: 'a.example.com', mode: 'shared', customerEmail: 'nope' }), /e-mail/);
  assert.throws(() => C.normalizeDomain({ domain: 'a.example.com', mode: 'own', upstream: 'x:99999' }), /upstream/);
  assert.throws(() => C.normalizeDatabase({ uri: 'http://x' }), /mongodb:\/\//);
  assert.throws(() => C.normalizeDatabase({ host: 'db', database: 'a/b' }), /database has a name/);
  assert.equal(C.isActiveOn({ startDate: '2027-01-01', endDate: '2027-01-31' }, '2027-01-31'), true, 'both days included');
  assert.equal(C.isActiveOn({ startDate: '2027-01-01' }, '2026-12-31'), false);
});

test('negative: a password is never shown, and an edit without one keeps the stored one', () => {
  const stored = { domain: 'a.example.com', mode: 'own', upstream: 'a:8080', database: { host: 'db', port: 27017, database: 'a', username: 'u', password: 'secret' } };
  const shown = C.redactDomain(stored);
  assert.equal(JSON.stringify(shown).includes('secret'), false);
  assert.equal(shown.database.hasPassword, true);
  const edited = C.normalizeDomain({ domain: 'a.example.com', mode: 'own', upstream: 'a:8080',
    database: { host: 'db', database: 'a', username: 'u' } }, stored);
  assert.equal(edited.database.password, 'secret');
  const other = C.normalizeDomain({ domain: 'a.example.com', mode: 'own', upstream: 'a:8080',
    database: { host: 'db', database: 'a', username: 'someone-else' } }, stored);
  assert.equal(other.database.password, undefined, 'another username does not inherit the password');
  const uri = C.redactDatabase({ uri: 'mongodb://u:secret@db:27017/a' });
  assert.equal(uri.uri, 'mongodb://u:****@db:27017/a');
  assert.equal(uri.hasPassword, true);
});

test('Caddy: the panel and shared domains to this WeKan, own domains to their containers, only within their dates', () => {
  const text = C.caddyfile([
    { domain: 'b.example.com', mode: 'own', upstream: 'wekan-b:8080' },
    { domain: 'a.example.com', mode: 'shared' },
    { domain: 'old.example.com', mode: 'own', upstream: 'old:8080', endDate: '2026-12-31' },
  ], { settings: { domain: 'cloud.example.com' }, caddy: { sharedUpstream: 'wekan:3000', email: 'ops@example.com' } }, '2027-01-01');
  assert.equal(text, '{\n\temail ops@example.com\n}\n\ncloud.example.com {\n\treverse_proxy wekan:3000\n}\n\n'
    + 'a.example.com {\n\treverse_proxy wekan:3000\n}\n\nb.example.com {\n\treverse_proxy wekan-b:8080\n}\n');
  assert.throws(() => C.normalizeCaddy({ adminUrl: 'javascript:alert(1)' }), /http\(s\)/);
});

test('CloudFlare: what to create and update; a record of another kind is never replaced', () => {
  const plan = C.dnsPlan([{ domain: 'a.example.com' }, { domain: 'b.example.com' }, { domain: 'c.example.com' },
    { domain: 'skip.example.com', cloudflare: false }], [
    { id: '1', type: 'A', name: 'a.example.com', content: '198.51.100.1', proxied: true },
    { id: '2', type: 'CNAME', name: 'b.example.com', content: 'elsewhere.example.net' },
    { id: '3', type: 'MX', name: 'c.example.com', content: 'mail.example.com' },
    { id: '4', type: 'A', name: 'cloud.example.com', content: '203.0.113.10', proxied: true },
  ], { settings: { domain: 'cloud.example.com' }, cloudflare: { target: '203.0.113.10', proxied: true } });
  assert.deepEqual(plan.update.map(r => [r.id, r.name, r.content]), [['1', 'a.example.com', '203.0.113.10']]);
  assert.deepEqual(plan.create.map(r => [r.type, r.name]), [['A', 'c.example.com']], 'an MX is not in the way of an A');
  assert.deepEqual(plan.conflicts, [{ name: 'b.example.com', type: 'CNAME', content: 'elsewhere.example.net' }]);
  assert.deepEqual(plan.unchanged, ['cloud.example.com']);
  assert.equal(C.dnsPlan([{ domain: 'a.example.com' }], [], { cloudflare: { target: 'cloud.example.com' } }).create[0].type, 'CNAME');
  assert.throws(() => C.normalizeCloudflare({ zoneId: 'xyz' }), /32 hexadecimal/);
  assert.throws(() => C.dnsPlan([], [], { cloudflare: {} }), /target/);
});

test('import: accounts are matched by e-mail address, others created under a free username, ids remapped everywhere', () => {
  const plan = C.accountPlan([
    { _id: 'srcAnna', username: 'anna', emails: [{ address: 'Anna@Customer.fi' }] },
    { _id: 'srcBen', username: 'ben', emails: [{ address: 'ben@customer.fi' }] },
    { _id: 'srcCid', username: 'cid', emails: [{ address: 'cid@customer.fi' }] },
  ], [
    { _id: 'hereAnna', username: 'anna.k', emails: [{ address: 'anna@customer.fi' }] },
    { _id: 'srcCid', username: 'someone', emails: [{ address: 'someone@x.fi' }] },
    { _id: 'hereBen', username: 'ben', emails: [{ address: 'ben@other.fi' }] },
  ]);
  assert.equal(plan.map.srcAnna, 'hereAnna', 'the same address is the same person');
  assert.deepEqual(plan.create.map(c => [c.sourceId, c.username, c.keepId]), [['srcBen', 'ben2', true], ['srcCid', 'cid', false]],
    'a taken username gets a number; a taken id gets a new one');
  const card = { _id: 'c1', userId: 'srcAnna', members: ['srcAnna', 'srcBen'], nested: { by: 'srcAnna', at: new Date(0) },
    title: 'srcAnna is not a field value here', boardId: 'b1' };
  const out = C.remapIds(card, { srcAnna: 'hereAnna' });
  assert.equal(out.userId, 'hereAnna');
  assert.deepEqual(out.members, ['hereAnna', 'srcBen']);
  assert.equal(out.nested.by, 'hereAnna');
  assert.ok(out.nested.at instanceof Date);
  assert.equal(out.title, card.title, 'only a whole value that IS an id');
  assert.ok(C.IMPORT_COLLECTIONS.includes('cards') && !C.IMPORT_COLLECTIONS.includes('users') && !C.IMPORT_COLLECTIONS.includes('settings'),
    'negative: accounts are matched, never copied whole; settings stay this instance\'s');
});

test('invoices and chat: validated; imported chats keep their rooms and authors', () => {
  const i = C.normalizeCloudInvoice({ number: '2026-17', issueDate: '2026-05-01', amount: 49.9, currency: 'eur', status: 'paid', paidDate: '2026-05-10' });
  assert.equal(i.amountMinor, 4990);
  assert.equal(i.currency, 'EUR');
  assert.throws(() => C.normalizeCloudInvoice({ number: 'x', issueDate: '2026-05-01', amount: 1, currency: 'EUR', status: 'paid' }), /day it was paid/);
  assert.throws(() => C.normalizeCloudInvoice({ number: 'x', issueDate: '2026-05-01', amount: 1, currency: 'EUR', link: 'javascript:alert(1)' }), /https/);
  assert.throws(() => C.normalizeChatMessage({ text: '   ' }), /has text/);
  const messages = C.importedChatMessages({ tasks: [{ title: '#general', comments: [
    { text: 'Hello', authorName: 'Anna', date: '2024-01-02T03:04:05Z' }, { text: '', authorName: 'x' }] }] }, 'rocketchat');
  assert.deepEqual(messages.map(m => [m.room, m.authorName, m.text, m.source, m.at.toISOString()]),
    [['#general', 'Anna', 'Hello', 'rocketchat', '2024-01-02T03:04:05.000Z']]);
});

console.log(`\ncloudPanel: ${passed} tests passed`);
