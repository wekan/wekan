'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

for (const language of ['en', 'co', 'la']) {
test(`ordinary card creation records one complete activity visible in card history in ${language}`, async ({ boardPage, board, user }) => {
  await boardPage.evaluate(language => Meteor.callAsync('setLanguage', language), language);
  const bp = new BoardPage(boardPage), title = 'Creation activity regression';
  await bp.openAddCardTop(board.listIds[0]);
  await bp.submitNewCard(board.listIds[0], title);
  await bp.closeComposers(board.listIds[0]);
  const cardId = db.findCardIdByTitle({ boardId: board.boardId, title });
  await expect.poll(() => db.find('activities', { cardId, activityType: 'createCard' }).length).toBe(1);
  const card = db.findOne('cards', { _id: cardId });
  const activity = db.findOne('activities', { cardId, activityType: 'createCard' });
  expect(activity).toMatchObject({ userId: user.id, boardId: board.boardId, cardId,
    cardTitle: title, listId: card.listId, swimlaneId: card.swimlaneId,
    listName: db.findOne('lists', { _id: card.listId }).title,
    swimlaneName: db.findOne('swimlanes', { _id: card.swimlaneId }).title });
  expect(Number.isFinite(new Date(activity.createdAt).getTime())).toBe(true);
  await bp.clickCard(board.listIds[0], title);
  const cp = new CardPage(boardPage); await cp.waitForOpen();
  const heading = cp.root.locator('.js-toggle-card-section[data-section="activities"]');
  await heading.click();
  const entry = cp.root.locator(`.activity[data-id="${activity._id}"]`);
  await expect(entry).toBeVisible();
  if (language === 'la') {
    await expect(entry).toContainText('addidit');
    await expect(entry).not.toContainText('Latine:');
  }
  if (language === 'co') {
    await expect(entry).toContainText('hà aghjuntu');
    await expect(entry).not.toContainText('ha aghjuntu');
  }
});

}
