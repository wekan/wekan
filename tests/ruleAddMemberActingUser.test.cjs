'use strict';

// #2522: the "add member" rule action gained an acting-user option - a
// sentinel `username` (RULE_ACTING_USER_SENTINEL, '_actinguser_') meaning
// "add whoever's action fired this rule" instead of a fixed board member.
// It must resolve via the SAME acting-user logic #3304/#3301 already built
// for the {username} template variable in server/rulesHelper.js's
// buildRuleVars() - both now call models/lib/ruleActingUser.js's
// resolveActingUserId(activity), so there is no second implementation of
// "who triggered this rule".
//
// Run: node tests/ruleAddMemberActingUser.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// resolveActingUserId() is a plain function (no Meteor imports), so it can be
// exercised directly under plain Node by transpiling the single ES-module
// export statement away.
function loadActingUserModule() {
  const src = fs.readFileSync(
    path.join(repoRoot, 'models/lib/ruleActingUser.js'),
    'utf8',
  );
  const cjs = src
    .replace(/export const RULE_ACTING_USER_SENTINEL/, 'const RULE_ACTING_USER_SENTINEL')
    .replace(/export function resolveActingUserId/, 'function resolveActingUserId')
    + '\nmodule.exports = { RULE_ACTING_USER_SENTINEL, resolveActingUserId };\n';
  const tmpFile = path.join(repoRoot, '.tools/tmp/ruleActingUser.cjs.tmp.js');
  fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
  fs.writeFileSync(tmpFile, cjs);
  try {
    delete require.cache[require.resolve(tmpFile)];
    return require(tmpFile);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

const { RULE_ACTING_USER_SENTINEL, resolveActingUserId } = loadActingUserModule();

test('the sentinel is a distinct, non-empty string', () => {
  assert.strictEqual(typeof RULE_ACTING_USER_SENTINEL, 'string');
  assert.ok(RULE_ACTING_USER_SENTINEL.length > 0);
});

test('resolveActingUserId() resolves to the activity userId that triggered the rule', () => {
  assert.strictEqual(
    resolveActingUserId({ userId: 'userWhoMovedTheCard', activityType: 'moveCard' }),
    'userWhoMovedTheCard',
  );
});

test('resolveActingUserId() reproduces the reporter\'s exact scenario: move triggers add-as-member', () => {
  // #2522: "when a card moves to list X, add whoever just moved it as a
  // member" - the activity recorded for a moveCard is the mover's own
  // userId, exactly like any other card-affecting activity.
  const moveActivity = { activityType: 'moveCard', userId: 'mover123', cardId: 'card1', boardId: 'board1' };
  assert.strictEqual(resolveActingUserId(moveActivity), 'mover123');
});

test('resolveActingUserId() returns null for a system/no-user activity ("*")', () => {
  assert.strictEqual(resolveActingUserId({ userId: '*' }), null);
});

test('resolveActingUserId() returns null when there is no activity or no userId', () => {
  assert.strictEqual(resolveActingUserId(null), null);
  assert.strictEqual(resolveActingUserId({}), null);
});

// --- server/rulesHelper.js reuse checks (source-based: the file is Meteor-
// coupled and cannot run under plain Node, same approach as
// tests/ruleRemoveMemberAction.test.cjs) ---

const rulesHelperSrc = fs.readFileSync(
  path.join(repoRoot, 'server/rulesHelper.js'),
  'utf8',
);

const addMemberBlock = (() => {
  const start = rulesHelperSrc.indexOf("action.actionType === 'addMember'");
  assert.ok(start > -1, 'addMember action must exist');
  const nextBlock = rulesHelperSrc.indexOf("if (action.actionType === 'removeMember')");
  assert.ok(nextBlock > start, 'removeMember action must follow addMember');
  return rulesHelperSrc.slice(start, nextBlock);
})();

const buildRuleVarsBlock = rulesHelperSrc.slice(
  rulesHelperSrc.indexOf('async function buildRuleVars'),
  rulesHelperSrc.indexOf('export const RulesHelper'),
);

test('rulesHelper.js imports the shared acting-user resolver (no second implementation)', () => {
  assert.ok(
    /import\s*\{\s*RULE_ACTING_USER_SENTINEL\s*,\s*resolveActingUserId\s*\}\s*from\s*['"]\/models\/lib\/ruleActingUser['"]/.test(
      rulesHelperSrc,
    ),
    'rulesHelper.js must import RULE_ACTING_USER_SENTINEL and resolveActingUserId from models/lib/ruleActingUser',
  );
});

test('addMember checks for the acting-user sentinel and resolves via resolveActingUserId()', () => {
  assert.ok(
    /action\.username\s*===\s*RULE_ACTING_USER_SENTINEL/.test(addMemberBlock),
    'addMember must branch on the acting-user sentinel',
  );
  assert.ok(
    /resolveActingUserId\(activity\)/.test(addMemberBlock),
    'addMember must resolve the acting user via the shared resolveActingUserId()',
  );
  assert.ok(
    /card\.assignMember\(/.test(addMemberBlock),
    'the acting-user option must still assign via card.assignMember(), same as the fixed-member path',
  );
});

test('buildRuleVars also resolves {username} via the SAME resolveActingUserId() (single source of truth)', () => {
  assert.ok(
    /resolveActingUserId\(activity\)/.test(buildRuleVarsBlock),
    'buildRuleVars must call the shared resolveActingUserId(), not its own activity.userId check',
  );
});

test('negative: addMember does not re-derive the acting user with its own activity.userId check', () => {
  // The only way to get "who triggered this rule" inside the addMember block
  // must be resolveActingUserId(activity) - a second, ad-hoc
  // `activity.userId !== '*'`-style check here would be the same fault
  // #3304/#3301 already solved, reintroduced a second time.
  assert.ok(
    !/activity\.userId\s*&&\s*activity\.userId\s*!==\s*['"]\*['"]/.test(addMemberBlock),
    'addMember must not contain its own inline acting-user resolution',
  );
});

test('negative: no other file re-implements the same acting-user shape independently', () => {
  // Search the whole tree (excluding generated/vendor/scratch dirs and this
  // test itself) for the same "activity.userId && activity.userId !== '*'"
  // shape outside ruleActingUser.js - that shape belongs in exactly one
  // place now.
  const out = execFileSync(
    'grep',
    [
      '-rl',
      '-E',
      "activity\\.userId\\s*&&\\s*activity\\.userId\\s*!==\\s*['\"]\\*['\"]",
      '--include=*.js',
      'server',
      'client',
      'models',
      'imports',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  ).trim();
  const hits = out ? out.split('\n') : [];
  const unexpected = hits.filter(f => f !== 'models/lib/ruleActingUser.js');
  assert.deepStrictEqual(
    unexpected,
    [],
    `the acting-user shape must live only in models/lib/ruleActingUser.js, found also in: ${unexpected.join(', ')}`,
  );
});

// --- fixed-member "add member" action is unaffected ---

test('the ordinary fixed-member addMember path still looks up ReactiveCache.getUser by username', () => {
  assert.ok(
    /ReactiveCache\.getUser\(\{\s*username:\s*action\.username\s*\}\)/.test(addMemberBlock),
    'a normal (non-sentinel) username must still resolve via ReactiveCache.getUser({ username })',
  );
});

test('the fixed-member path is reached only in the else branch of the sentinel check', () => {
  const sentinelIdx = addMemberBlock.indexOf('RULE_ACTING_USER_SENTINEL');
  const elseIdx = addMemberBlock.indexOf('} else {', sentinelIdx);
  const lookupIdx = addMemberBlock.indexOf('ReactiveCache.getUser({ username: action.username })');
  assert.ok(sentinelIdx > -1 && elseIdx > sentinelIdx && lookupIdx > elseIdx,
    'the fixed-member lookup must sit in the else branch, after the sentinel check');
});

// --- client wiring ---

const cardActionsJs = fs.readFileSync(
  path.join(repoRoot, 'client/components/rules/actions/cardActions.js'),
  'utf8',
);
const cardActionsJade = fs.readFileSync(
  path.join(repoRoot, 'client/components/rules/actions/cardActions.jade'),
  'utf8',
);

test('the client imports the same shared sentinel constant (not a duplicated string)', () => {
  assert.ok(
    /import\s*\{\s*RULE_ACTING_USER_SENTINEL\s*\}\s*from\s*['"]\/models\/lib\/ruleActingUser['"]/.test(
      cardActionsJs,
    ),
    'cardActions.js must import RULE_ACTING_USER_SENTINEL from models/lib/ruleActingUser',
  );
});

test('the client saves an addMember action with the acting-user sentinel as username', () => {
  const handlerStart = cardActionsJs.indexOf('js-add-actinguser-member-action');
  assert.ok(handlerStart > -1, 'a js-add-actinguser-member-action click handler must exist');
  const handlerBlock = cardActionsJs.slice(handlerStart, handlerStart + 600);
  assert.ok(/actionType:\s*'addMember'/.test(handlerBlock), 'must save actionType addMember');
  assert.ok(/username:\s*RULE_ACTING_USER_SENTINEL/.test(handlerBlock), 'must save the sentinel as username');
});

test('the jade template has a button wired to the acting-user handler with a translated label', () => {
  assert.ok(cardActionsJade.includes('js-add-actinguser-member-action'),
    'cardActions.jade must contain a js-add-actinguser-member-action trigger button');
  assert.ok(cardActionsJade.includes("{{_'r-add-actinguser-member'}}"),
    'the button must show the translated r-add-actinguser-member label');
});

// --- i18n ---

test('en.i18n.json defines the new label', () => {
  const en = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'imports/i18n/data/en.i18n.json'), 'utf8'),
  );
  assert.strictEqual(typeof en['r-add-actinguser-member'], 'string');
  assert.ok(en['r-add-actinguser-member'].length > 0);
});

test('every locale file defines a non-placeholder translation for the new label', () => {
  const dataDir = path.join(repoRoot, 'imports/i18n/data');
  const en = JSON.parse(fs.readFileSync(path.join(dataDir, 'en.i18n.json'), 'utf8'));
  const enValue = en['r-add-actinguser-member'];
  // English regional variants legitimately keep the English string, same as
  // every other rule-action label in those files (e.g. r-remove-all).
  const englishLike = new Set([
    'en_AU.i18n.json', 'en-BR.i18n.json', 'en-DE.i18n.json', 'en-GB.i18n.json',
    'en_ID.i18n.json', 'en-IT.i18n.json', 'en-MY.i18n.json', 'en_SG.i18n.json',
    'en_TR.i18n.json', 'en-YS.i18n.json', 'en_ZA.i18n.json',
  ]);
  const missing = [];
  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith('.i18n.json') || file === 'en.i18n.json') continue;
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    const value = data['r-add-actinguser-member'];
    if (typeof value !== 'string' || value.length === 0) {
      missing.push(`${file}: missing`);
      continue;
    }
    if (!englishLike.has(file) && value === enValue) {
      missing.push(`${file}: still equals the English placeholder`);
    }
  }
  assert.deepStrictEqual(missing, [], `locale files without a real translation: ${missing.join(', ')}`);
});

console.log(`\nruleAddMemberActingUser: ${passed} tests passed`);
