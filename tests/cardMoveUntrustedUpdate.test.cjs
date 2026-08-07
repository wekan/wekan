'use strict';

// #6572: moving a card to another board failed every time, for everyone, with
//
//     Not permitted. Untrusted code may only updateAsync documents by ID. [403]
//
// whether or not the card had any dependencies, and before the move itself ever
// ran - so the card stayed where it was.
//
// models/cards.js is isomorphic: its helpers run in the client bundle too, and
// client code calls card.move() directly (list.js, swimlanes.js, minicard.js,
// globalSearch.js, sidebarFilters.js). Meteor's insecure-write rule lets
// untrusted code update only BY ID - a bare id, or a `{ _id: … }` selector. The
// cross-board branch of move() cleaned up inbound "Red Strings" (#3392) with
//
//     Cards.updateAsync({ boardId: …, 'cardDependencies.cardId': … },
//                       { $pull: … }, { multi: true })
//
// which is a compound selector AND a multi-document update: rejected on the
// client every time, including when it would have matched nothing.
//
// The same file's addDependency, setDependencyProps and removeDependency each
// carry a comment saying updates must be by _id only - the move path was the one
// place that did not follow it. The cleanup now lives in a Cards.after.update
// hook in server/models/cards.js, where a selector is allowed, and which also
// covers the REST API and import paths that never called the helper at all.
//
// Run: node tests/cardMoveUntrustedUpdate.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const model = read('models/cards.js');          // isomorphic: runs on the client
const serverModel = read('server/models/cards.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Strip comments, so the explanation of the old code above is not read as code.
function code(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

// Every `Cards.updateAsync(` call in a file, with its FIRST argument as text.
function updateSelectors(src) {
  const out = [];
  const re = /Cards\.(?:direct\.)?updateAsync\(/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    let i = m.index + m[0].length;
    // Read the first argument, balancing braces/parens up to the top-level comma.
    let depth = 0;
    let arg = '';
    for (; i < src.length; i += 1) {
      const c = src[i];
      if (c === '(' || c === '{' || c === '[') depth += 1;
      if (c === ')' || c === '}' || c === ']') {
        if (depth === 0) break;
        depth -= 1;
      }
      if (c === ',' && depth === 0) break;
      arg += c;
    }
    // The WHOLE call, to the matching ')': `multi: true` is the THIRD argument,
    // and a slice that stopped at the first comma could never see it - an
    // assertion that cannot fail is worse than no assertion.
    let j = m.index + m[0].length;
    let d = 0;
    for (; j < src.length; j += 1) {
      const c = src[j];
      if (c === '(' || c === '{' || c === '[') d += 1;
      else if (c === '}' || c === ']') d -= 1;
      else if (c === ')') {
        if (d === 0) break;
        d -= 1;
      }
    }
    out.push({
      line: src.slice(0, m.index).split('\n').length,
      selector: arg.trim().replace(/\s+/g, ' '),
      call: src.slice(m.index, j + 1).replace(/\s+/g, ' '),
    });
  }
  return out;
}

console.log('cardMoveUntrustedUpdate:');

test('every Cards update in the isomorphic model is by _id', () => {
  const calls = updateSelectors(code(model));
  assert.ok(calls.length > 20,
    `expected the model's updates to be found, got ${calls.length}`);
  const bad = calls.filter(({ selector }) => {
    if (!selector.startsWith('{')) return false;      // a bare id expression
    // `{ _id: … }` and nothing else. Any second top-level key makes it a query,
    // which the client may not use.
    return !/^\{ ?_id ?:[^,]*\}$/.test(selector);
  });
  assert.deepStrictEqual(bad.map(b => `line ${b.line}: ${b.selector.slice(0, 60)}`), [],
    'this selector is a QUERY, and models/cards.js runs in the client bundle, so '
    + 'Meteor rejects it with "Untrusted code may only updateAsync documents by '
    + 'ID" - move the write to a server hook or method');
});

test('and none of them is a multi-document update', () => {
  // The other half of the same rule, and the one that makes the intent obvious:
  // a `multi: true` write is by definition not by id.
  const calls = updateSelectors(code(model));
  const multi = calls.filter(c => /multi:\s*true/.test(c.call));
  assert.deepStrictEqual(multi.map(c => `line ${c.line}`), [],
    'a multi-document update cannot run from the client');
});

test('move() still clears the moved card\'s own dependencies', () => {
  // The half that IS allowed from the client, because it rides along in the
  // by-_id update: a card that has left the board keeps no links of its own.
  const at = code(model).indexOf('async move(boardId, swimlaneId, listId');
  assert.notStrictEqual(at, -1, 'the move helper must be there');
  const fn = code(model).slice(at, at + 6000);
  assert.ok(/mutatedFields\.cardDependencies = \[\]/.test(fn),
    'moving a card to another board must drop its own cross-board dependencies');
});

test('the inbound cleanup happens server-side, on a real board change', () => {
  const src = code(serverModel);
  const at = src.indexOf("$pull: { cardDependencies:");
  assert.notStrictEqual(at, -1,
    'server/models/cards.js must pull inbound dependencies when a card leaves a board');
  const hookStart = src.lastIndexOf('Cards.after.update', at);
  assert.notStrictEqual(hookStart, -1, 'and it must be in an after-update hook');
  const hook = src.slice(hookStart, at + 1200);

  assert.ok(/fieldNames\.includes\('boardId'\)/.test(hook),
    'it must only run when boardId was written');
  assert.ok(/this\.previous/.test(hook),
    'and needs the PREVIOUS boardId - the cards to clean up are on the board the '
    + 'card left, which doc.boardId no longer names');
  assert.ok(/oldBoardId === doc\.boardId/.test(hook),
    'a write that did not actually change the board must do nothing');
  // Both stored shapes: { cardId, … } objects, and legacy bare-string ids.
  assert.ok(/'cardDependencies\.cardId': doc\._id/.test(hook)
    && /cardDependencies: doc\._id/.test(hook),
    'both dependency shapes must be pulled - legacy rows hold bare id strings, '
    + 'which normalizeDependencies hides on read');
  assert.ok(/Cards\.direct\.updateAsync/.test(hook),
    'via .direct, like the checklist re-sync beside it: this is a cleanup on '
    + 'other documents, not an edit to re-run the hooks for');
});

test('the REST route cannot leave a card pointing at another board', () => {
  // The second half of #6572. Its reporter tried to work around the broken
  // client move by PUTting boardId/listId/swimlaneId of the DESTINATION board to
  // /api/boards/:boardId/lists/:listId/cards/:cardId. Those are not the
  // board-move parameters - isBoardMove needs newBoardId, newSwimlaneId and
  // newListId - so the board move never ran, while the same-board swimlane and
  // list branches did: the card kept its old boardId and got the other board's
  // listId and swimlaneId written onto it. It then belonged to a list and a
  // swimlane on a board it was not on, showed on neither, and had to be undone
  // with a hand-written database update.
  const src = code(serverModel);
  const at = src.indexOf('if (moveParams.swimlaneId');
  assert.notStrictEqual(at, -1, 'the same-board swimlane branch must be there');
  const branches = src.slice(at, src.indexOf('if (moveParams.isBoardMove)', at));

  // Both same-board branches must verify the target belongs to THIS board...
  assert.ok(/getSwimlane\(\{\s*_id: moveParams\.swimlaneId,\s*boardId: paramBoardId/.test(branches),
    'the swimlane must be checked against the board in the URL');
  assert.ok(/getList\(\{\s*_id: moveParams\.listId,\s*boardId: paramBoardId/.test(branches),
    'and so must the list');
  assert.ok((branches.match(/does not belong to this board/g) || []).length === 2,
    'each one refuses with a message naming the right parameters');
  assert.ok((branches.match(/newBoardId, newSwimlaneId and newListId/g) || []).length === 2,
    'which is newBoardId, newSwimlaneId and newListId');

  // ...and neither may run during a board move: they would rewrite listId before
  // the isBoardMove update, whose selector pins the card's ORIGINAL listId, so
  // that update would match nothing and silently do nothing.
  assert.ok(/if \(moveParams\.swimlaneId && !moveParams\.isBoardMove\)/.test(branches),
    'the swimlane branch must be skipped during a board move');
  assert.ok(/if \(moveParams\.listId && !moveParams\.isBoardMove\)/.test(branches),
    'and so must the list branch');
});

test('a board move still writes all three ids together', () => {
  // What the board-move branch is for, and the reason the branches above must
  // not run first: one update, one selector, all three fields.
  const src = code(serverModel);
  const at = src.indexOf('if (moveParams.isBoardMove)');
  assert.notStrictEqual(at, -1, 'the board-move branch must be there');
  const branch = src.slice(at, at + 3000);
  assert.ok(/\$set: \{ boardId: newBoardId, swimlaneId: newSwimlaneId, listId: newListId/.test(branch),
    'boardId, swimlaneId and listId move in ONE update - a card with some of them '
    + 'changed and not the others is on no board at all');
  assert.ok(/checkBoardWriteAccess\(req\.userId, newBoardId\)/.test(branch),
    'and the destination board is permission-checked');
});

console.log(`\n${passed} tests passed`);
