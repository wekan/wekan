'use strict';

// The two ways to put a picture behind a board, in one place.
// Run: node tests/boardBackgroundPopups.test.cjs
//
// "Change Background Image" asked for a URL. "Board backgrounds" listed the
// images uploaded to this board and carried the upload button. So the two ways
// of answering one question - a picture from the web, a picture from this
// machine - were in two different popups of the same menu, and the one that
// reads as the place to set a background had only half of it.
//
// One popup answers it now: the URL, the upload, and the list of what has been
// uploaded. "Board backgrounds" is gone from Board Settings with the popup it
// opened - a second entry to a list that is already on screen is a second place
// to look for one thing.
//
// The same popup also had its Unset five blank lines and a rule below the Save
// it belongs beside. They are one row now, Save first.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/sidebar/sidebar.jade');
const js = read('client/components/sidebar/sidebar.js');
const css = read('client/components/sidebar/sidebar.css');

const imagePopup = jade.slice(jade.indexOf('template(name="boardChangeBackgroundImagePopup")'),
  jade.indexOf('template(name="boardInfoOnMyBoardsPopup")'));
const list = jade.slice(jade.indexOf('template(name="boardBackgroundList")'),
  jade.indexOf('template(name="deleteBoardBackgroundPopup")'));
const boardMenu = jade.slice(jade.indexOf('template(name="boardMenuPopup")'),
  jade.indexOf('template(name="exportBoardPopup")'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('boardBackgroundPopups:');

test('the upload is under the Background Image URL', () => {
  assert.ok(/\+boardBackgroundUpload/.test(imagePopup), 'the upload is in this popup');
  assert.ok(imagePopup.indexOf('js-board-background-image-url')
    < imagePopup.indexOf('+boardBackgroundUpload'),
    'below the URL field, not above it');
  assert.ok(/template\(name="boardBackgroundUpload"\)/.test(jade),
    'as its own template');
  assert.ok(/js-bg-upload-button/.test(jade.slice(jade.indexOf('template(name="boardBackgroundUpload")'),
    jade.indexOf('template(name="boardBackgroundsPopup")'))),
    'holding the + Upload background image button');
});

test('Save and Unset are one row, Save first', () => {
  const row = imagePopup.slice(imagePopup.indexOf('.buttonsContainer'),
    imagePopup.indexOf('hr'));
  assert.ok(row.indexOf("value=\"{{_ 'save'}}\"") < row.indexOf('js-remove-background-image'),
    'Save, then Unset at its trailing side');
  assert.ok(/board-background-image-buttons/.test(row), 'in a row of their own');
  assert.ok(!/br\n\s+br/.test(imagePopup),
    'and the five blank lines that used to separate them are gone');
  assert.ok(/\.board-background-image-buttons \{[^}]*gap: 8px/.test(css), 'with a gap between them');
  assert.ok(/\.board-background-image-buttons input\[type="submit"\],\n\.board-background-image-buttons button \{[^}]*flex: 1 1 0/.test(css),
    'sharing the width, so neither is a full-width block above the other');
});

test('Unset does not submit the form (negative)', () => {
  // It sits inside the same <form> as Save. A <button> with no type is a
  // SUBMIT button, so beside the Save it would also save the URL it is meant to
  // clear - and the click handler's Popup.back() would race the submit's.
  const row = imagePopup.slice(imagePopup.indexOf('.buttonsContainer'));
  assert.ok(/js-remove-background-image[^\n]*\(type="button"\)/.test(row),
    'it is explicitly type="button"');
  assert.ok(/'click \.js-remove-background-image'/.test(js), 'and does its work on click');
});

test('one popup holds the URL, the upload and the list', () => {
  // An upload that shows nothing afterwards is indistinguishable from one that
  // failed - which is what this looked like while the list was behind a menu
  // entry of its own.
  assert.ok(/template\(name="boardBackgroundList"\)/.test(jade), 'the list is its own template');
  assert.ok(/\+boardBackgroundUpload\n\s*\+boardBackgroundList/.test(imagePopup),
    'Change Background Image has it under the upload');
  assert.ok(/board-backgrounds-grid/.test(list), 'the images uploaded so far');
  for (const action of ['js-set-board-background', 'js-download-board-background',
    'js-delete-board-background']) {
    assert.ok(list.includes(action), `${action} still there`);
  }
  // One subscription, in the template that draws the list.
  assert.ok(/Template\.boardBackgroundList\.onCreated[\s\S]{0,300}subscribe\('boardBackgrounds'/.test(js),
    'which is where the subscription is');
});

test('Board Settings has no second entry to the same list (negative)', () => {
  assert.ok(!/js-manage-board-backgrounds/.test(jade), 'the menu row is gone');
  assert.ok(!/js-manage-board-backgrounds/.test(js), 'and the handler with it');
  assert.ok(!/template\(name="boardBackgroundsPopup"\)/.test(jade),
    'and the popup it opened, which had become one line');
  // The entry it was next to still opens the popup that now holds everything.
  assert.ok(/js-change-background-image/.test(boardMenu),
    'Change Background Image is still in Board Settings');
  assert.ok(/'click \.js-change-background-image': Popup\.open\('boardChangeBackgroundImage'\)/.test(js),
    'and still opens it');
  // Deleting one is still possible - from the list, where the picture is.
  assert.ok(/template\(name="deleteBoardBackgroundPopup"\)/.test(jade),
    'the delete confirmation is still there');
});

test('clicking a picture puts it behind the board', () => {
  // It used to be a 14px check icon in the row below an 80px picture of the
  // thing it applies, so the obvious click - on the picture - did nothing.
  assert.ok(/\.board-bg-thumb\.js-set-board-background/.test(list), 'the thumbnail applies it');
  assert.ok(/\.board-bg-name\.js-set-board-background/.test(list), 'and so does its name');
  assert.ok(!/a\.js-set-board-background/.test(list),
    'the separate check icon is gone - the picture is the button');
  assert.ok(/\.board-bg-thumb,\n\.board-bg-name \{[^}]*cursor: pointer/.test(css),
    'and it says so under the pointer');
  const handler = js.slice(js.indexOf("'click .js-set-board-background'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/if \(!board \|\| !this\._id\) return;/.test(body), 'a click with nothing behind it does nothing');
  assert.ok(/setBackgroundImage\(this\._id\)/.test(body) && /Utils\.setBackgroundImage\(\)/.test(body),
    'it is stored and painted');
  // Download and delete stay in the row: neither is something a picture can say.
  assert.ok(/js-download-board-background/.test(list) && /js-delete-board-background/.test(list),
    'the row keeps what the picture cannot say');
});

test('a picture is shown with its NAME', () => {
  // A grid of 80px thumbnails cannot be read: two photos of the same holiday
  // look the same, and after an upload nothing said which one arrived.
  assert.ok(/\.board-bg-name\.js-set-board-background\(title="[^"]+"\) \{\{cleanFilename name\}\}/.test(list),
    'the Amiga-safe name is drawn through the common sanitizer');
  assert.ok(/\.board-bg-name \{[^}]*text-overflow: ellipsis/.test(css),
    'and a long one is cut rather than breaking the tile');
});

test('a finished upload puts itself behind the board', () => {
  // "Add background image" is asked for by somebody who wants that picture
  // there. An upload that only lands in a list, with the board unchanged, reads
  // as one that did not work.
  const handler = js.slice(js.indexOf("'change .js-bg-upload-input'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/uploader\.on\('uploaded'/.test(body), 'it waits for the file to exist');
  assert.ok(/board\.setBackgroundImage\(fileRef\._id\)/.test(body), 'sets it as the board\'s');
  assert.ok(/Utils\.setBackgroundImage\(\)/.test(body), 'and paints it without a reload');
  assert.ok(/if \(err \|\| !fileRef \|\| !fileRef\._id\) return;/.test(body),
    'a failed upload sets nothing (negative)');
});

test('the upload logic moved with the markup, and only once (negative)', () => {
  // Two copies of an uploader is two places to fix an upload bug.
  assert.ok(/Template\.boardBackgroundUpload\.events\(\{/.test(js), 'the events moved');
  assert.ok((js.match(/'change \.js-bg-upload-input'/g) || []).length === 1,
    'exactly one file-input handler');
  assert.ok((js.match(/'click \.js-bg-upload-button'/g) || []).length === 1,
    'and one button handler');
  const listEvents = js.slice(js.indexOf('Template.boardBackgroundList.events({'));
  assert.ok(!/js-bg-upload/.test(listEvents.slice(0, listEvents.indexOf('\n});'))),
    'nothing about uploading is left in the list');
  assert.ok(/meta: \{ boardId: tpl\.boardId, source: 'board-background' \}/.test(js),
    'and an uploaded image is still stored as this board\'s background');
});

test('each template asks for what it needs (negative)', () => {
  // The subscription belongs to the popup that LISTS the images; the uploader
  // only needs the board id to file the upload under.
  const upload = js.slice(js.indexOf('Template.boardBackgroundUpload.onCreated'),
    js.indexOf('Template.boardBackgroundUpload.helpers'));
  assert.ok(/this\.boardId = board && board\._id/.test(upload), 'the uploader knows the board');
  assert.ok(!/this\.subscribe/.test(upload), 'and does not subscribe to a list it does not draw');
  const listCreated = js.slice(js.indexOf('Template.boardBackgroundList.onCreated'),
    js.indexOf('Template.boardBackgroundList.helpers'));
  assert.ok(/this\.subscribe\('boardBackgrounds', this\.boardId\)/.test(listCreated),
    'the list does');
});

console.log(`\nboardBackgroundPopups: ${passed} tests passed`);
