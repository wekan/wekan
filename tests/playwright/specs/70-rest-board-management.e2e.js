'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
test('normal member cannot rename a board through REST', async ({ request, user, board }) => {
  const original = db.getBoard(board.boardId);
  const members = original.members.map(member => member.userId === user.id
    ? { userId: user.id, isActive: true } : member);
  db.updateOne('boards', { _id: board.boardId }, { $set: { members } });
  try {
    const response = await request.put(`${BASE_URL}/api/boards/${board.boardId}/title`, {
      headers: { 'X-User-Id': user.id, 'X-Auth-Token': user.token },
      data: { title: 'Unauthorized rename' },
    });
    expect(response.status()).toBe(403);
    expect(db.getBoard(board.boardId).title).toBe(original.title);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original.members } });
  }
});
