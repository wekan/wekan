'use strict';

const { test: base, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const headers = token => ({ Authorization: `Bearer ${token}` });
const fieldPath = (boardId, id) => `/api/boards/${boardId}/custom-fields/${id}`;
const items = [{ _id: 'remove', name: 'Remove option' }, { _id: 'keep', name: 'Keep option' }];

const test = base.extend({
  dropdown: async ({ request, user, board }, use) => {
    const response = await request.post(`/api/boards/${board.boardId}/custom-fields`, {
      headers: headers(user.token),
      data: { name: 'Deletion dropdown', type: 'dropdown', settings: { dropdownItems: items }, showOnCard: true },
    });
    expect(response.status()).toBe(200);
    const { _id } = await response.json();
    try {
      await use({ id: _id, path: fieldPath(board.boardId, _id) });
    } finally {
      db.deleteOne('customFields', { _id });
    }
  },
});

test('dropdown deletion returns JSON 404 for missing options, missing fields, wrong boards and repeated deletions', async ({ request, user, board, dropdown }) => {
  const other = db.seedBoard({ ownerId: user.id });
  try {
    const before = db.findOne('customFields', { _id: dropdown.id });
    const activities = db.find('activities', { customFieldId: dropdown.id });
    for (const path of [
      `${dropdown.path}/dropdown-items/missing`,
      `${fieldPath(board.boardId, 'missing-field')}/dropdown-items/remove`,
      `${fieldPath(other.boardId, dropdown.id)}/dropdown-items/remove`,
    ]) {
      const response = await request.delete(path, { headers: headers(user.token) });
      expect(response.status()).toBe(404);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(await response.json()).toEqual({ error: 'Dropdown item not found' });
      expect(db.findOne('customFields', { _id: dropdown.id })).toEqual(before);
      expect(db.find('activities', { customFieldId: dropdown.id })).toEqual(activities);
    }
    const path = `${dropdown.path}/dropdown-items/remove`;
    const response = await request.delete(path, { headers: headers(user.token) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ _id: dropdown.id });
    const after = db.findOne('customFields', { _id: dropdown.id });
    expect(after.settings.dropdownItems).toEqual([items[1]]);
    const read = await request.get(dropdown.path, { headers: headers(user.token) });
    expect(read.status()).toBe(200);
    expect((await read.json()).settings.dropdownItems).toEqual([items[1]]);
    const repeated = await request.delete(path, { headers: headers(user.token) });
    expect(repeated.status()).toBe(404);
    expect(await repeated.json()).toEqual({ error: 'Dropdown item not found' });
    expect(db.findOne('customFields', { _id: dropdown.id })).toEqual(after);
  } finally {
    db.cleanup({ boardIds: [other.boardId] });
  }
});

test('dropdown deletion preserves authorization and permits ordinary board writers', async ({ request, user2, board, dropdown }) => {
  const path = `${dropdown.path}/dropdown-items/remove`;
  const before = db.findOne('customFields', { _id: dropdown.id });
  expect((await request.delete(path)).status()).toBe(401);
  expect((await request.delete(path, { headers: headers(user2.token) })).status()).toBe(403);
  expect(db.findOne('customFields', { _id: dropdown.id })).toEqual(before);
  const member = db.seedUser();
  try {
    db.addBoardMember({ boardId: board.boardId, userId: member.id });
    const response = await request.delete(path, { headers: headers(member.token) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ _id: dropdown.id });
    expect(db.findOne('customFields', { _id: dropdown.id }).settings.dropdownItems).toEqual([items[1]]);
  } finally {
    db.cleanup({ userIds: [member.id] });
  }
});

test('rejected dropdown deletion preserves browser choices and a successful deletion removes only its option', async ({ request, user, board, dropdown, boardPage: page }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { customFields: [{ _id: dropdown.id, value: 'keep' }] } });
  const before = db.getCard(card._id);
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const cardPage = new CardPage(page);
  await cardPage.waitForOpen();
  const section = cardPage.root.locator('.card-details-group-custom-fields');
  await expect(section).toContainText('Keep option');
  await section.locator('a.js-edit-card-custom-field-value').click();
  const select = section.locator('.js-card-customfield-dropdown select');
  await expect(select.locator('option[value="remove"]')).toHaveText('Remove option');
  await expect(select.locator('option[value="keep"]')).toHaveText('Keep option');

  const rejected = await request.delete(`${dropdown.path}/dropdown-items/missing`, { headers: headers(user.token) });
  expect(rejected.status()).toBe(404);
  await expect(select.locator('option[value="remove"]')).toHaveText('Remove option');
  const response = await request.delete(`${dropdown.path}/dropdown-items/remove`, { headers: headers(user.token) });
  expect(response.status()).toBe(200);
  expect(db.getCard(card._id)).toEqual(before);

  await page.reload();
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  await cardPage.waitForOpen();
  await expect(section).toContainText('Keep option');
  await section.locator('a.js-edit-card-custom-field-value').click();
  await expect(select).toBeVisible();
  await expect(select.locator('option[value="remove"]')).toHaveCount(0);
  await expect(select.locator('option[value="keep"]')).toHaveText('Keep option');
  await expect(select).toHaveValue('keep');
});
