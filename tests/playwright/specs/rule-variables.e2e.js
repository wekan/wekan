'use strict';
// #4294 / #3195 (maintainer decision 2026-09-29): rule action values use the
// email {token} syntax - {creator}, {assignees}, {members}, {customField:Name}
// and the older {card}/{list}/... - resolved against the triggering card.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

function rule(boardId, action) {
  const actionId = db.uid('act'), triggerId = db.uid('trg'), ruleId = db.uid('rule');
  db.insertOne('actions', { _id: actionId, boardId, ...action, createdAt: new Date(), modifiedAt: new Date() });
  db.insertOne('triggers', { _id: triggerId, boardId, activityType: 'createCard', listName: '*', swimlaneName: '*',
    cardTitle: '*', userId: '*', createdAt: new Date(), modifiedAt: new Date() });
  db.insertOne('rules', { _id: ruleId, boardId, title: 'vars', triggerId, actionId, createdAt: new Date(), modifiedAt: new Date() });
  return () => { db.deleteOne('rules', { _id: ruleId }); db.deleteOne('actions', { _id: actionId }); db.deleteOne('triggers', { _id: triggerId }); };
}

async function createCard(request, user, board, title) {
  const res = await request.post(`/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards`, {
    headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
    data: { authorId: user.id, swimlaneId: board.swimlaneId, title },
  });
  expect(res.status()).toBe(200);
  return (await res.json())._id;
}

test('{creator} in "add member" assigns the card creator', async ({ request, user, board }) => {
  const remove = rule(board.boardId, { actionType: 'addMember', username: '{creator}' });
  try {
    const cardId = await createCard(request, user, board, 'Creator card');
    // "Add member" adds to the card's members (Card.assignMember).
    await expect.poll(() => db.findOne('cards', { _id: cardId }).members || []).toContain(user.id);
  } finally { remove(); }
});

test('a list name can be a variable: {card} moves the card to the list with its title', async ({ request, user, board }) => {
  const target = db.findOne('lists', { _id: board.listIds[2] });
  const remove = rule(board.boardId, { actionType: 'moveCardToTop', listName: '{card}', swimlaneName: '*' });
  try {
    const cardId = await createCard(request, user, board, target.title);
    await expect.poll(() => db.findOne('cards', { _id: cardId }).listId).toBe(target._id);
  } finally { remove(); }
});

test('an unknown token adds nobody and the rule does not fail the card creation', async ({ request, user, board }) => {
  const remove = rule(board.boardId, { actionType: 'addMember', username: '{nobody}' });
  try {
    const cardId = await createCard(request, user, board, 'Unknown token card');
    // Give the rule time to run, then confirm it assigned no one.
    await expect.poll(() => db.find('activities', { cardId, activityType: 'createCard' }).length).toBeGreaterThan(0);
    expect(db.findOne('cards', { _id: cardId }).members || []).toEqual([]);
  } finally { remove(); }
});
