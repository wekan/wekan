'use strict';

// RulesBleed (SnowBleed sub-finding 14, reported 2026-01-05 by Joshua Rogers
// of Aisle Research, fixed in WeKan v8.21 by commit a787bcddf3): the rules
// publications of server/publications/rules.js published to ANY subscriber -
// signed in or not - a rule by id ('rules'), and every rule, trigger and
// action of every board on the instance ('allRules', 'allTriggers',
// 'allActions', 'rulesReport'). Rules carry board ids, list and swimlane
// names, label ids, e-mail addresses and webhook-like actions of private
// boards. Now 'rules' publishes only to a signed-in caller who can see the
// rule's board, the instance-wide ones only to a site admin. The later
// 'boardRules' publication and the getRulesReportCount method follow the same
// rule, and are pinned here too.
//
// The test runs the real publications against stubs. The negative test pins
// that every publication of the file guards before it reads, and that no
// other publication in the tree publishes rules, triggers or actions.
//
// Not recorded in Admin Panel / Problems: this fix predates the Problems log;
// it was audited 2026-10-27 and is unchanged. A refused subscription is
// answered ready-and-empty, as before.
// Run: node tests/rulesBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

class MeteorError extends Error {
  constructor(error, reason) { super(reason || error); this.error = error; }
}

const src = read('server/publications/rules.js');
const reads = [];
const cursor = name => (...args) => { reads.push(name); return { name, args, countAsync: async () => 0 }; };
const boards = {
  priv: { _id: 'priv', isVisibleBy: user => !!user && user._id === 'member' },
};
const users = { admin: { _id: 'admin', isAdmin: true }, member: { _id: 'member' }, outsider: { _id: 'outsider' } };
const publications = {};
let methods;
vm.runInNewContext(src.replace(/^import .*;$/gm, ''), {
  check() {},
  Match: { OneOf: () => null },
  Meteor: {
    Error: MeteorError,
    publish: (name, fn) => { publications[name] = fn; },
    methods: m => { methods = m; },
  },
  ReactiveCache: {
    getRule: async id => (id === 'rule' ? { _id: 'rule', boardId: 'priv' } : null),
    getBoard: async id => boards[id] || null,
    getUser: async id => users[id] || null,
    getRules: async (...args) => { reads.push('getRules'); return args[2] ? cursor('rulesCursor')() : []; },
    getTriggers: async () => { reads.push('getTriggers'); return []; },
    getActions: async () => { reads.push('getActions'); return []; },
    getBoards: async () => { reads.push('getBoards'); return []; },
  },
  Rules: { find: cursor('Rules') },
  Triggers: { find: cursor('Triggers') },
  Actions: { find: cursor('Actions') },
  Boards: {},
  publishReportPage: () => {},
  ruleActionIds: () => [],
  ruleTriggerIds: () => [],
});

// A minimal subscription context.
const sub = userId => ({ userId, readied: 0, added: [], ready() { this.readied += 1; return 'ready'; }, added(...a) { this.added.push(a); } });
const subscribe = async (name, userId, ...args) => {
  const ctx = sub(userId);
  reads.length = 0;
  const ret = await publications[name].apply(ctx, args);
  return { ctx, ret, reads: reads.slice() };
};
const adminOnly = [['allRules'], ['allTriggers'], ['allActions'], ['rulesReport', '', 10, 0]];

test('the file publishes what this test covers', () => {
  assert.deepStrictEqual(Object.keys(publications).sort(),
    ['allActions', 'allRules', 'allTriggers', 'boardRules', 'rules', 'rulesReport']);
});

test('the attack: a private board\'s rule, by id or by board - nothing for an anonymous or outside subscriber', async () => {
  for (const userId of [null, 'outsider']) {
    for (const [name, arg] of [['rules', 'rule'], ['boardRules', 'priv']]) {
      const { ctx, ret, reads: r } = await subscribe(name, userId, arg);
      assert.strictEqual(ret, 'ready', `${name} as ${userId}`);
      assert.strictEqual(ctx.readied, 1);
      assert.deepStrictEqual(r, [], `${name} as ${userId}: nothing read`);
    }
  }
});

test('the attack: every rule, trigger and action of the instance - nothing for a non-admin', async () => {
  for (const userId of [null, 'member', 'outsider']) {
    for (const [name, ...args] of adminOnly) {
      const { ret, reads: r } = await subscribe(name, userId, ...args);
      assert.strictEqual(ret, 'ready', `${name} as ${userId}`);
      assert.deepStrictEqual(r, [], `${name} as ${userId}: nothing read`);
    }
  }
  for (const userId of [null, 'member']) {
    await assert.rejects(methods.getRulesReportCount.call({ userId }, ''), e => e.error === 'not-authorized');
  }
});

test('negative: a member gets the board\'s rules, an admin the instance\'s', async () => {
  const one = await subscribe('rules', 'member', 'rule');
  assert.deepStrictEqual(one.reads, ['getRules', 'rulesCursor']);
  const board = await subscribe('boardRules', 'member', 'priv');
  assert.strictEqual(board.ret.map(c => c.name).join(), 'Rules,Triggers,Actions');
  for (const [name, ...args] of adminOnly) {
    const { reads: r } = await subscribe(name, 'admin', ...args);
    assert.ok(r.length > 0, `${name}: the admin is served`);
  }
  assert.strictEqual(await methods.getRulesReportCount.call({ userId: 'admin' }, ''), 0);
});

// Negative, whole tree: every publication of rules.js refuses before it reads,
// and nothing else publishes the three collections.
test('negative: no rules publication reads before its guard, here or elsewhere', () => {
  const heads = [...src.matchAll(/Meteor\.publish\('(\w+)'/g)];
  for (let i = 0; i < heads.length; i += 1) {
    const body = src.slice(heads[i].index, i + 1 < heads.length ? heads[i + 1].index : src.length);
    const guard = body.search(/if \(!this\.userId( \|\| !\(await ReactiveCache\.getUser\(this\.userId\)\)\.isAdmin)?\) \{\s*return this\.ready\(\);/);
    const firstRead = body.search(/getRules\(|getTriggers\(|getActions\(|Rules\.find\(|Triggers\.find\(|Actions\.find\(/);
    assert.ok(guard >= 0 && firstRead > guard, `${heads[i][1]}: guarded before it reads`);
    if (!/isAdmin/.test(body.slice(guard, firstRead))) {
      assert.match(body.slice(guard, firstRead), /if \(!board \|\| !board\.isVisibleBy\(\{ _id: this\.userId \}\)\) \{\s*return this\.ready\(\);/,
        `${heads[i][1]}: board visibility checked`);
    }
  }
  const skip = new Set(['node_modules', '_build', '.build', '.tools', '.git', 'tests', '.meteor', 'client']);
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    if (skip.has(entry.name)) return [];
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : /\.(c|m)?js$/.test(entry.name) ? [rel] : [];
  });
  for (const file of ['server', 'models', 'packages', 'imports'].flatMap(walk)) {
    if (file === path.join('server', 'publications', 'rules.js')) continue;
    const text = read(file);
    if (!/Meteor\.publish\(/.test(text)) continue;
    assert.doesNotMatch(text, /\b(Rules|Triggers|Actions)\.find\(|ReactiveCache\.get(Rules|Triggers|Actions)\(/,
      `${file} publishes rules outside server/publications/rules.js`);
  }
});

let finished = false;
// A test whose promise never settles would otherwise end the run silently.
process.on('beforeExit', () => { if (!finished) { console.error('rulesBleed: a test never settled'); process.exit(1); } });
(async () => {
  console.log('rulesBleed:');
  for (const [name, fn] of pending) {
    await fn();
    console.log('  ok -', name);
  }
  console.log(`\nrulesBleed: ${pending.length} tests passed`);
  finished = true;
})().catch(e => { console.error(e); process.exit(1); });
