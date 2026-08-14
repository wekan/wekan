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
// The upload is with the URL now. What stays in "Board backgrounds" is what it
// is named for: the images already uploaded, to set active, download or delete.
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
const backgroundsPopup = jade.slice(jade.indexOf('template(name="boardBackgroundsPopup")'),
  jade.indexOf('template(name="deleteBoardBackgroundPopup")'));

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

test('the backgrounds popup keeps what it is named for', () => {
  assert.ok(/board-backgrounds-grid/.test(backgroundsPopup), 'the images uploaded so far');
  for (const action of ['js-set-board-background', 'js-download-board-background',
    'js-delete-board-background']) {
    assert.ok(backgroundsPopup.includes(action), `${action} still there`);
  }
  assert.ok(!/js-bg-upload-button/.test(backgroundsPopup),
    'and the upload button has moved out of it');
});

test('the upload logic moved with the markup, and only once (negative)', () => {
  // Two copies of an uploader is two places to fix an upload bug.
  assert.ok(/Template\.boardBackgroundUpload\.events\(\{/.test(js), 'the events moved');
  assert.ok((js.match(/'change \.js-bg-upload-input'/g) || []).length === 1,
    'exactly one file-input handler');
  assert.ok((js.match(/'click \.js-bg-upload-button'/g) || []).length === 1,
    'and one button handler');
  const backgrounds = js.slice(js.indexOf('Template.boardBackgroundsPopup.events({'));
  assert.ok(!/js-bg-upload/.test(backgrounds.slice(0, backgrounds.indexOf('\n});'))),
    'nothing about uploading is left in the backgrounds popup');
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
  const list = js.slice(js.indexOf('Template.boardBackgroundsPopup.onCreated'),
    js.indexOf('Template.boardBackgroundsPopup.helpers'));
  assert.ok(/this\.subscribe\('boardBackgrounds', this\.boardId\)/.test(list),
    'the list does');
});

console.log(`\nboardBackgroundPopups: ${passed} tests passed`);
