'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const Papa = require('../../../node_modules/papaparse');

async function readRows(response, delimiter) {
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain(delimiter === '\t' ? 'text/tsv' : 'text/csv');
  const result = Papa.parse(await response.text(), { delimiter, skipEmptyLines: true });
  expect(result.errors).toEqual([]);
  return result.data;
}

for (const delimiter of [',', ';', '\t']) {
  test(`public and private exports honor selected columns (${JSON.stringify(delimiter)})`, async ({ request, board, user }) => {
    db.updateMany('cards', { boardId: board.boardId }, { $set: { description: 'Selected description' } });
    const query = new URLSearchParams({ fields: 'description,unknown', delimiter, authToken: user.token });
    const url = `/api/boards/${board.boardId}/export/csv?`;
    const privateRows = await readRows(await request.get(url + query), delimiter);
    expect(privateRows[0]).toEqual(['Title', 'Description', 'Archived']);
    expect(privateRows).toHaveLength(4);
    expect(privateRows.slice(1).map(row => row[0]).sort()).toEqual(['Alpha Card', 'Beta Card', 'Gamma Card']);
    for (const row of privateRows.slice(1)) expect(row.slice(1)).toEqual(['Selected description', 'false']);

    db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
    query.delete('authToken');
    expect(await readRows(await request.get(url + query), delimiter)).toEqual(privateRows);
  });
}

test('public exports retain all columns when fields are absent, empty or unrecognized', async ({ request, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
  const url = `/api/boards/${board.boardId}/export/csv`;
  const full = await readRows(await request.get(url), ',');
  expect(full[0]).toContain('Owner');
  expect(full[0]).toContain('List');
  for (const query of ['?fields=', '?fields=unknown']) {
    expect(await readRows(await request.get(url + query), ',')).toEqual(full);
  }
});

test('selecting columns still denies private-board exports to unrelated users', async ({ request, board, user2 }) => {
  const query = new URLSearchParams({ fields: 'description', authToken: user2.token });
  const response = await request.get(`/api/boards/${board.boardId}/export/csv?${query}`);
  expect(response.status()).toBe(403);
  expect(await response.text()).not.toContain('Alpha Card');
});

test('the public-board export menu applies its column checkboxes to CSV and TSV', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
  await new BoardPage(page).openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-export-board').click();
  const toggles = page.locator('.js-pop-over .js-export-field-toggle');
  await expect(toggles.first()).toBeVisible();
  for (const toggle of await toggles.all()) {
    const selected = await toggle.getAttribute('aria-checked') === 'true';
    const wanted = await toggle.getAttribute('data-field') === 'description';
    if (selected !== wanted) await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', String(wanted));
  }
  for (const delimiter of [',', ';', '\t']) {
    const anchors = page.locator('.js-pop-over a[href*="/export/csv?"]');
    let href;
    for (const candidate of await anchors.all()) {
      const value = await candidate.getAttribute('href');
      if (new URL(value, page.url()).searchParams.get('delimiter') === delimiter) href = value;
    }
    expect(href).toBeTruthy();
    const rows = await readRows(await page.request.get(href), delimiter);
    expect(rows[0]).toEqual(['Title', 'Description', 'Archived']);
    expect(rows).toHaveLength(4);
    expect(rows.slice(1).map(row => row[0]).sort()).toEqual(['Alpha Card', 'Beta Card', 'Gamma Card']);
  }
});
