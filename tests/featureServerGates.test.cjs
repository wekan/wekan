'use strict';

// Admin Panel / Settings / Features: an unticked feature is refused on the
// SERVER, not only hidden (models/lib/featureServerGates.js,
// docs/Features/Admin-Panel/Settings-Enforced-On-Server.md).
// Run: node tests/featureServerGates.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const gates = require('../models/lib/featureServerGates');
const { FEATURE_KEYS } = require('../models/lib/instanceFeatures');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The text of the block that opens at the first `{` from `from`, braces
// matched outside strings, template literals and comments.
function blockAt(src, from) {
  const open = src.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === '\'' || c === '"' || c === '`') {
      for (i += 1; i < src.length && src[i] !== c; i += 1) if (src[i] === '\\') i += 1;
      continue;
    }
    if (c === '{') depth += 1;
    if (c === '}') { depth -= 1; if (depth === 0) return src.slice(open, i + 1); }
  }
  throw new Error('unbalanced block');
}

// Every Meteor method (two-space-indented `async name(` / `async 'name'(`)
// and every publication of a file, with its body.
function serverPathsOf(src) {
  const out = [];
  for (const m of src.matchAll(/^ {2}async '?([\w.]+)'?\s*\(/gm)) {
    out.push({ kind: 'method', name: m[1], body: blockAt(src, src.indexOf(')', m.index)) });
  }
  for (const m of src.matchAll(/Meteor\.publish\('([\w.]+)',\s*async function[^(]*\(/g)) {
    out.push({ kind: 'publication', name: m[1], body: blockAt(src, src.indexOf(')', m.index)) });
  }
  return out;
}

// The file-local helpers that ask featureOnFor(…, key), e.g. workload's signedIn.
function gateHelpersOf(src, key) {
  const names = [];
  for (const m of src.matchAll(/^(?:async )?function (\w+)\s*\(/gm)) {
    const body = blockAt(src, src.indexOf(')', m.index));
    if (body.includes(`featureOnFor(`) && body.includes(`'${key}'`)) names.push(m[1]);
  }
  return names;
}

test('turning a flow policy ON is a feature write; turning it off never is', () => {
  assert.deepStrictEqual(gates.boardWriteFeatures({ $set: { allowsListPolicies: true } }), ['list-policies']);
  assert.deepStrictEqual(gates.boardWriteFeatures({ $set: { personWipLimit: 3, commitmentListId: 'l1' } }).sort(),
    ['commitment-point', 'person-wip-limit']);
  assert.deepStrictEqual(gates.boardWriteFeatures({ $set: { allowsSplitLists: true, title: 'x' } }), ['split-lists']);
  assert.deepStrictEqual(gates.boardWriteFeatures({ $rename: { other: 'commitmentListId' } }), ['commitment-point']);
  assert.deepStrictEqual(gates.listWriteFeatures({ $set: { policy: 'Done when tested' } }), ['list-policies']);
  assert.deepStrictEqual(gates.listWriteFeatures({ $set: { split: true } }), ['split-lists']);
});

test('negative: cleanup and unrelated writes are never refused', () => {
  assert.deepStrictEqual(gates.boardWriteFeatures({ $set: { allowsListPolicies: false, allowsSplitLists: false } }), []);
  assert.deepStrictEqual(gates.boardWriteFeatures({ $unset: { commitmentListId: '', personWipLimit: '' } }), []);
  assert.deepStrictEqual(gates.boardWriteFeatures({ $set: { title: 'Board', color: 'red' } }), []);
  assert.deepStrictEqual(gates.listWriteFeatures({ $unset: { policy: '', split: '' } }), []);
  assert.deepStrictEqual(gates.listWriteFeatures({ $set: { policy: '' } }), []);
  for (const junk of [null, undefined, 'x', 1, [], { $set: null }]) {
    assert.deepStrictEqual(gates.boardWriteFeatures(junk), []);
    assert.deepStrictEqual(gates.listWriteFeatures(junk), []);
  }
});

test('every catalog feature is decided: server paths, write gates, or display only with a reason', () => {
  const decided = new Map();
  const mark = (key, where) => {
    assert.ok(!decided.has(key), `${key} is both ${decided.get(key)} and ${where}`);
    decided.set(key, where);
  };
  gates.SERVER_PATHS.forEach(entry => mark(entry.key, 'SERVER_PATHS'));
  gates.WRITE_GATED.forEach(key => mark(key, 'WRITE_GATED'));
  Object.entries(gates.DISPLAY_ONLY).forEach(([key, reason]) => {
    assert.ok(typeof reason === 'string' && reason.length >= 25, `${key}: give the reason it is display only`);
    mark(key, 'DISPLAY_ONLY');
  });
  const unknown = [...decided.keys()].filter(key => !FEATURE_KEYS.includes(key));
  assert.deepStrictEqual(unknown, [], 'not catalog features');
  const undecided = FEATURE_KEYS.filter(key => !decided.has(key));
  assert.deepStrictEqual(undecided, [],
    'a new Admin Panel / Settings / Features entry must say what the server refuses for it '
    + '(models/lib/featureServerGates.js SERVER_PATHS / WRITE_GATED / DISPLAY_ONLY)');
});

for (const entry of gates.SERVER_PATHS.filter(e => e.key !== 'views-scrum')) {
  test(`${entry.key}: every method and publication of ${entry.file} asks the gate (negative, whole file)`, () => {
    const src = read(entry.file);
    const paths = serverPathsOf(src);
    assert.ok(paths.length > 0, `${entry.file} has server paths`);
    const helpers = gateHelpersOf(src, entry.key);
    const exempt = entry.exempt || {};
    const missing = [];
    for (const p of paths) {
      if (exempt[p.name]) continue;
      const direct = new RegExp(`(?:requireFeature|featureAllowed|featureOnFor)\\([^)]*'${entry.key}'`).test(p.body);
      const viaHelper = helpers.some(name => new RegExp(`\\b${name}\\(`).test(p.body));
      if (!direct && !viaHelper) missing.push(`${p.kind} ${p.name}`);
    }
    assert.deepStrictEqual(missing, [], `these ${entry.key} paths do not ask the feature gate`);
    for (const name of Object.keys(exempt)) {
      assert.ok(paths.some(p => p.name === name), `${name} is exempt but not in ${entry.file}`);
    }
  });
}

test('the gate never comes before an argument check (audit-argument-checks counts only checks before the first await)', () => {
  const late = [];
  for (const entry of gates.SERVER_PATHS) {
    for (const p of serverPathsOf(read(entry.file))) {
      const at = p.body.search(/await (?:requireFeature|featureAllowed)\(/);
      if (at >= 0 && /\bcheck\(/.test(p.body.slice(at))) late.push(`${entry.file} ${p.name}`);
    }
  }
  assert.deepStrictEqual(late, []);
});

test('views-scrum: every Scrum method is wrapped by the gate unless exempt with a reason', () => {
  const src = read('server/scrum.js');
  const entry = gates.SERVER_PATHS.find(e => e.key === 'views-scrum');
  const wrap = src.indexOf("const scrumGate = require('/models/lib/featureServerGates').SERVER_PATHS.find(entry => entry.key === 'views-scrum');");
  assert.ok(wrap > 0, 'the Scrum methods are wrapped');
  assert.ok(wrap < src.indexOf('Meteor.methods(methods);'), 'before they are registered');
  assert.match(src, /if \(Object\.prototype\.hasOwnProperty\.call\(scrumGate\.exempt, name\)\) continue;/);
  assert.match(src, /check\(args, \[Match\.Any\]\);\n\s*await requireFeature\(this\.userId, 'views-scrum', `ddp:\$\{name\}`\);/);
  const methods = serverPathsOf(src).map(p => p.name);
  for (const [name, reason] of Object.entries(entry.exempt)) {
    assert.ok(methods.includes(name), `${name} is exempt but not a Scrum method`);
    assert.ok(reason.length >= 25, `${name}: give the reason`);
  }
  // The sprint lifecycle is the Scrum view's own: never exempt.
  for (const name of ['scrum.startSprint', 'scrum.closeSprint', 'scrum.cancelSprint', 'scrum.getDailyHistory',
    'scrum.getScopeHistory', 'scrum.importIntoBoard']) {
    assert.ok(!entry.exempt[name], `${name} must be gated`);
  }
});

test('setBoardView refuses a board view whose feature is off', () => {
  const users = read('server/models/users.js');
  const start = users.indexOf('  async setBoardView(view, boardId) {');
  const body = blockAt(users, users.indexOf(')', start));
  assert.ok(body.indexOf('isBoardViewAvailable(') < body.indexOf('user.setBoardView('));
  assert.match(body, /key: 'authz\.disabled-setting', action: 'blocked', source: 'ddp:setBoardView'/);
});

test('the flow policies: Boards and Lists deny turning them on, setCardFlow refuses Done here', () => {
  assert.match(read('server/permissions/boards.js'), /boardWriteFeatures\(modifier\);[\s\S]*deniedByOffFeatures\(userId, keys, 'ddp:boards\.update-flow-policy'\)/);
  assert.match(read('server/permissions/lists.js'), /listWriteFeatures\(modifier\);[\s\S]*deniedByOffFeatures\(userId, keys, 'ddp:lists\.update-flow-policy'\)/);
  assert.match(read('server/lib/cardFlowMethod.js'), /requireFeature\(userId, 'split-lists', 'ddp:setCardFlow-splitDone'\)/);
});

test('the gate records an attempt, refuses with feature-disabled, and leaves logged-out calls to their own check', () => {
  const src = read('server/lib/assistGate.js');
  const allowed = blockAt(src, src.indexOf(')', src.indexOf('export async function featureAllowed(')));
  assert.match(allowed, /if \(!userId\) return true;/);
  assert.match(allowed, /key: 'authz\.disabled-setting', action: 'blocked', source, userId/);
  assert.match(src, /throw new Meteor\.Error\(FEATURE_DISABLED\.error, FEATURE_DISABLED\.reason\)/);
  assert.strictEqual(gates.FEATURE_DISABLED.error, 'feature-disabled');
});

test('Scrum settings in Board Settings follow the Scrum views tick', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  assert.match(jade, /if allowFeature 'views-scrum'\n\s+ul\.pop-over-list\n\s+li\n\s+a\.js-open-board-scrum-settings/);
});

console.log(`\nfeatureServerGates: ${passed} passed`);
