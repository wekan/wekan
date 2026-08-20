'use strict';

// Card and minicard edit actions use the same compact, accessible pencil icon
// as the Description section instead of spelling out "Edit" in the UI.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const cardDetails = read('client/components/cards/cardDetails.jade');
const customFields = read('client/components/cards/cardCustomFields.jade');
const comments = read('client/components/activities/comments.jade');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

console.log('cardEditIcons:');

test('visible card Edit actions do not render the Edit translation as text', () => {
  for (const [name, source] of [
    ['card details', cardDetails],
    ['custom fields', customFields],
    ['comments', comments],
  ]) {
    assert.doesNotMatch(source, /\|\s*\{\{_ ['"]edit['"]\}\}/, name);
    assert.doesNotMatch(source, />\s*\{\{_ ['"]edit['"]\}\}/, name);
    assert.doesNotMatch(source,
      /(?:button|a)(?:\.[\w-]+)*(?:\([^\n]*\))?\s+\{\{_ ['"]edit['"]\}\}/,
      name);
  }
});

test('each replacement uses the Description pencil icon accessibly', () => {
  const sources = `${cardDetails}\n${customFields}\n${comments}`;
  const icons = sources.match(/i\.fa\.fa-pencil-square-o\(aria-hidden="true"\)/g) || [];
  assert.ok(icons.length >= 10, `expected at least 10 accessible edit icons, got ${icons.length}`);

  assert.match(cardDetails,
    /a\.js-open-inlined-form\(title="\{\{_ 'edit'\}\}" aria-label="\{\{_ 'edit'\}\}"[\s\S]*?i\.fa\.fa-pencil-square-o\(aria-hidden="true"\)/);
  assert.match(customFields,
    /a\.js-edit-custom-field\(title="\{\{_ 'edit'\}\}" aria-label="\{\{_ 'edit'\}\}"\)[\s\S]*?i\.fa\.fa-pencil-square-o\(aria-hidden="true"\)/);
  assert.match(comments,
    /button\.primary\(type="submit" title="\{\{_ 'edit'\}\}" aria-label="\{\{_ 'edit'\}\}"\)[\s\S]*?i\.fa\.fa-pencil-square-o\(aria-hidden="true"\)/);
});

test('Add uses a plus icon and retains its accessible name', () => {
  assert.match(cardDetails,
    /title="\{\{#if getRequestedBy\}\}\{\{_ 'edit'\}\}\{\{else\}\}\{\{_ 'add'\}\}\{\{\/if\}\}"/);
  assert.match(cardDetails,
    /aria-label="\{\{#if getRequestedBy\}\}\{\{_ 'edit'\}\}\{\{else\}\}\{\{_ 'add'\}\}\{\{\/if\}\}"/);
  assert.match(cardDetails, /else\s+i\.fa\.fa-plus\(aria-hidden="true"\)/);
  assert.doesNotMatch(cardDetails, /^\s*\| \{\{_ 'add'\}\}/m);
});

console.log(`\n${passed} tests passed`);
