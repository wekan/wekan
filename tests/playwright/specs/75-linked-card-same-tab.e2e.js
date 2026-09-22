'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('#6711 a Markdown link to another card opens in the same tab', async ({ boardPage, board }) => {
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const target = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const targetUrl = `/b/${board.boardId}/${board.slug}/${target._id}`;
  db.updateOne('cards', { _id: source._id }, { $set: { description: `[Beta Card](${targetUrl})` } });

  const bp = new BoardPage(boardPage);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  const cp = new CardPage(boardPage);
  await cp.waitForOpen();
  const pagesBefore = boardPage.context().pages().length;
  await cp.root.locator(`.viewer a[href="${targetUrl}"]`).first().click();
  await expect(boardPage).toHaveURL(new RegExp(`${target._id}(?:[?#]|$)`));
  await expect(boardPage.locator('.board-wrapper > .js-card-details .js-card-title').filter({ hasText: 'Beta Card' })).toBeVisible();
  expect(boardPage.context().pages()).toHaveLength(pagesBefore);
});
