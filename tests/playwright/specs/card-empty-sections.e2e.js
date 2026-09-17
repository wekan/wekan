'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('#6696 hidden fields remove their whole group and separator', async ({ boardPage: page, board }) => {
  const hidden = Object.fromEntries([
    'ReceivedDate', 'StartDate', 'DueDate', 'EndDate', 'Members', 'Creator',
    'Assignee', 'RequestedBy', 'AssignedBy', 'CardSortingByNumber', 'ShowLists',
    'SpentTime', 'Flowtime', 'Pomodoro',
  ].map(name => [`allows${name}`, false]));
  db.updateOne('boards', { _id: board.boardId }, { $set: hidden });
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const cp = new CardPage(page);
  await cp.waitForOpen();
  for (const group of ['date-format', 'members', 'sort']) {
    await expect(cp.root.locator(`.card-details-group-${group}`)).toHaveCount(0);
  }
  db.updateOne('boards', { _id: board.boardId }, {
    $set: { allowsDueDate: true, allowsMembers: true, allowsFlowtime: true },
  });
  for (const group of ['date-format', 'members', 'sort']) {
    await expect(cp.root.locator(`.card-details-group-${group}`)).toBeVisible();
    await expect(cp.root.locator(`.card-details-group-${group} > hr`)).toHaveCount(1);
  }
});
