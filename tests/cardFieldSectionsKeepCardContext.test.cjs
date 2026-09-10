'use strict';

// Regression guard: reported directly - after adding a label to an opened
// card, clicking it in the Labels popup no longer made it wider/applied it
// to the card. It had worked in the previous release.
//
// The card detail view's reorderable sections (Labels, Dates, Members,
// Custom Fields, Description) are rendered with an `each` over the board's
// stored section order. The plain `each orderedCardFieldSections` form sets
// the DATA CONTEXT of everything inside it to the current item - the section
// NAME string ("labels", "dates", ...) - so `+cardFieldSectionLabels` and the
// Labels popup opened from its `.js-add-labels` link (Popup.open uses the
// clicked element's data context) both received a string where they
// expected the card. `templateInstance.data.toggleLabel` was then undefined
// and the click handler returned silently; `isLabelSelected ../_id` looked
// up `_id` on a string; the section's own `each labels`/`each stickers`/
// `each getLocations` rendered nothing.
//
// The `each section in orderedCardFieldSections` form keeps `this` as the
// card and exposes the item as `section`. This pins that form.
//
// Run: node tests/cardFieldSectionsKeepCardContext.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const jade = fs.readFileSync(
  path.join(ROOT, 'client', 'components', 'cards', 'cardDetails.jade'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardFieldSectionsKeepCardContext:');

test('the section loop uses the context-preserving `each section in ...` form', () => {
  assert.ok(/^\s*each section in orderedCardFieldSections\s*$/m.test(jade));
  assert.ok(!/^\s*each orderedCardFieldSections\s*$/m.test(jade),
    'the plain `each` form replaces the card data context with the section name (negative)');
});

test('every section branch compares the loop variable, not `this`', () => {
  const start = jade.indexOf('each section in orderedCardFieldSections');
  const block = jade.slice(start, jade.indexOf('.card-checklist-attachmentGalleries', start));
  const branches = [...block.matchAll(/if \$eq (\S+) "/g)].map(m => m[1]);
  assert.ok(branches.length >= 5, `expected the five section branches, found ${branches.length}`);
  assert.deepStrictEqual([...new Set(branches)], ['section']);
});

test('the Labels popup click handler still relies on the popup data being the card', () => {
  const labels = fs.readFileSync(
    path.join(ROOT, 'client', 'components', 'cards', 'labels.js'), 'utf8');
  assert.ok(/const card = templateInstance\.data;[\s\S]*?await card\.toggleLabel\(labelId\)/.test(labels));
});

console.log(`\ncardFieldSectionsKeepCardContext: ${passed} tests passed`);
