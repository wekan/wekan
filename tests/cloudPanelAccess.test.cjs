'use strict';

// server/cloudPanel.js: the Cloud Panel answers only on its own domain, to
// its SuperAdmin - and to a customer, for their own invoices and chat. The
// real methods run in a sandbox with in-memory collections, a customer's
// in-memory WeKan database to import, and stubbed CloudFlare and Caddy.
// Run: node tests/cloudPanelAccess.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'server/cloudPanel.js'), 'utf8');

function get(doc, key) {
  return key.split('.').reduce((v, k) => {
    if (v === undefined || v === null) return undefined;
    if (Array.isArray(v) && !/^\d+$/.test(k)) return v.map(x => (x ? x[k] : undefined));
    return v[k];
  }, doc);
}
// A RegExp of the sandbox's realm is not an instanceof this realm's.
const isRegExp = x => Object.prototype.toString.call(x) === '[object RegExp]';
const isDate = x => Object.prototype.toString.call(x) === '[object Date]';
function one(value, cond) {
  if (isRegExp(cond)) return (Array.isArray(value) ? value : [value]).some(v => typeof v === 'string' && cond.test(v));
  if (cond && typeof cond === 'object' && !Array.isArray(cond) && !isDate(cond) && Object.keys(cond).some(k => k.startsWith('$'))) {
    return Object.entries(cond).every(([op, arg]) => {
      const values = Array.isArray(value) ? value : [value];
      switch (op) {
        case '$in': return values.some(v => arg.some(a => (isRegExp(a) ? typeof v === 'string' && a.test(v) : String(a) === String(v))));
        case '$ne': return !values.some(v => v === arg);
        case '$exists': return (value !== undefined) === arg;
        case '$lt': return value < arg;
        case '$regex': return values.some(v => typeof v === 'string' && new RegExp(arg, cond.$options || '').test(v));
        case '$options': return true;
        default: throw new Error(`op ${op}`);
      }
    });
  }
  return Array.isArray(value) ? value.flat().includes(cond) : value === cond;
}
function matches(doc, selector) {
  return Object.entries(selector || {}).every(([key, cond]) => {
    if (key === '$or') return cond.some(s => matches(doc, s));
    return one(get(doc, key), cond);
  });
}
let nextId = 1;
class Collection {
  constructor(docs = []) { this.docs = docs.map(d => ({ ...d })); }
  find(selector = {}, options = {}) {
    const sel = typeof selector === 'string' ? { _id: selector } : selector;
    const self = this;
    const all = () => {
      let out = self.docs.filter(d => matches(d, sel)).map(d => structuredClone(d));
      const sort = options.sort && Object.entries(options.sort)[0];
      if (sort) out.sort((a, b) => (a[sort[0]] > b[sort[0]] ? 1 : -1) * sort[1]);
      if (options.skip) out = out.slice(options.skip);
      if (options.limit) out = out.slice(0, options.limit);
      return out;
    };
    return { async fetchAsync() { return all(); }, async countAsync() { return self.docs.filter(d => matches(d, sel)).length; } };
  }
  async findOneAsync(selector) { return (await this.find(selector).fetchAsync())[0]; }
  async insertAsync(doc) { const _id = doc._id || `id${nextId++}`; this.docs.push({ ...structuredClone(doc), _id }); return _id; }
  async updateAsync(selector, modifier) {
    const sel = typeof selector === 'string' ? { _id: selector } : selector;
    for (const d of this.docs.filter(x => matches(x, sel))) {
      Object.assign(d, structuredClone(modifier.$set || {}));
      for (const k of Object.keys(modifier.$unset || {})) delete d[k];
      for (const [k, v] of Object.entries(modifier.$push || {})) d[k] = [...(d[k] || []), v];
    }
  }
  async upsertAsync(selector, modifier) {
    const sel = typeof selector === 'string' ? { _id: selector } : selector;
    if (!this.docs.some(d => matches(d, sel))) this.docs.push({ ...sel });
    return this.updateAsync(sel, modifier);
  }
  async removeAsync(selector) {
    const sel = typeof selector === 'string' ? { _id: selector } : selector;
    this.docs = this.docs.filter(d => !matches(d, sel));
  }
  rawCollection() {
    const self = this;
    return {
      async insertOne(doc) { self.docs.push(structuredClone(doc)); },
      async insertMany(docs) { for (const doc of docs) self.docs.push(structuredClone(doc)); },
    };
  }
}

// A database as the mongodb driver shows one: what both this WeKan's own
// database and a customer's look like to the import.
function fakeDb(name, collections) {
  return {
    databaseName: name,
    collections,
    listCollections() { return { toArray: async () => Object.keys(collections).map(n => ({ name: n })) }; },
    collection(n) {
      collections[n] = collections[n] || [];
      return {
        find(selector = {}) {
          const docs = () => collections[n].filter(d => matches(d, selector)).map(d => structuredClone(d));
          return {
            toArray: async () => docs(),
            async *[Symbol.asyncIterator]() { for (const d of docs()) yield d; },
          };
        },
        async estimatedDocumentCount() { return collections[n].length; },
        async insertMany(list) { for (const d of list) collections[n].push(structuredClone(d)); },
      };
    },
  };
}

async function load({ host = 'cloud.example.com' } = {}) {
  const tenants = await import('../models/lib/tenants.js');
  const methods = {};
  class MeteorError extends Error { constructor(error, reason) { super(reason || error); this.error = error; this.reason = reason; } }
  const users = new Collection([
    { _id: 'boss', username: 'boss', isAdmin: true, emails: [{ address: 'boss@example.com' }] },
    { _id: 'admin2', username: 'admin2', isAdmin: true },
    { _id: 'anna', username: 'anna', emails: [{ address: 'anna@customer1.fi' }] },
    { _id: 'eve', username: 'eve', emails: [{ address: 'eve@evil.example' }] },
  ]);
  const own = fakeDb('wekan', { boards: [], cards: [], lists: [] });
  // The customer's own WeKan: two people, one of them already here as anna.
  const source = fakeDb('wekan_customer1', {
    users: [
      { _id: 'srcAnna', username: 'anna', emails: [{ address: 'Anna@Customer1.fi' }], services: { password: { bcrypt: 'x' }, resume: { loginTokens: ['t'] } } },
      { _id: 'srcBob', username: 'bob', emails: [{ address: 'bob@customer1.fi' }], isAdmin: true, services: { password: { bcrypt: 'y' } } },
    ],
    boards: [{ _id: 'B1', title: 'Customer board', members: [{ userId: 'srcAnna', isAdmin: true }, { userId: 'srcBob' }] }],
    lists: [{ _id: 'L1', boardId: 'B1', title: 'Todo' }],
    cards: [{ _id: 'C1', boardId: 'B1', listId: 'L1', userId: 'srcBob', assignees: ['srcAnna'], title: 'Work' }],
    settings: [{ _id: 's', productName: 'Their WeKan' }],
  });
  const C = {
    CloudSettings: new Collection(), CloudDomains: new Collection(), CloudInvoices: new Collection(), CloudChatMessages: new Collection(),
  };
  const org = new Collection();
  const calls = [];
  users.rawCollection = () => ({ async insertOne(doc) { users.docs.push(structuredClone(doc)); } });
  const sandbox = {
    Meteor: { methods: m => Object.assign(methods, m), Error: MeteorError, users, startup() {}, absoluteUrl: () => 'https://wekan.example.com/' },
    check() {}, Match: { Optional: x => x, OneOf: (...x) => x, Integer: Number },
    DDPRateLimiter: { addRule() {} },
    Random: { id: () => `new${nextId++}` },
    MongoInternals: { defaultRemoteCollectionDriver: () => ({ mongo: { db: own } }) },
    Org: org, ...C, tenants, TABLE_PAGE_ROWS_PER_PAGE: 10,
    fetch: async (url, options = {}) => {
      calls.push({ url, method: options.method || 'GET', body: options.body });
      if (new URL(url).hostname === 'api.cloudflare.com' && (options.method || 'GET') === 'GET') {
        return { ok: true, status: 200, json: async () => ({ success: true, result: [{ id: 'r1', type: 'A', name: 'customer1.example.com', content: '198.51.100.9', proxied: true }] }) };
      }
      return { ok: true, status: 200, json: async () => ({ success: true, result: {} }), text: async () => '' };
    },
    AbortSignal, process: { env: {} },
    require: rel => {
      if (rel === 'mongodb') {
        return { MongoClient: class { constructor(url) { this.url = url; } async connect() { if (!this.url.includes('customer1')) throw new Error('unreachable'); }
          db() { return source; } async close() {} } };
      }
      return rel.startsWith('/') ? require(path.join(ROOT, rel.slice(1))) : require(rel);
    },
    console,
  };
  const code = SOURCE.replace(/^import[\s\S]*?from '[^']+';$/gm, '');
  vm.runInNewContext(code, sandbox, { filename: 'server/cloudPanel.js' });
  const as = (userId, onHost = host) => new Proxy({}, { get: (_, name) => async (...args) => {
    const result = await methods[name].apply({ userId, connection: { httpHeaders: { host: onHost } } }, args);
    return result === undefined ? undefined : structuredClone(result);
  } });
  return { as, C, users, org, own, source, calls, methods };
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

async function configured() {
  const world = await load();
  await world.as('admin2', 'wekan.example.com').cloudPanelSetSettings({ domain: 'cloud.example.com', superAdminUsername: 'boss@example.com' });
  return world;
}

test('a site admin names the Cloud Panel Domain and the SuperAdmin; the SuperAdmin must be an administrator', async () => {
  const { as } = await load();
  await assert.rejects(as('anna').cloudPanelSetSettings({ domain: 'cloud.example.com', superAdminUsername: 'boss' }), /not do that/);
  await assert.rejects(as('admin2').cloudPanelSetSettings({ domain: 'cloud.example.com', superAdminUsername: 'anna' }), /not an administrator/);
  await assert.rejects(as('admin2').cloudPanelSetSettings({ domain: 'cloud.example.com', superAdminUsername: 'nobody' }), /No user/);
  const s = await as('admin2', 'anything.example.com').cloudPanelSetSettings({ domain: 'Cloud.Example.com', superAdminUsername: 'BOSS' });
  assert.deepEqual(s, { domain: 'cloud.example.com', superAdminUsername: 'boss' });
  assert.deepEqual(await as('admin2').cloudPanelGetSettings(), s);
});

test('negative: the panel answers only on its own domain, and only to the SuperAdmin', async () => {
  const { as, methods } = await configured();
  assert.equal((await as('boss', 'customer1.example.com').cloudPanelWhoAmI()).onCloudHost, false);
  assert.equal((await as('boss').cloudPanelWhoAmI()).isCloudAdmin, true);
  const adminOnly = ['cloudPanelConfig', 'cloudPanelSetCloudflare', 'cloudPanelSetCaddy', 'cloudPanelDomainsCount', 'cloudPanelDomainsPage',
    'cloudPanelDomain', 'cloudPanelSaveDomain', 'cloudPanelRemoveDomain', 'cloudPanelTestDatabase', 'cloudPanelImportDomain',
    'cloudPanelCaddyfile', 'cloudPanelPushCaddy', 'cloudPanelDnsPlan', 'cloudPanelDnsApply', 'cloudPanelSaveInvoice',
    'cloudPanelRemoveInvoice', 'cloudPanelImportChat'];
  for (const name of adminOnly) {
    await assert.rejects(as('boss', 'customer1.example.com')[name]({}), /not do that/, `${name} on another host`);
    await assert.rejects(as('admin2')[name]({}), /not do that/, `${name} by another administrator`);
    await assert.rejects(as('anna')[name]({}), /not do that/, `${name} by a customer`);
    await assert.rejects(as(null)[name]({}), /not do that/, `${name} signed out`);
  }
  // Every method of the file is either the Admin Panel's, the who-am-I, or
  // guarded by onPanel / cloudAdmin / readableDomain.
  const bodies = SOURCE.split(/\n  async cloudPanel/).slice(1);
  assert.equal(bodies.length, Object.keys(methods).length);
  for (const body of bodies) {
    const head = body.slice(0, body.indexOf('\n  },'));
    if (/^(GetSettings|SetSettings)\(/.test(body)) assert.match(head, /siteAdmin\(this\.userId\)/);
    else if (!/^WhoAmI\(/.test(body)) assert.match(head, /await (cloudAdmin|onPanel|readableDomain)\(this/, body.slice(0, 40));
  }
});

test('domains: saved, paged, the password kept and never shown; a shared domain is an Organization claiming it', async () => {
  const { as, C, org } = await configured();
  const id = await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', customerName: 'Customer 1', mode: 'own',
    customerEmail: 'anna@customer1.fi', upstream: 'wekan-c1:8080',
    database: { host: 'mongodb', database: 'wekan_customer1', username: 'w', password: 'secret' } });
  await as('boss').cloudPanelSaveDomain(null, { domain: 'wekan.customer.com', mode: 'shared', customerName: 'Customer 2' });
  assert.equal(await as('boss').cloudPanelDomainsCount(''), 2);
  assert.equal(await as('boss').cloudPanelDomainsCount('customer 2'), 1);
  const rows = await as('boss').cloudPanelDomainsPage({ page: 1 });
  assert.deepEqual(rows.map(r => r.domain), ['customer1.example.com', 'wekan.customer.com']);
  assert.equal(JSON.stringify(rows).includes('secret'), false, 'negative: no password reaches the browser');
  await as('boss').cloudPanelSaveDomain(id, { domain: 'customer1.example.com', mode: 'own', upstream: 'wekan-c1:8080',
    customerEmail: 'anna@customer1.fi', database: { host: 'mongodb', database: 'wekan_customer1', username: 'w' } });
  assert.equal(C.CloudDomains.docs.find(d => d._id === id).database.password, 'secret', 'an empty password keeps the stored one');
  assert.equal(org.docs.length, 1);
  assert.equal(org.docs[0].orgDomains, 'wekan.customer.com');
  await assert.rejects(as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'shared' }), /already listed/);
  await assert.rejects(as('boss').cloudPanelSaveDomain(null, { domain: 'cloud.example.com', mode: 'shared' }), /own domain/);
  // TenantBleed: never this WeKan's own address, never another Organization's.
  await assert.rejects(as('boss').cloudPanelSaveDomain(null, { domain: 'wekan.example.com', mode: 'shared' }), /own address/);
  await org.insertAsync({ _id: 'theirs', orgDomains: 'taken.example.com' });
  await assert.rejects(as('boss').cloudPanelSaveDomain(null, { domain: 'taken.example.com', mode: 'shared' }), /Another Organization/);
  assert.equal(C.CloudDomains.docs.some(d => ['wekan.example.com', 'taken.example.com'].includes(d.domain)), false, 'and nothing is saved');
  const caddy = await as('boss').cloudPanelCaddyfile();
  assert.match(caddy, /customer1\.example\.com \{\n\treverse_proxy wekan-c1:8080\n\}/);
  assert.match(caddy, /wekan\.customer\.com \{\n\treverse_proxy wekan:8080\n\}/);
});

test('import: a customer\'s own database merges into this one, once, with accounts matched and nobody made an administrator', async () => {
  const { as, C, users, own, org } = await configured();
  const id = await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'own', upstream: 'wekan-c1:8080',
    database: { host: 'mongodb', database: 'wekan_customer1' } });
  assert.deepEqual(await as('boss').cloudPanelTestDatabase(id), { ok: true, collections: 5, users: 2, boards: 1, cards: 1 });
  const dry = await as('boss').cloudPanelImportDomain(id);
  assert.deepEqual(dry.users, { matched: 1, created: 1 });
  assert.equal(own.collections.boards.length, 0, 'a dry run by default: nothing written');
  const report = await as('boss').cloudPanelImportDomain(id, { dryRun: false });
  assert.equal(report.collections.cards.copied, 1);
  const card = own.collections.cards[0];
  assert.deepEqual(card.assignees, ['anna'], 'the source account is the account here with the same address');
  assert.equal(card.userId, 'srcBob');
  assert.deepEqual(own.collections.boards[0].members.map(m => m.userId), ['anna', 'srcBob']);
  const bob = users.docs.find(u => u._id === 'srcBob');
  assert.equal(bob.isAdmin, false, 'negative: an imported account is never an administrator here');
  assert.deepEqual(Object.keys(bob.services), ['password'], 'negative: no login tokens carried over');
  assert.equal(own.collections.settings, undefined, 'negative: the customer\'s settings are not copied');
  const domain = C.CloudDomains.docs.find(d => d._id === id);
  assert.equal(domain.mode, 'shared');
  assert.equal(org.docs[0].orgDomains, 'customer1.example.com');
  assert.ok(users.docs.find(u => u._id === 'anna').orgs.some(o => o.orgId === domain.orgId), 'everybody is in the domain\'s Organization');
  await assert.rejects(as('boss').cloudPanelImportDomain(id, { dryRun: false }), /already shares/, 'not twice');
});

test('a customer sees their own invoices and chat, never another domain\'s', async () => {
  const { as, C } = await configured();
  const mine = await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'shared', customerEmail: 'anna@customer1.fi' });
  const theirs = await as('boss').cloudPanelSaveDomain(null, { domain: 'other.example.com', mode: 'shared', customerEmail: 'x@other.fi' });
  await as('boss').cloudPanelSaveInvoice(mine, null, { number: '2025-1', issueDate: '2025-01-01', amount: 49, currency: 'EUR', status: 'paid', paidDate: '2025-01-10' });
  await as('boss').cloudPanelSaveInvoice(theirs, null, { number: '2025-2', issueDate: '2025-01-01', amount: 99, currency: 'EUR' });
  await assert.rejects(as('boss').cloudPanelSaveInvoice(mine, null, { number: '2025-1', issueDate: '2025-02-01', amount: 1, currency: 'EUR' }), /already recorded/);
  const who = await as('anna').cloudPanelWhoAmI();
  assert.deepEqual(who.domains.map(d => d.domain), ['customer1.example.com']);
  const invoices = await as('anna').cloudPanelInvoices();
  assert.deepEqual(invoices.map(i => [i.number, i.status, i.paidDate]), [['2025-1', 'paid', '2025-01-10']]);
  assert.deepEqual(await as('anna').cloudPanelInvoices(theirs), [], 'negative: asking for another domain gives nothing');
  assert.equal((await as('boss').cloudPanelInvoices()).length, 2, 'the SuperAdmin sees all');
  await as('anna').cloudPanelSendChat(mine, { text: 'Hello' });
  // A second apart, as two people write.
  C.CloudChatMessages.docs[0].at = new Date(Date.now() - 1000);
  await as('boss').cloudPanelSendChat(mine, { text: 'Hi Anna' });
  assert.deepEqual((await as('anna').cloudPanelChat(mine)).map(m => [m.text, m.mine]), [['Hello', true], ['Hi Anna', false]]);
  await assert.rejects(as('anna').cloudPanelChat(theirs), /not do that/);
  await assert.rejects(as('eve').cloudPanelChat(mine), /not do that/);
  await assert.rejects(as('anna', 'customer1.example.com').cloudPanelChat(mine), /not do that/, 'only at the Cloud Panel Domain');
  await assert.rejects(as('anna').cloudPanelSaveInvoice(mine, null, { number: 'x', issueDate: '2025-01-01', amount: 0, currency: 'EUR' }), /not do that/);
});

test('CloudFlare and Caddy: the token is never sent back; DNS records are created and updated as planned', async () => {
  const { as, calls } = await configured();
  await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'shared' });
  await as('boss').cloudPanelSaveDomain(null, { domain: 'customer2.example.com', mode: 'shared' });
  await as('boss').cloudPanelSetCloudflare({ apiToken: 'abcdefghijklmnopqrstuvwxyz012345', zoneId: '0123456789abcdef0123456789abcdef', target: '203.0.113.10' });
  await as('boss').cloudPanelSetCloudflare({ zoneId: '0123456789abcdef0123456789abcdef', target: '203.0.113.10' });
  const config = await as('boss').cloudPanelConfig();
  assert.equal(config.cloudflare.hasToken, true, 'an empty token keeps the saved one');
  assert.equal(JSON.stringify(config).includes('abcdefghij'), false, 'negative: the token is never sent back');
  const result = await as('boss').cloudPanelDnsApply();
  assert.deepEqual([result.created, result.updated], [2, 1], 'the panel and customer2 created, customer1 pointed at the target');
  assert.ok(calls.every(c => c.url.startsWith('https://api.cloudflare.com/client/v4/zones/0123456789abcdef0123456789abcdef/')));
  await assert.rejects(as('boss').cloudPanelPushCaddy(), /Caddy admin URL/);
  await as('boss').cloudPanelSetCaddy({ adminUrl: 'http://caddy:2019', sharedUpstream: 'wekan:8080' });
  await as('boss').cloudPanelPushCaddy();
  const load = calls.find(c => c.url === 'http://caddy:2019/load');
  assert.equal(load.method, 'POST');
  assert.match(load.body, /cloud\.example\.com \{/);
});

test('earlier conversations: a Rocket.Chat export is imported into a domain\'s chat, by the SuperAdmin only', async () => {
  const { as } = await configured();
  const mine = await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'shared', customerEmail: 'anna@customer1.fi' });
  const { zipSync, strToU8 } = require('fflate');
  const zip = zipSync({
    'channels.json': strToU8(`${JSON.stringify({ roomId: 'r1', roomName: 'support', type: 'c' })}\n`),
    'support.json': strToU8([{ username: 'anna', ts: '2024-03-01T10:00:00.000Z', msg: 'Is the server up?' },
      { username: 'boss', ts: '2024-03-01T10:05:00.000Z', msg: 'Yes.' }].map(m => JSON.stringify(m)).join('\n')),
  });
  const file = { zipBase64: Buffer.from(zip).toString('base64') };
  await assert.rejects(as('anna').cloudPanelImportChat(mine, 'rocketchat', file), /not do that/, 'negative: not a customer');
  assert.deepEqual(await as('boss').cloudPanelImportChat(mine, 'rocketchat', file), { imported: 2 });
  const chat = await as('anna').cloudPanelChat(mine);
  assert.deepEqual(chat.map(m => [m.room, m.authorName, m.text, m.source]), [['#support', 'anna', 'Is the server up?', 'rocketchat'],
    ['#support', 'boss', 'Yes.', 'rocketchat']]);
  await assert.rejects(as('boss').cloudPanelImportChat(mine, 'rocketchat', { zipBase64: Buffer.from('not a zip').toString('base64') }), /zip/);
});

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    console.log('  ok -', name);
  }
  console.log(`\ncloudPanelAccess: ${tests.length} tests passed`);
})().catch(e => { console.error(e); process.exitCode = 1; });
