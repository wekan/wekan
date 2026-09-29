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
  // Since 8bf47d1a9 (choose structure and content when duplicating boards)
  // custom-field definitions are copied only when the copy selection keeps
  // them. The default selection still does, so #3070's guarantee stands; what
  // is pinned now is that the definitions are read from the SOURCE board
  // behind that switch, and (negative) that a copy which drops them also
  // drops the card values, so no card is left pointing at a field id that
  // was never recreated.
  assert.match(boards, /const customFields = selection\.customFields \? await ReactiveCache\.getCustomFields\(\{ boardIds: oldId \}\) : \[\]/);
  const copyOptions = read('models/lib/boardCopyOptions.js');
  assert.match(copyOptions, /\{ key: 'customFields', label: 'custom-fields' \}/);
  assert.match(copyOptions, /if \(input === undefined\) return allBoardCopyOptions\(\);/,
    'a copy with no explicit selection (the template picker) keeps custom fields');
  // The definitions are cloned BEFORE the cards and card copy re-keys the
  // values while inserting: re-keying afterwards inserted cards pointing at the
  // source board's fields, which the admin-only field guard refuses, so every
  // board copy with custom fields failed.
  const cards = read('models/cards.js');
  assert.match(boards, /cf\.boardIds = \[_id\]/);
  assert.match(boards, /selection\.customFieldIdMap = cfMap;/);
  assert.ok(boards.indexOf('selection.customFieldIdMap = cfMap;') < boards.indexOf('await swimlane.copy(_id'),
    'definitions are cloned before any swimlane or card is copied');
  assert.doesNotMatch(boards, /cf\._id = cfMap\[cf\._id\]/, 'no after-the-fact re-keying of inserted cards');
  assert.match(cards, /_id: fieldIds \? fieldIds\[field\._id\] : field\._id/);
  assert.match(cards, /\.filter\(field => field\._id\)/, 'a value whose field was not cloned is dropped');
});

console.log(`\nboardTemplatePicker: ${passed} tests passed`);
