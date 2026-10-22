'use strict';
// #6796 "Declutter Cards": add buttons on their title's line, a compact
// attachment list with its upload rules in the upload popup, two new
// Show on Card rows (Attachments: Preview, Attachments: Details), and
// Board Settings / Card readable without scrolling on a wide screen.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const filesPath = process.env.WEKAN_FILES_PATH || path.join(__dirname, '..', '..', '..', '.build', 'bundle', 'files');

function seedTextAttachment(board, card) {
  const id = `declutter${Date.now()}`;
  const dir = path.join(filesPath, 'attachments');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, id), 'plain text');
  db.insertOne('attachments', {
    _id: id, name: 'notes.txt', extension: 'txt', ext: 'txt', extensionWithDot: '.txt', type: 'text/plain',
    mime: 'text/plain', size: 10, isText: true, isImage: false, userId: board.owner.id,
    path: path.join(dir, id),
    versions: { original: { path: path.join(dir, id), size: 10, type: 'text/plain', extension: 'txt', storage: 'fs' } },
    _collectionName: 'attachments', _storagePath: dir, _downloadRoute: '/cdn/storage', public: false,
    meta: { boardId: board.boardId, cardId: card._id, listId: card.listId, swimlaneId: card.swimlaneId },
    uploadedAt: new Date(),
  });
  return id;
}

async function openAlpha(page, board) {
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  return card;
}

test('a field\'s add button is on its title\'s line, and the attachment list is compact', async ({ boardPage: page, board }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const card = db.findOne('cards', { boardId: board.boardId });
  const attachmentId = seedTextAttachment(board, card);
  try {
    await openAlpha(page, board);
    const details = page.locator('.card-details');
    for (const item of ['labels', 'start', 'members']) {
      const row = details.locator(`.card-details-item-${item}`).first();
      const title = await row.locator('.card-details-item-title').boundingBox();
      const add = await row.locator('.add-label, .add-member, .add-assignee').first().boundingBox();
      expect(add, item).toBeTruthy();
      // On the title's line: the button's vertical middle is within the title.
      const middle = add.y + add.height / 2;
      expect(middle, item).toBeGreaterThan(title.y);
      expect(middle, item).toBeLessThan(title.y + title.height);
    }

    // The upload rules are not body text of the card...
    await expect(details).not.toContainText('If filename is invalid');
    const gallery = details.locator('.attachment-gallery');
    const addBox = await gallery.locator('.js-add-attachment').boundingBox();
    expect(addBox.height).toBeLessThan(40);
    // ...a text file is the small button, not a 144x96 box...
    const tile = gallery.locator(`.open-preview[data-attachment-id="${attachmentId}"]`);
    await expect(tile).toHaveClass(/attachment-thumbnail-compact/);
    expect((await tile.boundingBox()).height).toBeLessThan(60);
    await expect(gallery.locator('.attachment-uploader')).toBeVisible();
    // ...and the rules are in the upload popup.
    await gallery.locator('.js-add-attachment').click();
    await expect(page.locator('.js-pop-over .attachment-upload-help')).toContainText('If filename is invalid');
    await page.keyboard.press('Escape');

    // Attachments: Details off hides who and when (negative: the name stays).
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsAttachmentDetailsOnCard: false } });
    await expect(gallery.locator('.attachment-uploader')).toHaveCount(0);
    await expect(gallery).toContainText('notes.txt');
  } finally {
    db.deleteOne('attachments', { _id: attachmentId });
    db.updateOne('boards', { _id: board.boardId }, { $unset: { allowsAttachmentDetailsOnCard: 1 } });
  }
});

test('Board Settings / Card is read without scrolling on a 1920x1080 screen, with the new rows', async ({ boardPage: page, board }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.locator('.js-toggle-page-sidebar').first().click();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-board-card-settings').click();
  const form = page.locator('.js-pop-over .board-card-settings');
  await form.waitFor();
  const fit = await page.evaluate(() => {
    const pop = document.querySelector('.js-pop-over');
    const wrapper = pop.querySelector('.content-wrapper') || pop;
    return { width: pop.offsetWidth, scroll: wrapper.scrollHeight - wrapper.clientHeight };
  });
  expect(fit.width).toBeGreaterThan(1500);
  expect(fit.scroll).toBeLessThanOrEqual(2);
  // Each list is in more than one column.
  const lefts = await form.locator('.card-field-order-column-card .card-field-order-row').evaluateAll(
    rows => new Set(rows.map(r => Math.round(r.getBoundingClientRect().left))).size);
  expect(lefts).toBeGreaterThan(1);

  for (const [key, field] of [['attachmentPreviews', 'allowsAttachmentPreviewsOnCard'], ['attachmentDetails', 'allowsAttachmentDetailsOnCard']]) {
    const row = form.locator(`.card-field-order-column-card .js-card-field-order-row[data-key="${key}"]`);
    await expect(row).toBeVisible();
    await expect(row.locator('.card-field-order-toggle')).toHaveClass(/is-checked/);
    await row.locator('.card-field-order-toggle').click();
    await expect.poll(() => db.findOne('boards', { _id: board.boardId })[field]).toBe(false);
    db.updateOne('boards', { _id: board.boardId }, { $unset: { [field]: 1 } });
  }
});

// Card Settings rows reorder by drag and drop. With drag handles on, a row is
// dragged by its handle, its icon or its label; with them off there is no
// handle, and it is dragged by its icon or its label. The rows flow into
// several columns, so a drop may land beside a row as well as under it.
async function openCardSettings(page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.locator('.js-toggle-page-sidebar').first().click();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-board-card-settings').click();
  const form = page.locator('.js-pop-over .board-card-settings');
  await form.waitFor();
  return form;
}
async function dragRow(page, from, to) {
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 12; i += 1) {
    await page.mouse.move(a.x + a.width / 2 + ((b.x - a.x) * i) / 12, a.y + a.height / 2 + ((b.y + b.height * 0.75 - a.y - a.height / 2) * i) / 12);
  }
  await page.mouse.up();
}
const cardOrder = board => db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];

for (const [handles, grab] of [[true, 'label'], [true, 'handle'], [false, 'label']]) {
  test(`Card Settings: with drag handles ${handles ? 'on' : 'off'}, a row is dragged by its ${grab}`, async ({ boardPage: page, board, user }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': handles } });
    try {
      await page.reload();
      const form = await openCardSettings(page);
      const card = form.locator('.card-field-order-column-card');
      const row = card.locator('.js-card-field-order-row[data-key="dependencies"]');
      await expect(row.locator('.card-field-order-handle')).toHaveCount(handles ? 1 : 0);
      await expect(row.locator('.card-field-order-label')).toHaveClass(/js-card-field-order-handle/);
      const target = card.locator('.js-card-field-order-row[data-key="receivedDate"]');
      const before = cardOrder(board).join(' ');
      await dragRow(page, grab === 'handle' ? row.locator('.card-field-order-handle') : row.locator('.card-field-order-label'), target);
      await expect.poll(() => cardOrder(board).join(' ')).not.toBe(before);
      const order = cardOrder(board);
      expect(order.indexOf('dependencies')).toBeLessThan(order.indexOf('members'));
    } finally {
      db.updateOne('boards', { _id: board.boardId }, { $unset: { cardFieldOrder: 1 } });
      db.updateOne('users', { _id: user.id }, { $unset: { 'profile.showDesktopDragHandles': 1 } });
    }
  });
}
