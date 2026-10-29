'use strict';

// Card Settings' Custom Fields section: its items are the board's custom
// field DEFINITIONS, in their `sort` order, each a checkbox per side
// (Show on Card = alwaysOnCard, "add to all cards"; Show on Minicard =
// showOnCard, the legacy name of what the minicard reads), dragged within the
// section to change `sort`, with a "+" under them that creates one. The
// section's own checkbox is the board's Custom Fields flag of that side
// (docs/Features/Cards/Card-Settings.md,
// models/lib/cardSettingsCustomFields.js).
// Run: node tests/cardSettingsCustomFields.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const c = require('../models/lib/cardSettingsCustomFields.js');
const { buildCustomFieldsWD } = require('../models/lib/customFieldsWD.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardSettingsCustomFields:');

const defs = [
  { _id: 'c', name: 'Gamma', sort: 2 },
  { _id: 'a', name: 'Alpha', sort: 0 },
  { _id: 'x', name: 'Beta' },
  { _id: 'b', name: 'Bravo', sort: 1 },
  { _id: 'w', name: 'Aardvark' },
];

test('items in `sort` order; fields without one after, by name', () => {
  assert.deepStrictEqual(c.orderedDefinitions(defs).map(d => d._id), ['a', 'b', 'c', 'w', 'x']);
  assert.deepStrictEqual(c.orderedDefinitions(null), [], 'negative: no list');
  assert.deepStrictEqual(c.orderedDefinitions([null, {}, { name: 'no id' }]), [], 'negative: no ids');
});

test('the card and the minicard draw the fields in the same order', () => {
  const card = defs.map(d => ({ _id: d._id, value: 'v' }));
  assert.deepStrictEqual(buildCustomFieldsWD(card, defs).map(f => f._id), c.orderedDefinitions(defs).map(d => d._id));
});

test('each side\'s checkbox is one definition flag', () => {
  assert.deepStrictEqual(c.SIDE_FLAG, { card: 'alwaysOnCard', minicard: 'showOnCard' });
  assert.ok(c.definitionChecked({ showOnCard: true }, 'minicard'));
  assert.ok(!c.definitionChecked({ showOnCard: true }, 'card'), 'sides independent');
  assert.ok(c.definitionChecked({ alwaysOnCard: true }, 'card'));
  assert.ok(!c.definitionChecked({ showOnCard: 'yes' }, 'minicard'), 'negative: only true');
  assert.ok(!c.definitionChecked({ showOnCard: true }, 'sideways'), 'negative: unknown side');
  assert.deepStrictEqual(c.definitionToggleSet('minicard', true), { showOnCard: true });
  assert.deepStrictEqual(c.definitionToggleSet('card', false), { alwaysOnCard: false });
  assert.strictEqual(c.definitionToggleSet('nope', true), null, 'negative: nothing to write');
});

test('a drop writes the new indexes, only where they changed', () => {
  assert.deepStrictEqual(c.sortsAfterDrop(defs, ['b', 'a', 'c']), { b: 0, a: 1 });
  assert.deepStrictEqual(c.sortsAfterDrop(defs, ['a', 'b', 'c']), {}, 'unchanged: no writes');
  assert.deepStrictEqual(c.sortsAfterDrop(defs, ['a', 'zzz', 'a', 'x']), { x: 1 }, 'negative: unknown and repeated ids left out');
  assert.deepStrictEqual(c.sortsAfterDrop(null, ['a']), {});
});

test('Up and Down move one step, and not past the ends', () => {
  assert.deepStrictEqual(c.idsAfterStep(defs, 'b', 'up'), ['b', 'a', 'c', 'w', 'x']);
  assert.deepStrictEqual(c.idsAfterStep(defs, 'b', 'down'), ['a', 'c', 'b', 'w', 'x']);
  assert.deepStrictEqual(c.idsAfterStep(defs, 'a', 'up'), ['a', 'b', 'c', 'w', 'x'], 'negative: the first stays');
  assert.deepStrictEqual(c.idsAfterStep(defs, 'x', 'down'), ['a', 'b', 'c', 'w', 'x'], 'negative: the last stays');
  assert.deepStrictEqual(c.idsAfterStep(defs, 'nope', 'up'), ['a', 'b', 'c', 'w', 'x'], 'negative: unknown id');
});

test('Show on Card is "add to all cards": the server adds such a field to every card', () => {
  const server = read('server/models/customFields.js');
  assert.match(server, /CustomFields\.after\.insert\([\s\S]{0,200}if \(doc\.alwaysOnCard\) \{\n\s+CustomFields\.addToAllCards\(doc\);/);
  assert.match(server, /CustomFields\.after\.update\(\(userId, doc\) => \{\n\s+if \(doc\.alwaysOnCard\) \{\n\s+CustomFields\.addToAllCards\(doc\);/);
  assert.match(read('client/components/cards/minicard.jade'), /each customFieldsWD\n\s+if definition\.showOnCard/, 'what the minicard reads');
});

test('the section: definitions as items, its own checkbox the Custom Fields flag, a + under them', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  const tpl = jade.slice(jade.indexOf('template(name="cardSettingsInlineSection")'), jade.indexOf('template(name="cardSettingsInlinePanel")'));
  assert.match(tpl, /if section\.customFields\n\s+\.card-settings-inline-items\.js-card-settings-custom-fields-sortable/);
  assert.match(tpl, /each field in section\.customFieldItems\n\s+\.card-settings-line\.card-settings-inline-item\.card-settings-custom-field\.js-card-settings-custom-field/);
  assert.match(tpl, /class="\{\{#if field\.writable\}\}js-card-settings-custom-field-toggle\{\{else\}\}is-disabled\{\{\/if\}\}/, 'disabled for a non-admin');
  assert.match(tpl, /if field\.hasMenu\n\s+a\.card-settings-inline-menu\.js-card-settings-edit-custom-field/);
  // 2026-10-28: its form opens under the item, inside the pane.
  assert.match(tpl, /if field\.menuOpen\n\s+\+cardSettingsInlinePanel\(kind="field" fieldId=field\.id side=side\)/);
  // The + is under the items (after the each), also with none; an admin's.
  const plus = tpl.indexOf('js-card-settings-add-custom-field(');
  assert.ok(plus > tpl.indexOf('each field in section.customFieldItems'));
  assert.match(tpl, /if section\.writable\n\s+\.card-settings-add-custom-field\n\s+a\.card-settings-add-custom-field-button\.js-card-settings-add-custom-field\(href="#" role="button" class="\{\{#if section\.createOpen\}\}is-open\{\{\/if\}\}" aria-expanded="[^"]+" title="\{\{_ 'createCustomField'\}\}"/);
  assert.match(tpl, /if section\.createOpen\n\s+\+cardSettingsInlinePanel\(kind="create" side=side\)/);
  const js = read('client/components/sidebar/sidebar.js');
  // Custom Fields is never a merged single line, and its flag row is the
  // section's checkbox, not an item: no "Custom Fields > Custom Fields".
  assert.match(js, /const single = !customFields && cardSettingsSections\.isSingleRowSection\(rows\);/);
  assert.match(js, /: customFields \? rows\.find\(r => r\.key === cardSettingsCustomFields\.CUSTOM_FIELDS_ROW\) \|\| null : null;/);
  assert.match(js, /rows: customFields \? \[\] : rows,/);
  // Writes: the definition's flag, the same CustomFields write as the sidebar.
  assert.match(js, /'click \.js-card-settings-custom-field-toggle'\(evt, tpl\) \{[\s\S]{0,400}if \(!id \|\| !\(Utils\.canModifyBoard && Utils\.canModifyBoard\(\)\)\) return;[\s\S]{0,800}CustomFields\.update\(id, \{ \$set: set \}\);/);
  // From what the checkbox shows, so two quick clicks turn it on and off.
  assert.match(js, /definitionToggleSet\(side,\n\s+evt\.currentTarget\.getAttribute\('aria-checked'\) !== 'true'\)/);
  assert.match(js, /Object\.entries\(sorts\)\.forEach\(\(\[id, sort\]\) => CustomFields\.update\(id, \{ \$set: \{ sort \} \}\)\);/);
  assert.match(js, /ownListOnly: true,\n\s+items: '> \.js-card-settings-custom-field\.is-positioned', handle: '\.js-card-settings-custom-field-handle',/);
  // 2026-10-28: opened BELOW the + and the item's hamburger, in a panel of
  // the pane (sidebar.jade cardSettingsInlinePanel), not as a popup (layer).
  assert.match(js, /togglePanel\(tpl, 'create'\);/);
  assert.match(js, /togglePanel\(tpl, `field:\$\{definition\._id\}`\);/);
  assert.ok(!/Popup\.open\('(createCustomField|editCustomField)'/.test(js), 'negative: no popup for them in Card Settings');
  // The + is Create Field: it is not also a hamburger entry, so Custom Fields
  // has no hamburger at all.
  assert.deepStrictEqual(require('../models/lib/cardSettingsSections.js').cardActionsOf('customFields'), []);
});

console.log(`cardSettingsCustomFields: ${passed} passed`);
