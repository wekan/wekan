'use strict';

// #1751 asked for filters to survive navigating from one board to another
// instead of being wiped on every board-to-board hop - the reporter's own
// use case is "only show my user's cards" (a members/assignees filter by
// user id), which means the same thing on every board since user ids are
// global. `config/router.js`'s board route used to call the full
// `Filter.reset()` whenever `previousBoard !== currentBoard`; it now calls
// `Filter.resetBoardScoped()` instead, which only clears filters keyed by
// ids/text that are scoped to the board being LEFT (labels, custom fields,
// dependency types, the advanced/list text filters) and leaves
// member/assignee/creator/due-date/title filters alone. This drives the
// REAL client/lib/filter.js under plain `node`.
//
// Run: node tests/filterPersistsAcrossBoards1751.test.cjs

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const { register } = require('node:module');

const loaderUrl = pathToFileURL(
  path.join(__dirname, 'helpers', 'meteorStubLoader.mjs'),
).href;
register(loaderUrl, pathToFileURL(__filename).href);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

(async () => {
  console.log('filterPersistsAcrossBoards1751:');

  const filterUrl = pathToFileURL(
    path.join(__dirname, '..', 'client', 'lib', 'filter.js'),
  ).href;
  const { Filter } = await import(filterUrl);

  test('resetBoardScoped() exists', () => {
    assert.equal(typeof Filter.resetBoardScoped, 'function');
  });

  test('resetBoardScoped() KEEPS the member/assignee/creator/due-date/title filters', () => {
    Filter.reset();
    Filter.members.add('memberA');
    Filter.assignees.add('assigneeA');
    Filter.userId.add('creatorA');
    Filter.title.set('urgent');

    Filter.resetBoardScoped();

    assert.equal(Filter.members.isSelected('memberA'), true);
    assert.equal(Filter.assignees.isSelected('assigneeA'), true);
    assert.equal(Filter.userId.isSelected('creatorA'), true);
    assert.equal(Filter.title._isActive(), true);
  });

  test('resetBoardScoped() CLEARS the board-scoped filters (labels, custom fields, dependencies, advanced, lists)', () => {
    Filter.reset();
    Filter.labelIds.add('labelFromBoardA');
    Filter.excludedLabelIds.add('excludedLabelFromBoardA');
    Filter.customFields.add('cfFromBoardA');
    Filter.cardDependencies.add('blocking');
    Filter.advanced.set('title:foo');
    Filter.lists.set('list-name');

    Filter.resetBoardScoped();

    assert.equal(Filter.labelIds.isSelected('labelFromBoardA'), false);
    assert.equal(Filter.excludedLabelIds.isSelected('excludedLabelFromBoardA'), false);
    assert.equal(Filter.customFields.isSelected('cfFromBoardA'), false);
    assert.equal(Filter.cardDependencies.isSelected('blocking'), false);
    assert.equal(Filter.advanced._isActive(), false);
    assert.equal(Filter.lists._isActive(), false);
  });

  test('plain Filter.reset() is untouched and still clears everything, including member/creator filters', () => {
    Filter.reset();
    Filter.members.add('memberA');
    Filter.userId.add('creatorA');
    Filter.labelIds.add('labelA');

    Filter.reset();

    assert.equal(Filter.members.isSelected('memberA'), false);
    assert.equal(Filter.userId.isSelected('creatorA'), false);
    assert.equal(Filter.labelIds.isSelected('labelA'), false);
    assert.equal(Filter.isActive(), false);
  });

  // ---- wiring: the board route calls resetBoardScoped(), not reset(), on a board hop ----

  test('config/router.js calls Filter.resetBoardScoped() (not Filter.reset()) when the board actually changes', () => {
    const routerSrc = fs.readFileSync(
      path.join(__dirname, '..', 'config', 'router.js'),
      'utf8',
    );
    const boardRouteAt = routerSrc.indexOf("name: 'board',");
    assert.ok(boardRouteAt > -1, 'the board route should exist');
    const boardRouteBody = routerSrc.slice(
      boardRouteAt,
      routerSrc.indexOf("FlowRouter.route('/shortcuts'", boardRouteAt),
    );
    const ifBlockAt = boardRouteBody.indexOf('previousBoard !== currentBoard');
    assert.ok(ifBlockAt > -1, 'the board route should branch on board change');
    const ifBlock = boardRouteBody.slice(ifBlockAt, ifBlockAt + 600);
    assert.match(ifBlock, /Filter\.resetBoardScoped\(\)/);
    assert.doesNotMatch(ifBlock, /Filter\.reset\(\)/);
  });

  console.log(`\nfilterPersistsAcrossBoards1751: ${passed} tests passed`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
