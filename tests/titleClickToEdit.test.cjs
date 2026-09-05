'use strict';

// Minicard titles are drag surfaces; other title editing behavior stays covered.
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

test('the minicard title is plain content, not an inline-editor trigger', () => {
  const title = minicardJade.slice(minicardJade.indexOf('.minicard-title\n'),
    minicardJade.indexOf('\n    if showLabels'));
  assert.ok(/span\.minicard-title-text\n/.test(title));
  assert.ok(!/js-open-inlined-form|js-minicard-title-form/.test(title));
});

test('the sortable uses the whole minicard without handles and only the handle with them', () => {
  const listJs = read('client/components/lists/list.js');
  assert.match(listJs, /isTouchScreenOrShowDesktopDragHandles\(\)[\s\S]*?'handle', '\.handle'/);
  assert.match(listJs, /else \{[\s\S]*?'handle', '\.minicard'/);
});

test('the title permits board dragscroll only while handles are shown', () => {
  const opening = minicardJade.slice(0, minicardJade.indexOf('    if canMoveCard'));
  assert.match(opening,
    /class="\{\{#unless isTouchScreenOrShowDesktopDragHandles\}\}nodragscroll\{\{\/unless\}\}"/);
});

test('the title text is a block, so the whole line is a drag target', () => {
  assert.ok(/\.minicard \.minicard-title \.minicard-title-text \{[^}]*display: block/.test(minicardCss),
    'a drag after a short title is still a drag from the title area');
});

test('#6639: links remain above no edit overlay and keep their own click', () => {
  assert.ok(!/\.minicard-title-edit-zone/.test(minicardCss),
    'CSS cannot recreate the fixed overlay that swallowed short links');
  const viewerEvents = read('client/components/main/editor.js');
  const linkHandler = viewerEvents.slice(viewerEvents.indexOf("'click a'(event"));
  assert.ok(/window\.open\(href, '_blank'\)/.test(linkHandler.slice(0, 1000)),
    'the rendered link still opens its destination');
  assert.ok(/event\.stopPropagation\(\)/.test(linkHandler.slice(0, 1200)),
    'and its click never reaches the editable title container');
});

test('#6641: the sortable still cancels drags from form controls', () => {
  const listJs = read('client/components/lists/list.js');
  const sortable = listJs.slice(listJs.indexOf('$cards.sortable({'));
  assert.match(sortable.slice(0, 1000),
    /cancel: ['"]input, textarea, button, select, option['"]/);
});

test('a label on a minicard opens the labels, and only that (negative)', () => {
  // It opened the card details as well: the click reached the minicard behind
  // the popup, so one click did two things and the one you did not ask for was
  // underneath the one you did.
  const handler = minicardJs.slice(minicardJs.indexOf("'click .minicard-labels'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/event\.stopPropagation\(\)/.test(body), 'the click stops at the label');
  assert.ok(/event\.preventDefault\(\)/.test(body),
    'and does not follow the wrapper link to the card either');
  assert.ok(/Popup\.open\("cardLabels"\)/.test(body), 'the labels popup still opens');
  // A click in the labels AREA that is not on a label is still the card's.
  assert.ok(/if \(!\$\(event\.target\)\.closest\('\.js-card-label'\)\.length\) \{\n\s+return;/.test(body),
    'only a label is a label');
  assert.ok(!/:hover/.test(body),
    'asked of the event, not of `:hover` - which on a touch screen answers about '
    + 'whatever was tapped last');
});

// ── the opened card's title: edit one half, drag the other ─────────────────

const cardJade = read('client/components/cards/cardDetails.jade');
const cardJs = read('client/components/cards/cardDetails.js');
const cardCss = read('client/components/cards/cardDetails.css');

test('the opened card splits its title the same way', () => {
  // The drag surface is the header ROW, not the heading: a heading is only as
  // wide as its own text, so with a short title "the right half of the title"
  // was a few pixels and the empty space beside it belonged to nothing.
  assert.ok(/\.card-details-header\.js-card-title-drag-handle\(/.test(cardJade),
    'the row is the window\'s drag bar');
  assert.ok(/\.card-details-title \{[^}]*min-width: 60%/.test(cardCss),
    'and the heading fills it, so half the title is half the bar');
  assert.ok(/a\.card-details-title-edit-zone\.js-open-inlined-form/.test(cardJade),
    'with a keyboard-focusable zone over the leading half that opens the editor');
  const zone = cardCss.slice(cardCss.indexOf('.card-details-title-edit-zone {'));
  const body = zone.slice(0, zone.indexOf('}'));
  assert.ok(/width: 50%/.test(body) && /inset-inline-start: 0/.test(body),
    'half of it, on the leading side, mirrored by a logical edge');
  assert.ok(/position: absolute/.test(body), 'as an overlay, so the sentence is not cut in two');
});

test('the drag handler steps aside for the half that edits (negative)', () => {
  // Both live on the same heading, so the one that must NOT fire has to say so.
  const handler = cardJs.slice(cardJs.indexOf("'mousedown .js-card-title-drag-handle'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/closest\('\.card-details-title-edit-zone'\)\.length > 0/.test(body),
    'a press inside the zone is not a drag');
  assert.ok(/closest\([\s\S]*a, input, textarea, button, select, option/.test(body),
    'and a link is still a link - which is what the close, maximise and menu '
    + 'buttons in that row are');
  assert.ok(/closest\('\.js-card-drag-handle'\)\.length > 0/.test(body),
    'and the drag handle keeps its own handler, so one press moves the window once');
  assert.ok(/markCardDetailsUserMoved\(\$card\)/.test(body),
    'while a real drag still marks the window as user-placed');
});

test('#6641: the opened-card drag bar steps aside for its live title editor', () => {
  const handler = cardJs.slice(cardJs.indexOf("'mousedown .js-card-title-drag-handle'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.match(body, /a, input, textarea, button, select, option, \.js-card-details-title/);
  assert.ok(/return;/.test(body), 'native mouse text selection returns before preventDefault');
  assert.ok(body.indexOf('return;') < body.indexOf('event.preventDefault()'),
    'the editor guard runs before the window drag suppresses browser selection');
});

test('the handle appears only when drag handles are on', () => {
  const header = cardJade.slice(cardJade.indexOf('template(name="cardDetails")'),
    cardJade.indexOf('.card-details-path'));
  assert.ok(/if canModifyCard\n\s+if isTouchScreenOrShowDesktopDragHandles\n\s+span\.card-drag-handle/
    .test(header), 'the handle is behind that question');
  // ...and then it is the only drag source, because the zone covers the title.
  assert.ok(/\.card-details\.card-details-with-handle[^{]*\.card-details-title-edit-zone \{[^}]*width: 100%/
    .test(cardCss), 'with handles on, the whole title edits');
  assert.ok(/card-details-with-handle\{\{\/if\}\}/.test(cardJade)
    || /\{\{#if isTouchScreenOrShowDesktopDragHandles\}\}card-details-with-handle/.test(cardJade),
    'and the class is set from the same question the handle asks');
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

test('the stickers popup is wide enough to see them at once', () => {
  // A hundred and fifty icons at eight per row is a column taller than the
  // screen: choosing one meant scrolling past most of them.
  const popupCss = read('client/components/main/popup.css');
  assert.ok(/data-popup='cardStickersPopup'\] \{\n\s+width: min\(90vw, 720px\)/.test(popupCss),
    'the popup is as wide as the colour pickers');
  const offset = read('client/lib/popupOffset.js');
  assert.ok(/cardStickersPopup: 720/.test(offset),
    'and the clamp knows that width, or it would place it half off screen');
  const details = read('client/components/cards/cardDetails.css');
  const picker = details.slice(details.indexOf('.card-stickers-picker {'));
  const body = picker.slice(0, picker.indexOf('}'));
  assert.ok(/grid-template-columns: repeat\(auto-fill, minmax\(40px, 1fr\)\)/.test(body),
    'and the picker fills it with as many columns as fit');
  assert.ok(!/max-width: 320px/.test(body),
    'rather than stopping at eight and leaving the new width empty');
});

console.log(`\ntitleClickToEdit: ${passed} tests passed`);
