'use strict';

// server/workload.js: who may read whose workload, and who may change what.
// The real methods run in a sandbox with in-memory collections, as each user.
// Run: node tests/workloadAccess.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'server/workload.js'), 'utf8');

// ---------------------------------------------------------------- a tiny Mongo

function get(doc, key) {
  return key.split('.').reduce((v, k) => (v === undefined || v === null ? undefined : v[k]), doc);
}
function matchValue(value, cond) {
  if (cond && typeof cond === 'object' && !Array.isArray(cond) && Object.keys(cond).some(k => k.startsWith('$'))) {
    return Object.entries(cond).every(([op, arg]) => {
      const values = Array.isArray(value) ? value : [value];
      switch (op) {
        case '$in': return values.some(v => arg.includes(v)) || (value === undefined && arg.includes(null));
        case '$nin': return !values.some(v => arg.includes(v));
        case '$ne': return Array.isArray(value) ? !value.includes(arg) : value !== arg;
        case '$gte': return value >= arg;
        case '$lte': return value <= arg;
        case '$exists': return (value !== undefined) === arg;
        case '$elemMatch': return Array.isArray(value) && value.some(v => matches(v, arg));
        default: throw new Error(`op ${op}`);
      }
    });
  }
  if (Array.isArray(value)) return value.includes(cond);
  return value === cond;
}
function matches(doc, selector) {
  return Object.entries(selector || {}).every(([key, cond]) => {
    if (key === '$or') return cond.some(s => matches(doc, s));
    if (key === '$and') return cond.every(s => matches(doc, s));
    return matchValue(get(doc, key), cond);
  });
}
let nextId = 1;
class Collection {
  constructor(docs = []) { this.docs = docs.map(d => ({ ...d })); }
  find(selector = {}, options = {}) {
    const self = this;
    const sel = typeof selector === 'string' ? { _id: selector } : selector;
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
  async insertAsync(doc) { const _id = `id${nextId++}`; this.docs.push({ _id, ...doc }); return _id; }
  async upsertAsync(selector, modifier) {
    const doc = this.docs.find(d => matches(d, selector));
    if (doc) {
      Object.assign(doc, modifier.$set);
      for (const k of Object.keys(modifier.$unset || {})) delete doc[k];
    } else this.docs.push({ _id: `id${nextId++}`, ...modifier.$set });
  }
  async removeAsync(selector) {
    const sel = typeof selector === 'string' ? { _id: selector } : selector;
    this.docs = this.docs.filter(d => !matches(d, sel));
  }
}

// ---------------------------------------------------------------- the world

const today = new Date().toISOString().slice(0, 10);
// A Monday in the report's first week, whatever day the test runs on.
const { weekStart, addDays } = require('../models/lib/workload.js');
const monday = weekStart(today) === today ? today : addDays(weekStart(today), 7);
function load({ featureOn = true } = {}) {
  const methods = {};
  class MeteorError extends Error { constructor(error, reason) { super(reason || error); this.error = error; this.reason = reason; } }
  const removeHooks = [];
  const users = new Collection([
    { _id: 'admin', username: 'admin', isAdmin: true },
    { _id: 'pm', username: 'pm', profile: { fullname: 'Pat Manager' } },
    { _id: 'dev', username: 'dev' },
    { _id: 'dev2', username: 'dev2' },
    { _id: 'stranger', username: 'stranger' },
    { _id: 'reader', username: 'reader' },
  ]);
  users.after = { remove: fn => removeHooks.push(fn) };
  const boards = new Collection([
    { _id: 'b1', title: 'Project X', members: [
      { userId: 'pm', isActive: true, isAdmin: true },
      { userId: 'dev', isActive: true },
      { userId: 'gone', isActive: false },
      { userId: 'reader', isActive: true, isReadAssignedOnly: true },
    ] },
    { _id: 'b2', title: 'Project Y', members: [{ userId: 'dev', isActive: true, isAdmin: true }, { userId: 'dev2', isActive: true }] },
    { _id: 'pub', title: 'Public', permission: 'public', members: [{ userId: 'stranger', isActive: true, isAdmin: true }] },
  ]);
  const cards = new Collection([
    { _id: 'c1', boardId: 'b1', title: 'Feature', type: 'cardType-card', archived: false, assignees: ['dev'], dueAt: today, estimatedHours: 10 },
    { _id: 'c2', boardId: 'b2', title: 'Other', type: 'cardType-card', archived: false, assignees: ['dev'], dueAt: today, estimatedHours: 5, billable: false },
    { _id: 'c3', boardId: 'pub', title: 'Secret', type: 'cardType-card', archived: false, assignees: ['stranger'], dueAt: today, estimatedHours: 99 },
  ]);
  const W = {
    WorkloadCapacities: new Collection(),
    WorkloadAbsences: new Collection([{ _id: 'abs1', userId: 'dev', start: today, end: today, type: 'sick', note: 'flu' }]),
    WorkloadHolidays: new Collection(),
    WorkloadAllocations: new Collection(),
  };
  const real = rel => require(path.join(ROOT, rel));
  const sandbox = {
    Meteor: { methods: m => Object.assign(methods, m), Error: MeteorError, users, startup() {} },
    check() {}, Match: { Optional: x => x, Integer: Number },
    DDPRateLimiter: { addRule() {} },
    featureOnFor: async (userId, key) => featureOn && key === 'workload',
    Boards: boards, Cards: cards, ...W,
    // Time logged today: dev on b1 (billable) and b2 (not), the stranger on
    // the public board nobody else reports on.
    TimeEntries: new Collection([
      { _id: 't1', boardId: 'b1', cardId: 'c1', userId: 'dev', date: today, hours: 6 },
      { _id: 't2', boardId: 'b2', cardId: 'c2', userId: 'dev', date: today, hours: 2 },
      { _id: 't3', boardId: 'pub', cardId: 'c3', userId: 'stranger', date: today, hours: 9 },
    ]),
    require: rel => (rel.startsWith('/') ? real(rel.slice(1)) : require(rel)),
    console,
  };
  const code = SOURCE
    .replace(/^import[\s\S]*?from '[^']+';$/gm, '')
    .replace(/^export /gm, '');
  vm.runInNewContext(code, sandbox, { filename: 'server/workload.js' });
  const as = userId => new Proxy({}, { get: (_, name) => (...args) => methods[name].apply({ userId }, args) });
  return { as, W, cards, methods, removeHooks };
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

const params = { from: today, weeks: 3 };

test('utilization and skills: own working time, billable hours of the boards reported, and who could fill a placeholder', async () => {
  const { as, W } = load();
  await as('dev').workloadSetCapacity({ hoursPerWeek: 20, skills: [{ name: 'Rust', level: 4 }], utilizationTarget: 80 });
  // The stored document has its _id and userId too; the report still reads it.
  assert.ok(W.WorkloadCapacities.docs[0]._id && W.WorkloadCapacities.docs[0].userId === 'dev');
  const mine = await as('dev').workloadMine();
  assert.deepEqual(mine.capacity.skills, [{ name: 'Rust', level: 4 }]);
  assert.equal(mine.capacity.utilizationTarget, 80);
  await as('pm').workloadAddAllocation('b1', { roleName: 'Systems', skill: 'rust', skillLevel: 3, start: today, end: addDays(today, 6), percent: 50 });
  const r = await as('dev').workloadReport({ from: today, weeks: 1 });
  const dev = r.people.find(p => p.userId === 'dev');
  assert.equal(dev.capacity.hoursPerWeek, 20, 'the person\'s own hours, not the default');
  assert.equal(dev.loggedHours, 8, 'b1 and b2');
  assert.equal(dev.billableHours, 6, 'b2\'s card is not billable');
  assert.equal(r.people.some(p => p.userId === 'stranger'), false);
  assert.deepEqual(r.placeholders[0].candidates.map(c => c.userId), ['dev']);
  assert.equal(r.allocations[0].skill, 'rust');
  await as('dev').workloadSetCapacity({ hoursPerWeek: 20 });
  assert.equal('utilizationTarget' in W.WorkloadCapacities.docs[0], false, 'no target is no field');
  await assert.rejects(as('dev').workloadSetCapacity({ skills: [{ name: 'Rust', level: 9 }] }), /1 to 5/);
});

test('a project manager sees the members of their boards, with their load from those boards', async () => {
  const { as } = load();
  const r = await as('pm').workloadReport(params);
  assert.deepEqual(r.people.map(p => p.userId).sort(), ['dev', 'pm', 'reader']);
  const dev = r.people.find(p => p.userId === 'dev');
  assert.equal(dev.weeks.reduce((s, w) => s + w.loadHours, 0), 10, 'only the card of the board they share');
  assert.equal(r.people.find(p => p.userId === 'pm').name, 'Pat Manager');
});

test('a person on two boards sees their load across both', async () => {
  const { as } = load();
  const r = await as('dev').workloadReport(params);
  const dev = r.people.find(p => p.userId === 'dev');
  assert.equal(dev.weeks.reduce((s, w) => s + w.loadHours, 0), 15);
  assert.deepEqual(r.boards.map(b => b._id).sort(), ['b1', 'b2']);
});

test("negative: a public board's members and cards are not in anybody else's report", async () => {
  const { as } = load();
  for (const viewer of ['pm', 'dev', 'dev2']) {
    const r = await as(viewer).workloadReport(params);
    assert.ok(!r.people.some(p => p.userId === 'stranger'), viewer);
    assert.ok(!r.boards.some(b => b._id === 'pub'), viewer);
  }
});

test('negative: an assigned-only member does not see the board, and an inactive member is not reported', async () => {
  const { as } = load();
  const r = await as('reader').workloadReport(params);
  assert.deepEqual(r.boards, []);
  assert.deepEqual(r.people, []);
  const pm = await as('pm').workloadReport(params);
  assert.ok(!pm.people.some(p => p.userId === 'gone'));
});

test('negative: nobody signed in gets nothing', async () => {
  const { as } = load();
  await assert.rejects(as(null).workloadReport(params), /not-authorized|not do that/);
  await assert.rejects(as(null).workloadMine(), /not-authorized|not do that/);
});

test('an administrator may ask for every board', async () => {
  const { as } = load();
  const r = await as('admin').workloadReport({ ...params, allBoards: true });
  assert.ok(r.people.some(p => p.userId === 'stranger'));
  const notAdmin = await as('pm').workloadReport({ ...params, allBoards: true });
  assert.ok(!notAdmin.people.some(p => p.userId === 'stranger'), 'allBoards means nothing to anybody else');
});

test("negative: somebody else's absence is dates only - no type, no note", async () => {
  const { as } = load();
  const r = await as('pm').workloadReport(params);
  const absence = r.absences.find(a => a.userId === 'dev');
  assert.deepEqual(Object.keys(absence).sort(), ['end', 'start', 'userId']);
  const own = (await as('dev').workloadReport(params)).absences.find(a => a.userId === 'dev');
  assert.equal(own.type, 'sick');
  assert.equal(own.note, 'flu');
  const admin = (await as('admin').workloadReport({ ...params, allBoards: true })).absences.find(a => a.userId === 'dev');
  assert.equal(admin.type, 'sick');
});

test('capacity and absences: your own, or anybody\'s for an administrator', async () => {
  const { as, W } = load();
  await as('dev').workloadSetCapacity({ hoursPerWeek: 30, workPercent: 60 });
  assert.equal((await W.WorkloadCapacities.findOneAsync({ userId: 'dev' })).workPercent, 60);
  await assert.rejects(as('pm').workloadSetCapacity({ hoursPerWeek: 1 }, 'dev'), /not do that/);
  await as('admin').workloadSetCapacity({ hoursPerWeek: 20 }, 'dev');
  assert.equal((await W.WorkloadCapacities.findOneAsync({ userId: 'dev' })).hoursPerWeek, 20);
  await assert.rejects(as('dev').workloadSetCapacity({ hoursPerWeek: 500 }), /between 0 and 168/);

  await assert.rejects(as('pm').workloadAddAbsence({ start: today, end: today }, 'dev'), /not do that/);
  await assert.rejects(as('pm').workloadRemoveAbsence('abs1'), /not do that/);
  assert.ok(await W.WorkloadAbsences.findOneAsync('abs1'), 'still there');
  await as('dev').workloadRemoveAbsence('abs1');
  assert.equal(await W.WorkloadAbsences.findOneAsync('abs1'), undefined);
});

test('holidays: administrators only', async () => {
  const { as, W } = load();
  await assert.rejects(as('pm').workloadAddHoliday({ date: today, name: 'x' }), /not do that/);
  const id = await as('admin').workloadAddHoliday({ date: today, name: 'Independence Day' });
  await assert.rejects(as('admin').workloadAddHoliday({ date: today }), /already a holiday/);
  await assert.rejects(as('dev').workloadRemoveHoliday(id), /not do that/);
  await as('admin').workloadRemoveHoliday(id);
  assert.equal(await W.WorkloadHolidays.countAsync ? (await W.WorkloadHolidays.find().countAsync()) : 0, 0);
});

test("allocations: a board's admins, for its active members or for a role", async () => {
  const { as, W } = load();
  const id = await as('pm').workloadAddAllocation('b1', { userId: 'dev', start: monday, end: monday, percent: 50 });
  assert.ok(id);
  await as('pm').workloadAddAllocation('b1', { roleName: 'Designer', start: monday, end: monday, percent: 100, headcount: 2 });
  await assert.rejects(as('dev').workloadAddAllocation('b1', { userId: 'dev', start: today, end: today, percent: 50 }), /not do that/,
    'a member who is not a board admin');
  await assert.rejects(as('pm').workloadAddAllocation('b1', { userId: 'stranger', start: today, end: today, percent: 50 }), /not a member/);
  await assert.rejects(as('pm').workloadAddAllocation('b1', { userId: 'gone', start: today, end: today, percent: 50 }), /not a member/);
  await assert.rejects(as('pm').workloadAddAllocation('b2', { roleName: 'X', start: today, end: today, percent: 10 }), /not do that/,
    "another board's");
  await assert.rejects(as('dev').workloadRemoveAllocation(id), /not do that/);
  const r = await as('pm').workloadReport(params);
  assert.equal(r.people.find(p => p.userId === 'dev').weeks.some(w => w.allocationPercent > 0), true);
  assert.equal(r.placeholders[0].roleName, 'Designer');
  await as('pm').workloadRemoveAllocation(id);
  assert.equal((await W.WorkloadAllocations.find({ userId: 'dev' }).fetchAsync()).length, 0);
});

test('negative: every method refuses a caller who is not signed in', async () => {
  const { as, methods } = load();
  for (const name of Object.keys(methods)) {
    await assert.rejects(as(null)[name]({}, {}), /not do that|not-authorized/, name);
  }
});

test('negative: with the Workload feature off, every method refuses, administrators too', async () => {
  const { as, methods } = load({ featureOn: false });
  assert.ok(Object.keys(methods).length >= 9);
  for (const name of Object.keys(methods)) {
    await assert.rejects(as('admin')[name]({ from: today, weeks: 1 }, {}), /turned off/, name);
  }
  const src = fs.readFileSync(path.join(ROOT, 'server/workload.js'), 'utf8');
  const bodies = src.split(/\n  async workload/).slice(1);
  assert.equal(bodies.length, Object.keys(methods).length);
  for (const body of bodies) assert.match(body.slice(0, body.indexOf('\n  },')), /await signedIn\(this\.userId\)/);
});

test('a report asked for mid-week reads the absences and holidays of that whole week', async () => {
  const { as, W } = load();
  const wednesday = addDays(monday, 2);
  W.WorkloadAbsences.docs.push({ _id: 'mon', userId: 'dev', start: monday, end: monday, type: 'vacation' });
  W.WorkloadHolidays.docs.push({ _id: 'h', date: addDays(monday, 1), name: 'x' });
  const r = await as('pm').workloadReport({ from: wednesday, weeks: 1 });
  assert.equal(r.from, monday);
  const week = r.people.find(p => p.userId === 'dev').weeks[0];
  assert.equal(week.absentDays, 1);
  assert.equal(week.holidayDays, 1);
  assert.equal(week.capacityHours, 22.5);
});

test("a deleted user's working time, absences and allocations are removed with them", async () => {
  const { as, W, removeHooks } = load();
  await as('dev').workloadSetCapacity({ hoursPerWeek: 30 });
  await as('pm').workloadAddAllocation('b1', { userId: 'dev', start: monday, end: monday, percent: 50 });
  await as('pm').workloadSetCapacity({ hoursPerWeek: 20 });
  assert.equal(removeHooks.length, 1);
  await removeHooks[0]('admin', { _id: 'dev' });
  for (const c of ['WorkloadCapacities', 'WorkloadAbsences', 'WorkloadAllocations']) {
    assert.equal((await W[c].find({ userId: 'dev' }).fetchAsync()).length, 0, c);
  }
  assert.equal((await W.WorkloadCapacities.find({ userId: 'pm' }).fetchAsync()).length, 1, 'nobody else');
  await removeHooks[0]('admin', { _id: { $ne: null } });
  assert.equal((await W.WorkloadCapacities.find({}).fetchAsync()).length, 1, 'negative: a selector is not an id');
});

test('negative: no client may write the collections, and nothing publishes them', () => {
  const model = fs.readFileSync(path.join(ROOT, 'models/workload.js'), 'utf8');
  assert.match(model, /collection\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\);/);
  assert.doesNotMatch(model, /\.allow\(/);
  const found = require('node:child_process').spawnSync('git', ['grep', '-l', '-E', 'Meteor\\.publish[^\\n]*[Ww]orkload', '--', 'server', 'models'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(found.stdout.trim(), '', 'no workload publication');
});

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    console.log('  ok -', name);
  }
  console.log(`\nworkloadAccess: ${tests.length} tests passed`);
})().catch(e => { console.error(e); process.exitCode = 1; });
