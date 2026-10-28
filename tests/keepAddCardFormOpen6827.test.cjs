'use strict';

// #6827: a list's Add card form stayed open after a card was added, for the
// next card ("We keep the form opened"). It closes now once the card is added;
// keeping it open is a Member Settings switch, off by default.
// Run: node tests/keepAddCardFormOpen6827.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
console.log('keepAddCardFormOpen6827:');

const body = read('client/components/lists/listBody.js');
const addCard = body.slice(body.indexOf('this.addCard = async (evt) => {'), body.indexOf('this.clickOnMiniCard'));

test('a Member Settings switch, off unless explicitly on', () => {
  const users = read('models/users.js');
  assert.match(users, /'profile\.keepAddCardFormOpen': \{[\s\S]{0,400}type: Boolean,\n\s+optional: true,/);
  assert.match(users, /hasKeepAddCardFormOpen\(\) \{\n\s+return \(this\.profile \|\| \{\}\)\.keepAddCardFormOpen === true;/);
  const server = read('server/models/users.js');
  assert.match(server, /async toggleKeepAddCardFormOpen\(\) \{\n\s+if \(!this\.userId\) throw new Meteor\.Error\('not-logged-in'/);
  assert.match(server, /\$set: \{ 'profile\.keepAddCardFormOpen': \(user\.profile \|\| \{\}\)\.keepAddCardFormOpen !== true \}/);
  const jade = read('client/components/users/userHeader.jade');
  assert.match(jade, /a\.js-toggle-keep-add-card-form-open\(title="\{\{_ 'keep-add-card-form-open-description'\}\}"\)\n\s+i\.fa\.fa-plus-square\n\s+\| \{\{_ 'keep-add-card-form-open'\}\}\n\s+if isKeepAddCardFormOpen\n\s+i\.fa\.fa-check/);
  assert.match(read('client/components/users/userHeader.js'),
    /'click \.js-toggle-keep-add-card-form-open'\(\) \{\n\s+if \(ReactiveCache\.getCurrentUser\(\)\) Meteor\.call\('toggleKeepAddCardFormOpen'\);/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['keep-add-card-form-open'] && en['keep-add-card-form-open-description']);
});

test('Add card closes its form after the cards are added, unless kept open', () => {
  assert.match(body, /const keepAddCardFormOpen = \(\) => \{\n\s+const user = ReactiveCache\.getCurrentUser\(\);\n\s+return Boolean\(user && typeof user\.hasKeepAddCardFormOpen === 'function' && user\.hasKeepAddCardFormOpen\(\)\);/);
  assert.match(addCard, /closeAfterAdd = titleIndex > 0 && !keepAddCardFormOpen\(\);/);
  assert.match(addCard, /if \(closeAfterAdd\) \{[\s\S]{0,200}submittedForm\.querySelector\('\.js-close-inlined-form'\)\?\.click\(\);/);
  // The form's own close button, which also clears the one-open-form tracker.
  assert.match(read('client/components/lists/listBody.jade'), /a\.js-close-inlined-form/);
});

test('negative: not while the titles of a multi-line paste are still being added, nor after a failure', () => {
  // The loop reads the form between titles; closing at submit (autoclose)
  // would take it away mid-paste. So the add-card forms keep autoclose=false,
  // and the decision is made after the loop, inside try - a throw skips it.
  assert.strictEqual((read('client/components/lists/listBody.jade').match(/\+inlinedForm\(autoclose=false/g) || []).length, 3);
  const loopEnd = addCard.indexOf('closeAfterAdd = titleIndex');
  assert.ok(loopEnd > addCard.indexOf('for (const rawTitle of titles)'), 'decided after the loop');
  assert.ok(loopEnd < addCard.indexOf('} catch (error) {'), 'inside try, so a failed add keeps the form and its text');
  assert.ok(addCard.indexOf('if (closeAfterAdd)') > addCard.indexOf('} finally {'), 'closed after the finally re-enables it');
  assert.doesNotMatch(addCard, /We keep the form opened/);
});

console.log(`\nkeepAddCardFormOpen6827: ${passed} passed`);
