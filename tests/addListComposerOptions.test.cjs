'use strict';

// Regression guard: the #6465 inline "Add List" composer (addListInline) must
// keep the options the pre-#6465 addListForm had — specifically the "add after
// which list" position <select> and the "or template" link — not just a title
// input. A user reported these went missing when Add List moved to a per-list
// header button. This source-guards the template + handler so they can't be
// dropped again.
//
// Run: node tests/addListComposerOptions.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const jade = fs.readFileSync(
  path.join(root, 'client/components/swimlanes/swimlanes.jade'), 'utf8');
const js = fs.readFileSync(
  path.join(root, 'client/components/swimlanes/swimlanes.js'), 'utf8');

// Isolate the addListInline template block from the .jade so we assert on IT,
// not on the still-present addListForm template.
function templateBlock(src, name) {
  const start = src.indexOf(`template(name="${name}")`);
  assert.ok(start >= 0, `template ${name} must exist`);
  const after = src.indexOf('\ntemplate(name="', start + 1);
  return src.slice(start, after === -1 ? undefined : after);
}
const inlineTpl = templateBlock(jade, 'addListInline');

console.log('addListComposerOptions:');

test('addListInline has the "add after which list" position selector', () => {
  assert.ok(/select\.list-position-input/.test(inlineTpl),
    'the position <select> (.list-position-input) must be present');
  assert.ok(/each swimlaneLists/.test(inlineTpl),
    'the selector must list the swimlane lists');
  assert.ok(/isDefaultAfterList/.test(inlineTpl),
    'the clicked list must be pre-selected via isDefaultAfterList');
  assert.ok(/add-after-list/.test(inlineTpl), 'the add-after-list label must be shown');
});

test('addListInline still has a title input, save and close', () => {
  assert.ok(/list-name-input/.test(inlineTpl));
  assert.ok(/type="submit"/.test(inlineTpl));
  assert.ok(/js-close-add-list-inline/.test(inlineTpl));
});

test('addListInline restores the "or template" link', () => {
  assert.ok(/js-list-template/.test(inlineTpl),
    'the create-from-template link must be present');
});

test('swimlanes.js: addListInline helpers provide the selector data', () => {
  const h = js.slice(js.indexOf('Template.addListInline.helpers'));
  assert.ok(/swimlaneLists\(\)/.test(h), 'swimlaneLists() helper required');
  assert.ok(/isDefaultAfterList\(/.test(h), 'isDefaultAfterList() helper required');
});

test('swimlanes.js: addListInline submit reads the selector and passes nextListId', () => {
  const e = js.slice(js.indexOf('Template.addListInline.events'));
  assert.ok(/list-position-input/.test(e),
    'submit must read the position <select> when present');
  assert.ok(/nextListId/.test(e), 'submit must pass nextListId (insert between lists)');
  assert.ok(/afterListId/.test(e), 'submit must pass afterListId');
  assert.ok(/js-list-template/.test(e), 'the template click handler must be wired');
});

console.log(`\n${passed} passed`);
