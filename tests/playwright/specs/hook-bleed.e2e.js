'use strict';
// HookBleed (2026-10-02): any board member could make the server post their
// own text through the board's chat webhook, as WeKan. From a client only the
// card-opened notification may be sent now; anything else is refused and
// recorded.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('a member cannot send their own message through a board webhook', async ({ page, user, board }) => {
  const hookId = `hook${Date.now()}`;
  db.insertOne('integrations', { _id: hookId, boardId: board.boardId, url: 'https://hooks.example/wekan', type: 'outgoing-webhooks',
    enabled: true, activities: ['all'], userId: user.id, createdAt: new Date() });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.evaluate(async boardId => {
      try { await Meteor.callAsync('outgoingWebhooks', { url: 'https://hooks.example/wekan', boardId, type: 'bidirectional-webhooks' },
        'act-anything', { text: 'Your account is suspended, log in at https://phish.example' }); } catch (e) { /* refused */ }
    }, board.boardId);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'HookBleed', source: 'outgoingWebhooks' })?.count).toBeGreaterThan(0);
  } finally {
    db.deleteMany('integrations', { _id: hookId });
    db.updateOne('users', { _id: user.id }, { $unset: { loginDisabled: 1 } });
  }
});

// #6782: the server's OWN delivery of a card move was taken for a client
// forging one - it ran inside the mover's method, whose connection Meteor
// passes on - so moving a card with a webhook enabled was logged as HookBleed
// and disabled the mover's account.
test('moving a card with a webhook enabled is no HookBleed, and the mover keeps their account', async ({ boardPage: page, user, board }) => {
  const BoardPage = require('../pages/BoardPage');
  const CardPage = require('../pages/CardPage');
  const hookId = `hook${Date.now()}`;
  const start = new Date();
  db.insertOne('integrations', { _id: hookId, boardId: board.boardId, url: 'https://hooks.example/wekan', type: 'outgoing-webhooks',
    enabled: true, activities: ['act-moveCard'], userId: user.id, createdAt: new Date() });
  try {
    const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    await new BoardPage(page).clickCard(source.listId, source.title);
    const card = new CardPage(page);
    await card.waitForOpen();
    await card.openActionsMenu();
    await card.clickAction('.js-move-card');
    const popup = page.locator('.js-pop-over');
    await popup.locator('.js-select-lists').selectOption(board.listIds[1]);
    await popup.locator('.js-done').click();
    await expect.poll(() => db.getCard(source._id).listId).toBe(board.listIds[1]);
    await expect.poll(() => db.findOne('activities', { cardId: source._id, activityType: 'moveCard' })).toBeTruthy();
    // The delivery is fire-and-forget (and this hook's host does not exist):
    // give it the time it takes to be refused, which is when the old code logged.
    await page.waitForTimeout(3000);
    expect(db.findOne('eventlog', { bleed: 'HookBleed', at: { $gte: start } })).toBeFalsy();
    expect(db.findOne('users', { _id: user.id }).loginDisabled).not.toBe(true);
    // Still signed in: the board answers the next move as well.
    await page.reload();
    await expect(page.locator('.js-minicard').first()).toBeVisible({ timeout: 30_000 });
  } finally {
    db.deleteMany('integrations', { _id: hookId });
    db.updateOne('users', { _id: user.id }, { $unset: { loginDisabled: 1 } });
  }
});
