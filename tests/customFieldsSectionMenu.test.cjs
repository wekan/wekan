'use strict';

// Everything about custom fields is on the section that shows them.
// Run: node tests/customFieldsSectionMenu.test.cjs
//
// It was spread over three places: Board Settings had the board's LIST of
// fields (create, rename, delete) behind a right-sidebar view, the card menu had
// an entry for the list and another for the picker of which fields are on this
// card, and the picker had a cog that jumped back to the sidebar.
//
// One place now: the hamburger at the end of the card's own Custom Fields
// heading. It opens every field the BOARD has, ticked when it is on THIS card,
// with a pencil each and - under a rule - "Add custom field". Edit and Add open
// in the same pop-over on top of that list, so the back arrow returns to it and
// the card stays open behind. They are the board's own forms, not second copies.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const cardJade = read('client/components/cards/cardDetails.jade');
const cardJs = read('client/components/cards/cardDetails.js');
const fieldsJade = read('client/components/cards/cardCustomFields.jade');
const fieldsJs = read('client/components/cards/cardCustomFields.js');
const sidebarJade = read('client/components/sidebar/sidebar.jade');
const sidebarFields = read('client/components/sidebar/sidebarCustomFields.jade');
const sidebarFieldsJs = read('client/components/sidebar/sidebarCustomFields.js');
const popupCss = read('client/components/main/popup.css');
const formsCss = read('client/components/forms/forms.css');

const popup = fieldsJade.slice(fieldsJade.indexOf('template(name="cardCustomFieldsPopup")'),
  fieldsJade.indexOf('template(name="cardCustomField")'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('customFieldsSectionMenu:');

test('the Custom Fields heading carries the hamburger', () => {
  assert.ok(/menuClass="js-open-custom-fields-settings" menuTitle="custom-fields"/.test(cardJade),
    'the section asks for one');
  const handler = cardJs.slice(cardJs.indexOf("'click .js-open-custom-fields-settings'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/Popup\.open\('cardCustomFields'\)\.call\(Utils\.getCurrentCard\(\), event\)/.test(body),
    'and it opens the list with the CARD as its context - the ticks are about this card');
  assert.ok(/event\.stopPropagation\(\)/.test(body),
    'the click does not reach the heading, which folds the section');
});

test('the popup shows every board field, ticked when it is on the card', () => {
  assert.ok(/each board\.customFields/.test(popup), 'every field the board has');
  assert.ok(/\.materialCheckBox\(class="\{\{#if hasCustomField\}\}is-checked\{\{\/if\}\}"\)/.test(popup),
    'as the shared animated checkbox, ticked when the field is on this card');
  assert.ok(!/fa-check-square-o|fa-square-o/.test(popup),
    'not a separate Font Awesome imitation');
  assert.ok(/js-select-field/.test(popup), 'and clicking the row toggles it');
  const toggle = fieldsJs.slice(fieldsJs.indexOf("'click .js-select-field'"));
  assert.ok(/await Meteor\.callAsync\([\s\S]*?'setCardCustomFieldAssigned'/.test(toggle.slice(0, 700)),
    'through an acknowledged server write');
});

test('the field picker uses the Admin Settings and Announcement animation', () => {
  const base = /\.materialCheckBox \{([\s\S]*?)\n\}/.exec(formsCss);
  const checked = /\.materialCheckBox\.is-checked \{([\s\S]*?)\n\}/.exec(formsCss);
  assert.ok(base && /transition: 0\.2s/.test(base[1]), 'the shared square animates');
  assert.ok(checked && /transform: rotate\(40deg\)/.test(checked[1]),
    'the shared checked state morphs into the green tick');
  assert.ok(/border-bottom: 2px solid #3cb500/.test(checked[1])
    && /border-inline-end: 2px solid #3cb500/.test(checked[1]),
  'using the same green borders');
});

test('each field has a pencil, and Add sits under a rule', () => {
  assert.ok(/a\.js-edit-custom-field\(title="\{\{_ 'edit'\}\}" aria-label="\{\{_ 'edit'\}\}"\)/.test(popup),
    'an accessible pencil per field');
  assert.ok(/i\.fa\.fa-pencil-square-o\(aria-hidden="true"\)/.test(popup),
    'drawn as the shared decorative Edit icon');
  const lines = popup.split('\n').map(l => l.trim());
  const at = lines.findIndex(l => l.includes('js-open-create-custom-field'));
  assert.ok(at !== -1, 'Add custom field is there');
  assert.ok(lines.slice(0, at).includes('hr'), 'under a rule');
  assert.ok(/\{\{_ 'createCustomField'\}\}/.test(popup), 'named by the phrase the app has');
});

test('Edit and Add are the board\'s own forms, not copies (negative)', () => {
  assert.ok(/'click \.js-edit-custom-field': Popup\.open\('editCustomField'\)/.test(fieldsJs),
    'edit opens the board form');
  // Add opens the same form, but through a handler rather than the bare
  // `Popup.open`, because it has to hand it an empty context - see the test
  // below on making a field from the card.
  assert.ok(/Popup\.open\('createCustomField'\)/.test(fieldsJs), 'and so does add');
  assert.ok(/template\(name="createCustomFieldPopup"\)/.test(sidebarFields),
    'which are defined once, where they always were');
  assert.ok(/template\(name="editCustomFieldPopup"\)/.test(sidebarFields), 'both of them');
});

test('the three places it used to live are gone (negative)', () => {
  assert.ok(!/js-custom-fields/.test(sidebarJade), 'no Board Settings row');
  const menu = cardJade.slice(cardJade.indexOf('template(name="cardDetailsActionsPopup")'),
    cardJade.indexOf('\ntemplate(name=', cardJade.indexOf('template(name="cardDetailsActionsPopup")') + 1));
  assert.ok(!/js-custom-fields/.test(menu), 'no card menu entry');
  assert.ok(!/template\(name="boardCustomFieldsPopup"\)/.test(sidebarFields),
    'and no wrapper popup that nothing opened any more');
  assert.ok(!/js-settings/.test(popup), 'nor a cog that jumped to the sidebar');
});

test('the section follows card write access and the opened-card visibility setting', () => {
  // Because that hamburger is the ONLY way in, gating the heading on the card's
  // own values made custom fields unreachable on a card that had none - and on
  // a board that had never used them, unreachable anywhere, since the same move
  // removed the card menu's entry and the Board Settings row and left the
  // sidebar view opened by nothing. Playwright caught it in all three browsers:
  // `.js-custom-fields` waited out its timeout on a seeded board.
  const group = cardJade.slice(
    cardJade.lastIndexOf('\n', cardJade.indexOf('.card-details-group-custom-fields')),
    cardJade.indexOf('if getVoteQuestion'),
  );
  const gate = cardJade
    .slice(0, cardJade.indexOf('.card-details-group-custom-fields'))
    .split('\n')
    .reverse()
    .find(l => /^\s*if /.test(l));
  assert.strictEqual(gate.trim(), 'if canShowCustomFieldsOnCard',
    'the heading uses the write-aware, default-on opened-card visibility gate');
  assert.ok(/return Utils\.canModifyCard\(this\) && board\?\.allowsCustomFields !== false;/.test(cardJs),
    'the gate requires write access and hides the section only when its setting is off');
  // The FIELDS still come from the card's values, so an empty section stays
  // empty rather than drawing a phantom row per board definition.
  assert.ok(/each customFieldsWD/.test(group), 'the rows are still the card\'s own fields');
});

test('the anchor that lost its label went with it (negative)', () => {
  // `a.js-custom-fields` kept its tag when the move took its text away: an empty
  // anchor that rendered nothing and could never be clicked. Gone, and so are
  // the two handlers that were bound to it.
  assert.ok(!/js-custom-fields/.test(cardJade), 'no empty anchor left in the card');
  assert.ok(!/'click \.js-custom-fields'/.test(cardJs), 'and no handler for one');
});

test('a new field is made from nothing, not from the card the popup was opened on', () => {
  // "Add custom field" sits OUTSIDE the list of fields, so its data context is
  // the popup's own - the CARD. The shared form reads its context as the field
  // being edited and decided insert-vs-update on whether that context had an
  // `_id`; a card has one, so creating a field from the card ran the UPDATE
  // branch against a custom field that does not exist. Nothing was inserted and
  // nothing said so - the new field simply never appeared in the list.
  const openCreate = fieldsJs.slice(fieldsJs.indexOf("'click .js-open-create-custom-field'"));
  assert.ok(/Popup\.open\('createCustomField'\)\.call\(\{\}, event\)/.test(openCreate.slice(0, 300)),
    'the create form is handed an empty context, not the card');

  // And the form itself no longer trusts a bare `_id`: it asks whether that id
  // names a custom field, so a context from anywhere cannot make it update one
  // that is not there.
  const submit = sidebarFieldsJs.slice(sidebarFieldsJs.indexOf("'click .primary'"));
  const body = submit.slice(0, submit.indexOf('Popup.back()'));
  assert.ok(/ReactiveCache\.getCustomField\(currentData\._id\)/.test(body),
    'insert or update is decided by whether the id names a custom field');
  assert.ok(!/if \(!currentData\._id\)/.test(body),
    'and not by whether the context merely has an id (negative)');
  assert.ok(/CustomFields\.insert\(data\)/.test(body) && /CustomFields\.update\(/.test(body),
    'both branches are still there');
});

test('the list is a checkbox, a name and a pencil, per field', () => {
  // What the popup is for: every field the BOARD has, ticked when it is on this
  // card, so one click puts it on the card - and a pencil at the other end to
  // edit the field itself.
  const item = popup.slice(popup.indexOf('each board.customFields'));
  const li = item.slice(0, item.indexOf('\n    hr'));
  assert.ok(li.indexOf('js-select-field') < li.indexOf('js-edit-custom-field'),
    'the checkbox and name come first, the pencil last');
  assert.ok(/materialCheckBox\(class="\{\{#ifhasCustomField\}\}is-checked\{\{\/if\}\}"\)/
    .test(li.replace(/\s/g, '')),
    'the tick says whether the field is on this card');
  assert.ok(/span\.full-name/.test(li), 'and the name is between them');

  // ...on ONE line. Every other pop-over list has one anchor per row, so `li` is
  // a block and the anchor fills it - two anchors in a block stack, which put the
  // pencil on a line of its own under the name. The row is the flex container.
  const rows = popupCss.slice(popupCss.indexOf("data-popup='cardCustomFieldsPopup'"));
  assert.ok(/li\.item \{\n\s+display: flex/.test(rows.slice(0, 200)),
    'the row lays its two anchors out side by side');
  assert.ok(/a\.name \{\n\s+flex: 1 1 auto/.test(rows.slice(0, 500)),
    'the name takes the space the pencil does not');
});

test('the form\'s checkboxes are the animated one, aligned with their labels', () => {
  // The same `a.flex > .materialCheckBox + span` the Admin Panel / Announcement
  // checkbox is - a grey square that morphs into a green tick over 0.2s. The
  // markup was already that; what it lacked is that a POP-OVER renders in the
  // global popup container, not inside `.sidebar`, so it never got the
  // `align-items: center` #6465 added and the box sat on a different line from
  // its own label.
  const form = sidebarFields.slice(sidebarFields.indexOf('template(name="createCustomFieldPopup")'));
  const boxes = (form.match(/\.materialCheckBox\(class="\{\{#if /g) || []).length;
  assert.ok(boxes >= 6, `expected the form's checkboxes, found ${boxes}`);
  assert.ok(!/input\(type="checkbox"/.test(form),
    'and none of them is a native checkbox the browser would draw (negative)');

  const css = read('client/components/sidebar/sidebar.css');
  for (const popup of ['createCustomFieldPopup', 'editCustomFieldPopup']) {
    assert.ok(new RegExp(`\\[data-popup='${popup}'\\] a\\.flex`).test(css),
      `${popup}: the rows are aligned`);
    assert.ok(new RegExp(`\\[data-popup='${popup}'\\] \\.materialCheckBox\\.is-checked`).test(css),
      `${popup}: the tick is the green one`);
    assert.ok(new RegExp(`\\[data-popup='${popup}'\\] \\.materialCheckBox,`).test(css)
      || new RegExp(`\\[data-popup='${popup}'\\] \\.materialCheckBox \\{`).test(css),
      `${popup}: and the square it morphs from`);
  }
  const unchecked = css.slice(css.indexOf("[data-popup='createCustomFieldPopup'] .materialCheckBox,"));
  assert.ok(/transition: 0\.2s/.test(unchecked.slice(0, 400)),
    'which is what makes it animate rather than jump');
});

console.log(`\ncustomFieldsSectionMenu: ${passed} tests passed`);
