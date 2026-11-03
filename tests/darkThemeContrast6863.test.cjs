'use strict';

// #6863: "Dark Themes broken in 12.87": Card Settings showed white text on light
// grey blocks, popup items and the sidebar's shortcuts row were dark on dark, and
// list headers kept light text on a light grey. Two causes. The accessibility
// audit made the quiet greys dark (#595959) for the light themes, as one value for
// every theme; and old rules never followed the dark themes at all (a section
// background of #f7f7f7, a sidebar row of #000, an !important list header that
// beat each theme's own).
//
// Run: node tests/darkThemeContrast6863.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
function files(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files(rel, out);
    else if (entry.name.endsWith('.css')) out.push(rel);
  }
  return out;
}
function luminance(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map(c => c + c).join('');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

const colors = read('client/components/boards/boardColors.css');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('darkThemeContrast6863:');

// The text of a rule `selector { ... }` in boardColors.css (first rule that names it).
function ruleBody(selectorRegex) {
  const m = selectorRegex.exec(colors);
  assert.ok(m, `no rule for ${selectorRegex}`);
  return colors.slice(m.index, colors.indexOf('}', m.index));
}

test('the quiet text colour is a variable with the light themes\' value as its fallback, and a dark theme gives it a light one', () => {
  const css = files('client');
  const users = css.filter(file => /var\(--wekan-quiet-text, #(595959|5a5c61)\)/.test(read(file)));
  assert.ok(users.length >= 10, `the quiet greys are variables (${users.length} files)`);
  // negative: no stylesheet has a fixed quiet grey of the light themes any more
  for (const file of css) {
    const text = read(file);
    assert.ok(!/(?<![-\w])color: #(595959|5a5c61|8c8c8c|727479);/.test(text.replace(/var\(--wekan-quiet-text[^)]*\)/g, '')), `${file}: a fixed quiet grey`);
  }
  const dark = ruleBody(/:is\(\s*\.board-color-cleandark,\s*\.board-color-moderndark\s*\) \{/);
  assert.match(dark, /--wekan-quiet-text: #b4b4b4;/);
  assert.ok(ratio('#b4b4b4', '#23232b') >= 7, 'light enough on cleandark\'s surface');
  const modern = ruleBody(/\.board-color-moderndark \{\n  --wekan-quiet-text/);
  assert.ok(ratio(/--wekan-quiet-text: (#[0-9a-f]{6})/.exec(modern)[1], '#545454') >= 4.5, 'and on moderndark\'s lighter greys');
});

test('Card Settings: its sections follow the theme, and the white text of the dark themes is on a dark block', () => {
  const css = read('client/components/cards/cardAddFields.css');
  assert.match(css, /\.card-settings-inline-section \{[^}]*background: var\(--card-settings-section-bg, #f7f7f7\);/);
  assert.doesNotMatch(css, /color: #808080/, 'its muted text is the quiet variable (#808080 on #f7f7f7 was 3.68)');
  const dark = ruleBody(/:is\(\s*\.board-color-cleandark,\s*\.board-color-moderndark\s*\) \{/);
  const section = /--card-settings-section-bg: rgba\(255, 255, 255, (0?\.\d+)\)/.exec(dark);
  assert.ok(section, 'the dark themes name a section background');
  assert.ok(Number(section[1]) <= 0.15, 'a faint lift of the surface, not a light block');
});

test('exodark\'s Card Settings popup has dark sections too, and moderndark\'s selected minicard has white text', () => {
  assert.match(colors, /\.pop-over\.board-color-exodark \{[^}]*--card-settings-section-bg: rgba\(255, 255, 255, 0\.08\);/);
  assert.match(colors, /\.board-color-moderndark \.is-selected > \.minicard \.minicard-title,\s*\.board-color-moderndark \.is-selected > \.minicard \.minicard-title \* \{\s*color: #fff;/);
});

test('the sidebar shortcuts row is white in the themes whose sidebar is dark', () => {
  assert.match(colors, /:is\(\s*\.board-color-cleandark,\s*\.board-color-moderndark\s*\) \.sidebar \.sidebar-shortcuts \{\s*color: #fff;/);
  assert.match(read('client/components/sidebar/sidebar.css'), /\.sidebar \.sidebar-shortcuts \{[^}]*color: #000;/, 'the light themes keep it black');
});

test('a list header does not beat the theme\'s own with !important', () => {
  const css = read('client/components/lists/list.css');
  assert.doesNotMatch(css, /\.list-header \{[^}]*background-color: #e4e4e4 !important/);
  assert.doesNotMatch(css, /\.list-header \{[^}]*border-bottom: 8px solid #e4e4e4 !important/);
  assert.match(colors, /\.board-color-moderndark \.list-header \{\s*background: #6a6a6a;/);
  assert.match(colors, /\.board-color-exodark \.list-header \{[^}]*background: #222;/);
});

test('exodark: its dark popup has light links and the light quiet text; dark and exodark keep it light on the board, the card and the sidebar', () => {
  assert.match(colors, /\.pop-over\.board-color-exodark \{[^}]*--wekan-quiet-text: #b4b4b4;/);
  assert.match(colors, /:is\(\s*\.board-color-moderndark,\s*\.board-color-exodark\s*\)\.pop-over \.pop-over-list li > a,[\s\S]*?\.board-color-moderndark \.sidebar \.pop-over-list li > a \* \{\s*color: #fff !important;/);
  assert.match(read('client/components/main/popup.css'), /\.pop-over-list li > a \{[^}]*color: #000 !important/, 'popup.css still forces black on the light themes');
  assert.match(colors, /:is\(\s*\.board-color-dark,\s*\.board-color-exodark\s*\) :is\(\.board-canvas, \.card-details, \.sidebar\) \{\s*--wekan-quiet-text: #b4b4b4;/);
  assert.match(colors, /\.board-color-dark \.swimlane-header \{\s*color: #fff;/);
});

test('a quiet button (Add custom field, Link fields) is light on the dark popups and sidebars', () => {
  assert.match(read('client/components/forms/forms.css'), /\.quiet-button \{[^}]*color: #222;/, 'forms.css keeps #222 for light surfaces');
  const m = /:is\(\s*\.board-color-cleandark,\s*\.board-color-moderndark\s*\) \.quiet-button,\s*:is\(\s*\.board-color-cleandark,\s*\.board-color-moderndark,\s*\.board-color-exodark\s*\)\.pop-over \.quiet-button \{\s*color: (#[0-9a-f]{6});/.exec(colors);
  assert.ok(m, 'the dark themes name a quiet button colour');
  assert.ok(ratio(m[1], '#2e2e39') >= 7, 'on cleandark\'s popup surface');
});

console.log(`darkThemeContrast6863: ${passed} tests passed`);
