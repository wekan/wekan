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
  assert.ok(/\{\{#if hasCustomField\}\}fa-check-square-o\{\{else\}\}fa-square-o\{\{\/if\}\}/.test(popup),
    'as a checkbox, ticked when the field is on this card');
  assert.ok(/js-select-field/.test(popup), 'and clicking the row toggles it');
  const toggle = fieldsJs.slice(fieldsJs.indexOf("'click .js-select-field'"));
  assert.ok(/card\.toggleCustomField\(customFieldId\)/.test(toggle.slice(0, 400)),
    'which is what it did before');
});

test('each field has a pencil, and Add sits under a rule', () => {
  assert.ok(/a\.js-edit-custom-field\(title="\{\{_ 'edit'\}\}"\)/.test(popup), 'a pencil per field');
  assert.ok(/i\.fa\.fa-pencil/.test(popup), 'drawn as one');
  const lines = popup.split('\n').map(l => l.trim());
  const at = lines.findIndex(l => l.includes('js-open-create-custom-field'));
  assert.ok(at !== -1, 'Add custom field is there');
  assert.ok(lines.slice(0, at).includes('hr'), 'under a rule');
  assert.ok(/\{\{_ 'createCustomField'\}\}/.test(popup), 'named by the phrase the app has');
});

test('Edit and Add are the board\'s own forms, not copies (negative)', () => {
  assert.ok(/'click \.js-edit-custom-field': Popup\.open\('editCustomField'\)/.test(fieldsJs),
    'edit opens the board form');
  assert.ok(/'click \.js-open-create-custom-field': Popup\.open\('createCustomField'\)/.test(fieldsJs),
    'and so does add');
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

test('the section is there for every card its reader may write to', () => {
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
  assert.strictEqual(gate.trim(), 'if canModifyCard',
    'the heading is gated on who may write, not on what the card already has');
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

console.log(`\ncustomFieldsSectionMenu: ${passed} tests passed`);
