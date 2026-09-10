'use strict';

// wekan/wekan#2453: when a card description/comment contains a pasted URL
// pointing at ANOTHER WeKan card, it should render with that card's TITLE as
// the link text instead of the raw URL. models/lib/cardUrlAutolink.js is the
// pure URL-detection/parsing and text-rewriting helper; this test pins its
// behaviour directly, without a browser or a database.
//
// Run: node tests/cardUrlAutolink.test.cjs

const assert = require('assert');
const {
  isWekanCardUrl,
  findCardUrlMatches,
  isInsideExistingLink,
  autolinkWekanCardUrls,
} = require('../models/lib/cardUrlAutolink.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('  ok -', name);
}

const ABS_URL = 'https://wekan.example.com/b/boardId123/my-board-slug/cardId456';
const REL_URL = '/b/boardId123/my-board-slug/cardId456';

// ── isWekanCardUrl ───────────────────────────────────────────────────────────

test('isWekanCardUrl recognises an absolute card URL', () => {
  assert.strictEqual(isWekanCardUrl(ABS_URL), true);
});

test('isWekanCardUrl recognises a relative card URL', () => {
  assert.strictEqual(isWekanCardUrl(REL_URL), true);
});

test('isWekanCardUrl recognises a card URL with a #comment- fragment', () => {
  assert.strictEqual(isWekanCardUrl(`${ABS_URL}#comment-c1`), true);
});

test('isWekanCardUrl recognises a card URL with an #activity- fragment', () => {
  assert.strictEqual(isWekanCardUrl(`${ABS_URL}#activity-a1`), true);
});

test('isWekanCardUrl rejects an unrelated URL', () => {
  assert.strictEqual(isWekanCardUrl('https://example.com/some/other/path'), false);
});

test('isWekanCardUrl rejects a non-WeKan link with a similar shape', () => {
  assert.strictEqual(isWekanCardUrl('https://example.com/blog/2024/my-post'), false);
});

test('isWekanCardUrl rejects a board URL with no card segment', () => {
  assert.strictEqual(isWekanCardUrl('https://wekan.example.com/b/boardId123/my-board-slug'), false);
});

test('isWekanCardUrl is falsy/safe for non-string input', () => {
  assert.strictEqual(isWekanCardUrl(undefined), false);
  assert.strictEqual(isWekanCardUrl(null), false);
  assert.strictEqual(isWekanCardUrl(42), false);
});

// ── findCardUrlMatches ───────────────────────────────────────────────────────

test('findCardUrlMatches extracts boardId, slug and cardId', () => {
  const [m] = findCardUrlMatches(`see ${ABS_URL} for details`);
  assert.strictEqual(m.boardId, 'boardId123');
  assert.strictEqual(m.slug, 'my-board-slug');
  assert.strictEqual(m.cardId, 'cardId456');
  assert.strictEqual(m.match, ABS_URL);
});

test('findCardUrlMatches extracts a #comment- fragment', () => {
  const [m] = findCardUrlMatches(`${ABS_URL}#comment-abc`);
  assert.strictEqual(m.cardId, 'cardId456');
  assert.strictEqual(m.fragmentKind, 'comment');
  assert.strictEqual(m.fragmentId, 'abc');
});

test('findCardUrlMatches extracts an #activity- fragment', () => {
  const [m] = findCardUrlMatches(`${ABS_URL}#activity-xyz`);
  assert.strictEqual(m.fragmentKind, 'activity');
  assert.strictEqual(m.fragmentId, 'xyz');
});

test('findCardUrlMatches finds several matches in order', () => {
  const url2 = 'https://wekan.example.com/b/otherBoard/slug2/otherCard';
  const text = `first ${ABS_URL} then ${url2}`;
  const matches = findCardUrlMatches(text);
  assert.strictEqual(matches.length, 2);
  assert.strictEqual(matches[0].cardId, 'cardId456');
  assert.strictEqual(matches[1].cardId, 'otherCard');
  assert.ok(matches[0].index < matches[1].index);
});

test('findCardUrlMatches ignores unrelated URLs and prose', () => {
  const matches = findCardUrlMatches('nothing here, just https://example.com/x and plain text');
  assert.deepStrictEqual(matches, []);
});

test('findCardUrlMatches returns [] for empty/non-string input', () => {
  assert.deepStrictEqual(findCardUrlMatches(''), []);
  assert.deepStrictEqual(findCardUrlMatches(undefined), []);
  assert.deepStrictEqual(findCardUrlMatches(null), []);
});

// ── isInsideExistingLink ─────────────────────────────────────────────────────

test('isInsideExistingLink detects a markdown link target', () => {
  const text = `[label](${ABS_URL})`;
  const idx = text.indexOf(ABS_URL);
  assert.strictEqual(isInsideExistingLink(text, idx), true);
});

test('isInsideExistingLink detects an href attribute', () => {
  const text = `<a href="${ABS_URL}">label</a>`;
  const idx = text.indexOf(ABS_URL);
  assert.strictEqual(isInsideExistingLink(text, idx), true);
});

test('isInsideExistingLink is false for a bare pasted URL', () => {
  assert.strictEqual(isInsideExistingLink(`see ${ABS_URL} please`, 'see '.length), false);
});

// ── autolinkWekanCardUrls: title resolution / fallback ──────────────────────

test('autolinkWekanCardUrls relabels a bare URL with the resolved title', () => {
  const resolveTitle = cardId => (cardId === 'cardId456' ? 'Fix the login bug' : undefined);
  const result = autolinkWekanCardUrls(`see ${ABS_URL} please`, resolveTitle);
  assert.strictEqual(result, `see [Fix the login bug](${ABS_URL}) please`);
});

test('autolinkWekanCardUrls relabels a relative URL too', () => {
  const resolveTitle = () => 'Some Title';
  const result = autolinkWekanCardUrls(REL_URL, resolveTitle);
  assert.strictEqual(result, `[Some Title](${REL_URL})`);
});

test('autolinkWekanCardUrls falls back to the bare URL when the card cannot be resolved (deleted/invisible)', () => {
  const resolveTitle = () => undefined;
  const text = `see ${ABS_URL} please`;
  assert.strictEqual(autolinkWekanCardUrls(text, resolveTitle), text);
});

test('autolinkWekanCardUrls falls back to the bare URL when resolveTitle throws', () => {
  const resolveTitle = () => { throw new Error('boom'); };
  const text = `see ${ABS_URL} please`;
  assert.strictEqual(autolinkWekanCardUrls(text, resolveTitle), text);
});

test('autolinkWekanCardUrls is a no-op with no resolveTitle function', () => {
  const text = `see ${ABS_URL} please`;
  assert.strictEqual(autolinkWekanCardUrls(text, undefined), text);
});

test('autolinkWekanCardUrls never double-links a URL already inside a markdown link', () => {
  const resolveTitle = () => 'Should not be used';
  const text = `[already labeled](${ABS_URL})`;
  assert.strictEqual(autolinkWekanCardUrls(text, resolveTitle), text);
});

test('autolinkWekanCardUrls never double-links a URL already inside an href', () => {
  const resolveTitle = () => 'Should not be used';
  const text = `<a href="${ABS_URL}">already a link</a>`;
  assert.strictEqual(autolinkWekanCardUrls(text, resolveTitle), text);
});

test('autolinkWekanCardUrls leaves unrelated URLs and prose untouched', () => {
  const resolveTitle = () => 'Should not be used';
  const text = 'nothing here, just https://example.com/x and plain text';
  assert.strictEqual(autolinkWekanCardUrls(text, resolveTitle), text);
});

test('autolinkWekanCardUrls relabels several matches independently', () => {
  const url2 = 'https://wekan.example.com/b/otherBoard/slug2/otherCard';
  const resolveTitle = cardId => ({ cardId456: 'First card', otherCard: 'Second card' }[cardId]);
  const text = `${ABS_URL} and ${url2}`;
  const result = autolinkWekanCardUrls(text, resolveTitle);
  assert.strictEqual(result, `[First card](${ABS_URL}) and [Second card](${url2})`);
});

test('autolinkWekanCardUrls escapes a title containing "]" so it cannot break the markdown link label', () => {
  const resolveTitle = () => 'Card [urgent]';
  const result = autolinkWekanCardUrls(ABS_URL, resolveTitle);
  assert.strictEqual(result, `[Card [urgent\\]](${ABS_URL})`);
});

test('autolinkWekanCardUrls keeps the #comment-/#activity- fragment in the link target', () => {
  const url = `${ABS_URL}#comment-abc`;
  const resolveTitle = () => 'Card with a comment link';
  const result = autolinkWekanCardUrls(url, resolveTitle);
  assert.strictEqual(result, `[Card with a comment link](${url})`);
});

console.log(`\ncardUrlAutolink: ${passed} tests passed`);
