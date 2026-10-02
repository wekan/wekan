'use strict';
// Durable rule copyCard (server/lib/syncRuleCopyCardCommand.js), on the card's own
// board or, when both boards opted in, another one.
// Run: node tests/syncRuleCopyCardCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const C = require('../server/lib/syncRuleCopyCardCommand');
const { durableRuleActionType } = require('../server/lib/syncRuleMoveCommand');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

const ROOT = path.join(__dirname, '..');
async function fixture(action = {}) {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', actionType: 'copyCard', listId: 'next',
      swimlaneId: 'lane', ...action }) });
  f.context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  f.card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'Pump', coverId: 'f1',
    customFields: [{ _id: 'open', value: 1 }, { _id: 'secret', value: 2 }], syncExternalId: 'X-1', scrum: { sprintId: 's' } };
  f.input = over => ({ ...f.context, card: f.card,
    destination: { listId: 'next', swimlaneId: 'lane', listTitle: 'Next', swimlaneTitle: 'Lane' },
    cardNumber: 7, sort: 3, customFieldIds: ['open'], dependencies: [{ cardId: 'other', type: 'blocks' }],
    scrum: { scrum: { sprintId: 's' }, scrumRevision: 1 },
    attachments: [{ _id: 'f1' }, { _id: 'f2' }],
    checklists: [{ _id: 'cl1', cardId: 'card', title: 'Steps', sort: 0 }],
    items: [{ _id: 'i1', checklistId: 'cl1', cardId: 'card', title: 'Cut', isFinished: true }],
    subtaskSources: [{ _id: 'sub1' }], subtaskDocs: [{ title: 'Sub', boardId: 'board', listId: 'next', swimlaneId: 'lane' }],
    subtaskChecklists: [{ _id: 'cl2', cardId: 'sub1', title: 'Sub steps', sort: 0 }],
    subtaskItems: [{ _id: 'i2', checklistId: 'cl2', cardId: 'sub1', title: 'Weld' }],
    comments: [{ _id: 'c1' }], commentDocs: [{ text: 'Noted', userId: 'author', cardId: 'pending', boardId: 'board' }],
    createdAt: new Date(1000), ...over });
  f.prepare = over => C.prepareRuleCopyCardCommand(f.input(over));
  return f;
}

test('the copy is Card.copy\'s, and every document it inserts has a derived id', async () => {
  const f = await fixture();
  const command = f.prepare();
  const card = command.card;
  assert.equal(card._id, C.derivedId(command._id, 'card', 'card'));
  assert.deepEqual([card.listId, card.swimlaneId, card.cardNumber, card.sort], ['next', 'lane', 7, 3]);
  assert.deepEqual(card.customFields, [{ _id: 'open', value: 1 }], 'only fields the actor may read');
  assert.equal(card.syncExternalId, undefined, 'a copy is not the Sync source\'s item');
  assert.equal(card.coverId, undefined, 'the cover is set after its attachment is copied');
  assert.equal(command.coverId, C.attachmentIdFor(command._id, 'f1'));
  assert.equal(command.cardActivity.activity.activityType, 'createCard');
  assert.equal(command.cardActivity.activity.cardId, card._id);
  assert.equal(command.items[0].checklistId, command.checklists[0]._id, 'items follow their copied checklist');
  assert.equal(command.items[0].isFinished, true, 'a copy keeps the checked state, as Checklist.copy does');
  assert.equal(command.subtasks[0].card.parentId, card._id);
  assert.equal(command.subtaskItems[0].cardId, command.subtasks[0].card._id);
  assert.equal(command.comments[0].cardId, card._id);
  assert.deepEqual(f.prepare({ createdAt: new Date(9) }).card._id, card._id, 'a replayed capture names the same copy');
  assert.deepEqual(C.validateRuleCopyCardCommand(command, f.context), command);
  const recorded = C.recordCopiedAttachments(command, command.attachments.map(file => ({ _id: file.attachmentId,
    name: 'x', meta: { cardId: card._id } })));
  assert.deepEqual(recorded.map(plan => [plan.rows[0].entityType, plan.rows[0].group]), [['attachment', 'attachments'],
    ['attachment', 'attachments']]);
  const saved = { ...command, recorded };
  assert.deepEqual(C.validateRuleCopyCardCommand(saved, f.context), saved);
});

test('a copy to another board lives there, with that board\'s labels and custom fields', async () => {
  // Eligibility names it '<type>:elsewhere'; listSyncSteps.js durableRuleActionTypes
  // counts it as copyCard only when that board opted in.
  assert.equal(durableRuleActionType({ actionType: 'copyCard', boardId: 'other' }, 'board'), 'copyCard:elsewhere');
  assert.equal(durableRuleActionType({ actionType: 'copyCard' }, 'board'), 'copyCard');
  const elsewhere = await fixture({ boardId: 'other' });
  const crossBoard = { labelIds: ['urgent-there'], customFields: [{ _id: 'open-there', value: 1 }] };
  // The runner builds the subtasks for that board (buildCopiedSubtaskFields).
  const there = { crossBoard, subtaskDocs: [{ title: 'Sub', boardId: 'other', listId: 'next', swimlaneId: 'lane' }] };
  const command = elsewhere.prepare(there);
  assert.deepEqual([command.boardId, command.targetBoardId, command.card.boardId], ['board', 'other', 'other']);
  assert.deepEqual([command.card.labelIds, command.card.customFields], [['urgent-there'], [{ _id: 'open-there', value: 1 }]]);
  assert.deepEqual([...command.checklists, ...command.items, ...command.subtaskChecklists, ...command.subtaskItems,
    ...command.comments].map(doc => doc.boardId), Array(5).fill('other'), 'everything copied is re-homed');
  assert.equal(command.cardActivity.activity.boardId, 'other', 'its creation runs that board\'s rules');
  assert.deepEqual(C.validateRuleCopyCardCommand(command, elsewhere.context), command);
  // Negative: without the mapping, or with one on the same board, it is refused.
  assert.throws(() => elsewhere.prepare({ subtaskDocs: there.subtaskDocs }), /invalid/);
  assert.throws(() => elsewhere.prepare({ crossBoard }), /command-invalid/, 'a subtask left on the source board');
  const same = await fixture();
  assert.throws(() => same.prepare({ crossBoard }), /invalid/);
  const resum = row => { const { checksum, recorded, ...content } = row;
    return { ...content, recorded, checksum: sha256(canonical(content)) }; };
  assert.throws(() => C.validateRuleCopyCardCommand(resum({ ...command, items: [{ ...command.items[0], boardId: 'board' }] }),
    elsewhere.context), /command-invalid/, 'an item left on the source board');
  assert.throws(() => C.validateRuleCopyCardCommand(resum({ ...command, card: { ...command.card, boardId: 'board' } }),
    elsewhere.context), /command-invalid/);
});

test('negative: tampering and foreign records are refused; a noop stays a noop', async () => {
  const f = await fixture();
  const command = f.prepare();
  const resum = row => { const { checksum, recorded, ...content } = row;
    return { ...content, recorded, checksum: sha256(canonical(content)) }; };
  assert.throws(() => C.validateRuleCopyCardCommand(resum({ ...command, card: { ...command.card, _id: 'chosen' } }), f.context),
    /command-invalid/);
  assert.throws(() => C.validateRuleCopyCardCommand(resum({ ...command,
    items: [{ ...command.items[0], checklistId: 'someone-elses' }] }), f.context), /command-invalid/);
  assert.throws(() => C.validateRuleCopyCardCommand(resum({ ...command,
    comments: [{ ...command.comments[0], boardId: 'other' }] }), f.context), /command-invalid/);
  assert.throws(() => C.recordCopiedAttachments(command, [{ _id: 'wrong', meta: { cardId: command.card._id } }, null]), /invalid/);
  const noop = C.prepareRuleCopyCardCommand({ ...f.context, noop: true, createdAt: new Date(1) });
  assert.deepEqual(Object.keys(noop).includes('card'), false);
  assert.deepEqual(C.validateRuleCopyCardCommand(noop, f.context), noop);
});

test('wiring: durable on the same board, the same builders as Card.copy, and the copy chain guard', () => {
  const { DURABLE_RULE_ACTIONS } = require('../server/lib/listSyncSteps');
  assert.ok(DURABLE_RULE_ACTIONS.has('copyCard'));
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  assert.match(plans, /copyCard: \(\{ invocation \}\) => runStoredSyncRuleCopyCard\(/);
  for (const builder of ['buildCopiedSubtaskFields', 'buildCopiedComment', 'copiedCardScrum', 'mayReadField', 'normalizeDependencies']) {
    assert.match(plans, new RegExp(`${builder}\\(`), `${builder} as Card.copy uses it`);
  }
  assert.match(plans, /async function copiedByThisAction\(commands, cardId, actionId\)/);
  assert.match(plans, /if \(await copiedByThisAction\(commands, plan\.cardId, action\._id\)\) return noop\(\);/);
  assert.match(plans, /Checklists, checklist\)/, 'checklists are direct inserts, as Checklist.copy');
  const store = fs.readFileSync(path.join(ROOT, 'models/lib/fileStoreStrategy.js'), 'utf8');
  assert.match(store, /fileId: \(fileIdFor && fileIdFor\(versionName\)\) \|\| new ObjectId\(\)\.toString\(\),/);
  assert.match(fs.readFileSync(path.join(ROOT, 'server/models/changeHistoryHooks.js'), 'utf8'),
    /if \(deferSyncAttachmentRecording\('attachmentHistory', doc\)\) return;/);
});
