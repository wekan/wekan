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

test('Board Settings / Card: the attachment rows are in the Attachments section, each a working Show on Card', async ({ boardPage: page, board }) => {
  // docs/Features/Cards/Card-Fields.md (2026-10-25): sections in a left menu
  // instead of two long lists spread over a 1800px panel.
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.locator('.js-toggle-page-sidebar').first().click();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-board-card-settings').click();
  const form = page.locator('.js-pop-over .board-card-settings');
  await form.waitFor();
  await form.locator('.js-card-settings-menu[data-id="attachments"]').click();
  for (const [key, field] of [['attachmentPreviews', 'allowsAttachmentPreviewsOnCard'], ['attachmentDetails', 'allowsAttachmentDetailsOnCard']]) {
    const cell = form.locator(`.js-card-field-order-row[data-key="${key}"][data-side="card"]`);
    await expect(cell).toBeVisible();
    await expect(cell.locator('.card-field-order-toggle')).toHaveClass(/is-checked/);
    await cell.locator('.card-field-order-toggle').click();
    await expect.poll(() => db.findOne('boards', { _id: board.boardId })[field]).toBe(false);
    db.updateOne('boards', { _id: board.boardId }, { $unset: { [field]: 1 } });
  }
});

// Card Settings: each side of a row has its order arrows (the maintainer's
// choice with the sections, 2026-10-25), and the Up and Down keys on a focused
// arrow do the same; a row that only modifies another has none.
const cardOrder = board => db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];

test('Card Settings: the order arrows move a field on its own side', async ({ boardPage: page, board }) => {
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.locator('.js-toggle-page-sidebar').first().click();
    await page.locator('.board-sidebar .js-open-board-menu').click();
    await page.locator('.js-pop-over .js-open-board-card-settings').click();
    const form = page.locator('.js-pop-over .board-card-settings');
    await form.waitFor();
    await form.locator('.js-card-settings-menu[data-id="date"]').click();
    const due = form.locator('.js-card-field-order-row[data-key="dueDate"][data-side="card"]');
    const before = cardOrder(board);
    await due.locator('.js-card-field-order-up').click();
    await expect.poll(() => cardOrder(board).join(' ')).not.toBe(before.join(' '));
    const order = cardOrder(board);
    expect(order.indexOf('dueDate')).toBeLessThan(order.indexOf('startDate'));
    // The minicard's order is not touched by the card's arrow.
    expect(db.findOne('boards', { _id: board.boardId }).minicardFieldOrder).toBeFalsy();
    // Negative: a modifier row has no arrows.
    await form.locator('.js-card-settings-menu[data-id="checklists"]').click();
    await expect(form.locator('.js-card-field-order-row[data-key="checklistDueDate"][data-side="card"] .js-card-field-order-up')).toHaveCount(0);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $unset: { cardFieldOrder: 1 } });
  }
});
