'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const SearchPage = require('../pages/SearchPage');

test('overdue search combines labels across boards without label-ID collisions or private cards', async ({ loggedInPage: page, user, user2 }) => {
  test.setTimeout(90000);
  const boards = [];
  const create = (ownerId, title, color, names) => {
    const board = db.seedBoard({ ownerId, title, cardTitlesPerList: [names] });
    boards.push(board.boardId);
    // Imported/copied boards may reuse label IDs with different definitions.
    db.updateOne('boards', { _id: board.boardId }, { $set: {
      labels: [{ _id: 'shared-label', name: color === 'red' ? 'Urgent' : 'Routine', color }],
    } });
    for (const name of names) db.updateOne('cards', { boardId: board.boardId, title: name }, { $set: {
      labelIds: ['shared-label'], ...(name.includes('undated') ? {} : {
        dueAt: new Date(Date.now() + (name.includes('future') ? 7 * 86400000 :
          name.includes('recent') ? -60000 : -7 * 86400000)),
      }),
    } });
    return board;
  };
  try {
    create(user.id, 'Project One', 'red', ['One overdue', 'One recent overdue', 'One future', 'One undated']);
    create(user.id, 'Project Two', 'red', ['Two overdue']);
    create(user.id, 'Project Three', 'blue', ['Three overdue']);
    create(user2.id, 'Private project', 'red', ['Private overdue']);
    const sp = new SearchPage(page);
    await sp.navigateToGlobalSearch();
    await sp.globalSearch('due:overdue');
    await expect.poll(async () => (await sp.globalSearchResultTitles()).map(t => t.trim()).sort())
      .toEqual(['One overdue', 'One recent overdue', 'Three overdue', 'Two overdue']);
    await sp.globalSearch('due:overdue label:red');
    await expect.poll(async () => (await sp.globalSearchResultTitles()).map(t => t.trim()).sort())
      .toEqual(['One overdue', 'One recent overdue', 'Two overdue']);
    await sp.globalSearch('due:overdue label:blue');
    await expect.poll(async () => (await sp.globalSearchResultTitles()).map(t => t.trim()).sort())
      .toEqual(['Three overdue']);
    await sp.globalSearch('due:overdue label:Urgent');
    await expect.poll(async () => (await sp.globalSearchResultTitles()).map(t => t.trim()).sort())
      .toEqual(['One overdue', 'One recent overdue', 'Two overdue']);
    await sp.globalSearch('due:overdue label:nonexistent-label');
    await expect.poll(() => sp.globalSearchResultTitles()).toEqual([]);
  } finally {
    db.cleanup({ boardIds: boards });
  }
});
