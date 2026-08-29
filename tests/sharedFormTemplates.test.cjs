'use strict';

// Three forms that were written many times are written once.
// Run: node tests/sharedFormTemplates.test.cjs
//
//   * WHERE A CARD GOES - board, swimlane, list, above or below which card,
//     Done - drawn four times: Move card, Copy card, Copy checklist to many
//     cards, Convert checklist item to card.
//   * WHERE A LIST GOES - board, swimlane, left or right of which list, Done -
//     drawn twice: Copy list and Move list.
//   * THE CREATE BOARD FORM - drawn four times: the one on All Boards and three
//     popups, one of which creates a template board (and says so with a Session
//     flag, not with different markup).
//   * WHERE THE SELECTED CARDS GO, and WHERE A SWIMLANE GOES - drawn twice
//     each, by Move and by Copy. Those two also had their whole COMPONENT
//     duplicated: 145 of the selection dialog's 152 lines were identical, and
//     the seven that were not are what each does to a card once the destination
//     is known.
//
// In all three the JavaScript was already one piece - BoardSwimlaneListCardDialog
// with registerCardDialogTemplate, registerListDialogTemplate, and
// createBoardHelpers/Template.createBoardForm.events - so a behaviour change
// is one edit
// while a markup change was four.
//
// What each shared template needs is passed IN, because a helper is looked up
// on the template it is written in and not on the one including it. For the
// two pickers that is the `dialog`, and it is read from the template INSTANCE:
// inside `each boards` the data context is a board, so a helper reaching into
// the context for it would find nothing there.
//
// The create-board EVENTS stay with the included form because Blaze scopes
// event maps to the template that rendered the matching DOM. Its owner is
// passed explicitly so the one form can update each parent's state.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const cardJade = read('client/components/cards/cardDetails.jade');
const cardJs = read('client/components/cards/cardDetails.js');
const listJade = read('client/components/lists/listHeader.jade');
const listJs = read('client/components/lists/listHeader.js');
const boardJade = read('client/components/boards/boardHeader.jade');
const boardJs = read('client/components/boards/boardHeader.js');
const filtersJade = read('client/components/sidebar/sidebarFilters.jade');
const filtersJs = read('client/components/sidebar/sidebarFilters.js');
const swimlanesJade = read('client/components/swimlanes/swimlanes.jade');
const swimlanesJs = read('client/components/swimlanes/swimlanes.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('sharedFormTemplates:');

test('the card destination picker is written once', () => {
  assert.ok(/template\(name="cardDestinationPicker"\)/.test(cardJade), 'one template');
  assert.strictEqual((cardJade.match(/select\.js-select-cards/g) || []).length, 1,
    'the cards select exists in exactly one place');
  for (const popup of ['moveCardPopup', 'copyCardPopup', 'copyManyCardsPopup',
    'convertChecklistItemToCardPopup']) {
    const at = cardJade.indexOf(`template(name="${popup}")`);
    assert.ok(at !== -1, `${popup} still exists`);
    assert.ok(/\+cardDestinationPicker\(dialog=dialog\)/.test(cardJade.slice(at, at + 500)),
      `${popup} includes it`);
  }
});

test('the list destination picker is written once', () => {
  assert.ok(/template\(name="listDestinationPicker"\)/.test(listJade), 'one template');
  assert.strictEqual((listJade.match(/name="list-position"/g) || []).length, 2,
    'the two position radios exist once each');
  for (const popup of ['copyListPopup', 'moveListPopup']) {
    const at = listJade.indexOf(`template(name="${popup}")`);
    assert.ok(/\+listDestinationPicker\(dialog=dialog\)/.test(listJade.slice(at, at + 300)),
      `${popup} includes it`);
  }
});

test('the create board form is written once', () => {
  assert.ok(/template\(name="createBoardForm"\)/.test(boardJade), 'one template');
  assert.strictEqual((boardJade.match(/input\.js-new-board-title/g) || []).length, 1,
    'the title field exists in exactly one place');
  for (const tpl of ['createBoard', 'createBoardPopup', 'headerBarCreateBoardPopup',
    'createTemplateContainerPopup']) {
    const at = boardJade.indexOf(`template(name="${tpl}")`);
    assert.ok(at !== -1, `${tpl} still exists`);
    assert.ok(/\+createBoardForm\(owner=createBoardOwner visibility=visibility visibilityMenuIsOpen=visibilityMenuIsOpen/
      .test(boardJade.slice(at, at + 240)), `${tpl} includes it with its owner`);
  }
});

test('a picker reads its dialog from the instance, not the context (negative)', () => {
  // Inside `each boards` the data context is a board. A helper that read the
  // dialog from the context would work on the first render and return
  // undefined inside every option.
  for (const [what, js, tpl] of [['card', cardJs, 'cardDestinationPicker'],
    ['list', listJs, 'listDestinationPicker']]) {
    const created = js.slice(js.indexOf(`Template.${tpl}.onCreated`),
      js.indexOf(`Template.${tpl}.helpers`));
    assert.ok(/this\.dialog = data && data\.dialog/.test(created),
      `the ${what} picker keeps the dialog on its instance`);
    const helpers = js.slice(js.indexOf(`Template.${tpl}.helpers`));
    assert.ok(/Template\.instance\(\)\.dialog\.boards\(\)/.test(helpers),
      `and the ${what} picker's helpers read it from there`);
  }
});

test('the popups keep their own state and handlers (negative)', () => {
  // The whole point: one form, four different things done with it.
  assert.ok(/Template\[templateName\]\.events\(\{/.test(cardJs), 'the card popups keep the events');
  assert.ok(/dialog\(\) \{\n\s+return Template\.instance\(\)\.dialog;/.test(cardJs),
    'and hand their own dialog to the form');
  assert.ok(/Template\[templateName\]\.events\(\{/.test(listJs), 'so do the list popups');
  for (const tpl of ['createBoard', 'createBoardPopup', 'headerBarCreateBoardPopup',
    'createTemplateContainerPopup']) {
    assert.ok(boardJs.includes(`Template.${tpl}.onCreated`), `${tpl} sets up its own state`);
  }
  assert.ok(/Template\.createBoardForm\.events\(\{[\s\S]*async submit\(event, tpl\)/
    .test(boardJs), 'the rendered form owns its submit event');
  assert.ok(/const owner = createBoardOwner\(tpl\);[\s\S]{0,200}createBoardSubmit\(owner, event\)/
    .test(boardJs), 'the form submits through its explicitly passed owner');
  assert.ok(!/Template\.createBoard(?:Popup)?\.events\(createBoardEvents/.test(boardJs),
    'parent templates do not rely on child events bubbling');
  assert.ok(/headerBarCreateBoardPopup[\s\S]{0,180}starAfterCreate=true/.test(boardJade),
    'the header popup still requests starring after creation');
  assert.ok(/Template\.createTemplateContainerPopup\.onRendered[\s\S]{0,300}createBoardAsTemplate/
    .test(boardJs),
    'and the template-board one still says so - a Session flag, not other markup');
});

test('the selection dialog is one component and one form', () => {
  assert.ok(/template\(name="selectionDestinationPicker"\)/.test(filtersJade), 'one template');
  assert.strictEqual((filtersJade.match(/select\.js-select-cards/g) || []).length, 1,
    'the cards select exists in exactly one place');
  for (const popup of ['moveSelectionPopup', 'copySelectionPopup']) {
    const at = filtersJade.indexOf(`template(name="${popup}")`);
    assert.ok(/\+selectionDestinationPicker\(dialog=dialog idSuffix="/.test(
      filtersJade.slice(at, at + 200)), `${popup} includes it`);
  }
  // ...and one component, with the ACTION passed in.
  assert.ok(/function registerSelectionDialogTemplate\(templateName, applyToCard\)/.test(filtersJs),
    'one registration');
  assert.ok(/registerSelectionDialogTemplate\('moveSelectionPopup'/.test(filtersJs), 'move');
  assert.ok(/registerSelectionDialogTemplate\('copySelectionPopup'/.test(filtersJs), 'copy');
  // Defined once and called once - it used to be called from both dialogs.
  assert.strictEqual((filtersJs.match(/buildInsertionSortIndexes\(/g) || []).length, 2,
    'the sort-index maths is defined once and used once');
});

test('move and copy still do different things (negative)', () => {
  // The point of `applyToCard`: one dialog, two outcomes.
  assert.ok(/await card\.move\(to\.boardId, to\.swimlaneId, to\.listId, to\.sortIndex\)/
    .test(filtersJs), 'move moves the card');
  assert.ok(/Meteor\.callAsync\(\n\s+'copyCard',/.test(filtersJs), 'copy makes a new one');
  assert.ok(/if \(!newCardId\) return;/.test(filtersJs),
    'and a copy that could not be made is skipped, not fatal to the rest');
});

test('the swimlane dialog is one component and one form', () => {
  assert.ok(/template\(name="swimlaneDestinationPicker"\)/.test(swimlanesJade), 'one template');
  for (const popup of ['moveSwimlanePopup', 'copySwimlanePopup']) {
    const at = swimlanesJade.indexOf(`template(name="${popup}")`);
    assert.ok(/\+swimlaneDestinationPicker\(dialog=dialog titleId="/.test(
      swimlanesJade.slice(at, at + 300)), `${popup} includes it`);
  }
  assert.ok(/function registerSwimlaneDialogTemplate\(templateName, method\)/.test(swimlanesJs),
    'one registration, with the method as the difference');
  assert.ok(/registerSwimlaneDialogTemplate\('moveSwimlanePopup', 'moveSwimlane'\)/.test(swimlanesJs));
  assert.ok(/registerSwimlaneDialogTemplate\('copySwimlanePopup', 'copySwimlane'\)/.test(swimlanesJs));
});

test('a label still clicks its own control (negative)', () => {
  // The two copies of each form really did differ in one thing: the ids their
  // labels point at. Sharing the markup without keeping them apart would give
  // two controls one id.
  const picker = filtersJade.slice(filtersJade.indexOf('template(name="selectionDestinationPicker")'));
  assert.ok(/id="position-above-\{\{idSuffix\}\}"/.test(picker), 'the radios take a suffix');
  assert.ok(/label\(for="position-above-\{\{idSuffix\}\}"\)/.test(picker), 'and the label follows it');
  const swimlane = swimlanesJade.slice(swimlanesJade.indexOf('template(name="swimlaneDestinationPicker")'));
  assert.ok(/input\.full-line\(id="\{\{titleId\}\}"/.test(swimlane),
    'the title field takes its id as an attribute - a literal id cannot hold a mustache');
  assert.ok(/label\(for="\{\{titleId\}\}"\)/.test(swimlane), 'and its label points at it');
});

console.log(`\nsharedFormTemplates: ${passed} tests passed`);
