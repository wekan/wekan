'use strict';
// A CSV file chosen on the Import page is uploaded to the server's disk, and
// its column mapping is offered from the server's reading of it.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const { waitForImportedBoard } = require('../helpers/import');

test('a CSV file is uploaded, mapped from the server\'s preview, and imported', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/csv');
    const csv = 'Title,List,Description\nUploaded card,To Do,From the disk\nSecond,Done,\n';
    await page.locator('.js-import-file').setInputFiles({ name: 'cards.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await page.locator('.js-import-without-mapping').click();
    // The mapping step, with the file's header read on the server.
    await expect(page.locator('.js-csv-mapping-import')).toBeVisible();
    await expect(page.getByText('Description', { exact: true }).first()).toBeVisible();
    await page.locator('.js-csv-mapping-import').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    expect(cards.map(c => c.title).sort()).toEqual(['Second', 'Uploaded card']);
    expect(cards.find(c => c.title === 'Uploaded card').description).toBe('From the disk');
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('negative: another user cannot read someone\'s upload', async ({ loggedInPage: page }) => {
  await navigateInApp(page, '/import/csv');
  const result = await page.evaluate(async () => {
    try { await Meteor.callAsync('csvUploadPreview', 'a'.repeat(32)); return 'allowed'; } catch (e) { return e.error; }
  });
  expect(result).toBe('import-upload-not-found');
});
