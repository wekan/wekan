'use strict';
// Card viewer: a fenced code block with a known language is coloured by
// highlight.js, and its classes survive both sanitizer passes. A block with
// no or an unknown language, and classes written into card text outside a
// code block, stay plain.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('fenced code with a language is highlighted, nothing else gets classes', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId });
  db.updateOne('cards', { _id: card._id }, { $set: { description: [
    'Before', '', '```js', 'const answer = "<b>text</b>";', '```', '',
    '```', 'const plain = 1;', '```', '',
    '```nosuchlanguage', 'const other = 2;', '```', '',
    '<p class="hljs-keyword">outside</p>',
  ].join('\n') } });
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.minicard', { hasText: card.title }).first().locator('.minicard-title').click();
  const viewer = page.locator('.card-details .viewer', { hasText: 'Before' }).first();
  await expect(viewer).toContainText('outside');

  const keyword = viewer.locator('pre code.language-js .hljs-keyword', { hasText: 'const' });
  await expect(keyword).toBeVisible();
  // The colour comes from codeHighlight.css, not the default text colour.
  expect(await keyword.evaluate(el => getComputedStyle(el).color)).toBe('rgb(160, 17, 31)');
  // The string is shown as text, markup and all.
  await expect(viewer.locator('.hljs-string')).toHaveText('"<b>text</b>"');
  await expect(viewer.locator('pre b')).toHaveCount(0);

  // Negative: only the js block is highlighted; no class outside <pre>.
  await expect(viewer.locator('pre [class^="hljs-"]', { hasText: 'plain' })).toHaveCount(0);
  await expect(viewer.locator('pre', { hasText: 'const plain = 1;' })).toBeVisible();
  await expect(viewer.locator('pre', { hasText: 'const other = 2;' }).locator('[class^="hljs-"]')).toHaveCount(0);
  await expect(viewer.locator('p', { hasText: 'outside' })).not.toHaveAttribute('class', /./);
});
