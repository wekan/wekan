'use strict';

// Checklist or subtasks from a card's description
// (docs/Features/Cards/Checklist-From-Description.md).
//
// Run: node tests/descriptionListItems.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { descriptionListItems, MAX_ITEMS } = require('../models/lib/descriptionListItems.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('descriptionListItems:');

test('every list form, with the task boxes ticked where written', () => {
  const items = descriptionListItems('Plan\n- one\n* [x] two\n+ three\n1. four\n2) [ ] five\n[X] six\n  - nested');
  assert.deepStrictEqual(items.map(i => i.title), ['one', 'two', 'three', 'four', 'five', 'six', 'nested']);
  assert.deepStrictEqual(items.map(i => i.checked), [false, true, false, false, false, true, false]);
});

test('paragraphs, headings, code blocks and empty items are not items (negative)', () => {
  const md = 'Just text\n# Heading\n-not a list\n- \n```\n- inside code\n```\n~~~\n1. also code\n~~~\nafter';
  assert.deepStrictEqual(descriptionListItems(md), []);
  assert.deepStrictEqual(descriptionListItems(undefined), []);
  assert.strictEqual(descriptionListItems(Array.from({ length: 300 }, (_, i) => `- ${i}`).join('\n')).length, MAX_ITEMS);
});

test('the Checklists section offers it behind Board Settings / Card, and makes items as the form does', () => {
  const jade = read('client/components/cards/checklists.jade');
  assert.match(jade, /if descriptionChecklistItemsOf card\n\s+a\.checklist-from-description\.js-checklist-from-description/);
  const js = read('client/components/cards/fromText.js');
  assert.match(js, /boardFlagOn\('allowsChecklistFromDescriptionOnCard', real\.boardId\)/);
  assert.match(js, /ChecklistItems\.insert\(\{ title: item\.title, checklistId, cardId: card\._id, sort: itemSort, isFinished: item\.checked \}\)/);
  assert.match(js, /Meteor\.callAsync\('addSubtaskCard', card\._id, item\.title, false\)/, 'subtasks through the server method');
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');
  assert.ok(CARD_SETTINGS_ROWS.find(r => r.key === 'checklistFromDescription').card.field === 'allowsChecklistFromDescriptionOnCard');
});

console.log(`\ndescriptionListItems: ${passed} tests passed`);
