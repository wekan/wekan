'use strict';

// Regression for #3456: pasting a WeKan card URL into Discourse (or Slack,
// Discord, ...) should render an inline preview via standard Open Graph meta
// tags on the card's own page - but ONLY for a card on a PUBLIC board. A
// private board's card must never leak its title/description to an
// unauthenticated page-preview fetch. See server/lib/cardOgTags.js and the
// connect middleware in server/routes/cardOgTags.js.

const assert = require('assert');
const {
  buildCardOpenGraphTags,
  renderOpenGraphTagsHtml,
  truncate,
} = require('../server/lib/cardOgTags.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const publicBoard = { isPublic: () => true };
const privateBoard = { isPublic: () => false };

test('a public board card gets og:title, og:description, og:url and og:image', () => {
  const result = buildCardOpenGraphTags({
    card: {
      title: 'Fix the onebox',
      description: 'A card describing the onebox fix.',
      coverUrl: 'https://example.com/cdn/storage/attachments/cover123',
    },
    board: publicBoard,
    cardUrl: 'https://example.com/b/board1/my-board/card1',
  });

  assert.ok(result, 'expected tags to be built for a public board');
  const byProperty = Object.fromEntries(result.tags.map(t => [t.property, t.content]));
  assert.strictEqual(byProperty['og:title'], 'Fix the onebox');
  assert.strictEqual(byProperty['og:description'], 'A card describing the onebox fix.');
  assert.strictEqual(byProperty['og:url'], 'https://example.com/b/board1/my-board/card1');
  assert.strictEqual(byProperty['og:image'], 'https://example.com/cdn/storage/attachments/cover123');
});

test('a card with no cover omits og:image entirely (no broken/empty tag)', () => {
  const result = buildCardOpenGraphTags({
    card: { title: 'No cover here', description: 'desc', coverUrl: null },
    board: publicBoard,
    cardUrl: 'https://example.com/b/board1/my-board/card1',
  });
  assert.ok(result);
  assert.ok(!result.tags.some(t => t.property === 'og:image'));
});

test('a private board card gets NO tags at all - no metadata leak', () => {
  const result = buildCardOpenGraphTags({
    card: { title: 'Secret card', description: 'Secret description', coverUrl: null },
    board: privateBoard,
    cardUrl: 'https://example.com/b/board1/my-board/card1',
  });
  assert.strictEqual(result, null);
});

test('a missing board (lookup failure) gets NO tags', () => {
  const result = buildCardOpenGraphTags({
    card: { title: 'Card', description: 'desc' },
    board: null,
    cardUrl: 'https://example.com/b/board1/my-board/card1',
  });
  assert.strictEqual(result, null);
});

test('a missing card gets NO tags', () => {
  const result = buildCardOpenGraphTags({
    card: null,
    board: publicBoard,
    cardUrl: 'https://example.com/b/board1/my-board/card1',
  });
  assert.strictEqual(result, null);
});

test('an object without isPublic() is treated as private (fails closed)', () => {
  const result = buildCardOpenGraphTags({
    card: { title: 'Card', description: 'desc' },
    board: {},
    cardUrl: 'https://example.com/b/board1/my-board/card1',
  });
  assert.strictEqual(result, null);
});

test('description is truncated to a reasonable length with an ellipsis', () => {
  const long = 'x'.repeat(500);
  const result = buildCardOpenGraphTags({
    card: { title: 'Card', description: long, coverUrl: null },
    board: publicBoard,
    cardUrl: 'https://example.com/b/board1/my-board/card1',
  });
  const desc = result.tags.find(t => t.property === 'og:description').content;
  assert.ok(desc.length <= 300);
  assert.ok(desc.endsWith('…'));
});

test('a card with no description omits og:description', () => {
  const result = buildCardOpenGraphTags({
    card: { title: 'Card', description: '', coverUrl: null },
    board: publicBoard,
    cardUrl: 'https://example.com/b/board1/my-board/card1',
  });
  assert.ok(!result.tags.some(t => t.property === 'og:description'));
});

test('rendered HTML escapes attribute-breaking characters', () => {
  const result = buildCardOpenGraphTags({
    card: { title: 'Card "with" <quotes> & stuff', description: '', coverUrl: null },
    board: publicBoard,
    cardUrl: 'https://example.com/b/board1/my-board/card1',
  });
  const html = renderOpenGraphTagsHtml(result.tags);
  assert.ok(html.includes('&quot;with&quot;'));
  assert.ok(html.includes('&lt;quotes&gt;'));
  assert.ok(html.includes('&amp;'));
  assert.ok(!html.includes('"with"'));
});

test('renderOpenGraphTagsHtml returns empty string for no tags', () => {
  assert.strictEqual(renderOpenGraphTagsHtml(null), '');
  assert.strictEqual(renderOpenGraphTagsHtml([]), '');
});

test('truncate() leaves short strings untouched', () => {
  assert.strictEqual(truncate('short', 300), 'short');
  assert.strictEqual(truncate('', 300), '');
  assert.strictEqual(truncate(null, 300), '');
});

// Negative test: the shape of the fault (trusting an unauthenticated request
// with private data) must not exist anywhere else in the same module - the
// ONLY function that decides whether to expose card data is
// buildCardOpenGraphTags, and it must always consult board.isPublic().
test('buildCardOpenGraphTags is the sole gate: it always calls board.isPublic()', () => {
  let called = false;
  const spyBoard = {
    isPublic() {
      called = true;
      return true;
    },
  };
  buildCardOpenGraphTags({
    card: { title: 'Card', description: 'd' },
    board: spyBoard,
    cardUrl: 'https://example.com/b/board1/my-board/card1',
  });
  assert.ok(called, 'expected isPublic() to have been consulted before building tags');
});

console.log(`\ncardOgTags: ${passed} passed`);
