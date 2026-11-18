'use strict';

const { test: base, expect } = require('../fixtures');
const db = require('../helpers/db');
const { solidPng } = require('../helpers/images');
const CardPage = require('../pages/CardPage');

const { targetsWeLite, openWeLitePage } = require('../helpers/welite-auth');

const test = targetsWeLite ? base.extend({
  boardPage: async ({ page, user, board }, use) => {
    await openWeLitePage(page, user, `/board?id=${encodeURIComponent(board.boardId)}&view=all`);
    await use(page);
    expect(await page.context().cookies()).toEqual([]);
  },
}) : base;
if (targetsWeLite) test.use({ javaScriptEnabled: false });

function cardLink(page, title) {
  return targetsWeLite
    ? page.getByRole('link', { name: title, exact: true })
    : page.locator('.minicard', { hasText: title }).first().locator('.minicard-title');
}

function attachment(page, name) {
  return targetsWeLite
    ? page.getByRole('link', { name, exact: true })
    : page.locator('img.attachment-thumbnail').and(page.getByTitle(name, { exact: true }));
}

async function returnToBoard(page, boardUrl) {
  if (targetsWeLite) await page.goto(boardUrl);
  else await page.reload();
}

const headers = token => ({ Authorization: `Bearer ${token}` });
const cardPath = card => `/api/boards/${card.boardId}/lists/${card.listId}/cards/${card._id}`;

test.afterEach(async ({ board }) => {
  db.deleteMany('changeHistory', { boardId: board.boardId });
});

for (const bulk of [false, true]) {
  test(`${bulk ? 'bulk' : 'single'} card deletion soft-deletes its attachments and keeps other cards' files`, async ({ request, user, user2, board, boardPage: page }) => {
    const boardUrl = page.url();
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

    await cardLink(page, 'Alpha Card').click();
    await expect(attachment(page, 'removed.png')).toBeVisible();
    const response = await request.delete(route, { headers: headers(user.token), data });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(bulk ? { deleted: [card._id], notFound: [] } : { _id: card._id });
    expect(db.findOne('cards', { _id: card._id })).toBeNull();
    const deleted = db.findOne('attachments', { _id: attachmentId });
    expect(deleted).toMatchObject({ deletedBy: user.id, meta: before.meta });
    expect(deleted.versions).toEqual(before.versions);
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
    await returnToBoard(page, boardUrl);
    await expect(cardLink(page, 'Alpha Card')).toHaveCount(0);
    await cardLink(page, 'Beta Card').click();
    await expect(attachment(page, 'retained.png')).toBeVisible();
  });
}

test('deleting a card through its UI soft-deletes uploaded attachments and preserves sibling files', async ({ request, user, board, boardPage: page }) => {
  test.slow(targetsWeLite, 'The HTML workflow includes upload, rename and direct removal before the card cascade');
  const boardUrl = page.url();
  const details = new CardPage(page);
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const sibling = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const png = await solidPng(page, 16, 16, '#3366aa');
  async function upload(target, name) {
    await cardLink(page, target.title).click();
    const file = { name, mimeType: 'image/png', buffer: png };
    if (targetsWeLite) {
      const form = page.locator('form').filter({ has: page.locator('#attachment-file') });
      await form.locator('#attachment-file').setInputFiles(file);
      await form.getByRole('button', { name: 'Upload', exact: true }).click();
    } else {
      await details.waitForOpen();
      await details.openAttachmentPanel();
      await page.locator('.js-pop-over input.js-attach-file').setInputFiles(file);
    }
    await expect(attachment(page, name)).toBeVisible();
    await expect.poll(() => db.countDocuments('attachments', { 'meta.cardId': target._id, name })).toBe(1);
    const uploaded = db.findOne('attachments', { 'meta.cardId': target._id, name });
    const download = await request.get(`/api/attachment/download/${uploaded._id}?raw=1`, { headers: headers(user.token) });
    expect(download.status()).toBe(200);
    expect(await download.body()).toEqual(png);
    return uploaded;
  }
  const otherBefore = await upload(sibling, 'retained.png');
  if (targetsWeLite) await returnToBoard(page, boardUrl);
  else await details.close();
  const before = await upload(card, 'removed.png');
  if (targetsWeLite) {
    const rename = page.locator('form[action^="/board/attachment/rename"]');
    const input = rename.getByRole('textbox', { name: 'Rename' });
    await expect(input).toHaveValue('removed');
    const action = new URL(await rename.getAttribute('action'), page.url());
    action.searchParams.set('sessionId', new URL(page.url()).searchParams.get('sessionId'));
    const rejected = await request.post(action.href, { form: { name: 'unapproved' } });
    expect(rejected.status()).toBe(403);
    expect(db.findOne('attachments', { _id: before._id })).toEqual(before);
    await input.fill('renamed');
    await rename.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(attachment(page, 'renamed.png')).toBeVisible();
    await expect(attachment(page, 'removed.png')).toHaveCount(0);
    expect(db.findOne('attachments', { _id: before._id })).toEqual({ ...before, name: 'renamed.png' });
    const renamed = await request.get(`/api/attachment/download/${before._id}?raw=1`, { headers: headers(user.token) });
    expect(renamed.status()).toBe(200);
    expect(await renamed.body()).toEqual(png);

    const file = page.locator('#attachment-file');
    await file.setInputFiles({ name: 'direct.png', mimeType: 'image/png', buffer: png });
    await page.locator('form').filter({ has: file }).getByRole('button', { name: 'Upload', exact: true }).click();
    const direct = attachment(page, 'direct.png');
    await expect(direct).toBeVisible();
    const stored = db.findOne('attachments', { 'meta.cardId': card._id, name: 'direct.png' });
    const remove = page.locator('li').filter({ has: direct }).locator('form[action^="/board/attachment/delete"]');
    const target = new URL(await remove.getAttribute('action'), page.url());
    const fields = Object.fromEntries(await remove.locator('input[type="hidden"]').evaluateAll(
      inputs => inputs.map(input => [input.name, input.value])));
    expect((await request.post(target.href, { form: fields })).status()).toBe(400);
    expect(db.findOne('attachments', { _id: stored._id })).toEqual(stored);
    await remove.getByRole('checkbox').check();
    const [removed] = await Promise.all([
      page.waitForResponse(response => response.url() === target.href && response.request().method() === 'POST'),
      remove.getByRole('button', { name: 'Delete', exact: true }).click(),
    ]);
    expect(removed.status()).toBe(303);
    await expect(direct).toHaveCount(0);
    const directlyRemoved = db.findOne('attachments', { _id: stored._id });
    expect(directlyRemoved.deletedBy).toBe(user.id);
    expect(directlyRemoved.deletedAt).toBeTruthy();
    expect(db.findOne('cards', { _id: card._id })).toBeTruthy();
    const recovery = await request.get(`/api/attachment/download/${stored._id}?raw=1`, { headers: headers(user.token) });
    expect(recovery.status()).toBe(200);
    expect(await recovery.body()).toEqual(png);
    await returnToBoard(page, boardUrl);
    await page.locator(`input[name="sel_card"][value="${card._id}"]`).check();
    await page.locator('input[name="action_delete"]').click();
    await page.locator('input[name="action_confirm-delete"]').click();
  } else {
    await details.openActionsMenu();
    await details.clickAction('.js-more');
    await details.clickAction('.js-delete');
    await page.locator('.js-pop-over button.js-confirm').click();
  }

  await expect.poll(() => db.findOne('cards', { _id: card._id })).toBeNull();
  await expect(cardLink(page, 'Alpha Card')).toHaveCount(0);
  if (!targetsWeLite) await expect(details.root).toBeHidden();
  const deleted = db.findOne('attachments', { _id: before._id });
  expect(deleted).toMatchObject({ deletedBy: user.id, meta: before.meta });
  expect(deleted.versions).toEqual(before.versions);
  expect(deleted.deletedAt).toBeTruthy();
  expect(deleted.deleteBatchId).toBeTruthy();
  expect(db.findOne('attachments', { _id: otherBefore._id })).toEqual(otherBefore);
  expect(db.countDocuments('changeHistory', { entityType: 'attachment', entityId: before._id, changeType: 'removed', userId: user.id })).toBe(1);
  expect(db.countDocuments('activities', { attachmentId: before._id, activityType: 'deleteAttachment' })).toBe(1);
  const list = await request.get(`/api/attachment/list/${board.boardId}`, { headers: headers(user.token) });
  expect(list.status()).toBe(200);
  expect((await list.json()).attachments.map(a => a.attachmentId)).toEqual([otherBefore._id]);
  const retained = await request.get(`/api/attachment/download/${before._id}?raw=1`, { headers: headers(user.token) });
  expect(retained.status()).toBe(200);
  expect(await retained.body()).toEqual(png);
  await returnToBoard(page, boardUrl);
  await expect(cardLink(page, 'Alpha Card')).toHaveCount(0);
  await cardLink(page, 'Beta Card').click();
  await expect(attachment(page, 'retained.png')).toBeVisible();
});
