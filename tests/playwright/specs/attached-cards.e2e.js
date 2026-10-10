'use strict';
// #3257: a card attached to another card (Trello's card attachments). From a
// card's Attachments, "Attach card" finds another card of the board by its
// title or takes a pasted card link; the attached card is shown with its
// title, opens that card, and can be removed. A card the user cannot read is
// refused as not found.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('a card of the board is attached by its title, opens, and is removed (#3257)', async ({ boardPage: page, board, user }) => {
  const card = db.findOne('cards', { boardId: board.boardId });
  const otherId = db.uid('card');
  db.insertOne('cards', { ...card, _id: otherId, title: 'Attached Beta Card', sort: 900, attachedCardIds: [] });
  // A card on a board this user is not a member of.
  const hidden = db.seedBoard({ ownerId: db.uid('user'), title: 'Somebody else', cardTitlesPerList: [['Secret card']] });
  const hiddenCard = db.findOne('cards', { boardId: hidden.boardId });
  try {
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.minicard', { hasText: card.title }).first().locator('.minicard-title').click();
    const details = page.locator('.card-details');
    const add = details.locator('.attachment-gallery .js-add-attachment');
    // Open the Attachments section when it is collapsed - decided by its
    // header's caret once the header is drawn, not by a button that may
    // simply not be drawn yet.
    const header = details.locator('.js-toggle-card-section[data-section="attachments"]');
    await expect(header).toBeVisible();
    if (await header.locator('.fa-caret-right').count()) await header.click();
    await expect(add).toBeVisible();
    await add.click();
    await page.locator('.js-pop-over .js-attach-card').click();
    await page.locator('.js-pop-over .js-attach-card-input').fill('Beta');
    await page.locator('.js-pop-over .js-attach-card-match', { hasText: 'Attached Beta Card' }).click();

    const tile = details.locator('.attached-card-item', { hasText: 'Attached Beta Card' });
    await expect(tile).toBeVisible();
    await expect.poll(() => db.findOne('cards', { _id: card._id }).attachedCardIds).toEqual([otherId]);

    // Negative: a card the user cannot read is refused, and nothing is added.
    await add.click();
    await page.locator('.js-pop-over .js-attach-card').click();
    await page.locator('.js-pop-over .js-attach-card-input')
      .fill(`${new URL(page.url()).origin}/b/${hidden.boardId}/x/${hiddenCard._id}`);
    await page.locator('.js-pop-over .js-attach-card-submit').click();
    await expect(page.locator('.js-pop-over .js-attach-card-error')).toBeVisible();
    expect(db.findOne('cards', { _id: card._id }).attachedCardIds).toEqual([otherId]);
    await page.keyboard.press('Escape');

    // The attached card opens in this tab.
    await tile.locator('.js-open-attached-card').click();
    await expect(page).toHaveURL(new RegExp(`/${otherId}$`));
    await expect(page.locator('.card-details', { hasText: 'Attached Beta Card' }).first()).toBeVisible();

    // Back on the first card, it is removed again.
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.minicard', { hasText: card.title }).first().locator('.minicard-title').click();
    const back = page.locator('.card-details .attached-card-item', { hasText: 'Attached Beta Card' }).first();
    await back.locator('.js-detach-card').click();
    await expect(page.locator('.card-details .attached-card-item', { hasText: 'Attached Beta Card' })).toHaveCount(0);
    await expect.poll(() => db.findOne('cards', { _id: card._id }).attachedCardIds).toEqual([]);
  } finally {
    db.deleteMany('cards', { _id: otherId });
    db.cleanup({ boardIds: [hidden.boardId] });
  }
});

// A Trello export's card attachment to another card of the same board becomes
// an attached card; one to a card of another board stays a link.
test('a Trello card attachment to a card of the same export is imported as an attached card (#3257)', async ({ loggedInPage: page }) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { navigateInApp } = require('../helpers/auth');
  const { waitForImportedBoard } = require('../helpers/import');
  const doc = JSON.parse(fs.readFileSync(path.join(__dirname, '../../fixtures/import-formats/trello.json'), 'utf8'));
  doc.name = `Card attachments ${db.uid('t')}`;
  const [first] = doc.cards;
  first.shortLink = 'FirstAbc';
  const second = { ...first, id: '65a0000000000000000000c2', name: 'Second Trello card', shortLink: 'SecondXy',
    pos: 2, attachments: [] };
  first.attachments = [
    { id: 'att-card', name: 'https://trello.com/c/SecondXy/2-second-trello-card',
      url: 'https://trello.com/c/SecondXy/2-second-trello-card', isUpload: false },
    { id: 'att-other', name: 'https://trello.com/c/Elsewhr1/9-on-another-board',
      url: 'https://trello.com/c/Elsewhr1/9-on-another-board', isUpload: false },
  ];
  doc.cards = [first, second];
  let boardId;
  try {
    await navigateInApp(page, '/import/trello');
    await page.locator('#import-textarea').fill(JSON.stringify(doc));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const imported = db.findOne('cards', { boardId, title: first.name });
    const attached = db.findOne('cards', { boardId, title: 'Second Trello card' });
    expect(imported.attachedCardIds).toEqual([attached._id]);
    // Negative: the card of another board is a link in the description.
    expect(imported.description).toContain('https://trello.com/c/Elsewhr1/9-on-another-board');
    expect(imported.description).not.toContain('SecondXy');
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});
