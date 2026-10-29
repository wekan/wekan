'use strict';

// Card Settings (Board Settings / Card) shows both sides at once, 2026-10-28:
// a Minicard pane first and a Card pane after it - side by side when the
// popup is wide enough, stacked otherwise - each collapsible from the caret
// at its top and scrolling on its own, with a splitter between them dragged
// like the edge between two spreadsheet columns. The splitter's arithmetic is
// pure (models/lib/cardSettingsSplit.js) and is run here; the layout is
// pinned by reading the template, the styles and the popup's geometry.
// Run: node tests/cardSettingsSplit.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const split = require('../models/lib/cardSettingsSplit');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('cardSettingsSplit:');

const TOTAL = 1000;
const MIN = 256; // 16em at 16px

test('half and half by default, and for anything that is not a number', () => {
  assert.strictEqual(split.DEFAULT_SPLIT, 0.5);
  for (const bad of [undefined, null, 'x', NaN, Infinity, {}]) {
    assert.strictEqual(split.clampSplit(bad, TOTAL, MIN), 0.5, String(bad));
  }
});

test('never below the minimum on either side', () => {
  assert.strictEqual(split.clampSplit(0, TOTAL, MIN), MIN / TOTAL, 'the Minicard pane at its minimum');
  assert.strictEqual(split.clampSplit(1, TOTAL, MIN), 1 - MIN / TOTAL, 'the Card pane at its minimum');
  assert.strictEqual(split.clampSplit(0.6, TOTAL, MIN), 0.6, 'inside the range, unchanged');
  // Negative: when two minimums do not fit, half and half - not a squeezed pane.
  assert.strictEqual(split.clampSplit(0.9, 400, MIN), 0.5);
  // Without a width there is nothing to clamp against but 0..1.
  assert.strictEqual(split.clampSplit(1.5, 0, MIN), 1);
  assert.strictEqual(split.clampSplit(-1, undefined, MIN), 0);
});

test('a drag moves the split by the pointer\'s share of the width', () => {
  assert.strictEqual(split.splitAfterDrag(0.5, 100, TOTAL, MIN, false), 0.6, 'right widens the Minicard pane');
  assert.strictEqual(split.splitAfterDrag(0.5, -100, TOTAL, MIN, false), 0.4);
  // Right to left the Minicard pane is on the right: moving right narrows it.
  assert.strictEqual(split.splitAfterDrag(0.5, 100, TOTAL, MIN, true), 0.4, 'RTL mirrors the delta');
  // Negative: dragged far, it stops at the minimum - on either side.
  assert.strictEqual(split.splitAfterDrag(0.5, 5000, TOTAL, MIN, false), 1 - MIN / TOTAL);
  assert.strictEqual(split.splitAfterDrag(0.5, -5000, TOTAL, MIN, false), MIN / TOTAL);
  assert.strictEqual(split.splitAfterDrag(0.5, 'x', TOTAL, MIN, false), 0.5, 'a missing delta moves nothing');
});

test('the keyboard: arrows a step the way they point, Home and End to the ends', () => {
  assert.strictEqual(split.KEY_STEP, 0.05);
  assert.strictEqual(split.splitAfterKey(0.5, 'ArrowRight', TOTAL, MIN, false), 0.55);
  assert.strictEqual(split.splitAfterKey(0.5, 'ArrowLeft', TOTAL, MIN, false), 0.45);
  assert.strictEqual(split.splitAfterKey(0.5, 'ArrowRight', TOTAL, MIN, true), 0.45, 'RTL: right narrows the Minicard pane');
  assert.strictEqual(split.splitAfterKey(0.5, 'ArrowLeft', TOTAL, MIN, true), 0.55);
  assert.strictEqual(split.splitAfterKey(0.5, 'Home', TOTAL, MIN, false), MIN / TOTAL);
  assert.strictEqual(split.splitAfterKey(0.5, 'End', TOTAL, MIN, false), 1 - MIN / TOTAL);
  // Negative: at a minimum a further step stays there; other keys do nothing.
  assert.strictEqual(split.splitAfterKey(1 - MIN / TOTAL, 'ArrowRight', TOTAL, MIN, false), 1 - MIN / TOTAL);
  assert.strictEqual(split.splitAfterKey(0.5, 'Enter', TOTAL, MIN, false), null);
  assert.strictEqual(split.splitAfterKey(0.5, 'ArrowUp', TOTAL, MIN, false), null);
});

test('what is stored is a rounded fraction, and the aria value a percent', () => {
  assert.strictEqual(split.normaliseSplit(0.123456), 0.123);
  assert.strictEqual(split.normaliseSplit(2), 1);
  assert.strictEqual(split.normaliseSplit(-1), 0);
  assert.strictEqual(split.normaliseSplit('0.5'), undefined, 'negative: a string is not stored');
  assert.strictEqual(split.splitPercent(0.555), 56);
  assert.strictEqual(split.splitPercent(undefined), 50);
});

test('the user\'s profile keeps it, through one setter', () => {
  const users = read('models/users.js');
  assert.match(users, /'profile\.cardSettingsSplit': \{[\s\S]{0,300}type: Number,\s*optional: true/);
  assert.match(users, /async setCardSettingsSplit\(fraction\) \{[\s\S]{0,400}normaliseSplit\(fraction\)[\s\S]{0,300}\$unset: \{ 'profile\.cardSettingsSplit': '' \}/);
  assert.match(users, /getCardSettingsSplit\(\) \{/);
});

// ── the two panes ──────────────────────────────────────────────────────────

const jade = read('client/components/sidebar/sidebar.jade');
const js = read('client/components/sidebar/sidebar.js');
const css = read('client/components/cards/cardAddFields.css');
const popupCss = read('client/components/main/popup.css');
const templateOf = name => jade.slice(jade.indexOf(`template(name="${name}")`)).split('\ntemplate(')[0];

test('two instances of ONE template, Minicard first, the splitter between them', () => {
  const popup = templateOf('boardCardSettingsPopup');
  assert.deepStrictEqual([...popup.matchAll(/\+cardSettingsInline\(side="(\w+)"\)/g)].map(m => m[1]), ['minicard', 'card']);
  const splitter = popup.slice(popup.indexOf('.card-settings-splitter'));
  assert.ok(popup.indexOf('.card-settings-splitter') > popup.indexOf('side="minicard"')
    && popup.indexOf('.card-settings-splitter') < popup.indexOf('side="card"'));
  assert.match(splitter, /role="separator" aria-orientation="vertical" tabindex="0"/);
  assert.match(splitter, /aria-valuenow="\{\{splitPercent\}\}"/);
  assert.match(splitter.slice(0, 120), /\.nodragscroll/, 'a drag on it never pans the board');
  // Negative: no copy of the pane template, no Show radio anywhere.
  assert.strictEqual((jade.match(/template\(name="cardSettingsInline"\)/g) || []).length, 1);
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
  const offenders = walk(path.join(root, 'client')).filter(p => /\.(js|jade|css|html)$/.test(p)
    && fs.readFileSync(p, 'utf8').includes('js-card-settings-show-side'));
  assert.deepStrictEqual(offenders, [], 'negative: no Show radio left in client/');
});

test('each pane collapses whole from the caret at its top, kept per user per board', () => {
  const pane = templateOf('cardSettingsInline');
  assert.match(pane, /\.card-settings-pane-head\n\s+a\.card-settings-pane-collapse\.js-toggle-card-settings-pane\(/);
  assert.match(pane, /\.card-settings-pane-body\.js-card-settings-pane-body\(hidden=paneCollapsed\)/, 'hidden, not removed: the drags stay bound');
  assert.match(js, /const paneCollapseKey = side => `card-settings-pane-\$\{side === 'minicard' \? 'minicard' : 'card'\}`;/);
  assert.match(js, /await user\.setCollapsedCardSection\(boardId, key, !collapsedOnBoard\(key\)\);/);
  // The two panes' sections collapse apart (negative: one key for both was
  // a fold in one pane folding the other's).
  assert.match(js, /const inlineCollapseKey = \(id, side\) => \(side === 'minicard' \? `card-settings-minicard-\$\{id\}` : `card-settings-\$\{id\}`\);/);
});

test('side by side from a two-pane width of the popup, stacked below it; each pane scrolls on its own', () => {
  assert.match(css, /\.card-settings-panes-container \{[^}]*container-type: inline-size;[^}]*container-name: card-settings-panes;/);
  assert.match(css, /\.card-settings-panes \{\s*display: flex;\s*flex-direction: column;/, 'stacked by default: Minicard above Card');
  const query = css.slice(css.indexOf('@container card-settings-panes (min-width: 40em) {'));
  assert.ok(query.length > 0, 'the container query');
  assert.match(query, /\.card-settings-panes \{\s*flex-direction: row;/);
  assert.match(query, /\.card-settings-pane-body \{[^}]*overflow-y: auto;/, 'each pane body scrolls');
  assert.match(query, /flex: 0 0 calc\(\(100% - 10px\) \* var\(--card-settings-split, 0\.5\)\);/, 'the Minicard pane takes its share');
  assert.match(query, /\.card-settings-panes:not\(\.has-collapsed-pane\) > \.card-settings-splitter \{ display: block; \}/);
  // Negative: the splitter is hidden outside the query (stacked) and with a pane collapsed.
  assert.match(css, /\.card-settings-splitter \{\s*display: none;/);
  assert.match(css, /\.card-settings-panes-container \{[^}]*overflow-y: auto;/, 'stacked, the container scrolls');
});

test('the popup: wide enough for two panes, the same in CSS and JS, its corner grip kept free', () => {
  assert.match(popupCss, /\.pop-over\[data-popup='boardCardSettingsPopup'\] \{[^}]*width: min\(96vw, 1100px\) !important;/);
  assert.match(read('client/lib/popupOffset.js'), /const CARD_SETTINGS_MAX_WIDTH = 1100;/);
  // The content wrapper hands its height to the panes and does not scroll,
  // also after the corner grip resized the popup (data-user-resized).
  assert.match(popupCss, /\.pop-over\[data-popup='boardCardSettingsPopup'\] \.content-wrapper,\n\.pop-over\[data-popup='boardCardSettingsPopup'\]\[data-user-resized\] > \.content-wrapper \{[^}]*overflow: hidden !important;/);
  // A strip at the bottom for the grip, under the panes' scrollbars.
  assert.match(popupCss, /\.pop-over\[data-popup='boardCardSettingsPopup'\] \{\n\s+display: flex;\n\s+flex-direction: column;\n\s+padding-bottom: 24px;/);
  // The grip itself is the popup's own, not a second one.
  assert.ok(!/js-date-popup-resize|resizeDatePopup/.test(js + jade), 'negative: Card Settings has no grip of its own');
});

test('the splitter drags with pointer capture, by keyboard, and resets on double-click', () => {
  const at = js.indexOf('Template.boardCardSettingsPopup.onRendered(');
  const fn = js.slice(at, js.indexOf('Template.boardCardSettingsPopup.onDestroyed(', at));
  assert.match(fn, /splitter\.setPointerCapture\(evt\.pointerId\)/);
  assert.match(fn, /cardSettingsSplit\.splitAfterDrag\(drag\.start, evt\.clientX - drag\.x, total, min, isRtlPage\(\)\)/);
  assert.match(fn, /cardSettingsSplit\.splitAfterKey\(current\(\), evt\.key, total, min, isRtlPage\(\)\)/);
  assert.match(fn, /'dblclick', onDouble/);
  assert.match(fn, /saveCardSettingsSplit\(undefined\);/, 'the double-click goes back to the default');
  // Saved once, at the end of a drag that moved (negative: not per pixel).
  assert.match(fn, /if \(last !== start\) saveCardSettingsSplit\(last\);/);
  assert.ok(!/onMove[\s\S]{0,400}saveCardSettingsSplit/.test(fn.slice(fn.indexOf('const onMove'), fn.indexOf('const onEnd'))));
  // No event map on the popup: the panes' handlers would run twice.
  assert.ok(!/Template\.boardCardSettingsPopup\.events\(/.test(js));
});

console.log(`\ncardSettingsSplit: ${passed} tests passed`);
