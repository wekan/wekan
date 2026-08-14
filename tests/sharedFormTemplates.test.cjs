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
//
// In all three the JavaScript was already one piece - BoardSwimlaneListCardDialog
// with registerCardDialogTemplate, registerListDialogTemplate, and
// createBoardHelpers/createBoardEvents - so a behaviour change was one edit
// while a markup change was four.
//
// What each shared template needs is passed IN, because a helper is looked up
// on the template it is written in and not on the one including it. For the
// two pickers that is the `dialog`, and it is read from the template INSTANCE:
// inside `each boards` the data context is a board, so a helper reaching into
// the context for it would find nothing there.
//
// The EVENTS stay with the popups. An event inside an included template bubbles
// to the one that includes it, which is the one holding the state - that is
// what keeps four popups doing four different things with one form.

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
    assert.ok(/\+createBoardForm\(visibility=visibility visibilityMenuIsOpen=visibilityMenuIsOpen\)/
      .test(boardJade.slice(at, at + 200)), `${tpl} includes it`);
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
  assert.ok(/Template\.createTemplateContainerPopup\.onRendered[\s\S]{0,300}createBoardAsTemplate/
    .test(boardJs),
    'and the template-board one still says so - a Session flag, not other markup');
});

console.log(`\nsharedFormTemplates: ${passed} tests passed`);
