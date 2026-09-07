'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('text attachment preview is scoped and equivalent without cookies', async ({ browser, baseURL }) => {
  test.setTimeout(120000);
  const suffix = db.uniqueSuffix();
  const username = `html4text${suffix}`;
  const attachmentId = `text${suffix}`;
  const audioId = `audio${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-text-preview`;
  const filesRoot = process.env.WEKAN_FILES_PATH || path.resolve(process.cwd(), '../../../files');
  const originalPath = path.join(filesRoot, 'attachments', attachmentId);
  const audioPath = path.join(filesRoot, 'attachments', audioId);
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user; let board; let foreign; let foreignUser; let card; let modernContext;
  const storageSettings = db.findOne('attachmentStorageSettings', {});
  const downloadBlocked = storageSettings?.limitSettings?.attachmentsDownloadBlocked === true;
  try {
    db.updateOne('attachmentStorageSettings', {}, {
      $set: { 'limitSettings.attachmentsDownloadBlocked': false },
    });
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Text-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    board = db.seedBoard({ ownerId: user._id, title: `Text board ${suffix}`,
      listCount: 1, cardTitlesPerList: [['Text card']] });
    card = db.findOne('cards', { boardId: board.boardId, title: 'Text card' });
    foreignUser = db.seedUser();
    foreign = db.seedBoard({ ownerId: foreignUser.id, title: `Foreign ${suffix}` });
    fs.mkdirSync(path.dirname(originalPath), { recursive: true });
    fs.writeFileSync(originalPath, `Selectable text ${suffix}\n<script>alert(1)</script>`);
    fs.writeFileSync(audioPath, Buffer.from('524946462400000057415645666d74201000000001000100401f0000803e0000020010006461746100000000', 'hex'));
    db.insertOne('attachments', { _id: attachmentId, name: 'notes.txt', extension: 'txt',
      type: 'text/plain', size: fs.statSync(originalPath).size, uploadedAt: new Date(),
      meta: { boardId: board.boardId, cardId: card._id },
      versions: { original: { path: originalPath, name: 'notes.txt', extension: 'txt',
        type: 'text/plain', size: fs.statSync(originalPath).size, storage: 'fs' } } });
    db.insertOne('attachments', { _id: audioId, name: 'tone.wav', extension: 'wav',
      type: 'audio/wav', size: fs.statSync(audioPath).size, uploadedAt: new Date(),
      meta: { boardId: board.boardId, cardId: card._id },
      versions: { original: { path: audioPath, name: 'tone.wav', extension: 'wav',
        type: 'audio/wav', size: fs.statSync(audioPath).size, storage: 'fs' } } });
    await Promise.all([legacy.waitForNavigation(), legacy.locator('form[action="/allboards"] input[type="submit"]').click()]);
    for (const target of [`/b/${board.boardId}/${board.slug}`, `/b/${board.boardId}/${board.slug}/${card._id}`]) {
      await Promise.all([legacy.waitForNavigation(), legacy.locator(`form[action="${target}"] input[type="submit"]`).first().click()]);
    }
    const preview = legacy.locator('form:has(input[value="preview-attachment-text"])');
    await Promise.all([legacy.waitForNavigation(), preview.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('.legacy-document-page')).toContainText(`Selectable text ${suffix}`);
    await expect(legacy.locator('.legacy-document-page script')).toHaveCount(0);
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-text-preview.png`, fullPage: true });
    const mediaForm = legacy.locator(`form:has(input[value="preview-attachment-media"]):has(input[value="${audioId}"])`);
    const mediaFields = await mediaForm.locator('input[name]').evaluateAll(inputs =>
      Object.fromEntries(inputs.map(input => [input.name, input.value])));
    const mediaResponse = await legacyContext.request.post(`${baseURL}${await mediaForm.getAttribute('action')}`, {
      form: mediaFields,
    });
    expect(mediaResponse.status()).toBe(200);
    expect(mediaResponse.headers()['content-type']).toContain('audio/');
    expect(mediaResponse.headers()['content-disposition']).toMatch(/^inline;/);
    expect((await mediaResponse.body()).length).toBeGreaterThan(40);
    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, `/b/${board.boardId}/${board.slug}/${card._id}`);
    await waitForMeteor(modern);
    await modern.locator('.attachment-item', { hasText: 'notes.txt' }).locator('.open-preview').click();
    await expect(modern.locator('#txt-viewer')).not.toHaveClass(/hidden/);
    await modern.screenshot({ path: `${output}/html5-text-preview.png`, fullPage: true });
    await modern.locator('#viewer-close').click();
    await modern.locator('.attachment-item', { hasText: 'tone.wav' }).locator('.open-preview').click();
    await expect(modern.locator('#audio-viewer')).not.toHaveClass(/hidden/);
    await modern.screenshot({ path: `${output}/html5-audio-preview.png`, fullPage: true });
    await preview.locator('input[name="boardId"]').evaluate((input, id) => { input.value = id; }, foreign.boardId);
    await Promise.all([legacy.waitForNavigation(), preview.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('tbody')).toContainText(/forbidden|not authorized/i);
    await expect.poll(() => db.findOne('eventlog', { stream: 'security', userId: user._id,
      source: 'canary:authz.legacy-html4-attachment' })).not.toBeNull();
  } finally {
    db.updateOne('attachmentStorageSettings', {}, {
      $set: { 'limitSettings.attachmentsDownloadBlocked': downloadBlocked },
    });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    for (const storedPath of [originalPath, audioPath]) try { fs.unlinkSync(storedPath); } catch (_) {}
    db.deleteMany('attachments', { _id: { $in: [attachmentId, audioId] } });
    for (const item of [board, foreign]) if (item?.boardId) {
      db.deleteMany('cards', { boardId: item.boardId }); db.deleteMany('lists', { boardId: item.boardId });
      db.deleteMany('swimlanes', { boardId: item.boardId }); db.deleteMany('boards', { _id: item.boardId });
    }
    if (user?._id) { db.deleteMany('eventlog', { userId: user._id }); db.deleteMany('legacyHtml4Sessions', { userId: user._id }); db.deleteMany('users', { _id: user._id }); }
    if (foreignUser?.id) db.deleteMany('users', { _id: foreignUser.id });
  }
});
