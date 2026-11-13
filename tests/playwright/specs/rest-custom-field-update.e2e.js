'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const headers = token => ({ Authorization: `Bearer ${token}` });

async function createField(request, user, board) {
  const base = `/api/boards/${board.boardId}/custom-fields`;
  const response = await request.post(base, {
    headers: headers(user.token),
    data: { name: 'Original field', type: 'text', settings: {}, showOnCard: true, showLabelOnMiniCard: true },
  });
  expect(response.status()).toBe(200);
  const { _id } = await response.json();
  return { id: _id, url: `${base}/${_id}` };
}

for (const invalid of [{ settings: 'invalid' }, { type: 'invalid' }]) {
  test(`rejected custom-field ${Object.keys(invalid)[0]} leaves the entire definition unchanged`, async ({ request, user, board }) => {
    const field = await createField(request, user, board);
    const before = db.findOne('customFields', { _id: field.id });
    const response = await request.put(field.url, {
      headers: headers(user.token), data: { name: 'Changed field', ...invalid, showOnCard: false },
    });
    expect(response.status()).toBe(500);
    expect(db.findOne('customFields', { _id: field.id })).toEqual(before);
    const read = await request.get(field.url, { headers: headers(user.token) });
    expect(read.status()).toBe(200);
    expect(await read.json()).toMatchObject({ name: before.name, type: before.type, settings: before.settings, showOnCard: before.showOnCard });
  });
}

test('custom-field updates persist together and the board displays the accepted name', async ({ boardPage: page, request, user, board }) => {
  const field = await createField(request, user, board);
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCustomFieldsOnMinicard: true } });
  db.updateOne('cards', { _id: card._id }, { $set: { customFields: [{ _id: field.id, value: 'Visible value' }] } });
  const minicard = page.locator('.minicard-wrapper').filter({ hasText: 'Alpha Card' });
  await expect(minicard).toContainText('Original field');
  const body = {
    name: 'Updated field', type: 'text', settings: {}, showOnCard: true,
    automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: true, showSumAtTopOfList: false,
  };
  const response = await request.put(field.url, { headers: headers(user.token), data: body });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ _id: field.id });
  expect(db.findOne('customFields', { _id: field.id })).toMatchObject(body);
  await expect(minicard).toContainText('Updated field');
  await expect(minicard).not.toContainText('Original field');
  await expect(minicard).toContainText('Visible value');

  const rejected = await request.put(field.url, {
    headers: headers(user.token), data: { name: 'Rejected field', settings: 'invalid' },
  });
  expect(rejected.status()).toBe(500);
  expect(db.findOne('customFields', { _id: field.id })).toMatchObject(body);
  await page.reload();
  await expect(minicard).toContainText('Updated field');
  await expect(minicard).not.toContainText('Rejected field');
});

test('custom-field updates preserve authorization, board scope, false values and omitted fields', async ({ request, user, user2, board }) => {
  const field = await createField(request, user, board);
  const before = db.findOne('customFields', { _id: field.id });
  for (const options of [{}, { headers: headers(user2.token) }]) {
    const response = await request.put(field.url, { ...options, data: { name: 'Forbidden field' } });
    expect([401, 403]).toContain(response.status());
    expect(db.findOne('customFields', { _id: field.id })).toEqual(before);
  }
  const other = db.seedBoard({ ownerId: user.id });
  try {
    const response = await request.put(`/api/boards/${other.boardId}/custom-fields/${field.id}`, {
      headers: headers(user.token), data: { name: 'Wrong board' },
    });
    expect(response.status()).toBe(200);
    expect(db.findOne('customFields', { _id: field.id })).toEqual(before);
  } finally { db.cleanup({ boardIds: [other.boardId] }); }

  for (const body of [{}, { boardIds: ['other'], adminOnly: true }, { type: 'number', settings: {}, showOnCard: false, showLabelOnMiniCard: false }]) {
    const response = await request.put(field.url, { headers: headers(user.token), data: body });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ _id: field.id });
  }
  const after = db.findOne('customFields', { _id: field.id });
  expect(after).toEqual({ ...before, modifiedAt: after.modifiedAt, type: 'number', showOnCard: false, showLabelOnMiniCard: false });
});
