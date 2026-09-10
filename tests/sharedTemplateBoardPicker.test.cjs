'use strict';

// Regression coverage for #2684: a template-container board is a regular
// board with a special `type`, so it already gets normal board membership -
// adding another user as a board member of a template board is the existing,
// generic sharing mechanism, exactly like sharing any other board. The gap
// was that the "apply a template" picker (Template.searchElementPopup in
// client/components/lists/listBody.js, opened by the card/list/swimlane/
// board "from template" buttons) was hard-wired to ONLY the current user's
// own `profile.templatesBoardId`, ignoring any template-container board they
// are merely a MEMBER of - even though the All Boards "Templates" view (and
// the server-side `boardTemplates` publication it subscribes to) already
// lists any template-container board the user is a member of, not only ones
// they personally created.
//
// This is a narrow query/picker fix, not a new sharing mechanism: board
// membership already shares a template board the normal way once the picker
// stops filtering it out.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const picker = read('client/components/lists/listBody.js');
const pickerJade = read('client/components/lists/listBody.jade');
const publications = read('server/publications/boards.js');
const visibility = read('models/lib/boardVisibilitySelectors.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the boardTemplates publication selects by membership, not ownership', () => {
  assert.match(publications, /Meteor\.publish\('boardTemplates'/);
  // Confirm it is scoped by boardVisibilitySelectors (userId/org/team/domain
  // membership), not by an owner-only or createdBy-only clause.
  assert.match(
    publications,
    /type: 'template-container',\s*\n\s*\$or: boardVisibilitySelectors\(/,
  );
  assert.doesNotMatch(publications, /type: 'template-container'[\s\S]{0,200}owner:/);
});

test('board membership itself is not restricted to the creator', () => {
  assert.match(
    visibility,
    /selectors\.push\(\{ members: \{ \$elemMatch: \{ userId, isActive: true \} \} \}\);/,
  );
});

test('the apply-template popup now offers OTHER template boards the user is a member of, not only their own', () => {
  // The helper that used to only ever resolve `profile.templatesBoardId`
  // must also expose template-container boards the user is a plain member
  // of (via the normal board `members` array), excluding only the user's
  // own board (already the default) to avoid listing it twice.
  assert.match(picker, /otherTemplateBoards\(\)/);
  assert.match(
    picker,
    /type: 'template-container',\s*\n\s*members: \{ \$elemMatch: \{ userId: Meteor\.userId\(\), isActive: true \} \},/,
  );
  // The query must not be narrowed to only boards the user created/owns.
  const helperBlock = picker.slice(
    picker.indexOf('otherTemplateBoards()'),
    picker.indexOf('otherTemplateBoards()') + 600,
  );
  assert.doesNotMatch(helperBlock, /owner:/);
  assert.doesNotMatch(helperBlock, /createdBy:/);
});

test('the picker subscribes to boardTemplates so shared template boards reach minimongo', () => {
  const templateSearchBlock = picker.slice(
    picker.indexOf('if (this.isTemplateSearch) {'),
    picker.indexOf('} else {\n    boardId = (Utils.getCurrentBoard()'),
  );
  assert.match(templateSearchBlock, /Meteor\.subscribe\('boardTemplates'\)/);
});

test('a jade dropdown lets the user switch to a shared template board', () => {
  assert.match(pickerJade, /select\.js-select-template-board/);
  assert.match(pickerJade, /each otherTemplateBoards/);
});

test('picking another template board updates the search source, not just a link target', () => {
  assert.match(
    picker,
    /'change \.js-select-template-board'\(evt, tpl\) \{[\s\S]*?tpl\.boardId = boardId;[\s\S]*?tpl\.selectedBoardId\.set\(boardId\);/,
  );
});

console.log(`\nsharedTemplateBoardPicker: ${passed} tests passed`);
