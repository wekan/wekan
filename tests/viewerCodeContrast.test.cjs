'use strict';

// Guard: a code block in a description or comment (.viewer pre / code) reads
// in every theme.
// Run: node tests/viewerCodeContrast.test.cjs
//
// layouts.css gives the code block its own light background (#dedede) but not
// its own text colour, so it inherited the theme's: in the dark theme's
// opened card that is #bbb, 1.42:1 on #dedede, and axe-core's color-contrast
// rule failed the dark theme in Firefox (46-axe-theme-contrast.e2e.js,
// ".viewer > pre #bbbbbb/#dedede 1.42"). The block now names its text colour
// next to its background, so no theme's inherited colour can reach it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'client/components/main/layouts.css'), 'utf8');

function linear(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function luminance(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}
const ratio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const rule = css.match(/\.viewer pre,\s*\.viewer code\s*\{([^}]*)\}/);

test('layouts.css has the code block rule', () => {
  assert.ok(rule, '.viewer pre, .viewer code { ... } not found');
});

test('the code block names its own text colour beside its own background', () => {
  const bg = rule[1].match(/background:\s*(#[0-9a-f]{3,6})/i);
  const fg = rule[1].match(/(?:^|[;\s])color:\s*(#[0-9a-f]{3,6})/i);
  assert.ok(bg, 'the code block has a background');
  assert.ok(fg, 'and a text colour of its own, so a theme\'s inherited one cannot reach it');
  assert.ok(ratio(fg[1], bg[1]) >= 4.5, `${fg[1]} on ${bg[1]} is ${ratio(fg[1], bg[1]).toFixed(2)}:1, below 4.5`);
});

test('negative: the colour the dark theme used to give it fails on that background', () => {
  // axe-core reported 1.42; the same arithmetic, rounded its own way.
  const old = ratio('#bbbbbb', '#dedede');
  assert.ok(old < 1.5 && old < 4.5, `#bbbbbb on #dedede is ${old.toFixed(2)}:1`);
});

console.log(`\n${passed} passed`);
