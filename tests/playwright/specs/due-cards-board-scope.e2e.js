'use strict';
// c64b3a3b1d: the dueCards publication reads only the _id and members of the
// boards it may show, and with no assigned-only board its board scope is a
// plain { boardId: { $in } }. What the page shows must not change: a board's
// due cards are listed, and on a board where the user is an assigned-only
// member only the cards assigned to them are - in "me" and in "all users"
// alike. (tests/dbSpeedTest.test.cjs pins the selector itself.)
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

const due = new Date(Date.now() + 3 * 24 * 3600 * 1000);

async function dueTitles(page) {
  const titles = page.locator('.due-cards-list .result-card-wrapper .minicard-title-text');
  await expect(titles.first()).toBeVisible({ timeout: 20_000 });
  // The list settles once the subscription is ready; read it when it stops changing.
  let last = '';
  await expect.poll(async () => {
    const now = (await titles.allTextContents()).map(t => t.trim()).sort().join('|');
    const settled = now === last;
    last = now;
    return settled;
  }, { intervals: [400] }).toBe(true);
  return last.split('|');
}

test('Due Cards lists a board\'s due cards, and only the assigned ones of an assigned-only board', async ({ page, user, user2 }) => {
  const stamp = Date.now();
  const t = name => `${name} ${stamp}`;
  // Where user2 is a normal member.
  const open = db.seedBoard({ ownerId: user.id, title: 'Due scope open', listCount: 2,
    cardTitlesPerList: [[t('Due Mine')], [t('Due Others')]] });
  // Where user2 is an assigned-only member.
  const narrow = db.seedBoard({ ownerId: user.id, title: 'Due scope narrow', listCount: 3,
    cardTitlesPerList: [[t('Due Assigned')], [t('Due Member Only')], [t('Due Not Mine')]] });
  try {
    db.addBoardMember({ boardId: open.boardId, userId: user2.id });
    db.updateOne('boards', { _id: narrow.boardId }, { $push: { members: {
      userId: user2.id, isActive: true, isAdmin: false, isNormalAssignedOnly: true } } });
    const id = (board, title) => db.findCardIdByTitle({ boardId: board.boardId, title: t(title) });
    for (const [board, title, set] of [
      [open, 'Due Mine', { members: [user2.id] }],
      [open, 'Due Others', {}],
      [narrow, 'Due Assigned', { assignees: [user2.id] }],
      // A member of the card, but not assigned: the client's "me" filter would
      // take it, so only the publication's board scope keeps it out.
      [narrow, 'Due Member Only', { members: [user2.id] }],
      [narrow, 'Due Not Mine', {}],
    ]) db.updateOne('cards', { _id: id(board, title) }, { $set: { dueAt: due, ...set } });

    await loginWithToken(page, user2.id, user2.token);
    await page.evaluate(() => { try { localStorage.setItem('dueCardsView', 'me'); } catch (e) { /* default is me */ } });
    await navigateInApp(page, '/due-cards');
    const mine = (await dueTitles(page)).filter(title => title.endsWith(String(stamp)));
    expect(mine).toEqual([t('Due Assigned'), t('Due Mine')].sort());

    // "All users": every due card of the open board, still only the assigned
    // one of the narrow board (negative).
    await page.evaluate(() => { localStorage.setItem('dueCardsView', 'all'); });
    await page.reload();
    await page.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.userId());
    await navigateInApp(page, '/due-cards');
    const all = (await dueTitles(page)).filter(title => title.endsWith(String(stamp)));
    expect(all).toEqual([t('Due Assigned'), t('Due Mine'), t('Due Others')].sort());
    expect(all).not.toContain(t('Due Member Only'));
    expect(all).not.toContain(t('Due Not Mine'));

    // The owner, with no assigned-only board (the plain boardId list): every
    // due card of both boards.
    await page.evaluate(() => { localStorage.setItem('dueCardsView', 'all'); });
    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, '/due-cards');
    const owners = (await dueTitles(page)).filter(title => title.endsWith(String(stamp)));
    expect(owners).toEqual(['Due Mine', 'Due Others', 'Due Assigned', 'Due Member Only', 'Due Not Mine'].map(t).sort());
  } finally {
    try { await page.evaluate(() => localStorage.removeItem('dueCardsView')); } catch (e) { /* page gone */ }
    db.cleanup({ boardIds: [open.boardId, narrow.boardId] });
  }
});
