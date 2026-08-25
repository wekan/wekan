'use strict';

// Regression coverage for #3070. Both Create Board entry points must search
// board templates, while copied boards retain custom-field definitions.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const picker = read('client/components/lists/listBody.js');
const header = read('client/components/main/header.jade');
const boards = read('models/boards.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('All Boards and top-bar creation both select board templates', () => {
  assert.match(header, /^\s*a#header-new-board-icon\.board-header-btn\.js-create-board/m);
  assert.match(
    picker,
    /popupOpener\.hasClass\('js-add-board'\)[\s\S]+popupOpener\.hasClass\('js-create-board'\)/,
  );
});

test('template results exclude archived and non-board cards', () => {
  assert.match(boards, /query\.type = 'cardType-linkedBoard'/);
  assert.match(boards, /query\.archived = false/);
  assert.match(picker, /if \(!board\) return \[\]/);
  assert.doesNotMatch(picker, /if \(!this\.board\) \{\s*Popup\.back\(\)/);
});

test('board copies recreate custom fields and remap card values', () => {
  assert.match(boards, /const customFields = await ReactiveCache\.getCustomFields\(\{ boardIds: oldId \}\)/);
  assert.match(boards, /cf\.boardIds = \[_id\]/);
  assert.match(boards, /cf\._id = cfMap\[cf\._id\]/);
});

console.log(`\nboardTemplatePicker: ${passed} tests passed`);
