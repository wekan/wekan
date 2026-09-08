'use strict';

// A collapsed list's rotated title used to sit near the TOP of the tall
// (540px) collapsed column with empty space below it, instead of being
// centered in it - visible in .tools/collapse.png. Two separate bugs, in two
// separate rule sets that both style `.list-rotated`/`.list-header-name` for
// a collapsed list (a plain rule and a more specific `:not(.mobile-view)`
// one that actually wins on desktop):
//
//   1. `.list-rotated` itself did not stretch to fill the space left after
//      the collapse-toggle/drag-handle - one used `flex: 0 0 auto` outright,
//      the other had an explicit `height: auto` fighting its own `flex: 1`.
//   2. The title `<h2>` filled 100%/100% of that box, which leaves the
//      parent's centering nothing to center; shrinking the h2 to its content
//      instead of filling 100%/100% seemed like the fix, but measured EMPTY
//      in a real browser (a vertical writing-mode block box with `width:
//      auto; height: auto` rendered no text at all) - so the actual fix
//      keeps the h2 at 100%/100% and centers its OWN text run with flex
//      instead of shrinking the box.
//
// Verified with a Playwright screenshot of a minimal reproduction against
// both the `.mobile-view` and non-mobile-view rule sets before pinning this
// as a static test (no browser here).
//
// Run: node tests/collapsedListTitleCentered.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(repoRoot, 'client/components/lists/list.css'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('collapsedListTitleCentered:');

// Extract one `selector { ... }` block by its exact selector line, with its
// /* ... */ comments stripped - some of them explain, in prose, the OLD
// values being fixed, which must not accidentally satisfy a check looking
// for their absence.
function ruleBody(selector) {
  const at = css.indexOf(`${selector} {`);
  assert.ok(at !== -1, `expected to find the rule: ${selector}`);
  const end = css.indexOf('\n}', at);
  return css.slice(at, end).replace(/\/\*[\s\S]*?\*\//g, '');
}

test('.list-rotated grows to fill the collapsed column, in both rule sets', () => {
  const plain = ruleBody('.list.list-collapsed .list-header .list-rotated');
  assert.ok(/flex:\s*1\s*;/.test(plain), 'the plain rule uses flex: 1');
  assert.ok(!/height:\s*auto\s*!important/.test(plain),
    'and no longer fights it with an explicit height: auto !important');

  const desktop = ruleBody('.list.list-collapsed:not(.mobile-view) .list-header .list-rotated');
  assert.ok(/flex:\s*1 1 auto\s*!important/.test(desktop),
    'the desktop (:not(.mobile-view), the one that actually wins) rule grows too');
  assert.ok(!/flex:\s*0 0 auto/.test(desktop),
    'the old flex: 0 0 auto (never grow) is gone');
  assert.ok(!/align-self:\s*flex-start/.test(desktop),
    'and the old top/start pin (align-self: flex-start) is gone');
});

test('.list-rotated centers its content, in both rule sets', () => {
  for (const selector of [
    '.list.list-collapsed .list-header .list-rotated',
    '.list.list-collapsed:not(.mobile-view) .list-header .list-rotated',
  ]) {
    const body = ruleBody(selector);
    assert.ok(/display:\s*flex/.test(body), `${selector} is a flex container`);
    assert.ok(/align-items:\s*center/.test(body) && /justify-content:\s*center/.test(body),
      `${selector} centers on both axes`);
  }
});

test('the title itself centers its OWN text run instead of shrinking to content', () => {
  // Shrinking width/height to content measured EMPTY in a real browser for a
  // vertical writing-mode block box - see the header comment. The h2 must
  // stay 100%/100% and be a flex container of its own, not `display: block`.
  for (const selector of [
    '.list.list-collapsed .list-header .list-rotated h2.list-header-name',
    '.list.list-collapsed:not(.mobile-view) .list-header .list-rotated h2.list-header-name',
  ]) {
    const body = ruleBody(selector);
    assert.ok(/display:\s*flex\s*!important/.test(body), `${selector} is display: flex`);
    assert.ok(/align-items:\s*center/.test(body) && /justify-content:\s*center/.test(body),
      `${selector} centers its own text run`);
    assert.ok(/width:\s*100%/.test(body) && /height:\s*100%/.test(body),
      `${selector} still fills its parent rather than shrinking to content`);
    assert.ok(!/width:\s*auto\s*;/.test(body) && !/height:\s*auto\s*;(?!\s*!important)/.test(body),
      `${selector} does not shrink its box to content`);
  }
  // The desktop rule's text-align used to be "start" (top/left in its
  // vertical-lr writing mode), which the flex centering above replaces -
  // but keep text-align: center too, for the cross-axis wrap of a long title.
  const desktopH2 = ruleBody(
    '.list.list-collapsed:not(.mobile-view) .list-header .list-rotated h2.list-header-name');
  assert.ok(/text-align:\s*center\s*!important/.test(desktopH2),
    'text-align is center, not the old start');
});

console.log(`\ncollapsedListTitleCentered: ${passed} tests passed`);
