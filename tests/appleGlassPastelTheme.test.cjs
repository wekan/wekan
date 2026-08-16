'use strict';

// Source guards for the fixed Apple Glass Pastel board theme.
//
// The general theme guards prove that every named theme is wired into the
// picker, header bars and accent map. This file pins the specific visual
// contract of `appleglasspastel`, which comes from
// refer/009-prompt-phoi-mau-apple-glass-pastel.md: a fixed special theme with a
// pastel mesh background, glass surfaces, dark readable text and blue primary
// controls.
//
// Run: node tests/appleGlassPastelTheme.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const css = read('client/components/boards/boardColors.css');
const config = read('config/const.js');
const categories = read('models/lib/themeCategories.js');
const accents = read('models/lib/themeAccents.js');
const exporter = read('models/server/ExporterExcelCard.js');
const docs = read('docs/Features/Theme/Theme.md');
const preview = read('tests/fixtures/appleGlassPastelThemePreview.html');

const THEME = 'appleglasspastel';
const CLASS = `board-color-${THEME}`;

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function rule(selectorNeedle) {
  const found = [];
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].includes(selectorNeedle)) found.push(match[2]);
  }
  return found.join('\n');
}

function blockBetween(start, end) {
  const at = css.indexOf(start);
  assert.notStrictEqual(at, -1, `${start} must exist`);
  const to = css.indexOf(end, at);
  assert.notStrictEqual(to, -1, `${end} must exist after ${start}`);
  return css.slice(at, to);
}

console.log('appleGlassPastelTheme:');

test('the theme is registered as a fixed special theme', () => {
  assert.ok(config.includes(`'${THEME}'`), 'allowed board colors include it');
  assert.ok(/special:\s*\[[^\]]*'appleglasspastel'[^\]]*\]/.test(categories),
    'special category includes it');
  assert.ok(!/flat:\s*\[[^\]]*'appleglasspastel'[^\]]*\]/.test(categories),
    'not in flat, because this is not a one-accent custom theme');
  assert.ok(!/clear:\s*\[[^\]]*'appleglasspastel'[^\]]*\]/.test(categories),
    'not in clear, because this is not a two-stop slide theme');
});

test('the shared accent and export progress colour use the palette primary', () => {
  assert.ok(new RegExp(`${THEME}: '#2563eb'`).test(accents),
    'theme accent is the Apple glass primary blue');
  assert.ok(/accentOf\(\(board && board\.color\)/.test(exporter),
    'Excel progress colour reads the same shared accent map');
});

test('the theme block carries the pastel mesh background from the reference', () => {
  const themeBlock = blockBetween('THEME - Apple Glass Pastel', 'END Apple Glass Pastel THEME');
  for (const token of [
    'rgba(255, 200, 220, 0.55)',
    'rgba(180, 215, 255, 0.55)',
    'rgba(200, 230, 255, 0.5)',
    'rgba(230, 215, 255, 0.5)',
    'linear-gradient(180deg, #f6f7fb 0%, #eef0f7 100%)',
  ]) {
    assert.ok(themeBlock.includes(token), `${token} is part of the mesh`);
  }
});

test('glass surfaces use blur, saturation, translucent white, border and soft shadows', () => {
  const surface = rule(`.${CLASS} .minicard`);
  const list = rule(`.${CLASS} .list`);
  const swimlane = rule(`.${CLASS} .swimlane .swimlane-header-wrap`);
  const combined = `${surface}\n${list}\n${swimlane}`;
  assert.ok(/rgba\(255,\s*255,\s*255,\s*0\.(65|72)\)/.test(combined),
    'main surfaces are translucent white');
  assert.ok(/backdrop-filter:\s*blur\(24px\) saturate\(180%\)/.test(combined),
    'glass blur and saturation are present');
  assert.ok(/-webkit-backdrop-filter:\s*blur\(24px\) saturate\(180%\)/.test(combined),
    'Safari-compatible glass blur is present');
  assert.ok(/border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.55\)/.test(combined),
    'glass border is present');
  assert.ok(/box-shadow:\s*0 (2px 8px|8px 30px) rgba\(0,\s*0,\s*0,\s*0\.0[46]\)/.test(combined),
    'shadows stay soft');
});

test('primary controls and header use only the blue CTA as solid fill', () => {
  for (const selector of [
    `.${CLASS}#header`,
    `.${CLASS}#header-quick-access`,
    `.${CLASS} button[type=submit].primary`,
    `.${CLASS} input[type=submit].primary`,
    `.${CLASS} .sidebar .sidebar-content .sidebar-btn`,
  ]) {
    assert.ok(rule(selector).includes('#2563eb'), `${selector} uses #2563eb`);
  }
});

test('text, focus and status colours stay high-contrast and non-pastel', () => {
  const themeBlock = blockBetween('THEME - Apple Glass Pastel', 'END Apple Glass Pastel THEME');
  for (const token of ['#111827', '#0f172a', '#6b7280', '#1e3a8a']) {
    assert.ok(themeBlock.includes(token), `${token} is used for readable UI text/state`);
  }
  assert.ok(themeBlock.includes('box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12)'),
    'focus ring uses the primary blue with low alpha');
  assert.ok(themeBlock.includes('background: #1f7d38'), 'current/success state is green');
  assert.ok(themeBlock.includes('background: #dc3545'), 'due/error state is red');
});

test('picker, public boards, All Boards and board canvas all have selectors', () => {
  for (const selector of [
    `.board-backgrounds-list .${CLASS}.background-box`,
    `.public-board-row.${CLASS}`,
    // The All Boards tile is the `li` itself, so a slide fills the whole tile
    // rather than the padding-inset link inside it.
    `.board-list li.${CLASS}`,
    `.${CLASS}.board-wrapper`,
    `.${CLASS} .setting-content .content-body .side-menu ul li.active`,
    `.${CLASS} .boards-left-menu .menu-item.active a`,
  ]) {
    assert.ok(css.includes(selector), `${selector} is styled`);
  }
});

test('theme docs list the fixed theme and the current clear slide set', () => {
  assert.ok(docs.includes('appleglasspastel'), 'docs list the new special theme');
  assert.ok(docs.includes('clearblue, cleargreen, clearorange, clearpink, clearpurple, clearred'),
    'docs list every clear slide theme, not only clearblue');
});

test('the static preview exercises the representative WeKan surfaces', () => {
  assert.ok(preview.includes('../../client/components/boards/boardColors.css'),
    'preview imports the real board theme stylesheet');
  assert.ok(preview.includes('board-color-appleglasspastel board-wrapper'),
    'preview paints a board wrapper with the theme class');
  for (const token of [
    'id="header-quick-access"',
    'id="header"',
    'class="list"',
    'class="minicard',
    'class="card-details"',
    'class="sidebar"',
    'class="pop-over board-color-appleglasspastel"',
    'class="checklist-progress-bar"',
    'class="sidebar-btn"',
    'button class="primary"',
  ]) {
    assert.ok(preview.includes(token), `${token} is represented in the preview`);
  }
});

console.log(`\n${passed} tests passed`);
