'use strict';
// Durable rule sortList (server/lib/syncRuleSortListCommand.js).
// Run: node tests/syncRuleSortListCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const S = require('../server/lib/syncRuleSortListCommand');
const { sortListOrder } = require('../models/lib/ruleSortList');
const { positionChange } = require('../models/lib/timeHistory');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

const ROOT = path.join(__dirname, '..');
async function fixture(action) {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'c1', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', actionType: 'sortList', ...action }) });
  f.cards = [
    { _id: 'c1', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'Charlie', sort: 0 },
    { _id: 'c2', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'alpha', sort: 1 },
    { _id: 'c3', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'Bravo', sort: 2 },
  ];
  f.context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  f.prepare = over => S.prepareRuleSortListCommand({ ...f.context, listId: 'list', swimlaneId: 'lane', cards: f.cards,
    sortField: action.sortField, createdAt: new Date(1000), ...over });
  return f;
}

test('the order is the ordinary action\'s, and only the cards whose sort changes are units', async () => {
  const f = await fixture({ sortField: 'name' });
  assert.deepEqual(sortListOrder(f.cards, 'name').map(c => c._id), ['c2', 'c3', 'c1']);
  const command = f.prepare();
  assert.deepEqual(command.units.map(u => [u.cardId, u.before, u.after]), [['c2', 1, 0], ['c3', 2, 1], ['c1', 0, 2]]);
  // Each unit records the hook's position row for that card.
  const [row] = command.units[0].history.rows;
  const at = { boardId: 'board', swimlaneId: 'lane', listId: 'list', sort: 1, lastMoveReason: '' };
  const hook = positionChange(at, { ...at, sort: 0 }, ['sort']);
  assert.deepEqual([row.group, row.entityId, row.previousContent, row.newContent], ['position', 'c2', hook.previousContent, hook.newContent]);
  assert.deepEqual(S.validateRuleSortListCommand(command, f.context), command);
  // Already sorted: nothing to write.
  const sorted = await fixture({ sortField: 'name' });
  sorted.cards = sortListOrder(sorted.cards, 'name').map((c, i) => ({ ...c, sort: i }));
  assert.deepEqual(sorted.prepare().units, []);
  // Due date is the default; cards without one go last.
  const due = await fixture({});
  due.cards[0].dueAt = new Date(5);
  assert.equal(due.prepare().units.find(u => u.cardId === 'c1')?.after ?? 0, 0);
});

test('negative: foreign cards, tampered units and other actions are refused', async () => {
  const f = await fixture({ sortField: 'name' });
  assert.throws(() => f.prepare({ cards: [...f.cards, { _id: 'x', boardId: 'other', listId: 'list' }] }), /invalid/);
  assert.throws(() => f.prepare({ cards: [...f.cards, { _id: 'x', boardId: 'board', listId: 'elsewhere' }] }), /invalid/);
  const command = f.prepare();
  const resum = row => { const { checksum, ...content } = row; return { ...content, checksum: sha256(canonical(content)) }; };
  assert.throws(() => S.validateRuleSortListCommand(resum({ ...command,
    units: [{ ...command.units[0], after: 9 }, ...command.units.slice(1)] }), f.context), /command-invalid/);
  assert.throws(() => S.validateRuleSortListCommand(resum({ ...command,
    units: [command.units[0], command.units[0]] }), f.context), /command-invalid/);
  assert.throws(() => S.validateRuleSortListCommand({ ...command, listId: 'other' }, f.context), /command-invalid/);
  const other = await fixture({ actionType: 'setColor' });
  assert.throws(() => other.prepare(), /invalid/);
  assert.deepEqual(S.unitSelector(command, command.units[0], null).sort, null);
});

test('wiring: durable, registered, and one sort order for both paths', () => {
  const { DURABLE_RULE_ACTIONS } = require('../server/lib/listSyncSteps');
  assert.ok(DURABLE_RULE_ACTIONS.has('sortList'));
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  assert.match(plans, /sortList: \(\{ invocation \}\) => runStoredSyncRuleSortList\(/);
  assert.match(plans, /kinds: \['history', 'position'\] \},\s*\(\) => Cards\.updateAsync\(ruleSortListSelector\(command, unit, unit\.before\), \{ \$set: \{ sort: unit\.after \} \}\)/);
  const rules = fs.readFileSync(path.join(ROOT, 'server/rulesHelper.js'), 'utf8');
  assert.match(rules, /const sorted = sortListOrder\(cards, action\.sortField\);/);
  assert.ok(!/case 'modified': return c\.modifiedAt/.test(rules), 'no second copy of the sort keys (negative)');
});
