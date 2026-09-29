'use strict';
// A Jira issue type shows on the minicard with its icon, on a board that does
// not use Scrum; a card without one shows no badge.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('the minicard shows a card issue type with its icon', async ({ page, board, user }) => {
  const { loginWithToken } = require('../helpers/auth');
  const bug = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const custom = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  db.updateOne('cards', { _id: bug._id }, { $set: { 'scrum.issueType': 'Bug' } });
  db.updateOne('cards', { _id: custom._id }, { $set: { 'scrum.issueType': 'Customer Escalation' } });
  expect(db.findOne('boards', { _id: board.boardId }).scrum?.enabled).toBeFalsy();
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  const minicard = title => page.locator('.minicard', { hasText: title }).first();
  await expect(minicard('Alpha Card').locator('.minicard-issue-type i.fa-bug')).toBeVisible();
  await expect(minicard('Alpha Card').locator('.minicard-issue-type')).toHaveAttribute('title', 'Bug');
  await expect(minicard('Beta Card').locator('.minicard-issue-type i.fa-circle-o')).toBeVisible();
  await expect(minicard('Beta Card').locator('.minicard-issue-type .badge-text')).toHaveText('Customer Escalation');
  await expect(minicard('Gamma Card').locator('.minicard-issue-type')).toHaveCount(0);
});
