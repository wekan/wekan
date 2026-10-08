'use strict';
(async () => {

// Multi-Selection offers the same custom card color as one card's popup.
//
// Reported by email: in Multi-Selection only the ready-made palette could be
// picked, so a lighter yellow chosen for one card (to keep its text readable)
// could not be put on several cards at once. One card already had a color
// wheel (#5514) storing a '#rrggbb' hex in card.color; Multi-Selection now
// offers that same wheel, writes the same field through the same
// Card.setColor, and both popups offer the custom colors already used on the
// board beside the palette.
//
// Positive: the helpers accept palette names and strict hex, list the board's
// custom colors, and both popups are wired to them.
// Negative: a crafted color ('red;background:url(...)', '</style>',
// 'javascript:...') is refused by the one rule the server schema enforces, is
// never offered as a swatch, and no template writes a card color into a style
// attribute without the hex check.
//
// Run: node tests/multiSelectionCustomColor.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const { isAllowedCardColor, customColorsInUse, isHexColor } =
  await import('../models/lib/contrastColor.js');

const NAMED = ['white', 'green', 'yellow', 'red', 'navy'];

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const MALICIOUS = [
  'red;background:url(https://evil.example/x.png)',
  '#fff3b0;background:url(x)',
  '</style><script>alert(1)</script>',
  'javascript:alert(1)',
  'expression(alert(1))',
  'rgb(255,0,0)',
  '#fff',          // shorthand is not a stored form
  '#ggggggg',
  '#fff3b0 ',
  ' #fff3b0',
  '#fff3b0\n',
  'yellow; color:red',
  '"><img src=x onerror=alert(1)>',
  'url(x)',
];

// --- positive ---------------------------------------------------------------
test('empty, palette names and strict #rrggbb are allowed card colors', () => {
  for (const v of [undefined, null, '', 'yellow', 'navy', '#fff3b0', '#FFF3B0', '#000000']) {
    assert.strictEqual(isAllowedCardColor(v, NAMED), true, String(v));
  }
});

test('custom colors in use: hex only, lower-cased, de-duplicated, most used first', () => {
  const colors = ['yellow', '#FFF3B0', '#c8e6c9', '#fff3b0', null, '#c8e6c9', '#c8e6c9', 'red'];
  assert.deepStrictEqual(customColorsInUse(colors), ['#c8e6c9', '#fff3b0']);
});

test('custom colors in use: ties keep first-seen order and the list is capped', () => {
  const colors = ['#000001', '#000002', '#000003', '#000002', '#000001'];
  assert.deepStrictEqual(customColorsInUse(colors), ['#000001', '#000002', '#000003']);
  assert.deepStrictEqual(customColorsInUse(colors, 2), ['#000001', '#000002']);
  assert.deepStrictEqual(customColorsInUse(undefined), []);
});

test('the Cards schema validates color with the shared rule (server-side)', () => {
  const cards = read('models/cards.js');
  const schemaColor = cards.match(/\n {4}color: \{[\s\S]*?\n {4}\},/);
  assert.ok(schemaColor, 'card color schema entry found');
  assert.ok(/isAllowedCardColor\(this\.value, CARD_COLORS\)/.test(schemaColor[0]));
  assert.ok(/return 'notAllowed'/.test(schemaColor[0]));
});

test('Multi-Selection popup has the color wheel and the board custom colors', () => {
  const jade = read('client/components/sidebar/sidebarFilters.jade');
  const popup = jade.split('template(name="setSelectionColorPopup")')[1].split('\ntemplate(')[0];
  assert.ok(/input\.js-selection-color-wheel#selectionColorWheel\(type="color"/.test(popup));
  assert.ok(/\+customCardColorSwatches\(colors=customColors selected=selectedColor\)/.test(popup));
  const single = read('client/components/cards/cardDetails.jade')
    .split('template(name="setCardColorPopup")')[1].split('\ntemplate(')[0];
  assert.ok(/\+customCardColorSwatches\(colors=customColors selected=selectedColor\)/.test(single));
  assert.ok(/js-card-color-wheel/.test(single), 'one card keeps its own wheel');
});

test('Multi-Selection writes through Card.setColor, only to cards the user may edit', () => {
  const js = read('client/components/cards/cardDetails.js');
  const fn = js.match(/async function setColorOfSelectedCards\(color\) \{[\s\S]*?\n\}/);
  assert.ok(fn, 'setColorOfSelectedCards exists');
  assert.ok(/MultiSelection\.getMongoSelector\(\)/.test(fn[0]));
  assert.ok(/if \(!Utils\.canModifyCard\(card\)\) continue;/.test(fn[0]));
  assert.ok(/await card\.setColor\(color\)/.test(fn[0]));
  // One refusal must not stop the rest of the selection.
  assert.ok(/try \{\s*await card\.setColor\(color\);\s*\} catch/.test(fn[0]));
  const events = js.split('Template.setSelectionColorPopup.events({')[1].split('\n});')[0];
  assert.ok(/'input \.js-selection-color-wheel, change \.js-selection-color-wheel'/.test(events));
  assert.ok(/if \(isHexColor\(value\)\) tpl\.currentColor\.set/.test(events));
  assert.ok(/if \(!isAllowedCardColor\(color, ALLOWED_COLORS\)\) return;/.test(events));
  assert.ok(/setColorOfSelectedCards\(color\)/.test(events));
  assert.ok(/setColorOfSelectedCards\(null\)/.test(events));
  // No second color model: the old direct per-card loop is gone.
  assert.ok(!/for \(const card of ReactiveCache\.getCards\(MultiSelection\.getMongoSelector\(\)\)\) \{\s*await card\.setColor/.test(js));
});

test('Card.setColor is still the one writer of card.color', () => {
  const cards = read('models/cards.js');
  assert.ok(/setColor\(newColor\) \{[\s\S]*?Cards\.updateAsync\(this\.getRealId\(\), \{ \$set: \{ color: newColor \} \}\)/.test(cards));
});

// --- negative ---------------------------------------------------------------
test('crafted colors are refused by the schema rule', () => {
  for (const v of MALICIOUS) {
    assert.strictEqual(isAllowedCardColor(v, NAMED), false, JSON.stringify(v));
  }
  for (const v of [42, {}, [], ['#fff3b0'], true]) {
    assert.strictEqual(isAllowedCardColor(v, NAMED), false, JSON.stringify(v));
  }
});

test('crafted colors stored by older data are never offered as swatches', () => {
  assert.deepStrictEqual(customColorsInUse(MALICIOUS), []);
  assert.deepStrictEqual(customColorsInUse([...MALICIOUS, '#fff3b0']), ['#fff3b0']);
});

test('swatch clicks accept only a strict hex from data-color', () => {
  const js = read('client/components/cards/cardDetails.js');
  const handlers = js.match(/'click \.js-custom-palette-color'\(event, tpl\) \{[\s\S]*?\n {2}\},/g) || [];
  assert.strictEqual(handlers.length, 2, 'one handler per popup');
  for (const h of handlers) assert.ok(/if \(isHexColor\(value\)\) tpl\.currentColor\.set\(value\)/.test(h));
});

test('a card color reaches an inline style only after the hex check', () => {
  const cards = read('models/cards.js');
  const colorStyle = cards.match(/\n {2}colorStyle\(\) \{[\s\S]*?\n {2}\},/);
  assert.ok(colorStyle);
  // #4756: the colour is the card's own or its list's (displayColor), still
  // only through the hex check.
  assert.ok(/const color = this\.displayColor\(\);\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*if \(isHexColor\(color\)\) \{\s*return `background-color:\$\{color\}/.test(colorStyle[0]));
  // The swatch template writes only values from customColorsInUse (hex only).
  const jade = read('client/components/cards/cardDetails.jade');
  const swatches = jade.split('template(name="customCardColorSwatches")')[1].split('\ntemplate(')[0];
  assert.ok(/each hex in colors/.test(swatches));
  assert.ok(!/!=|\{\{\{/.test(swatches), 'no unescaped output in the swatch template');
  const js = read('client/components/cards/cardDetails.js');
  assert.ok(/return customColorsInUse\(cards\.map\(card => card\.color\)\);/.test(js));
});

test('isHexColor itself still refuses every crafted value', () => {
  for (const v of MALICIOUS) assert.strictEqual(isHexColor(v), false, JSON.stringify(v));
});

test('no new interface string: the swatches reuse the existing custom-color text', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  const swatches = jade.split('template(name="customCardColorSwatches")')[1].split('\ntemplate(')[0];
  assert.ok(/aria-label="\{\{_ 'custom-color'\}\}"/.test(swatches));
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['custom-color'], 'Custom color');
});

console.log(`\nmultiSelectionCustomColor: ${passed} tests passed`);

})().catch(error => { console.error(error); process.exit(1); });
