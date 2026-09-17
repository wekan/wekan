'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

for (const route of ['my-cards', 'my-attachments']) {
  test(`#6702 ${route} opens the selected card in place from nested content`, async ({ page, user, board }) => {
    const ids = ['Alpha Card', 'Beta Card'].map(title =>
      db.findCardIdByTitle({ boardId: board.boardId, title }));
    for (const id of ids) {
      const card = db.getCard(id);
      db.updateOne('cards', { _id: id }, { $set: { assignees: [user.id] } });
      if (route === 'my-attachments') db.insertOne('attachments', {
        _id: db.uid('attachment'), userId: user.id, name: 'example.txt',
        size: 4, type: 'text/plain', extension: 'txt',
        meta: { cardId: id, boardId: board.boardId, listId: card.listId, swimlaneId: card.swimlaneId },
      });
    }
    await loginWithToken(page, user.id, user.token);
    await page.evaluate(() => localStorage.setItem('myCardsView', 'boards'));
    await navigateInApp(page, `/${route}`);
    const originalUrl = page.url();
    for (const [index, id] of ids.entries()) {
      const link = page.locator(`a[data-card-id="${id}"]`);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', new RegExp(id));
      // Click a descendant: currentTarget must still identify the outer link.
      await link.locator(route === 'my-cards' ? '.minicard-title' : 'i').first().click();
      const popup = page.locator('.js-pop-over .js-card-details');
      await expect(popup).toBeVisible();
      await expect(popup.locator('.js-card-title')).toContainText(index ? 'Beta Card' : 'Alpha Card');
      await expect.poll(() => page.evaluate(() => Session.get('popupCardId'))).toBe(id);
      await expect(page).toHaveURL(originalUrl);
      await popup.locator('.js-close-card-details').click();
      await expect(popup).not.toBeVisible();
      await expect(page).toHaveURL(originalUrl);
    }
  });
}
