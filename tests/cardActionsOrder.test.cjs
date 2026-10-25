'use strict';

// The opened card's actions menu, in the maintainer's order (2026-10-25):
//   Move Card, Copy Card, Save as Template, Copy Template to Many Cards, Card
//   recurrence, Move to Top, Move to Bottom, Watch, Star | Set color, Drawing |
//   Copy link to clipboard, Link to board, QR code, History, Export, Import,
//   Move Card to Archive, More.
// Run: node tests/cardActionsOrder.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jade = fs.readFileSync(path.join(__dirname, '..', 'client/components/cards/cardDetails.jade'), 'utf8');
const popup = jade.slice(jade.indexOf('template(name="cardDetailsActionsPopup")')).split('\ntemplate(')[0];

const ORDER = ['js-move-card\n', 'js-copy-card\n', 'js-save-card-as-template', 'js-copy-checklist-cards',
  'js-set-card-recurrence-interval', 'js-move-card-to-top', 'js-move-card-to-bottom', 'js-toggle-watch-card',
  'js-star-card-item', 'js-set-card-color', 'js-card-drawing', 'js-copy-card-link', 'js-link-card-to-board',
  'js-card-qr-code', 'js-card-history', 'js-export-card', 'js-import-card', 'js-archive\n', 'js-more'];

const at = ORDER.map(cls => popup.indexOf(cls));
ORDER.forEach((cls, i) => assert.notStrictEqual(at[i], -1, `${cls.trim()} is in the menu`));
for (let i = 1; i < at.length; i += 1) assert.ok(at[i - 1] < at[i], `${ORDER[i - 1].trim()} before ${ORDER[i].trim()}`);
console.log('  ok - every item in the order given');

// A rule after Star and after Drawing, and nowhere between the groups' items.
const between = (a, b) => popup.slice(popup.indexOf(a), popup.indexOf(b));
assert.match(between('js-star-card-item', 'js-set-card-color'), /\n\s+hr\n/);
assert.match(between('js-card-drawing', 'js-copy-card-link'), /\n\s+hr\n/);
assert.doesNotMatch(between('js-move-card\n', 'js-star-card-item'), /\n\s+hr\n/, 'negative: no rule inside the first group');
assert.doesNotMatch(between('js-copy-card-link', 'js-more'), /\n\s+hr\n/, 'negative: no rule inside the last group');
console.log('  ok - a rule after Star and after Drawing only');

// Each item once: the two permission copies of the menu are one list now.
for (const cls of ORDER) assert.strictEqual(popup.split(cls).length - 1, 1, `${cls.trim()} once`);
console.log('  ok - each item once');
console.log('cardActionsOrder: 3 passed');
