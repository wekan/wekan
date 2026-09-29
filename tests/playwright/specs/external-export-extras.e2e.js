'use strict';
// Export to other tools carries a card's comments and checklists when
// selected, from the real server - including Kanboard, which moved onto the
// shared export route.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('Kanboard and Asana exports carry comments and checklists, and the selection removes them', async ({ request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const checklistId = db.uid('cl');
  db.insertOne('card_comments', { _id: db.uid('cm'), boardId: board.boardId, cardId: card._id, userId: user.id,
    text: 'Exported comment', createdAt: new Date('2026-09-02T00:00:00Z'), modifiedAt: new Date() });
  db.insertOne('checklists', { _id: checklistId, cardId: card._id, title: 'Steps', sort: 0, createdAt: new Date(), modifiedAt: new Date() });
  db.insertOne('checklistItems', { _id: db.uid('ci'), checklistId, cardId: card._id, title: 'Check valve', isFinished: true, sort: 0,
    createdAt: new Date(), modifiedAt: new Date() });
  const get = async (format, fields) => {
    const query = `authToken=${encodeURIComponent(user.token)}${fields ? `&fields=${fields}` : ''}`;
    const res = await request.get(`/api/boards/${board.boardId}/export/${format}?${query}`);
    expect(res.status()).toBe(200);
    return res.json();
  };

  const kanboard = await get('kanboard');
  const task = kanboard.tasks.find(t => t.title === 'Alpha Card');
  expect(task.comments).toEqual([expect.objectContaining({ comment: 'Exported comment' })]);
  expect(task.subtasks).toEqual([{ title: 'Check valve', status: 2 }]);

  const asana = await get('asana');
  const asanaTask = asana.data.find(t => t.name === 'Alpha Card');
  expect(asanaTask.stories.map(s => s.text)).toEqual(['Exported comment']);
  expect(asanaTask.subtasks).toEqual([{ name: 'Check valve', completed: true }]);

  // Negative: without comments and checklists in the selection, neither is there.
  const selected = await get('kanboard', 'description,labels');
  const bare = selected.tasks.find(t => t.title === 'Alpha Card');
  expect(bare.comments).toBeUndefined();
  expect(bare.subtasks).toBeUndefined();
});
