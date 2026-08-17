'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const sidebarState = fs.readFileSync(
  path.join(root, 'client/lib/allBoardsSidebar.js'),
  'utf8',
);
const sidebarEvents = fs.readFileSync(
  path.join(root, 'client/components/boards/allBoardsSidebar.js'),
  'utf8',
);
const boardListEvents = fs.readFileSync(
  path.join(root, 'client/components/boards/boardsList.js'),
  'utf8',
);

test('multi-selection keeps its All Boards sidebar view visible', () => {
  const guards =
    sidebarState.match(/if \(BoardMultiSelection\.isActive\(\)\) \{[\s\S]*?\n  \}/g) || [];

  assert.equal(guards.length, 2, 'open and close must both enforce selection mode');
  for (const guard of guards) {
    assert.match(guard, /viewVar\.set\(SIDEBAR_MULTISELECTION\)/);
    assert.match(guard, /openVar\.set\(true\)/);
    assert.match(guard, /return;/);
  }
});

test('turning multi-selection off closes the now-unlocked sidebar', () => {
  const disableThenClose =
    /BoardMultiSelection\.disable\(\);\s*closeAllBoardsSidebar\(\);/g;

  assert.match(sidebarEvents, disableThenClose);
  assert.ok(
    (boardListEvents.match(disableThenClose) || []).length >= 2,
    'both All Boards off controls must disable before closing',
  );
});

test('the sidebar X turns Multi-Selection off before closing it', () => {
  const at = sidebarEvents.indexOf("'click .js-close-all-boards-sidebar'");
  const body = sidebarEvents.slice(at, sidebarEvents.indexOf('\n  },', at));

  assert.match(body, /if \(BoardMultiSelection\.isActive\(\)\) BoardMultiSelection\.disable\(\)/);
  assert.ok(
    body.indexOf('BoardMultiSelection.disable()') < body.indexOf('\n    closeAllBoardsSidebar();'),
    'the selection guard must be unlocked before the sidebar is closed',
  );
});
