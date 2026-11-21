'use strict';

// server/billing.js: money is a board admin's business. The real methods run
// in a sandbox with in-memory collections, as each kind of user.
// Run: node tests/billingAccess.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'server/billing.js'), 'utf8');

function get(doc, key) {
  return key.split('.').reduce((v, k) => (v === undefined || v === null ? undefined : v[k]), doc);
}
function matches(doc, selector) {
  return Object.entries(selector || {}).every(([key, cond]) => {
    const value = get(doc, key);
    if (cond && typeof cond === 'object' && !Array.isArray(cond) && Object.keys(cond).some(k => k.startsWith('$'))) {
      return Object.entries(cond).every(([op, arg]) => {
        switch (op) {
          case '$in': return (Array.isArray(value) ? value : [value]).some(v => arg.includes(v));
          case '$nin': return !(Array.isArray(value) ? value : [value]).some(v => arg.includes(v));
          case '$ne': return value !== arg;
          case '$exists': return (value !== undefined) === arg;
          case '$regex': return typeof value === 'string' && new RegExp(arg).test(value);
          case '$elemMatch': return Array.isArray(value) && value.some(v => matches(v, arg));
          default: throw new Error(`op ${op}`);
        }
      });
    }
    return Array.isArray(value) ? value.includes(cond) : value === cond;
  });
}
let nextId = 1;
class Collection {
  constructor(docs = [], { unique } = {}) { this.docs = docs.map(d => ({ ...d })); this.unique = unique; }
  find(selector = {}, options = {}) {
    const sel = typeof selector === 'string' ? { _id: selector } : selector;
    const self = this;
    return {
      async fetchAsync() {
        let out = self.docs.filter(d => matches(d, sel)).map(d => ({ ...d }));
        if (options.limit) out = out.slice(0, options.limit);
        return out;
      },
      async countAsync() { return self.docs.filter(d => matches(d, sel)).length; },
    };
  }
  async findOneAsync(selector) { return (await this.find(selector).fetchAsync())[0]; }
  async insertAsync(doc) {
    if (this.unique && this.docs.some(d => d[this.unique] === doc[this.unique])) throw new Error('E11000 duplicate key');
    const _id = `id${nextId++}`;
    this.docs.push({ _id, createdAt: new Date(nextId), ...doc });
    return _id;
  }
  async updateAsync(selector, modifier) {
    const sel = typeof selector === 'string' ? { _id: selector } : selector;
    for (const d of this.docs.filter(x => matches(x, sel))) Object.assign(d, modifier.$set);
  }
  async removeAsync(selector) {
    const sel = typeof selector === 'string' ? { _id: selector } : selector;
    this.docs = this.docs.filter(d => !matches(d, sel));
  }
}

function load({ featureOn = true } = {}) {
  const methods = {};
  class MeteorError extends Error { constructor(error, reason) { super(reason || error); this.error = error; this.reason = reason; } }
  const users = new Collection([
    { _id: 'admin', username: 'admin', isAdmin: true },
    { _id: 'pm', username: 'pm' },
    { _id: 'dev', username: 'dev', profile: { fullname: 'Dee Veloper' } },
    { _id: 'narrow', username: 'narrow' },
    { _id: 'stranger', username: 'stranger' },
  ]);
  const boards = new Collection([
    { _id: 'b1', title: 'Client X', members: [
      { userId: 'pm', isActive: true, isAdmin: true },
      { userId: 'dev', isActive: true },
      { userId: 'narrow', isActive: true, isAdmin: true, isNormalAssignedOnly: true },
    ] },
    { _id: 'b2', title: 'Other', members: [{ userId: 'stranger', isActive: true, isAdmin: true }] },
  ]);
  const cards = new Collection([
    { _id: 'c1', boardId: 'b1', title: 'Design', type: 'cardType-card', assignees: ['dev'], spentTime: 10, estimatedHours: 12 },
    { _id: 'c2', boardId: 'b1', title: 'Internal', type: 'cardType-card', assignees: ['dev'], spentTime: 3, billable: false },
    { _id: 'c3', boardId: 'b2', title: 'Theirs', type: 'cardType-card', assignees: ['stranger'], spentTime: 99 },
  ]);
  const B = {
    BillingBudgets: new Collection(),
    BillingRates: new Collection(),
    BillingInvoices: new Collection([], { unique: 'number' }),
  };
  const sandbox = {
    Meteor: { methods: m => Object.assign(methods, m), Error: MeteorError, users, startup() {} },
    check() {}, Match: { Optional: x => x, OneOf: (...x) => x },
    DDPRateLimiter: { addRule() {} },
    Boards: boards, Cards: cards, ...B,
    featureOnFor: async (userId, key) => featureOn && key === 'billing',
    require: rel => (rel.startsWith('/') ? require(path.join(ROOT, rel.slice(1))) : require(rel)),
    console,
  };
  const code = SOURCE.replace(/^import[\s\S]*?from '[^']+';$/gm, '');
  vm.runInNewContext(code, sandbox, { filename: 'server/billing.js' });
  // Results are cloned into this realm, so deepEqual compares values, not the
  // sandbox's Array prototype.
  const as = userId => new Proxy({}, { get: (_, name) => async (...args) => {
    const result = await methods[name].apply({ userId }, args);
    return result === undefined ? undefined : structuredClone(result);
  } });
  return { as, B, methods };
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test('a board admin sets a rate and a budget, and sees the cost and the forecast', async () => {
  const { as } = load();
  await as('pm').billingSetRate('b1', { hourlyRate: 80, currency: 'EUR' });
  await as('pm').billingSetRate('b1', { userId: 'dev', hourlyRate: 100, currency: 'EUR' });
  await as('pm').billingSetBudget('b1', { amount: 1000, currency: 'EUR' });
  const d = await as('pm').billingBoard('b1');
  assert.equal(d.finance.spentMinor, 130000, '13 h of dev at 100.00');
  assert.equal(d.finance.forecastMinor, 150000, 'plus 2 h still to do');
  assert.equal(d.finance.overBudget, true);
  assert.equal(d.rates.find(r => r.userId === 'dev').name, 'Dee Veloper');
  const list = await as('pm').billingBoards();
  assert.deepEqual(list.boards.map(b => b._id), ['b1']);
});

test('an invoice bills the billable hours once, and its number runs on', async () => {
  const { as, B } = load();
  await as('pm').billingSetRate('b1', { userId: 'dev', hourlyRate: 100, currency: 'EUR' });
  const id = await as('pm').billingCreateInvoice('b1', { customer: 'Client X Oy', issueDate: '2027-04-30' });
  const invoice = await as('pm').billingInvoice(id);
  assert.equal(invoice.number, 'INV-2027-0001');
  assert.equal(invoice.totalMinor, 100000, 'the not-billable card is left out');
  assert.equal(invoice.lines[0].name, 'Dee Veloper');
  await assert.rejects(as('pm').billingCreateInvoice('b1', { issueDate: '2027-05-01' }), /no billable hours left/);
  // Voiding frees the hours for a new invoice, numbered after the first.
  await as('pm').billingSetInvoiceStatus(id, 'void');
  const again = await as('pm').billingCreateInvoice('b1', { issueDate: '2027-05-02' });
  assert.equal((await B.BillingInvoices.findOneAsync(again)).number, 'INV-2027-0002');
  const csv = await as('pm').billingInvoiceCsv(again);
  assert.match(csv, /"Dee Veloper"/);
});

test('invoice status follows its rules', async () => {
  const { as } = load();
  await as('pm').billingSetRate('b1', { hourlyRate: 80, currency: 'EUR' });
  const id = await as('pm').billingCreateInvoice('b1', {});
  await assert.rejects(as('pm').billingSetInvoiceStatus(id, 'paid'), /cannot become paid/);
  await as('pm').billingSetInvoiceStatus(id, 'sent');
  await as('pm').billingSetInvoiceStatus(id, 'paid');
  await assert.rejects(as('pm').billingSetInvoiceStatus(id, 'void'), /cannot become void/, 'paid is final');
  await assert.rejects(as('pm').billingSetInvoiceStatus(id, 'cancelled'), /Invalid invoice status/);
});

test('negative: a member, an assigned-only admin and a stranger see and change nothing', async () => {
  const { as, B } = load();
  await as('pm').billingSetRate('b1', { hourlyRate: 80, currency: 'EUR' });
  const id = await as('pm').billingCreateInvoice('b1', {});
  for (const userId of ['dev', 'narrow', 'stranger']) {
    await assert.rejects(as(userId).billingBoard('b1'), /not do that/, userId);
    await assert.rejects(as(userId).billingSetBudget('b1', { amount: 1, currency: 'EUR' }), /not do that/, userId);
    await assert.rejects(as(userId).billingSetRate('b1', { hourlyRate: 1, currency: 'EUR' }), /not do that/, userId);
    await assert.rejects(as(userId).billingCreateInvoice('b1', {}), /not do that/, userId);
    await assert.rejects(as(userId).billingSetInvoiceStatus(id, 'void'), /not do that/, userId);
    await assert.rejects(as(userId).billingInvoice(id), /not do that/, userId);
    await assert.rejects(as(userId).billingInvoiceCsv(id), /not do that/, userId);
    await assert.rejects(as(userId).billingRemoveRate(B.BillingRates.docs[0]._id), /not do that/, userId);
    assert.ok(!(await as(userId).billingBoards()).boards.some(b => b._id === 'b1'), userId);
  }
  assert.equal(B.BillingRates.docs[0].hourlyRateMinor, 8000, 'the rate is unchanged');
});

test('a site administrator may manage any board, and list every board', async () => {
  const { as } = load();
  await as('admin').billingSetRate('b2', { hourlyRate: 50, currency: 'USD' });
  assert.equal((await as('admin').billingBoard('b2')).finance.spentMinor, 495000);
  assert.deepEqual((await as('admin').billingBoards({ allBoards: true })).boards.map(b => b._id).sort(), ['b1', 'b2']);
  assert.deepEqual((await as('pm').billingBoards({ allBoards: true })).boards.map(b => b._id), ['b1'], 'allBoards means nothing to others');
});

test('negative: a rate names a member of the board; bad money is refused', async () => {
  const { as } = load();
  await assert.rejects(as('pm').billingSetRate('b1', { userId: 'stranger', hourlyRate: 80, currency: 'EUR' }), /not a member/);
  await assert.rejects(as('pm').billingSetRate('b1', { hourlyRate: -1, currency: 'EUR' }), /at least 0/);
  await assert.rejects(as('pm').billingSetRate('b1', { hourlyRate: 1, currency: 'EURO' }), /three-letter/);
  await assert.rejects(as('pm').billingSetBudget('b1', {}), /amount, hours, or both/);
  await assert.rejects(as('pm').billingCreateInvoice('b1', {}), /hourly rate/, 'no rate yet');
});

test('negative: with Budget and billing off every method refuses, administrators too; nobody signed in gets nothing', async () => {
  const off = load({ featureOn: false });
  for (const name of Object.keys(off.methods)) {
    await assert.rejects(off.as('admin')[name]('b1', {}), /turned off/, name);
  }
  const on = load();
  for (const name of Object.keys(on.methods)) {
    await assert.rejects(on.as(null)[name]('b1', {}), /not do that/, name);
  }
  const bodies = SOURCE.split(/\n  async billing/).slice(1);
  assert.equal(bodies.length, Object.keys(on.methods).length);
  for (const body of bodies) assert.match(body.slice(0, body.indexOf('\n  },')), /await signedIn\(this\.userId\)/);
});

test('negative: no client writes and no publication of money', () => {
  const model = fs.readFileSync(path.join(ROOT, 'models/billing.js'), 'utf8');
  assert.match(model, /collection\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\);/);
  assert.doesNotMatch(model, /\.allow\(/);
  const found = require('node:child_process').spawnSync('git', ['grep', '-l', '-E', 'Meteor\\.publish[^\\n]*[Bb]illing', '--', 'server', 'models'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(found.stdout.trim(), '');
});

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    console.log('  ok -', name);
  }
  console.log(`\nbillingAccess: ${tests.length} tests passed`);
})().catch(e => { console.error(e); process.exitCode = 1; });
