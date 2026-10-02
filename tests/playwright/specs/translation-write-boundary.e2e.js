'use strict';
// MegaBleed / TenantBleed sibling (2026-10-02): any logged-in user could
// insert a custom translation whose _id was their own user id; several
// translated strings render as HTML in an admin's browser.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('an ordinary user cannot write custom translations', async ({ page, user, board }) => {
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  const result = await page.evaluate(async userId => {
    try {
      await Meteor.callAsync('/translation/insert', { _id: userId, language: 'en', text: 'board-public-info',
        translationText: '<img src=x onerror=alert(1)>' });
      return 'inserted';
    } catch (error) { return 'denied'; }
  }, user.id);
  expect(result).toBe('denied');
  expect(db.findOne('translation', { _id: user.id })).toBeNull();
  await expect.poll(() => db.findOne('eventlog', { source: 'canary:tenant.mutate-without-admin' })?.count ?? 0).toBeGreaterThan(0);
});
