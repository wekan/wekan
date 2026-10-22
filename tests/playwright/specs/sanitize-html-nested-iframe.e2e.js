'use strict';
// GHSA-c9rx-x947-fp3h: sanitize-html 2.18.0 overflowed the stack on nested
// <iframe>. secureTransfer sanitizes every import and export, and a throw there
// is recorded as a high "blocked" event that disables the user's account, so a
// card planted with the payload locked out whoever exported the board next.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const PAYLOAD = '<iframe>'.repeat(20000);
const auth = (token, json) => ({ Authorization: `Bearer ${token}`, ...(json ? { 'Content-Type': 'application/json' } : {}) });

test('a board whose card holds nested iframes exports and imports, and nobody is locked out', async ({ request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId });
  db.updateOne('cards', { _id: card._id }, { $set: { description: PAYLOAD } });

  const exported = await request.get(`/api/boards/${board.boardId}/export`, { headers: auth(user.token) });
  expect(exported.status()).toBe(200);
  const json = await exported.json();
  const exportedCard = json.cards.find(c => c._id === card._id);
  expect(exportedCard.description).not.toMatch(/<iframe/i);

  json.title = PAYLOAD;
  const imported = await request.post('/api/boards/import', { headers: auth(user.token, true), data: { board: json } });
  expect(imported.status()).toBe(200);
  const { _id: newBoardId } = await imported.json();

  expect(db.findOne('users', { _id: user.id })?.loginDisabled).not.toBe(true);
  expect(db.find('eventlog', { stream: 'security', bleed: 'ImportExportValidation', userId: user.id })).toHaveLength(0);
  db.cleanup({ boardIds: [newBoardId] });
});
