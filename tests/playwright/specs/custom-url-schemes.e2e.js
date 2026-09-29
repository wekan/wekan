'use strict';
// #3218: custom URL schemes in card text are clickable only when the
// administrator lists them, and javascript: never is.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

const TEXT = [
  'Links:', '', 'thunderlink://message-1', '', '[mail](thunderlink://message-2)', '',
  'onenote:section-1', '', '[bad](javascript:alert(1))', '',
  '<a href="thunderlink://raw-3">raw</a>', '', 'https://wekan.fi',
].join('\n');

test('only listed custom schemes become links', async ({ boardPage: page, board }) => {
  const setting = db.findOne('settings', {});
  const previous = setting.automaticLinkedUrlSchemes;
  const card = db.findOne('cards', { boardId: board.boardId });
  db.updateOne('cards', { _id: card._id }, { $set: { description: TEXT } });
  const hrefs = viewer => viewer.locator('a[href]').evaluateAll(links => links.map(a => a.getAttribute('href')));
  try {
    db.updateOne('settings', { _id: setting._id }, { $set: { automaticLinkedUrlSchemes: '' } });
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.minicard', { hasText: card.title }).first().locator('.minicard-title').click();
    const viewer = page.locator('.card-details .viewer', { hasText: 'Links:' }).first();
    await expect(viewer).toContainText('thunderlink://message-1');
    // Off by default: only the web link.
    await expect.poll(() => hrefs(viewer)).toEqual(['https://wekan.fi']);

    // Listed, the scheme links everywhere it appears - bare, markdown and raw
    // HTML; onenote was not listed, and javascript: never links.
    db.updateOne('settings', { _id: setting._id }, { $set: { automaticLinkedUrlSchemes: 'thunderlink\njavascript' } });
    await expect.poll(() => hrefs(viewer)).toEqual([
      'thunderlink://message-1', 'thunderlink://message-2', 'thunderlink://raw-3', 'https://wekan.fi']);
    await expect(viewer).toContainText('onenote:section-1');
    await expect(viewer.locator('a', { hasText: 'bad' })).toHaveCount(0);
  } finally {
    db.updateOne('settings', { _id: setting._id }, { $set: { automaticLinkedUrlSchemes: previous || '' } });
  }
});
