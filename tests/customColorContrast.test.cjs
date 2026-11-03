'use strict';

// A color a member chooses freely (a color wheel) is one half of a pair: text on a
// background, a header under white text, a line over the board. The other half has
// to be worked out, so that the pair is legible whatever was chosen - WCAG 1.4.3,
// 4.5:1 for text, and 1.4.11, 3:1 for a graphic. Where the chosen color IS the
// text or the graphic, it is the chosen color that is moved, by the smallest step
// that reaches the ratio, keeping its hue; where it is the background, the text is
// derived (contrastText).
//
// Run: node tests/customColorContrast.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

const hexOf = (r, g, b) => `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
function* colors(step) {
  for (let r = 0; r < 256; r += step) for (let g = 0; g < 256; g += step) for (let b = 0; b < 256; b += step) yield hexOf(r, g, b);
}

(async () => {
  const c = await import('../models/lib/contrastColor.js');
  const accents = await import('../models/lib/themeAccents.js');
  const fonts = await import('../models/lib/uiFonts.js');

  await test('contrastRatio is the WCAG ratio, symmetric, 21 for black on white', async () => {
    assert.equal(c.contrastRatio('#000000', '#ffffff'), 21);
    assert.equal(c.contrastRatio('#ffffff', '#000000'), 21);
    assert.equal(c.contrastRatio('#777777', '#777777'), 1);
    assert.equal(c.contrastRatio('nothex', '#ffffff'), null);
    assert.ok(Math.abs(c.contrastRatio('#767676', '#ffffff') - 4.54) < 0.01, 'the well-known #767676 on white');
  });

  await test('a custom label, card, list or swimlane color: its text is never below 4.5:1, on any color and any named color', async () => {
    let below = 0;
    for (const hex of colors(15)) if (c.contrastRatio(hex, c.contrastText(hex)) < 4.5) below += 1;
    assert.equal(below, 0, 'every sampled color');
    for (const [name, hex] of Object.entries(c.NAMED_COLOR_HEX)) {
      assert.ok(c.contrastRatio(hex, c.contrastText(name)) >= 4.5, name);
    }
  });

  await test('ensureContrast moves the chosen color just enough, and leaves a legible one alone', async () => {
    for (const background of [['#ffffff'], ['#dedede', '#f7f7f7', '#ffffff'], ['#23232b', '#2b2b2b'], ['#ffffff', '#f2f2f2']]) {
      for (const hex of colors(51)) {
        const out = c.ensureContrast(hex, background, 4.5);
        const worst = Math.min(...background.map(b => c.contrastRatio(out, b)));
        assert.ok(worst >= 4.5, `${hex} on ${background} -> ${out} (${worst.toFixed(2)})`);
        if (Math.min(...background.map(b => c.contrastRatio(hex, b))) >= 4.5) assert.equal(out, hex, `${hex} already reads and is not touched`);
        assert.equal(c.ensureContrast(out, background, 4.5), out, 'idempotent');
      }
    }
    assert.equal(c.ensureContrast('#ABCDEF', ['#000000'], 4.5), '#abcdef'.toLowerCase(), 'normalized, unchanged');
  });

  await test('ensureContrast keeps the hue: a yellow stays yellow, a blue stays blue', async () => {
    const hue = hex => {
      const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
      return Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b);
    };
    for (const hex of ['#ffff00', '#00aaff', '#ff3366', '#33cc66']) {
      const out = c.ensureContrast(hex, ['#ffffff'], 4.5);
      assert.ok(Math.abs(hue(out) - hue(hex)) < 0.15, `${hex} -> ${out}`);
    }
  });

  await test('negative: input that is not a color is passed through, and an impossible pair falls back to the better of black and white', async () => {
    assert.equal(c.ensureContrast('nothex', ['#ffffff']), 'nothex');
    assert.equal(c.ensureContrast(undefined, ['#ffffff']), '');
    assert.equal(c.ensureContrast('#777777', []), '#777777');
    // a light and a dark surface at once: no color reads on both
    const both = c.ensureContrast('#777777', ['#ffffff', '#000000'], 4.5);
    assert.ok(['#000000', '#ffffff'].includes(both), both);
  });

  await test('a custom theme accent is darkened until the header\'s white text and #f2f2f2 labels read', async () => {
    for (const hex of colors(51)) {
      const accent = accents.activeAccent('belize', [hex]);
      assert.ok(c.contrastRatio('#ffffff', accent) >= 4.5 && c.contrastRatio('#f2f2f2', accent) >= 4.5, `${hex} -> ${accent}`);
    }
    // both ends of a custom slide
    const fill = accents.activeFill('clearblue', ['#ffff00', '#00ffff']);
    const stops = [...fill.matchAll(/#[0-9a-f]{6}/g)].map(m => m[0]);
    assert.equal(stops.length, 2);
    for (const stop of stops) assert.ok(c.contrastRatio('#ffffff', stop) >= 4.5, stop);
    assert.equal(accents.activeFill('belize', ['#ffff00']), c.readableAccent('#ffff00'));
  });

  await test('negative: a theme with no custom color keeps its own accent and slide, untouched', async () => {
    assert.equal(accents.activeAccent('belize', []), accents.THEME_ACCENTS.belize);
    assert.equal(accents.activeAccent('belize', undefined), accents.THEME_ACCENTS.belize);
    const [top, bottom] = accents.THEME_SLIDES.clearblue;
    assert.equal(accents.activeFill('clearblue', []), `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`);
  });

  await test('the text color a member picks is made legible on the surface of the theme in use', async () => {
    for (const hex of colors(51)) {
      const onLight = fonts.readableUiTextColor(hex, 'belize');
      for (const surface of fonts.surfacesFor('belize')) assert.ok(c.contrastRatio(onLight, surface) >= 4.5, `${hex} -> ${onLight} on ${surface}`);
      for (const theme of fonts.DARK_SURFACE_THEMES) {
        const onDark = fonts.readableUiTextColor(hex, theme);
        for (const surface of fonts.surfacesFor(theme)) assert.ok(c.contrastRatio(onDark, surface) >= 4.5, `${hex} -> ${onDark} on ${surface} (${theme})`);
      }
    }
    assert.equal(fonts.readableUiTextColor('#111111', 'belize'), '#111111', 'a legible color is applied as chosen');
    assert.notEqual(fonts.readableUiTextColor('#111111', 'cleandark'), '#111111', 'dark on a dark theme is lightened');
  });

  await test('negative: no text color, or something that is not a hex, applies nothing', async () => {
    for (const bad of [undefined, null, '', 'red', '#12', 'javascript:alert(1)', '#gggggg', '#12345678']) {
      assert.equal(fonts.readableUiTextColor(bad, 'belize'), '', String(bad));
    }
  });

  await test('anywhere in the tree: a custom background is never drawn without its derived text color', async () => {
    // Every template string that paints a background from a variable names its text
    // color from contrastText on the same line (or is a fixed palette, below).
    const offenders = [];
    const walk = dir => fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true }).forEach(entry => {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return entry.name === 'tests' || entry.name === 'node_modules' ? null : walk(rel);
      if (!entry.name.endsWith('.js')) return null;
      read(rel).split('\n').forEach((line, i) => {
        if (/background(-color)?:\s*\$\{/.test(line) && !/contrastText|SCROLLBAR|kanriTagText/.test(line)
            && !/themeColorPicker|avatarColor/.test(rel)) offenders.push(`${rel}:${i + 1}`);
      });
      return null;
    });
    for (const dir of ['client', 'models', 'server', 'imports']) walk(dir);
    assert.deepEqual(offenders, []);
    // the two that carry another proof
    assert.match(read('client/components/main/themeColorPicker.js'), /readableAccent\(c\)/, 'the theme picker previews the readable colors');
    assert.match(read('models/lib/avatarColor.js'), /contrast at least 4\.5:1/);
    assert.match(read('models/lib/kanriFormat.js'), /kanriTagText\(hex\)/);
  });

  await test('the colors are wired: the theme sets the readable accent and slide end, the text color and the dependency line are made legible', async () => {
    const theme = read('client/components/main/globalThemeColor.js');
    assert.match(theme, /setProperty\('--theme-accent-2', readableAccent\(c2\)\)/);
    assert.match(theme, /const accent = activeAccent\(color, custom\)/);
    assert.match(read('client/components/main/uiFont.js'), /readableUiTextColor\(profile\.uiTextColor, activeThemeName\(\)\)/);
    assert.doesNotMatch(read('client/components/main/uiFont.js'), /colorValue\(profile\.uiTextColor\)/, 'no unadjusted text color');
    const overlay = read('client/components/boards/dependencyOverlay.js');
    assert.match(overlay, /ensureContrast\(dep\.color, surfacesFor\(activeThemeName\(\)\), 3\)/);
    assert.match(read('client/components/users/userHeader.jade'), /if textColorAdjusted/);
    // the text color of a member does not reach elements that sit on a color of their own
    const css = read('client/components/main/uiFont.css');
    assert.match(css, /\*:not\(\.fa\):not\(\s*#header, #header \*,\s*#header-quick-access, #header-quick-access \*,\s*\.card-label, \.card-label \*,\s*button\.primary, button\.primary \*\s*\)/);
    assert.match(read('client/components/main/themeColorPicker.jade'), /if customAdjusted/);
  });

  console.log(`customColorContrast: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
