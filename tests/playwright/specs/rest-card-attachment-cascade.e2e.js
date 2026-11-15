'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { solidPng } = require('../helpers/images');

const headers = token => ({ Authorization: `Bearer ${token}` });
const cardPath = card => `/api/boards/${card.boardId}/lists/${card.listId}/cards/${card._id}`;

test.afterEach(async ({ board }) => {
  db.deleteMany('changeHistory', { boardId: board.boardId });
});

for (const bulk of [false, true]) {
  test(`${bulk ? 'bulk' : 'single'} card deletion soft-deletes its attachments and keeps other cards' files`, async ({ request, user, user2, board, boardPage: page }) => {
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const sibling = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
    const png = await solidPng(page, 16, 16, '#3366aa');
    async function upload(target, name) {
      const query = new URLSearchParams({
        boardId: board.boardId, swimlaneId: board.swimlaneId,
        listId: target.listId, cardId: target._id, fileName: name, fileType: 'image/png',
      });
      const response = await request.post(`/api/attachment/upload?${query}`, {
        headers: { ...headers(user.token), 'Content-Type': 'application/octet-stream' }, data: png,
      });
      expect(response.status()).toBe(200);
      const { attachmentId } = await response.json();
      const download = await request.get(`/api/attachment/download/${attachmentId}?raw=1`, { headers: headers(user.token) });
      expect(download.status()).toBe(200);
      expect(await download.body()).toEqual(png);
      return attachmentId;
    }
    const attachmentId = await upload(card, 'removed.png');
    const alreadyDeletedId = await upload(card, 'earlier.png');
    const siblingId = await upload(sibling, 'retained.png');
    const earlierDelete = await request.delete(`/api/attachment/delete/${alreadyDeletedId}`, { headers: headers(user.token) });
    expect(earlierDelete.status()).toBe(200);
    const alreadyDeleted = db.findOne('attachments', { _id: alreadyDeletedId });
    expect(alreadyDeleted.deletedAt).toBeTruthy();
    const before = db.findOne('attachments', { _id: attachmentId });
    const otherBefore = db.findOne('attachments', { _id: siblingId });
    db.updateOne('cards', { _id: card._id }, { $set: { coverId: attachmentId } });

    // Rejected requests must not reach the attachment cascade.
    const route = bulk ? `/api/boards/${board.boardId}/cards/bulk` : cardPath(card);
    const data = bulk ? { cardIds: [card._id] } : undefined;
    const denied = await request.delete(route, { headers: headers(user2.token), data });
    expect(denied.status()).toBe(403);
    if (!bulk) {
      const wrongList = await request.delete(cardPath({ ...card, listId: sibling.listId }), { headers: headers(user.token) });
      expect(wrongList.status()).toBe(404);
    }
    expect(db.findOne('attachments', { _id: attachmentId })).toEqual(before);

    await page.locator('.minicard', { hasText: 'Alpha Card' }).first().locator('.minicard-title').click();
    await expect(page.locator('img.attachment-thumbnail[title="removed.png"]')).toBeVisible();
    const response = await request.delete(route, { headers: headers(user.token), data });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(bulk ? { deleted: [card._id], notFound: [] } : { _id: card._id });
    expect(db.findOne('cards', { _id: card._id })).toBeNull();
    const deleted = db.findOne('attachments', { _id: attachmentId });
    expect(deleted).toMatchObject({ deletedBy: user.id, meta: before.meta, versions: before.versions });
    expect(deleted.deletedAt).toBeTruthy();
    expect(deleted.deleteBatchId).toBeTruthy();
    expect(db.findOne('attachments', { _id: alreadyDeletedId })).toEqual(alreadyDeleted);
    expect(db.findOne('attachments', { _id: siblingId })).toEqual(otherBefore);
    expect(db.countDocuments('changeHistory', { entityType: 'attachment', entityId: attachmentId, changeType: 'removed', userId: user.id })).toBe(1);
    expect(db.countDocuments('activities', { attachmentId, activityType: 'deleteAttachment' })).toBe(1);

    const list = await request.get(`/api/attachment/list/${board.boardId}`, { headers: headers(user.token) });
    expect(list.status()).toBe(200);
    expect((await list.json()).attachments.map(a => a.attachmentId)).toEqual([siblingId]);
    // Soft-deleted files remain readable for history/recovery; only active
    // attachment listings must stop returning them.
    const retained = await request.get(`/api/attachment/download/${attachmentId}?raw=1`, { headers: headers(user.token) });
    expect(retained.status()).toBe(200);
    expect(await retained.body()).toEqual(png);
    const download = await request.get(`/api/attachment/download/${siblingId}?raw=1`, { headers: headers(user.token) });
    expect(download.status()).toBe(200);
    expect(await download.body()).toEqual(png);
    await page.reload();
    await expect(page.locator('.minicard', { hasText: 'Alpha Card' })).toHaveCount(0);
    await page.locator('.minicard', { hasText: 'Beta Card' }).first().locator('.minicard-title').click();
    await expect(page.locator('img.attachment-thumbnail[title="retained.png"]')).toBeVisible();
  });
}
