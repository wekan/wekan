'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { solidPng } = require('../helpers/images');

test('normalized upload names retain their attachment, bytes and card display', async ({ request, user, board, boardPage: page }) => {
  const png = await solidPng(page, 20, 20, '#3366aa');
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const headers = { Authorization: `Bearer ${user.token}` };
  for (const fileName of ['short.png', 'a'.repeat(37) + '.png', 'wrong-extension.txt']) {
    const query = new URLSearchParams({
      boardId: board.boardId, swimlaneId: board.swimlaneId,
      listId: card.listId, cardId: card._id, fileName, fileType: 'image/png',
    });
    const response = await request.post(`/api/attachment/upload?${query}`, {
      headers: { ...headers, 'Content-Type': 'application/octet-stream' }, data: png,
    });
    expect(response.status()).toBe(200);
    const { success, attachmentId } = await response.json();
    expect(success).toBe(true);
    const name = fileName.endsWith('.txt') ? 'wrong-extension.png'
      : fileName.length > 30 ? `${fileName.slice(0, 26)}.png` : fileName;
    await expect.poll(() => {
      const stored = db.findOne('attachments', { _id: attachmentId });
      return stored && { name: stored.name, matchingPaths: stored.path === stored.versions.original.path };
    }).toEqual({ name, matchingPaths: true });

    const metadata = await request.get(`/api/attachment/info/${attachmentId}`, { headers });
    expect(metadata.status()).toBe(200);
    const download = await request.get(`/api/attachment/download/${attachmentId}?raw=1`, { headers });
    expect(download.status()).toBe(200);
    expect(await download.body()).toEqual(png);

    await page.reload();
    await page.locator('.minicard', { hasText: 'Alpha Card' }).first().locator('.minicard-title').click();
    await expect(page.locator(`img.attachment-thumbnail[title="${name}"]`)).toBeVisible();
    expect(db.findOne('attachments', { _id: attachmentId })).not.toBeNull();
  }
});
