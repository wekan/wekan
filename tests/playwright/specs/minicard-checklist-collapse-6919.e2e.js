'use strict';
// #6919: the checklist caret on a minicard folded the checklist and, half a
// second later, unfolded it again - the client applied the fold and the
// server's answer took it back. The reporter's board is Persian (right to
// left), in the Swimlanes view with one shared list header row, and the user
// is a member of the cards. Every shape here is a board like that, opened as a
// returning user opens it (a page load that logs in from the cookie), and each
// fold must still be there seconds later, in the database and on the client.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

function addChecklist(cardId, boardId, title, items = 3) {
  const id = db.uid('check');
  db.insertOne('checklists', { _id: id, cardId, boardId, title, sort: 0,
    showChecklistAtMinicard: true, createdAt: new Date() });
  for (let i = 0; i < items; i++) {
    db.insertOne('checklistItems', { _id: db.uid('item'), checklistId: id, cardId, boardId,
      title: `${title} ${i + 1}`, sort: i, isFinished: false, createdAt: new Date(), modifiedAt: new Date() });
  }
  return id;
}

function addSecondLane(board, user) {
  const lane = db.uid('swim'); const cardId = db.uid('card'); const now = new Date();
  db.insertOne('swimlanes', { _id: lane, title: 'Second lane', boardId: board.boardId, sort: 2, type: 'swimlane',
    archived: false, createdAt: now, updatedAt: now, modifiedAt: now });
  db.insertOne('cards', { _id: cardId, title: 'Second lane card', boardId: board.boardId, swimlaneId: lane,
    listId: board.listIds[0], sort: 0, archived: false, userId: user.id, members: [user.id],
    type: 'cardType-card', createdAt: now, modifiedAt: now, dateLastActivity: now });
  return cardId;
}

const alpha = board => db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });

// Each returns the minicard to click on and the checklist shown on it.
const shapes = {
  'the reporter\'s card': ({ board, user }) => {
    const card = alpha(board);
    db.updateOne('cards', { _id: card._id }, { $set: { members: [user.id] } });
    const checklistId = addChecklist(card._id, board.boardId, 'Group 1', 4);
    addChecklist(card._id, board.boardId, 'Group 2', 5);
    return { cardId: card._id, title: 'Group 1', checklistId };
  },
  'the second of two checklists': ({ board }) => {
    const card = alpha(board);
    addChecklist(card._id, board.boardId, 'Group 1');
    const checklistId = addChecklist(card._id, board.boardId, 'Group 2', 5);
    return { cardId: card._id, title: 'Group 2', checklistId };
  },
  'a linked card': ({ board }) => {
    const card = alpha(board);
    const checklistId = addChecklist(card._id, board.boardId, 'Group 1');
    const linkedId = db.uid('link');
    db.insertOne('cards', { ...card, _id: linkedId, listId: board.listIds[1], linkedId: card._id,
      type: 'cardType-linkedCard', title: 'Linked Alpha', sort: 50 });
    return { cardId: linkedId, title: 'Group 1', checklistId };
  },
  'a user with many earlier folds': ({ board, user }) => {
    const card = alpha(board);
    const checklistId = addChecklist(card._id, board.boardId, 'Group 1');
    const folds = {};
    for (let i = 0; i < 300; i++) folds[db.uid('old')] = { 'checklist-old': true, labels: false };
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.collapsedCardSections': folds } });
    return { cardId: card._id, title: 'Group 1', checklistId, earlierFolds: 300 };
  },
  'one shared list header row, first swimlane': ({ board, user }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.boardView': 'board-view-swimlanes' } });
    db.updateOne('boards', { _id: board.boardId }, { $set: { sharedListHeaders: true } });
    const card = alpha(board);
    const checklistId = addChecklist(card._id, board.boardId, 'Group 1');
    addSecondLane(board, user);
    return { cardId: card._id, title: 'Group 1', checklistId };
  },
  'one shared list header row, second swimlane': ({ board, user }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.boardView': 'board-view-swimlanes' } });
    db.updateOne('boards', { _id: board.boardId }, { $set: { sharedListHeaders: true } });
    const cardId = addSecondLane(board, user);
    const checklistId = addChecklist(cardId, board.boardId, 'Group 1');
    return { cardId, title: 'Group 1', checklistId };
  },
};

async function expectFold(page, caret, items, folded, count) {
  await expect(caret).toHaveAttribute('aria-expanded', folded ? 'false' : 'true');
  await expect(items).toHaveCount(folded ? 0 : count);
  // The server's answer arrives after the click: the fold must survive it.
  await page.waitForTimeout(2500);
  await expect(caret, 'the server did not take the fold back')
    .toHaveAttribute('aria-expanded', folded ? 'false' : 'true');
}

for (const [shape, setup] of Object.entries(shapes)) {
  for (const reconnect of [false, true]) {
    test(`minicard checklist caret: ${shape}${reconnect ? ', after a reconnect' : ''} (#6919)`, async ({ boardPage: page, board, user }) => {
      db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': 'fa' } });
      const { cardId, title, checklistId, earlierFolds } = setup({ board, user });
      const count = db.countDocuments('checklistItems', { checklistId });

      await page.reload();
      if (reconnect) {
        // The connection drops and comes back (sleep, a network change, a
        // server restart), and the client logs in again on the new one.
        await expect.poll(() => page.evaluate(() => !!window.Meteor?.userId())).toBe(true);
        await page.evaluate(() => { window.Meteor.disconnect(); window.Meteor.reconnect(); });
        await expect.poll(() => page.evaluate(() =>
          window.Meteor.status().connected && !!window.Meteor.userId() && !window.Meteor.loggingIn())).toBe(true);
      }
      const minicard = page.locator(`.js-minicard[data-card-id="${cardId}"]`).first();
      const group = minicard.locator('.minicard-checklist').filter({ hasText: title }).first();
      const caret = group.locator('.js-collapse-checklist');
      const items = group.locator('.js-checklist-item');
      await expectFold(page, caret, items, false, count);

      await caret.click();
      await expectFold(page, caret, items, true, count);
      const key = `checklist-${checklistId}`;
      const stored = db.findOne('users', { _id: user.id }).profile.collapsedCardSections;
      expect(stored[cardId][key]).toBe(true);
      expect(await page.evaluate(([c, k]) =>
        window.Meteor.user().profile.collapsedCardSections?.[c]?.[k], [cardId, key])).toBe(true);
      // Folding keeps the user's other folds, and does not open the card.
      if (earlierFolds) expect(Object.keys(stored)).toHaveLength(earlierFolds + 1);
      await expect(page.locator('.card-details')).toHaveCount(0);

      await caret.click();
      await expectFold(page, caret, items, false, count);

      // Folded again, it stays folded across another page load.
      await caret.click();
      await expectFold(page, caret, items, true, count);
      await page.reload();
      await expect(caret).toHaveAttribute('aria-expanded', 'false');
      await expect(items).toHaveCount(0);
    });
  }
}
