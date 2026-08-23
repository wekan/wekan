'use strict';

// The bridge between WeKan's themes and the DSFR's colour scheme.
//
// WeKan has ~30 named themes and a custom-colour picker; the DSFR has one dark
// mode, switched by `data-fr-theme="dark"` on the root element. Jalor does not
// add a second theme system - it maps the one onto the other, so a WeKan dark
// theme really does turn the DSFR dark instead of leaving half the UI light.
//
// The failure this guards: a dark theme added upstream and not added here.
//
// Run: node tests/jalorTheme.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('jalorTheme:');

const bridge = read('client/jalor/jalorTheme.js');
const darkList = [...bridge.matchAll(/^\s{2}'([a-z]+)',$/gm)].map(m => m[1]);

test('the dark themes it knows about are WeKan\'s dark themes', () => {
  assert.ok(darkList.length >= 5, `only ${darkList.length} dark themes listed`);
  // Every name has to be a real WeKan theme, or the list is describing nothing.
  const accents = read('models/lib/themeAccents.js');
  for (const name of darkList) {
    assert.ok(new RegExp(`^\\s*${name}:`, 'm').test(accents),
      `'${name}' is not a theme in models/lib/themeAccents.js`);
  }
});

test('and no WeKan theme that LOOKS dark was left out', () => {
  // The accent of a theme is the colour it paints its header with. A dark
  // theme's is dark; that is what makes it dark. Any theme whose accent is
  // below the threshold must be in the list, which is how a theme added
  // upstream gets noticed here.
  const accents = read('models/lib/themeAccents.js');
  const entries = [...accents.matchAll(/^\s{2}([a-z]+): '(#[0-9a-fA-F]{3,6})',/gm)];
  assert.ok(entries.length > 20, `only ${entries.length} themes parsed`);

  const channels = hex => {
    let h = hex.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  };
  const luminance = hex => {
    const [r, g, b] = channels(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  // Darkness alone is not enough to tell a dark THEME from a strong colour:
  // Bleu France (#000091) is darker than any of WeKan's dark themes and is not
  // one - it is Jalor's primary on an otherwise light page. What the dark
  // themes have in common is that their accent is a near-neutral grey, so
  // saturation is the other half of the test.
  const saturation = hex => {
    const [r, g, b] = channels(hex);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 0;
    const l = (max + min) / 2;
    return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  };

  const missed = entries
    .filter(([, name, hex]) =>
      luminance(hex) < 0.2 && saturation(hex) < 0.5 && !darkList.includes(name))
    .map(([, name, hex]) => `${name} (${hex})`);
  assert.deepStrictEqual(missed, [],
    'these themes are dark but do not switch the DSFR over - add them to '
    + 'JALOR_DARK_THEMES in client/jalor/jalorTheme.js');

  // negative: Jalor's own theme is a dark BLUE on a light page, not dark mode.
  assert.ok(!darkList.includes('jalor'),
    "Jalor's own theme must not put the DSFR in dark mode");
});

test('it reads the class WeKan actually writes', () => {
  assert.ok(/board-color-\$\{theme\}/.test(bridge),
    'the bridge looks for `board-color-<name>` on <body>');
  const global = read('client/components/main/globalThemeColor.js');
  assert.ok(/applyClass\(`board-color-\$\{globalColor\}`\)/.test(global),
    'which is what globalThemeColor.js writes');
});

test('it never turns the DSFR dark on its own', () => {
  // prefers-color-scheme would leave WeKan's own stylesheets light and the DSFR
  // dark, which is worse than no dark mode at all.
  // Comments stripped first: the file EXPLAINS at length why it does not
  // consult prefers-color-scheme, and that explanation is not a use of it.
  const code = bridge.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/prefers-color-scheme/.test(code),
    'the bridge must not consult prefers-color-scheme');
  assert.ok(!/matchMedia/.test(code), 'nor reach for it through matchMedia');
  assert.ok(/removeAttribute\('data-fr-theme'\)/.test(bridge),
    'and it takes the attribute off again when the theme is not dark');
});

test('the header colour follows a WeKan theme when there is one', () => {
  // The one place the two systems meet in CSS. `--theme-accent` is set by
  // globalThemeColor.js for every named or custom theme and REMOVED when there
  // is none, so the fallback is what an unthemed Jalor looks like.
  const tokens = read('client/jalor/jalor-tokens.css');
  assert.ok(/--jalor-header-bg:\s*var\(--theme-accent, var\(--jalor-primary\)\)/.test(tokens),
    'the header reads the WeKan theme accent, falling back to Bleu France');
  const chrome = read('client/jalor/jalor-chrome.css');
  assert.ok(/background: var\(--jalor-header-bg\)/.test(chrome));
});

test('a coloured board still paints over the Jalor layer', () => {
  // Every board-colour rule upstream is !important, which is what lets the
  // Jalor layer set a plain default without knowing the list of colours.
  const swimlanes = read('client/components/swimlanes/swimlanes.css');
  assert.ok(/\.swimlane-blue \{\s*background: #0079bf !important;/.test(swimlanes),
    'upstream board colours are still !important');
  const kanban = read('client/jalor/jalor-kanban.css');
  assert.ok(/^\.swimlane \{\n  background: var\(--jalor-bg-contrast\);\n\}/m.test(kanban),
    'so the Jalor default is a plain declaration, and loses to them');
});

console.log(`\njalorTheme: ${passed} tests passed`);
