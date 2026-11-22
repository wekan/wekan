'use strict';
// CloudPanelBleed (Hall of Fame): the Cloud Panel's methods and customer login, run for real, with and without CLOUD.

// server/cloudPanel.js: the Cloud Panel exists only where the server has the
// CLOUD environment variable, answers only at that address, to its Cloud
// Admins - the site administrators there - and to a customer, for their own
// domain. The real methods and the real customer login handler run in a
// sandbox with in-memory collections, a customer's in-memory WeKan database to
// import and sign in against, and stubbed Accounts, CloudFlare and Caddy.
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
        case '$gt': return value > arg;
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

// What accounts-password does with a password, closely enough for these
// tests: a hash is "hash:<password>". Every call is kept, so a test can see
// which account the check was told it was for.
const passwordChecks = [];

async function load({ host = 'cloud.example.com', env = { CLOUD: 'cloud.example.com' }, settingsDoc = null } = {}) {
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
      { _id: 'srcAnna', username: 'anna', emails: [{ address: 'Anna@Customer1.fi' }], services: { password: { bcrypt: 'hash:anna-pass' }, resume: { loginTokens: ['t'] } } },
      { _id: 'srcBob', username: 'bob', emails: [{ address: 'bob@customer1.fi' }], isAdmin: true, profile: { fullname: 'Bob B' },
        services: { password: { bcrypt: 'hash:bob-pass' } } },
      { _id: 'srcDan', username: 'dan', loginDisabled: true, services: { password: { bcrypt: 'hash:dan-pass' } } },
      { _id: 'srcLdap', username: 'lena', services: { ldap: { id: 'x' } } },
    ],
    boards: [{ _id: 'B1', title: 'Customer board', members: [{ userId: 'srcAnna', isAdmin: true }, { userId: 'srcBob' }] }],
    lists: [{ _id: 'L1', boardId: 'B1', title: 'Todo' }],
    cards: [{ _id: 'C1', boardId: 'B1', listId: 'L1', userId: 'srcBob', assignees: ['srcAnna'], title: 'Work' }],
    settings: [{ _id: 's', productName: 'Their WeKan' }],
  });
  const C = {
    CloudSettings: new Collection(settingsDoc ? [settingsDoc] : []), CloudDomains: new Collection(), CloudInvoices: new Collection(),
    CloudChatMessages: new Collection(),
  };
  const B = { Boards: new Collection(), Lists: new Collection(), Swimlanes: new Collection(), Cards: new Collection(), CardComments: new Collection() };
  const org = new Collection();
  const calls = [];
  const records = [];
  const clients = [];
  const startups = [];
  const loginHandlers = [{ name: 'timing', handler: async () => undefined }, { name: 'password', handler: async () => undefined }];
  const validators = [];
  users.rawCollection = () => ({ async insertOne(doc) { users.docs.push(structuredClone(doc)); } });
  const Accounts = {
    _loginHandlers: loginHandlers,
    registerLoginHandler(name, handler) { loginHandlers.push({ name, handler }); },
    validateLoginAttempt(fn) { validators.push(fn); },
    async _findUserByQuery(query) {
      if (query.username) return users.docs.find(u => String(u.username).toLowerCase() === query.username.toLowerCase()) || null;
      if (query.email) return users.docs.find(u => (u.emails || []).some(e => e.address.toLowerCase() === query.email.toLowerCase())) || null;
      return null;
    },
    _handleError(msg, throwError = true) { const e = new MeteorError(403, msg); if (throwError) throw e; return e; },
    async _checkPasswordAsync(user, password) {
      passwordChecks.push(user._id);
      return user.services.password.bcrypt === `hash:${password}` ? { userId: user._id } : { userId: user._id, error: new MeteorError(403, 'Incorrect password') };
    },
  };
  const sandbox = {
    Meteor: { methods: m => Object.assign(methods, m), Error: MeteorError, users, startup(fn) { startups.push(fn); },
      absoluteUrl: () => 'https://wekan.example.com/' },
    Accounts,
    check() {}, Match: { Optional: x => x, OneOf: (...x) => x, Integer: Number, Any: null },
    DDPRateLimiter: { addRule() {} },
    Random: { id: n => `new${nextId++}`.slice(0, n || 20) },
    MongoInternals: { defaultRemoteCollectionDriver: () => ({ mongo: { db: own } }) },
    Org: org, ...C, ...B, tenants, TABLE_PAGE_ROWS_PER_PAGE: 10,
    fetch: async (url, options = {}) => {
      calls.push({ url, method: options.method || 'GET', body: options.body });
      if (new URL(url).hostname === 'api.cloudflare.com' && (options.method || 'GET') === 'GET') {
        return { ok: true, status: 200, json: async () => ({ success: true, result: [{ id: 'r1', type: 'A', name: 'customer1.example.com', content: '198.51.100.9', proxied: true }] }) };
      }
      return { ok: true, status: 200, json: async () => ({ success: true, result: {} }), text: async () => '' };
    },
    AbortSignal, process: { env },
    require: rel => {
      if (rel === 'mongodb') {
        return { MongoClient: class { constructor(url) { this.url = url; clients.push(url); }
          async connect() { if (!this.url.includes('customer1')) throw new Error('unreachable'); }
          db() { return source; } async close() {} } };
      }
      if (rel === '/server/lib/securityLog') return { record: r => records.push(r) };
      if (rel === '/server/lib/mongoStartup') return { ensureIndex: async () => {} };
      return rel.startsWith('/') ? require(path.join(ROOT, rel.slice(1))) : require(rel);
    },
    console: { ...console, warn() {} },
  };
  const code = SOURCE.replace(/^import[\s\S]*?from '[^']+';$/gm, '');
  vm.runInNewContext(code, sandbox, { filename: 'server/cloudPanel.js' });
  for (const fn of startups) await fn();
  const connection = (onHost, address) => ({ httpHeaders: { host: onHost }, clientAddress: address });
  const as = (userId, onHost = host, address = '203.0.113.5') => new Proxy({}, { get: (_, name) => async (...args) => {
    const result = await methods[name].apply({ userId, connection: connection(onHost, address) }, args);
    return result === undefined ? undefined : structuredClone(result);
  } });
  // A password login, the way Meteor runs the handlers: the first that
  // answers decides.
  const login = async (user, password, { onHost = host, address = '203.0.113.5' } = {}) => {
    for (const h of loginHandlers) {
      // eslint-disable-next-line no-await-in-loop
      const result = await h.handler.call({ connection: connection(onHost, address) }, { user, password });
      if (result !== undefined) return result;
    }
    return undefined;
  };
  const attempt = async (userId, { onHost = host, address = '203.0.113.5', type = 'password' } = {}) => {
    const user = users.docs.find(u => u._id === userId);
    for (const v of validators) {
      // eslint-disable-next-line no-await-in-loop
      await v({ user, allowed: true, type, connection: connection(onHost, address) });
    }
    return true;
  };
  return { as, C, B, users, org, own, source, calls, methods, records, clients, env, login, attempt, loginHandlers };
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

const configured = () => load();

// The methods a Cloud Admin has, and nobody else.
const ADMIN_ONLY = ['cloudPanelConfig', 'cloudPanelSetCloudflare', 'cloudPanelSetCaddy', 'cloudPanelSetAllowedAddresses', 'cloudPanelDomainsCount',
  'cloudPanelDomainsPage', 'cloudPanelDomain', 'cloudPanelSaveDomain', 'cloudPanelRemoveDomain', 'cloudPanelTestDatabase', 'cloudPanelImportDomain',
  'cloudPanelCaddyfile', 'cloudPanelPushCaddy', 'cloudPanelDnsPlan', 'cloudPanelDnsApply', 'cloudPanelSaveInvoice',
  'cloudPanelRemoveInvoice', 'cloudPanelImportChat', 'cloudPanelMoveTicket'];

test('negative: without CLOUD there is no Cloud Panel - every method refused and recorded, no database ever reached', async () => {
  // A domain and SuperAdmin stored from the browser by an earlier version,
  // naming this very host: no effect.
  const { as, methods, records, clients, C } = await load({ env: {},
    settingsDoc: { _id: 'cloud', settings: { domain: 'cloud.example.com', superAdminUsername: 'boss' } } });
  await C.CloudDomains.insertAsync({ _id: 'internal', domain: 'internal.example.com', mode: 'own', upstream: 'x:1',
    database: { host: 'mongodb-internal.customer1', database: 'admin' } });
  const who = await as('boss').cloudPanelWhoAmI();
  assert.deepEqual([who.enabled, who.onCloudHost, who.isCloudAdmin], [false, false, false]);
  assert.equal(records.length, 0, 'asking whether there is a panel is not an attempt');
  for (const name of Object.keys(methods).filter(n => n !== 'cloudPanelWhoAmI')) {
    for (const userId of ['boss', 'admin2', 'anna', null]) {
      await assert.rejects(as(userId)[name]('internal', {}, {}), /not do that/, `${name} by ${userId}`);
    }
  }
  assert.equal(clients.length, 0, 'negative: no MongoClient was ever built');
  assert.ok(records.length >= Object.keys(methods).length - 1);
  assert.ok(records.every(r => r.key === 'authz.cloud-panel-off' && r.action === 'blocked'), 'each refusal is in Admin Panel / Problems');
});

test('negative: the domain and SuperAdmin can no longer be set from the browser, by anybody', async () => {
  const { as, records, C } = await configured();
  for (const userId of ['boss', 'admin2', 'anna']) {
    await assert.rejects(as(userId).cloudPanelSetSettings({ domain: 'evil.example.com', superAdminUsername: userId }), /CLOUD environment variable/);
    await assert.rejects(as(userId).cloudPanelGetSettings(), /CLOUD environment variable/);
  }
  assert.equal(C.CloudSettings.docs.length, 0, 'nothing saved');
  assert.ok(records.some(r => r.key === 'authz.cloud-panel-access'));
});

test('negative: the panel answers only at the CLOUD address, and only to its Cloud Admins', async () => {
  const { as, methods, records } = await configured();
  assert.equal((await as('boss', 'customer1.example.com').cloudPanelWhoAmI()).onCloudHost, false);
  assert.equal((await as('boss').cloudPanelWhoAmI()).isCloudAdmin, true, 'the site administrators are the Cloud Admins');
  assert.equal((await as('admin2').cloudPanelWhoAmI()).isCloudAdmin, true, 'all of them - there is no SuperAdmin name');
  for (const name of ADMIN_ONLY) {
    await assert.rejects(as('boss', 'customer1.example.com')[name]('x', {}), /not do that/, `${name} on another host`);
    await assert.rejects(as('anna')[name]('x', {}), /not do that/, `${name} by a customer`);
    await assert.rejects(as(null)[name]('x', {}), /not do that/, `${name} signed out`);
  }
  assert.ok(records.some(r => r.key === 'authz.cloud-panel-access' && /cloudPanel/.test(r.source)), 'a customer trying is recorded');
  // Every method of the file is the who-am-I, the refused settings, or
  // guarded by onPanel / cloudAdmin / readableDomain.
  const bodies = SOURCE.split(/\n  async cloudPanel/).slice(1);
  assert.equal(bodies.length, Object.keys(methods).length);
  for (const body of bodies) {
    const head = body.slice(0, body.indexOf('\n  },'));
    if (/^(GetSettings|SetSettings)\(/.test(body)) assert.match(head, /settingsRefused\(/);
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
  assert.match(caddy, /^cloud\.example\.com \{/m, 'the panel is the CLOUD domain');
  assert.match(caddy, /customer1\.example\.com \{\n\treverse_proxy wekan-c1:8080\n\}/);
  assert.match(caddy, /wekan\.customer\.com \{\n\treverse_proxy wekan:8080\n\}/);
});

test('import: a customer\'s own database merges into this one, once, with accounts matched and nobody made an administrator', async () => {
  const { as, C, users, own, org } = await configured();
  const id = await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'own', upstream: 'wekan-c1:8080',
    database: { host: 'mongodb', database: 'wekan_customer1' } });
  assert.deepEqual(await as('boss').cloudPanelTestDatabase(id), { ok: true, collections: 5, users: 4, boards: 1, cards: 1 });
  const dry = await as('boss').cloudPanelImportDomain(id);
  assert.deepEqual(dry.users, { matched: 1, created: 3 });
  assert.equal(own.collections.boards.length, 0, 'a dry run by default: nothing written');
  const report = await as('boss').cloudPanelImportDomain(id, { dryRun: false });
  assert.equal(report.collections.cards.copied, 1);
  const card = own.collections.cards[0];
  assert.deepEqual(card.assignees, ['anna'], 'the source account is the account here with the same address');
  assert.equal(card.userId, 'srcBob');
  const bob = users.docs.find(u => u._id === 'srcBob');
  assert.equal(bob.isAdmin, false, 'negative: an imported account is never an administrator here');
  assert.deepEqual(Object.keys(bob.services), ['password'], 'negative: no login tokens carried over');
  assert.equal(own.collections.settings, undefined, 'negative: the customer\'s settings are not copied');
  const domain = C.CloudDomains.docs.find(d => d._id === id);
  assert.equal(domain.mode, 'shared');
  assert.equal(org.docs[0].orgDomains, 'customer1.example.com');
  await assert.rejects(as('boss').cloudPanelImportDomain(id, { dryRun: false }), /already shares/, 'not twice');
});

test('support boards: one per domain, the Cloud Admins its board admins; tickets in Open, moved only by a Cloud Admin', async () => {
  const { as, B, C, records } = await configured();
  const mine = await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'shared', customerEmail: 'anna@customer1.fi' });
  const support = C.CloudDomains.docs.find(d => d._id === mine).support;
  const board = B.Boards.docs.find(b => b._id === support.boardId);
  assert.equal(board.title, 'Support: customer1.example.com');
  assert.equal(board.permission, 'private');
  assert.deepEqual(board.members.map(m => [m.userId, m.isAdmin]), [['boss', true], ['admin2', true]]);
  assert.deepEqual(B.Lists.docs.filter(l => l.boardId === board._id).map(l => l.title), ['Open', 'In progress', 'Done', 'Chat']);
  // Anna is a customer by her e-mail address: she adds a ticket, which lands in Open.
  const ticketId = await as('anna').cloudPanelAddTicket(mine, { title: 'The server is down', description: 'Since 9' });
  const card = B.Cards.docs.find(c => c._id === ticketId);
  assert.deepEqual([card.listId, card.userId, card.boardId], [support.lists.open, 'anna', support.boardId]);
  await assert.rejects(as('anna').cloudPanelAddTicket(mine, { title: 'x', listId: support.lists.done }), /Unsupported/,
    'negative: a customer chooses no list');
  await assert.rejects(as('anna').cloudPanelMoveTicket(mine, ticketId, 'done'), /not do that/, 'negative: a customer moves no ticket');
  assert.ok(records.some(r => r.key === 'authz.cloud-panel-access' && r.source === 'method:cloudPanelMoveTicket'));
  await as('boss').cloudPanelMoveTicket(mine, ticketId, 'progress');
  const tickets = await as('anna').cloudPanelTickets(mine);
  assert.deepEqual(tickets.columns.map(c => [c.key, c.cards.map(t => t.title)]), [['open', []], ['progress', ['The server is down']], ['done', []]]);
  assert.equal(tickets.boardId, support.boardId);
  const theirs = await as('boss').cloudPanelSaveDomain(null, { domain: 'other.example.com', mode: 'shared', customerEmail: 'x@other.fi' });
  await assert.rejects(as('anna').cloudPanelTickets(theirs), /not do that/, 'negative: another domain\'s tickets');
  await assert.rejects(as('eve').cloudPanelAddTicket(mine, { title: 'x' }), /not do that/, 'negative: a stranger adds none');
  await assert.rejects(as('boss').cloudPanelMoveTicket(mine, 'not-a-ticket', 'done'), /No such ticket/);
});

test('a customer sees their own invoices and chat - the chat being the support board\'s chat card - never another domain\'s', async () => {
  const { as, B, C } = await configured();
  const mine = await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'shared', customerEmail: 'anna@customer1.fi' });
  const theirs = await as('boss').cloudPanelSaveDomain(null, { domain: 'other.example.com', mode: 'shared', customerEmail: 'x@other.fi' });
  await as('boss').cloudPanelSaveInvoice(mine, null, { number: '2025-1', issueDate: '2025-01-01', amount: 49, currency: 'EUR', status: 'paid', paidDate: '2025-01-10' });
  await as('boss').cloudPanelSaveInvoice(theirs, null, { number: '2025-2', issueDate: '2025-01-01', amount: 99, currency: 'EUR' });
  const who = await as('anna').cloudPanelWhoAmI();
  assert.deepEqual(who.domains.map(d => d.domain), ['customer1.example.com']);
  const invoices = await as('anna').cloudPanelInvoices();
  assert.deepEqual(invoices.map(i => [i.number, i.status, i.paidDate]), [['2025-1', 'paid', '2025-01-10']]);
  assert.deepEqual(await as('anna').cloudPanelInvoices(theirs), [], 'negative: asking for another domain gives nothing');
  assert.equal((await as('boss').cloudPanelInvoices()).length, 2, 'a Cloud Admin sees all');
  await as('anna').cloudPanelSendChat(mine, { text: 'Hello' });
  B.CardComments.docs[0].createdAt = new Date(Date.now() - 1000);
  await as('boss').cloudPanelSendChat(mine, { text: 'Hi Anna' });
  B.CardComments.docs[1].createdAt = new Date();
  const support = C.CloudDomains.docs.find(d => d._id === mine).support;
  assert.ok(B.CardComments.docs.every(c => c.cardId === support.chatCardId && c.boardId === support.boardId), 'the chat card\'s comments');
  assert.deepEqual((await as('anna').cloudPanelChat(mine)).map(m => [m.text, m.mine, m.authorName]), [['Hello', true, 'anna'], ['Hi Anna', false, 'boss']]);
  await assert.rejects(as('anna').cloudPanelChat(theirs), /not do that/);
  await assert.rejects(as('eve').cloudPanelChat(mine), /not do that/);
  await assert.rejects(as('anna', 'customer1.example.com').cloudPanelChat(mine), /not do that/, 'only at the CLOUD address');
  await assert.rejects(as('anna').cloudPanelSaveInvoice(mine, null, { number: 'x', issueDate: '2025-01-01', amount: 0, currency: 'EUR' }), /not do that/);
});

test('the earlier chat is moved once into the support board\'s chat card', async () => {
  const { as, B, C } = await configured();
  await C.CloudDomains.insertAsync({ _id: 'old', domain: 'old.example.com', mode: 'shared', customerEmail: 'anna@customer1.fi' });
  await C.CloudChatMessages.insertAsync({ domainId: 'old', userId: 'anna', authorName: 'anna', text: 'Before', at: new Date('2025-01-01T10:00:00Z') });
  await C.CloudChatMessages.insertAsync({ domainId: 'old', authorName: 'Rocky', room: '#support', source: 'rocketchat', text: 'Imported',
    at: new Date('2024-01-01T10:00:00Z') });
  const chat = await as('anna').cloudPanelChat('old');
  assert.deepEqual(chat.map(m => [m.text, m.authorName, m.source, m.room]), [['Imported', 'Rocky', 'rocketchat', '#support'], ['Before', 'anna', null, '']]);
  assert.equal(B.CardComments.docs.find(c => c.cloudImport).text, 'Rocky: Imported', 'the board\'s own chat view names the author too');
  assert.ok(C.CloudChatMessages.docs.every(m => m.migratedAt), 'kept, and marked');
  await as('anna').cloudPanelChat('old');
  assert.equal(B.CardComments.docs.length, 2, 'moved only once');
});

test('the customer login: their own WeKan\'s password, checked against their own database; an account here that is no administrator', async () => {
  const { as, B, C, users, login, clients } = await configured();
  const id = await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'own', upstream: 'wekan-c1:8080',
    customerUsernames: ['bob', 'dan', 'lena', 'boss'], database: { host: 'mongodb', database: 'wekan_customer1' } });
  const before = passwordChecks.length;
  const result = await login({ username: 'Bob' }, 'bob-pass');
  assert.ok(result && result.userId && !result.error, 'signed in');
  const shadow = users.docs.find(u => u._id === result.userId);
  assert.equal(shadow.isAdmin, false, 'negative: whatever they are in their own WeKan, not an administrator here');
  assert.equal(shadow.services.password, undefined, 'negative: no password of its own here');
  assert.deepEqual([shadow.services.cloudCustomer.domainId, shadow.services.cloudCustomer.username, shadow.services.cloudCustomer.foreignUserId],
    [id, 'bob', 'srcBob']);
  assert.equal(shadow.username, 'bob_customer1.example.com');
  assert.equal(shadow.profile.fullname, 'Bob B');
  const checkedAs = passwordChecks.slice(before);
  assert.ok(checkedAs.length === 1 && checkedAs.every(x => /^cloud-customer-check:/.test(x)),
    'negative: the hash is checked under an id no account here has, so a re-hash cannot write to any account');
  // On the support board, Comment only.
  const support = C.CloudDomains.docs.find(d => d._id === id).support;
  const member = B.Boards.docs.find(b => b._id === support.boardId).members.find(m => m.userId === shadow._id);
  assert.deepEqual([member.isAdmin, member.isCommentOnly, member.isActive], [false, true, true]);
  // The second login is the same account, asked again.
  const again = await login({ username: 'bob' }, 'bob-pass');
  assert.equal(again.userId, shadow._id);
  assert.equal(users.docs.filter(u => u.services && u.services.cloudCustomer).length, 1);
  // Exactly its own domain, never another that lists the same name.
  await as('boss').cloudPanelSaveDomain(null, { domain: 'other.example.com', mode: 'shared', customerUsernames: ['bob'] });
  const who = await as(shadow._id).cloudPanelWhoAmI();
  assert.deepEqual([who.isCustomer, who.isCloudAdmin, who.domains.map(d => d.domain)], [true, false, ['customer1.example.com']]);
  assert.equal(clients.every(url => url.includes('wekan_customer1')), true, 'only the domain\'s own database was asked');
});

test('negative: the customer login refuses a wrong password, a disabled or password-less account, an unlisted name - and stays out of the way', async () => {
  const { as, login, clients, users } = await configured();
  await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'own', upstream: 'wekan-c1:8080',
    customerUsernames: ['bob', 'dan', 'lena', 'boss', 'anna'], database: { host: 'mongodb', database: 'wekan_customer1' } });
  await assert.rejects(login({ username: 'bob' }, 'wrong'), /Incorrect password/, 'a wrong password, first time');
  assert.equal(users.docs.some(u => u.services && u.services.cloudCustomer), false, 'and no account made for it');
  const ok = await login({ username: 'bob' }, 'bob-pass');
  const wrong = await login({ username: 'bob' }, 'wrong');
  assert.equal(wrong.userId, ok.userId, 'a wrong password of a known customer counts against that account');
  assert.match(wrong.error.message, /Incorrect password/);
  await assert.rejects(login({ username: 'dan' }, 'dan-pass'), /Incorrect password/, 'disabled in their own WeKan');
  await assert.rejects(login({ username: 'lena' }, 'x'), /Incorrect password/, 'no password there');
  const asked = clients.length;
  assert.equal(await login({ username: 'carol' }, 'x'), undefined, 'an unlisted name is the ordinary password login\'s');
  assert.equal(clients.length, asked, 'negative: and no customer database is asked about it');
  assert.equal(await login({ username: 'boss' }, 'bob-pass'), undefined,
    'negative: an account of the panel\'s own - a Cloud Admin - is never signed in by a customer database');
  assert.equal(await login({ username: 'anna' }, 'anna-pass'), undefined, 'nor is any other local account');
  assert.equal(await login({ username: 'bob' }, 'bob-pass', { onHost: 'customer1.example.com' }), undefined, 'negative: only at the CLOUD address');
  const off = await load({ env: {} });
  assert.equal(await off.login({ username: 'bob' }, 'bob-pass'), undefined, 'negative: and never without CLOUD');
  assert.equal(off.clients.length, 0);
});

test('the customer login runs before accounts-password\'s, after the timing normalization', async () => {
  const { loginHandlers } = await configured();
  assert.deepEqual(loginHandlers.map(h => h.name), ['timing', 'password', 'password']);
  assert.match(loginHandlers[1].handler.toString(), /customerLogin/);
});

test('allowed addresses: a Cloud Admin only from them; never saved so as to lock the saver out', async () => {
  const { as, attempt, records, env } = await configured();
  await assert.rejects(as('boss', 'cloud.example.com', '203.0.113.5').cloudPanelSetAllowedAddresses('198.51.100.0/24'), /lock you out/,
    'negative: a list without your own address is refused');
  await assert.rejects(as('boss').cloudPanelSetAllowedAddresses('not-an-address'), /Not an address/);
  assert.deepEqual(await as('boss', 'cloud.example.com', '::ffff:203.0.113.5').cloudPanelSetAllowedAddresses('203.0.113.0/24\n2001:db8::/32'),
    ['203.0.113.0/24', '2001:db8::/32']);
  const config = await as('boss').cloudPanelConfig();
  assert.deepEqual([config.allowedAddresses, config.yourAddress], [['203.0.113.0/24', '2001:db8::/32'], '203.0.113.5']);
  assert.equal(await attempt('boss', { address: '203.0.113.77' }), true);
  assert.equal(await attempt('boss', { address: '2001:db8::1' }), true);
  await assert.rejects(attempt('boss', { address: '198.51.100.9' }), /allowed addresses/, 'negative: from another address, refused');
  const logged = records.find(r => r.key === 'authn.cloud-admin-address');
  assert.ok(logged && logged.action === 'blocked' && logged.ip === '198.51.100.9', 'and recorded in Admin Panel / Problems');
  await assert.rejects(attempt('boss', { address: '198.51.100.9', type: 'resume' }), /allowed addresses/, 'a session is refused too');
  assert.equal(await attempt('anna', { address: '198.51.100.9' }), true, 'a customer is not a Cloud Admin: not limited');
  assert.equal(await attempt('boss', { address: '198.51.100.9', onHost: 'customer1.example.com' }), true, 'only at the CLOUD address');
  await assert.rejects(as('boss', 'cloud.example.com', '198.51.100.9').cloudPanelDomainsCount(''), /not do that/,
    'negative: a Cloud Admin method from elsewhere');
  const who = await as('boss', 'cloud.example.com', '198.51.100.9').cloudPanelWhoAmI();
  assert.deepEqual([who.isCloudAdmin, who.addressRefused], [false, true]);
  // The way back in, documented: CLOUD_ADMIN_ANY_ADDRESS=true.
  env.CLOUD_ADMIN_ANY_ADDRESS = 'true';
  assert.equal(await attempt('boss', { address: '198.51.100.9' }), true);
  delete env.CLOUD_ADMIN_ANY_ADDRESS;
  assert.deepEqual(await as('boss').cloudPanelSetAllowedAddresses(''), [], 'empty: any address');
  assert.equal(await attempt('boss', { address: '198.51.100.9' }), true);
});

test('CloudFlare and Caddy: the token is never sent back; DNS records are created and updated as planned', async () => {
  const { as, calls } = await configured();
  await as('boss').cloudPanelSaveDomain(null, { domain: 'customer1.example.com', mode: 'shared' });
  await as('boss').cloudPanelSaveDomain(null, { domain: 'customer2.example.com', mode: 'shared' });
  await as('boss').cloudPanelSetCloudflare({ apiToken: 'abcdefghijklmnopqrstuvwxyz012345', zoneId: '0123456789abcdef0123456789abcdef', target: '203.0.113.10' });
  await as('boss').cloudPanelSetCloudflare({ zoneId: '0123456789abcdef0123456789abcdef', target: '203.0.113.10' });
  const config = await as('boss').cloudPanelConfig();
  assert.equal(config.cloudflare.hasToken, true, 'an empty token keeps the saved one');
  assert.equal(config.cloudDomain, 'cloud.example.com');
  assert.equal(JSON.stringify(config).includes('abcdefghij'), false, 'negative: the token is never sent back');
  const result = await as('boss').cloudPanelDnsApply();
  assert.deepEqual([result.created, result.updated], [2, 1], 'the panel and customer2 created, customer1 pointed at the target');
  assert.ok(calls.every(c => c.url.startsWith('https://api.cloudflare.com/client/v4/zones/0123456789abcdef0123456789abcdef/')));
  await assert.rejects(as('boss').cloudPanelPushCaddy(), /Caddy admin URL/);
  await as('boss').cloudPanelSetCaddy({ adminUrl: 'http://caddy:2019', sharedUpstream: 'wekan:8080' });
  await as('boss').cloudPanelPushCaddy();
  const caddyLoad = calls.find(c => c.url === 'http://caddy:2019/load');
  assert.equal(caddyLoad.method, 'POST');
  assert.match(caddyLoad.body, /cloud\.example\.com \{/);
});

test('earlier conversations: a Rocket.Chat export is imported into a domain\'s support chat, by a Cloud Admin only', async () => {
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
