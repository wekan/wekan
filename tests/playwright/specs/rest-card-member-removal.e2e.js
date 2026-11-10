'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const headers = token => ({ Authorization: `Bearer ${token}` });
const cardPath = card => `/api/boards/${card.boardId}/lists/${card.listId}/cards/${card._id}`;

for (const [field, idKey, join, unjoin, avatar] of [
  ['members', 'memberId', 'joinMember', 'unjoinMember', '.card-details-item-members .js-member'],
  ['assignees', 'assigneeId', 'joinAssignee', 'unjoinAssignee', '.card-details-item-assignees .js-assignee'],
]) {
  test(`${field}: removing an unassigned or nonexistent user succeeds without membership activity`, async ({ request, user, board }) => {
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const activities = { cardId: card._id, activityType: { $in: [join, unjoin] } };
    for (const target of [user.id, db.uid('missing')]) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await request.delete(`${cardPath(card)}/${field}/${target}`, { headers: headers(user.token) });
        expect(response.status()).toBe(200);
        expect(await response.json()).toMatchObject({ _id: card._id, members: [], assignees: [] });
        expect(db.findOne('cards', { _id: card._id })[field]).toEqual([]);
        expect(db.countDocuments('activities', activities)).toBe(0);
      }
    }
  });

  test(`${field}: removing a deleted user's stale assignment persists and records its ID`, async ({ request, user, board }) => {
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const deleted = db.uid('deleted');
    expect(db.findOne('users', { _id: deleted })).toBeNull();
    // Old cards may retain assignments after their user account is gone.
    db.updateOne('cards', { _id: card._id }, { $set: { [field]: [deleted, user.id] } });
    const response = await request.delete(`${cardPath(card)}/${field}/${deleted}`, { headers: headers(user.token) });
    expect(response.status()).toBe(200);
    expect((await response.json())[field]).toEqual([user.id]);
    expect(db.findOne('cards', { _id: card._id })[field]).toEqual([user.id]);
    const read = await request.get(cardPath(card), { headers: headers(user.token) });
    expect(read.status()).toBe(200);
    expect((await read.json())[field]).toEqual([user.id]);
    const activity = { cardId: card._id, activityType: unjoin, [idKey]: deleted };
    expect(db.findOne('activities', activity)).toMatchObject({ boardId: card.boardId, listId: card.listId });
    const repeat = await request.delete(`${cardPath(card)}/${field}/${deleted}`, { headers: headers(user.token) });
    expect(repeat.status()).toBe(200);
    expect(db.countDocuments('activities', activity)).toBe(1);
  });

  test(`${field}: normal assignment and removal update card details and retain activity usernames`, async ({ boardPage: page, request, user, board }) => {
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    await new BoardPage(page).clickCard(card.listId, card.title);
    const details = new CardPage(page);
    await details.waitForOpen();
    const avatars = details.root.locator(avatar);
    await expect(avatars).toHaveCount(0);
    const endpoint = `${cardPath(card)}/${field}/${user.id}`;
    const add = await request.post(endpoint, { headers: headers(user.token) });
    expect(add.status()).toBe(200);
    await expect(avatars).toHaveCount(1);
    await expect(avatars).toHaveAttribute('title', new RegExp(user.username));
    const remove = await request.delete(endpoint, { headers: headers(user.token) });
    expect(remove.status()).toBe(200);
    expect((await remove.json())[field]).toEqual([]);
    expect(db.findOne('cards', { _id: card._id })[field]).toEqual([]);
    await expect(avatars).toHaveCount(0);
    for (const activityType of [join, unjoin]) {
      expect(db.findOne('activities', { cardId: card._id, activityType, [idKey]: user.id }))
        .toMatchObject({ username: user.username, boardId: card.boardId });
    }
  });
}

test('member removal retains authentication, board access, card scope and assignment guards', async ({ request, user, user2, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { members: [user.id], assignees: [user.id] } });
  for (const field of ['members', 'assignees']) {
    for (const auth of [{}, headers(user2.token)]) {
      const response = await request.delete(`${cardPath(card)}/${field}/${user.id}`, { headers: auth });
      expect([401, 403]).toContain(response.status());
    }
    for (const target of [{ ...card, _id: db.uid('missing') }, { ...card, listId: board.listIds[1] }]) {
      const response = await request.delete(`${cardPath(target)}/${field}/${user.id}`, { headers: headers(user.token) });
      expect(response.status()).toBe(404);
      expect(await response.json()).toEqual({ error: 'Card not found' });
    }
    const add = await request.post(`${cardPath(card)}/${field}/${db.uid('missing')}`, { headers: headers(user.token) });
    expect(add.status()).toBe(400);
    expect(await add.json()).toEqual({ error: 'userId is not an active member of this board' });
    expect(db.findOne('cards', { _id: card._id })[field]).toEqual([user.id]);
  }
  expect(db.countDocuments('activities', { cardId: card._id, activityType: { $in: ['joinMember', 'unjoinMember', 'joinAssignee', 'unjoinAssignee'] } })).toBe(0);
});
