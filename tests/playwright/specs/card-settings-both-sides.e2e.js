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
const { SECTIONS } = require('../../../models/lib/cardSettingsSections');

test('both Show sides list every row of the table', async ({ boardPage: page }) => {
  await page.evaluate(() => {
    Popup.close();
    Popup.open('boardCardSettings').call({ currentData: () => ({}) }, { currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const popup = page.locator('.js-pop-over[data-popup="boardCardSettingsPopup"]');
  // Two panes since 2026-10-28, one per side, instead of a Show radio.
  await expect(popup.locator('.js-card-settings-inline')).toHaveCount(2);
  // Board Settings / Card is the opened card's Card Settings since 2026-10-28
  // (cardSettingsInline): every section is a checklist of its rows, and the
  // "Show" radio chooses which side - card or minicard - the rows are of. So
  // "every row" is every section's checklist, once per Show side; each section
  // lists its own rows, and together they are the whole table.
  for (const side of ['card', 'minicard']) {
    const pane = popup.locator(`.js-card-settings-pane[data-side="${side}"]`);
    const seen = [];
    for (const section of SECTIONS) {
      // List title is the CARD's own row, only offered on an opened card;
      // and a row with no minicard side (Drawing, Action items, attachment
      // previews...) is listed only on the card side, as rowsForSide does.
      const expected = section.keys.filter(key => {
        const row = CARD_SETTINGS_ROWS.find(r => r.key === key);
        return row && row[side] && !row[side].needsCard;
      });
      const scope = pane.locator(`.js-card-settings-section[data-section="${section.id}"]`);
      // A section with no row on this side is left out (Card, holding what is
      // not a field, stays).
      if (!expected.length && section.id !== 'card') {
        await expect(scope).toHaveCount(0);
        continue;
      }
      const rows = scope.locator('.js-card-field-order-row');
      await expect.poll(async () => (await rows.evaluateAll(els => els.map(r => `${r.dataset.key}:${r.dataset.side}`))).sort(), { message: `${section.id} ${side}` })
        .toEqual(expected.map(key => `${key}:${side}`).sort());
      seen.push(...expected);
    }
    const expected = CARD_SETTINGS_ROWS.filter(row => row[side] && !row[side].needsCard).map(row => row.key);
    expect(seen.sort()).toEqual(expected.sort());
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
