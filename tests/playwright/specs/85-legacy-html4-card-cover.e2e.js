'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('card cover is identified and previewable without JavaScript or cookies', async ({
  browser, baseURL,
}) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `html4cover${suffix}`;
  const attachmentId = `cover${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-card-cover`;
  const filesRoot = process.env.WEKAN_FILES_PATH || path.resolve(process.cwd(), '../../../files');
  const originalPath = path.join(filesRoot, 'attachments', attachmentId);
  const legacyContext = await browser.newContext({
    javaScriptEnabled: false, locale: 'en-US', acceptDownloads: true,
  });
  const legacy = await legacyContext.newPage();
  let user; let board; let card; let modernContext;
  const storageSettings = db.findOne('attachmentStorageSettings', {});
  const downloadBlocked = storageSettings?.limitSettings?.attachmentsDownloadBlocked === true;
  try {
    db.updateOne('attachmentStorageSettings', {}, {
      $set: { 'limitSettings.attachmentsDownloadBlocked': false },
    });
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Cover-${suffix}!`);
    await Promise.all([
      legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    board = db.seedBoard({ ownerId: user._id, title: `Cover board ${suffix}`,
      listCount: 1, cardTitlesPerList: [['Cover card']] });
    card = db.findOne('cards', { boardId: board.boardId, title: 'Cover card' });
    db.updateOne('boards', { _id: board.boardId }, {
      $set: { allowsCoverAttachmentOnCard: true },
    });
    db.updateOne('cards', { _id: card._id }, { $set: { coverId: attachmentId } });
    fs.mkdirSync(path.dirname(originalPath), { recursive: true });
    // One opaque red GIF pixel; CSS cover scaling makes its presence obvious
    // in the paired HTML5 screenshot without adding an image dependency.
    fs.writeFileSync(originalPath, Buffer.from(
      '47494638396101000100800000ff0000ffffff2c00000000010001000002024401003b', 'hex'));
    db.insertOne('attachments', {
      _id: attachmentId, name: 'cover.gif', extension: 'gif', type: 'image/gif',
      size: fs.statSync(originalPath).size, uploadedAt: new Date(),
      meta: { boardId: board.boardId, cardId: card._id },
      versions: { original: { path: originalPath, name: 'cover.gif', extension: 'gif',
        type: 'image/gif', size: fs.statSync(originalPath).size, storage: 'fs' } },
    });

    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click(),
    ]);
    for (const target of [`/b/${board.boardId}/${board.slug}`,
      `/b/${board.boardId}/${board.slug}/${card._id}`]) {
      await Promise.all([
        legacy.waitForNavigation(),
        legacy.locator(`form[action="${target}"] input[type="submit"]`).first().click(),
      ]);
    }
    const coverRow = legacy.getByRole('row', { name: /Cover image.*cover\.gif/i });
    await expect(coverRow).toBeVisible();
    const previewForm = coverRow.locator('form:has(input[value="preview-attachment-gif"])');
    await expect(previewForm).toHaveCount(1);
    const previewFields = await previewForm.locator('input[name]').evaluateAll(inputs =>
      Object.fromEntries(inputs.map(input => [input.name, input.value])));
    const previewResponse = await legacyContext.request.post(
      `${baseURL}${await previewForm.getAttribute('action')}`,
      { form: previewFields },
    );
    expect(previewResponse.status()).toBe(200);
    expect(previewResponse.headers()['content-type']).toContain('image/gif');
    expect((await previewResponse.body()).length).toBeGreaterThan(20);
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-card-cover.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, `/b/${board.boardId}/${board.slug}/${card._id}`);
    await waitForMeteor(modern);
    await expect(modern.locator('.card-details-cover')).toBeVisible();
    await modern.screenshot({ path: `${output}/html5-card-cover.png`, fullPage: true });
  } finally {
    db.updateOne('attachmentStorageSettings', {}, {
      $set: { 'limitSettings.attachmentsDownloadBlocked': downloadBlocked },
    });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    try { fs.unlinkSync(originalPath); } catch (_) {}
    db.deleteMany('attachments', { _id: attachmentId });
    if (board?.boardId) {
      db.deleteMany('cards', { boardId: board.boardId });
      db.deleteMany('lists', { boardId: board.boardId });
      db.deleteMany('swimlanes', { boardId: board.boardId });
      db.deleteMany('boards', { _id: board.boardId });
    }
    if (user?._id) {
      db.deleteMany('legacyHtml4Sessions', { userId: user._id });
      db.deleteMany('users', { _id: user._id });
    }
  }
});
