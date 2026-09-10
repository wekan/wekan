'use strict';

// Regression coverage for issue #2474 ("Rule trigger for due/start/end/
// received date changed"). WeKan already logs an activity every time one of
// a card's four date fields (dueAt/startAt/endAt/receivedAt) is SET or
// changed to a new value - models/cards.js's setDue/setStart/setEnd/
// setReceived go through server/models/cards.js's Cards.before.update
// timing-field hook, which inserts an 'a-dueAt'/'a-startAt'/'a-endAt'/
// 'a-receivedAt' activity (see the due-date-change-count feature, #6081,
// which already reads 'a-dueAt' activities). Until now there was no RULE
// TRIGGER wired to those activityTypes, so "when the due date changes"
// could not be built in the Rules UI. This mirrors the existing
// tests/rulesAssigneeTrigger.test.cjs pattern, applied to the four date
// fields instead of assignees.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const triggersDefSrc = read('server/triggersDef.js').replace(/^export /m, '');
// eslint-disable-next-line no-new-func
const TriggersDef = new Function(`${triggersDefSrc}\nreturn TriggersDef;`)();

const serverCardsSrc = read('server/models/cards.js');
const rulesHelperSrc = read('server/rulesHelper.js');
const cardTriggersJadeSrc = read('client/components/rules/triggers/cardTriggers.jade');
const cardTriggersJsSrc = read('client/components/rules/triggers/cardTriggers.js');
const enI18n = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

const DATE_ACTIVITY_TYPES = ['a-receivedAt', 'a-startAt', 'a-dueAt', 'a-endAt'];

// --- server/triggersDef.js: the 4 new activityTypes are registered ---------

test('a-dueAt/a-startAt/a-endAt/a-receivedAt are registered triggers', () => {
  for (const type of DATE_ACTIVITY_TYPES) {
    assert.ok(TriggersDef[type], `${type} trigger is defined`);
    assert.deepStrictEqual(TriggersDef[type].matchingFields, ['boardId', 'userId']);
  }
});

test('negative: the 4 date triggers are distinct activityType keys, none shared', () => {
  const unique = new Set(DATE_ACTIVITY_TYPES);
  assert.strictEqual(unique.size, DATE_ACTIVITY_TYPES.length);
  assert.ok(!DATE_ACTIVITY_TYPES.includes('joinAssignee'));
  assert.ok(!DATE_ACTIVITY_TYPES.includes('addedLabel'));
});

// --- server/models/cards.js: the timing-field hook already logs these ------
// activities for every date SET - this proves the mechanism this trigger
// reuses actually exists and is not something this change invents.

test('the Cards.before.update timing-field hook logs a-receivedAt/a-startAt/a-dueAt/a-endAt', () => {
  const block = serverCardsSrc.slice(
    serverCardsSrc.indexOf("const timingaction = ['receivedAt', 'dueAt', 'startAt', 'endAt'];"),
  );
  const body = block.slice(0, block.indexOf('\n});') + 4);
  assert.ok(/activityType = `a-\$\{action\}`;/.test(body));
  assert.ok(/await Activities\.insertAsync\(/.test(body));
  // Reads modifier.$set - only fires for a real SET, not for an $unset clear
  // (unsetDue/unsetStart/unsetEnd/unsetReceived), matching "set or changed".
  assert.ok(/modifier\.\$set\[action\]/.test(body));
});

// --- server/rulesHelper.js: the matcher works generically off TriggersDef --
// (findMatchingRules just looks TriggersDef[activity.activityType] up - no
// per-activityType code, so registering the trigger above is sufficient, but
// prove the matching actually behaves for a set of realistic activities.)

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

const dueChangedActivity = {
  activityType: 'a-dueAt',
  boardId: 'B1',
  cardId: 'C1',
  userId: 'U1',
  username: 'alice',
  listId: 'L1',
  swimlaneId: 'S1',
  timeKey: 'dueAt',
  timeValue: '2026-10-01T00:00:00.000Z',
  timeOldValue: '',
};
const startChangedActivity = { ...dueChangedActivity, activityType: 'a-startAt', timeKey: 'startAt' };
const endChangedActivity = { ...dueChangedActivity, activityType: 'a-endAt', timeKey: 'endAt' };
const receivedChangedActivity = { ...dueChangedActivity, activityType: 'a-receivedAt', timeKey: 'receivedAt' };
const labelActivity = { ...dueChangedActivity, activityType: 'addedLabel', labelId: 'L2' };

test('"when the due date changes" (no board/user restriction stored) fires on an a-dueAt activity', async () => {
  const engine = makeMatcherEngine();
  const selector = await engine.buildMatchingFieldsMap(
    dueChangedActivity, TriggersDef['a-dueAt'].matchingFields,
  );
  const uiTrigger = { activityType: 'a-dueAt', boardId: 'B1' };
  assert.strictEqual(mongoDocMatches(uiTrigger, selector), true);
});

test('"when the due date changes" on board B1 does not fire for a due-date change on board B2', async () => {
  const engine = makeMatcherEngine();
  const selector = await engine.buildMatchingFieldsMap(
    dueChangedActivity, TriggersDef['a-dueAt'].matchingFields,
  );
  const uiTrigger = { activityType: 'a-dueAt', boardId: 'B2' };
  assert.strictEqual(mongoDocMatches(uiTrigger, selector), false);
});

test('negative: a "due date changed" trigger does not fire on a start/end/received date change', async () => {
  const engine = makeMatcherEngine();
  const dueTrigger = { activityType: 'a-dueAt', boardId: 'B1' };
  for (const activity of [startChangedActivity, endChangedActivity, receivedChangedActivity]) {
    // eslint-disable-next-line no-await-in-loop
    const selector = await engine.buildMatchingFieldsMap(activity, TriggersDef[activity.activityType].matchingFields);
    assert.strictEqual(mongoDocMatches(dueTrigger, selector), false, `${activity.activityType} must not match a-dueAt trigger`);
  }
});

test('negative: the 4 date triggers do not cross-fire on each other', async () => {
  const engine = makeMatcherEngine();
  const activities = {
    'a-dueAt': dueChangedActivity,
    'a-startAt': startChangedActivity,
    'a-endAt': endChangedActivity,
    'a-receivedAt': receivedChangedActivity,
  };
  for (const fireType of DATE_ACTIVITY_TYPES) {
    // eslint-disable-next-line no-await-in-loop
    const selector = await engine.buildMatchingFieldsMap(
      activities[fireType], TriggersDef[fireType].matchingFields,
    );
    for (const triggerType of DATE_ACTIVITY_TYPES) {
      const matches = mongoDocMatches({ activityType: triggerType, boardId: 'B1' }, selector);
      if (triggerType === fireType) {
        assert.strictEqual(matches, true, `${triggerType} trigger should fire on its own activity`);
      } else {
        assert.strictEqual(matches, false, `${triggerType} trigger must not fire on ${fireType} activity`);
      }
    }
  }
});

test('negative: an unrelated activity (a label change) does not match any date-field trigger', async () => {
  const engine = makeMatcherEngine();
  const selector = await engine.buildMatchingFieldsMap(
    labelActivity, TriggersDef.addedLabel.matchingFields,
  );
  for (const triggerType of DATE_ACTIVITY_TYPES) {
    assert.strictEqual(mongoDocMatches({ activityType: triggerType, boardId: 'B1' }, selector), false);
  }
});

// --- client/components/rules/triggers/cardTriggers.jade|js: the Add Rule UI -

test('the card-triggers UI offers the 4 date-changed triggers', () => {
  assert.ok(/js-add-due-date-changed-trigger/.test(cardTriggersJadeSrc));
  assert.ok(/js-add-start-date-changed-trigger/.test(cardTriggersJadeSrc));
  assert.ok(/js-add-end-date-changed-trigger/.test(cardTriggersJadeSrc));
  assert.ok(/js-add-received-date-changed-trigger/.test(cardTriggersJadeSrc));
  assert.ok(/\{\{_'r-when-a-due-date-changed'\}\}/.test(cardTriggersJadeSrc));
  assert.ok(/\{\{_'r-when-a-start-date-changed'\}\}/.test(cardTriggersJadeSrc));
  assert.ok(/\{\{_'r-when-a-end-date-changed'\}\}/.test(cardTriggersJadeSrc));
  assert.ok(/\{\{_'r-when-a-received-date-changed'\}\}/.test(cardTriggersJadeSrc));
});

test('each click handler stores its own activityType, matching TriggersDef', () => {
  const cases = [
    ['js-add-due-date-changed-trigger', 'a-dueAt'],
    ['js-add-start-date-changed-trigger', 'a-startAt'],
    ['js-add-end-date-changed-trigger', 'a-endAt'],
    ['js-add-received-date-changed-trigger', 'a-receivedAt'],
  ];
  for (const [cssClass, activityType] of cases) {
    const idx = cardTriggersJsSrc.indexOf(`'click .${cssClass}'`);
    assert.ok(idx !== -1, `${cssClass} handler exists`);
    const nextIdx = cardTriggersJsSrc.indexOf("\n  'click .", idx + 1);
    const body = cardTriggersJsSrc.slice(idx, nextIdx === -1 ? undefined : nextIdx);
    assert.ok(
      body.includes(`activityType: '${activityType}'`),
      `${cssClass} handler stores activityType '${activityType}'`,
    );
    assert.ok(TriggersDef[activityType], `${activityType} is a registered TriggersDef entry`);
  }
});

// --- i18n: the new keys exist in English and are not equal to related keys -

test('en.i18n.json has the 4 new keys, distinct from each other', () => {
  const keys = [
    'r-when-a-due-date-changed',
    'r-when-a-start-date-changed',
    'r-when-a-end-date-changed',
    'r-when-a-received-date-changed',
  ];
  for (const key of keys) {
    assert.ok(typeof enI18n[key] === 'string' && enI18n[key].length > 0, `${key} exists in en.i18n.json`);
  }
  const values = keys.map(k => enI18n[k]);
  assert.strictEqual(new Set(values).size, values.length, 'the 4 strings are all distinct');
});

test('every non-English locale file has the 4 new keys translated (not left equal to English)', () => {
  const dataDir = path.join(repoRoot, 'imports/i18n/data');
  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.i18n.json'))
    .filter(f => !/^en(?:[-_]|\.)/.test(f));
  const newKeys = [
    'r-when-a-due-date-changed',
    'r-when-a-start-date-changed',
    'r-when-a-end-date-changed',
    'r-when-a-received-date-changed',
  ];
  const untranslated = [];
  const missing = [];
  for (const file of files) {
    const locale = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    for (const key of newKeys) {
      if (!(key in locale)) { missing.push(`${file}:${key}`); continue; }
      if (locale[key] === enI18n[key]) untranslated.push(`${file}:${key}`);
    }
  }
  assert.deepStrictEqual(missing, [], 'no locale file is missing a new key');
  assert.deepStrictEqual(untranslated, [], 'no locale file left a new key equal to English');
});

test('every locale file inserts the 4 new keys right after r-when-a-card-matches-advanced-filter', () => {
  const dataDir = path.join(repoRoot, 'imports/i18n/data');
  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.i18n.json'))
    .filter(f => f !== 'en.i18n.json');
  const ordered = [
    'r-when-a-card-matches-advanced-filter',
    // The "text contains" trigger (advanced-filter-label's sibling) landed
    // between this guard's own keys and the date triggers, so it now sits
    // between them in every locale file, en.i18n.json included.
    'r-when-a-card-title-or-description-contains',
    'r-when-a-due-date-changed',
    'r-when-a-start-date-changed',
    'r-when-a-end-date-changed',
    'r-when-a-received-date-changed',
  ];
  for (const file of files) {
    const keys = Object.keys(JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8')));
    if (!ordered.every(k => keys.includes(k))) continue;
    for (let i = 1; i < ordered.length; i++) {
      assert.strictEqual(
        keys.indexOf(ordered[i]), keys.indexOf(ordered[i - 1]) + 1,
        `${file}: ${ordered[i]} should immediately follow ${ordered[i - 1]}`,
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
