'use strict';

// Tests for the UI font whitelist (models/lib/uiFonts.js, #4759): the safe-name
// pattern (the security boundary — no CSS/markup injection), the whitelist gate, and
// the font-family value builder. Includes negative cases with hostile input.
//
// Run: node tests/uiFonts.test.cjs

const assert = require('assert');
const {
  UI_FONTS,
  isSafeFontName,
  isKnownFont,
  fontFamilyValue,
  UI_FONT_SIZE_KEYS,
  isKnownFontSize,
  fontSizeValue,
  isHexColor6,
  colorValue,
  fontScaleValue,
} = require('../models/lib/uiFonts.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('every curated font passes the safe-name pattern', () => {
  UI_FONTS.forEach(f => assert.ok(isSafeFontName(f), `unsafe curated font: ${f}`));
  assert.ok(UI_FONTS.length > 10);
});

test('isSafeFontName rejects anything that could break out of font-family / inject', () => {
  // negatives — the whole point of the feature
  assert.strictEqual(isSafeFontName('Arial; }'), false);      // css break-out
  assert.strictEqual(isSafeFontName('Arial", url(x)'), false); // quote + url
  assert.strictEqual(isSafeFontName('<b>Arial</b>'), false);   // html
  assert.strictEqual(isSafeFontName('**Arial**'), false);      // markdown
  assert.strictEqual(isSafeFontName('Arial{color:red}'), false);
  assert.strictEqual(isSafeFontName(' Arial'), false);         // leading space
  assert.strictEqual(isSafeFontName(''), false);
  assert.strictEqual(isSafeFontName(null), false);
  assert.strictEqual(isSafeFontName(42), false);
  assert.strictEqual(isSafeFontName('a'.repeat(60)), false);   // too long
  // positives
  assert.strictEqual(isSafeFontName('Arial'), true);
  assert.strictEqual(isSafeFontName('Times New Roman'), true);
  assert.strictEqual(isSafeFontName('DejaVu Sans'), true);
});

test('isKnownFont only accepts whitelist members', () => {
  assert.strictEqual(isKnownFont('Arial'), true);
  assert.strictEqual(isKnownFont('Comic Sans MS'), true);
  assert.strictEqual(isKnownFont('Arial; }'), false);   // negative
  assert.strictEqual(isKnownFont('MyEvilFont'), false); // negative (safe-looking but not curated)
  assert.strictEqual(isKnownFont(''), false);
  assert.strictEqual(isKnownFont(undefined), false);
});

test('fontFamilyValue quotes known fonts and rejects unknown', () => {
  assert.strictEqual(fontFamilyValue('Arial'), '"Arial", sans-serif');
  assert.strictEqual(fontFamilyValue('Times New Roman'), '"Times New Roman", sans-serif');
  assert.strictEqual(fontFamilyValue('Arial; }'), ''); // negative -> nothing applied
  assert.strictEqual(fontFamilyValue('Unknown'), '');
  assert.strictEqual(fontFamilyValue(''), '');
  assert.strictEqual(fontFamilyValue(null), '');
});

test('font sizes: named presets only, default/unknown apply nothing', () => {
  assert.ok(UI_FONT_SIZE_KEYS.includes('default') && UI_FONT_SIZE_KEYS.includes('large'));
  assert.strictEqual(isKnownFontSize('large'), true);
  assert.strictEqual(isKnownFontSize('default'), true);
  assert.strictEqual(isKnownFontSize('99px'), false); // negative: no free numbers
  assert.strictEqual(isKnownFontSize('huge'), false); // negative
  assert.strictEqual(isKnownFontSize(''), false);
  // fontSizeValue: default/unknown -> '' (nothing applied); presets -> a percentage
  assert.strictEqual(fontSizeValue('default'), '');
  assert.strictEqual(fontSizeValue('nope'), '');
  assert.ok(/^\d+%$/.test(fontSizeValue('large')), 'preset -> percentage');
  assert.ok(/^\d+%$/.test(fontSizeValue('smaller')));
});

test('text/bg colors: strict #rrggbb only, else nothing applied', () => {
  assert.strictEqual(isHexColor6('#0a1b2c'), true);
  assert.strictEqual(isHexColor6('#fff'), false);        // short
  assert.strictEqual(isHexColor6('red'), false);         // name
  assert.strictEqual(isHexColor6('#0a1b2c; }'), false);  // css break-out
  assert.strictEqual(isHexColor6(''), false);
  assert.strictEqual(isHexColor6(null), false);
  assert.strictEqual(colorValue('#0a1b2c'), '#0a1b2c');
  assert.strictEqual(colorValue('nope'), ''); // negative -> nothing applied
  assert.strictEqual(colorValue(null), '');
});

// --- source guards: the feature is wired end-to-end ---
const fs = require('fs');
const path = require('path');
const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

test('user model + server method: schema, getter, validated setter, unset', () => {
  const m = read('models/users.js');
  assert.ok(/'profile\.uiFont'/.test(m) && /getUiFont\(\)/.test(m), 'schema + getter');
  const s = read('server/models/users.js');
  const i = s.indexOf('setUiFont(font)');
  assert.ok(i !== -1, 'server method');
  const body = s.slice(i, i + 600);
  assert.ok(/not-logged-in/.test(body), 'requires login');
  // NEGATIVE guard: only whitelisted fonts are stored.
  assert.ok(/isKnownFont\(font\)/.test(body) && /invalid-font/.test(body), 'validates the font');
  assert.ok(/\$unset:\s*{\s*'profile\.uiFont'/.test(body), 'null/empty unsets the custom font');
});

test('member menu Font entry + font/size buttons that apply immediately', () => {
  const jade = read('client/components/users/userHeader.jade');
  assert.ok(/js-change-font/.test(jade), 'menu entry');
  assert.ok(/template\(name="changeFontPopup"\)/.test(jade), 'popup');
  // A button per font (each styled in its own font via optionStyle) + a size-button row.
  assert.ok(/js-ui-font-btn\(data-font="\{\{name\}\}" style="\{\{optionStyle\}\}"/.test(jade), 'font-name buttons styled in their own font');
  assert.ok(/js-ui-font-btn\(data-font=""/.test(jade), 'a default (unset) font button');
  assert.ok(/js-ui-font-size-btn\(data-size="\{\{key\}\}"/.test(jade), 'font-size buttons');
  // NEGATIVE guard: no dropdowns and no Save button anymore.
  assert.ok(!/select\.js-ui-font/.test(jade) && !/js-ui-font-save/.test(jade), 'no dropdowns / Save button');
  const js = read('client/components/users/userHeader.js');
  assert.ok(/Popup\.open\('changeFont'\)/.test(js), 'opens the popup');
  assert.ok(/detectAvailableFonts\(\)/.test(js), 'lists only detected fonts');
  // Clicking applies immediately.
  assert.ok(/'click \.js-ui-font-btn'[\s\S]{0,220}Meteor\.call\('setUiFont', font/.test(js), 'font click applies immediately');
  assert.ok(/'click \.js-ui-font-size-btn'[\s\S]{0,220}Meteor\.call\('setUiFontSize', size/.test(js), 'size click applies immediately');
});

test('server setUiFontSize validates presets + supports unset', () => {
  const s = read('server/models/users.js');
  const i = s.indexOf('setUiFontSize(size)');
  assert.ok(i !== -1, 'server method');
  const body = s.slice(i, i + 900);
  assert.ok(/isKnownFontSize\(size\)/.test(body) && /invalid-font-size/.test(body), 'validates preset');
  assert.ok(/\$unset:\s*{\s*'profile\.uiFontSize'/.test(body), "default/null unsets size");
});

test('color schema custom() skips unset values (regression: user insert)', () => {
  // The optional-field custom() runs on EVERY user insert; without an unset guard,
  // /regex/.test(undefined) rejects every user with no color set (SyncedCron fatal
  // ValidationError). It must short-circuit when the value is absent.
  const users = read('models/users.js');
  const guards = users.match(/custom\(\)\s*{\s*\n\s*(?:\/\/[^\n]*\n\s*)*if \(this\.value === undefined \|\| this\.value === null \|\| this\.value === ''\) return undefined;/g) || [];
  assert.ok(guards.length >= 2, 'the colour validators guard the unset case');
});

test('text color: schema, wheel+reset, validated setter, applied as a CSS var', () => {
  const users = read('models/users.js');
  assert.ok(/'profile\.uiTextColor'/.test(users), 'schema field');
  assert.ok(/getUiTextColor\(\)/.test(users), 'getter');
  const jade = read('client/components/users/userHeader.jade');
  assert.ok(/js-ui-text-color\(type="color"/.test(jade), 'colour wheel');
  assert.ok(/js-reset-text-color/.test(jade), 'unset button');
  const js = read('client/components/users/userHeader.js');
  assert.ok(/Meteor\.call\('setUiColors', tpl\.textColor\.get\(\), null/.test(js), 'saves it');
  assert.ok(/textColor\.set\(null\)/.test(js), 'reset unsets');
  const s = read('server/models/users.js');
  const i = s.indexOf('setUiColors(textColor, bgColor)');
  assert.ok(i !== -1, 'server method');
  assert.ok(/isHexColor6\(textColor\)/.test(s.slice(i, i + 900)), 'validates hex');
  const jj = read('client/components/main/uiFont.js');
  assert.ok(/--wekan-ui-text-color/.test(jj), 'applies the colour var');
  const css = read('client/components/main/uiFont.css');
  assert.ok(/color: var\(--wekan-ui-text-color\)/.test(css), 'css consumes it');
});

test('"text background color" is gone, and a stored one is cleared (negative)', () => {
  // Removed on purpose: a colour behind the text needs elements to sit on, and
  // neither choice looked good - on the boxes it painted the whole window, on
  // the elements that carry text it striped headings and menu rows with bands.
  const css = read('client/components/main/uiFont.css');
  assert.ok(!/--wekan-ui-bg-color/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')),
    'no stylesheet rule paints it');
  const jj = read('client/components/main/uiFont.js');
  assert.ok(!/toggle\('--wekan-ui-bg-color'/.test(jj), 'nothing publishes the variable');
  assert.ok(!/uiTextBgColor/.test(jj.replace(/\/\/[^\n]*/g, '')), 'and nothing reads the profile field');
  const jade = read('client/components/users/userHeader.jade');
  assert.ok(!/js-ui-bg-color/.test(jade) && !/js-reset-bg-color/.test(jade),
    'the popup does not offer it');
  const js = read('client/components/users/userHeader.js');
  assert.ok(!/bgColor/.test(js.replace(/\/\/[^\n]*/g, '')), 'and the popup keeps no state for it');

  // A profile that HAS one is cleaned rather than left dormant: the setter
  // unsets the field on every call, whatever it is passed.
  const s = read('server/models/users.js');
  const i = s.indexOf('setUiColors(textColor, bgColor)');
  assert.ok(/\$unset\['profile\.uiTextBgColor'\] = '';/.test(s.slice(i, i + 900)),
    'the setter always unsets it');
  assert.ok(!/\$set\['profile\.uiTextBgColor'\]/.test(s), 'and never sets it');
  // The schema key stays: a modifier touching a key SimpleSchema does not know
  // is rejected, which would leave exactly those profiles uncleanable.
  const users = read('models/users.js');
  assert.ok(/'profile\.uiTextBgColor'/.test(users), 'the key is still declared');
  assert.ok(/REMOVED feature/.test(users), 'and says why it is only still declared');
  assert.ok(!/getUiTextBgColor\(\) \{/.test(users), 'with no getter left');
});

test('font detector uses the whitelist + canvas width comparison', () => {
  const d = read('client/lib/fontDetector.js');
  assert.ok(/from '\/models\/lib\/uiFonts'/.test(d), 'uses the curated whitelist');
  assert.ok(/measureText/.test(d), 'canvas width comparison');
});

test('font + size applied via CSS variables, gated by body classes, wired into build', () => {
  const j = read('client/components/main/uiFont.js');
  assert.ok(/setProperty\(varName/.test(j), 'sets a CSS variable');
  assert.ok(/toggle\('--wekan-ui-font'/.test(j) && /fontFamilyValue/.test(j), 'font variable + validated value');
  assert.ok(/toggle\('--wekan-ui-font-size'/.test(j) && /fontSizeValue/.test(j), 'size variable + validated value');
  assert.ok(/has-ui-font\b/.test(j) && /has-ui-font-size/.test(j), 'marker classes');
  const css = read('client/components/main/uiFont.css');
  assert.ok(/var\(--wekan-ui-font\)/.test(css) && /var\(--wekan-ui-font-size\)/.test(css), 'css consumes both variables');
  assert.ok(/uiFont\.js/.test(read('client/features/main.js')), 'js wired into build');
  assert.ok(/uiFont\.css/.test(read('client/styles.js')), 'css wired into build');
});

test('the size preset reaches text written in px, which is most of it', () => {
  // The preset was a PERCENTAGE on the root element, and a root percentage only
  // reaches text sized in a relative unit: `rem` is measured against the root,
  // `em` against its parent. WeKan writes most of its sizes in px, so the
  // setting moved the minicards and the page headings - the parts written in
  // rem - and left the header bar, the left menu, the lists and every popup
  // exactly as they were. Worse, `html, body, input, select, textarea, button`
  // re-stated `14px`, so the body took the stock size straight back.
  assert.strictEqual(fontScaleValue('largest'), '1.5', 'the preset as a number');
  assert.strictEqual(fontScaleValue('smaller'), '0.8');
  assert.strictEqual(fontScaleValue('default'), '', 'and nothing at all by default');
  assert.strictEqual(fontScaleValue('nonsense'), '', 'or for a value that is not a preset');

  const j = read('client/components/main/uiFont.js');
  assert.ok(/toggle\('--wekan-ui-font-scale', null, fontScaleValue/.test(j),
    'the variable is published from the same preset');

  const layouts = read('client/components/main/layouts.css');
  assert.ok(/font-size: calc\(14px \* var\(--wekan-ui-font-scale, 1\)\)/.test(layouts),
    'the base size follows it, instead of pinning the body back to 14px');
  assert.ok(!/font: 14px Roboto/.test(layouts),
    'and it is no longer inside the `font` shorthand, where nothing could move it');
});

test('every px text size in the client CSS scales with it (negative)', () => {
  // The point of the fix: not "the ones somebody remembered", all of them. A
  // bare `font-size: 14px` added later would be a line of text the setting
  // silently does not reach, so it fails here.
  const dir = path.join(repoRoot, 'client');
  const files = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.css')) files.push(full);
    }
  })(dir);
  assert.ok(files.length > 20, `expected the client stylesheets, found ${files.length}`);

  const bare = [];
  for (const file of files) {
    const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/(?<![-\w])(font-size|line-height)\s*:\s*(\d*\.?\d+)px/g)) {
      bare.push(`${path.relative(repoRoot, file)}: ${m[1]}: ${m[2]}px`);
    }
  }
  assert.deepStrictEqual(bare, [],
    'write it as calc(Npx * var(--wekan-ui-font-scale, 1)) so the preset moves it');
});

test('with no preset chosen, nothing renders differently (negative)', () => {
  // `var(--wekan-ui-font-scale, 1)` - the fallback is 1, and uiFont.js REMOVES
  // the variable for 'default', so an instance where nobody touched the setting
  // computes exactly the sizes it computed before.
  const css = read('client/components/main/layouts.css');
  assert.ok(/var\(--wekan-ui-font-scale, 1\)/.test(css), 'the fallback is 1');
  const j = read('client/components/main/uiFont.js');
  assert.ok(/removeProperty\(varName\)/.test(j), 'and an unset preset removes it');
});

test('the text colour reaches all text, not the text that had none of its own', () => {
  // Colour is inherited, so a colour on <body> only reached text with no colour
  // of its own - and WeKan gives most of its text one: the header bar's
  // buttons, the left menu's rows, a minicard's title, a list header. Choosing
  // green recoloured the heading and the menu and left the rest as it was.
  const css = read('client/components/main/uiFont.css');
  assert.ok(/body\.has-ui-text-color \*:not\(\.fa\) \{/.test(css),
    'every element takes it');
  const at = css.indexOf('body.has-ui-text-color,');
  assert.ok(/color: var\(--wekan-ui-text-color\) !important/.test(css.slice(at, css.indexOf('}', at))),
    'from the validated variable');
});

test('an icon keeps meaning what it means (negative)', () => {
  // `.fa` is a Font Awesome GLYPH, drawn with `color` because that is how an
  // icon font works - a red alert and a green tick are not text to recolour.
  // The icons that are meant to follow their label say `color: inherit` and
  // follow this anyway.
  const css = read('client/components/main/uiFont.css');
  assert.ok(/\*:not\(\.fa\)/.test(css), 'icons are excluded by class');
  const header = read('client/components/main/header.css');
  assert.ok(/#header-quick-access ul li \.fa,?[\s\S]{0,80}color: inherit/.test(header),
    'and the ones that follow their label still say so');
});

console.log(`\nAll ${passed} ui-font tests passed`);
