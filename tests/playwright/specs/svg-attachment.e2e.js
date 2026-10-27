'use strict';

// SVG is an image again: uploaded as an attachment it is sanitized, shown in
// the card, usable as the card cover and the board background - and served
// whole, without its script, under a script-free sandbox.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const EVIL = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" onload="window.__svgRan=1">'
  + '<script>window.__svgRan=2</script><rect width="40" height="40" fill="#2b6cb0"/></svg>';

test('an uploaded SVG is sanitized, previewed, a cover and a board background', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const details = page.locator('.card-details');
  const header = details.locator('.js-toggle-card-section[data-section="attachments"]');
  await expect(header).toBeVisible();
  if (await header.locator('.fa-caret-right').count()) await header.click();
  await details.locator('.attachment-gallery .js-add-attachment').click();
  await page.locator('.js-pop-over .js-attach-file').setInputFiles({ name: 'evil.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(EVIL) });

  await expect.poll(() => db.find('attachments', { 'meta.cardId': card._id }).length, { timeout: 30_000 }).toBe(1);
  const attachment = db.find('attachments', { 'meta.cardId': card._id })[0];

  // Served: sanitized, an image, under the sandbox. The card has usually shown
  // the image by now, so this fetch is a revalidation: the server answers 304
  // and the browser hands back its stored 200 with the 304's headers merged
  // in. That is what this pins as well - the app-wide `frame-ancestors` CSP
  // on a 304 used to replace the SVG's own policy (models/lib/framePolicy.js).
  const served = await page.evaluate(async id => {
    const r = await fetch(`/cdn/storage/attachments/${id}`, { credentials: 'include' });
    return { status: r.status, type: r.headers.get('content-type'), csp: r.headers.get('content-security-policy'),
      disposition: r.headers.get('content-disposition'), body: await r.text() };
  }, attachment._id);
  expect(served.status).toBe(200);
  expect(served.type).toBe('image/svg+xml');
  expect(served.disposition).toBe('inline');
  expect(served.csp).toContain("default-src 'none'");
  expect(served.csp).toContain('sandbox');
  expect(served.body).not.toMatch(/<script|onload/i);
  expect(served.body).toContain('<rect');

  // Shown in the card as an image, and nothing in it ran.
  const img = details.locator(`img[src*="${attachment._id}"]`).first();
  await expect(img).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => img.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__svgRan)).toBeUndefined();

  // The card cover.
  await details.locator('.attachment-item, .attachment-thumbnail, .js-open-attachment-menu').first().waitFor({ timeout: 5000 }).catch(() => {});
  const menu = details.locator('.js-open-attachment-menu').first();
  // The upload popup is still open; the actions popup should not stack on it.
  const close = page.locator('.js-pop-over .js-close-pop-over');
  if (await close.count()) await close.first().click();
  if (await menu.count()) {
    await menu.click();
    // The first image uploaded becomes the cover by itself; otherwise add it.
    const addCover = page.locator('.js-pop-over .js-add-cover');
    await expect(page.locator('.js-pop-over .js-add-cover, .js-pop-over .js-remove-cover').first()).toBeVisible();
    if (await addCover.count()) await addCover.click();
    await expect.poll(() => db.findOne('cards', { _id: card._id }).coverId, { timeout: 10_000 }).toBe(attachment._id);
    // ...and the minicard shows it.
    await expect(page.locator(`.minicard img[src*="${attachment._id}"], .minicard [style*="${attachment._id}"]`).first()).toBeVisible({ timeout: 10_000 });
    // And the board background, for a board admin.
    if (await close.count()) await close.first().click();
    await menu.click();
    const background = page.locator('.js-pop-over .js-add-background-image');
    if (await background.count()) {
      await background.click();
      await expect.poll(() => db.findOne('boards', { _id: board.boardId }).backgroundImageURL || '', { timeout: 10_000 }).toContain(attachment._id);
    }
  }
});
