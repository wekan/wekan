const assert = require('node:assert/strict');
const { test } = require('node:test');
test('board duplication choices default to all and preserve parent-child consistency', async () => {
  const { allBoardCopyOptions, normalizeBoardCopyOptions, toggleBoardCopyOption } = await import('../models/lib/boardCopyOptions.js');
  assert.ok(Object.values(normalizeBoardCopyOptions()).every(Boolean));
  const none = allBoardCopyOptions(false);
  assert.ok(Object.values(normalizeBoardCopyOptions(none)).every(v => !v));
  const comments = toggleBoardCopyOption(none, 'comments');
  assert.deepEqual(Object.keys(comments).filter(k => comments[k]), ['swimlanes', 'lists', 'cards', 'comments']);
  assert.deepEqual(toggleBoardCopyOption(comments, 'swimlanes'), none);
  const noCards = toggleBoardCopyOption(allBoardCopyOptions(), 'cards');
  for (const key of ['cards', 'checklists', 'comments', 'attachments']) assert.equal(noCards[key], false);
  assert.equal(noCards.lists, true);
  assert.equal(noCards.rules, true);
  for (const input of [null, [], true, { cards: 'false' }, { unexpected: true }, JSON.parse('{"__proto__":true}')]) assert.throws(() => normalizeBoardCopyOptions(input));
  assert.throws(() => toggleBoardCopyOption(none, 'constructor'));
});
