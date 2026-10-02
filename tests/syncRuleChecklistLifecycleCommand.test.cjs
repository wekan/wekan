'use strict';
// Durable rule checklist creation and removal
// (server/lib/syncRuleChecklistLifecycleCommand.js).
// Run: node tests/syncRuleChecklistLifecycleCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const L = require('../server/lib/syncRuleChecklistLifecycleCommand');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

const ROOT = path.join(__dirname, '..');
async function fixture(action) {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', ...action }) });
  f.card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'T' };
  f.context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  f.prepare = over => L.prepareRuleChecklistLifecycleCommand({ ...f.context, card: f.card, createdAt: new Date(1000), ...over });
  return f;
}
const stored = (id, title = 'Steps') => ({ _id: id, cardId: 'card', boardId: 'board', title, sort: 0,
  createdAt: new Date(5), modifiedAt: new Date(5), showChecklistAtMinicard: true });

test('addChecklist: one derived checklist id, and the hooks\' rows recorded from the stored document', async () => {
  const f = await fixture({ actionType: 'addChecklist', checklistName: 'Steps for {cardTitle}' });
  const command = f.prepare({ title: 'Steps for T' });
  assert.equal(command.checklistId, L.checklistIdFor(command._id));
  assert.equal(command.title, 'Steps for T');
  assert.equal(command.recorded, null, 'the stored document is not known before the insert');
  assert.equal(f.prepare({ title: 'Steps for T', createdAt: new Date(2000) }).checklistId, command.checklistId,
    'a replayed capture names the same checklist');
  const recorded = L.recordAddedChecklist(command, { ...stored(command.checklistId, 'Steps for T') });
  assert.equal(recorded.units.length, 1);
  const [unit] = recorded.units;
  assert.deepEqual([unit.activity.activityType, unit.activity.checklistId, unit.activity.checklistName],
    ['addChecklist', command.checklistId, 'Steps for T']);
  const [row] = unit.history.rows;
  assert.deepEqual([row.entityType, row.group, row.changeType, row.previousContent], ['checklist', 'checklists', 'added', null]);
  assert.equal(row.newContent.document.createdAt, new Date(5).toISOString(), 'the hook\'s JSON snapshot');
  assert.deepEqual([row.cardId, row.listId, row.swimlaneId], ['card', 'list', 'lane']);
  const saved = { ...command, recorded };
  assert.deepEqual(L.validateRuleChecklistLifecycleCommand(saved, f.context), saved);
});

test('removeChecklist: one unit per matching checklist, activity before and History after', async () => {
  const f = await fixture({ actionType: 'removeChecklist', checklistName: 'Steps' });
  const command = f.prepare({ checklists: [stored('c1'), stored('c2')] });
  assert.deepEqual(command.units.map(unit => unit.checklistId), ['c1', 'c2']);
  for (const unit of command.units) {
    assert.equal(unit.activity.activityType, 'removeChecklist');
    const [row] = unit.history.rows;
    assert.deepEqual([row.changeType, row.newContent, row.previousContent.document._id], ['removed', null, unit.checklistId]);
  }
  assert.notEqual(command.units[0].receiptId, command.units[1].receiptId);
  assert.deepEqual(L.validateRuleChecklistLifecycleCommand(command, f.context), command);
  assert.deepEqual(f.prepare({ checklists: [] }).units, [], 'nothing matches, nothing to do');
});

test('negative: tampered commands, foreign checklists and forged records are refused', async () => {
  const resum = row => { const { checksum, recorded, ...content } = row;
    return { ...content, ...(recorded !== undefined ? { recorded } : {}), checksum: sha256(canonical(content)) }; };
  const add = await fixture({ actionType: 'addChecklist', checklistName: 'Steps' });
  const command = add.prepare({ title: 'Steps' });
  assert.throws(() => L.validateRuleChecklistLifecycleCommand({ ...command, title: 'Other' }, add.context), /command-invalid/);
  assert.throws(() => L.validateRuleChecklistLifecycleCommand(resum({ ...command, checklistId: 'chosen' }), add.context),
    /command-invalid/);
  const recorded = L.recordAddedChecklist(command, stored(command.checklistId, 'Steps'));
  const forged = { units: [{ ...recorded.units[0], activity: { ...recorded.units[0].activity, userId: 'someone-else' } }] };
  assert.throws(() => L.validateRuleChecklistLifecycleCommand({ ...command, recorded: forged }, add.context), /command-invalid/);
  assert.throws(() => L.recordAddedChecklist(command, stored('other-id')), /invalid/);
  const remove = await fixture({ actionType: 'removeChecklist', checklistName: 'Steps' });
  assert.throws(() => remove.prepare({ checklists: [{ ...stored('c1'), cardId: 'another-card' }] }), /invalid/);
  const removal = remove.prepare({ checklists: [stored('c1')] });
  const swapped = resum({ ...removal, units: [{ ...removal.units[0], stored: stored('c1', 'Changed') }] });
  assert.throws(() => L.validateRuleChecklistLifecycleCommand(swapped, remove.context), /command-invalid/);
  const other = await fixture({ actionType: 'addSwimlane', swimlaneName: 'X' });
  assert.throws(() => other.prepare({ title: 'X' }), /invalid/);
});

test('addChecklistWithItems: the checklist, then each item with its own activity and History row', async () => {
  const f = await fixture({ actionType: 'addChecklistWithItems', checklistName: 'Steps', checklistItems: 'a,b' });
  const command = f.prepare({ title: 'Steps', itemTitles: ['Cut', 'Weld'] });
  assert.deepEqual(command.items.map(item => [item.title, item.sort]), [['Cut', 0], ['Weld', 1]]);
  assert.equal(new Set(command.items.map(item => item.itemId)).size, 2, 'derived, distinct item ids');
  assert.deepEqual(f.prepare({ title: 'Steps', itemTitles: ['Cut', 'Weld'], createdAt: new Date(9) }).items.map(i => i.itemId),
    command.items.map(i => i.itemId), 'a replayed capture names the same items');
  const items = command.items.map(item => ({ _id: item.itemId, checklistId: command.checklistId, cardId: 'card',
    boardId: 'board', title: item.title, sort: item.sort, isFinished: false, createdAt: new Date(6) }));
  const recorded = L.recordAddedChecklist(command, stored(command.checklistId, 'Steps'), items);
  assert.deepEqual(recorded.units.map(unit => unit.activity.activityType), ['addChecklist', 'addChecklistItem', 'addChecklistItem']);
  assert.deepEqual(recorded.units.map(unit => unit.history.rows[0].entityType), ['checklist', 'checklistItem', 'checklistItem']);
  assert.equal(recorded.units[1].activity.checklistItemName, 'Cut');
  const saved = { ...command, recorded };
  assert.deepEqual(L.validateRuleChecklistLifecycleCommand(saved, f.context), saved);
  // Negative: an item missing, or another checklist's, is refused.
  assert.throws(() => L.recordAddedChecklist(command, stored(command.checklistId, 'Steps'), items.slice(1)), /invalid/);
  assert.throws(() => L.recordAddedChecklist(command, stored(command.checklistId, 'Steps'),
    [items[0], { ...items[1], checklistId: 'other' }]), /invalid/);
  const resum = row => { const { checksum, recorded: r, ...content } = row;
    return { ...content, recorded: r, checksum: sha256(canonical(content)) }; };
  assert.throws(() => L.validateRuleChecklistLifecycleCommand(resum({ ...command,
    items: [{ ...command.items[0], sort: 5 }, command.items[1]] }), f.context), /command-invalid/);
});

test('wiring: durable, registered, hooks deferred only for the named checklist', () => {
  const { DURABLE_RULE_ACTIONS } = require('../server/lib/listSyncSteps');
  for (const type of L.RULE_CHECKLIST_LIFECYCLE_ACTIONS) assert.ok(DURABLE_RULE_ACTIONS.has(type), type);
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  assert.match(plans, /RULE_CHECKLIST_LIFECYCLE_ACTIONS\.map\(type => \[type, \(\{ invocation \}\) =>\s*runStoredSyncRuleChecklistLifecycle/);
  // Capture uses the ordinary action's own title and selector.
  assert.match(plans, /RulesHelper\.ruleChecklistTitle\(/);
  assert.match(plans, /find\(\{ title: action\.checklistName, cardId: card\._id, sort: 0 \}/);
  const rules = fs.readFileSync(path.join(ROOT, 'server/rulesHelper.js'), 'utf8');
  assert.match(rules, /async ruleChecklistTitle\(activity, card, action\) \{\s*return substituteVars\(action\.checklistName, await buildRuleVars\(activity, card\)\);/);
  assert.match(rules, /Checklists\.removeAsync\(\{\s*title: action\.checklistName,\s*cardId: card\._id,\s*sort: 0,/);
  // Both hooks look for the deferral before writing.
  const hooks = fs.readFileSync(path.join(ROOT, 'server/models/checklists.js'), 'utf8');
  assert.equal((hooks.match(/deferSyncChecklistRecording\('checklistActivity', doc\)/g) || []).length, 2);
  assert.match(fs.readFileSync(path.join(ROOT, 'server/models/changeHistoryHooks.js'), 'utf8'),
    /entityType === 'checklist' && deferSyncChecklistRecording\('checklistHistory', doc\)/);
  // ...and the items' two hooks, for addChecklistWithItems.
  assert.match(fs.readFileSync(path.join(ROOT, 'server/models/checklistItems.js'), 'utf8'),
    /ChecklistItems\.after\.insert\(async \(userId, doc\) => \{\s*\/\/[^\n]*\n\s*if \(deferSyncChecklistRecording\('checklistItemActivity', doc\)\) return;/);
  assert.match(fs.readFileSync(path.join(ROOT, 'server/models/changeHistoryHooks.js'), 'utf8'),
    /entityType === 'checklistItem' && deferSyncChecklistRecording\('checklistItemHistory', doc\)/);
  const { withSyncRecordingDeferred, deferSyncChecklistRecording } = require('../server/lib/syncRecordingScope');
  return withSyncRecordingDeferred({ cardId: 'card', boardId: 'board', listId: 'list', checklistId: 'c1',
    kinds: ['checklistActivity'] }, async () => {
    assert.equal(deferSyncChecklistRecording('checklistActivity', { _id: 'c2', cardId: 'card' }), false, 'another checklist');
    assert.equal(deferSyncChecklistRecording('checklistHistory', { _id: 'c1', cardId: 'card' }), false, 'a kind not named');
    assert.equal(deferSyncChecklistRecording('checklistActivity', { _id: 'c1', cardId: 'card' }), true);
    assert.equal(deferSyncChecklistRecording('checklistActivity', { _id: 'c1', cardId: 'card' }), false, 'one shot');
  });
});
