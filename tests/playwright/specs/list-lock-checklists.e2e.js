'use strict';
// ListLockBleed (GHSA-4734-8vrg-8j3w): a list whose exception refuses a role
// write (#4527) refuses that role's checklist and checklist-item writes over
// REST too, and the attempt is in Admin Panel -> Problems. A list without the
// refusal still takes the same writes.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('a list refusing a role write refuses its checklist REST writes (ListLockBleed)', async ({ request, board, user, user2 }) => {
  const original = db.getBoard(board.boardId).members;
  const [lockedListId, openListId] = board.listIds;
  const card = id => db.find('cards', { boardId: board.boardId, listId: id })[0];
  const locked = card(lockedListId), open = card(openListId);
  const api = (method, url, data) => request[method](url, {
    headers: { Authorization: `Bearer ${user2.token}`, 'Content-Type': 'application/json' }, ...(data ? { data } : {}) });
  const recorded = () => db.findOne('eventlog', { bleed: 'ListLockBleed' })?.count || 0;
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: [...original.filter(m => m.userId !== user2.id),
    { userId: user2.id, isActive: true, isAdmin: false }] } });
  db.updateOne('lists', { _id: lockedListId }, { $set: { roleExceptions: { normal: { write: false } } } });
  const checklist = { _id: db.uid('locked-checklist'), cardId: locked._id, title: 'Locked', sort: 0 };
  const item = { _id: db.uid('locked-item'), cardId: locked._id, checklistId: checklist._id, title: 'Locked item', sort: 0, isFinished: false };
  db.insertOne('checklists', checklist);
  db.insertOne('checklistItems', item);
  try {
    const before = recorded();
    const base = `/api/boards/${board.boardId}/cards/${locked._id}/checklists`;
    for (const [method, url, data] of [
      ['post', base, { title: 'x' }],
      ['put', `${base}/${checklist._id}`, { title: 'renamed' }],
      ['post', `${base}/${checklist._id}/items`, { title: 'new item' }],
      ['put', `${base}/${checklist._id}/items/${item._id}`, { isFinished: 'true', title: 'changed' }],
      ['delete', `${base}/${checklist._id}/items/${item._id}`],
      ['delete', `${base}/${checklist._id}`],
    ]) {
      const res = await api(method, url, data);
      expect(res.status(), `${method.toUpperCase()} ${url}`).toBe(403);
    }
    expect(db.find('checklists', { cardId: locked._id })).toEqual([expect.objectContaining({ _id: checklist._id, title: 'Locked' })]);
    expect(db.find('checklistItems', { cardId: locked._id })).toEqual([expect.objectContaining({ _id: item._id, title: 'Locked item', isFinished: false })]);
    expect(recorded()).toBeGreaterThan(before);
    expect(db.findOne('users', { _id: user2.id }).loginDisabled || false).toBe(false);

    // Negative: the same member writes the checklists of a list without the refusal.
    const made = await api('post', `/api/boards/${board.boardId}/cards/${open._id}/checklists`, { title: 'Open', items: ['one'] });
    expect(made.status()).toBe(200);
    const openId = (await made.json())._id;
    expect((await api('put', `/api/boards/${board.boardId}/cards/${open._id}/checklists/${openId}`, { title: 'Open renamed' })).status()).toBe(200);
    expect((await api('delete', `/api/boards/${board.boardId}/cards/${open._id}/checklists/${openId}`)).status()).toBe(200);
    // And the board admin, whom no list exception binds, writes the locked list's.
    const admin = await request.post(base, { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' }, data: { title: 'Admin' } });
    expect(admin.status()).toBe(200);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original } });
    db.updateOne('lists', { _id: lockedListId }, { $unset: { roleExceptions: '' } });
    db.deleteMany('checklists', { cardId: { $in: [locked._id, open._id] } });
    db.deleteMany('checklistItems', { cardId: { $in: [locked._id, open._id] } });
  }
});
