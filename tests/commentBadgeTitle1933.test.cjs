const assert = require('node:assert/strict');
const { test } = require('node:test');

test('#1933: one visible comment supplies plain tooltip text; all other counts use translation', async () => {
  const { commentBadgeTitle } = await import('../models/lib/commentBadgeTitle.js');
  const countTitle = count => `translated count ${count}`;
  const text = 'First line\n"quoted" <img src=x onerror="alert(1)"> & **Markdown**';
  assert.equal(commentBadgeTitle([{ text }], countTitle), text);
  assert.equal(commentBadgeTitle([{ text: 'one' }, { text: 'two' }], countTitle), 'translated count 2');
  for (const comments of [null, undefined, [], {}]) assert.equal(commentBadgeTitle(comments, countTitle), 'translated count 0');
  for (const text of ['', '  ', null, undefined, 42]) assert.equal(commentBadgeTitle([{ text }], countTitle), 'translated count 1');
});
