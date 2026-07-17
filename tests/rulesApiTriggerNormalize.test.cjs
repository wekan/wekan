'use strict';

// Plain-Node regression guard (no Meteor) for issue #2674
// ("Rule: remove USER from card when move").
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/rulesApiTriggerNormalize.test.cjs
//
// The reported symptom: a rule "add user to card when it is moved TO list X"
// fires, but the companion rule "remove user from card when it is moved AWAY
// FROM list X" never does. Two silent causes remained in the REST API path
// (the rule-action errors are swallowed by the activity hook, so nothing is
// logged):
//
//  1. The rule matcher (server/rulesHelper.js buildMatchingFieldsMap) queries
//     EVERY matching field of the trigger's activityType with
//     {$in: [<activity value>, '*']}. A Mongo $in never matches a document
//     that LACKS the field, so a trigger created over
//     POST /api/boards/:boardId/rules without e.g. userId / listName /
//     swimlaneName could never match any activity — the rule silently never
//     fired. The UI wizard (sanitizeObject) and the rules JSON import
//     (normalizeTrigger) both default missing fields to '*'; the API now does
//     the same via normalizeTriggerDoc().
//
//  2. The addMember/removeMember actions crashed on `undefined._id` whenever
//     the stored username no longer resolved (user renamed/deleted, or a typo
//     in an API-created rule) — and the removeMember '*' branch crashed on a
//     card without a members array. They now warn and skip instead, and the
//     card writes are awaited.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const rulesApiSrc = read('server/models/rules.js');
const rulesHelperSrc = read('server/rulesHelper.js');
const apiPySrc = read('api.py');
const rulesDocSrc = read('docs/API/Rules.md');
const restApiDocSrc = read('docs/API/REST-API.md');

// --- extract the REAL implementation pieces ----------------------------------

// TriggersDef (server/triggersDef.js is an ES module; strip `export`).
const triggersDefSrc = read('server/triggersDef.js').replace(/^export /m, '');
// eslint-disable-next-line no-new-func
const TriggersDef = new Function(`${triggersDefSrc}\nreturn TriggersDef;`)();

// normalizeTriggerDoc from the rules REST API.
const normSrc = rulesApiSrc.match(/function normalizeTriggerDoc\(trigger\) \{[\s\S]*?\n\}/);
assert.ok(normSrc, 'normalizeTriggerDoc found in server/models/rules.js');
// eslint-disable-next-line no-new-func
const normalizeTriggerDoc = new Function(
  'TriggersDef',
  `${normSrc[0]}\nreturn normalizeTriggerDoc;`,
)(TriggersDef);

// buildMatchingFieldsMap from the rule engine (an object-literal method).
const bmfSrc = rulesHelperSrc.match(
  /async buildMatchingFieldsMap\(activity, matchingFields\) \{[\s\S]*?\n  \},/,
);
assert.ok(bmfSrc, 'buildMatchingFieldsMap found in server/rulesHelper.js');
const { cardTitleMatchList } = require(path.join(
  repoRoot,
  'models/lib/ruleCardTitleFilter.js',
));
function makeMatcherEngine(reactiveCacheStub) {
  // eslint-disable-next-line no-new-func
  return new Function(
    'ReactiveCache',
    'cardTitleMatchList',
    `return { ${bmfSrc[0].replace(/,\s*$/, '')} };`,
  )(reactiveCacheStub, cardTitleMatchList);
}

// Minimal Mongo find() semantics for {field: {$in: [...]}} selectors: a $in
// only matches a document MISSING the field when the $in list contains null
// (Meteor stores/queries `undefined` as null).
function mongoDocMatches(doc, selector) {
  return Object.entries(selector).every(([field, cond]) => {
    if (cond && typeof cond === 'object' && Array.isArray(cond.$in)) {
      const inList = cond.$in.map(v => (v === undefined ? null : v));
      const present =
        Object.prototype.hasOwnProperty.call(doc, field) && doc[field] !== undefined;
      if (!present) return inList.includes(null);
      return inList.includes(doc[field] === null ? null : doc[field]);
    }
    return doc[field] === cond;
  });
}

let passed = 0;
const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// --- the #2674 board -----------------------------------------------------------

const LISTS = {
  L0: { _id: 'L0', title: 'List 0' },
  L1: { _id: 'L1', title: 'List 1' },
};
const reactiveCacheStub = {
  async getList(id) {
    return LISTS[id];
  },
  async getSwimlane() {
    return undefined;
  },
  async getCard() {
    return { _id: 'C1', title: 'Test card' };
  },
};

// Activity recorded when the card is moved AWAY FROM "List 1" (into "List 0").
const movedFromList1Activity = {
  activityType: 'moveCard',
  boardId: 'B1',
  cardId: 'C1',
  cardTitle: 'Test card',
  listName: 'List 0',
  listId: 'L0',
  oldListId: 'L1',
  swimlaneName: 'Default',
  userId: 'U1',
};

// Activity recorded when the card is moved TO "List 1" (from "List 0").
const movedToList1Activity = {
  ...movedFromList1Activity,
  listName: 'List 1',
  listId: 'L1',
  oldListId: 'L0',
};

async function matcherFor(activity) {
  const engine = makeMatcherEngine(reactiveCacheStub);
  return engine.buildMatchingFieldsMap(
    activity,
    TriggersDef[activity.activityType].matchingFields,
  );
}

// --- normalizeTriggerDoc unit behavior ----------------------------------------

test('missing moveCard matching fields default to the * wildcard', () => {
  const out = normalizeTriggerDoc({ activityType: 'moveCard', oldListName: 'List 1' });
  assert.strictEqual(out.oldListName, 'List 1', 'explicit value kept');
  assert.strictEqual(out.listName, '*');
  assert.strictEqual(out.userId, '*');
  assert.strictEqual(out.swimlaneName, '*');
  assert.strictEqual(out.cardTitle, '*');
  assert.strictEqual(out.boardId, '*'); // strip() removed it; route re-adds the real one
});

test('empty-string and null values become the wildcard too', () => {
  const out = normalizeTriggerDoc({
    activityType: 'moveCard',
    listName: '',
    userId: null,
    oldListName: 'List 1',
  });
  assert.strictEqual(out.listName, '*');
  assert.strictEqual(out.userId, '*');
  assert.strictEqual(out.oldListName, 'List 1');
});

test('explicit values are never overwritten', () => {
  const out = normalizeTriggerDoc({
    activityType: 'createCard',
    listName: 'Doing',
    userId: 'someUser',
    cardTitle: 'Part A',
  });
  assert.strictEqual(out.listName, 'Doing');
  assert.strictEqual(out.userId, 'someUser');
  assert.strictEqual(out.cardTitle, 'Part A');
  assert.strictEqual(out.swimlaneName, '*', 'only the missing field is defaulted');
});

test('negative: non-activity triggers (scheduledTrigger/button) are untouched', () => {
  const sched = {
    activityType: 'scheduledTrigger',
    scheduleKind: 'aging',
    listName: 'Completed',
    days: 90,
  };
  assert.deepStrictEqual(normalizeTriggerDoc(sched), sched);
  const button = { activityType: 'button', buttonKind: 'card' };
  assert.deepStrictEqual(normalizeTriggerDoc(button), button);
});

// --- the #2674 end-to-end matching scenario ------------------------------------

test('#2674: UI-style "moved AWAY FROM List 1 -> removeMember" trigger matches', async () => {
  const selector = await matcherFor(movedFromList1Activity);
  const uiTrigger = {
    activityType: 'moveCard',
    boardId: 'B1',
    listName: '*',
    oldListName: 'List 1',
    swimlaneName: '*',
    cardTitle: '*',
    userId: '*',
  };
  assert.strictEqual(mongoDocMatches(uiTrigger, selector), true);
});

test('#2674 regression: the same trigger created over REST WITHOUT normalization never matched', async () => {
  const selector = await matcherFor(movedFromList1Activity);
  // What POST /api/boards/:boardId/rules used to store: only the fields the
  // caller supplied. userId/listName/swimlaneName are missing entirely.
  const apiTriggerBeforeFix = {
    activityType: 'moveCard',
    boardId: 'B1',
    oldListName: 'List 1',
  };
  assert.strictEqual(
    mongoDocMatches(apiTriggerBeforeFix, selector),
    false,
    'a trigger missing matching fields can never satisfy the $in query',
  );
});

test('#2674 fix: after normalizeTriggerDoc the API trigger matches the move-away activity', async () => {
  const selector = await matcherFor(movedFromList1Activity);
  const apiTrigger = {
    ...normalizeTriggerDoc({ activityType: 'moveCard', oldListName: 'List 1' }),
    boardId: 'B1', // the route sets the real boardId after normalization
  };
  assert.strictEqual(mongoDocMatches(apiTrigger, selector), true);
});

test('negative: the remove-rule does NOT fire when the card moves INTO List 1', async () => {
  const selector = await matcherFor(movedToList1Activity);
  const removeTrigger = {
    ...normalizeTriggerDoc({ activityType: 'moveCard', oldListName: 'List 1' }),
    boardId: 'B1',
  };
  assert.strictEqual(mongoDocMatches(removeTrigger, selector), false);
});

test('companion add-rule ("moved TO List 1") matches only the move-in activity', async () => {
  const addTrigger = {
    ...normalizeTriggerDoc({ activityType: 'moveCard', listName: 'List 1' }),
    boardId: 'B1',
  };
  assert.strictEqual(
    mongoDocMatches(addTrigger, await matcherFor(movedToList1Activity)),
    true,
  );
  assert.strictEqual(
    mongoDocMatches(addTrigger, await matcherFor(movedFromList1Activity)),
    false,
  );
});

// --- the REST routes actually use the normalization ---------------------------

test('POST /api/boards/:boardId/rules normalizes the trigger and validates types', () => {
  assert.ok(/Triggers\.insertAsync\(\{\s*\n\s*\.\.\.normalizeTriggerDoc\(strip\(trigger\)\)/.test(rulesApiSrc));
  assert.ok(rulesApiSrc.includes("'trigger.activityType is required'"));
  assert.ok(rulesApiSrc.includes("'action.actionType is required'"));
});

test('PUT /api/boards/:boardId/rules/:ruleId normalizes a replaced trigger', () => {
  assert.ok(/\$set: \{ \.\.\.normalizeTriggerDoc\(strip\(req\.body\.trigger\)\), boardId: paramBoardId \}/.test(rulesApiSrc));
});

test('negative: no raw un-normalized trigger insert remains in the rules API', () => {
  assert.ok(!/Triggers\.insertAsync\(\{ \.\.\.strip\(trigger\)/.test(rulesApiSrc));
});

// --- the removeMember/addMember actions no longer crash silently ---------------

test('removeMember tolerates a card without a members array', () => {
  assert.ok(rulesHelperSrc.includes('const members = card.members || [];'));
});

test('member actions resolve the user defensively and await the card writes', () => {
  assert.ok(/if \(action\.actionType === 'addMember'\) \{\s*\n\s*const member = await ReactiveCache\.getUser\(\{ username: action\.username \}\);\s*\n\s*if \(member\) \{\s*\n\s*await card\.assignMember\(member\._id\);/.test(rulesHelperSrc));
  assert.ok(/await card\.unassignMember\(member\._id\);/.test(rulesHelperSrc));
  assert.ok(rulesHelperSrc.includes('not found; skipping.'));
});

test('negative: the crashing `(await getUser(...))._id` pattern is gone', () => {
  assert.ok(!/\(await ReactiveCache\.getUser\(\{ username: action\.username \}\)\)\._id/.test(rulesHelperSrc));
});

// --- the capability is documented (api.py + API docs) --------------------------

test('api.py help text lists the Rules API commands', () => {
  const syntaxBlock = apiPySrc.slice(0, apiPySrc.indexOf('if arguments == 0'));
  assert.ok(syntaxBlock.includes('Board Automation Rules API (IFTTT, Issue #2674):'));
  for (const cmd of ['listrules', 'getrule', 'addrule', 'editrule', 'removerule']) {
    assert.ok(syntaxBlock.includes(`api.py ${cmd} BOARDID`), `help lists ${cmd}`);
  }
  assert.ok(syntaxBlock.includes('"actionType":"removeMember"'), 'help shows the #2674 example');
});

test('api.py implements the rule commands it documents', () => {
  for (const cmd of ['listrules', 'getrule', 'addrule', 'editrule', 'removerule']) {
    assert.ok(apiPySrc.includes(`sys.argv[1] == '${cmd}'`), `api.py implements ${cmd}`);
  }
});

test('docs/API/Rules.md documents all five endpoints and the #2674 workflow', () => {
  assert.ok(rulesDocSrc.includes('`GET` | `/api/boards/:boardId/rules`'));
  assert.ok(rulesDocSrc.includes('`GET` | `/api/boards/:boardId/rules/:ruleId`'));
  assert.ok(rulesDocSrc.includes('`POST` | `/api/boards/:boardId/rules`'));
  assert.ok(rulesDocSrc.includes('`PUT` | `/api/boards/:boardId/rules/:ruleId`'));
  assert.ok(rulesDocSrc.includes('`DELETE` | `/api/boards/:boardId/rules/:ruleId`'));
  assert.ok(rulesDocSrc.includes('"actionType": "removeMember"'));
  assert.ok(rulesDocSrc.includes('oldListName'));
  assert.ok(/issues\/2674/.test(rulesDocSrc));
});

test('docs/API/REST-API.md summary links to the Rules API page', () => {
  assert.ok(restApiDocSrc.includes('### Rules (Board Automation / IFTTT)'));
  assert.ok(restApiDocSrc.includes('Rules.md#add-a-rule'));
});

// --- runner --------------------------------------------------------------------

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
