'use strict';
// The pure module is an ES module (every app file is one in Meteor), so it is loaded
// with a dynamic import - the same way tests/cardUrl.test.cjs loads its module.
(async () => {

// Every named theme publishes its own accent colour (docs/Design/Page/Theme.md).
//
// The chrome outside a board - the Admin Panel's selected left-menu row, its
// buttons, every Save button, the table-page controls - reads ONE CSS variable,
// `--theme-accent`. It used to be set only for a CUSTOM colour, so choosing a named
// theme recoloured the header (which has a `.board-color-<name>#header` rule) and
// left everything else on the stock blue fallback. models/lib/themeAccents.js closes
// that gap, and these tests keep it honest: the map must MIRROR boardColors.css, and
// it must cover every allowed board colour.
//
// Run: node tests/themeAccents.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { THEME_ACCENTS, accentOf, activeAccent } = await import('../models/lib/themeAccents.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('themeAccents:');

// The theme names WeKan allows, and the header colour each one paints, read out of
// the stylesheet that actually paints it.
function allowedColors() {
  const src = read('config/const.js');
  const block = /ALLOWED_BOARD_COLORS\s*=\s*\[(.*?)\]/s.exec(src);
  assert.ok(block, 'ALLOWED_BOARD_COLORS must be findable in config/const.js');
  return [...block[1].matchAll(/'([\w-]+)'/g)].map(m => m[1]);
}

function headerColorsFromCss() {
  const css = read('client/components/boards/boardColors.css');
  const out = {};
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const [, selector, body] = rule;
    if (!selector.includes('#header')) continue;
    const decl = /background(?:-color)?:\s*([^;!}]+)/.exec(body);
    if (!decl) continue;
    // `#header` EXACTLY - not `#header-quick-access`, and not
    // `#header-main-bar`. The accent is what the main bar's background is, and
    // the quick-access bar now shares that selector list, so a loose match
    // picked up whichever themed `#header-…` rule came first (its `ul
    // li.current` border, say) and called that the accent.
    for (const m of selector.matchAll(/\.board-color-([\w-]+)#header(?![-\w])/g)) {
      if (out[m[1]] === undefined) out[m[1]] = decl[1].trim();
    }
  }
  return out;
}

test('every allowed board colour has an accent', () => {
  // A theme added to config/const.js and to the CSS but not here would silently
  // fall back to the stock blue everywhere the variable is read.
  const missing = allowedColors().filter(name => !THEME_ACCENTS[name]);
  assert.deepStrictEqual(missing, [], 'themes with no accent');
});

test('each accent is exactly what the stylesheet paints the header with', () => {
  const css = headerColorsFromCss();
  for (const [name, accent] of Object.entries(THEME_ACCENTS)) {
    assert.strictEqual(accent, css[name],
      `${name}: the map and boardColors.css must agree`);
  }
});

test('the map holds no theme that does not exist', () => {
  const allowed = new Set(allowedColors());
  const extra = Object.keys(THEME_ACCENTS).filter(name => !allowed.has(name));
  assert.deepStrictEqual(extra, [], 'accents for themes that are not allowed colours');
});

test('accentOf answers for a known theme and refuses anything else', () => {
  assert.strictEqual(accentOf('pumpkin'), '#e67e22');
  assert.strictEqual(accentOf('belize'), '#2980b9');
  assert.strictEqual(accentOf('no-such-theme'), '');
  assert.strictEqual(accentOf(''), '');
  assert.strictEqual(accentOf(null), '');
  assert.strictEqual(accentOf(undefined), '');
  assert.strictEqual(accentOf(42), '');
  // A prototype property must not answer as if it were a theme.
  assert.strictEqual(accentOf('constructor'), '');
});

test('a custom colour always wins over the theme it sits on', () => {
  assert.strictEqual(activeAccent('pumpkin', ['#112233']), '#112233');
  assert.strictEqual(activeAccent('pumpkin', ['#112233', '#445566']), '#112233');
  // …and an empty/absent custom set falls back to the theme.
  assert.strictEqual(activeAccent('pumpkin', []), '#e67e22');
  assert.strictEqual(activeAccent('pumpkin', null), '#e67e22');
  assert.strictEqual(activeAccent('pumpkin', ['']), '#e67e22');
  assert.strictEqual(activeAccent('pumpkin', undefined), '#e67e22');
  // No theme at all: nothing to publish, so the stylesheets keep their fallbacks.
  assert.strictEqual(activeAccent(null, []), '');
  assert.strictEqual(activeAccent(undefined, undefined), '');
});

test('the variable is set for EVERY theme, and the custom classes stay custom-only', () => {
  const js = read('client/components/main/globalThemeColor.js');
  assert.ok(/const accent = activeAccent\(color, custom\)/.test(js),
    'the accent comes from the shared map');
  assert.ok(/root\.style\.setProperty\('--theme-accent', accent\)/.test(js),
    'and is published as the variable the chrome reads');
  // The has-custom-theme-* classes let customTheme.css override a named theme's own
  // header rule with !important. A named theme must not do that to itself.
  const block = js.slice(js.indexOf('function applyCustom'), js.indexOf('Tracker.autorun'));
  assert.ok(/if \(c1\) \{\s*\n\s*document\.body\.classList\.add\('has-custom-theme-color'\)/.test(block),
    'the custom class is still gated on a custom colour, not on the accent');
  // Every caller passes the theme it just applied, or the accent would be stale.
  // (?<!function ) so the definition's own parameter list is not counted as a call.
  const calls = [...js.matchAll(/(?<!function )applyCustom\(([\s\S]*?)\);/g)].map(m => m[1]);
  assert.strictEqual(calls.length, 3, 'three callers: the user override, the site, a board');
  assert.ok(calls.some(a => /globalColor\s*$/.test(a.trim())), 'the user override passes its theme');
  assert.ok(calls.some(a => /siteColor\s*$/.test(a.trim())), 'the site theme passes its theme');
  assert.ok(calls.some(a => /board && board\.color\s*$/.test(a.trim())), 'a board passes its own colour');
});

test('the Admin Panel chrome reads that variable rather than a hard-coded colour', () => {
  // This is what the accent is FOR: the selected left-menu row and the buttons.
  const menuCss = read('client/components/settings/settingBody.css');
  assert.ok(/side-menu ul li\.active,[\s\S]*?background: var\(--theme-accent/.test(menuCss),
    'the selected left-menu entry, when no theme is active');
  // With a theme active the row is painted by that theme's OWN header rule, so the
  // selected row matches the second header bar exactly - including a gradient, which
  // a single accent colour cannot express.
  const themeCss = read('client/components/boards/boardColors.css');
  const themed = [...themeCss.matchAll(/\.board-color-([\w-]+) \.setting-content \.content-body \.side-menu ul li\.active\b/g)]
    .map(m => m[1]);
  const allowed = [...(/ALLOWED_BOARD_COLORS\s*=\s*\[(.*?)\]/s.exec(read('config/const.js'))[1])
    .matchAll(/'([\w-]+)'/g)].map(m => m[1]);
  for (const name of allowed) {
    assert.ok(themed.includes(name), `${name}: its header rule must paint the selected row too`);
  }
  // …and it is the header rule that does it, never a copy of the colour.
  const clean = themeCss.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const rule of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/side-menu ul li\.active/.test(rule[1])) continue;
    assert.ok(/#header/.test(rule[1]),
      'the selected row is only ever added to a rule that also paints the header');
  }
  assert.ok(/\.setting-detail button\.btn \{[\s\S]*?background: var\(--theme-accent/.test(menuCss),
    'the pane buttons');
  const formsCss = read('client/components/forms/forms.css');
  assert.ok(/button\.primary \{\s*\n\s*background: var\(--theme-accent/.test(formsCss),
    'and every primary/Save button');
});

test('the FIRST header bar carries each theme, and the theme it should', () => {
  // The theme used to be on the second bar; that bar is gone from most pages,
  // so `#header-quick-access` is what a reader actually sees painted.
  const css = read('client/components/boards/boardColors.css');

  // The LAST background wins, as the cascade does.
  const firstBar = {};
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = rule[2].replace(/\/\*[\s\S]*?\*\//g, '');
    const bg = /(?:^|[\s;])background(?:-color)?:\s*([^;]+)/.exec(body);
    if (!bg) continue;
    for (const sel of rule[1].split(',').map(x => x.trim())) {
      const m = /^\.board-color-([\w-]+)#header-quick-access$/.exec(sel);
      if (m) firstBar[m[1]] = bg[1].trim();
    }
  }

  // cleanlight's accent is a mid-grey read out of a `#header ul li:hover` rule,
  // not a bar colour: it has no plain `#header` rule at all, and its bar is
  // near-white, which cannot be an accent for white text. Recorded here rather
  // than "fixed" by changing a colour nobody asked to change.
  const KNOWN_ACCENT_IS_NOT_THE_BAR = new Set(['cleanlight']);

  for (const [theme, accent] of Object.entries(THEME_ACCENTS)) {
    const bar = firstBar[theme];
    assert.ok(bar, `${theme} must paint the first header bar`);
    if (KNOWN_ACCENT_IS_NOT_THE_BAR.has(theme)) continue;
    // Natural and Modern each had a LATER rule repainting this bar the shade it
    // wore as a thin strip above the coloured main bar - so picking Natural
    // painted the header near-black and Modern charcoal, whatever their own
    // colours were.
    assert.ok(bar === accent || bar.includes(accent),
      `${theme}: the first bar is ${bar}, but the theme's colour is ${accent}`);
  }

  // ...and no two themes paint it the same, which is how picking clearblue came
  // to look exactly like strongcyan.
  const byColour = {};
  for (const [theme, bar] of Object.entries(firstBar)) {
    (byColour[bar] = byColour[bar] || []).push(theme);
  }
  for (const [colour, themes] of Object.entries(byColour)) {
    assert.strictEqual(themes.length, 1,
      `${themes.join(' and ')} both paint the first bar ${colour} - one is wrong`);
  }
});

test('and clearblue keeps its colour SLIDE on the bar you can see', () => {
  // Its bar is a gradient, and the gradient was only ever on
  // `#header #header-main-bar` - the inner element of the second bar - because
  // that is where the theme lived. The first bar got the flat #00aecc from the
  // rule beside it, which is strongcyan's colour exactly: choosing clearblue
  // painted the header strongcyan.
  const css = read('client/components/boards/boardColors.css');
  // Found by its DECLARATION, not by a selector prefix: the flat rule and the
  // gradient rule share their first two selector lines, so an `indexOf` on
  // those matched the flat one and the guard passed while reading the wrong
  // rule entirely.
  const SLIDE = 'linear-gradient(180deg, #499bea 0%, #00aecc 100%)';
  let gradientRule = null;
  let gradientAt = -1;
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!rule[2].includes(SLIDE)) continue;
    const sels = rule[1].split(',').map(x => x.trim());
    if (!sels.includes('.board-color-clearblue#header-quick-access')) continue;
    gradientRule = rule;
    gradientAt = rule.index;
  }
  assert.ok(gradientRule, 'the first bar must be in clearblue\'s gradient rule');

  // The All Boards left menu's selected row too. Every other theme paints that
  // row through --theme-accent, which is ONE COLOUR and right for them; a slide
  // is not a colour, so the variable cannot carry it and clearblue's row came
  // out flat while the Admin Panel's row beside it slid.
  const sels = gradientRule[1].split(',').map(x => x.trim());
  for (const sel of [
    '.board-color-clearblue .setting-content .content-body .side-menu ul li.active',
    '.board-color-clearblue .boards-left-menu .menu-item.active a',
  ]) {
    assert.ok(sels.includes(sel), `${sel} must slide too, not sit flat beside a bar that slides`);
  }

  // The flat colour must be declared FIRST, or the shorthand would lose to it.
  assert.ok(css.indexOf('.board-color-clearblue#header,') < gradientAt,
    'the flat background comes before the gradient that replaces it');

  // Its text is full white. Half-white was right when this bar was a thin
  // secondary strip; it is the header now, and no other theme dims these.
  const dimAt = css.indexOf('.board-color-clearblue#header-quick-access #header-user-bar,');
  assert.notStrictEqual(dimAt, -1);
  const dim = css.slice(dimAt, css.indexOf('}', dimAt));
  assert.ok(/color:\s*#fff/.test(dim), 'the username is white, not half-white');
  assert.ok(!/rgba\(255,\s*255,\s*255,\s*0\.5\)/.test(dim), 'not dimmed');
});

console.log(`\n${passed} tests passed`);

})();
