'use strict';
// The Kanban flow policies of a board's lists (models/lib/boardFlowPolicies.js):
// list policies, the commitment point and the WIP limit per person - the
// decisions, the places that draw them, and that each can be hidden both in
// Board Settings / List and in Admin Panel / Features. And the Definition of
// Ready beside the Definition of Done in the Scrum settings.
// Run: node --test tests/boardFlowPolicies.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const p = require('../models/lib/boardFlowPolicies');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('a policy is trimmed text; the WIP limit per person a whole number 1-99', () => {
  assert.strictEqual(p.normalizePolicy('  In: has an owner.\r\nOut: reviewed.  '), 'In: has an owner.\nOut: reviewed.');
  assert.strictEqual(p.normalizePolicy(null), '', 'nothing clears it');
  assert.strictEqual(p.normalizePersonWipLimit('3'), 3);
  assert.strictEqual(p.normalizePersonWipLimit(''), null, 'empty is no limit');
  // Negative: what is not a policy or a limit is refused.
  for (const bad of [7, {}, 'x'.repeat(p.MAX_POLICY + 1)]) assert.throws(() => p.normalizePolicy(bad), /invalid-list-policy/);
  for (const bad of [0, -1, 100, 2.5, 'many']) assert.throws(() => p.normalizePersonWipLimit(bad), /invalid-person-wip-limit/);
});

test('the WIP limit per person counts each person\'s open cards, assignees before members', () => {
  const cards = [
    { _id: 'a', assignees: ['ann'], members: ['bob'] },
    { _id: 'b', assignees: ['ann'] },
    { _id: 'c', members: ['ann', 'bob'] },
    { _id: 'd', assignees: ['ann'], dueComplete: true },
    { _id: 'e', assignees: ['ann'], archived: true },
    { _id: 'f', assignees: ['ann'], type: 'template-card' },
  ];
  const counts = p.openCardsPerPerson(cards);
  assert.strictEqual(counts.get('ann'), 3, 'done, archived and template cards are not open');
  assert.strictEqual(counts.get('bob'), 1, 'a member counts only on a card nobody is assigned to');
  assert.deepStrictEqual(p.overPersonWip(cards[0], cards, 2), [{ userId: 'ann', count: 3, limit: 2 }]);
  assert.deepStrictEqual(p.overPersonWip(cards[2], cards, 2), [{ userId: 'ann', count: 3, limit: 2 }], 'bob is within it');
  // Negative: no limit, a limit nobody is over, or a done card warn about nobody.
  assert.deepStrictEqual(p.overPersonWip(cards[0], cards, null), []);
  assert.deepStrictEqual(p.overPersonWip(cards[0], cards, 3), []);
  assert.deepStrictEqual(p.overPersonWip(cards[3], cards, 1), []);
});

test('the commitment point is a list; it and the lists after it are committed', () => {
  const lists = [{ _id: 'done', sort: 3 }, { _id: 'ideas', sort: 0 }, { _id: 'ready', sort: 1 }, { _id: 'doing', sort: 2 }];
  assert.strictEqual(p.isCommitted('ready', lists, 'ready'), true);
  assert.strictEqual(p.isCommitted('done', lists, 'ready'), true);
  assert.strictEqual(p.isCommitted('ideas', lists, 'ready'), false, 'before it: an option');
  assert.strictEqual(p.isCommitted('doing', lists, null), false, 'negative: no commitment point');
  assert.strictEqual(p.isCommitted('doing', lists, 'gone'), false, 'negative: a list that is not there');
});

test('each is a board setting off until a board admin turns it on, and an Admin Panel feature', () => {
  const { FEATURE_KEYS, isFeatureEnabled } = require('../models/lib/instanceFeatures');
  for (const key of Object.values(p.FEATURE_OF)) {
    assert.ok(FEATURE_KEYS.includes(key), `${key} is in Admin Panel / Features`);
    assert.strictEqual(isFeatureEnabled({ featureStates: { [key]: false } }, key), false, `${key} can be turned off there`);
  }
  const boards = read('models/boards.js');
  assert.match(boards, /allowsListPolicies: \{ type: Boolean, optional: true \}/);
  assert.match(boards, /commitmentListId: \{ type: String, optional: true \}/);
  assert.match(boards, /personWipLimit: \{ type: SimpleSchema\.Integer, optional: true, min: 1, max: 99 \}/);
  assert.match(read('models/lists.js'), /policy: \{[\s\S]{0,300}?type: String,\n\s+optional: true,\n\s+max: 2000,/);
  const jade = read('client/components/lists/listFlowPolicies.jade');
  for (const key of Object.values(p.FEATURE_OF)) assert.ok(jade.includes(`if allowFeature '${key}'`), `Board Settings / List offers ${key} only when the instance does`);
  const js = read('client/components/lists/listFlowPolicies.js');
  assert.match(js, /current\?\.allowsListPolicies === true && this\.policy && allowFeature\('list-policies'\)/, 'the mark: board AND instance');
  assert.match(js, /current\.commitmentListId === this\._id && allowFeature\('commitment-point'\)/);
  assert.match(js, /!current\.personWipLimit \|\| !allowFeature\('person-wip-limit'\)/);
  assert.match(read('client/components/sidebar/sidebar.jade'), /template\(name="boardListSettingsPopup"\)[\s\S]*?\+boardFlowListSettings/);
  assert.match(read('client/components/lists/listHeader.jade'), /\+listFlowMarks/);
  assert.match(read('client/components/cards/cardDetails.jade'), /\+cardPersonWipWarnings\(card=this\)/);
  // Negative: the board settings are written only for a board admin.
  for (const handler of ['setAllowsListPolicies', 'setCommitmentListId', 'setPersonWipLimit']) {
    assert.match(js, new RegExp(`isBoardAdmin\\(\\)\\) current\\.${handler}\\(|isBoardAdmin\\(\\)\\) return;\\n\\s+current\\.${handler}\\(`), `${handler} only for a board admin`);
  }
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['listPolicyPopup-title', 'list-policy', 'list-policy-placeholder', 'show-list-policies', 'commitment-point',
    'commitment-point-hint', 'person-wip-limit', 'person-wip-over', 'scrum-definition-of-ready',
    ...Object.values(p.FEATURE_OF).flatMap(key => [`feature-${key}`, `feature-${key}-desc`])]) {
    assert.ok(en[key], `${key} is in English`);
  }
});

test('the Definition of Ready is a Scrum setting beside the Definition of Done', () => {
  const { normalizeScrumSettings, DEFAULT_SCRUM_SETTINGS } = require('../models/lib/scrum');
  assert.strictEqual(DEFAULT_SCRUM_SETTINGS.definitionOfReady, '');
  assert.strictEqual(normalizeScrumSettings({ definitionOfReady: 'Estimated and small' }).definitionOfReady, 'Estimated and small');
  assert.throws(() => normalizeScrumSettings({ definitionOfReady: 7 }), 'negative: only text');
  const view = read('client/components/boards/scrum/scrumView.jade');
  assert.match(view, /textarea\(name="definitionOfReady"\)/);
  assert.match(view, /if settings\.definitionOfReady\n\s+details\.scrum-definition\.js-scrum-definition-of-ready/, 'shown to members only when written');
  assert.match(read('client/components/boards/scrum/scrumView.js'), /definitionOfReady: values\.definitionOfReady/);
  assert.match(read('models/lib/importExportSecurity.js'), /\['productGoal', 'definitionOfDone', 'definitionOfReady'\]/, 'sanitized on import like the other two');
});

test('a split list counts Doing and Done; Done here belongs to the list it was marked in', () => {
  const cards = [
    { _id: 'a', listId: 'dev', flow: { splitDoneListId: 'dev' } },
    { _id: 'b', listId: 'dev' },
    { _id: 'c', listId: 'dev', flow: { splitDoneListId: 'review' } },
    { _id: 'd', listId: 'dev', archived: true, flow: { splitDoneListId: 'dev' } },
  ];
  assert.strictEqual(p.isSplitDone(cards[0]), true);
  assert.strictEqual(p.isSplitDone(cards[2]), false, 'moved on from where it was done: Doing again');
  assert.deepStrictEqual(p.splitCounts(cards), { doing: 2, done: 1 }, 'archived cards are not counted');
  const { flowModifier } = require('../models/lib/cardFlow');
  assert.deepStrictEqual(flowModifier({ splitDone: true }, { listId: 'dev' }), { $set: { 'flow.splitDoneListId': 'dev' } });
  assert.deepStrictEqual(flowModifier({ splitDone: false }), { $unset: { 'flow.splitDoneListId': '' } });
  // Negative: no list, or a client naming its own, is refused.
  assert.throws(() => flowModifier({ splitDone: true }), /invalid-flow-split/);
  assert.throws(() => flowModifier({ splitDone: 'yes' }, { listId: 'dev' }), /invalid-flow-split/);
  assert.throws(() => flowModifier({ splitDoneListId: 'other' }, { listId: 'dev' }), /invalid-flow-patch/);
  const method = read('server/lib/cardFlowMethod.js');
  assert.match(method, /if \(!list \|\| list\.split !== true\) throw new Meteor\.Error\('not-a-split-list'\);/, 'only in a split list');
  const js = read('client/components/lists/listFlowPolicies.js');
  assert.match(js, /board\?\.allowsSplitLists === true && list\?\.split === true && allowFeature\('split-lists'\)/,
    'drawn only when the board allows it, the list is split and the instance offers it');
  assert.match(read('models/lists.js'), /split: \{[\s\S]{0,300}?type: Boolean,\n\s+optional: true,/);
  assert.match(read('models/boards.js'), /allowsSplitLists: \{ type: Boolean, optional: true \}/);
  assert.match(read('client/components/cards/minicard.jade'), /\+minicardSplitDone/);
  assert.match(read('client/components/lists/listHeader.jade'), /if showsSplitLists\n[\s\S]{0,80}a\.js-toggle-list-split/);
});
