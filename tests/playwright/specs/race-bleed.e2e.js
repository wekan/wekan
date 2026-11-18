'use strict';

/**
 * RaceBleed (GHSA-3vjg-3p4q-8fwh): a card DELETE racing a move to another
 * board must never leave the card alive without its children.
 *
 * The REST card delete destroyed the card's checklists, checklist items,
 * comments and attachments by cardId FIRST, and removed the card itself last,
 * keyed on the board the caller was authorised for. A move landing in between
 * left the card on the other board, stripped of every child, with both
 * requests answering 200. Now the card's own removal is the claim: exactly one
 * of the two requests wins, and its result is consistent either way.
 *
 * Timing decides which request wins a round, so the assertion is the
 * invariant, not the winner: a card that is still stored still has its
 * checklist and item, and a card that is gone took them with it.
 *
 * Requires the API server (WITH_API=true), like spec 17.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const ROUNDS = 12;

function authHeaders(token, json = false) {
  const h = { Authorization: `Bearer ${token}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

// A card on board A with one checklist holding one item.
function seedCardWithChecklist(board, round) {
  const cardId = db.uid('card');
  const checklistId = db.uid('checklist');
  const itemId = db.uid('item');
  const now = new Date();
  db.insertOne('cards', {
    _id: cardId, title: `Race ${round}`, boardId: board.boardId, listId: board.listIds[0],
    swimlaneId: board.swimlaneId, type: 'cardType-card', archived: false, parentId: '',
    members: [], labelIds: [], customFields: [], assignees: [], userId: board.owner.id,
    sort: 1000 + round, createdAt: now, modifiedAt: now, dateLastActivity: now,
  });
  db.insertOne('checklists', { _id: checklistId, cardId, boardId: board.boardId, title: 'Keep me', sort: 0, createdAt: now, modifiedAt: now });
  db.insertOne('checklistItems', { _id: itemId, checklistId, cardId, boardId: board.boardId, title: 'Marked item', sort: 0, isFinished: false, createdAt: now, modifiedAt: now });
  return { cardId, checklistId, itemId };
}

test.describe('RaceBleed: card DELETE racing a cross-board move', () => {
  test('negative: a card already moved away keeps its checklist, and the DELETE via the old board is 404', async ({ request, user, board }) => {
    const other = db.seedBoard({ ownerId: user.id, listCount: 1 });
    try {
      const { cardId, checklistId, itemId } = seedCardWithChecklist({ ...board, owner: user }, 0);
      db.updateOne('cards', { _id: cardId }, { $set: { boardId: other.boardId, listId: other.listIds[0], swimlaneId: other.swimlaneId } });

      const res = await request.delete(`/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards/${cardId}`, { headers: authHeaders(user.token) });
      expect(res.status()).toBe(404);
      expect(db.findOne('cards', { _id: cardId })).toBeTruthy();
      expect(db.findOne('checklists', { _id: checklistId })).toBeTruthy();
      expect(db.findOne('checklistItems', { _id: itemId })).toBeTruthy();
    } finally {
      db.cleanup({ boardIds: [other.boardId] });
    }
  });

  test('negative: a member deleting a card somebody had just moved away is refused, and keeps their account', async ({ request, user, user2, board }) => {
    // The delete arrived after a completed REST move: a stale view, not an
    // attack. It is refused (404) and recorded as RaceBleed, which never
    // disables the account - PurgeBleed's critical record would have.
    const other = db.seedBoard({ ownerId: user.id, listCount: 1 });
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    try {
      const { cardId, checklistId } = seedCardWithChecklist({ ...board, owner: user }, 0);
      const url = `/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards/${cardId}`;
      const moveRes = await request.put(url, {
        headers: authHeaders(user.token, true),
        data: { newBoardId: other.boardId, newSwimlaneId: other.swimlaneId, newListId: other.listIds[0] },
      });
      expect(moveRes.status()).toBe(200);
      const deleteRes = await request.delete(url, { headers: authHeaders(user2.token) });
      expect(deleteRes.status()).toBe(404);
      expect(db.findOne('checklists', { _id: checklistId })).toBeTruthy();
      expect(db.findOne('users', { _id: user2.id }).loginDisabled || false).toBe(false);
      const again = await request.get(`/api/boards/${board.boardId}`, { headers: authHeaders(user2.token) });
      expect(again.status()).toBe(200);
    } finally {
      db.cleanup({ boardIds: [other.boardId] });
    }
  });

  // As the report's proof of concept: the board admin moves the card to a board
  // of their own while another member of the source board deletes it, each with
  // their own token. A fresh member each round keeps the rounds independent.
  test('a DELETE racing a move never leaves a card without its checklist', async ({ request, user, board }) => {
    const other = db.seedBoard({ ownerId: user.id, listCount: 1 });
    const members = [];
    try {
      let survived = 0;
      let deleted = 0;
      for (let round = 1; round <= ROUNDS; round += 1) {
        const member = db.seedUser();
        members.push(member.id);
        db.addBoardMember({ boardId: board.boardId, userId: member.id });
        const { cardId, checklistId, itemId } = seedCardWithChecklist({ ...board, owner: user }, round);
        const url = `/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards/${cardId}`;
        const [moveRes, deleteRes] = await Promise.all([
          request.put(url, {
            headers: authHeaders(user.token, true),
            data: { newBoardId: other.boardId, newSwimlaneId: other.swimlaneId, newListId: other.listIds[0] },
          }),
          request.delete(url, { headers: authHeaders(member.token) }),
        ]);
        expect([200, 404]).toContain(deleteRes.status());
        // The move that lost to the delete matched nothing: 404, never a 500.
        expect([200, 404]).toContain(moveRes.status());
        expect(deleteRes.status() === 200 && moveRes.status() === 200, `round ${round}: both claimed to win`).toBe(false);

        const card = db.findOne('cards', { _id: cardId });
        if (card) {
          survived += 1;
          expect(deleteRes.status(), `round ${round}: the delete reported success for a card that stayed`).toBe(404);
          expect(db.findOne('checklists', { _id: checklistId }), `round ${round}: checklist lost`).toBeTruthy();
          expect(db.findOne('checklistItems', { _id: itemId }), `round ${round}: item lost`).toBeTruthy();
        } else {
          deleted += 1;
          expect(db.findOne('checklists', { _id: checklistId })).toBeFalsy();
          expect(db.findOne('checklistItems', { _id: itemId })).toBeFalsy();
        }
      }
      expect(survived + deleted).toBe(ROUNDS);
    } finally {
      db.cleanup({ boardIds: [other.boardId], userIds: members });
    }
  });
});
