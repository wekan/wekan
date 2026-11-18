'use strict';
// ListLockBulkBleed (GHSA-83w9-74mx-7v83): a list whose exception refuses a
// role write (#4527) refuses that role's REST bulk delete and bulk labels, and
// the Meteor methods archiveSelectedCards, copyCard and createLinkedCard, which
// write past the Cards allow/deny rules. The REST attempt is in Admin Panel ->
// Problems. A list without the refusal still takes the same writes, and the
// board admin, whom no list exception binds, writes in the locked one.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const auth = token => ({ Authorization: `Bearer ${token}` });
const json = (token, data) => ({ headers: { ...auth(token), 'Content-Type': 'application/json' }, data });

test('a list refusing a role write refuses its bulk and method writes (ListLockBulkBleed)', async ({ page, request, board, user, user2 }) => {
  const original = db.getBoard(board.boardId).members;
  const [lockedListId, openListId] = board.listIds;
  const card = id => db.find('cards', { boardId: board.boardId, listId: id })[0];
  const locked = card(lockedListId), open = card(openListId);
  const labelId = db.uid('label');
  const recorded = source => db.findOne('eventlog', { bleed: 'ListLockBulkBleed', source })?.count || 0;
  const cardsIn = listId => db.find('cards', { boardId: board.boardId, listId }).length;
  db.updateOne('boards', { _id: board.boardId }, { $set: {
    labels: [{ _id: labelId, name: 'Bulk', color: 'green' }],
    members: [...original.filter(m => m.userId !== user2.id), { userId: user2.id, isActive: true, isAdmin: false }],
  } });
  db.updateOne('lists', { _id: lockedListId }, { $set: { roleExceptions: { normal: { write: false } } } });
  const path = `/api/boards/${board.boardId}/cards`;

  // The reporter's control: the single-card delete is refused.
  expect((await request.delete(`/api/boards/${board.boardId}/lists/${lockedListId}/cards/${locked._id}`,
    { headers: auth(user2.token) })).status(), 'single delete').toBe(403);

  // PoC 1 and 2: the bulk routes, with an open card in the same request - the
  // whole request is refused and neither card changes.
  const del = await request.delete(`${path}/bulk`, json(user2.token, { cardIds: [open._id, locked._id] }));
  expect(del.status(), 'bulk delete').toBe(403);
  expect(db.findOne('cards', { _id: locked._id })).toBeTruthy();
  expect(db.findOne('cards', { _id: open._id })).toBeTruthy();
  const lab = await request.post(`${path}/labels`, json(user2.token, { cardIds: [open._id, locked._id], addLabelIds: [labelId] }));
  expect(lab.status(), 'bulk labels').toBe(403);
  expect(db.findOne('cards', { _id: locked._id }).labelIds || []).not.toContain(labelId);
  expect(db.findOne('cards', { _id: open._id }).labelIds || []).not.toContain(labelId);
  for (const source of ['rest:cards/bulk-delete', 'rest:cards/labels']) {
    await expect.poll(() => recorded(source), source).toBeGreaterThan(0);
  }
  expect(db.findOne('users', { _id: user2.id }).loginDisabled || false).toBe(false);

  // PoC 3 and 4, and createLinkedCard: the methods refuse too.
  await loginWithToken(page, user2.id, user2.token);
  const call = (name, args) => page.evaluate(([n, a]) => Meteor.callAsync(n, ...a).then(() => 'ok', e => e.error), [name, args]);
  const before = cardsIn(lockedListId);
  expect(await call('archiveSelectedCards', [board.boardId, [locked._id]])).toBe('not-authorized');
  expect(db.findOne('cards', { _id: locked._id }).archived).toBe(false);
  expect(await call('copyCard', [open._id, board.boardId, board.swimlaneId, lockedListId, false, {}])).toBe('not-authorized');
  expect(await call('createLinkedCard', [open._id, board.boardId, board.swimlaneId, lockedListId, 0])).toBe('not-authorized');
  expect(cardsIn(lockedListId)).toBe(before);

  // Negative: the same member works in the open list...
  expect((await request.post(`${path}/labels`, json(user2.token, { cardIds: [open._id], addLabelIds: [labelId] }))).status()).toBe(200);
  expect(db.findOne('cards', { _id: open._id }).labelIds).toContain(labelId);
  expect(await call('copyCard', [open._id, board.boardId, board.swimlaneId, openListId, false, {}])).toBe('ok');
  expect(await call('archiveSelectedCards', [board.boardId, [open._id]])).toBe('ok');
  // ...and the board admin deletes in the locked one.
  const adminDel = await request.delete(`${path}/bulk`, json(user.token, { cardIds: [locked._id] }));
  expect(adminDel.status()).toBe(200);
  expect((await adminDel.json()).deleted).toEqual([locked._id]);
});
