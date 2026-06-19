'use strict';

/**
 * Spec 23 — REST API coverage for endpoints not exercised by spec 17
 *
 * Real Bearer-token auth → real HTTP request → MongoDB change verified directly.
 * Requires the API server (WITH_API=true), like spec 17.
 *
 * Covers:
 *  - Rules API           (GET list/one, POST, PUT, DELETE)  — new in this release
 *  - Card stickers / locations / dueComplete via card PUT   — new in this release
 *  - Swimlanes CRUD
 *  - Lists CRUD
 *  - Custom fields create / get / delete
 *  - Checklists + checklist items create / get / delete
 *  - Comments create / get
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

function authHeaders(token, json = false) {
  const h = { Authorization: `Bearer ${token}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

// Fetch a single document by _id from any collection, straight from MongoDB.
function findOne(collection, id) {
  return db.findOne(collection, { _id: id });
}

function listCards(boardId, listId) {
  return db.find('cards', { boardId, listId, archived: false });
}

function rulesForBoard(boardId) {
  return db.find('rules', { boardId });
}

test.describe('REST API: rules + card sub-resources + core CRUD', () => {
  // ---- Rules API ----------------------------------------------------------
  test('rules: create, list, get, edit and delete', async ({ request, user, board }) => {
    const base = `/api/boards/${board.boardId}/rules`;

    // Create.
    const createRes = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: {
        title: 'On create move to top',
        trigger: { activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' },
        action: { actionType: 'moveCardToTop', listName: '*', swimlaneName: '*' },
      },
    });
    expect(createRes.status()).toBe(200);
    const { _id, triggerId, actionId } = await createRes.json();
    expect(_id && triggerId && actionId).toBeTruthy();

    // The rule, trigger and action exist in MongoDB.
    expect(findOne('rules', _id).title).toBe('On create move to top');
    expect(findOne('triggers', triggerId).activityType).toBe('createCard');
    expect(findOne('actions', actionId).actionType).toBe('moveCardToTop');

    // List includes it, embedding the trigger and action.
    const listRes = await request.get(base, { headers: authHeaders(user.token) });
    expect(listRes.status()).toBe(200);
    const rules = await listRes.json();
    const found = rules.find(r => r._id === _id);
    expect(found).toBeTruthy();
    expect(found.trigger.activityType).toBe('createCard');
    expect(found.action.actionType).toBe('moveCardToTop');

    // Get one.
    const getRes = await request.get(`${base}/${_id}`, { headers: authHeaders(user.token) });
    expect(getRes.status()).toBe(200);
    expect((await getRes.json()).title).toBe('On create move to top');

    // Edit (title + action).
    const putRes = await request.put(`${base}/${_id}`, {
      headers: authHeaders(user.token, true),
      data: { title: 'Renamed rule', action: { actionType: 'moveCardToBottom', listName: '*', swimlaneName: '*' } },
    });
    expect(putRes.status()).toBe(200);
    expect(findOne('rules', _id).title).toBe('Renamed rule');
    expect(findOne('actions', actionId).actionType).toBe('moveCardToBottom');

    // Delete (rule + its trigger + action are removed).
    const delRes = await request.delete(`${base}/${_id}`, { headers: authHeaders(user.token) });
    expect(delRes.status()).toBe(200);
    expect(findOne('rules', _id)).toBeNull();
    expect(findOne('triggers', triggerId)).toBeNull();
    expect(findOne('actions', actionId)).toBeNull();
  });

  // ---- Whole-board import (board + workflows) -----------------------------
  test('whole-board import recreates the board together with its rules', async ({ request, user, board }) => {
    // 1. Create a rule on the source board so the export carries a workflow.
    const ruleRes = await request.post(`/api/boards/${board.boardId}/rules`, {
      headers: authHeaders(user.token, true),
      data: {
        title: 'Imported workflow rule',
        trigger: { activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' },
        action: { actionType: 'moveCardToTop', listName: '*', swimlaneName: '*' },
      },
    });
    expect(ruleRes.status()).toBe(200);

    // 2. Export the source board — the export must include the rule.
    const expRes = await request.get(`/api/boards/${board.boardId}/export`, {
      headers: authHeaders(user.token),
    });
    expect(expRes.status()).toBe(200);
    const exported = await expRes.json();
    expect(Array.isArray(exported.rules)).toBe(true);
    expect(exported.rules.length).toBeGreaterThanOrEqual(1);

    // 3. Import it as a brand-new board.
    const impRes = await request.post('/api/boards/import', {
      headers: authHeaders(user.token, true),
      data: { board: exported },
    });
    expect(impRes.status()).toBe(200);
    const { _id: newBoardId } = await impRes.json();
    expect(newBoardId).toBeTruthy();
    expect(newBoardId).not.toBe(board.boardId);

    // 4. The new board carries the rule, with its trigger + action recreated.
    const newRules = rulesForBoard(newBoardId);
    expect(newRules.length).toBeGreaterThanOrEqual(1);
    const rule = newRules[0];
    expect(findOne('triggers', rule.triggerId).activityType).toBe('createCard');
    expect(findOne('actions', rule.actionId).actionType).toBe('moveCardToTop');

    // Cleanup the imported board (the fixture only cleans up the seeded one).
    await request.delete(`/api/boards/${newBoardId}`, { headers: authHeaders(user.token) });
  });

  test('rules: unauthenticated request is rejected', async ({ request, board }) => {
    const res = await request.get(`/api/boards/${board.boardId}/rules`, { failOnStatusCode: false });
    expect(res.ok()).toBe(false);
    expect(res.status()).toBe(401);
  });

  // #5870: ?attachments=false exports the board structure without the base64
  // attachment file data, so very large boards can be exported without
  // overflowing the JSON serializer. (The actual size benefit is best verified
  // manually with a real big board; here we guard that the param is accepted,
  // the export still succeeds, and no attachment carries a `file` field.)
  test('export with attachments=false returns the board without attachment file data', async ({ request, user, board }) => {
    const res = await request.get(
      `/api/boards/${board.boardId}/export?attachments=false`,
      { headers: authHeaders(user.token) },
    );
    expect(res.status()).toBe(200);
    const exported = await res.json();
    // Board structure is intact.
    expect(exported._format).toBe('wekan-board-1.0.0');
    expect(Array.isArray(exported.lists)).toBe(true);
    expect(Array.isArray(exported.cards)).toBe(true);
    expect(Array.isArray(exported.attachments)).toBe(true);
    // No exported attachment carries base64 file data in this mode.
    for (const att of exported.attachments) {
      expect(att.file).toBeUndefined();
    }

    // The default export still works (regression) and keeps including file data.
    const full = await request.get(`/api/boards/${board.boardId}/export`, {
      headers: authHeaders(user.token),
    });
    expect(full.status()).toBe(200);
    const fullExported = await full.json();
    expect(fullExported._format).toBe('wekan-board-1.0.0');
    for (const att of fullExported.attachments) {
      expect(att).toHaveProperty('file');
    }
  });

  // ---- Card stickers / locations / dueComplete via PUT --------------------
  test('card PUT sets stickers, locations and the complete checkbox', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const cardId = listCards(board.boardId, listId)[0]._id;
    const base = `/api/boards/${board.boardId}/lists/${listId}/cards/${cardId}`;

    let res = await request.put(base, {
      headers: authHeaders(user.token, true),
      data: { dueComplete: true },
    });
    expect(res.status()).toBe(200);
    expect(db.getCard(cardId).dueComplete).toBe(true);

    res = await request.put(base, {
      headers: authHeaders(user.token, true),
      data: { stickers: [{ icon: 'taco-cool' }] },
    });
    expect(res.status()).toBe(200);
    expect((db.getCard(cardId).stickers || []).length).toBe(1);

    res = await request.put(base, {
      headers: authHeaders(user.token, true),
      data: { locations: [{ name: 'HQ', address: 'Helsinki', latitude: 60.17, longitude: 24.94 }] },
    });
    expect(res.status()).toBe(200);
    const locs = db.getCard(cardId).locations || [];
    expect(locs.length).toBe(1);
    expect(locs[0].name).toBe('HQ');
  });

  // ---- Swimlanes CRUD -----------------------------------------------------
  test('swimlanes: create, get, edit, delete', async ({ request, user, board }) => {
    const base = `/api/boards/${board.boardId}/swimlanes`;
    const createRes = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: { title: 'API Swimlane' },
    });
    expect(createRes.status()).toBe(200);
    const { _id } = await createRes.json();
    expect(findOne('swimlanes', _id).title).toBe('API Swimlane');

    const getRes = await request.get(`${base}/${_id}`, { headers: authHeaders(user.token) });
    expect(getRes.status()).toBe(200);

    const putRes = await request.put(`${base}/${_id}`, {
      headers: authHeaders(user.token, true),
      data: { title: 'Renamed Swimlane' },
    });
    expect(putRes.status()).toBe(200);
    expect(findOne('swimlanes', _id).title).toBe('Renamed Swimlane');

    const delRes = await request.delete(`${base}/${_id}`, { headers: authHeaders(user.token) });
    expect(delRes.status()).toBe(200);
    expect(findOne('swimlanes', _id)).toBeNull();
  });

  // ---- Lists CRUD ---------------------------------------------------------
  test('lists: create, get, edit, delete', async ({ request, user, board }) => {
    const base = `/api/boards/${board.boardId}/lists`;
    const createRes = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: { title: 'API List', swimlaneId: board.swimlaneId },
    });
    expect(createRes.status()).toBe(200);
    const { _id } = await createRes.json();
    expect(findOne('lists', _id).title).toBe('API List');

    const getRes = await request.get(`${base}/${_id}`, { headers: authHeaders(user.token) });
    expect(getRes.status()).toBe(200);

    const putRes = await request.put(`${base}/${_id}`, {
      headers: authHeaders(user.token, true),
      data: { title: 'Renamed List' },
    });
    expect(putRes.status()).toBe(200);
    expect(findOne('lists', _id).title).toBe('Renamed List');

    const delRes = await request.delete(`${base}/${_id}`, { headers: authHeaders(user.token) });
    expect(delRes.status()).toBe(200);
  });

  // ---- Custom fields ------------------------------------------------------
  test('custom fields: create, get, delete', async ({ request, user, board }) => {
    const base = `/api/boards/${board.boardId}/custom-fields`;
    const createRes = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: {
        name: 'Priority',
        type: 'text',
        settings: {},
        showOnCard: true,
        automaticallyOnCard: true,
        showLabelOnMiniCard: true,
        showSumAtTopOfList: false,
      },
    });
    expect(createRes.status()).toBe(200);
    const { _id } = await createRes.json();
    expect(findOne('customFields', _id).name).toBe('Priority');

    const getRes = await request.get(`${base}/${_id}`, { headers: authHeaders(user.token) });
    expect(getRes.status()).toBe(200);

    const delRes = await request.delete(`${base}/${_id}`, { headers: authHeaders(user.token) });
    expect(delRes.status()).toBe(200);
    expect(findOne('customFields', _id)).toBeNull();
  });

  // ---- Checklists + items -------------------------------------------------
  test('checklists and items: create, get, delete', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const cardId = listCards(board.boardId, listId)[0]._id;
    const clBase = `/api/boards/${board.boardId}/cards/${cardId}/checklists`;

    const createRes = await request.post(clBase, {
      headers: authHeaders(user.token, true),
      data: { title: 'My Checklist', items: ['one', 'two'] },
    });
    expect(createRes.status()).toBe(200);
    const { _id: checklistId } = await createRes.json();
    expect(findOne('checklists', checklistId).title).toBe('My Checklist');

    // List checklists of the card.
    const listRes = await request.get(clBase, { headers: authHeaders(user.token) });
    expect(listRes.status()).toBe(200);

    // Add another item.
    const itemRes = await request.post(`${clBase}/${checklistId}/items`, {
      headers: authHeaders(user.token, true),
      data: { title: 'three' },
    });
    expect(itemRes.status()).toBe(200);

    // Delete the checklist.
    const delRes = await request.delete(`${clBase}/${checklistId}`, { headers: authHeaders(user.token) });
    expect(delRes.status()).toBe(200);
    expect(findOne('checklists', checklistId)).toBeNull();
  });

  // ---- Comments -----------------------------------------------------------
  test('comments: create and list', async ({ request, user, board }) => {
    const listId = board.listIds[0];
    const cardId = listCards(board.boardId, listId)[0]._id;
    const base = `/api/boards/${board.boardId}/cards/${cardId}/comments`;

    const createRes = await request.post(base, {
      headers: authHeaders(user.token, true),
      data: { authorId: user.id, comment: 'Hello from the API' },
    });
    expect(createRes.status()).toBe(200);
    const { _id } = await createRes.json();
    expect(findOne('card_comments', _id).text).toBe('Hello from the API');

    const listRes = await request.get(base, { headers: authHeaders(user.token) });
    expect(listRes.status()).toBe(200);
    const comments = await listRes.json();
    expect(comments.some(c => c._id === _id)).toBe(true);
  });
});
