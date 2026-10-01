'use strict';
// v12.12 email report "Preview of Images is gone": the board cover was a flat
// band (its URL was empty) and the open card's attachment tile was a blue
// theme button. The cover is now the thumbnail as an img; the tile is a
// neutral fixed frame in every state; a failed thumbnail falls back once.
const path = require('path');
const fs = require('fs');
const { solidPng } = require('../helpers/images');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

const dir = path.join(process.env.WEKAN_FILES_PATH || path.join(
  __dirname, '..', '..', '..', '.build', 'bundle', 'files'), 'attachments');

test('the cover shows the picture and the attachment tile is a neutral frame', async ({ boardPage: page, board }) => {
  const id = `coverpng${Date.now()}`;
  const png = await solidPng(page, 1600, 900, '#3366aa');
  fs.mkdirSync(dir, { recursive: true });
  const stored = path.join(dir, id);
  fs.writeFileSync(stored, png);
  const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  db.insertOne('attachments', {
    _id: id, name: 'screen.png', size: png.length, type: 'image/png', extension: 'png', isImage: true,
    meta: { boardId: board.boardId, cardId },
    versions: { original: { path: stored, name: 'screen.png', size: png.length, type: 'image/png', extension: 'png', storage: 'fs' } },
  });
  try {
    db.updateOne('cards', { _id: cardId }, { $set: { coverId: id } });
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCoverAttachmentOnMinicard: true, allowsCoverAttachmentOnCard: true } });
    await openBoard(page, board.boardId, board.slug);

    // The board card: a real picture from the thumbnail, cropped to the band.
    const minicard = page.locator('.minicard', { hasText: 'Alpha Card' }).first();
    const cover = minicard.locator('img.minicard-cover-image');
    await expect(cover).toHaveAttribute('src', new RegExp(`/cdn/storage/attachments/${id}/thumbnail\\?dummyReloadAfterSessionEstablished=`));
    await expect.poll(() => cover.evaluate(node => node.complete && node.naturalWidth)).toBeGreaterThan(0);
    const coverStyle = await cover.evaluate(node => ({ fit: getComputedStyle(node).objectFit, height: node.getBoundingClientRect().height }));
    expect(coverStyle.fit).toBe('cover');
    expect([100, 120]).toContain(Math.round(coverStyle.height));

    // The open card: the tile is a 144x96 neutral frame at rest and on hover.
    await minicard.locator('.minicard-title').click();
    const tile = page.locator('button.attachment-thumbnail-container[data-attachment-id="' + id + '"]');
    await expect(tile).toBeVisible();
    const frame = () => tile.evaluate(node => {
      const style = getComputedStyle(node), box = node.getBoundingClientRect();
      return { background: style.backgroundColor, width: Math.round(box.width), height: Math.round(box.height), weight: style.fontWeight };
    });
    expect(await frame()).toEqual({ background: 'rgb(244, 245, 247)', width: 144, height: 96, weight: '400' });
    await tile.hover();
    expect((await frame()).background).toBe('rgb(244, 245, 247)');
    const picture = tile.locator('img.attachment-thumbnail');
    await expect(picture).toHaveAttribute('src', new RegExp(`/cdn/storage/attachments/${id}/thumbnail$`));
    expect(await picture.evaluate(node => getComputedStyle(node).objectFit)).toBe('contain');

    // The open-card banner is the thumbnail too.
    const banner = page.locator('img.card-details-cover-image');
    await expect(banner).toHaveAttribute('src', new RegExp(`/cdn/storage/attachments/${id}/thumbnail\\?`));
    expect(Math.round(await banner.evaluate(node => node.getBoundingClientRect().height))).toBe(180);

    // A thumbnail that fails falls back to the original once and stops.
    const swaps = await page.evaluate(async () => {
      const node = document.createElement('img');
      node.className = 'attachment-thumbnail';
      document.body.appendChild(node);
      const seen = [];
      node.addEventListener('error', () => seen.push(node.getAttribute('src')));
      node.src = '/cdn/storage/attachments/doesnotexist/thumbnail';
      await new Promise(resolve => setTimeout(resolve, 1500));
      node.remove();
      return { seen, final: node.getAttribute('src'), flag: node.dataset.previewFellBack };
    });
    expect(swaps.final).toBe('/cdn/storage/attachments/doesnotexist');
    expect(swaps.flag).toBe('1');
    expect(swaps.seen.length).toBeLessThanOrEqual(2);

    // Negative: with the board cover option off there is no band at all.
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCoverAttachmentOnMinicard: false } });
    await expect(minicard.locator('.minicard-cover')).toHaveCount(0);
  } finally {
    fs.rmSync(stored, { force: true });
    db.deleteOne('attachments', { _id: id });
    db.updateOne('cards', { _id: cardId }, { $unset: { coverId: '' } });
  }
});
