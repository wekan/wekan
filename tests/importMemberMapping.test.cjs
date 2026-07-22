'use strict';

// Guards for the JSON/board import "Assign members" (map members) step.
//
// A user reported (board migration from an old WeKan): in the "Select member" popup,
// typed suggestions appear but cannot be selected — neither clicking nor Enter assigns
// the user. Root cause: the click handler mapped `Template.currentData().__originalId`,
// a field that is NEVER set on the search results (they are plain WeKan user docs with
// `_id`), so it mapped `undefined` and silently did nothing. Fixed to map `._id`, plus
// Enter now selects the first result. Member mapping stays OPTIONAL: both a step-1
// "import without mapping" and an in-step "skip mapping" button import immediately.
//
// Run: node tests/importMemberMapping.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('importMemberMapping:');

const js = read('client/components/import/import.js');
const jade = read('client/components/import/import.jade');

test('selecting a searched user maps its _id (not the never-set __originalId)', () => {
  assert.ok(!/\.__originalId\b/.test(js), 'the bogus .__originalId property access must be gone');
  // The click handler maps the clicked user document by _id.
  const clickIdx = js.indexOf("'click .js-select-import'");
  assert.ok(clickIdx > -1, 'the select-import click handler exists');
  const clickBlock = js.slice(clickIdx, clickIdx + 600);
  assert.ok(/mapSelectedMember|importMapToUser/.test(clickBlock), 'the click maps the selected member');
  assert.ok(/Template\.currentData\(\)\._id/.test(js), 'maps the search result by its _id');
});

test('Enter selects the first search result (keyboard, no mouse needed)', () => {
  assert.ok(/'keydown \.js-search-member-input'/.test(js), 'a keydown handler exists on the search input');
  const kd = js.slice(js.indexOf("'keydown .js-search-member-input'"));
  assert.ok(/keyCode === 13/.test(kd), 'Enter (13) is handled');
  assert.ok(/results\[0\]\._id/.test(kd), 'Enter maps the first result by _id');
});

test('the search-result template binds each user by _id', () => {
  assert.ok(/a\.name\.js-select-import\(title=.*data-id="\{\{_id\}\}"/.test(jade),
    'each search result carries its user _id');
});

test('member mapping is OPTIONAL: skip buttons import immediately', () => {
  // Step 1 (textarea): import without mapping at all.
  assert.ok(/js-import-without-mapping/.test(jade), 'step-1 "import without mapping" button exists');
  assert.ok(/'click \.js-import-without-mapping'/.test(js), 'its handler exists');
  assert.ok(/importData\(evt, Session\.get\('importSource'\), true\)/.test(js),
    'import without mapping calls importData with skipMapping=true');
  // Map step: skip remaining mapping and import now.
  assert.ok(/js-import-skip-mapping/.test(jade), 'in-step "skip mapping" button exists');
  assert.ok(/'click \.js-import-skip-mapping'/.test(js), 'its handler exists');
  // Both surfaces use the same clear label.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(typeof en['import-without-mapping-members'] === 'string', 'label i18n key exists');
});

console.log(`\n${passed} tests passed`);
