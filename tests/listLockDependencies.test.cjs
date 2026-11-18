'use strict';
// Decided 2026-11-18 (TODO.md): a list that refuses a role write access (#4527)
// refuses that role's dependency lines on its cards too - the line is stored on
// its source card (cardDependencies). Before, they followed only the board-wide
// rule (canEditBoardDependencies). The REST routes are pinned by
// tests/listPermissions.test.cjs's scan; this pins DDP and the import.
// Run: node --test tests/listLockDependencies.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server/models/dependencies.js'), 'utf8');
const fn = name => src.slice(src.indexOf(`async function ${name}(`), src.indexOf('\n}\n', src.indexOf(`async function ${name}(`)));

test('setBoardDependency and removeBoardDependency ask the source card\'s list', () => {
  const context = fn('boardDependencyContext');
  assert.match(context, /if \(!siteAdmin\) await assertListsWritable\(userId, board, \[source\.listId\]\);/);
  assert.ok(context.indexOf('assertListsWritable(') < context.indexOf('return { board, source, target }'));
  for (const method of ['setBoardDependency', 'removeBoardDependency']) {
    const body = src.slice(src.indexOf(`async ${method}(`), src.indexOf('\n  },', src.indexOf(`async ${method}(`)));
    assert.ok(body.indexOf('boardDependencyContext(') < body.indexOf('writeBoardDependencies('), `${method} decides first`);
  }
});

test('an import skips a line whose card is in a refusing list', () => {
  const body = src.slice(src.indexOf('async importBoardDependencies('), src.indexOf('async setMyDependency('));
  assert.match(body, /\(await listException\(this\.userId, board, from\.listId, 'write'\)\) === false/);
  assert.ok(body.indexOf('listException(') < body.indexOf('writeBoardDependencies('));
});

test('over REST a refusal is an attempt: 403, recorded as ListLockBleed', () => {
  assert.match(fn('checkRestDependencyAccess'),
    /await assertListNotRefused\(userId, board, card\.listId, 'write', 'rest:card-dependency'\);/);
});

test('negative: reading dependency lines is not a write, and asks no list', () => {
  for (const route of ["'/api/boards/:boardId/dependencies'", "'/api/boards/:boardId/cards/:cardId/dependencies'"]) {
    const at = src.indexOf(`WebApp.handlers.get(${route}`);
    assert.ok(at >= 0, route);
    const body = src.slice(at, src.indexOf('WebApp.handlers.', at + 10));
    assert.doesNotMatch(body, /checkRestDependencyAccess\(|assertListNotRefused\(/, route);
  }
});
