'use strict';

// #2012: story and task card types with custom fields of their own.
// Run: node tests/cardKinds.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const k = require('../models/lib/cardKinds.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const defs = [
  { _id: 'points', cardKinds: ['story'] },
  { _id: 'hours', cardKinds: ['task'] },
  { _id: 'both', cardKinds: ['story', 'task'] },
  { _id: 'any' },
];

// Positive.
assert.deepEqual(k.fieldsToAddForKind([], defs, 'story').map(d => d._id), ['points', 'both'], 'a story gets its own fields');
assert.deepEqual(k.fieldsToAddForKind([{ _id: 'both' }], defs, 'task').map(d => d._id), ['hours'], 'not twice');
assert.equal(k.definitionAppliesToKind(defs[0], 'story'), true);
assert.equal(k.definitionAppliesToKind(defs[3], undefined), true, 'a field of no kind shows on every card');
assert.deepEqual(k.cleanCardKinds(['task', 'story', 'story']), ['story', 'task']);
console.log('  ok - a kind brings its fields, and shows them');

// Negative.
assert.equal(k.definitionAppliesToKind(defs[0], 'task'), false, 'a story field is not on a task');
assert.equal(k.definitionAppliesToKind(defs[0], undefined), false, 'nor on an ordinary card');
assert.deepEqual(k.fieldsToAddForKind([], defs, 'epic'), [], 'no unknown kinds');
assert.equal(k.cleanCardKind('<b>'), null);
assert.deepEqual(k.cleanCardKinds('story'), []);
console.log('  ok - other kinds\' fields stay off; unknown kinds refused');

// Wiring.
const cards = read('models/cards.js');
assert.match(cards, /cardKind: \{[\s\S]{0,300}allowedValues: \['story', 'task'\],/);
assert.match(cards, /async setCardKind\(kind\) \{[\s\S]{0,700}\$push: \{ customFields: \{ \$each: add \} \}/);
assert.match(cards, /definitions = definitions\.filter\(d => definitionAppliesToKind\(d, card\.cardKind\)\);/, 'customFieldsWD shows only fields of the card\'s kind');
// The schema library takes Array plus a '.$' entry; `type: [String]` stopped
// WeKan at startup ("type may not be an array"), found by the runtime test.
assert.match(read('models/customFields.js'), /cardKinds: \{[\s\S]{0,300}type: Array,\s*optional: true,\s*\},\s*'cardKinds\.\$': \{\s*type: String,\s*allowedValues: \['story', 'task'\],/);
assert.doesNotMatch(read('models/customFields.js') + read('models/cards.js') + read('models/users.js') + read('models/lists.js') + read('models/checklistItems.js') + read('models/boards.js') + read('models/settings.js') + read('models/integrations.js'),
  /type: \[(String|Number|Object|Boolean)\]/, 'no array shorthand type anywhere in the touched schemas');
assert.match(read('client/components/cards/cardDetails.jade'), /a\.js-set-card-kind/);
assert.match(read('client/components/cards/cardDetails.jade'), /template\(name="cardKindPopup"\)/);
assert.match(read('client/components/cards/minicard.jade'), /\.badge\.card-kind-badge/);
assert.match(read('client/components/sidebar/sidebarCustomFields.js'), /cardKinds: \(typeof tpl\.findAll === 'function' \? Array\.from\(tpl\.findAll\('\.js-field-card-kind\.is-checked'\)/);
console.log('  ok - card menu, minicard badge and the field\'s kind ticks');
console.log('\ncardKinds: all tests passed');
