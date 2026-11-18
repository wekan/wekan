'use strict';
// Decided 2026-11-18 (TODO.md): a rule action that would write into a list
// refusing the triggering user's role (#4527) is skipped; the rest of the rule
// runs, and the skip shows in Admin Panel -> Problems as ListLockRule
// (detected, low). Before, rule actions checked only board write access.
// Run: node --test tests/listLockRules.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { exceptionFor } = require('../models/lib/listPermissions');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const board = { _id: 'b', permission: 'private',
  members: [{ userId: 'owner', isActive: true, isAdmin: true }, { userId: 'member', isActive: true }] };
const lists = {
  locked: { _id: 'locked', boardId: 'b', roleExceptions: { normal: { write: false } } },
  open: { _id: 'open', boardId: 'b' },
};
const listException = async (userId, b, listId, capability) => {
  const list = lists[listId];
  return list && b && list.boardId === b._id ? exceptionFor(b, list, userId, capability) : undefined;
};

function helper(records) {
  const source = read('server/rulesHelper.js');
  const object = source.slice(source.indexOf('export const RulesHelper = ') + 'export const RulesHelper = '.length).trim().replace(/;$/, '');
  return vm.runInNewContext(`(${object})`, {
    ReactiveCache: { getBoard: async id => (id === 'b' ? board : null), getCard: async () => null },
    require: name => {
      if (name === '/server/lib/listPermissionGate') return { listException };
      if (name === '/server/lib/securityLog') return { record: e => records.push(e) };
      throw new Error(name);
    },
    console,
  });
}

test('an action into a refusing list is skipped and shows in Problems', async () => {
  const records = [];
  const h = helper(records);
  const activity = { userId: 'member', boardId: 'b' };
  assert.strictEqual(await h.ruleListRefuses(activity, { actionType: 'archive' }, 'b', ['locked']), true);
  assert.deepStrictEqual(records.map(r => [r.key, r.action, r.source, r.userId]),
    [['authz.rule-list-locked', 'detected', 'rule:archive', 'member']]);
});

test('negative: an open list, the board admin and a scheduled run with no member pass, unrecorded', async () => {
  const records = [];
  const h = helper(records);
  assert.strictEqual(await h.ruleListRefuses({ userId: 'member' }, { actionType: 'archive' }, 'b', ['open', null]), false);
  assert.strictEqual(await h.ruleListRefuses({ userId: 'owner' }, { actionType: 'archive' }, 'b', ['locked']), false);
  assert.strictEqual(await h.ruleListRefuses({ userId: '*' }, { actionType: 'archive' }, 'b', ['locked']), false);
  assert.deepStrictEqual(records, []);
});

test('copyRuleCard asks the destination list and copies nothing into a refusing one', async () => {
  const src = read('server/lib/ruleCopyCard.js')
    .replace("import { AsyncLocalStorage } from 'node:async_hooks';", "const { AsyncLocalStorage } = require('node:async_hooks');")
    .replace('export async function', 'async function');
  // eslint-disable-next-line no-new-func
  const copyRuleCard = new Function('require', `${src}\nreturn copyRuleCard;`)(require);
  const copies = [];
  const card = { _id: 'c', boardId: 'b', archived: false, getSort: async () => 0, copy: async (...a) => { copies.push(a); return 'new'; } };
  const cache = { getCard: async () => card, getBoard: async () => board,
    getList: async id => lists[id], getSwimlane: async () => ({ _id: 's', boardId: 'b' }) };
  const activity = { cardId: 'c', boardId: 'b', userId: 'member' };
  const run = (listId, listWritable) => copyRuleCard({ activity, action: { _id: listId, listId, swimlaneId: 's' },
    cache, canWrite: () => true, listWritable });
  assert.strictEqual(await run('locked', async (b, listId) => (await listException('member', b, listId, 'write')) !== false), null);
  assert.deepStrictEqual(copies, []);
  assert.strictEqual(await run('open', async () => true), 'new');
  assert.strictEqual(copies.length, 1);
});

test('every list-writing rule action asks before it writes', () => {
  const src = read('server/rulesHelper.js');
  const perform = src.slice(src.indexOf('  async performAction('));
  const branch = type => perform.slice(perform.indexOf(`action.actionType === '${type}'`), perform.indexOf(`action.actionType === '${type}'`) + 1400);
  const pairs = [
    ['moveCardToTop', 'ruleListRefuses(', 'card.move('],
    ['archive', 'ruleListRefuses(', 'card.archive()'],
    ['createCard', 'ruleListRefuses(', 'Cards.insertAsync('],
    ['linkCard', 'ruleListRefuses(', 'card.link('],
    ['sortList', 'ruleListRefuses(', 'Cards.updateAsync('],
    ['moveAllCardsInList', 'ruleListRefuses(', 'c.move('],
  ];
  for (const [type, guard, write] of pairs) {
    const body = branch(type);
    assert.ok(body.indexOf(guard) >= 0 && body.indexOf(guard) < body.indexOf(write), `${type}: asks before ${write}`);
  }
  assert.match(src, /copyRuleCard\(\{[^}]*listWritable: async \(board, listId\) => !\(await this\.ruleListRefuses\(/);
  assert.match(read('models/lib/securityCategories.js'),
    /'authz\.rule-list-locked': \{ category: 'authz', bleed: 'ListLockRule', severity: 'low', cwe: 'CWE-863', blocksAccount: false \}/);
});
