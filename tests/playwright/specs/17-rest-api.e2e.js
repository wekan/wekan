'use strict';

/**
 * Spec 17 — REST API: data correctness + permissions
 *
 * Exercises the REST API end-to-end (real Bearer-token auth → real HTTP request
 * → MongoDB change verified directly) for the endpoints added/changed in this
 * release. Covers BOTH that each endpoint changes the correct data AND that it
 * enforces the correct permissions:
 *
 *  - #4743  bulk create / bulk delete cards
 *  - #5813  card numbers stay unique (incl. bulk create)
 *  - #5819  bulk add/remove labels (merge), BoardAdmin-gated label creation
 *  - #5998  add board member with a named role; add/remove card member (validated)
 *  - #5846  add / clear card dates
 *  - #5897  create linked card
 *  - copy a card to a 0-based position (deep copy)
 *  - #3062  board card settings GET/PUT
 *  - #4815  GET /api/user/cards (My Cards / Due Cards)
 *
 * The API requires WITH_API=true (the rebuild-wekan.sh "Run tests" server sets it).
 * The Bearer token is the user's MongoDB resume token (seedUser returns the raw
 * token, whose sha256 matches Accounts._hashLoginToken on the server).
 *
 * Assertions use Playwright's expect() (toBe/toContain/toHaveLength/...), matching
 * the other specs in this directory.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

// --- small API helper ------------------------------------------------------
function authHeaders(token, json = false) {
  const h = { Authorization: `Bearer ${token}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

// List non-archived cards in a list, straight from MongoDB.
function listCards(boardId, listId) {
  return db.find('cards', { boardId, listId, archived: false });
}

function allBoardCards(boardId) {
  return db.find('cards', { boardId });
}

// Create a label on the board via the API (admin only) and return its id.
async function createLabel(request, token, boardId, name, color) {
  const res = await request.put(`/api/boards/${boardId}/labels`, {
    headers: authHeaders(token, true),
    data: { label: { name, color } },
  });
  expect(res.status(), `create label ${name}`).toBe(200);
  // PUT /labels returns the new labelId as the JSON body (a bare string).
  return JSON.parse(await res.text());
}

test.describe('REST API: data + permissions', () => {
  // ---- #4743 / #5813: bulk create, uniqueness, bulk delete ----------------
  test('#4743/#5813 bulk create assigns unique card numbers, bulk delete removes them', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const cards = Array.from({ length: 8 }, (_, i) => ({ title: `Bulk ${i}` }));

    const createRes = await request.post(
      `/api/boards/${board.boardId}/lists/${listId}/cards/bulk`,
      { headers: authHeaders(user.token, true), data: { authorId: user.id, swimlaneId: board.swimlaneId, cards } },
    );
    expect(createRes.status()).toBe(200);
    const created = await createRes.json();
    const createdIds = created.filter(r => r._id).map(r => r._id);
    expect(createdIds).toHaveLength(8);

    // Data correctness: 8 new cards now exist in the list, all on the board.
    const after = listCards(board.boardId, listId);
    const afterIds = after.map(c => c._id);
    createdIds.forEach(id => expect(afterIds).toContain(id));

    // #5813: every card number on the board is unique (no duplicates from the burst).
    const numbers = allBoardCards(board.boardId).map(c => c.cardNumber);
    expect(new Set(numbers).size).toBe(numbers.length);

    // #4743 bulk delete.
    const delRes = await request.delete(`/api/boards/${board.boardId}/cards/bulk`, {
      headers: authHeaders(user.token, true),
      data: { cardIds: createdIds },
    });
    expect(delRes.status()).toBe(200);
    const delBody = await delRes.json();
    expect(delBody.deleted).toHaveLength(8);

    const remainingIds = listCards(board.boardId, listId).map(c => c._id);
    createdIds.forEach(id => expect(remainingIds).not.toContain(id));
  });

  test('#4743 bulk create rejects an oversized array (>500)', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const cards = Array.from({ length: 501 }, (_, i) => ({ title: `x${i}` }));
    const res = await request.post(
      `/api/boards/${board.boardId}/lists/${listId}/cards/bulk`,
      { headers: authHeaders(user.token, true), data: { authorId: user.id, swimlaneId: board.swimlaneId, cards } },
    );
    expect(res.status()).toBe(400);
  });

  // ---- #5819: bulk label merge + BoardAdmin gating ------------------------
  test('#5819 bulk labels merge (add keeps existing, remove drops, dedupe)', async ({ request, user, board }) => {
    const labelA = await createLabel(request, user.token, board.boardId, 'A', 'green');
    const labelB = await createLabel(request, user.token, board.boardId, 'B', 'red');

    const cardIds = listCards(board.boardId, board.listIds[0]).map(c => c._id)
      .concat(listCards(board.boardId, board.listIds[1]).map(c => c._id));
    expect(cardIds.length).toBeGreaterThan(0);

    // Add labelA to all cards.
    let res = await request.post(`/api/boards/${board.boardId}/cards/labels`, {
      headers: authHeaders(user.token, true),
      data: { cardIds, addLabelIds: [labelA] },
    });
    expect(res.status()).toBe(200);
    cardIds.forEach(id => expect(db.getCard(id).labelIds).toContain(labelA));

    // Add labelB and remove labelA in one call — merge, not replace.
    res = await request.post(`/api/boards/${board.boardId}/cards/labels`, {
      headers: authHeaders(user.token, true),
      data: { cardIds, addLabelIds: [labelB], removeLabelIds: [labelA] },
    });
    expect(res.status()).toBe(200);
    cardIds.forEach(id => {
      const labels = db.getCard(id).labelIds;
      expect(labels).toContain(labelB);
      expect(labels).not.toContain(labelA);
    });

    // Adding the same label twice does not duplicate it.
    await request.post(`/api/boards/${board.boardId}/cards/labels`, {
      headers: authHeaders(user.token, true),
      data: { cardIds: [cardIds[0]], addLabelIds: [labelB] },
    });
    const dedup = db.getCard(cardIds[0]).labelIds.filter(l => l === labelB);
    expect(dedup).toHaveLength(1);
  });

  test('#5819 bulk labels rejects a label not on the board', async ({ request, user, board }) => {
    const cardIds = listCards(board.boardId, board.listIds[0]).map(c => c._id);
    const res = await request.post(`/api/boards/${board.boardId}/cards/labels`, {
      headers: authHeaders(user.token, true),
      data: { cardIds, addLabelIds: ['does-not-exist'] },
    });
    expect(res.status()).toBe(400);
  });

  test('#5819 label creation is BoardAdmin-gated (non-admin member denied)', async ({ request, user, user2, board }) => {
    // user2 is a NON-admin member of the board.
    db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
    const before = db.getBoard(board.boardId).labels || [];

    const res = await request.put(`/api/boards/${board.boardId}/labels`, {
      headers: authHeaders(user2.token, true),
      data: { label: { name: 'Sneaky', color: 'blue' } },
      failOnStatusCode: false,
    });

    // The non-admin member is denied (403) and no new label was created.
    expect(res.status()).toBe(403);
    const after = db.getBoard(board.boardId).labels || [];
    expect(after.length).toBe(before.length);
  });

  // ---- #5998: board member role + card member validation -----------------
  test('#5998 add board member with named role=admin sets isAdmin', async ({ request, user, user2, board }) => {
    const res = await request.post(`/api/boards/${board.boardId}/members/${user2.id}/add`, {
      headers: authHeaders(user.token, true),
      data: { action: 'add', role: 'admin' },
    });
    expect(res.status()).toBe(200);
    const member = (db.getBoard(board.boardId).members || []).find(m => m.userId === user2.id);
    expect(member).toBeTruthy();
    expect(member.isActive).toBe(true);
    expect(member.isAdmin).toBe(true); // role=admin maps to isAdmin
  });

  test('#5998 add board member rejects an invalid role', async ({ request, user, user2, board }) => {
    const res = await request.post(`/api/boards/${board.boardId}/members/${user2.id}/add`, {
      headers: authHeaders(user.token, true),
      data: { action: 'add', role: 'superuser' },
    });
    expect(res.status()).toBe(400);
  });

  test('#5998 adding a board member requires board admin (non-admin member denied)', async ({ request, user2, board }) => {
    // user2 is only a NON-admin member of the board.
    db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
    const before = (db.getBoard(board.boardId).members || []).length;
    const res = await request.post(`/api/boards/${board.boardId}/members/some-other-user/add`, {
      headers: authHeaders(user2.token, true),
      data: { action: 'add', role: 'normal' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(403);
    // No member was added.
    expect((db.getBoard(board.boardId).members || []).length).toBe(before);
  });

  test('#5998 add card member: board member allowed, non-member rejected', async ({ request, user, user2, board }) => {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
    const listId = board.listIds[0];
    const cardId = listCards(board.boardId, listId)[0]._id;

    // Adding a board member works and updates the card's members.
    let res = await request.post(
      `/api/boards/${board.boardId}/lists/${listId}/cards/${cardId}/members/${user2.id}`,
      { headers: authHeaders(user.token) },
    );
    expect(res.status()).toBe(200);
    expect(db.getCard(cardId).members).toContain(user2.id);

    // Adding a NON board member is rejected (400) and does not change the card.
    res = await request.post(
      `/api/boards/${board.boardId}/lists/${listId}/cards/${cardId}/members/not-a-member`,
      { headers: authHeaders(user.token) },
    );
    expect(res.status()).toBe(400);
    expect(db.getCard(cardId).members).not.toContain('not-a-member');

    // Removing the member works.
    res = await request.delete(
      `/api/boards/${board.boardId}/lists/${listId}/cards/${cardId}/members/${user2.id}`,
      { headers: authHeaders(user.token) },
    );
    expect(res.status()).toBe(200);
    expect(db.getCard(cardId).members).not.toContain(user2.id);
  });

  // ---- #5846: add / clear card date --------------------------------------
  test('#5846 set then clear a card due date', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const cardId = listCards(board.boardId, listId)[0]._id;
    const base = `/api/boards/${board.boardId}/lists/${listId}/cards/${cardId}`;

    let res = await request.put(base, {
      headers: authHeaders(user.token, true),
      data: { dueAt: '2026-06-07T12:00:00.000Z' },
    });
    expect(res.status()).toBe(200);
    expect(db.getCard(cardId).dueAt).toBeTruthy();

    // Empty string clears it (the #5846 fix).
    res = await request.put(base, { headers: authHeaders(user.token, true), data: { dueAt: '' } });
    expect(res.status()).toBe(200);
    expect(db.getCard(cardId).dueAt == null).toBe(true);
  });

  // ---- #3697: clearing card members/assignees over REST stores [] not null --
  test('#3697 clearing members via REST stores an array, never null', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const cardId = listCards(board.boardId, listId)[0]._id;
    const base = `/api/boards/${board.boardId}/lists/${listId}/cards/${cardId}`;

    // Set a member via card PUT.
    let res = await request.put(base, {
      headers: authHeaders(user.token, true),
      data: { members: [user.id] },
    });
    expect(res.status()).toBe(200);
    expect(db.getCard(cardId).members).toEqual([user.id]);

    // Clearing with an empty string removes the last member and stores [] — the
    // #3697 fix. Before, this was a no-op (truthiness guard) or stored null,
    // which then broke editing the card's members in the UI.
    res = await request.put(base, { headers: authHeaders(user.token, true), data: { members: '' } });
    expect(res.status()).toBe(200);
    let card = db.getCard(cardId);
    expect(Array.isArray(card.members)).toBe(true);
    expect(card.members).toEqual([]);
    expect(card.members).not.toBe(null);

    // Clearing with null likewise yields [] (not null).
    await request.put(base, { headers: authHeaders(user.token, true), data: { members: [user.id] } });
    res = await request.put(base, { headers: authHeaders(user.token, true), data: { members: null } });
    expect(res.status()).toBe(200);
    card = db.getCard(cardId);
    expect(Array.isArray(card.members)).toBe(true);
    expect(card.members).toEqual([]);

    // Same guarantee for assignees.
    await request.put(base, { headers: authHeaders(user.token, true), data: { assignees: [user.id] } });
    expect(db.getCard(cardId).assignees).toEqual([user.id]);
    res = await request.put(base, { headers: authHeaders(user.token, true), data: { assignees: '' } });
    expect(res.status()).toBe(200);
    card = db.getCard(cardId);
    expect(Array.isArray(card.assignees)).toBe(true);
    expect(card.assignees).toEqual([]);
  });

  // ---- #2875: create a card with no member over REST -----------------------
  test('#2875 create a card with no / empty members stores [] not null', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const base = `/api/boards/${board.boardId}/lists/${listId}/cards`;

    // No members field at all → schema default [] applies; card is created.
    let res = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: { authorId: user.id, swimlaneId: board.swimlaneId, title: 'No members' },
    });
    expect(res.status()).toBe(200);
    let card = db.getCard((await res.json())._id);
    expect(Array.isArray(card.members)).toBe(true);
    expect(card.members).toEqual([]);

    // Explicit null / "" clear to [] (never null), like the PUT handler (#3697).
    for (const empty of [null, '']) {
      res = await request.post(base, {
        headers: authHeaders(user.token, true),
        data: { authorId: user.id, swimlaneId: board.swimlaneId, title: `Empty ${empty}`, members: empty, assignees: empty },
      });
      expect(res.status()).toBe(200);
      card = db.getCard((await res.json())._id);
      expect(Array.isArray(card.members)).toBe(true);
      expect(card.members).toEqual([]);
      expect(card.members).not.toBe(null);
      expect(Array.isArray(card.assignees)).toBe(true);
      expect(card.assignees).toEqual([]);
    }

    // A single member id is wrapped into an array.
    res = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: { authorId: user.id, swimlaneId: board.swimlaneId, title: 'One member', members: user.id },
    });
    expect(res.status()).toBe(200);
    expect(db.getCard((await res.json())._id).members).toEqual([user.id]);

    // Bulk create with empty members likewise stores [].
    res = await request.post(`${base}/bulk`, {
      headers: authHeaders(user.token, true),
      data: { authorId: user.id, swimlaneId: board.swimlaneId, cards: [{ title: 'Bulk no members', members: null }] },
    });
    expect(res.status()).toBe(200);
    const bulkCards = listCards(board.boardId, listId).filter(c => c.title === 'Bulk no members');
    expect(bulkCards.length).toBe(1);
    expect(bulkCards[0].members).toEqual([]);
  });

  // ---- #5650: board created via REST is owned by (and visible to) caller ----
  test('#5650 board created via REST without owner is owned by the caller', async ({ request, user }) => {
    const created = [];
    try {
      // No `owner` in the body → must default to the authenticated caller, so the
      // board's only member has a real userId and the boards publication can match
      // it. Before the fix this stored userId=undefined, so the board existed via
      // the API but was invisible in the browser UI.
      let res = await request.post('/api/boards', {
        headers: authHeaders(user.token, true),
        data: { title: 'API board no owner' },
      });
      expect(res.status()).toBe(200);
      const id1 = (await res.json())._id;
      created.push(id1);
      const board1 = db.getBoard(id1);
      expect(board1.members.length).toBe(1);
      expect(board1.members[0].userId).toBe(user.id);
      expect(board1.members[0].isActive).toBe(true);
      expect(board1.members[0].isAdmin).toBe(true);

      // An explicit owner still works.
      res = await request.post('/api/boards', {
        headers: authHeaders(user.token, true),
        data: { title: 'API board with owner', owner: user.id },
      });
      expect(res.status()).toBe(200);
      const id2 = (await res.json())._id;
      created.push(id2);
      expect(db.getBoard(id2).members[0].userId).toBe(user.id);
    } finally {
      db.cleanup({ boardIds: created });
    }
  });

  // ---- #5166: copying a card cross-board re-homes its comments --------------
  test('copying a card cross-board re-homes its subtasks onto the destination board', async ({ request, user, board }) => {
    const srcListId = board.listIds[0];
    const srcCardId = listCards(board.boardId, srcListId)[0]._id;

    // A subtask is a card with parentId = the source card.
    db.insertOne('cards', {
      _id: db.uid('sub'), boardId: board.boardId, swimlaneId: board.swimlaneId,
      listId: srcListId, parentId: srcCardId, title: 'subtask', sort: 0,
      userId: user.id, archived: false, createdAt: new Date(), dateLastActivity: new Date(),
    });

    const dest = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['x']] });
    try {
      const res = await request.post(
        `/api/boards/${board.boardId}/lists/${srcListId}/cards/${srcCardId}/copy`,
        { headers: authHeaders(user.token, true), data: { toBoardId: dest.boardId, toSwimlaneId: dest.swimlaneId, toListId: dest.listIds[0] } },
      );
      expect(res.status()).toBe(200);
      const newCardId = (await res.json())._id;

      // The copied subtask is on the destination board, not the source board.
      const copiedSubs = db.find('cards', { parentId: newCardId });
      expect(copiedSubs.length).toBe(1);
      expect(copiedSubs[0].boardId).toBe(dest.boardId);
      expect(copiedSubs[0].boardId).not.toBe(board.boardId);
      // The original subtask is untouched on the source board.
      expect(db.find('cards', { parentId: srcCardId }).every(c => c.boardId === board.boardId)).toBe(true);
    } finally {
      db.cleanup({ boardIds: [dest.boardId] });
    }
  });

  test('#5166 copied comments get the destination boardId and keep their author', async ({ request, user, user2, board }) => {
    const srcListId = board.listIds[0];
    const srcCardId = listCards(board.boardId, srcListId)[0]._id;

    // A comment on the source card, authored by a DIFFERENT user.
    const commentId = db.uid('cmt');
    db.insertOne('card_comments', {
      _id: commentId,
      boardId: board.boardId,
      cardId: srcCardId,
      userId: user2.id,
      text: 'original author comment',
      createdAt: new Date(),
      modifiedAt: new Date(),
    });

    // Destination board owned by the same user (so the copy has write access).
    const dest = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['x']] });
    try {
      const res = await request.post(
        `/api/boards/${board.boardId}/lists/${srcListId}/cards/${srcCardId}/copy`,
        {
          headers: authHeaders(user.token, true),
          data: { toBoardId: dest.boardId, toSwimlaneId: dest.swimlaneId, toListId: dest.listIds[0] },
        },
      );
      expect(res.status()).toBe(200);
      const newCardId = (await res.json())._id;
      expect(newCardId).toBeTruthy();

      // The copied comment belongs to the destination board, not the source —
      // and its original author is preserved.
      const copied = db.find('card_comments', { cardId: newCardId });
      expect(copied.length).toBe(1);
      expect(copied[0].boardId).toBe(dest.boardId);
      expect(copied[0].boardId).not.toBe(board.boardId);
      expect(copied[0].userId).toBe(user2.id);
    } finally {
      db.cleanup({ boardIds: [dest.boardId] });
    }
  });

  // ---- #5688: copying a card duplicates all its checklist items -------------
  test('#5688 copying a card copies its checklist and all items', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const cardId = listCards(board.boardId, listId)[0]._id;

    // Seed a checklist with several items on the source card.
    const checklistId = db.uid('cl');
    db.insertOne('checklists', {
      _id: checklistId, boardId: board.boardId, cardId, title: 'CL', sort: 0,
      createdAt: new Date(), modifiedAt: new Date(),
    });
    const itemCount = 6;
    for (let i = 0; i < itemCount; i++) {
      db.insertOne('checklistItems', {
        _id: db.uid('cli'), boardId: board.boardId, cardId, checklistId,
        title: `item ${i}`, sort: i, isFinished: i % 2 === 0,
        createdAt: new Date(), modifiedAt: new Date(),
      });
    }

    const created = [];
    try {
      const res = await request.post(
        `/api/boards/${board.boardId}/lists/${listId}/cards/${cardId}/copy`,
        { headers: authHeaders(user.token, true), data: { toSwimlaneId: board.swimlaneId, toListId: listId } },
      );
      expect(res.status()).toBe(200);
      const newCardId = (await res.json())._id;
      expect(newCardId).toBeTruthy();
      created.push(newCardId);

      // The copied card has exactly one checklist and all its items, on this board.
      const newChecklists = db.find('checklists', { cardId: newCardId });
      expect(newChecklists.length).toBe(1);
      expect(newChecklists[0].boardId).toBe(board.boardId);
      const newItems = db.find('checklistItems', { cardId: newCardId });
      expect(newItems.length).toBe(itemCount);
      expect(newItems.every(it => it.checklistId === newChecklists[0]._id)).toBe(true);
      expect(newItems.every(it => it.boardId === board.boardId)).toBe(true);
    } finally {
      // The copied card is on the same board (cleaned by the board fixture); drop
      // any leftover docs defensively.
      created.forEach(id => {
        db.deleteMany('checklistItems', { cardId: id });
        db.deleteMany('checklists', { cardId: id });
        db.deleteMany('cards', { _id: id });
      });
    }
  });

  // ---- #3252/#5322: deleting a card cascades + clears its activities --------
  test('#3252 deleting a card removes its children and clears its activities', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const cardId = listCards(board.boardId, listId)[0]._id;
    const seed = (coll, extra) => {
      const _id = db.uid('seed');
      db.insertOne(coll, { _id, boardId: board.boardId, cardId, createdAt: new Date(), modifiedAt: new Date(), ...extra });
      return _id;
    };

    const checklistId = seed('checklists', { title: 'CL' });
    seed('checklistItems', { title: 'item', checklistId });
    const commentId = seed('card_comments', { userId: user.id, text: 'hi' });
    // Pre-existing activities for the card, like real create/comment activity.
    seed('activities', { userId: user.id, activityType: 'addComment', commentId });
    seed('activities', { userId: user.id, activityType: 'createCard' });

    const res = await request.delete(
      `/api/boards/${board.boardId}/lists/${listId}/cards/${cardId}`,
      { headers: authHeaders(user.token, true), data: { authorId: user.id } },
    );
    expect(res.status()).toBe(200);

    // Card and all of its children are gone.
    expect(db.getCard(cardId)).toBe(null);
    expect(db.find('checklists', { cardId }).length).toBe(0);
    expect(db.find('checklistItems', { cardId }).length).toBe(0);
    expect(db.find('card_comments', { cardId }).length).toBe(0);

    // The card's pre-existing activities are cleaned up in one bulk op; only the
    // deleteCard activity (kept for the outgoing webhook) remains. Before the fix
    // the seeded activities survived (and per-child delete activities were added),
    // so this also acts as the negative test.
    const acts = db.find('activities', { cardId });
    expect(acts.length).toBe(1);
    expect(acts[0].activityType).toBe('deleteCard');
  });

  // ---- #5592 / #5627: copying a board copies its webhooks and rules --------
  test('#5592/#5627 copying a board copies its webhooks and rules', async ({ request, user, board }) => {
    db.insertOne('integrations', {
      _id: db.uid('intg'), boardId: board.boardId, userId: user.id,
      title: 'hook', type: 'outgoing-webhooks', url: 'https://example.com/hook',
      token: 'tok', activities: ['all'], enabled: true,
      createdAt: new Date(), modifiedAt: new Date(),
    });
    const actionId = db.uid('act');
    db.insertOne('actions', { _id: actionId, boardId: board.boardId, actionType: 'moveCardToTop', listName: '*', swimlaneName: '*', createdAt: new Date(), modifiedAt: new Date() });
    const triggerId = db.uid('trg');
    db.insertOne('triggers', { _id: triggerId, boardId: board.boardId, activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*', createdAt: new Date(), modifiedAt: new Date() });
    db.insertOne('rules', { _id: db.uid('rule'), boardId: board.boardId, title: 'r', triggerId, actionId, createdAt: new Date(), modifiedAt: new Date() });

    const created = [];
    try {
      const res = await request.post(`/api/boards/${board.boardId}/copy`, {
        headers: authHeaders(user.token, true),
        data: { title: 'Copied board' },
      });
      expect(res.status()).toBe(200);
      const newBoardId = await res.json();
      expect(typeof newBoardId).toBe('string');
      created.push(newBoardId);

      // #5592: the webhook is copied onto the new board.
      const intgs = db.find('integrations', { boardId: newBoardId });
      expect(intgs.length).toBe(1);
      expect(intgs[0].url).toBe('https://example.com/hook');

      // #5627: the rule (+ trigger + action) is copied onto the new board, with
      // the rule's triggerId/actionId remapped to the copied docs.
      const newRules = db.find('rules', { boardId: newBoardId });
      const newActions = db.find('actions', { boardId: newBoardId });
      const newTriggers = db.find('triggers', { boardId: newBoardId });
      expect(newRules.length).toBe(1);
      expect(newActions.length).toBe(1);
      expect(newTriggers.length).toBe(1);
      expect(newRules[0].actionId).toBe(newActions[0]._id);
      expect(newRules[0].triggerId).toBe(newTriggers[0]._id);
    } finally {
      db.cleanup({ boardIds: created });
    }
  });

  // ---- #1894: a disabled user cannot be added to a board -------------------
  test('#1894 a disabled user cannot be added to a board', async ({ request, user, user2, board }) => {
    const addUrl = `/api/boards/${board.boardId}/members/${user2.id}/add`;
    const isMember = () => (db.getBoard(board.boardId).members || []).some(m => m.userId === user2.id && m.isActive);

    db.updateOne('users', { _id: user2.id }, { $set: { loginDisabled: true } });
    let res = await request.post(addUrl, { headers: authHeaders(user.token, true), data: { action: 'add' } });
    expect(res.status()).toBe(400);
    expect(isMember()).toBe(false);

    // Re-enabling the account allows the add to succeed.
    db.updateOne('users', { _id: user2.id }, { $set: { loginDisabled: false } });
    res = await request.post(addUrl, { headers: authHeaders(user.token, true), data: { action: 'add' } });
    expect(res.status()).toBe(200);
    expect(isMember()).toBe(true);
  });

  // ---- #5897: linked card -------------------------------------------------
  test('#5897 create a linked card referencing an existing card', async ({ request, user, board }) => {
    const sourceListId = board.listIds[0];
    const sourceCardId = listCards(board.boardId, sourceListId)[0]._id;
    const destListId = board.listIds[1];

    const res = await request.post(`/api/boards/${board.boardId}/lists/${destListId}/cards`, {
      headers: authHeaders(user.token, true),
      data: { authorId: user.id, swimlaneId: board.swimlaneId, linkedId: sourceCardId },
    });
    expect(res.status()).toBe(200);
    const { _id } = await res.json();
    const linked = db.getCard(_id);
    expect(linked.type).toBe('cardType-linkedCard');
    expect(linked.linkedId).toBe(sourceCardId);
  });

  // ---- copy card to a 0-based position (deep copy) -----------------------
  test('copy a card to position 0 of another list', async ({ request, user, board }) => {
    const sourceListId = board.listIds[0];
    const sourceCardId = listCards(board.boardId, sourceListId)[0]._id;
    const sourceTitle = db.getCard(sourceCardId).title;
    const destListId = board.listIds[2];
    const destBefore = listCards(board.boardId, destListId);

    const res = await request.post(
      `/api/boards/${board.boardId}/lists/${sourceListId}/cards/${sourceCardId}/copy`,
      {
        headers: authHeaders(user.token, true),
        data: { toBoardId: board.boardId, toSwimlaneId: board.swimlaneId, toListId: destListId, position: 0 },
      },
    );
    expect(res.status()).toBe(200);
    const { _id } = await res.json();
    const copied = db.getCard(_id);
    expect(copied.title).toBe(sourceTitle); // deep copy keeps the title
    expect(copied.listId).toBe(destListId);
    // position 0 => sorts before everything that was already there.
    if (destBefore.length > 0) {
      const minExisting = Math.min(...destBefore.map(c => c.sort));
      expect(copied.sort).toBeLessThan(minExisting);
    }
  });

  // ---- #3062: board card settings ----------------------------------------
  test('#3062 get and update board card settings', async ({ request, user, board }) => {
    let res = await request.get(`/api/boards/${board.boardId}/cardSettings`, {
      headers: authHeaders(user.token),
    });
    expect(res.status()).toBe(200);
    const settings = await res.json();
    expect(settings).toHaveProperty('allowsDueDate');

    res = await request.put(`/api/boards/${board.boardId}/cardSettings`, {
      headers: authHeaders(user.token, true),
      data: { allowsDueDate: false },
    });
    expect(res.status()).toBe(200);
    expect(db.getBoard(board.boardId).allowsDueDate).toBe(false);
  });

  // ---- #4815: My Cards / Due Cards ---------------------------------------
  test('#4815 GET /api/user/cards returns the user\'s cards, with a due filter', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const cardId = listCards(board.boardId, listId)[0]._id;
    const base = `/api/boards/${board.boardId}/lists/${listId}/cards/${cardId}`;

    // Make the current user a member of the card, and give it a due date.
    await request.put(base, { headers: authHeaders(user.token, true), data: { members: [user.id] } });
    await request.put(base, { headers: authHeaders(user.token, true), data: { dueAt: '2026-06-07T12:00:00.000Z' } });

    let res = await request.get('/api/user/cards', { headers: authHeaders(user.token) });
    expect(res.status()).toBe(200);
    let cards = await res.json();
    expect(cards.some(c => c._id === cardId)).toBe(true);

    // due=true still includes it (it has a due date).
    res = await request.get('/api/user/cards?due=true', { headers: authHeaders(user.token) });
    expect(res.status()).toBe(200);
    cards = await res.json();
    expect(cards.some(c => c._id === cardId)).toBe(true);
  });

  // ---- auth: missing token is rejected -----------------------------------
  test('unauthenticated request cannot read user cards', async ({ request }) => {
    const res = await request.get('/api/user/cards', { failOnStatusCode: false });
    // No Bearer token => 401, and definitely not a 200 with data.
    expect(res.ok()).toBe(false);
    expect(res.status()).toBe(401);
  });
});
