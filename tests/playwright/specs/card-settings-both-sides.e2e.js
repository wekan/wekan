'use strict';

// Board Settings / Card (2026-10-02): every row can be shown on the card AND
// on the minicard. The rows that were one-sided got the other side; a side
// that already drew something keeps doing so, a new element is off until
// chosen.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');
const { CARD_SETTINGS_ROWS } = require('../../../models/lib/cardSettingsRows');

test('both columns list every row of the table', async ({ boardPage: page }) => {
  await page.evaluate(() => {
    Popup.close();
    Popup.open('boardCardSettings')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  for (const side of ['card', 'minicard']) {
    const keys = await page.locator(`.js-card-field-order-row[data-side="${side}"]`).evaluateAll(rows => rows.map(r => r.dataset.key));
    // List title is the CARD's own row, only offered from a card's own menu.
    const expected = CARD_SETTINGS_ROWS.filter(row => !row[side].needsCard).map(row => row.key);
    expect(keys.sort()).toEqual(expected.sort());
  }
});

test('new sides render where chosen, and nothing changes until chosen', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  const [listA] = board.listIds;
  const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: cardId }, { $set: { requestedBy: 'E2E Requester',
    locations: [{ _id: 'loc1', name: 'E2E Workshop' }], dateLastActivity: new Date('2026-09-01T10:00:00Z') } });
  await page.reload();
  const minicard = bp.minicard(listA, 'Alpha Card');
  await expect(minicard).toBeVisible();
  // Requested by was on (an existing flag); location and last activity are off until chosen.
  await expect(minicard.locator('.minicard-requested-by')).toContainText('E2E Requester');
  await expect(minicard.locator('.minicard-location')).toHaveCount(0);
  await expect(minicard.locator('.minicard-last-activity')).toHaveCount(0);
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsLocationOnMinicard: true, allowsActivitiesOnMinicard: true,
    allowsRequestedByOnMinicard: false } });
  await expect(minicard.locator('.minicard-location')).toContainText('E2E Workshop', { timeout: 15000 });
  await expect(minicard.locator('.minicard-last-activity')).toBeVisible();
  await expect(minicard.locator('.minicard-requested-by')).toHaveCount(0);

  // The card's sides: collapse caret on by default, swimlane name off until chosen.
  await bp.clickCard(listA, 'Alpha Card');
  await cp.waitForOpen();
  await expect(cp.root.locator('.js-card-collapse-toggle')).toHaveCount(1);
  await expect(cp.root.locator('.card-details-swimlane-name')).toHaveCount(0);
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCardCollapse: false, allowsSwimlaneNameOnCard: true,
    allowsLabelTextOnCard: false } });
  await expect(cp.root.locator('.js-card-collapse-toggle')).toHaveCount(0, { timeout: 15000 });
  await expect(cp.root.locator('.card-details-swimlane-name')).toBeVisible();
});

test('rows for what had none: card color and the description badge, each side on its own', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  const [listA] = board.listIds;
  const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: cardId }, { $set: { color: 'green', description: 'E2E description' } });
  await page.reload();
  const minicard = bp.minicard(listA, 'Alpha Card');
  // Drawn before the rows existed, so on by default.
  await expect(minicard.locator('.minicard')).toHaveClass(/minicard-green/);
  await expect(minicard.locator('.badge-state-image-only')).toHaveCount(1);
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCardColorOnMinicard: false,
    allowsDescriptionBadgeOnMinicard: false, allowsDescriptionBadgeOnCard: true } });
  await expect(minicard.locator('.minicard')).not.toHaveClass(/minicard-green/, { timeout: 15000 });
  await expect(minicard.locator('.badge-state-image-only')).toHaveCount(0);
  // The card's side is its own: the header keeps its color, the badge is new there.
  await bp.clickCard(listA, 'Alpha Card');
  await cp.waitForOpen();
  await expect(cp.root.locator('.card-details-header')).toHaveClass(/card-details-green/);
  await expect(cp.root.locator('.card-details-description-badge')).toBeVisible();
});
