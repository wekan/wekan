'use strict';

// #6798: accounts were disabled for ordinary work on their own board.
// - A Worker moving a card (#3189) or ticking a checklist item (#3307) is
//   ALLOWED, but canUpdateCard and the checklist item rule asked
//   canEditCardOrLinkedCard FIRST, which recorded authz.linked-write (high,
//   blocked) before the Worker carve-out allowed it - and that record disables
//   the account (server/lib/blockOnSecurityEvent.js).
// - A read-only or comment-only member whose screen still offered an edit was
//   refused with the same record, and was disabled too.
// Now the first ask records nothing, a refusal after the carve-outs is still
// recorded, and authz.linked-write never disables an account.
// Run: node tests/workerNoSelfBlock.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { categoryFor } = require('../models/lib/securityCategories.js');

const pending = [];
let passed = 0;
function test(name, fn) {
  pending.push(Promise.resolve().then(fn).then(() => { passed += 1; console.log('  ok -', name); }));
}

function cutFunction(src, start) {
  const at = src.indexOf(start);
  assert.notStrictEqual(at, -1, start);
  let depth = 0;
  for (let i = src.indexOf('{', src.indexOf(')', at)); i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}' && --depth === 0) return src.slice(at, i + 1);
  }
  throw new Error(start);
}

// The general check, standing in for linkedCardPermission.js: refuses a member
// without write, and records only when asked to.
function stubs({ writes, worker }) {
  const recorded = [];
  return {
    recorded,
    canEditCardOrLinkedCard: async (userId, card, board, { recordDenial = true } = {}) => {
      if (writes) return true;
      if (recordDenial) recorded.push('authz.linked-write');
      return false;
    },
    Boards: { findOneAsync: async () => ({ hasWorker: () => worker }) },
    Cards: { findOneAsync: async () => ({ _id: 'c1', boardId: 'b1' }) },
  };
}

const cardsSrc = read('server/permissions/cards.js');
const canUpdateCardSrc = cutFunction(cardsSrc, 'export const canUpdateCard = async function(userId, doc, fields, modifier) {')
  .replace('export const canUpdateCard = ', '');
function canUpdateCardWith(env) {
  return vm.runInNewContext(`(${canUpdateCardSrc})`, {
    ...env,
    tripCanary: () => false,
    workerMayUpdateCard: (userId, modifier) => !!(modifier && modifier.$set && 'listId' in modifier.$set),
  });
}

const checklistSrc = read('server/permissions/checklistItems.js');
const updateRuleSrc = cutFunction(checklistSrc, 'async update(userId, doc, fieldNames, modifier) {')
  .replace('async update(', 'async function update(');
function checklistUpdateWith(env) {
  return vm.runInNewContext(`(${updateRuleSrc})`, {
    ...env,
    workerMayToggleChecklistItem: (userId, modifier) => !!(modifier && modifier.$set && 'isFinished' in modifier.$set),
  });
}

test('a Worker moving a card is allowed, and nothing is recorded against them', async () => {
  const env = stubs({ writes: false, worker: true });
  const allowed = await canUpdateCardWith(env)('w1', { boardId: 'b1' }, ['listId'], { $set: { listId: 'l2' } });
  assert.strictEqual(allowed, true);
  assert.deepStrictEqual(env.recorded, []);
});

test('a Worker ticking a checklist item is allowed, and nothing is recorded', async () => {
  const env = stubs({ writes: false, worker: true });
  const allowed = await checklistUpdateWith(env)('w1', { cardId: 'c1', boardId: 'b1' }, ['isFinished'], { $set: { isFinished: true } });
  assert.strictEqual(allowed, true);
  assert.deepStrictEqual(env.recorded, []);
});

test('negative: a Worker editing a title, or a comment-only member editing, is refused and still recorded', async () => {
  for (const worker of [true, false]) {
    const env = stubs({ writes: false, worker });
    assert.strictEqual(await canUpdateCardWith(env)('u1', { boardId: 'b1' }, ['title'], { $set: { title: 'x' } }), false);
    assert.deepStrictEqual(env.recorded, ['authz.linked-write'], `worker=${worker}`);
    const env2 = stubs({ writes: false, worker });
    assert.strictEqual(await checklistUpdateWith(env2)('u1', { cardId: 'c1', boardId: 'b1' }, ['title'], { $set: { title: 'x' } }), false);
    assert.deepStrictEqual(env2.recorded, ['authz.linked-write']);
  }
});

test('a member who writes is allowed by the first ask, recording nothing', async () => {
  const env = stubs({ writes: true, worker: false });
  assert.strictEqual(await canUpdateCardWith(env)('m1', { boardId: 'b1' }, ['title'], { $set: { title: 'x' } }), true);
  assert.deepStrictEqual(env.recorded, []);
});

test('authz.linked-write never disables an account, and is still recorded as blocked', () => {
  const entry = categoryFor('authz.linked-write');
  assert.strictEqual(entry.blocksAccount, false);
  assert.strictEqual(entry.severity, 'high');
  assert.strictEqual(entry.bleed, 'LinkedWriteBleed');
  // server/lib/blockOnSecurityEvent.js's own decision.
  const src = read('server/lib/blockOnSecurityEvent.js');
  const decide = new Function('categoryFor', `${src.match(/const BLOCKING_ACTIONS[\s\S]*?\nexport function shouldBlockAccount[\s\S]*?\n\}/)[0].replace('export function', 'function')}; return shouldBlockAccount;`)(categoryFor);
  assert.strictEqual(decide({ key: 'authz.linked-write', action: 'blocked', severity: 'high', userId: 'u1' }), false);
});

test('negative: no rule with a Worker carve-out records a denial before the carve-out', () => {
  // The shape of the fault: a function that consults workerMay* after a
  // canEditCardOrLinkedCard call that records.
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.npm', '_build', '.build', 'tests'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { walk(rel); continue; }
      if (!/\.(c?m?js)$/.test(e.name)) continue;
      const src = read(rel);
      for (const m of src.matchAll(/\bworkerMay\w+\(/g)) {
        const before = src.slice(Math.max(0, src.lastIndexOf('async ', m.index)), m.index);
        const calls = [...before.matchAll(/canEditCardOrLinkedCard\(([^;]*?)\)\)/g)].map(c => c[1]);
        if (calls.some(args => !/recordDenial: false/.test(args))) offenders.push(`${rel}: ${m[0]}`);
      }
    }
  };
  ['server', 'models'].forEach(walk);
  assert.deepStrictEqual(offenders, []);
});

Promise.all(pending).then(() => console.log(`\n${passed} passed`), (error) => {
  console.error(error);
  process.exit(1);
});
