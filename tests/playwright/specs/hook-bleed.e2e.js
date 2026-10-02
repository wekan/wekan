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
