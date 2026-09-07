'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('card document preview is paged, scoped and equivalent without cookies', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4document${suffix}`;
  const attachmentId = `document${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-document-preview`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let board;
  let foreignUser;
  let foreignBoard;
  let modernContext;
  const storageSettings = db.findOne('attachmentStorageSettings', {});
  const downloadBlocked = storageSettings?.limitSettings?.attachmentsDownloadBlocked === true;
  const downloadMaximum = storageSettings?.limitSettings?.attachmentsDownloadMaxBytes;
  const filesRoot = process.env.WEKAN_FILES_PATH || path.resolve(process.cwd(), '../../../files');
  const originalPath = path.join(filesRoot, 'attachments', attachmentId);
  try {
    db.updateOne('attachmentStorageSettings', {}, { $set: {
      'limitSettings.attachmentsDownloadBlocked': false,
      'limitSettings.attachmentsDownloadMaxBytes': 0,
    } });
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Document-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    board = db.seedBoard({ ownerId: user._id, title: `Document board ${suffix}`,
      listCount: 1, cardTitlesPerList: [['Document card']] });
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Document card' });
    foreignUser = db.seedUser();
    foreignBoard = db.seedBoard({ ownerId: foreignUser.id, title: `Foreign ${suffix}` });
    const paragraphs = Array.from({ length: 50 }, (_, index) =>
      `<w:p><w:r><w:t>Paragraph ${index + 1} document-${suffix}</w:t></w:r></w:p>`).join('');
    const bytes = Buffer.from(zipSync({
      'word/document.xml': strToU8(`<w:document><w:body>${paragraphs}</w:body></w:document>`),
    }));
    fs.mkdirSync(path.dirname(originalPath), { recursive: true });
    fs.writeFileSync(originalPath, bytes);
    db.insertOne('attachments', {
      _id: attachmentId, name: 'two-pages.docx', extension: 'docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: bytes.length, uploadedAt: new Date(),
      meta: { boardId: board.boardId, cardId: card._id },
      versions: { original: { path: originalPath, name: 'two-pages.docx',
        extension: 'docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: bytes.length, storage: 'fs' } },
    });

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click()]);
    const open = async target => {
      await Promise.all([legacy.waitForNavigation(),
        legacy.locator(`form[action="${target}"] input[type="submit"]`).first().click()]);
    };
    await open(`/b/${board.boardId}/${board.slug}`);
    await open(`/b/${board.boardId}/${board.slug}/${card._id}`);
    let preview = legacy.locator(
      `form:has(input[name="legacyOperation"][value="preview-attachment-document"])`
      + `:has(input[name="attachmentId"][value="${attachmentId}"])`,
    );
    await Promise.all([legacy.waitForNavigation(), preview.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('.legacy-document-page')).toContainText(`Paragraph 1 document-${suffix}`);
    await expect(legacy.locator('.legacy-document-page')).toContainText('1 / 2');
    const next = legacy.locator(
      'form:has(input[name="legacyOperation"][value="preview-attachment-document"])'
      + ':has(input[name="documentPage"][value="2"])',
    );
    await Promise.all([legacy.waitForNavigation(), next.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('.legacy-document-page')).toContainText(`Paragraph 50 document-${suffix}`);
    await expect(legacy.locator('.legacy-document-page')).toContainText('2 / 2');
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-document-preview.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, `/b/${board.boardId}/${board.slug}/${card._id}`);
    await waitForMeteor(modern);
    const tile = modern.locator('.attachment-item', { hasText: 'two-pages.docx' });
    await expect(tile).toBeVisible();
    await tile.locator('.open-preview').click();
    await expect(modern.locator('#document-gif-viewer')).not.toHaveClass(/hidden/);
    await expect(modern.locator('.document-page-text')).toContainText(`Paragraph 1 document-${suffix}`);
    await modern.screenshot({ path: `${output}/html5-document-preview.png`, fullPage: true });

    preview = legacy.locator(
      `form:has(input[name="legacyOperation"][value="preview-attachment-document"])`
      + `:has(input[name="attachmentId"][value="${attachmentId}"])`,
    ).first();
    await preview.locator('input[name="boardId"]').evaluate((input, id) => { input.value = id; },
      foreignBoard.boardId);
    await Promise.all([legacy.waitForNavigation(), preview.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('tbody')).toContainText('Error');
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', userId: user._id,
      source: 'canary:authz.legacy-html4-attachment',
    })).not.toBeNull();
  } finally {
    const restoreLimits = { $set: {
      'limitSettings.attachmentsDownloadBlocked': downloadBlocked,
    } };
    if (Number.isFinite(downloadMaximum)) {
      restoreLimits.$set['limitSettings.attachmentsDownloadMaxBytes'] = downloadMaximum;
    } else restoreLimits.$unset = { 'limitSettings.attachmentsDownloadMaxBytes': 1 };
    db.updateOne('attachmentStorageSettings', {}, restoreLimits);
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    const stored = db.findOne('attachments', { _id: attachmentId });
    for (const version of Object.values(stored?.versions || {})) {
      if (version?.path && path.isAbsolute(version.path)) {
        try { fs.unlinkSync(version.path); } catch (_) { /* already absent */ }
      }
    }
    db.deleteMany('documentPreviews', { attachmentId });
    db.deleteMany('attachments', { _id: attachmentId });
    for (const item of [board, foreignBoard]) {
      if (!item?.boardId) continue;
      db.deleteMany('cards', { boardId: item.boardId });
      db.deleteMany('lists', { boardId: item.boardId });
      db.deleteMany('swimlanes', { boardId: item.boardId });
      db.deleteMany('boards', { _id: item.boardId });
    }
    if (user?._id) {
      db.deleteMany('eventlog', { userId: user._id });
      db.deleteMany('legacyHtml4Sessions', { userId: user._id });
      db.deleteMany('users', { _id: user._id });
    }
    if (foreignUser?.id) db.deleteMany('users', { _id: foreignUser.id });
  }
});
