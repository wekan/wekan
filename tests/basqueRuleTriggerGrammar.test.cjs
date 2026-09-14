'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { ruleTriggerCopula } = require('../imports/i18n/ruleGrammar');
const read = locale => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${locale}.i18n.json`)));
const eu = read('eu');
assert.equal(eu['r-by'], 'Nork:');
assert.notEqual(eu['r-by'], 'por');
assert.equal(read('th')['r-is'], 'คือ', 'retain the correct noun-identification translation');
for (const locale of ['th', 'th-TH', 'th_TH', 'TH']) {
  assert.equal(ruleTriggerCopula(locale, 'คือ'), '');
}
assert.equal(eu['r-is'], 'da');
assert.notEqual(eu['r-is'], 'es');
for (const locale of ['eu', 'eu-ES', 'eu_ES', 'EU']) assert.equal(ruleTriggerCopula(locale, 'da'), '');
for (const locale of ['en', 'gl', 'br', 'europe', undefined]) assert.equal(ruleTriggerCopula(locale, 'is'), 'is');
for (const name of ['cardTriggers', 'boardTriggers', 'checklistTriggers']) {
  const jade = fs.readFileSync(path.join(root, `client/components/rules/triggers/${name}.jade`), 'utf8');
  assert.match(jade, /{{ruleTriggerCopula}}/);
  assert.match(jade, /{{_'r-by'}}[\s\S]*?input\(class="user-name"/,
    'actor question labels the username field');
  assert.doesNotMatch(jade, /{{_'r-is'}}/, 'all separately inserted linking verbs use the language-aware helper');
}
const client = fs.readFileSync(path.join(root, 'client/lib/i18n.js'), 'utf8');
assert.match(client, /Template.registerHelper\('ruleTriggerCopula', \(\) => ruleTriggerCopula\(\s*TAPi18n.getLanguage\(\), TAPi18n.__\('r-is'\)/);
// Execute the registered client helper and change its language without reload.
const vm = require('node:vm');
let activeLanguage = 'eu';
const helpers = {};
vm.runInNewContext(client.replace(/^import .*;$/gm, ''), {
  Meteor: { startup() {} },
  Template: { registerHelper(name, fn) { helpers[name] = fn; } },
  TAPi18n: { getLanguage() { return activeLanguage; }, __(key) { return read(activeLanguage)[key]; } },
  require(name) {
    if (name === '/imports/i18n/browserLanguage') return { preferredLanguage() {} };
    if (name === '/imports/i18n/ruleGrammar') return { ruleTriggerCopula };
    throw new Error(`Unexpected import ${name}`);
  },
});
assert.equal(helpers.ruleTriggerCopula(), '');
activeLanguage = 'en';
assert.equal(helpers.ruleTriggerCopula(), 'is', 'helper reads current language on every render');
activeLanguage = 'eu';
assert.equal(helpers.ruleTriggerCopula(), '');
activeLanguage = 'th';
assert.equal(helpers.ruleTriggerCopula(), '');
const assemble = (locale, subject, action, name = '') => {
  const d = read(locale);
  return [d[subject], name, ruleTriggerCopula(locale, d['r-is']), d[action], d['r-a-card']].filter(Boolean).join(' ');
};
for (const noun of ['member', 'assignee']) {
  for (const action of ['r-added-to', 'r-removed-from']) {
    const sentence = assemble('eu', `r-when-the-${noun}`, action, 'Ana');
    assert.doesNotMatch(sentence, /\bes\b|\bda\b/, 'no redundant linking verb before the temporal action');
    assert.match(sentence, /Ana (Gehitzen|Kentzen) denean/);
    assert.match(sentence, /txartel bat$/);
  }
}
assert.equal(assemble('en', 'r-when-the-member', 'r-added-to', 'Ana'), 'When the member Ana is Added to a card');
assert.equal(assemble('gl', 'r-when-the-member', 'r-added-to', 'Ana'), 'Cando a persoa membro Ana é Engadida a unha tarxeta');
for (const action of ['r-added-to', 'r-removed-from', 'r-checked',
  'r-unchecked', 'r-completed', 'r-made-incomplete', 'r-is-moved']) {
  const sentence = assemble('th', 'r-when-the-member', action, 'Ana');
  assert.doesNotMatch(sentence, /คือ/, 'no equative copula before a Thai action');
  assert.ok(sentence.includes(read('th')[action]));
}
console.log('Basque rule grammar: actual trigger wiring, linking-verb omission and other-locale preservation checked; full fluency/browser execution remain open');

// The generic movement trigger is a complete singular temporal clause.
// This does not certify the separate added/removed/directional fragments.
const boardTriggers = fs.readFileSync(path.join(root, 'client/components/rules/triggers/boardTriggers.jade'), 'utf8');
const genericMove = boardTriggers.split('div.trigger-item#trigger-three')[1].split('div.trigger-item#trigger-four')[0];
assert.match(genericMove, /r-when-a-card[\s\S]*?r-is-moved/);
assert.doesNotMatch(genericMove, /ruleTriggerCopula|r-a-card|r-moved-to|r-moved-from/);
assert.equal([eu['r-when-a-card'], eu['r-is-moved']].join(' '), 'Txartel bat lekuz aldatzen denean');
assert.doesNotMatch(eu['r-is-moved'], /\bes\b|\bis\b/, 'retain native temporal predicate rather than Spanish or English');
