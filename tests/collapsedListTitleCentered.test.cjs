'use strict';

// A collapsed list's rotated title should sit HORIZONTALLY centered within
// the narrow (30px) column, right next to the collapse-toggle/drag-handle at
// the TOP - not centered down the whole (often much taller, up to 540px)
// column, which puts it far from the caret and reads as misplaced rather
// than centered (.tools/collapse2.png).
//
// This went through two wrong shapes before landing here:
//   1. Originally, the DESKTOP rule that actually wins
//      (`.list.list-collapsed:not(.mobile-view) ...`, more specific than the
//      plain one) had `text-align: start`, which left the vertical text
//      flush to one edge of the 30px width instead of centered across it.
//   2. Fixing that was first done by making both rule sets grow
//      (`flex: 1`/`flex: 1 1 auto`) and centering flex containers - which
//      centered the title correctly, but ACROSS THE WHOLE COLUMN HEIGHT,
//      moving it far from the caret. That is not what "centered" meant here.
//
// The fix that stuck: leave both rule sets exactly as they shipped (title
// sized to its own content, near the top) and change ONLY the desktop rule's
// `text-align` from `start` to `center` - the plain/mobile-view rule already
// had `text-align: center` and was never broken.
//
// Verified with a Playwright screenshot of a minimal reproduction of both
// rule sets (mobile-view present/absent).
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
// /* ... */ comments stripped - a comment may quote an OLD value in prose
// ("this used to be X") and must not accidentally satisfy a check looking
// for X's absence.
function ruleBody(selector) {
  const at = css.indexOf(`${selector} {`);
  assert.ok(at !== -1, `expected to find the rule: ${selector}`);
  const end = css.indexOf('\n}', at);
  return css.slice(at, end).replace(/\/\*[\s\S]*?\*\//g, '');
}

test('the desktop (:not(.mobile-view)) title is centered, not flush to one edge', () => {
  const body = ruleBody(
    '.list.list-collapsed:not(.mobile-view) .list-header .list-rotated h2.list-header-name');
  assert.ok(/text-align:\s*center\s*!important/.test(body),
    'text-align is center, not the old start');
  assert.ok(!/text-align:\s*start/.test(body), 'the old start value is gone');
});

test('neither rule set stretches the title down the whole column (negative)', () => {
  // The title stays near the collapse-toggle/drag-handle at the top: no
  // flex-grow on .list-rotated (the plain rule's own align-items: center on
  // its ALWAYS-shrink-wrapped box is original and fine - it is `flex: 1 1
  // auto`/`flex: 0 0 auto` that decides whether the box fills the column or
  // sizes to its content), and no centering flex container on the h2 in
  // either rule set.
  const desktopRotated = ruleBody(
    '.list.list-collapsed:not(.mobile-view) .list-header .list-rotated');
  assert.ok(!/flex:\s*1 1 auto/.test(desktopRotated), 'the growing flex value is gone here');
  assert.ok(!/align-items:\s*center/.test(desktopRotated) && !/justify-content:\s*center/.test(desktopRotated),
    'the desktop rule never had (and does not now have) a centering flex container');
  for (const selector of [
    '.list.list-collapsed .list-header .list-rotated h2.list-header-name',
    '.list.list-collapsed:not(.mobile-view) .list-header .list-rotated h2.list-header-name',
  ]) {
    const body = ruleBody(selector);
    assert.ok(!/display:\s*flex/.test(body),
      `${selector} is a plain block, not a centering flex container`);
  }
});

test('the desktop rule sizes to its own content near the top, exactly as it shipped', () => {
  const rotated = ruleBody('.list.list-collapsed:not(.mobile-view) .list-header .list-rotated');
  assert.ok(/flex:\s*0 0 auto\s*!important/.test(rotated), 'flex: 0 0 auto (never grow) is back');
  assert.ok(/align-self:\s*flex-start/.test(rotated), 'align-self: flex-start is back');
  assert.ok(/margin:\s*4px 0 0 0\s*!important/.test(rotated), 'the original 4px top margin is back');

  const h2 = ruleBody(
    '.list.list-collapsed:not(.mobile-view) .list-header .list-rotated h2.list-header-name');
  assert.ok(/display:\s*block\s*!important/.test(h2), 'the title is a plain block again');
  assert.ok(/height:\s*auto\s*!important/.test(h2), 'sized to its own content again');
});

test('the plain (mobile-view) rule is untouched - it was never broken', () => {
  const rotated = ruleBody('.list.list-collapsed .list-header .list-rotated');
  assert.ok(/height:\s*auto\s*!important/.test(rotated));
  assert.ok(/margin:\s*10px 0 0 0\s*!important/.test(rotated));

  const h2 = ruleBody('.list.list-collapsed .list-header .list-rotated h2.list-header-name');
  assert.ok(/display:\s*block\s*!important/.test(h2));
  assert.ok(/height:\s*100%\s*;/.test(h2));
  assert.ok(/text-align:\s*center\s*;/.test(h2), 'already centered - this rule needed no fix');
});

console.log(`\ncollapsedListTitleCentered: ${passed} tests passed`);
