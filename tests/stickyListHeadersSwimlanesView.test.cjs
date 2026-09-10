'use strict';
(async () => {

// Plain-Node source-pattern regression test (no Meteor) for issue #2805:
// "Single fixed list titles static at top of swimlanes view" - list headers
// should stay pinned to the top while scrolling in the Swimlanes board view
// specifically.
//
// #3847 (tests/stickyListHeaders.test.cjs) added the board-wide
// `stickyListHeaders` toggle and `.list.list-sticky-header .list-header {
// position: sticky; top: 0; }` in client/components/lists/list.css. That CSS
// rule alone is not enough in the Swimlanes view: `position: sticky` only
// pins an element within its NEAREST ancestor that is itself a CSS scroll
// container (any element whose computed overflow is not `visible` on both
// axes). Before this fix, client/components/swimlanes/swimlanes.css's
// `.swimlane { overflow: auto; }` made every swimlane ROW its own scroll
// container on BOTH axes. Since `.swimlane` itself never scrolls internally
// in ordinary use (`.list` is already `height: 100%` of it, and each list's
// own `.list-body` carries the card overflow), the sticky ancestor search
// stopped at `.swimlane` and never reached the real, page-level vertical
// scroll container - `.board-wrapper .board-canvas` (overflow-y: auto, see
// client/components/boards/boardBody.css) - that scrolls down through
// multiple swimlane rows in the Swimlanes view. So headers appeared "stuck"
// to a box that never itself scrolled, and scrolled away with the rest of
// the swimlane exactly as if the toggle were off.
//
// The fix keeps the SAME `stickyListHeaders` toggle and the SAME
// `.list.list-sticky-header .list-header` sticky rule from #3847 - nothing
// duplicated - and only stops `.swimlane` from capturing the vertical axis:
// `overflow-x: auto` (still needed so a row of lists that is wider than the
// viewport scrolls sideways) and `overflow-y: visible` (so the sticky
// ancestor search continues past `.swimlane` up to `.board-canvas`).
//
// What this test can NOT verify (no browser here): that scrolling down
// through several swimlane rows actually keeps a list's title pinned on
// screen. That is a visual/runtime behaviour; only the CSS rule and its
// scroll-container implications are checked here.
//
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/stickyListHeadersSwimlanesView.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const swimlanesCss = read('client/components/swimlanes/swimlanes.css');
const listCss = read('client/components/lists/list.css');
const boardBodyCss = read('client/components/boards/boardBody.css');

// --- .swimlane no longer captures the vertical scroll axis ------------------

test('.swimlane keeps horizontal scrolling but does not capture the vertical axis', () => {
  const m = swimlanesCss.match(/(^|\n)\.swimlane\s*\{([\s\S]*?)\n\}/);
  assert.ok(m, '.swimlane base rule found');
  const body = m[2];
  assert.ok(/overflow-x:\s*auto/.test(body),
    '.swimlane still scrolls a wide row of lists sideways');
  assert.ok(/overflow-y:\s*visible/.test(body),
    '.swimlane no longer establishes its own vertical scroll container');
  // Negative: the old shorthand `overflow: auto;` (both axes) must be gone -
  // that is exactly what confined #3847's sticky header to the swimlane row
  // instead of the page-level scroll.
  assert.ok(!/overflow:\s*auto\s*;/.test(body),
    'the unconditional two-axis "overflow: auto" is removed from .swimlane');
});

test('the resize-drag preview still clips overflow (unaffected by the fix)', () => {
  // .swimlane-resizing forces overflow: hidden !important while a swimlane is
  // actively being dragged shorter, independent of the base .swimlane rule
  // above; this must keep working since it is a different selector/state.
  const m = swimlanesCss.match(/\.swimlane\.swimlane-resizing\s*\{([\s\S]*?)\n\}/);
  assert.ok(m, '.swimlane.swimlane-resizing rule found');
  assert.ok(/overflow:\s*hidden\s*!important/.test(m[1]),
    'resize preview still clips content regardless of the base .swimlane overflow');
});

// --- The real, page-level vertical scroll container is reachable ------------

test('.board-canvas is the page-level vertical scroll container that swimlane rows scroll within', () => {
  const m = boardBodyCss.match(/\.board-wrapper \.board-canvas\s*\{([\s\S]*?)\n\}/);
  assert.ok(m, '.board-wrapper .board-canvas rule found');
  assert.ok(/overflow-y:\s*auto/.test(m[1]),
    'board-canvas is the ancestor that actually scrolls through swimlane rows');
});

// --- #3847's mechanism is reused, not duplicated -----------------------------

test('the Swimlanes-view fix reuses #3847\'s single sticky rule, not a second mechanism', () => {
  const ruleMatch = listCss.match(
    /\.list\.list-sticky-header \.list-header\s*\{([\s\S]*?)\}/,
  );
  assert.ok(ruleMatch, '#3847\'s conditional sticky rule still exists, unchanged');
  assert.ok(/position:\s*sticky/.test(ruleMatch[1]), 'still sets position: sticky');
  assert.ok(/top:\s*0/.test(ruleMatch[1]), 'still pins to the top of its scroll container');
  // Negative: no second, swimlane-specific sticky-header selector was added -
  // the fix is confined to the .swimlane scroll-container boundary.
  const allStickyHeaderRules = [...listCss.matchAll(/\.list-header\s*\{([\s\S]*?)\}/g)]
    .filter(m => /position:\s*sticky/.test(m[1]));
  assert.strictEqual(allStickyHeaderRules.length, 1,
    'exactly one .list-header sticky rule exists across list.css');
  // Strip comments before scanning for `position: sticky` so prose about the
  // mechanism (this test file's own explanatory comment in swimlanes.css)
  // cannot be mistaken for a second rule.
  const swimlanesCssNoComments = swimlanesCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const swimlaneStickyRules = [...swimlanesCssNoComments.matchAll(/position:\s*sticky/g)];
  // [class=swimlane] { position: sticky; inset-inline-start: 0; } pins the
  // swimlane's own left edge during horizontal scroll and predates this fix -
  // it is unrelated to list headers, so it is allowed, but nothing else here
  // should introduce a second sticky mechanism for list headers.
  assert.ok(swimlaneStickyRules.length <= 1,
    'swimlanes.css does not add its own competing sticky-header mechanism');
});

console.log(`\n${passed} tests passed`);

})().catch(e => { console.error(e); process.exit(1); });
