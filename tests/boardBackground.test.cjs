'use strict';

// Plain-Node unit test (no Meteor) for the board-background descriptor.
// Run: node tests/boardBackground.test.cjs
//
// Regression guard for #4978 ("Favorite-Switch of board. The board-background
// does not change."). Switching directly from board A to board B via the
// favorites bar reused the boardBody template instance, so the one-shot
// setBackgroundImage() never re-ran and A's inline `background:url(...)` stuck.
// Part of the fix is that the background is recomputed reactively; the other
// part is that computeBoardBackground() must report 'none'/'color' (not just
// 'image') so the caller CLEARS a stale inline image when the new board has no
// image. The old code only ever SET a background, never reset it.

const assert = require('assert');
const { computeBoardBackground } = require('../models/lib/boardBackground');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: an image board is applied as an inline background -------------
test('board with a background image URL -> type image + url', () => {
  const bg = computeBoardBackground({ backgroundImageURL: 'https://x/y.png' });
  assert.deepStrictEqual(bg, { type: 'image', url: 'https://x/y.png' });
});

test('image wins even when a color is also present', () => {
  const bg = computeBoardBackground({
    backgroundImageURL: 'https://x/y.png',
    color: 'belize',
  });
  assert.strictEqual(bg.type, 'image');
});

test('color board (no image) -> type color (colorClass shows it)', () => {
  assert.deepStrictEqual(computeBoardBackground({ color: 'belize' }), { type: 'color' });
});

// --- NEGATIVE: switching to a board with no image must CLEAR the old one ----
test('NEGATIVE: board with neither image nor color -> none (clears stale bg)', () => {
  // This is the image -> plain switch that used to leave the previous board's
  // image visible because setBackgroundImage never reset the inline CSS.
  assert.deepStrictEqual(computeBoardBackground({ title: 'Plain' }), { type: 'none' });
});

test('NEGATIVE: empty-string / undefined image URL is NOT treated as an image', () => {
  // The old code keyed on `backgroundImageURL !== undefined`, so an empty string
  // counted as an image. It must resolve to a non-image result so the caller
  // clears any stale background instead of setting `url()`.
  assert.strictEqual(computeBoardBackground({ backgroundImageURL: '' }).type, 'none');
  assert.strictEqual(computeBoardBackground({ backgroundImageURL: undefined }).type, 'none');
});

test('NEGATIVE: image -> plain transition never keeps the old url', () => {
  const imageBoard = computeBoardBackground({ backgroundImageURL: 'https://x/y.png' });
  const plainBoard = computeBoardBackground({ backgroundImageURL: '' });
  assert.strictEqual(imageBoard.type, 'image');
  assert.strictEqual(plainBoard.type, 'none');
  assert.ok(!('url' in plainBoard), 'plain board must not carry a url');
});

test('NEGATIVE: null / undefined board is handled without throwing', () => {
  assert.doesNotThrow(() => computeBoardBackground(null));
  assert.deepStrictEqual(computeBoardBackground(null), { type: 'none' });
  assert.deepStrictEqual(computeBoardBackground(undefined), { type: 'none' });
});

console.log(`\n${passed} tests passed`);
