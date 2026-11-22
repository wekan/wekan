'use strict';

// models/lib/cloudPanel.js: the Cloud Panel's rules, as data.
// Run: node tests/cloudPanel.test.cjs

const assert = require('node:assert/strict');
const C = require('../models/lib/cloudPanel.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the gate: the Cloud Panel is the CLOUD environment variable, and nothing else', () => {
  assert.equal(C.cloudDomainFromEnv({ CLOUD: 'HTTPS://Cloud.Example.com:443/' }), 'cloud.example.com');
  assert.equal(C.cloudDomainFromEnv({ CLOUD: ' cloud.wekan.fi ' }), 'cloud.wekan.fi');
  assert.equal(C.cloudDomainFromEnv({}), '', 'negative: CLOUD unset, no panel');
  assert.equal(C.cloudDomainFromEnv({ CLOUD: '' }), '', 'negative: empty, no panel');
  assert.equal(C.cloudDomainFromEnv({ CLOUD: 'not a domain' }), '', 'negative: not a host name, no panel');
  assert.equal(C.cloudDomainFromEnv({ CLOUD: 'true' }), '', 'negative: a switch is not a domain');
  assert.equal(C.cloudDomainFromEnv({ CLOUD: '1' }), '', 'negative: nor is a number');
  assert.equal(C.cloudDomainFromEnv({ CLOUD: 'localhost' }), 'localhost', 'one label is a host: a test server, a private network');
  assert.equal(C.cloudDomainFromEnv({ CLOUD: 'cloud.example.com; rm -rf /' }), '', 'negative: nothing but a host');
  assert.equal(C.cloudDomainFromEnv(undefined), '');
  assert.equal(C.isCloudHost('Cloud.Example.com:443', 'cloud.example.com'), true);
  assert.equal(C.isCloudHost('customer1.example.com', 'cloud.example.com'), false, 'negative: a customer domain never shows the panel');
  assert.equal(C.isCloudHost('cloud.example.com', ''), false, 'negative: no CLOUD, no panel');
  // What an earlier version kept in the database, set from the browser:
  // nothing reads it now, and handed in anyway it is no panel.
  assert.equal(C.isCloudHost('cloud.example.com', { domain: 'cloud.example.com', superAdminUsername: 'boss' }), false,
    'negative: a domain stored in the database has no effect');
  assert.equal(C.normalizeCloudSettings, undefined, 'negative: the domain can no longer be normalized for saving');
});

test('who: the Cloud Admins are this container\'s site administrators; customers by their addresses', () => {
  const boss = { _id: 'boss', username: 'boss', isAdmin: true, emails: [{ address: 'Boss@Example.com' }] };
  assert.equal(C.isCloudAdmin(boss, 'cloud.example.com'), true, 'the first registered user is an administrator, so a Cloud Admin');
  assert.equal(C.isCloudAdmin({ username: 'other', isAdmin: true }, 'cloud.example.com'), true, 'every administrator, no SuperAdmin name');
  assert.equal(C.isCloudAdmin({ ...boss, isAdmin: false }, 'cloud.example.com'), false, 'negative: not an administrator');
  assert.equal(C.isCloudAdmin({ ...boss, loginDisabled: true }, 'cloud.example.com'), false, 'negative: disabled');
  assert.equal(C.isCloudAdmin(boss, ''), false, 'negative: no CLOUD, no Cloud Admin');
  assert.equal(C.isCloudAdmin(boss, { domain: 'cloud.example.com' }), false, 'negative: a stored domain makes nobody a Cloud Admin');
  const shadow = { _id: 's', username: 'anna-c1.example.com', isAdmin: true,
    services: { cloudCustomer: { domainId: 'd1', username: 'anna', emails: ['anna@customer.fi'] } } };
  assert.equal(C.isCloudAdmin(shadow, 'cloud.example.com'), false, 'negative: a customer\'s account is never a Cloud Admin');
  assert.equal(C.isCloudCustomer(shadow), true);
  assert.equal(C.isCloudCustomer(boss), false);
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

test('negative: a customer who signed in with their own WeKan\'s password sees exactly their own domain', () => {
  const domains = [
    { _id: 'd1', customerUsernames: ['anna'] },
    { _id: 'd2', customerUsernames: ['anna'], customerEmail: 'anna@customer.fi' },
    { _id: 'd3', customerEmail: 'anna@customer.fi' },
  ];
  const shadow = { username: 'anna', emails: [{ address: 'anna@customer.fi' }],
    services: { cloudCustomer: { domainId: 'd1', username: 'anna', emails: ['anna@customer.fi'] } } };
  assert.deepEqual(C.customerDomains(shadow, domains).map(d => d._id), ['d1'], 'never matched by name to another domain');
  assert.deepEqual(C.customerDomains(shadow, [{ _id: 'd1', customerUsernames: ['ben'] }]), [],
    'and not even its own once that domain no longer lists them');
  const byEmail = { services: { cloudCustomer: { domainId: 'd3', username: 'a', emails: ['anna@customer.fi'] } } };
  assert.deepEqual(C.customerDomains(byEmail, domains).map(d => d._id), ['d3']);
});

test('the customer login: only at the CLOUD address, only for a listed name, never for an account of the panel\'s own', () => {
  const own = { _id: 'd1', domain: 'customer1.example.com', mode: 'own', database: { host: 'db', database: 'c1' }, customerUsernames: ['anna'],
    customerEmail: 'anna@customer1.fi' };
  const shared = { _id: 'd2', domain: 'customer2.example.com', mode: 'shared', customerUsernames: ['bob'] };
  const noDb = { _id: 'd3', domain: 'customer3.example.com', mode: 'own', customerUsernames: ['cid'] };
  const base = { cloudDomain: 'cloud.example.com', host: 'cloud.example.com', localUser: null, domains: [own, shared, noDb] };
  assert.deepEqual(C.customerLoginPlan({ ...base, userQuery: { username: 'Anna' } }),
    { handle: true, domain: own, name: 'anna', byEmail: false });
  assert.equal(C.customerLoginPlan({ ...base, userQuery: { email: 'anna@customer1.fi' } }).byEmail, true);
  assert.equal(C.customerLoginPlan({ ...base, cloudDomain: '', userQuery: { username: 'anna' } }).handle, false, 'negative: no CLOUD');
  assert.equal(C.customerLoginPlan({ ...base, host: 'customer1.example.com', userQuery: { username: 'anna' } }).handle, false,
    'negative: only at the panel\'s address');
  assert.equal(C.customerLoginPlan({ ...base, userQuery: { username: 'eve' } }).reason, 'unlisted',
    'negative: a name no domain lists is looked up nowhere');
  assert.equal(C.customerLoginPlan({ ...base, userQuery: { username: 'bob' } }).handle, false, 'negative: a shared domain has no database to ask');
  assert.equal(C.customerLoginPlan({ ...base, userQuery: { username: 'cid' } }).handle, false, 'negative: nor one without a database');
  assert.equal(C.customerLoginPlan({ ...base, userQuery: { id: 'x' } }).handle, false);
  assert.equal(C.customerLoginPlan({ ...base, localUser: { _id: 'boss', isAdmin: true }, userQuery: { username: 'anna' } }).reason,
    'local-account', 'negative: an account here signs in with its own password, never a customer database\'s');
  assert.equal(C.customerLoginPlan({ ...base, localUser: { _id: 's', services: { cloudCustomer: { domainId: 'd1' } } },
    userQuery: { username: 'anna' } }).handle, true, 'a customer\'s own account here is asked again');
  const twice = { ...own, _id: 'd4', domain: 'customer4.example.com' };
  assert.deepEqual(C.customerLoginPlan({ ...base, domains: [own, twice], userQuery: { username: 'anna' } }), { handle: true, refuse: 'ambiguous' },
    'negative: two domains listing one name are not guessed between');
  // username_customerdomain picks the domain, and asks it for the username alone.
  assert.deepEqual(C.customerLoginPlan({ ...base, domains: [own, twice], userQuery: { username: 'anna_customer4.example.com' } }),
    { handle: true, domain: twice, name: 'anna', byEmail: false });
  assert.deepEqual(C.customerLoginPlan({ ...base, domains: [own, twice], userQuery: { username: 'Anna_Customer1.example.com' } }).domain, own);
  assert.deepEqual(C.qualifiedLoginName('john_doe_c.fi'), { name: 'john_doe', domain: 'c.fi' }, 'the LAST underscore separates');
  assert.equal(C.qualifiedLoginName('anna_nodot'), null, 'a suffix that is no domain is part of the name');
  assert.equal(C.customerLoginPlan({ ...base, domains: [own, twice], userQuery: { username: 'anna_customer9.example.com' } }).reason, 'unlisted',
    'negative: a domain that does not list the username is not asked');
  assert.equal(C.customerLoginPlan({ ...base, userQuery: { username: 'anna_customer2.example.com' } }).handle, false,
    'negative: nor a shared domain, which has no database');
});

test('the customer\'s account in their own database: one, enabled, with a password', () => {
  const ok = { _id: 'u', username: 'anna', services: { password: { bcrypt: '$2b$10$x' } } };
  assert.equal(C.foreignAccountDecision([ok]).ok, true);
  assert.equal(C.foreignAccountDecision([{ ...ok, services: { password: { argon2: '$argon2id$v=19$m=1,t=1,p=1$x' } } }]).ok, true);
  assert.equal(C.foreignAccountDecision([]).reason, 'not-found', 'negative: not there');
  assert.equal(C.foreignAccountDecision([ok, { ...ok, _id: 'v' }]).reason, 'ambiguous', 'negative: two of them');
  assert.equal(C.foreignAccountDecision([{ ...ok, loginDisabled: true }]).reason, 'disabled', 'negative: disabled in their own WeKan');
  assert.equal(C.foreignAccountDecision([{ ...ok, services: {} }]).reason, 'no-password', 'negative: no password there (LDAP, OAuth)');
  // username_customerdomain: the same username at another domain is another name.
  assert.equal(C.shadowUsername('Anna K', 'customer1.example.com'), 'anna-k_customer1.example.com');
  assert.equal(C.shadowUsername('john_doe', 'c.fi'), 'john-doe_c.fi', 'an underscore of the username never looks like the separator');
});

test('the support board: Cloud Admins its board admins, customers Comment only - never more', () => {
  const members = C.supportMembers(['boss', 'admin2'], ['anna', 'boss']);
  assert.deepEqual(members.map(m => [m.userId, m.isAdmin, m.isCommentOnly]), [['boss', true, false], ['admin2', true, false], ['anna', false, true]]);
  const { memberRoleOf, roleCan } = require('../models/lib/boardRoleCapabilities.js');
  const anna = members.find(m => m.userId === 'anna');
  assert.equal(memberRoleOf(anna), 'comment-only');
  assert.equal(roleCan('comment-only', 'comment'), true, 'a customer writes in the chat and comments');
  for (const cap of ['write', 'moveCard', 'manageBoard']) {
    assert.equal(roleCan(memberRoleOf(anna), cap), false, `negative: a customer may not ${cap} (archive, delete, move, administer)`);
  }
  assert.equal(memberRoleOf(members[0]), 'board-admin');
  assert.deepEqual(C.SUPPORT_LISTS.map(l => l.key), ['open', 'progress', 'done', 'chat']);
  assert.equal(C.supportBoardTitle('customer1.example.com'), 'Support: customer1.example.com');
  assert.deepEqual(C.normalizeTicket({ title: ' Down ', description: 'since 9' }), { title: 'Down', description: 'since 9' });
  assert.throws(() => C.normalizeTicket({ title: '' }), /title/);
  assert.throws(() => C.normalizeTicket({ title: 'x', listId: 'elsewhere' }), /Unsupported/, 'negative: a ticket names no list');
});

test('no REST API at the CLOUD address without a login; every other host unchanged', () => {
  const at = (url, signedIn, host = 'cloud.example.com', cloudDomain = 'cloud.example.com') => C.cloudRestDecision({ cloudDomain, host, url, signedIn });
  assert.equal(at('/users/login', false), 'refuse');
  assert.equal(at('/users/login', true), 'refuse', 'not even with a token: it is a way of getting one');
  assert.equal(at('/users/register', false), 'refuse');
  assert.equal(at('/USERS/Login/', false), 'refuse');
  assert.equal(at('/api/boards', false), 'refuse');
  assert.equal(at('/%61pi/boards', false), 'refuse', 'decoded, as Express decodes it');
  assert.equal(at('//api/boards', false), 'refuse');
  assert.equal(at('/api/inbound-email', false), 'refuse', 'nor the email webhooks');
  assert.equal(at('/users/logout', false), 'refuse');
  assert.equal(at('/api/boards', true), 'pass', 'a Cloud Admin\'s own export still works');
  assert.equal(at('/b/x/y', false), 'pass', 'the page itself is not the REST API');
  assert.equal(at('/users/login', false, 'customer1.example.com'), 'pass', 'negative: another host is unchanged');
  assert.equal(at('/users/login', false, 'cloud.example.com', ''), 'pass', 'negative: a WeKan without CLOUD is unchanged');
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
  ], { cloudDomain: 'cloud.example.com', caddy: { sharedUpstream: 'wekan:3000', email: 'ops@example.com' } }, '2027-01-01');
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
  ], { cloudDomain: 'cloud.example.com', cloudflare: { target: '203.0.113.10', proxied: true } });
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
