'use strict';

// Board View / Version Control, Attachments tab: a file has the controls of an
// opened card's attachments - a click on it views it in the same viewer, then
// download, rename, delete and the cover / background menu.

const { test: base, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const fs = require('node:fs');
const path = require('node:path');
const { targetsWeLite, openWeLiteBoard } = require('../helpers/welite-auth');

const test = targetsWeLite ? base.extend({
  boardPage: async ({ page, user, board }, use) => {
    await openWeLiteBoard(page, user, board.boardId);
    await use(page);
  },
}) : base;
if (targetsWeLite) test.use({ javaScriptEnabled: false });


// Where the server keeps attachment files: an administrator's method, so the
// test's user is one for this call only.
async function storagePaths(page, user) {
  db.updateOne('users', { _id: user.id }, { $set: { isAdmin: true } });
  try {
    return await page.evaluate(() => Meteor.callAsync('getAttachmentStoragePaths'));
  } finally {
    db.updateOne('users', { _id: user.id }, { $set: { isAdmin: false } });
  }
}

async function insertFile(page, board, storage, id, name, type, bytes) {
  const extension = name.split('.').pop();
  const directory = path.join(process.env.WEKAN_FILES_PATH, 'attachments');
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, `${id}.${extension}`);
  fs.writeFileSync(file, bytes);
  // As uploads store it, but without extensionWithDot, which a migrated file can lack.
  db.insertOne('attachments', { _id: id, name, extension, type, size: bytes.length,
    meta: { boardId: board.boardId, cardId: db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' }) },
    versions: { original: { storage: 'fs', path: `${storage.attachments}/${id}.${extension}`, size: bytes.length, extension, type } } });
  return file;
}

async function verifyWeLiteAttachments(page, request, board, user) {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const image = fs.readFileSync(path.resolve(__dirname, '../../../public/favicon-32x32.png'));
  const binary = Buffer.from([0, 1, 2, 3]);
  async function upload(fileName, fileType, data) {
    const query = new URLSearchParams({ boardId: board.boardId, cardId: card._id,
      listId: card.listId, swimlaneId: board.swimlaneId, fileName, fileType });
    const response = await request.post(`/api/attachment/upload?${query}`, {
      headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/octet-stream' }, data,
    });
    expect(response.status()).toBe(200);
    return (await response.json()).attachmentId;
  }
  const imageId = await upload('diagram.png', 'image/png', image);
  const binaryId = await upload('firmware.bin', 'application/octet-stream', binary);
  await page.getByRole('link', { name: 'Attachments', exact: true }).click();
  const imageRow = page.locator('li').filter({ has: page.getByRole('link', { name: 'diagram.png', exact: true }) });
  const other = page.locator('li').filter({ has: page.getByRole('link', { name: 'firmware.bin', exact: true }) });
  const preview = imageRow.getByRole('link', { name: 'View', exact: true });
  const previewUrl = new URL(await preview.getAttribute('href'), page.url());
  const headers = { 'User-Agent': await page.evaluate(() => navigator.userAgent) };
  const withoutSession = new URL(previewUrl);
  withoutSession.searchParams.delete('sessionId');
  expect((await request.get(withoutSession.href, { headers })).status()).toBe(404);
  const previewResponse = await request.get(previewUrl.href, { headers });
  expect(previewResponse.status()).toBe(200);
  expect(previewResponse.headers()['content-type']).toContain('image/png');
  expect(previewResponse.headers()['content-disposition']).toMatch(/^inline/);
  expect(await previewResponse.body()).toEqual(image);
  await preview.click();
  await expect(page.locator('img')).toBeVisible();
  await expect.poll(() => page.locator('img').evaluate(element => element.naturalWidth)).toBeGreaterThan(0);
  await page.goBack();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    imageRow.getByRole('link', { name: 'diagram.png', exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('diagram.png');
  expect(fs.readFileSync(await download.path())).toEqual(image);
  const input = imageRow.getByRole('textbox', { name: 'Rename' });
  await expect(input).toHaveValue('diagram');
  await input.fill('architecture');
  await imageRow.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('link', { name: 'architecture.png', exact: true })).toBeVisible();
  expect(db.findOne('attachments', { _id: imageId }).name).toBe('architecture.png');

  await expect(other.getByRole('link', { name: 'View', exact: true })).toHaveCount(0);
  const binaryUrl = new URL(await other.getByRole('link', { name: 'firmware.bin' }).getAttribute('href'), page.url());
  binaryUrl.searchParams.set('preview', '1');
  const binaryResponse = await request.get(binaryUrl.href, { headers });
  expect(binaryResponse.status()).toBe(200);
  expect(binaryResponse.headers()['content-disposition']).toMatch(/^attachment/);
  expect(await binaryResponse.body()).toEqual(binary);
  await other.getByRole('checkbox').check();
  await other.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(other).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'architecture.png', exact: true })).toBeVisible();
  expect(db.findOne('attachments', { _id: binaryId }).deletedAt).toBeTruthy();
  expect(await page.context().cookies()).toEqual([]);
}

test('Version Control Attachments: view, download, rename, delete', async ({ boardPage: page, request, board, user }) => {
  if (targetsWeLite) return verifyWeLiteAttachments(page, request, board, user);
  const storage = await storagePaths(page, user);
  const image = db.uid('vcsimage');
  const binary = db.uid('vcsbinary');
  const files = [
    await insertFile(page, board, storage, image, 'diagram.png', 'image/png',
      fs.readFileSync(path.resolve(__dirname, '../../../public/favicon-32x32.png'))),
    await insertFile(page, board, storage, binary, 'firmware.bin', 'application/octet-stream', Buffer.from([0, 1, 2, 3])),
  ];
  try {
    await page.evaluate(id => Meteor.callAsync('setBoardView', 'board-view-version-control', id), board.boardId);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);
    await page.locator('.vcs-tabs .js-vcs-tab[data-tab="files"]').click();
    const row = page.locator(`tr.vcs-file[data-attachment-id="${image}"]`);
    await expect(row).toBeVisible();

    // A click on the name views it in the card's viewer.
    await row.locator('.vcs-file-view').click();
    await expect(page.locator('#image-viewer')).toBeVisible();
    await expect.poll(() => page.locator('#image-viewer').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    await page.locator('#viewer-close').click();
    await expect(page.locator('#viewer-overlay')).toBeHidden();

    // The card's controls.
    const actions = row.locator('.vcs-file-actions');
    await expect(actions.locator('.js-vcs-file-view')).toBeVisible();
    await expect(actions.locator('.js-download')).toHaveAttribute('href', /\?download=true$/);
    await expect(actions.locator('.js-vcs-file-menu')).toBeVisible();

    await actions.locator('.js-vcs-file-rename').click();
    const input = page.locator('.js-pop-over .js-edit-attachment-name');
    await expect(input).toHaveValue('diagram');
    await input.fill('architecture');
    await page.locator('.js-pop-over .js-submit-edit-attachment-name').click();
    await expect.poll(() => db.findOne('attachments', { _id: image }).name).toBe('architecture.png');
    await expect(row).toContainText('architecture.png');

    // Negative: a file the viewer cannot show stays a link, with no view control.
    const other = page.locator(`tr.vcs-file[data-attachment-id="${binary}"]`);
    await expect(other.locator('.vcs-file-view')).toHaveCount(0);
    await expect(other.locator('.js-vcs-file-view')).toHaveCount(0);
    await expect(other.locator('.vcs-file-name a')).toHaveAttribute('target', '_blank');

    // Delete is the card's soft delete, behind the same confirmation.
    await other.locator('.js-vcs-file-delete').click();
    await page.locator('.js-pop-over .js-confirm').click();
    await expect.poll(() => !!db.findOne('attachments', { _id: binary }).deletedAt).toBe(true);
    await expect(other).toHaveCount(0);
  } finally {
    db.deleteOne('attachments', { _id: image });
    db.deleteOne('attachments', { _id: binary });
    for (const file of files) fs.rmSync(file, { force: true });
  }
});
