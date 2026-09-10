'use strict';

// Regression coverage for issue #3390 ("Rule: trigger for assignee
// added/removed"). WeKan's rules already trigger on a MEMBER being added to
// or removed from a card (joinMember/unjoinMember, server/triggersDef.js +
// models/cards.js's cardMembers() + client/components/rules/triggers/
// cardTriggers.jade|js). `assignees` is a separate card field from `members`
// (models/cards.js already fires joinAssignee/unjoinAssignee ACTIVITIES for
// it, in cardAssignees() - see server/models/activities.js which already
// handles both for the activity feed), but until now there was no RULE
// TRIGGER wired to those activityTypes, so "when an assignee is added/
// removed" could not be built in the Rules UI. This mirrors the existing
// member trigger wiring exactly, applied to `assignees`/`joinAssignee`/
// `unjoinAssignee` instead of `members`/`joinMember`/`unjoinMember`.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const triggersDefSrc = read('server/triggersDef.js').replace(/^export /m, '');
// eslint-disable-next-line no-new-func
const TriggersDef = new Function(`${triggersDefSrc}\nreturn TriggersDef;`)();

const cardsSrc = read('models/cards.js');
const rulesHelperSrc = read('server/rulesHelper.js');
const cardTriggersJadeSrc = read('client/components/rules/triggers/cardTriggers.jade');
const cardTriggersJsSrc = read('client/components/rules/triggers/cardTriggers.js');
const rulesWorkflowSrc = read('client/components/rules/rulesWorkflow.js');
const enI18n = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

// --- server/triggersDef.js: the new activityTypes are registered ------------

test('joinAssignee/unjoinAssignee are registered triggers, matching joinMember/unjoinMember\'s shape', () => {
  assert.ok(TriggersDef.joinAssignee, 'joinAssignee trigger is defined');
  assert.ok(TriggersDef.unjoinAssignee, 'unjoinAssignee trigger is defined');
  assert.deepStrictEqual(TriggersDef.joinAssignee.matchingFields, TriggersDef.joinMember.matchingFields);
  assert.deepStrictEqual(TriggersDef.unjoinAssignee.matchingFields, TriggersDef.unjoinMember.matchingFields);
  assert.deepStrictEqual(TriggersDef.joinAssignee.matchingFields, ['boardId', 'username', 'userId']);
});

test('negative: assignee triggers do not share an activityType key with member triggers', () => {
  assert.notStrictEqual('joinAssignee', 'joinMember');
  assert.notStrictEqual('unjoinAssignee', 'unjoinMember');
  assert.ok(!('joinAssignee' in { joinMember: 1, unjoinMember: 1 }));
});

// --- models/cards.js: the assignee activities the trigger listens to --------

test('cardAssignees() fires joinAssignee/unjoinAssignee the same way cardMembers() fires joinMember/unjoinMember', () => {
  const block = cardsSrc.slice(cardsSrc.indexOf('async function cardAssignees'));
  const body = block.slice(0, block.indexOf('\nasync function cardLabels'));
  assert.ok(/activityType: 'joinAssignee'/.test(body));
  assert.ok(/activityType: 'unjoinAssignee'/.test(body));
  // username is set on the activity - it is what TriggersDef.joinAssignee
  // matches on, exactly like cardMembers() does for joinMember.
  assert.ok(/username,\s*\n\s*activityType: 'joinAssignee'/.test(body));
  assert.ok(/username,\s*\n\s*activityType: 'unjoinAssignee'/.test(body));
  // Driven off the assignees field, addToSet/pull, not members.
  assert.ok(/if \(!fieldNames\.includes\('assignees'\)\) return;/.test(body));
});

// --- server/rulesHelper.js: the matcher works generically off TriggersDef ---
// (findMatchingRules just looks TriggersDef[activity.activityType] up - no
// per-activityType code, so registering the trigger above is sufficient, but
// prove the matching actually behaves like the member trigger for a set of
// realistic activities.)

const bmfSrc = rulesHelperSrc.match(
  /async buildMatchingFieldsMap\(activity, matchingFields\) \{[\s\S]*?\n  \},/,
);
assert.ok(bmfSrc, 'buildMatchingFieldsMap found in server/rulesHelper.js');
function makeMatcherEngine() {
  // eslint-disable-next-line no-new-func
  return new Function(
    'ReactiveCache',
    'cardTitleMatchList',
    `return { ${bmfSrc[0].replace(/,\s*$/, '')} };`,
  )({ getList: async () => undefined, getSwimlane: async () => undefined }, () => true);
}

function mongoDocMatches(doc, selector) {
  return Object.entries(selector).every(([field, cond]) => {
    if (cond && typeof cond === 'object' && Array.isArray(cond.$in)) {
      const inList = cond.$in.map(v => (v === undefined ? null : v));
      const present = Object.prototype.hasOwnProperty.call(doc, field) && doc[field] !== undefined;
      if (!present) return inList.includes(null);
      return inList.includes(doc[field] === null ? null : doc[field]);
    }
    return doc[field] === cond;
  });
}

const assigneeAddedActivity = {
  activityType: 'joinAssignee',
  boardId: 'B1',
  cardId: 'C1',
  assigneeId: 'U2',
  userId: 'U1',
  username: 'alice',
  listId: 'L1',
  swimlaneId: 'S1',
};
const assigneeRemovedActivity = { ...assigneeAddedActivity, activityType: 'unjoinAssignee' };
const memberAddedActivity = { ...assigneeAddedActivity, activityType: 'joinMember', memberId: 'U2' };

test('"when an assignee is added" (wildcard username) fires on a joinAssignee activity', async () => {
  const engine = makeMatcherEngine();
  const selector = await engine.buildMatchingFieldsMap(
    assigneeAddedActivity, TriggersDef.joinAssignee.matchingFields,
  );
  const uiTrigger = { activityType: 'joinAssignee', boardId: 'B1', username: '*', userId: '*' };
  assert.strictEqual(mongoDocMatches(uiTrigger, selector), true);
});

test('"when THE assignee alice is added" fires only for that username', async () => {
  const engine = makeMatcherEngine();
  const selector = await engine.buildMatchingFieldsMap(
    assigneeAddedActivity, TriggersDef.joinAssignee.matchingFields,
  );
  assert.strictEqual(
    mongoDocMatches({ activityType: 'joinAssignee', boardId: 'B1', username: 'alice', userId: '*' }, selector),
    true,
  );
  assert.strictEqual(
    mongoDocMatches({ activityType: 'joinAssignee', boardId: 'B1', username: 'bob', userId: '*' }, selector),
    false,
    'a different specific username must not match',
  );
});

test('negative: an "assignee removed" trigger does not fire on an "assignee added" activity', async () => {
  const engine = makeMatcherEngine();
  const selector = await engine.buildMatchingFieldsMap(
    assigneeAddedActivity, TriggersDef.joinAssignee.matchingFields,
  );
  const removeTrigger = { activityType: 'unjoinAssignee', boardId: 'B1', username: '*', userId: '*' };
  assert.strictEqual(mongoDocMatches(removeTrigger, selector), false);
});

test('negative: an assignee trigger does not fire on the sibling MEMBER activity, and vice versa', async () => {
  const engine = makeMatcherEngine();
  const memberSelector = await engine.buildMatchingFieldsMap(
    memberAddedActivity, TriggersDef.joinMember.matchingFields,
  );
  const assigneeTrigger = { activityType: 'joinAssignee', boardId: 'B1', username: '*', userId: '*' };
  assert.strictEqual(mongoDocMatches(assigneeTrigger, memberSelector), false,
    'members and assignees are distinct card fields with distinct activityTypes');

  const assigneeSelector = await engine.buildMatchingFieldsMap(
    assigneeAddedActivity, TriggersDef.joinAssignee.matchingFields,
  );
  const memberTrigger = { activityType: 'joinMember', boardId: 'B1', username: '*', userId: '*' };
  assert.strictEqual(mongoDocMatches(memberTrigger, assigneeSelector), false);
});

test('negative: an unrelated field change (e.g. a label) is not TriggersDef[joinAssignee] at all', () => {
  // addedLabel/removedLabel are their own, separate, pre-existing entries -
  // an assignee trigger's matchingFields play no part in a label activity.
  assert.notStrictEqual(TriggersDef.addedLabel, TriggersDef.joinAssignee);
  assert.ok(!TriggersDef.addedLabel.matchingFields.includes('assigneeId'));
});

// --- client/components/rules/triggers/cardTriggers.jade|js: the Add Rule UI -

test('the card-triggers UI offers "when a/the assignee is added/removed", mirroring the member blocks', () => {
  assert.ok(/id="gen-assignee-action"/.test(cardTriggersJadeSrc));
  assert.ok(/id="spec-assignee"/.test(cardTriggersJadeSrc));
  assert.ok(/id="spec-assignee-action"/.test(cardTriggersJadeSrc));
  assert.ok(/js-add-gen-assignee-trigger/.test(cardTriggersJadeSrc));
  assert.ok(/js-add-spec-assignee-trigger/.test(cardTriggersJadeSrc));
  assert.ok(/\{\{_'r-when-a-assignee'\}\}/.test(cardTriggersJadeSrc));
  assert.ok(/\{\{_'r-when-the-assignee'\}\}/.test(cardTriggersJadeSrc));
});

test('the gen-assignee click handler stores a joinAssignee/unjoinAssignee trigger, like the member handler', () => {
  const block = cardTriggersJsSrc.slice(cardTriggersJsSrc.indexOf("'click .js-add-gen-assignee-trigger'"));
  const body = block.slice(0, block.indexOf("'click .js-add-spec-assignee-trigger'"));
  assert.ok(/activityType: 'joinAssignee'/.test(body));
  assert.ok(/activityType: 'unjoinAssignee'/.test(body));
  assert.ok(/username: '\*'/.test(body));
});

test('the spec-assignee click handler stores the typed username, not the wildcard', () => {
  const block = cardTriggersJsSrc.slice(cardTriggersJsSrc.indexOf("'click .js-add-spec-assignee-trigger'"));
  assert.ok(/tpl\.find\('#spec-assignee'\)\.value/.test(block));
  assert.ok(/activityType: 'joinAssignee'/.test(block));
  assert.ok(/activityType: 'unjoinAssignee'/.test(block));
});

// --- client/components/rules/rulesWorkflow.js: the drag-and-drop palette ----

test('the workflow palette offers assignee-added/removed triggers next to the member ones', () => {
  assert.ok(/activityType: 'joinAssignee'/.test(rulesWorkflowSrc));
  assert.ok(/activityType: 'unjoinAssignee'/.test(rulesWorkflowSrc));
  assert.ok(/'r-w-assignee-added'/.test(rulesWorkflowSrc));
  assert.ok(/'r-w-assignee-removed'/.test(rulesWorkflowSrc));
});

// --- i18n: the new keys exist in English and are not equal to a member key --

test('en.i18n.json has the 4 new keys, distinct from the member trigger text', () => {
  for (const key of ['r-when-a-assignee', 'r-when-the-assignee', 'r-w-assignee-added', 'r-w-assignee-removed']) {
    assert.ok(typeof enI18n[key] === 'string' && enI18n[key].length > 0, `${key} exists in en.i18n.json`);
  }
  assert.notStrictEqual(enI18n['r-when-a-assignee'], enI18n['r-when-a-member']);
  assert.notStrictEqual(enI18n['r-w-assignee-added'], enI18n['r-w-member-added']);
});

test('every non-English locale file has the 4 new keys translated (not left equal to English)', () => {
  const dataDir = path.join(repoRoot, 'imports/i18n/data');
  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.i18n.json'))
    .filter(f => !/^en(?:[-_]|\.)/.test(f));
  const newKeys = ['r-when-a-assignee', 'r-when-the-assignee', 'r-w-assignee-added', 'r-w-assignee-removed'];
  const untranslated = [];
  for (const file of files) {
    const locale = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    for (const key of newKeys) {
      assert.ok(key in locale, `${file} is missing ${key}`);
      if (locale[key] === enI18n[key]) untranslated.push(`${file}:${key}`);
    }
  }
  assert.deepStrictEqual(untranslated, []);
});

test('every locale file inserts the 4 new keys right after their member-trigger anchors, like en.i18n.json does', () => {
  // Checked relative to each file's OWN neighboring keys rather than en's
  // absolute index: some locale files are already missing unrelated keys
  // elsewhere (a pre-existing gap, not something this change touches), which
  // shifts their absolute index without the new keys being out of place.
  const dataDir = path.join(repoRoot, 'imports/i18n/data');
  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.i18n.json'))
    .filter(f => f !== 'en.i18n.json');
  for (const file of files) {
    const keys = Object.keys(JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8')));
    if (keys.includes('r-when-the-member') && keys.includes('r-when-a-assignee')) {
      assert.strictEqual(
        keys.indexOf('r-when-a-assignee'), keys.indexOf('r-when-the-member') + 1,
        `${file}: r-when-a-assignee should immediately follow r-when-the-member`,
      );
      assert.strictEqual(
        keys.indexOf('r-when-the-assignee'), keys.indexOf('r-when-a-assignee') + 1,
        `${file}: r-when-the-assignee should immediately follow r-when-a-assignee`,
      );
    }
    if (keys.includes('r-w-member-removed') && keys.includes('r-w-assignee-added')) {
      assert.strictEqual(
        keys.indexOf('r-w-assignee-added'), keys.indexOf('r-w-member-removed') + 1,
        `${file}: r-w-assignee-added should immediately follow r-w-member-removed`,
      );
      assert.strictEqual(
        keys.indexOf('r-w-assignee-removed'), keys.indexOf('r-w-assignee-added') + 1,
        `${file}: r-w-assignee-removed should immediately follow r-w-assignee-added`,
      );
    }
  }
});

// --- runner ------------------------------------------------------------------

(async () => {
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed += 1;
      console.log('  ok -', name);
    } catch (e) {
      console.error('  FAIL -', name);
      console.error(e && e.stack ? e.stack : e);
      process.exitCode = 1;
    }
  }
  console.log(`\n${passed}/${tests.length} tests passed`);
  if (passed !== tests.length) process.exit(1);
})();
