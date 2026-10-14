'use strict';
// Import from a service's API (models/lib/apiImportServices.js): the import
// page offers the fetch form for each of the six services, the JSON a fetch
// returns imports as a board through the page, and the server methods refuse
// what they should. The services themselves are not reached from here: the
// live tests (releases/live-tests/<key>-import.mjs) do that with real accounts.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const { waitForImportedBoard } = require('../helpers/import');

const FIELDS = {
  planka: ['url', 'username', 'password'],
  mstodo: ['token'],
  kanbanflow: ['token'],
  basecamp: ['account', 'token'],
  googletasks: ['token'],
  googlekeep: ['token'],
};

// What each fetch returns, small.
const FETCHED = {
  mstodo: { mstodo: true, lists: [{ id: 'l1', displayName: 'Errands', tasks: [
    { id: 't1', title: 'Buy milk', status: 'notStarted', importance: 'high', body: { content: 'Two litres', contentType: 'text' },
      checklistItems: [{ displayName: 'Check the fridge', isChecked: true }] },
    { id: 't2', title: 'Return books', status: 'completed', completedDateTime: { dateTime: '2026-10-01T10:00:00.0000000', timeZone: 'UTC' } },
  ] }] },
  googletasks: { googletasks: true, lists: [{ id: 'g1', title: 'Garden', tasks: [
    { id: 'a', title: 'Plant tulips', notes: 'Before frost', status: 'needsAction', position: '00000000000000000001' },
    { id: 'b', title: 'Buy bulbs', status: 'completed', parent: 'a', position: '00000000000000000001' },
  ] }] },
  googlekeep: { googlekeep: true, notes: [
    { name: 'notes/1', title: 'Ideas', body: { text: { text: 'A WeKan for the garden' } }, createTime: '2026-10-01T10:00:00Z' },
    { name: 'notes/2', title: 'Shopping', body: { list: { listItems: [{ text: { text: 'Soil' }, checked: false }] } } },
  ] },
};

test('the import page offers the fetch form for every API service, secrets as password fields', async ({ loggedInPage: page }) => {
  for (const [key, fields] of Object.entries(FIELDS)) {
    await navigateInApp(page, `/import/${key}`);
    await expect(page.locator('.api-import-fetch')).toBeVisible();
    for (const field of fields) await expect(page.locator(`#api-import-${field}`)).toBeVisible();
    for (const secret of ['password', 'token'].filter(f => fields.includes(f))) {
      await expect(page.locator(`#api-import-${secret}`)).toHaveAttribute('type', 'password');
    }
    await expect(page.locator('.js-api-import-list')).toBeVisible();
    // The fetched JSON can also be pasted.
    await expect(page.locator('#import-textarea')).toBeVisible();
  }
  // Negative: a file source has no fetch form.
  await navigateInApp(page, '/import/kanri');
  await expect(page.locator('.api-import-fetch')).toHaveCount(0);
});

for (const [key, fetched] of Object.entries(FETCHED)) {
  test(`what a ${key} fetch returns imports as a board through the page`, async ({ loggedInPage: page }) => {
    let boardId;
    try {
      await navigateInApp(page, `/import/${key}`);
      await page.locator('#import-textarea').fill(JSON.stringify(fetched));
      await page.locator('.js-import-without-mapping').click();
      await waitForImportedBoard(page);
      boardId = page.url().match(/\/b\/([^/]+)/)[1];
      const cards = db.find('cards', { boardId });
      const titles = cards.map(card => card.title).sort();
      if (key === 'mstodo') {
        expect(titles).toEqual(['Buy milk', 'Return books']);
        expect(cards.find(card => card.title === 'Return books').archived).toBe(true);
        const milk = cards.find(card => card.title === 'Buy milk');
        expect(db.find('checklists', { cardId: milk._id }).map(c => c.title)).toEqual(['Steps']);
        expect(db.findOne('lists', { _id: milk.listId }).title).toBe('Errands');
      } else if (key === 'googletasks') {
        expect(titles).toEqual(['Plant tulips']);
        const subtasks = db.find('checklists', { cardId: cards[0]._id });
        expect(subtasks.map(c => c.title)).toEqual(['Subtasks']);
      } else {
        expect(titles).toEqual(['Ideas', 'Shopping']);
        expect(db.find('checklists', { cardId: cards.find(card => card.title === 'Shopping')._id })).toHaveLength(1);
      }
    } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
  });
}

test('the fetch methods refuse a stranger, an unknown service, bad credentials and a private address', async ({ loggedInPage: page }) => {
  await navigateInApp(page, '/import/planka');
  const results = await page.evaluate(async () => {
    const out = [];
    const attempt = async (...args) => {
      try { await Meteor.callAsync(...args); out.push('allowed'); } catch (error) { out.push(error.error); }
    };
    await attempt('apiImportList', 'trello', { token: 'x' });
    await attempt('apiImportList', 'mstodo', {});
    await attempt('apiImportList', 'mstodo', { token: 'x', url: 'https://example.org' });
    await attempt('apiImportList', 'planka', { url: 'file:///etc/passwd', username: 'u', password: 'p' });
    // The SSRF guard: the server never reaches its own network for a member.
    await attempt('apiImportList', 'planka', { url: 'http://127.0.0.1:3000', username: 'u', password: 'p' });
    await attempt('apiImportFetch', 'mstodo', { token: 'x' }, '');
    return out;
  });
  expect(results).toEqual(['api-import-unknown-service', 'api-import-credentials', 'api-import-credentials',
    'api-import-credentials', 'api-import-failed', 'api-import-failed']);
});
