'use strict';

// The card's Drawing popup moves like the opened card - by its title bar or a
// drag handle - and has the opened card's maximize / minimize button. The
// shared popup offers both by name, so other popups can join with one line.
// Run: node tests/popupMoveMaximize.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const js = read('client/components/main/popup.js');
const jade = read('client/components/main/popup.tpl.jade');
const css = read('client/components/main/popup.css');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const setOf = name => {
  const m = js.match(new RegExp(`const ${name} = new Set\\(\\[([^\\]]*)\\]\\)`));
  assert.ok(m, name);
  return m[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
};

console.log('popupMoveMaximize:');

test('the Drawing popup is movable and maximizable; Board View settings stays movable', () => {
  assert.ok(setOf('MOVABLE_POPUPS').includes('cardDrawingPopup'));
  assert.ok(setOf('MOVABLE_POPUPS').includes('boardViewSettingsPopup'));
  assert.ok(setOf('MAXIMIZABLE_POPUPS').includes('cardDrawingPopup'));
  // The opened card's "+ Add" popup (docs/Features/Cards/Card-Fields.md).
  assert.ok(setOf('MOVABLE_POPUPS').includes('boardCardSettingsPopup'), 'Board Settings / Card, also the opened card\'s + Add');
  assert.ok(setOf('MAXIMIZABLE_POPUPS').includes('boardCardSettingsPopup'));
});

test('the header has the drag handle and the maximize / minimize button, only where enabled', () => {
  // The handle only while drag handles are on, as on the opened card; the
  // title bar drags either way.
  assert.match(jade, /if popupMovable\n\s+if isTouchScreenOrShowDesktopDragHandles\n\s+span\.popup-drag-handle\.js-popup-drag-handle/);
  assert.match(jade, /if popupMaximizable\n\s+if popupMaximized\n\s+a\.popup-maximize-btn\.js-popup-minimize/);
  assert.match(jade, /a\.popup-maximize-btn\.js-popup-maximize[^\n]*maximize-window/);
  for (const key of ['drag-to-move', 'maximize-window', 'minimize-window']) assert.ok(en[key], key);
});

test('dragging reads the allow-list, and never moves a maximized popup', () => {
  assert.match(js, /classList\.contains\('pop-over--maximized'\)[\s\S]{0,200}MOVABLE_POPUPS\.has\(element\.dataset\.popup\)/);
  assert.doesNotMatch(js, /element\.dataset\.popup !== 'boardViewSettingsPopup'/, 'the old one-popup check');
});

test('maximizing keeps the dragged place to restore, and the drawing takes the window', () => {
  assert.match(js, /dataset\.restoreStyle = element\.getAttribute\('style'\)/);
  assert.match(js, /element\.setAttribute\('style', element\.dataset\.restoreStyle/);
  assert.match(css, /\.pop-over\.pop-over--maximized \{[^}]*inset: 8px !important/);
  // d5d027a6f2: maximized, the drawing takes the window (cardDrawing.js sizes it
  // to its stage); the 800 x 500 shape this pinned drew it 784px wide.
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /\.pop-over--maximized \.card-drawing-surface \{/);
});

test('negative: every locale has the three new strings, none left in English but English', () => {
  const dir = path.join(__dirname, '..', 'imports/i18n/data');
  for (const f of fs.readdirSync(dir)) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const key of ['drag-to-move', 'maximize-window', 'minimize-window']) {
      assert.ok(j[key], `${f} ${key}`);
      if (!f.startsWith('en')) assert.notStrictEqual(j[key], en[key], `${f} ${key} is still English`);
    }
    const keys = Object.keys(j);
    assert.strictEqual(keys.indexOf('maximize-window'), keys.indexOf('minimize-card') + 1, `${f}: key order`);
  }
});

console.log(`popupMoveMaximize: ${passed} passed`);
