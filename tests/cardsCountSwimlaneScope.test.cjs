'use strict';

// Regression guard: the list-header card count must be scoped to the swimlane the
// header is rendered IN, not to the list's own swimlaneId.
//
// A SHARED list (empty swimlaneId) renders under EVERY swimlane. cardsCount() used
// `list.swimlaneId` as the scope, which is '' for a shared list, so every swimlane
// showed the whole-list count while the cards rendered below were swimlane-scoped —
// e.g. "5 Cards" over an empty second swimlane. The card BODY already scopes by the
// container swimlane via listBody.jade `idOrNull ../../_id`; the fix passes that same
// `../../_id` to cardsCount and makes it prefer that container id. The per-swimlane
// card set itself is covered by server/lib/tests/selectAllSwimlane.tests.js
// (filterCardsByListAndSwimlane); this guards the wiring, which is Blaze-coupled.
//
// Run: node tests/cardsCountSwimlaneScope.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const headerJs = fs.readFileSync(
  path.join(repoRoot, 'client/components/lists/listHeader.js'),
  'utf8',
);
const headerJade = fs.readFileSync(
  path.join(repoRoot, 'client/components/lists/listHeader.jade'),
  'utf8',
);
const bodyJade = fs.readFileSync(
  path.join(repoRoot, 'client/components/lists/listBody.jade'),
  'utf8',
);

// Isolate the cardsCount() helper body.
const start = headerJs.indexOf('cardsCount(');
assert.ok(start !== -1, 'cardsCount() helper not found in listHeader.js');
const end = headerJs.indexOf('\n  },', start);
assert.ok(end > start, 'could not delimit the cardsCount() helper');
const body = headerJs.slice(start, end);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('cardsCount() accepts a container swimlane id argument', () => {
  assert.ok(/cardsCount\(\s*containerSwimlaneId\s*\)/.test(body),
    'cardsCount() must take the container swimlane id passed from the template');
});

test('it prefers the container swimlane id over the list\'s own swimlaneId', () => {
  assert.ok(/containerSwimlaneId/.test(body) && /list\.swimlaneId/.test(body),
    'both the container id (preferred) and the list.swimlaneId fallback must appear');
  // The container id must be chosen when it is a non-empty string; the list's own
  // binding is only the fallback.
  assert.ok(
    /containerSwimlaneId[\s\S]*\?\s*containerSwimlaneId\s*:\s*list\.swimlaneId/.test(body),
    'the container id must be preferred, with list.swimlaneId as the fallback',
  );
});

test('the count stays gated to swimlanes view', () => {
  assert.ok(/board-view-swimlanes/.test(body),
    'scoping must only apply in board-view-swimlanes (lists view keeps the whole count)');
});

test('listHeader.jade passes the container swimlane id (../../_id) to cardsCount', () => {
  // Match {{cardsCount ...}} but NOT {{cardsCountWhole}} / {{cardsCountForListIsOne}}
  // (cardsCount must not be followed by another identifier char).
  const calls = headerJade.match(/\{\{cardsCount(?![A-Za-z])[^}]*\}\}/g) || [];
  assert.ok(calls.length >= 1, 'listHeader.jade must call cardsCount');
  for (const c of calls) {
    assert.ok(/\.\.\/\.\.\/_id/.test(c),
      `cardsCount call must pass ../../_id (the container swimlane), got: ${c}`);
  }
  // No bare {{cardsCount}} (no-arg) may remain.
  assert.ok(!/\{\{cardsCount\s*\}\}/.test(headerJade),
    'no bare {{cardsCount}} (missing the swimlane id) may remain');
});

test('the header uses the SAME ../../_id depth the card body uses', () => {
  // Sanity anchor: listBody.jade scopes the rendered cards with `idOrNull ../../_id`,
  // and listHeader is included at the same depth, so the header must use ../../_id too.
  assert.ok(/idOrNull \.\.\/\.\.\/_id/.test(bodyJade),
    'listBody.jade must still scope cards with idOrNull ../../_id (the reference depth)');
});

console.log(`\nAll ${passed} cardsCount swimlane-scope tests passed`);
