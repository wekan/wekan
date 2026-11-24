'use strict';
// Workload and capacity (docs/Features/Workload/README.md): the user menu's
// page shows each person's estimated hours, week by week, against their
// working time across their boards; a week over 100 % is red, an absence takes
// the week's hours away, and another member's absence shows no type or note.
// tests/workload.test.cjs and tests/workloadAccess.test.cjs pin the rules.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

function monday(offsetWeeks = 0) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const back = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - back + 7 * offsetWeeks);
  return d;
}
const day = date => date.toISOString().slice(0, 10);
const plus = (date, n) => new Date(date.getTime() + n * 86400000);

test('Workload shows hours against capacity across boards, red over 100 %', async ({ page, user, user2 }) => {
  const stamp = Date.now();
  const next = monday(1);
  const x = db.seedBoard({ ownerId: user.id, title: `Workload X ${stamp}`, listCount: 1, cardTitlesPerList: [[`WX ${stamp}`]] });
  const y = db.seedBoard({ ownerId: user.id, title: `Workload Y ${stamp}`, listCount: 1, cardTitlesPerList: [[`WY ${stamp}`]] });
  try {
    db.addBoardMember({ boardId: x.boardId, userId: user2.id });
    db.addBoardMember({ boardId: y.boardId, userId: user2.id });
    // Next week: 30 h on board X and 20 h on board Y for user2 - 50 of 37.5 h.
    db.updateOne('cards', { _id: db.findCardIdByTitle({ boardId: x.boardId, title: `WX ${stamp}` }) },
      { $set: { assignees: [user2.id], startAt: next, dueAt: plus(next, 4), estimatedHours: 30 } });
    db.updateOne('cards', { _id: db.findCardIdByTitle({ boardId: y.boardId, title: `WY ${stamp}` }) },
      { $set: { assignees: [user2.id], startAt: next, dueAt: plus(next, 4), estimatedHours: 20 } });
    db.insertOne('workloadAbsences', { _id: `abs-${stamp}`, userId: user2.id, start: day(plus(next, 7)), end: day(plus(next, 11)), type: 'sick', note: `flu ${stamp}` });

    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, '/workload');
    const row = page.locator('tr.workload-row').filter({ has: page.locator(`a.js-workload-cell[data-user="${user2.id}"]`) });
    await expect(row).toBeVisible({ timeout: 20_000 });
    const cells = row.locator('td.workload-cell');
    // The page starts this week: next week is the second column.
    await expect(cells.nth(1)).toHaveClass(/is-over/);
    await expect(cells.nth(1).locator('.workload-cell-value')).toHaveText('50 / 37.5 h');
    await expect(cells.nth(1).locator('.workload-cell-percent')).toHaveText('133 %');
    // The week after: absent all week, no hours (negative: not red without work).
    await expect(cells.nth(2).locator('.workload-cell-value')).toHaveText('0 / 0 h');
    await expect(cells.nth(2).locator('.workload-cell-absent')).toContainText('5');

    // The week's cards, from both boards.
    await cells.nth(1).locator('a.js-workload-cell').click();
    await expect(page.locator('.workload-card-list li')).toHaveCount(2);

    // Negative: another member's absence shows no type and no note.
    await expect(page.locator('body')).not.toContainText(`flu ${stamp}`);

    // A person's own working time: 60 % of 37.5 h.
    await page.locator('#workload-percent').fill('60');
    await page.locator('form.js-workload-capacity button[type="submit"]').click();
    await expect(page.locator('.workload-saved')).toBeVisible();
    expect(db.findOne('workloadCapacities', { userId: user.id }).workPercent).toBe(60);
  } finally {
    db.deleteMany('workloadAbsences', { userId: user2.id });
    db.deleteMany('workloadCapacities', { userId: { $in: [user.id, user2.id] } });
    db.cleanup({ boardIds: [x.boardId, y.boardId] });
  }
});
