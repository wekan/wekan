'use strict';

/**
 * Single-file WeKan (docs/Platforms/Single-File.md): the WeKan under test is
 * the one executable, its server code read from the archive inside it.
 *
 * Runs only when WEKAN_SINGLE_FILE_FILES names that executable's
 * wekan-files directory (the single-file workflow and a local run set it);
 * otherwise every test is skipped, so the ordinary suite is unaffected.
 *
 * What it proves that the rest of the suite cannot, because there the server
 * runs from real files:
 *  - the sign-in page renders, so the client bundle was served from inside
 *    the executable;
 *  - a file uploaded through the card's attachment popup is written to
 *    wekan-files/attachments on the real disk. Writing it goes through
 *    fs.WriteStream, which Node.js 26.11.1 breaks while a virtual file system
 *    is mounted (releases/single-file/lib/vfsWorkarounds.cjs);
 *  - downloading it returns exactly the bytes that were uploaded.
 */

const fs = require('fs');
const path = require('path');
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const FILES = process.env.WEKAN_SINGLE_FILE_FILES || '';

test.describe('Single-file WeKan', () => {
  test.skip(!FILES, 'WEKAN_SINGLE_FILE_FILES is not set: not testing a single file');

  test('the sign-in page is served from inside the executable', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('#at-pwd-form, form.at-pwd-form, .at-form').first()).toBeVisible({ timeout: 30_000 });
  });

  test('an attachment uploaded in the card popup lands in wekan-files and downloads intact', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    // Several hundred KiB, so the server's write stream queues more than one
    // chunk and takes the writev path.
    const marker = `single-file-${Date.now()}`;
    const bytes = Buffer.alloc(600 * 1024);
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = (i * 31 + 7) % 251;
    Buffer.from(marker).copy(bytes, 0);

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    await cp.openAttachmentPanel();
    await boardPage.locator('.js-pop-over input.js-attach-file, .js-pop-over input[type=file]').first()
      .setInputFiles({ name: `${marker}.bin`, mimeType: 'application/octet-stream', buffer: bytes });

    const attachments = path.join(FILES, 'attachments');
    let stored = null;
    await expect.poll(() => {
      const all = [];
      const walk = d => {
        if (!fs.existsSync(d)) return;
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          const p = path.join(d, e.name);
          if (e.isDirectory()) walk(p);
          else if (fs.statSync(p).size === bytes.length && fs.readFileSync(p).subarray(0, marker.length).toString() === marker) all.push(p);
        }
      };
      walk(attachments);
      stored = all[0] || null;
      return stored;
    }, { timeout: 60_000, message: `the upload is written under ${attachments}` }).not.toBeNull();
    expect(fs.readFileSync(stored).equals(bytes)).toBe(true);

    // The card shows it, and its download link returns the same bytes.
    const link = boardPage.locator(`a[href*="/cdn/storage/attachments/"][href*="${marker}"], a[download][href*="/cdn/storage/attachments/"]`).first();
    await expect(link).toBeAttached({ timeout: 30_000 });
    const href = await link.getAttribute('href');
    const res = await boardPage.request.get(href);
    expect(res.status()).toBe(200);
    expect(Buffer.compare(await res.body(), bytes)).toBe(0);
  });
});
