'use strict';

// Regression guard for the right board sidebar (Filter / Search / etc.) width
// and its input fields.
//
// - The panel used `width: 30vw`, which scaled with the viewport: on very wide
//   screens it grew to ~double the intended width (looking right only at mid
//   widths). A clamp() bounded it, but between its two ends a clamp still tracks the
//   window - the same "elements resize when I resize the browser" behaviour reported
//   later for the board. It is now a fixed 420px: the width it was designed at.
// - The filter text inputs (Filter List by Title, Filter by card title, ...) had
//   no width, so they rendered at the browser's default narrow width with a big
//   empty gap on the right instead of equal spacing on both sides. Sidebar text
//   inputs must fill the padded content width.
//
// Run: node tests/sidebarWidth.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const css = fs.readFileSync(
  path.join(__dirname, '..', 'client/components/sidebar/sidebar.css'), 'utf8');

function block(selector) {
  const i = css.indexOf(selector + ' {');
  assert.ok(i >= 0, `rule ${selector} must exist`);
  return css.slice(i, css.indexOf('}', i));
}

console.log('sidebarWidth:');

test('.board-sidebar width is fixed, not scaling with the viewport', () => {
  const b = block('.board-sidebar');
  assert.ok(/width:\s*\d+px/.test(b),
    '.board-sidebar must have a fixed px width, so it does not resize with the window');
  assert.ok(!/width:[^;]*v[hw]/.test(b),
    'and no viewport unit in it, clamped or otherwise');
});

test('no `width: 30vw;` remains anywhere', () => {
  // The declaration that caused the doubling, in any form.
  assert.ok(!/width:\s*30vw\s*;/.test(css),
    'a bare width: 30vw; must not be present (must be clamped)');
});

test('sidebar text inputs fill the padded content width (symmetric spacing)', () => {
  // The rule targets text/search inputs in the sidebar content.
  const m = css.match(
    /\.sidebar\s+\.sidebar-content\s+input\[type="text"\][\s\S]{0,160}?\{([\s\S]*?)\}/);
  assert.ok(m, 'a width rule for .sidebar .sidebar-content input[type="text"] must exist');
  assert.ok(/width:\s*100%/.test(m[1]), 'sidebar text inputs must be width: 100%');
  assert.ok(/box-sizing:\s*border-box/.test(m[1]),
    'box-sizing: border-box keeps the border inside the width');
});

console.log(`\n${passed} passed`);
