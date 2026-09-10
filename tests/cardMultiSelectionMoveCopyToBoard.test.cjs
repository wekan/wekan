'use strict';

// Regression coverage for #2155: move/copy MULTIPLE selected cards to a
// DIFFERENT board at once, via an explicit action - not drag-and-drop.
//
// This is distinct from #3298 (cross-board drag-and-drop inside the Bigboard
// view). #2155 asks for WeKan's existing checkbox multi-select mode to offer
// a "Move selection" / "Copy selection" action that can target ANY board the
// user is a member of, not just the current one.
//
// That action already exists (added by 82db0800e, "Move/Copy selection and
// Move/Copy swimlane: one dialog each, not two.") as
// `Template.moveSelectionPopup` / `Template.copySelectionPopup`, both built on
// the shared `registerSelectionDialogTemplate` + `selectionDestinationPicker`
// board/swimlane/list picker. This test pins that it is not scoped to the
// current board, that it walks the WHOLE selection (and nothing outside it),
// and that move vs. copy each do the right thing to a card once the
// destination is known.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const client = read('client/components/sidebar/sidebarFilters.js');
const jade = read('client/components/sidebar/sidebarFilters.jade');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardMultiSelectionMoveCopyToBoard:');

test('the multiselection sidebar exposes explicit Move/Copy selection actions', () => {
  assert.match(jade, /a\.sidebar-btn\.js-move-selection/);
  assert.match(jade, /a\.sidebar-btn\.js-copy-selection/);
  assert.match(client, /'click \.js-move-selection': Popup\.open\('moveSelection'\)/);
  assert.match(client, /'click \.js-copy-selection': Popup\.open\('copySelection'\)/);
});

test('the board picker is not restricted to the current board', () => {
  const at = client.indexOf('Template.selectionDestinationPicker.helpers({');
  const body = client.slice(at, client.indexOf('\n});', at));
  const boardsAt = body.indexOf('boards() {');
  const boardsBody = body.slice(boardsAt, body.indexOf('\n  },', boardsAt));
  assert.ok(boardsAt >= 0, 'boards() helper exists');
  // Every board the user is a member of, not `boardId: Session.get('currentBoard')`.
  assert.match(boardsBody, /ReactiveCache\.getBoards\(/);
  assert.match(boardsBody, /'members\.userId': Meteor\.userId\(\)/);
  assert.doesNotMatch(boardsBody, /boardId:\s*Session\.get\('currentBoard'\)/);
});

test('Done walks the WHOLE selection, in order, applying each to the chosen destination', () => {
  const at = client.indexOf("async 'click .js-done'()");
  const body = client.slice(at, client.indexOf('\n  },', at));
  assert.ok(at >= 0, 'the shared Done handler exists');
  assert.match(body, /getSelectedCardsSorted\(\)/);
  assert.match(body, /for \(let i = 0; i < selectedCards\.length; i \+= 1\) \{/);
  assert.match(body, /await applyToCard\(selectedCards\[i\], \{/);
  assert.match(body, /EscapeActions\.executeUpTo\('multiselection'\)/);
});

test('getSelectedCardsSorted is scoped to the current selection only', () => {
  const at = client.indexOf('function getSelectedCardsSorted()');
  const body = client.slice(at, client.indexOf('\n}', at));
  assert.ok(at >= 0);
  assert.match(body, /MultiSelection\.getMongoSelector\(\)/);
});

test('Move applies card.move() to the chosen board/swimlane/list/position', () => {
  const at = client.indexOf("registerSelectionDialogTemplate('moveSelectionPopup'");
  const body = client.slice(at, client.indexOf(');', at) + 2);
  assert.ok(at >= 0, 'move selection registration exists');
  assert.match(body, /card\.move\(to\.boardId, to\.swimlaneId, to\.listId, to\.sortIndex\)/);
});

test('Copy creates a new card on the destination board, then places it there', () => {
  const at = client.indexOf("registerSelectionDialogTemplate('copySelectionPopup'");
  const body = client.slice(at, client.indexOf("\n});", at));
  assert.ok(at >= 0, 'copy selection registration exists');
  assert.match(body, /Meteor\.callAsync\(\s*'copyCard',\s*card\._id,\s*to\.boardId,\s*to\.swimlaneId,\s*to\.listId,/);
  assert.match(body, /newCard\.move\(to\.boardId, to\.swimlaneId, to\.listId, to\.sortIndex\)/);
  // NEGATIVE - the original card must not be the one that gets `.move()`d
  // during a copy; only the freshly created card moves into place.
  assert.doesNotMatch(body, /\bcard\.move\(/);
});

test('NEGATIVE — copy skips a card whose copy failed instead of touching an unrelated one', () => {
  const at = client.indexOf("registerSelectionDialogTemplate('copySelectionPopup'");
  const body = client.slice(at, client.indexOf("\n});", at));
  assert.match(body, /if \(!newCardId\) return;/);
  assert.match(body, /if \(!newCard\) return;/);
});

console.log(`cardMultiSelectionMoveCopyToBoard: ${passed} passed`);
