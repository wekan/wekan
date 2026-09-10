'use strict';

// #4205: let a user mark one of their board templates as the DEFAULT, so the
// plain "type a name and click Create" board-creation flow applies it
// automatically instead of starting blank - no need to reopen the "Template"
// picker (Template.searchElementPopup, client/components/lists/listBody.js)
// every time. Marking a default is toggled from the SAME picker, with one
// more per-row icon (a star), matching the existing pattern used elsewhere
// (e.g. #2220's Home-board star). Nothing changes for a user who never sets
// one: createBoardSubmit falls back to createBoardWithInitialSwimlanes
// exactly as before this feature.
// Run: node tests/defaultBoardTemplate.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const usersModel = read('models/users.js');
const serverUsers = read('server/models/users.js');
const serverBoards = read('server/models/boards.js');
const boardHeaderJs = read('client/components/boards/boardHeader.js');
const listBodyJs = read('client/components/lists/listBody.js');
const listBodyJade = read('client/components/lists/listBody.jade');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('defaultBoardTemplate:');

test('the schema declares the two profile fields, both optional (unset changes nothing)', () => {
  assert.match(
    usersModel,
    /'profile\.defaultBoardTemplateId':\s*\{[\s\S]{0,600}?type:\s*String,\s*\n\s*optional:\s*true,/,
    'profile.defaultBoardTemplateId is an optional String',
  );
  assert.match(
    usersModel,
    /'profile\.defaultBoardTemplateBoardId':\s*\{[\s\S]{0,600}?type:\s*String,\s*\n\s*optional:\s*true,/,
    'profile.defaultBoardTemplateBoardId is an optional String',
  );
});

test('the model exposes getDefaultBoardTemplateId/isDefaultBoardTemplate reading only that field', () => {
  assert.match(usersModel, /getDefaultBoardTemplateId\(\)\s*\{\s*\n\s*return \(this\.profile && this\.profile\.defaultBoardTemplateId\) \|\| null;/);
  assert.match(usersModel, /isDefaultBoardTemplate\(cardId\)\s*\{\s*\n\s*return this\.getDefaultBoardTemplateId\(\) === cardId;/);
});

test('the server method validates the card before ever storing it as default', () => {
  const method = serverUsers.slice(
    serverUsers.indexOf('async toggleDefaultBoardTemplate('),
    serverUsers.indexOf('async toggleDefaultBoardTemplate(') + 1800,
  );
  assert.match(method, /if \(!this\.userId\) throw new Meteor\.Error\('not-logged-in'/, 'requires login');
  assert.match(method, /type: 'cardType-linkedBoard'/, 'only a real board-template card qualifies');
  assert.match(method, /boardId: templatesBoardId/, 'only from the caller\'s OWN templates board - not someone else\'s card id');
  assert.match(method, /archived: false/, 'not an archived (deleted) template');
  assert.match(method, /if \(!card \|\| !card\.linkedId\)/, 'refuses a card with no linked board');
  assert.match(method, /'profile\.defaultBoardTemplateBoardId': card\.linkedId/, 'caches the resolved board id alongside the card id');
});

test('toggling the current default clears BOTH fields (falls back to blank-board behavior)', () => {
  const method = serverUsers.slice(
    serverUsers.indexOf('async toggleDefaultBoardTemplate('),
    serverUsers.indexOf('async toggleDefaultBoardTemplate(') + 1800,
  );
  assert.match(method, /\$unset:\s*\{\s*\n\s*'profile\.defaultBoardTemplateId':\s*'',\s*\n\s*'profile\.defaultBoardTemplateBoardId':\s*'',/);
});

test('deleting the underlying template board clears any stale default pointer', () => {
  const section = serverBoards.slice(
    serverBoards.indexOf("doc.type === 'template-board'"),
    serverBoards.indexOf("doc.type === 'template-board'") + 500,
  );
  assert.match(section, /profile\.defaultBoardTemplateBoardId': doc\._id/, 'keyed off the removed board id');
  assert.match(section, /\$unset:\s*\{\s*\n\s*'profile\.defaultBoardTemplateId':\s*'',\s*\n\s*'profile\.defaultBoardTemplateBoardId':\s*'',/);
  assert.match(section, /\{ multi: true \}/, 'every user who had it set, not just one');
});

test('board creation reuses the EXACT copyBoard call the manual template picker already makes', () => {
  // The manual path (Template.searchElementPopup's 'click .js-minicard'
  // handler, isBoardTemplateSearch branch) calls:
  //   Meteor.call('copyBoard', element.linkedId, { sort, type: 'board', title }, cb)
  const manualCall = listBodyJs.slice(
    listBodyJs.indexOf('isBoardTemplateSearch) {\n      Meteor.call('),
  );
  assert.match(manualCall, /Meteor\.call\(\s*\n\s*'copyBoard',\s*\n\s*element\.linkedId,/);

  // The automatic path (createBoardSubmit's blank-board branch) calls the
  // SAME method the same way: 'copyBoard' with a board id and { type: 'board',
  // title } - not a second, hand-rolled copy of board.copy()/board-copying
  // logic.
  const autoSection = boardHeaderJs.slice(
    boardHeaderJs.indexOf('defaultTemplateBoardId'),
    boardHeaderJs.indexOf('defaultTemplateBoardId') + 900,
  );
  assert.match(autoSection, /Meteor\.call\(\s*\n\s*'copyBoard',\s*\n\s*defaultTemplateBoardId,/);
  assert.match(autoSection, /type: 'board',\s*\n\s*title,/);
  assert.doesNotMatch(boardHeaderJs, /async copy\(/, 'boardHeader.js must not reimplement board.copy() itself');
});

test('the default is read from the profile field cached by the toggle, needing no extra subscription', () => {
  assert.match(
    boardHeaderJs,
    /currentUser\s*\n?\s*&&\s*currentUser\.profile\s*\n?\s*&&\s*currentUser\.profile\.defaultBoardTemplateBoardId/,
  );
});

test('a user with no default set gets the UNCHANGED blank-board path', () => {
  const section = boardHeaderJs.slice(
    boardHeaderJs.indexOf('const visibility = tpl.visibility.get();'),
    boardHeaderJs.indexOf("FlowRouter.go('board', { id: tpl.boardId.get(), slug });", boardHeaderJs.lastIndexOf('const visibility = tpl.visibility.get();')),
  );
  assert.match(section, /if \(!tpl\.boardId\.get\(\)\) \{/, 'blank-board creation only runs when copyBoard did not already set the id');
  assert.match(section, /createBoardWithInitialSwimlanes/, 'the ORIGINAL blank-board method is still called, unchanged');
});

test('the "Template" picker offers a per-row star to mark/unmark the default, without applying it', () => {
  assert.match(
    listBodyJade,
    /js-set-default-board-template[\s\S]{0,300}isDefaultBoardTemplate/,
    'the star row exists only for board-template search results',
  );
  const handler = listBodyJs.slice(
    listBodyJs.indexOf("'click .js-set-default-board-template'"),
    listBodyJs.indexOf("'click .js-set-default-board-template'") + 400,
  );
  assert.match(handler, /evt\.stopPropagation\(\)/, 'clicking the star must not ALSO apply the template');
  assert.match(handler, /Meteor\.call\('toggleDefaultBoardTemplate', cardId/);
});

test('i18n: both tooltip keys exist in English, and are not left as an empty string', () => {
  assert.strictEqual(typeof en['set-default-board-template'], 'string');
  assert.ok(en['set-default-board-template'].length > 0);
  assert.strictEqual(typeof en['unset-default-board-template'], 'string');
  assert.ok(en['unset-default-board-template'].length > 0);
});

test('negative: no other client file re-derives a default-template board id and re-copies it by hand', () => {
  // The shape being guarded against is a SECOND, independently-written path
  // that reads profile.defaultBoardTemplateBoardId (or re-implements
  // board-template copying outside the one 'copyBoard' method / board.copy())
  // instead of reusing this one. Only boardHeader.js may reference the field.
  const dir = path.join(ROOT, 'client/components');
  const offenders = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) { walk(p); continue; }
      if (!entry.name.endsWith('.js')) continue;
      const rel = path.relative(ROOT, p);
      if (rel === 'client/components/boards/boardHeader.js') continue;
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('defaultBoardTemplateBoardId')) {
        offenders.push(rel);
      }
    }
  };
  walk(dir);
  assert.deepStrictEqual(offenders, []);
});

console.log(`\ndefaultBoardTemplate: ${passed} tests passed`);
