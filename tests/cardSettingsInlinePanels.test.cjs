'use strict';

// Card Settings' hamburgers open their content BELOW the hamburger, inside
// the pane - an accordion panel under the section's line, the row or the
// custom field item, or the + under Custom Fields - not in a popup
// (2026-10-28, replacing the popup "layer" of 9c9742e09d, whose machinery is
// removed). The open hamburger shows it is open (is-open, aria-expanded).
// One panel open at a time per pane; the same hamburger, its X or Escape
// closes it. The forms in it (a custom field's edit and create forms, the
// Subtask settings) keep their own handlers; the pane's handlers leave them
// alone, so a click in a panel is handled exactly once.
// Replaces tests/popupLayer.test.cjs.
// Run: node tests/cardSettingsInlinePanels.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('cardSettingsInlinePanels:');

const jade = read('client/components/sidebar/sidebar.jade');
const js = read('client/components/sidebar/sidebar.js');
const templateOf = name => jade.slice(jade.indexOf(`template(name="${name}")`)).split('\ntemplate(')[0];
const section = templateOf('cardSettingsInlineSection');
const panel = templateOf('cardSettingsInlinePanel');

test('negative: Card Settings opens no popup for its hamburgers', () => {
  assert.ok(!/Popup\.open\('(cardSettingsSection|cardSettingsItem|editCustomField|createCustomField)'/.test(js));
  assert.ok(!/layer: true/.test(js), 'no layer anywhere in sidebar.js');
  assert.ok(!jade.includes('template(name="cardSettingsSectionPopup")') && !jade.includes('template(name="cardSettingsItemPopup")'),
    'the two popups are gone');
});

test('negative: the popup layer machinery is gone', () => {
  const popup = read('client/lib/popup.js');
  for (const gone of ['asLayer', '_renderData', '_layerStyle', 'popupLayerPosition']) {
    assert.ok(!popup.includes(gone), `client/lib/popup.js: ${gone}`);
  }
  assert.ok(!read('client/components/main/popup.tpl.jade').includes('popup-layer'));
  assert.ok(!read('client/components/main/popup.css').includes('.popup-layer'));
  assert.ok(!/top\.layer|'mousedown \.content-wrapper'/.test(read('client/components/main/popup.js')));
  assert.ok(!fs.existsSync(path.join(root, 'models/lib/popupLayerPosition.js')));
  assert.ok(!fs.existsSync(path.join(root, 'tests/popupLayer.test.cjs')));
});

test('each hamburger opens its panel right under its own line, and shows that it is open', () => {
  // A section's: under the section's head line, before its rows.
  assert.match(section, /a\.card-settings-inline-menu\.js-open-card-settings-section-menu\(href="#" role="button" class="\{\{#if section\.menuOpen\}\}is-open\{\{\/if\}\}" aria-expanded="\{\{#if section\.menuOpen\}\}true\{\{else\}\}false\{\{\/if\}\}"/);
  assert.match(section, /if section\.menuOpen\n\s+\+cardSettingsInlinePanel\(kind="section" sectionId=section\.id side=side\)\n\s+unless section\.single/);
  assert.ok(section.indexOf('kind="section"') < section.indexOf('each row in section.rows'), 'above the rows');
  // A row's: under the row, inside the row list.
  assert.match(section, /class="\{\{#if row\.menuOpen\}\}is-open\{\{\/if\}\}" aria-expanded="\{\{#if row\.menuOpen\}\}true\{\{else\}\}false\{\{\/if\}\}"/);
  assert.match(section, /if row\.menuOpen\n\s+\+cardSettingsInlinePanel\(kind="row" rowKey=row\.key sectionId=section\.id side=side\)/);
  // A custom field's and the +.
  assert.match(section, /if field\.menuOpen\n\s+\+cardSettingsInlinePanel\(kind="field" fieldId=field\.id side=side\)/);
  assert.match(section, /if section\.createOpen\n\s+\+cardSettingsInlinePanel\(kind="create" side=side\)/);
  // The open look: the hamburger tinted, the panel hanging from it with a notch.
  const css = read('client/components/cards/cardAddFields.css');
  assert.match(css, /\.card-settings-inline-menu\.is-open,\n\.card-settings-add-custom-field-button\.is-open \{/);
  assert.match(css, /\.card-settings-inline-panel::before \{/);
});

test('one panel per pane: a hamburger toggles, another closes the first, the X and Escape close it', () => {
  assert.match(js, /function togglePanel\(tpl, key\) \{\n\s+tpl\.animating\.set\(null\);\n\s+tpl\.openPanel\.set\(tpl\.openPanel\.get\(\) === key \? null : key\);/);
  assert.match(js, /this\.openPanel = new ReactiveVar\(null\);/, 'per pane, not persisted');
  for (const key of ['togglePanel(tpl, `section:${id}`)', 'togglePanel(tpl, `row:${row.dataset.key}`)',
    'togglePanel(tpl, `field:${definition._id}`)', "togglePanel(tpl, 'create')"]) {
    assert.ok(js.includes(key), key);
  }
  assert.match(js, /'click \.js-close-card-settings-panel'\(evt, tpl\) \{\n\s+evt\.preventDefault\(\);\n\s+tpl\.openPanel\.set\(null\);/);
  assert.match(panel, /a\.card-settings-inline-panel-close\.js-close-card-settings-panel/);
  // Escape: before the popup's own (capture phase), only while a panel is open.
  assert.match(js, /if \(evt\.key !== 'Escape' \|\| !this\.openPanel\.get\(\)\) return;\n\s+evt\.preventDefault\(\);\n\s+evt\.stopImmediatePropagation\(\);/);
  assert.match(js, /document\.addEventListener\('keydown', this\._onPanelEscape, true\);/);
  assert.match(js, /document\.removeEventListener\('keydown', this\._onPanelEscape, true\);/, 'and removed with the pane');
});

test('a click in a panel is handled once: the panel has no event map, the pane skips the forms\' own', () => {
  assert.ok(!/Template\.cardSettingsInlinePanel\.events\(/.test(js), 'negative: no second registration');
  assert.match(js, /const paneEvents = Object\.fromEntries\(Object\.entries\(cardSettingsEvents\)\.map\(\(\[key, handler\]\) => \[key,/);
  assert.match(js, /evt\.target\.closest\('\.js-card-settings-panel-own-handlers'\)\) return undefined;/);
  assert.match(js, /Template\.cardSettingsInline\.events\(\{\n\s+\.\.\.paneEvents,/);
  // Driven: the Subtasks row and the subtask settings share a checkbox class;
  // a click inside the settings runs ITS handler only.
  const src = js.slice(js.indexOf('const paneEvents = '), js.indexOf('Template.cardSettingsInline.events({'));
  let rowToggles = 0;
  const wrapped = new Function('cardSettingsEvents', `${src}\nreturn paneEvents;`)({
    "click .js-field-has-subtasks"() { rowToggles += 1; },
  });
  const inPanel = { target: { closest: sel => (sel === '.js-card-settings-panel-own-handlers' ? {} : null) } };
  const onRow = { target: { closest: () => null } };
  wrapped['click .js-field-has-subtasks'](inPanel);
  assert.strictEqual(rowToggles, 0, 'negative: the pane does not toggle the row too');
  wrapped['click .js-field-has-subtasks'](onRow);
  assert.strictEqual(rowToggles, 1, 'the row\'s own checkbox still works');
  // The forms and the subtask settings are inside that marker.
  assert.match(panel, /\.card-settings-section-action\.js-card-settings-panel-own-handlers/);
  assert.strictEqual((panel.match(/\.card-settings-panel-form\.js-card-settings-panel-own-handlers/g) || []).length, 2);
  // The panel's own checkbox (Ask for a reason) is the pane's, animated in the pane's state.
  assert.match(js, /isAnimating\(key\) \{\n\s+const pane = paneInstanceOf\(Template\.instance\(\)\.view\);/);
});

test('what each panel holds', () => {
  const { CARD_ACTIONS } = require('../models/lib/cardSettingsSections');
  assert.deepStrictEqual(CARD_ACTIONS.subtasks.map(a => a.template), ['boardSubtaskSettingsBody'], 'the settings themselves');
  assert.ok(!Object.values(CARD_ACTIONS).flat().some(a => a.popup), 'negative: no action opens a popup');
  assert.match(panel, /\+Template\.dynamic\(template=action\.template\)/);
  assert.match(panel, /if sectionIsGeneral\n\s+\+boardDragSettings\(section="card"\)/);
  assert.match(panel, /if menu\.labelTextReset\n\s+div\.check-div\.card-settings-board-option\n\s+a\(class=labelTextResetClass\)/);
  assert.match(panel, /\+Template\.dynamic\(template="createCustomFieldPopup" data=fieldDefinition\)/);
  assert.match(panel, /\+Template\.dynamic\(template="createCustomFieldPopup" data=createData\)/);
});

test('a form saved in a panel closes the panel, not Card Settings', () => {
  const form = read('client/components/sidebar/sidebarCustomFields.js');
  assert.match(form, /function closeCardSettingsPanel\(evt\) \{[\s\S]{0,300}panel\.dispatchEvent\(new CustomEvent\('cardsettingspaneldone', \{ bubbles: true \}\)\);/);
  const save = form.slice(form.indexOf("'click .primary'(evt, tpl) {"));
  assert.ok(save.indexOf('if (closeCardSettingsPanel(evt)) return;') !== -1
    && save.indexOf('if (closeCardSettingsPanel(evt)) return;') < save.indexOf('backIfOwnPopup('),
  'the panel is asked before the popup would step back (which would close Card Settings)');
  assert.match(js, /pane\.addEventListener\('cardsettingspaneldone', this\._onPanelDone\);/);
  // Its popup elsewhere is unchanged: it steps back from its own popup.
  assert.match(form, /backIfOwnPopup\(evt, \['createCustomFieldPopup', 'editCustomFieldPopup'\]\)/);
});

console.log(`\ncardSettingsInlinePanels: ${passed} tests passed`);
