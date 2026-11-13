'use strict';

const { test: base, expect } = require('../fixtures');
const db = require('../helpers/db');

const headers = token => ({ Authorization: `Bearer ${token}` });
const integrationPath = (boardId, id) => `/api/boards/${boardId}/integrations/${id}`;

const test = base.extend({
  integration: async ({ request, user, board }, use) => {
    const response = await request.post(`/api/boards/${board.boardId}/integrations`, {
      headers: headers(user.token), data: { url: 'https://example.com/webhook' },
    });
    expect(response.status()).toBe(200);
    const { _id } = await response.json();
    try {
      await use({ id: _id, path: integrationPath(board.boardId, _id) });
    } finally {
      db.deleteOne('integrations', { _id });
    }
  },
});

test('integration PUT rejects missing and wrong-board IDs and preserves real updates', async ({ request, user, board, integration }) => {
  const other = db.seedBoard({ ownerId: user.id });
  try {
    const before = db.findOne('integrations', { _id: integration.id });
    for (const path of [
      integrationPath(board.boardId, 'missing-integration'),
      integrationPath(other.boardId, integration.id),
    ]) {
      for (const data of [{}, { title: 'Should not change', enabled: false, activities: [] }]) {
        const response = await request.put(path, { headers: headers(user.token), data });
        expect(response.status()).toBe(404);
        expect(response.headers()['content-type']).toContain('application/json');
        expect(await response.json()).toEqual({ error: 'Integration not found' });
        expect(db.findOne('integrations', { _id: integration.id })).toEqual(before);
      }
    }
    expect(db.findOne('integrations', { _id: 'missing-integration' })).toBeNull();

    for (const data of [{ title: 'Updated webhook', enabled: false, activities: [] }, { title: 'Updated webhook', enabled: false }, {}]) {
      const response = await request.put(integration.path, { headers: headers(user.token), data });
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ _id: integration.id });
      expect(db.findOne('integrations', { _id: integration.id })).toMatchObject({ title: 'Updated webhook', enabled: false, activities: [] });
    }
    const response = await request.get(integration.path, { headers: headers(user.token) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ _id: integration.id, title: 'Updated webhook', enabled: false, activities: [] });
  } finally {
    db.cleanup({ boardIds: [other.boardId] });
  }
});

test('integration PUT preserves authentication and board-admin requirements', async ({ request, board, integration }) => {
  const before = db.findOne('integrations', { _id: integration.id });
  for (const id of [integration.id, 'missing-integration']) {
    const path = integrationPath(board.boardId, id);
    expect((await request.put(path, { data: { title: 'Unauthorized' } })).status()).toBe(401);
    // A refused management request may block its actor. Use a fresh ordinary
    // member for each ID so each request exercises the board-admin guard.
    const member = db.seedUser();
    try {
      db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
        userId: member.id, isActive: true, isAdmin: false, isNoComments: false, isCommentOnly: false,
      } } });
      expect((await request.put(path, { headers: headers(member.token), data: { title: 'Forbidden' } })).status()).toBe(403);
    } finally {
      db.cleanup({ userIds: [member.id] });
    }
  }
  expect(db.findOne('integrations', { _id: integration.id })).toEqual(before);
});

test('integration DELETE rejects missing and wrong-board IDs and removes only its own integration', async ({ request, user, board, integration }) => {
  const other = db.seedBoard({ ownerId: user.id });
  try {
    const before = db.findOne('integrations', { _id: integration.id });
    for (const path of [
      integrationPath(board.boardId, 'missing-integration'),
      integrationPath(other.boardId, integration.id),
    ]) {
      const response = await request.delete(path, { headers: headers(user.token) });
      expect(response.status()).toBe(404);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(await response.json()).toEqual({ error: 'Integration not found' });
      expect(db.findOne('integrations', { _id: integration.id })).toEqual(before);
    }
    const response = await request.delete(integration.path, { headers: headers(user.token) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ _id: integration.id });
    expect(db.findOne('integrations', { _id: integration.id })).toBeNull();
    const read = await request.get(integration.path, { headers: headers(user.token) });
    expect(read.status()).toBe(404);
    const repeated = await request.delete(integration.path, { headers: headers(user.token) });
    expect(repeated.status()).toBe(404);
    expect(await repeated.json()).toEqual({ error: 'Integration not found' });
  } finally {
    db.cleanup({ boardIds: [other.boardId] });
  }
});

test('integration DELETE preserves authentication and board-admin requirements', async ({ request, board, integration }) => {
  const before = db.findOne('integrations', { _id: integration.id });
  for (const id of [integration.id, 'missing-integration']) {
    const path = integrationPath(board.boardId, id);
    expect((await request.delete(path)).status()).toBe(401);
    const member = db.seedUser();
    try {
      db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
        userId: member.id, isActive: true, isAdmin: false, isNoComments: false, isCommentOnly: false,
      } } });
      expect((await request.delete(path, { headers: headers(member.token) })).status()).toBe(403);
      expect(db.findOne('integrations', { _id: integration.id })).toEqual(before);
    } finally {
      db.cleanup({ userIds: [member.id] });
    }
  }
});

test('webhook settings retain a rejected deletion and react to a successful REST deletion', async ({ request, user, board, integration, boardPage }) => {
  const other = db.seedBoard({ ownerId: user.id });
  let siblingId;
  try {
    const created = await request.post(`/api/boards/${board.boardId}/integrations`, {
      headers: headers(user.token), data: { url: 'https://example.com/other-webhook' },
    });
    expect(created.status()).toBe(200);
    siblingId = (await created.json())._id;
    const sibling = db.findOne('integrations', { _id: siblingId });
    const menu = boardPage.locator('.board-sidebar .js-open-board-menu');
    if (!(await menu.isVisible())) await boardPage.locator('.js-toggle-page-sidebar').first().click();
    await menu.click();
    await boardPage.locator('.js-outgoing-webhooks').click();
    const form = boardPage.locator('form.integration-form').filter({
      has: boardPage.locator(`input[name="id"][value="${integration.id}"]`),
    });
    await expect(form).toBeVisible();
    const before = db.findOne('integrations', { _id: integration.id });
    const rejected = await request.delete(integrationPath(other.boardId, integration.id), {
      headers: headers(user.token),
    });
    expect(rejected.status()).toBe(404);
    expect(db.findOne('integrations', { _id: integration.id })).toEqual(before);
    await expect(form).toBeVisible();

    const response = await request.delete(integration.path, { headers: headers(user.token) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ _id: integration.id });
    expect(db.findOne('integrations', { _id: integration.id })).toBeNull();
    await expect(form).toHaveCount(0);
    expect(db.findOne('integrations', { _id: siblingId })).toEqual(sibling);
    await expect(boardPage.locator(`form.integration-form input[name="id"][value="${siblingId}"]`)).toHaveCount(1);
  } finally {
    if (siblingId) db.deleteOne('integrations', { _id: siblingId });
    db.cleanup({ boardIds: [other.boardId] });
  }
});

test('successful REST updates appear in webhook settings after invalid updates are rejected', async ({ request, user, board, integration, boardPage }) => {
  const other = db.seedBoard({ ownerId: user.id });
  try {
    const response = await request.put(integration.path, {
      headers: headers(user.token),
      data: { title: 'Retained webhook', enabled: false, activities: [], url: 'https://example.com/webhook' },
    });
    expect(response.status()).toBe(200);
    const rejected = await request.put(integrationPath(other.boardId, integration.id), {
      headers: headers(user.token), data: { title: 'Wrong-board overwrite', enabled: true },
    });
    expect(rejected.status()).toBe(404);

    const before = db.findOne('integrations', { _id: integration.id });
    const invalid = await request.put(integration.path, {
      headers: headers(user.token),
      data: { title: 'Invalid URL overwrite', enabled: true, url: 'invalid-url' },
    });
    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: 'invalid-webhook-url' });
    expect(db.findOne('integrations', { _id: integration.id })).toEqual(before);
    const read = await request.get(integration.path, { headers: headers(user.token) });
    expect(read.status()).toBe(200);
    expect(await read.json()).toMatchObject({ title: 'Retained webhook', enabled: false });

    const menu = boardPage.locator('.board-sidebar .js-open-board-menu');
    if (!(await menu.isVisible())) await boardPage.locator('.js-toggle-page-sidebar').first().click();
    await menu.click();
    await boardPage.locator('.js-outgoing-webhooks').click();
    const form = boardPage.locator('form.integration-form').filter({
      has: boardPage.locator(`input[name="id"][value="${integration.id}"]`),
    });
    await expect(form.locator('.js-outgoing-webhooks-title')).toHaveValue('Retained webhook');
    await expect(form.locator('.js-toggle-webhook-enabled .materialCheckBox')).toHaveClass(/is-checked/);
    expect(db.findOne('integrations', { _id: integration.id })).toMatchObject({ title: 'Retained webhook', enabled: false });
  } finally {
    db.cleanup({ boardIds: [other.boardId] });
  }
});
