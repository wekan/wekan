'use strict';

// A title is edited where it is read: click the text, type, save.
// Run: node tests/titleClickToEdit.test.cjs
//
// Two titles on the board page worked differently from the list titles beside
// them, and neither difference had a reason:
//
//   * a CARD's title (#4990) could only be renamed by opening the card, so
//     fixing a typo on a board of forty cards was open, edit, close, forty
//     times. A list's title has always been edited in place, right on the
//     board; a card's now is too, by the same inlinedForm.
//   * the BOARD's title had a pencil beside it. Two targets for one job, and
//     the smaller of them was the one that did it.
//
// The board's title keeps its EXISTING popup - `boardChangeTitlePopup`, with
// the title and the description in it. What changed is what you click to get
// there, not the form you land in.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('titleClickToEdit:');

// ── the card, on the board (#4990) ─────────────────────────────────────────

const minicardJade = read('client/components/cards/minicard.jade');
const minicardJs = read('client/components/cards/minicard.js');
const minicardCss = read('client/components/cards/minicard.css');
const listBodyJs = read('client/components/lists/listBody.js');

test('the minicard title text opens an editor in its place', () => {
  assert.ok(/\+inlinedForm\(classNames="js-minicard-title-form"\)/.test(minicardJade),
    'the same inlinedForm a list title uses');
  assert.ok(/\+editMinicardTitleForm/.test(minicardJade), 'holding the card title form');
  assert.ok(/template\(name="editMinicardTitleForm"\)/.test(minicardJade),
    'which exists');
  assert.ok(/span\.minicard-title-text\(class="\{\{#if canModifyCard\}\}js-open-inlined-form is-editable\{\{\/if\}\}"\)/
    .test(minicardJade), 'and the title TEXT is what opens it');
});

test('the editor is a textarea, a Save and a way out', () => {
  const form = minicardJade.slice(minicardJade.indexOf('template(name="editMinicardTitleForm")'),
    minicardJade.indexOf('template(name="editCardSortOrderPopup")'));
  assert.ok(/textarea\.minicard-title-editor\.js-edit-minicard-title/.test(form),
    'the title as text to edit');
  assert.ok(/button\.primary\.confirm\.js-submit-edit-minicard-title\(type="submit"\)/.test(form),
    'a save button');
  assert.ok(/a\.js-close-inlined-form/.test(form),
    'and an X that closes it without saving - a form with no way out but Save is a trap');
});

test('saving renames the card', () => {
  const handler = minicardJs.slice(minicardJs.indexOf("'submit .js-minicard-title-form'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/\.js-edit-minicard-title/.test(body), 'reads the textarea');
  assert.ok(/await this\.setTitle\(title\)/.test(body), 'and sets the title');
});

test('an empty title is not saved (negative)', () => {
  // A card with no title has nothing to click, which would be a way to lose it.
  const handler = minicardJs.slice(minicardJs.indexOf("'submit .js-minicard-title-form'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/if \(title && title !== this\.getTitle\(\)\)/.test(body),
    'empty, and unchanged, are both no-ops');
  assert.ok(/\?\.trim\(\)/.test(body), 'and whitespace does not count as a title');
});

test('the card is NOT opened by a click on its title any more', () => {
  const guard = listBodyJs.slice(listBodyJs.indexOf('const clickedEditableTitle ='));
  const body = guard.slice(0, guard.indexOf('\n\n'));
  assert.ok(/js-open-inlined-form/.test(body), 'an editable title is recognised');
  assert.ok(/js-minicard-title-form/.test(body), 'and so is a click inside the open editor');
  assert.ok(/evt\.preventDefault\(\);\n\s+return;/.test(body),
    'neither opens the card, and neither follows the wrapper link');
  // The branch that DOES open the card is still below it, for everybody who
  // may not write - and for the rest of the card.
  assert.ok(/Title clicks should open the regular board card details view/.test(listBodyJs),
    'a title nobody may edit still opens the card');
});

test('the wrapper link does not navigate mid-edit, but Save still submits (negative)', () => {
  // The minicard sits inside an <a> to the card. Cancelling the click's default
  // is what stops it following that link while the title is being typed; doing
  // it on the SAVE button too would cancel the submit, which is that button's
  // own default action.
  const handler = minicardJs.slice(minicardJs.indexOf("'click .js-minicard-title-form'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/closest\('button\[type=submit\]'\)\.length/.test(body),
    'the save button keeps its default');
  assert.ok(/event\.preventDefault\(\)/.test(body), 'everything else does not');
});

test('the title text is a block, so the line is the target', () => {
  assert.ok(/\.minicard \.minicard-title \.minicard-title-text \{[^}]*display: block/.test(minicardCss),
    'a click after a short title is still a click on the title');
  assert.ok(/\.minicard-title-text\.is-editable \{[^}]*cursor: text/.test(minicardCss),
    'and the cursor says it can be typed in');
});

// ── the board, in the header bar ───────────────────────────────────────────

const headerJade = read('client/components/main/header.jade');
const headerJs = read('client/components/main/header.js');
const headerCss = read('client/components/main/header.css');
const boardHeaderJade = read('client/components/boards/boardHeader.jade');

test('the board title text opens the rename popup', () => {
  assert.ok(/class="\{\{#if canEditBoardTitle\}\}js-edit-board-title is-editable\{\{\/if\}\}"/
    .test(headerJade), 'the title itself carries the handle');
  assert.ok(/Popup\.open\('boardChangeTitle'\)\.call\(board, evt\)/.test(headerJs),
    'and opens the popup that already existed, with the board as its context');
  assert.ok(/template\(name="boardChangeTitlePopup"\)/.test(boardHeaderJade),
    'which is unchanged - the title and the description, as before');
});

test('there is no separate edit button any more (negative)', () => {
  assert.ok(!/\+boardEditTitleButton/.test(headerJade), 'no pencil in the bar');
  assert.ok(!/template\(name="boardEditTitleButton"\)/.test(boardHeaderJade),
    'and no template left behind for one');
  const boardHeaderJs = read('client/components/boards/boardHeader.js');
  assert.ok(!/Template\.boardEditTitleButton\.events/.test(boardHeaderJs),
    'nor a handler with nothing to handle');
  assert.ok(!/'click \.js-edit-board-title': Popup\.open/.test(boardHeaderJs),
    'including the one in boardHeaderButtons, whose element went with the bar');
});

test('only a board admin gets it', () => {
  const helper = headerJs.slice(headerJs.indexOf('canEditBoardTitle()'));
  const body = helper.slice(0, helper.indexOf('\n  },'));
  assert.ok(/Utils\.getCurrentBoardId\(\)/.test(body), 'on a board page');
  assert.ok(/isBoardAdmin\(\)/.test(body), 'and only for an admin of it');
  const handler = headerJs.slice(headerJs.indexOf("'click .js-edit-board-title'(evt)"));
  assert.ok(/isBoardAdmin\(\)\) return;/.test(handler.slice(0, handler.indexOf('\n  },'))),
    'checked again where it acts, not only where it draws');
});

test('an empty board title can still be clicked (negative)', () => {
  // The trap: a board with no title renders no text, and an element with no
  // content is zero pixels wide. Without a minimum there would be nothing to
  // aim at, and an empty title could never be given one.
  const rule = headerCss.slice(headerCss.indexOf('.header-page-title.is-editable {'));
  const body = rule.slice(0, rule.indexOf('}'));
  assert.ok(/min-width: 4em/.test(body), 'a strip of the bar stays clickable');
  assert.ok(/min-height: 1\.3em/.test(body), 'in the other axis too');
  assert.ok(/display: inline-block/.test(body),
    'without which neither minimum applies to an inline span');
});

test('the tooltip on the title still carries the whole path', () => {
  // The bar shows the root of the path and puts the rest in the tooltip; the
  // class was added beside that attribute, not instead of it.
  assert.ok(/span\.header-page-title\(title="\{\{headerTitleFullPath\}\}"/.test(headerJade),
    'the tooltip survived');
});

console.log(`\ntitleClickToEdit: ${passed} tests passed`);
