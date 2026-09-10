'use strict';

// Two open "Feature:Filters" issues turned out to already be fixed in the
// current code when checked against source, per the "Fix open issues"
// process (read the issue, check whether it's already fixed before
// building anything new):
//
// - #567 "Hide empty lists when filtering items in a board": Filter.hideEmpty
//   (client/lib/filter.js) plus its sidebar toggle
//   (.js-toggle-hideEmpty-filter in sidebarFilters.jade/.js) and its
//   consumers in client/components/swimlanes/swimlanes.js already hide a
//   list/swimlane with nothing left after filtering - this predates today's
//   session (it is not part of the #2886/#4540 work).
// - #2035 "extended Filter feature that will list up archived cards and
//   cards in archived lists": Filter.archive (client/lib/filter.js) plus its
//   sidebar toggle (.js-toggle-archive-filter, 'filter-show-archive') and
//   the matching `archived: false` query flip in sidebarFilters.js already
//   let the sidebar filter include archived cards/lists.
//
// This is a source-reading regression test (no server/build needed) so a
// future change that silently drops either wiring is caught here rather
// than only in manual QA.
//
// Run: node tests/filterAlreadyFixedIssues.test.cjs

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('filterAlreadyFixedIssues:');

const repoRoot = path.join(__dirname, '..');
const filterSrc = fs.readFileSync(
  path.join(repoRoot, 'client', 'lib', 'filter.js'),
  'utf8',
);
const sidebarJs = fs.readFileSync(
  path.join(repoRoot, 'client', 'components', 'sidebar', 'sidebarFilters.js'),
  'utf8',
);
const sidebarJade = fs.readFileSync(
  path.join(repoRoot, 'client', 'components', 'sidebar', 'sidebarFilters.jade'),
  'utf8',
);
const swimlanesJs = fs.readFileSync(
  path.join(repoRoot, 'client', 'components', 'swimlanes', 'swimlanes.js'),
  'utf8',
);
const enI18n = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'imports', 'i18n', 'data', 'en.i18n.json'),
    'utf8',
  ),
);

// ---- #567: hide empty lists when filtering ----

test('#567: Filter.hideEmpty exists as a SetFilter', () => {
  assert.match(filterSrc, /hideEmpty:\s*new SetFilter\(\)/);
});

test('#567: the sidebar has a hide-empty toggle wired to Filter.hideEmpty', () => {
  assert.match(sidebarJs, /js-toggle-hideEmpty-filter[\s\S]{0,200}Filter\.hideEmpty\.toggle/);
  assert.match(sidebarJade, /js-toggle-hideEmpty-filter/);
  assert.ok(
    Object.prototype.hasOwnProperty.call(enI18n, 'filter-hide-empty'),
    'en.i18n.json should have the filter-hide-empty label',
  );
});

test('#567: swimlanes.js actually consults Filter.hideEmpty when deciding what to render', () => {
  assert.match(swimlanesJs, /Filter\.hideEmpty\.isSelected\(\)/);
});

// ---- #2035: filter can include archived cards/lists ----

test('#2035: Filter.archive exists as a SetFilter', () => {
  assert.match(filterSrc, /archive:\s*new SetFilter\(\)/);
});

test('#2035: the sidebar has a show-archive toggle wired to Filter.archive', () => {
  assert.match(sidebarJs, /js-toggle-archive-filter[\s\S]{0,300}Filter\.archive\.toggle/);
  assert.match(sidebarJade, /js-toggle-archive-filter/);
  assert.ok(
    Object.prototype.hasOwnProperty.call(enI18n, 'filter-show-archive'),
    'en.i18n.json should have the filter-show-archive label',
  );
});

test('#2035: toggling the archive filter re-subscribes with the archived flag, not just a client-side filter', () => {
  const at = sidebarJs.indexOf('js-toggle-archive-filter');
  assert.ok(at > -1);
  const handler = sidebarJs.slice(at, sidebarJs.indexOf('},', at));
  assert.match(handler, /Filter\.archive\.isSelected\(\)/);
  assert.match(handler, /Meteor\.subscribe\(\s*'board'/);
});

console.log(`\nfilterAlreadyFixedIssues: ${passed} tests passed`);
