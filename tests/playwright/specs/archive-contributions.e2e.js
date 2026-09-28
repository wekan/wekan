'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

function seed(board, userId) {
  const cards = db.find('cards', { boardId: board.boardId });
  db.updateOne('boards', { _id: board.boardId }, { $set: { labels: [
    { _id: 'archive-label', name: '<b>Finished</b>', color: '#123456' },
  ] } });
  cards.forEach((card, i) => db.updateOne('cards', { _id: card._id }, { $set: {
    archived: true, archivedAt: new Date(i === 2 ? '2024-03-01T00:00:00Z' : '2024-02-29T23:59:59Z'),
    labelIds: ['archive-label'], assignees: i === 0 ? [userId] : [],
  } }));
  return cards;
}
async function openChart(page, user, board) {
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.js-open-pulse-view').click();
  await page.locator('.js-archive-year input').fill('2024');
  await page.locator('.js-archive-year button').click();
  await expect(page.locator('.archive-day')).toHaveCount(366);
}

test('archive chart: year grid, counts, colored escaped tooltips and empty year', async ({ page, user, board }) => {
  seed(board, user.id);
  await openChart(page, user, board);
  const leap = page.locator('.archive-day[data-date="2024-02-29"]');
  await expect(leap).toHaveText('2');
  await expect(leap).toHaveClass(/archive-level-2/);
  await expect(page.locator('.archive-day[data-date="2024-03-01"]')).toHaveClass(/archive-level-1/);
  await leap.focus();
  await expect(leap).toHaveCSS('background-color', 'rgb(64, 196, 99)');
  expect(await page.locator('.archive-grid tbody tr').first().evaluate(row => row.getBoundingClientRect().height)).toBeLessThan(35);
  const tip = page.locator('#archive-tip-2024-02-29');
  await expect(tip).toBeVisible();
  await expect(page.locator('.archive-tooltip:visible')).toHaveCount(1);
  await expect(tip).toContainText('<b>Finished</b>');
  await expect(tip.locator('b')).toHaveCount(0);
  await expect(tip.locator('.card-label')).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await expect(page.locator('.archive-day-detail')).toContainText('Cards: 2');
  await page.screenshot({ path: '.tools/tmp/archive-chart/grid.png', fullPage: true });
  await leap.press('Escape');
  await expect(tip).toBeHidden();
  await leap.hover();
  await expect(tip).toBeVisible();
  await page.locator('.js-archive-year input').fill('2023');
  await page.locator('.js-archive-year button').click();
  await expect(page.locator('.archive-day')).toHaveCount(365);
  await expect(page.locator('.archive-day:not(.archive-level-0)')).toHaveCount(0);
});

for (const flag of ['isReadAssignedOnly', 'isNormalAssignedOnly', 'isCommentAssignedOnly']) {
  test(`archive chart: ${flag} sees only assigned archives`, async ({ page, user, user2, board }) => {
    seed(board, user2.id);
    db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
      userId: user2.id, isActive: true, isAdmin: false, [flag]: true,
    } } });
    await openChart(page, user2, board);
    await expect(page.locator('.archive-day[data-date="2024-02-29"]')).toHaveText('1');
    await expect(page.locator('.archive-day[data-date="2024-03-01"]')).toHaveText('0');
  });
}

test('archive method rejects foreign boards and invalid years; restores drop out', async ({ page, user, user2, board }) => {
  const cards = seed(board, user.id);
  await loginWithToken(page, user2.id, user2.token);
  const denied = await page.evaluate(async id => {
    try { await Meteor.callAsync('archivedCardContributions', id, 2024); return null; }
    catch (error) { return error.error; }
  }, board.boardId);
  expect(denied).toBe('not-authorized');
  await loginWithToken(page, user.id, user.token);
  const bad = await page.evaluate(async id => {
    try { await Meteor.callAsync('archivedCardContributions', id, 1.5); return null; }
    catch (error) { return error.error; }
  }, board.boardId);
  expect(bad).toBe('bad-request');
  db.updateOne('cards', { _id: cards[0]._id }, { $set: { archived: false } });
  db.updateOne('cards', { _id: cards[2]._id }, { $unset: { archivedAt: '' } });
  const data = await page.evaluate(id => Meteor.callAsync('archivedCardContributions', id, 2024), board.boardId);
  expect(data.days.reduce((sum, day) => sum + day.count, 0)).toBe(1);
});


test('archive totals exclude other boards and hidden-only labels', async ({ page, user, user2, board }) => {
  const cards = seed(board, user2.id);
  db.updateOne('boards', { _id: board.boardId }, { $push: {
    labels: { _id: 'secret', name: 'Hidden label', color: 'red' },
    members: { userId: user2.id, isActive: true, isReadAssignedOnly: true },
  } });
  db.updateOne('cards', { _id: cards[1]._id }, { $set: { labelIds: ['secret'] } });
  const foreign = { ...cards[0], _id: `archive-foreign-${board.boardId}`, boardId: 'foreign-board',
    archived: true, archivedAt: new Date('2024-02-29'), assignees: [user2.id] };
  db.insertOne('cards', foreign);
  try {
    await loginWithToken(page, user2.id, user2.token);
    const data = await page.evaluate(id => Meteor.callAsync('archivedCardContributions', id, 2024), board.boardId);
    expect(data.days.reduce((sum, day) => sum + day.count, 0)).toBe(1);
    expect(JSON.stringify(data)).not.toContain('Hidden label');
  } finally { db.deleteOne('cards', { _id: foreign._id }); }
});
