'use strict';

// In mobile mode a list and its cards are full width - on a phone AND in mobile mode
// on a desktop browser.
//
// Reported: on an iPhone the list and the card fill the width, but switching desktop
// Firefox into mobile mode left them at their desktop width. Two separate causes, one
// in JS and one in CSS, both from the same root: mobile mode is decided in two places
// that did not agree.
//
//   * Utils.isMiniScreen() drives the `mobile-view` class on each list, swimlane and
//     minicard. It looked only at screen width and user agent, so on a wide desktop
//     window it stayed false even after the user turned mobile mode ON. The explicit
//     toggle was honoured on iPhone only. Now an explicit choice wins on every device.
//
//   * `.mobile-mode .list { width: 100% !important }` was outranked by
//     `.js-swimlane .list[style*="--list-width"] { width: var(--list-width) !important }`
//     - both !important, and the second is more specific. It never showed on a phone
//     (no inline --list-width is emitted there), only in mobile mode on a desktop.
//
// Run: node tests/mobileModeFullWidth.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const utils = read('client/lib/utils.js');
const listCss = read('client/components/lists/list.css');
const boardHeaderCss = read('client/components/boards/boardHeader.css');

console.log('mobileModeFullWidth:');

test('an explicit mobile-mode choice can be read apart from the fallback', () => {
  // getMobileMode() falls back to viewport detection, so it always returns a boolean
  // - which is why the "has the user chosen?" test inside isMiniScreen() was always
  // true. The explicit choice needs its own accessor that can answer "no choice".
  const fn = /getExplicitMobileMode\(\) \{[\s\S]*?\n  \},/.exec(utils);
  assert.ok(fn, 'there must be an explicit-choice accessor');
  assert.ok(/return null;/.test(fn[0]), 'it must be able to say "never chosen"');
  assert.ok(/localStorage\.getItem\('wekan-mobile-mode'\)/.test(fn[0]),
    'it reads the stored choice');
  assert.ok(/profile\.mobileMode/.test(fn[0]), 'and the one on the user profile');
});

test('the toggle wins over screen size on every device', () => {
  const fn = /isMiniScreen\(\) \{[\s\S]*?\n  \},/.exec(utils);
  assert.ok(fn, 'isMiniScreen must exist');
  const body = fn[0];
  const check = body.indexOf('getExplicitMobileMode()');
  assert.ok(check > -1, 'isMiniScreen must consult the explicit choice');
  // Before ANY of the width / user-agent branching, so it applies to desktop too and
  // not just to the iPhone branch that used to be the only one honouring it.
  assert.ok(check < body.indexOf('isSmallScreen'),
    'the choice is checked before screen width');
  assert.ok(check < body.indexOf('navigator.userAgent'),
    'and before any user-agent sniffing');
  assert.ok(/if \(explicitMobileMode !== null\)/.test(body),
    'only an actual choice short-circuits; no choice falls through to the defaults');
});

test('it stays reactive', () => {
  // The class is recomputed when the toggle flips or the window resizes; losing
  // either dependency would leave the layout stale until something else redrew.
  const fn = /isMiniScreen\(\) \{[\s\S]*?\n  \},/.exec(utils)[0];
  assert.ok(/windowResizeDep\.depend\(\)/.test(fn), 'depends on window resize');
  assert.ok(/Session\.get\('wekan-mobile-mode'\)/.test(fn), 'and on the toggle');
});

test('a list is full width in mobile mode even with a per-list width set', () => {
  // The rule that persists a resized width must not apply in mobile mode.
  const rule = /body\.mobile-mode \.js-swimlane \.list\[style\*="--list-width"\][\s\S]*?\{([^}]*)\}/
    .exec(listCss);
  assert.ok(rule, 'mobile mode must override the persisted per-list width');
  assert.ok(/width:\s*100% !important/.test(rule[1]), 'full width');
  assert.ok(/max-width:\s*100% !important/.test(rule[1]),
    'max-width too, or var(--list-width) still caps it');
  assert.ok(/min-width:\s*100% !important/.test(rule[1]),
    'and min-width, or it can still shrink to the custom width');
});

test('the override really is the more specific rule', () => {
  // Both are !important, so specificity decides. The override adds body.mobile-mode
  // to the SAME selectors - anything less and the desktop rule wins again.
  for (const sel of ['.js-swimlane', '.dragscroll', '[id^="swimlane-"]']) {
    assert.ok(listCss.includes(`body.mobile-mode ${sel} .list[style*="--list-width"]`),
      `${sel} must be covered by the mobile override too`);
  }
  // ...and it comes after the rule it overrides, so equal-specificity ties also go
  // the right way.
  assert.ok(listCss.indexOf('body.mobile-mode .js-swimlane .list[style*="--list-width"]')
    > listCss.indexOf('.js-swimlane .list[style*="--list-width"]'),
  'the override must come later in the file');
});

test('the plain mobile full-width rule is still there', () => {
  // The override above only neutralises the per-list width; this is what actually
  // makes a list full width.
  const rule = /\.mobile-mode \.list \{([^}]*)\}/.exec(boardHeaderCss);
  assert.ok(rule, '.mobile-mode .list must still exist');
  assert.ok(/width:\s*100% !important/.test(rule[1]), 'full width');
});

test('a collapsed list is still narrow (negative)', () => {
  // Collapsed lists are 30px wide. They were excluded from the width-persist rule for
  // exactly this reason (issue #5892) and must stay excluded from the override, or
  // collapsing a list in mobile mode would leave it full width.
  const overrideSelectors = listCss.slice(
    listCss.indexOf('body.mobile-mode .js-swimlane .list[style*="--list-width"]'),
    listCss.indexOf('{', listCss.indexOf('body.mobile-mode [id^="swimlane-"]')));
  const count = (overrideSelectors.match(/:not\(\.list-collapsed\)/g) || []).length;
  assert.strictEqual(count, 3, 'all three selectors must exclude collapsed lists');
});

console.log(`\nmobileModeFullWidth: ${passed} tests passed`);
