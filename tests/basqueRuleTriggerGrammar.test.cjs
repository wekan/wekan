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

const checklistTemplate = fs.readFileSync(path.join(root, 'client/components/rules/triggers/checklistTriggers.jade'), 'utf8');
const itemTrigger = checklistTemplate.split("{{_'r-when-a-item'}}")[1].split('js-add-gen-check-item-trigger')[0];
assert.match(itemTrigger, /option\(value="checked"\) \{\{_'r-checked'\}\}/);
assert.match(itemTrigger, /option\(value="unchecked"\) \{\{_'r-unchecked'\}\}/);
assert.doesNotMatch(itemTrigger, /ruleTriggerCopula/);
assert.equal(eu['r-checked'], 'Markatzen denean');
assert.equal(eu['r-unchecked'], 'Desmarkatzen denean');
assert.notEqual(eu['r-checked'], eu['r-unchecked']);
for (const key of ['r-checked', 'r-unchecked']) {
  assert.match(eu[key], /tzen denean$/);
  assert.doesNotMatch(eu[key], /Checked|Unchecked|marcado/, 'native action vocabulary preserved');
}

// GNOME's native software help attests osatzen denean for completion,
// independently of a dictionary stem or a script test.
const completionRow = checklistTemplate.split('select(id="gen-comp-check-action")')[1]
  .split('js-add-gen-comp-trigger')[0];
assert.match(completionRow, /option\(value="completed"\) \{\{_'r-completed'\}\}/);
assert.doesNotMatch(completionRow, /ruleTriggerCopula/);
assert.equal(eu['r-completed'], 'Osatzen denean');
assert.equal([eu['r-when-a-checklist'], eu['r-completed']].join(' '),
  'Kontrol-zerrenda bat Osatzen denean');
assert.notEqual(eu['r-completed'], eu['r-made-incomplete']);
assert.doesNotMatch(eu['r-completed'], /Completed|completado|\bes\b/);

// Native ZIUR specification uses S3 Bucket as the technical storage term.
assert.equal(eu['s3-bucket'], 'S3 bucket-a');
assert.match(eu['s3-bucket-description'], /S3 bucket-aren izena/);
assert.doesNotMatch(eu['s3-bucket'], /eskualde|gako|fitxategi/i);
const attachmentForm = fs.readFileSync(path.join(root, 'client/components/settings/attachments.jade'), 'utf8');
assert.match(attachmentForm, /cloud-input-label-tr.*'s3-bucket'[\s\S]*?input\.wekan-form-control#s3-bucket/);

// Incomplete is a status change, rather than leaving work unfinished.
assert.equal(eu['r-made-incomplete'], 'Osatu gabe markatzen denean');
assert.doesNotMatch(eu['r-made-incomplete'], /uzten|Osatzen denean/);
assert.equal([eu['r-when-a-checklist'], eu['r-made-incomplete']].join(' '),
  'Kontrol-zerrenda bat Osatu gabe markatzen denean');
assert.match(completionRow, /option\(value="uncompleted"\) \{\{_'r-made-incomplete'\}\}/);

assert.equal(eu['r-when-a-item'], 'Kontrol-zerrendako elementu bat');
for (const action of ['r-checked', 'r-unchecked']) {
 const sentence = [eu['r-when-a-item'], eu[action]].join(' ');
 assert.equal(sentence, `Kontrol-zerrendako elementu bat ${action === 'r-checked' ? 'Markatzen' : 'Desmarkatzen'} denean`);
 assert.doesNotMatch(sentence, /\bes\b|\bda\b/);
}

assert.equal(eu['r-moved-to'], 'Eramaten denean hona:');
assert.equal(eu['r-moved-from'], 'Eramaten denean hemendik:');
assert.notEqual(eu['r-moved-to'], eu['r-moved-from']);
for (const key of ['r-moved-to', 'r-moved-from']) {
  const label = [eu['r-when-a-card'], eu[key], eu['r-list'], '[Demo]'].join(' ');
  assert.match(label, /^Txartel bat Eramaten denean (hona|hemendik): zerrenda \[Demo\]$/);
  assert.doesNotMatch(label, /\bda\b|\bis\b|\bes\b/);
}
const moveTemplate = fs.readFileSync(path.join(root, 'client/components/rules/triggers/boardTriggers.jade'), 'utf8');
assert.match(moveTemplate, /option\(value="moved-to"\) \{\{_'r-moved-to'\}\}/);
assert.match(moveTemplate, /option\(value="moved-from"\) \{\{_'r-moved-from'\}\}/);
const moveHandler = fs.readFileSync(path.join(root, 'client/components/rules/triggers/boardTriggers.js'), 'utf8');
assert.match(moveHandler, /actionSelected === 'moved-to'[\s\S]*?oldListName: '\*'/);
assert.match(moveHandler, /actionSelected === 'moved-from'[\s\S]*?oldListName: listName/);

for (const [subject, noun, added, removed] of [
 ['r-when-a-member', 'Kide bat', 'r-added-to', 'r-removed-from'],
 ['r-when-a-attach', 'Eranskin bat', 'r-attachment-added-to', 'r-attachment-removed-from'],
]) {
 assert.equal(eu[subject], noun);
 for (const [action, direction] of [[added, 'Gehitzen denean hona:'], [removed, 'Kentzen denean hemendik:']]) {
  const text = [eu[subject], eu[action], eu['r-a-card']].join(' ');
  assert.equal(text, `${noun} ${direction} txartel bat`);
  assert.doesNotMatch(text, /\bda\b|\bis\b|\bes\b/);
 }
}
const cardTriggerTemplate = fs.readFileSync(path.join(root, 'client/components/rules/triggers/cardTriggers.jade'), 'utf8');
assert.match(cardTriggerTemplate, /r-when-a-member[\s\S]*?gen-member-action[\s\S]*?r-added-to[\s\S]*?r-removed-from/);
assert.match(cardTriggerTemplate, /r-when-a-attach[\s\S]*?attach-action[\s\S]*?r-attachment-added-to[\s\S]*?r-attachment-removed-from/);

const { ruleNameBeforeSubject } = require('../imports/i18n/ruleGrammar');
for (const language of ['eu', 'EU', 'eu-ES', 'eu_ES']) assert.equal(ruleNameBeforeSubject(language), true);
for (const language of ['en', 'th', 'europe', 'fr', undefined]) assert.equal(ruleNameBeforeSubject(language), false);
for (const key of ['r-when-the-label', 'r-when-the-member', 'r-when-the-assignee', 'r-when-the-checklist', 'r-when-the-item']) {
 const subject = ['[Demo]', eu[key]].join(' ');
 assert.match(subject, /^\[Demo\] .+ hau$/);
 assert.doesNotMatch(subject, /hau \[Demo\]$/);
 const template = ['r-when-the-label', 'r-when-the-member', 'r-when-the-assignee'].includes(key) ? cardTriggerTemplate : checklistTemplate;
 assert.ok(template.includes(`unless ruleNameBeforeSubject\n        div.trigger-text\n          | {{_'${key}'}}`));
 assert.ok(template.includes(`if ruleNameBeforeSubject\n        div.trigger-text\n          | {{_'${key}'}}`));
}
// An assignee subject must be a noun phrase, not the imperative "Assign this".
{
  const assigneeData = JSON.parse(require('node:fs').readFileSync('imports/i18n/data/eu.i18n.json', 'utf8'));
  require('node:assert/strict').equal(assigneeData['r-when-the-assignee'], 'Esleitutako erabiltzaile hau');
  require('node:assert/strict').notEqual(assigneeData['r-when-the-assignee'], 'Esleitu hau');
}
