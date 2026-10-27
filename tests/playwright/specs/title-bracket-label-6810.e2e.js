'use strict';

// #6810: "[Text] title" in Add card becomes a label only for who turned it on
// in Member Settings (off by default); otherwise the pasted title is kept.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

test('#6810: a bracketed title is kept as it is, unless Member Settings turns it into a label', async ({ boardPage: page, board, user }) => {
  const bp = new BoardPage(page);
  const [listId] = board.listIds;
  const labelsNamed = name => (db.findOne('boards', { _id: board.boardId }).labels || []).filter(l => l.name === name).length;
  db.updateOne('users', { _id: user.id }, { $unset: { 'profile.titleBracketLabel': '' } });

  // Off (the default): the reporter's paste, unchanged, and no label.
  const pasted = '[Follower] #123456 - Issue description';
  await bp.openAddCardTop(listId);
  await bp.submitNewCard(listId, pasted);
  expect(db.findOne('cards', { boardId: board.boardId, title: pasted })).toBeTruthy();
  expect(labelsNamed('Follower')).toBe(0);
  await bp.closeComposers(listId);

  // On: the #3986 behaviour.
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.titleBracketLabel': true } });
  await expect.poll(() => page.evaluate(() => Meteor.user()?.profile?.titleBracketLabel === true)).toBe(true);
  await bp.openAddCardTop(listId);
  // Not submitNewCard: it waits for a card titled as typed, and this one is not.
  await bp.list(listId).locator('.js-inlined-form textarea.js-card-title').fill('[Fedora] Do a thing');
  await bp.list(listId).locator('.js-inlined-form button[type=submit]').click();
  await expect.poll(() => labelsNamed('Fedora')).toBe(1);
  await expect.poll(() => Boolean(db.findOne('cards', { boardId: board.boardId, title: 'Do a thing' }))).toBe(true);
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Do a thing' });
  expect(card).toBeTruthy();
  expect(card.labelIds.length).toBe(1);
});
