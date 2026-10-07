'use strict';
// #3256: the Map board view - an uploaded image with the cards as markers.
const { solidPng } = require('../helpers/images');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

// Through the Board View menu, as a person switches views (it reloads the page).
async function openMap(page) {
  // The language was switched just before: applying it re-renders the header,
  // which can close the Board View popup between its two clicks (WebKit under
  // a full run: a 15 s timeout on the map item). Open it again until the item
  // is actually clicked.
  for (let attempt = 0; ; attempt++) {
    await page.locator('.js-toggle-board-view').first().click();
    try {
      await page.locator('.pop-over .js-open-map-view').click({ timeout: 5000 });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  await expect(page.locator('.js-map-view')).toBeVisible({ timeout: 15000 });
}

for (const language of ['en', 'ku', 'ckb', 'tt', 'tk_TM', 'yi', 'ary', 'bho', 'mai', 'or_IN', 'kok', 'so', 'om', 'rw', 'rn', 'ny', 'st', 'tn', 'nso', 'zu', 'zu-ZA', 'xh', 'ss', 'nd', 'ts', 've', 'bi', 'tpi', 'mi', 'sm', 'pap', 'wa', 'ace', 'haw', 'wa-RR', 'fj', 'to', 'lg', 'wo', 'bua', 'cv', 'sah', 'bo', 'dz', 'ti', 'gv', 've-CC', 'rup', 'ak', 'ee', 'bm', 'qu', 'ay', 'gn', 'se', 'ff', 'ks', 'tlh', 'vo', 've-PP', 'kl', 'nah', 'zgh', 'iu', 'chr', 'tig', 'wal']) {
const locale = require(`../../../imports/i18n/data/${language}.i18n.json`);
test(`a board admin uploads a map, and members place and move cards on it in ${language}`, async ({ boardPage: page, board }) => {
  const cards = Object.fromEntries(db.find('cards', { boardId: board.boardId }).map(c => [c.title, c._id]));
  try {
    await page.evaluate(async language => { await Meteor.callAsync('setLanguage', language); }, language);
    await openMap(page);
    await expect(page.locator('.map-view-empty p')).toHaveText(locale['map-view-empty']);
    await expect(page.locator('.js-map-upload-button')).toHaveText(locale['map-view-upload']);
    const png = await solidPng(page, 800, 400, '#dfe9f3');
    await page.locator('.js-map-upload-input').setInputFiles({ name: 'plan.png', mimeType: 'image/png', buffer: png });
    await expect.poll(() => db.findOne('boards', { _id: board.boardId }).mapImageAttachmentId, { timeout: 20000 }).toBeTruthy();
    const image = page.locator('.map-view-image');
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('alt', locale['board-view-map']);
    await expect(page.locator('.map-view-side h3')).toHaveText(locale['map-view-unplaced']);
    await expect(page.locator('.map-view-side p.quiet')).toHaveText(locale['map-view-place-hint']);
    await expect(page.locator('.js-map-remove-image')).toHaveText(locale['map-view-remove-image']);
    await expect.poll(() => image.evaluate(img => img.naturalWidth)).toBe(800);
    await expect(page.locator('.js-map-unplaced')).toHaveCount(3);

    // Choose a card, then click where it belongs: 25% across, 50% down.
    await page.locator('.js-map-unplaced', { hasText: 'Alpha Card' }).click();
    const box = await image.boundingBox();
    await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.5);
    await expect.poll(() => db.findOne('cards', { _id: cards['Alpha Card'] }).mapX).toBeCloseTo(25, 0);
    expect(db.findOne('cards', { _id: cards['Alpha Card'] }).mapY).toBeCloseTo(50, 0);
    await expect(page.locator(`.js-map-marker[data-card-id="${cards['Alpha Card']}"]`)).toBeVisible();

    // Drag another card onto the map, then drag a marker to a new place.
    await page.locator('.js-map-unplaced', { hasText: 'Beta Card' }).dragTo(image, { targetPosition: { x: box.width * 0.75, y: box.height * 0.25 } });
    await expect.poll(() => db.findOne('cards', { _id: cards['Beta Card'] }).mapX).toBeCloseTo(75, 0);
    await page.locator(`.js-map-marker[data-card-id="${cards['Alpha Card']}"]`).dragTo(image, { targetPosition: { x: box.width * 0.5, y: box.height * 0.9 } });
    await expect.poll(() => db.findOne('cards', { _id: cards['Alpha Card'] }).mapY).toBeCloseTo(90, 0);
    await expect(page.locator('.js-map-unplaced')).toHaveCount(1);

    // Placing the last card replaces the instruction with the completion message.
    await page.locator('.js-map-unplaced').click();
    await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.6);
    await expect(page.locator('.js-map-unplaced')).toHaveCount(0);
    await expect(page.locator('.map-view-side p.quiet')).toHaveText(locale['map-view-all-placed']);

    // A marker opens its card.
    await page.locator(`.js-map-marker[data-card-id="${cards['Beta Card']}"]`).click();
    await expect(page).toHaveURL(new RegExp(cards['Beta Card']));
  } finally {
    db.updateMany('cards', { boardId: board.boardId }, { $unset: { mapX: '', mapY: '' } });
  }
});
}

test('a read-only member sees the markers but cannot place cards', async ({ page, board, user2 }) => {
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { mapImageAttachmentId: 'no-such-image' } });
  db.updateOne('cards', { _id: alpha._id }, { $set: { mapX: 40, mapY: 60 } });
  db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
  const index = db.findOne('boards', { _id: board.boardId }).members.findIndex(m => m.userId === user2.id);
  db.updateOne('boards', { _id: board.boardId }, { $set: { [`members.${index}.isReadOnly`]: true } });
  await loginWithToken(page, user2.id, user2.token);
  await openBoard(page, board.boardId, board.slug);
  await openMap(page);
  const marker = page.locator(`.js-map-marker[data-card-id="${alpha._id}"]`);
  await expect.poll(() => marker.evaluate(el => [el.style.left, el.style.top])).toEqual(['40%', '60%']);
  await expect(marker).toHaveAttribute('draggable', 'false');
  await expect(page.locator('.js-map-unplaced')).toHaveCount(0);
  await expect(page.locator('.js-map-remove-image')).toHaveCount(0);
});
