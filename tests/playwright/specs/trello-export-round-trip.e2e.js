'use strict';
// The Trello export keeps a board's checklists and comments (2026-11-20, the
// first tool of the import/export coverage review in TODO.md): they used to
// be written as empty arrays, so a board exported for Trello lost both. The
// export is read back by WeKan's own Trello import.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const { waitForImportedBoard } = require('../helpers/import');
const fs = require('node:fs');
const path = require('node:path');

const fixtures = path.resolve(__dirname, '../../fixtures/import-formats');
const expected = require('../../fixtures/import-formats/expectations.json');

async function importTrello(page, document) {
  await navigateInApp(page, '/import/trello');
  await page.locator('#import-textarea').fill(JSON.stringify(document));
  await page.locator('.js-import-without-mapping').click();
  await waitForImportedBoard(page);
  return page.url().match(/\/b\/([^/]+)/)[1];
}

test('a Trello export carries the checklists and comments, and imports back with them', async ({ loggedInPage: page, user }) => {
  test.setTimeout(90000);
  const document = JSON.parse(fs.readFileSync(path.join(fixtures, 'trello.json')));
  document.name += ` ${db.uniqueSuffix()}`;
  const boardIds = [];
  try {
    const source = await importTrello(page, document);
    boardIds.push(source);
    await expect.poll(() => db.find('checklistItems', { boardId: source }).length).toBe(1);

    const response = await page.request.get(`/api/boards/${source}/export/trello?authToken=${encodeURIComponent(user.token)}`);
    expect(response.status()).toBe(200);
    const exported = await response.json();
    expect(exported.checklists).toHaveLength(1);
    expect(exported.checklists[0].checkItems).toHaveLength(1);
    expect(exported.cards[0].idChecklists).toEqual([exported.checklists[0].id]);
    const comments = exported.actions.filter(action => action.type === 'commentCard');
    expect(comments.map(action => action.data.text)).toContain(expected.comment);
    expect(comments[0].data.card.id).toBe(exported.cards[0].id);
    // The comment's author is a member of the file, so the import can map them.
    expect(exported.members.map(m => m.username)).toContain(comments[0].idMemberCreator);

    exported.name += ' round trip';
    const restored = await importTrello(page, exported);
    boardIds.push(restored);
    await expect.poll(() => db.find('checklistItems', { boardId: restored }).length).toBe(1);
    expect(db.find('card_comments', { boardId: restored }).map(c => c.text)).toContain(expected.comment);
    expect(db.findOne('cards', { boardId: restored }).title).toBe(expected.title);
  } finally { db.cleanup({ boardIds }); }
});
