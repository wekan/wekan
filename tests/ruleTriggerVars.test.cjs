'use strict';

// #4294 / #3195: trigger values accept the action variables
// (models/lib/ruleTriggerVars.js). Run: node tests/ruleTriggerVars.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { triggerValueHasVars, triggerVarMatches, triggerMatchesWithVars } = require('../models/lib/ruleTriggerVars.js');

const vars = {
  creator: 'carol', assignees: 'alice, bob', members: '', list: 'Doing', card: 'Fix login',
  customfield: { target: 'Done', 'review stage': 'QA' },
};

assert.ok(triggerValueHasVars('{customField:Target}'));
assert.ok(triggerValueHasVars('Stage {list}'));
for (const plain of ['Done', '*', '', null, undefined, 'a { b }', '{}', '{ x }']) assert.ok(!triggerValueHasVars(plain), String(plain));

// A field resolved from the card.
assert.ok(triggerVarMatches('{customField:Target}', 'Done', vars));
assert.ok(triggerVarMatches('{customfield:REVIEW STAGE}', 'QA', vars), 'field names are case-insensitive');
assert.ok(triggerVarMatches('Stage {list}', 'Stage Doing', vars));
assert.ok(!triggerVarMatches('{customField:Target}', 'Doing', vars));
// People tokens match any one listed name, never the joined text.
assert.ok(triggerVarMatches('{assignees}', 'alice', vars));
assert.ok(triggerVarMatches('{assignees}', 'bob', vars));
assert.ok(!triggerVarMatches('{assignees}', 'alice, bob', vars));
assert.ok(!triggerVarMatches('{assignees}', 'carol', vars));
assert.ok(triggerVarMatches('{creator}', 'carol', vars));
assert.ok(!triggerVarMatches('{members}', '', vars), 'nobody listed matches nobody');
// Negative: an unknown or unset token stays literal and matches only itself.
assert.ok(!triggerVarMatches('{customField:Missing}', 'Done', vars));
assert.ok(triggerVarMatches('{customField:Missing}', '{customField:Missing}', vars));
assert.ok(!triggerVarMatches('{nosuch}', '', vars));
assert.ok(!triggerVarMatches('{customField:Target}', undefined, vars));
assert.ok(!triggerVarMatches('Done', 'Done', vars), 'a plain value is the ordinary query, not this');
console.log('  ok - a trigger value with variables is resolved for the card');

// Whole trigger: variable fields resolved, the rest by the ordinary rule.
const plain = actual => (field, expected) => expected === undefined || expected === null || expected === '*' || expected === actual[field];
const fields = ['boardId', 'listName', 'userId', 'swimlaneName', 'cardTitle'];
const actual = { boardId: 'b1', listName: 'Done', userId: 'alice', swimlaneName: 'Default', cardTitle: 'Fix login' };
const trigger = { boardId: 'b1', listName: '{customField:Target}', userId: '*', swimlaneName: '*', cardTitle: '*' };
assert.ok(triggerMatchesWithVars(trigger, fields, actual, vars, plain(actual)));
assert.ok(triggerMatchesWithVars({ ...trigger, userId: '{assignees}' }, fields, actual, vars, plain(actual)));
assert.ok(!triggerMatchesWithVars({ ...trigger, userId: '{creator}' }, fields, actual, vars, plain(actual)));
assert.ok(!triggerMatchesWithVars({ ...trigger, swimlaneName: 'Other' }, fields, actual, vars, plain(actual)),
  'a plain field still has to match');
assert.ok(!triggerMatchesWithVars({ ...trigger, boardId: 'b2' }, fields, actual, vars, plain(actual)));
assert.ok(!triggerMatchesWithVars({ ...trigger, listName: 'Done' }, fields, actual, vars, plain(actual)),
  'a trigger without variables is left to the ordinary query, so it is not matched twice');
console.log('  ok - every field of a trigger has to match');

// Wiring.
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const helper = read('server/rulesHelper.js');
assert.match(helper, /\$or: tokenFields\.map\(field => \(\{ \[field\]: \{ \$regex: '\\\\\{\\\\w\+\(\?::\[\^\{\}\]\+\)\?\\\\\}' \} \}\)\)/);
assert.match(helper, /boardId: \{ \$in: \[activity\.boardId, '\*', null\] \}/, 'only this board\'s triggers');
assert.match(helper, /const vars = await buildRuleVars\(activity, card\);/, 'the same variables actions use');
assert.match(helper, /tokenValues\.userId = actor \? actor\.username : undefined;/);
// RepointBleed (2026-10-02) added the same-board condition to this filter.
assert.match(helper, /return uniqueRules\(matchingRules\.filter\(rule => rule\.enabled !== false && rule\.boardId === activity\.boardId\)\);/,
  'a disabled rule still never fires, and one matched twice runs once');
assert.match(read('client/components/rules/rulesMain.js'), /if \(triggerValueHasVars\(username\)\) \{[\s\S]*?trigger\.userId = username\.trim\(\);/);
assert.match(read('client/components/rules/rulesTriggers.jade'), /js-trigger-vars-hint \{\{_ 'r-trigger-vars-hint'\}\}/);
assert.ok(JSON.parse(read('imports/i18n/data/en.i18n.json'))['r-trigger-vars-hint'].includes('{customField:Name}'));
console.log('  ok - rules find token triggers, and the editor keeps and explains them');

// Literal example variables must survive translation unchanged.
{
  const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
  const readLocale = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
  const english = readLocale('en');
  const keys = ["r-vars-people-hint", "r-when-card-date", "r-rule-any-trigger-help", "r-add-trigger-to-rule", "r-add-action-to-rule", "r-remove-rule-part", "r-trigger-vars-hint"];
  const pending = JSON.parse(read('releases/translations/pending-transifex.json')).keys;
  for (const key of keys) {
    assert.ok(!pending.some(entry => entry.key === key), `${key}: completed placeholder fill is not pending`);
  }
  const braceTokens = text => (text.match(/\{[^{}]+\}/g) || []).sort();
  const localeCodes = fs.readdirSync(path.join(__dirname, '../imports/i18n/data'))
    .filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_.])/.test(file))
    .map(file => file.replace(/\.i18n\.json$/, ''));
  for (const code of localeCodes) {
    const locale = readLocale(code);
    assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source order`);
    for (const key of keys) {
      assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
      assert.notEqual(locale[key], english[key], `${code}:${key}: no English fallback`);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: source tokens`);
      assert.deepEqual(braceTokens(locale[key]), braceTokens(english[key]), `${code}:${key}: literal rule variables`);
    }
  }
  for (const [code, trigger, action] of [['rup', 'Evenimentu di porniri', 'Acțiuni'], ['ve-CC', 'Evento de avìo', 'Asion']]) {
    const locale = readLocale(code);
    assert.equal(locale['r-trigger'], trigger);
    assert.equal(locale['r-action'], action);
    assert.doesNotMatch(locale['r-trigger'] + locale['r-action'], /disparador|Azione/);
  }
  assert.equal(readLocale('ve-CC').swimlane, 'Corsia');
  const venda = readLocale('ve');
  assert.equal(venda['r-trigger'], 'Tshiwo tshine tsha thoma mulayo');
  assert.equal(venda['r-action'], 'Mushumo');
  assert.equal(venda.title, 'Ṱhoho');
  for (const key of ['r-trigger', 'r-action', 'title', ...keys]) {
    assert.doesNotMatch(venda[key], /Qalisa|Isenzo|Isihloko/, `${key}: no Nguni seed labels`);
  }
  assert.equal(readLocale('qu')['r-trigger'], 'Qallariq');
  assert.equal(readLocale('qu')['r-action'], 'Rurana');
  assert.equal(readLocale('ay')['r-trigger'], 'Qalltayiri');
  for (const code of ['qu', 'ay', 'gn', 'ff', 've-PP', 'vo', 'kl', 'nah', 'tlh', 'zgh', 'iu', 'wal', 'tig']) {
    for (const key of ['r-trigger', 'r-action', ...keys]) {
      assert.doesNotMatch(readLocale(code)[key], /Kay willaymi:|Aymar aruna:|Trigger|Action/, `${code}:${key}: no prefixed English`);
    }
  }
  const wolaytta = readLocale('wal');
  for (const key of ['r-trigger', 'r-action', 'r-rule', 'r-add-trigger', 'r-add-action', ...keys]) {
    assert.doesNotMatch(wolaytta[key], /Wolayttatto:|Trigger|Rule|trigger/, `${key}: no prefixed English labels`);
  }
  const volapuk = readLocale('vo');
  assert.equal(volapuk['r-rule'], 'Nom');
  assert.equal(volapuk['r-action'], 'Dun');
  assert.equal(volapuk.title, 'Tiäd');
  assert.doesNotMatch(volapuk['r-rule'] + volapuk.title, /Regulo|Titolo/);
  const luganda = readLocale('lg');
  assert.equal(luganda['r-trigger'], 'Ekitandika etteeka');
  assert.doesNotMatch(luganda['r-trigger'], /Trigger|mu Luganda/);
  const waray = readLocale('wa-RR');
  assert.equal(waray['r-trigger'], 'Panhitabo nga nagpapagana');
  assert.equal(waray.swimlane, 'Agianan');
  assert.equal(waray.checklist, 'Lista han pagsusi');
  for (const key of ['r-trigger', 'swimlane', 'checklist', ...keys]) {
    assert.doesNotMatch(waray[key], /Déclencheur|Couloir|Check-list/, `${key}: no wrong-language seed label`);
  }
  const tongan = readLocale('to');
  assert.equal(tongan['r-trigger'], 'Meʻa kamata');
  assert.equal(tongan['r-action'], 'Ngāue');
  for (const key of ['r-trigger', 'r-action', ...keys]) {
    assert.doesNotMatch(tongan[key], /Faka-Tonga:|\b(?:Trigger|Action)\b/, `${key}: no prefixed English label`);
  }
  const darija = readLocale('ary');
  assert.equal(darija['r-trigger'], 'حدث كيشعل القاعدة');
  assert.equal(darija['r-action'], 'إجراء');
  assert.equal(darija.swimlane, 'مسار');
  for (const key of ['r-trigger', 'r-action', 'swimlane', ...keys]) {
    assert.doesNotMatch(darija[key], /[پچژگکی]/, `${key}: no Persian letters from the wrong-language seed`);
  }
  assert.notDeepEqual(braceTokens('{customField:Name}'), braceTokens('{customField:Translated}'));
  console.log(`Rule builder translations: 7 strings in ${localeCodes.length} locales passed`);
}
