'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const fs = require('node:fs');
const path = require('node:path');
const fixtures = path.resolve(__dirname, '../../fixtures/import-formats');
const expected = require('../../fixtures/import-formats/expectations.json');
const sources = ['jira', 'kanboard', 'deck', 'openproject', 'github', 'gitlab', 'gitea', 'forgejo', 'asana', 'zenkit'];
const read = source => JSON.parse(fs.readFileSync(path.join(fixtures, `${source === 'zenkit' ? 'zenkit-adapter' : source}.json`)));

for (const source of sources) {
  test(`${source}: import adapter fixture text through the UI`, async ({ loggedInPage: page }, info) => {
    let boardId;
    try {
      await navigateInApp(page, `/import/${source}`);
      await page.locator('#import-textarea').fill(JSON.stringify(read(source)));
      await page.locator('.js-import-without-mapping').click();
      await page.waitForURL(/\/b\//);
      boardId = page.url().match(/\/b\/([^/]+)/)[1];
      const cards = db.find('cards', { boardId });
      expect(cards).toHaveLength(1);
      expect(cards[0].title).toContain(expected.title);
      for (const line of expected.description.split('\n')) expect(cards[0].description).toContain(line);
      await expect(page.locator('.minicard-title').first()).toContainText(expected.title);
      expect(new Date(cards[0].dueAt).toISOString().slice(0, 10)).toBe('2026-09-30');
      if (source !== 'openproject') {
        const board = db.findOne('boards', { _id: boardId });
        const labels = board.labels.filter(label => cards[0].labelIds.includes(label._id));
        expect(labels.map(label => label.name)).toContain(expected.label);
      }
      // Record full-content evidence rather than calling a title-only import lossless.
      await info.attach('preservation.json', { contentType: 'application/json', body: Buffer.from(JSON.stringify({
        source, cards: cards.length, comments: db.find('card_comments', { boardId }).length,
        attachments: db.find('attachments', { 'meta.boardId': boardId }).length,
        note: 'External adapters have incomplete comments/files coverage; see format audit.',
      }, null, 2)) });
    } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
  });
  test(`${source}: malformed JSON and wrong document shapes are rejected`, async ({ loggedInPage: page }) => {
    await navigateInApp(page, `/import/${source}`);
    await page.locator('#import-textarea').fill('{broken');
    await page.locator('.js-import-without-mapping').click();
    await expect(page.locator('.warning').first()).toBeVisible();
    const result = await page.evaluate(async source => {
      try { await Meteor.callAsync('importBoard', { unrelated: [] }, {}, source); return 'allowed'; }
      catch (e) { return e.error; }
    }, source);
    expect(result).toBe('invalid-import-format');
    await expect(page).toHaveURL(new RegExp(`/import/${source}$`));
  });
}

test('Trello ZIP imports comment, checklist and exact attachment bytes; JSON round-trip preserves them', async ({ loggedInPage: page, user }, info) => {
  test.setTimeout(90000);
  const JSZip = require('jszip');
  const document = read('trello');
  document.name += ` ${db.uniqueSuffix()}`;
  const zip = new JSZip();
  zip.file('board.json', JSON.stringify(document));
  const bytes = fs.readFileSync(path.join(fixtures, 'audit.txt'));
  zip.file('attachments/audit.txt', bytes);
  const boardIds = [];
  try {
    await navigateInApp(page, '/import/trello');
    await page.locator('.js-import-zip-file').setInputFiles({ name: 'trello.zip', mimeType: 'application/zip', buffer: await zip.generateAsync({ type: 'nodebuffer' }) });
    await page.locator('.js-import-without-mapping').click();
    await expect.poll(() => db.find('boards', { title: document.name }).length).toBe(1);
    const board = db.findOne('boards', { title: document.name }); boardIds.push(board._id);
    await expect.poll(() => db.find('checklistItems', { boardId: board._id }).length).toBe(1);
    expect(db.find('card_comments', { boardId: board._id }).map(c => c.text)).toContain(expected.comment);
    const attachments = db.find('attachments', { 'meta.boardId': board._id });
    expect(attachments).toHaveLength(1);
    await openBoard(page, board._id, board.slug);
    const mtok = await page.evaluate(() => Meteor.connection._lastSessionId);
    const file = await page.request.get(`/cdn/storage/attachments/${attachments[0]._id}/original/audit.txt`, { headers: { 'x-mtok': mtok } });
    expect(file.status()).toBe(200);
    expect(await file.body()).toEqual(bytes);
    const response = await page.request.get(`/api/boards/${board._id}/export?authToken=${encodeURIComponent(user.token)}`);
    expect(response.status()).toBe(200);
    const exported = await response.json();
    expect(Buffer.from(exported.attachments[0].file, 'base64')).toEqual(bytes);
    await info.attach('wekan-export.json', { contentType: 'application/json', body: Buffer.from(JSON.stringify(exported)) });
    exported.title += ' round trip';
    await navigateInApp(page, '/import/wekan');
    await page.locator('#import-textarea').fill(JSON.stringify(exported));
    await page.locator('.js-import-without-mapping').click();
    await page.waitForURL(/\/b\//);
    const restored = page.url().match(/\/b\/([^/]+)/)[1]; boardIds.push(restored);
    expect(db.find('card_comments', { boardId: restored }).map(c => c.text)).toContain(expected.comment);
    expect(db.find('checklistItems', { boardId: restored })).toHaveLength(1);
    const restoredCard = db.findOne('cards', { boardId: restored });
    expect(restoredCard.title).toBe(expected.title);
    expect(restoredCard.description).toBe(expected.description);
    const again = await page.request.get(`/api/boards/${restored}/export?authToken=${encodeURIComponent(user.token)}`);
    expect(again.status()).toBe(200);
    expect(Buffer.from((await again.json()).attachments[0].file, 'base64')).toEqual(bytes);
  } finally { db.cleanup({ boardIds }); }
});

test('every external export menu link returns text and refuses an unrelated user', async ({ boardPage: page, board, user2 }) => {
  const bp = new BoardPage(page);
  await bp.openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-export-board').click();
  // Include description through the actual shared selection controls.
  const details = page.locator('.js-export-card-details-toggle');
  if (await details.getAttribute('aria-checked') !== 'true') await details.click();
  for (const format of ['trello', 'jira', 'kanboard', 'deck', 'openproject', 'github', 'gitlab', 'gitea', 'forgejo', 'asana', 'zenkit', 'markdown']) {
    await test.step(format, async () => {
      const anchor = page.locator(`.js-pop-over a[href*="/export/${format}?"]`);
      await expect(anchor).toBeVisible();
      const href = await anchor.getAttribute('href');
      const response = await page.request.get(href);
      expect(response.status()).toBe(200);
      expect(await response.text()).toContain('Alpha Card');
      const unauthorized = new URL(href, page.url());
      unauthorized.searchParams.set('authToken', user2.token);
      const refused = await page.request.get(unauthorized.toString());
      expect([401, 403]).toContain(refused.status());
    });
  }
});

for (const source of ['csv', 'markdown', 'excel']) {
  test(`${source}: multiline Unicode text survives real file or text import`, async ({ loggedInPage: page }) => {
    let boardId;
    try {
      await navigateInApp(page, `/import/${source}`);
      if (source === 'excel') {
        const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Board');
        sheet.addRow(['Title', 'Description', 'Status']);
        sheet.addRow([expected.title, expected.description, 'Audit list']);
        await page.locator('.js-import-excel-file').setInputFiles({
          name: 'audit.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
        });
        await page.locator('form input[type=submit]').first().click();
      } else {
        await page.locator('#import-textarea').fill(fs.readFileSync(path.join(fixtures, source === 'csv' ? 'csv.csv' : 'markdown.md'), 'utf8'));
        await page.locator('.js-import-without-mapping').click();
      }
      await page.waitForURL(/\/b\//);
      boardId = page.url().match(/\/b\/([^/]+)/)[1];
      const cards = db.find('cards', { boardId });
      expect(cards).toHaveLength(1);
      expect(cards[0].title).toBe(expected.title);
      expect(cards[0].description).toBe(expected.description);
      await expect(page.locator('.minicard-title').first()).toContainText(expected.title);
    } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
  });
  test(`${source}: empty imports fail without creating a board`, async ({ loggedInPage: page, user }) => {
    const before = db.find('boards', { 'members.userId': user.id }).length;
    const result = await page.evaluate(async source => {
      try { await Meteor.callAsync('importBoard', source === 'csv' ? [] : source === 'excel' ? { excelBase64: '' } : '', {}, source); return 'allowed'; }
      catch (error) { return error.error; }
    }, source);
    expect(result).not.toBe('allowed');
    expect(db.find('boards', { 'members.userId': user.id })).toHaveLength(before);
  });
}

test('Trello HTTP import enforces the Admin Panel import switch and rejects invalid requests', async ({ page, adminUser, request }) => {
  const { loginWithToken } = require('../helpers/auth');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/problems/security');
  const selector = page.locator('.js-toggle-disable-all-import');
  const settings = db.findOne('settings', {});
  const original = !!settings.disableAllImport;
  const count = () => db.find('boards', { 'members.userId': adminUser.id }).length;
  const before = count();
  try {
    if (!original) await selector.click();
    await expect.poll(() => db.findOne('settings', { _id: settings._id }).disableAllImport).toBe(true);
    for (const contentType of ['application/json', 'application/zip']) {
      const response = await request.post('/import-trello', {
        headers: { Authorization: `Bearer ${adminUser.token}`, 'Content-Type': contentType },
        data: contentType === 'application/json' ? { board: read('trello') } : Buffer.from('invalid zip'),
      });
      expect(response.status()).toBe(403);
      expect((await response.json()).error).toBe('import-disabled');
    }
    await selector.click();
    await expect.poll(() => db.findOne('settings', { _id: settings._id }).disableAllImport).toBe(false);
    const invalid = await request.post('/import-trello', {
      headers: { Authorization: `Bearer ${adminUser.token}` }, data: { board: { unrelated: [] } },
    });
    expect(invalid.status()).toBe(400);
    const corruptZip = await request.post('/import-trello', {
      headers: { Authorization: `Bearer ${adminUser.token}`, 'Content-Type': 'application/zip' },
      data: Buffer.from('not a ZIP archive'),
    });
    expect(corruptZip.status()).toBe(400);
    const anonymous = await request.post('/import-trello', { data: { board: read('trello') } });
    expect(anonymous.status()).toBe(401);
    expect(count()).toBe(before);
  } finally {
    db.updateOne('settings', { _id: settings._id }, { $set: { disableAllImport: original } });
  }
});
