'use strict';
// #3249: a board visible to every signed-in user of the instance, never to
// somebody who is not signed in, and editable only by its members.
const { request: playwrightRequest } = require('@playwright/test');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

// Subscribe to the board as this page's user and report what arrived.
const boardSeen = (page, boardId) => page.evaluate(id => new Promise(resolve => {
  const handle = Meteor.subscribe('board', id, false, {
    onReady() {
      // Meteor's client-side copies of what the server published.
      const local = Meteor.connection._mongo_livedata_collections;
      const seen = !!local.boards?.findOne({ _id: id }) && (local.cards?.find({ boardId: id }).count() || 0);
      // Resolve BEFORE stopping: stop() calls onStop at once, which would
      // otherwise answer false first and make every negative meaningless.
      resolve(seen);
      handle.stop();
    },
    onStop() { resolve(false); },
  });
}), boardId);

test('the owner can make a board visible to signed-in users', async ({ boardPage: page, board }) => {
  await page.locator('.board-header-btn.js-change-visibility').first().click();
  await page.locator('.js-select-visibility', { hasText: /signed-in users/i }).click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).permission).toBe('instance');
  await expect(page.locator('.board-header-btn.js-change-visibility i.fa-users')).toBeVisible();
});

test('any signed-in user reads it, only members edit it', async ({ page, board, user2 }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'instance' } });
  await loginWithToken(page, user2.id, user2.token);
  await openBoard(page, board.boardId, board.slug);
  await expect(page.locator('.minicard', { hasText: 'Alpha Card' })).toBeVisible();

  // Listed for them on /public (the fixture does not carry the title).
  const title = db.findOne('boards', { _id: board.boardId }).title;
  await page.goto('/public', { waitUntil: 'domcontentloaded' });
  await page.locator('.js-table-page-search').fill(title);
  await page.locator('.js-table-page-search').press('Enter');
  await expect(page.locator('a', { hasText: title }).first()).toBeVisible();

  // Negative: reading is all it grants.
  const write = await page.request.post(`/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards`, {
    headers: { Authorization: `Bearer ${user2.token}`, 'Content-Type': 'application/json' },
    data: { authorId: user2.id, swimlaneId: board.swimlaneId, title: 'Not a member' },
  });
  expect(write.status()).not.toBe(200);
  expect(db.findOne('cards', { boardId: board.boardId, title: 'Not a member' })).toBeNull();

  // Negative: back to private, and the same user sees nothing.
  db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'private' } });
  // Earlier subscriptions may still have this board in Minimongo while the
  // permission change propagates; require the reactive revocation to settle.
  await expect.poll(() => boardSeen(page, board.boardId)).toBeFalsy();
});

test('nobody signed out sees it anywhere', async ({ browser, board, baseURL }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'instance' } });
  const context = await browser.newContext();
  const page = await context.newPage();
  const anonymous = await playwrightRequest.newContext({ baseURL });
  try {
    // Signed out, /public sends the visitor to sign in; ask the server directly.
    await page.goto('/public', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.status().connected);
    expect(await boardSeen(page, board.boardId)).toBeFalsy();
    expect(await page.evaluate(() => Meteor.callAsync('getPublicBoardsCount', ''))).toBe(
      db.find('boards', { permission: 'public', archived: false, type: 'board', title: { $not: /^\^.*\^$/ } }).length);
    // Export and card preview routes answer nothing without a token.
    const exported = await anonymous.get(`/api/boards/${board.boardId}/export`);
    expect(exported.status()).not.toBe(200);
    // The same board made public IS visible - the negative above is the rule, not a broken page.
    db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
    expect(await boardSeen(page, board.boardId)).toBeTruthy();
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'private' } });
    await anonymous.dispose();
    await context.close();
  }
});

test('"private boards only" refuses an instance-wide board too', async ({ boardPage: page, board }) => {
  const id = 'tableVisibilityMode-allowPrivateOnly';
  const prior = db.findOne('tableVisibilityModeSettings', { _id: id });
  if (prior) db.updateOne('tableVisibilityModeSettings', { _id: id }, { $set: { booleanValue: true } });
  else db.insertOne('tableVisibilityModeSettings', { _id: id, booleanValue: true, sort: 0 });
  const created = [];
  try {
    const result = await page.evaluate(() => window.Meteor.callAsync('createBoardWithInitialSwimlanes',
      { title: 'Instance policy test', slug: 'instance-policy-test', permission: 'instance' }));
    const boardId = typeof result === 'string' ? result : result.boardId;
    created.push(boardId);
    expect(db.findOne('boards', { _id: boardId }).permission).toBe('private');
    // And switching an existing board is refused by the update rule.
    const switched = await page.evaluate(boardId => new Promise(resolve => {
      window.Meteor.connection._mongo_livedata_collections.boards && window.Meteor.call(
        '/boards/update', { _id: boardId }, { $set: { permission: 'instance' } }, {}, error => resolve(error ? 'refused' : 'allowed'));
    }), board.boardId);
    expect(switched).toBe('refused');
    expect(db.findOne('boards', { _id: board.boardId }).permission).toBe('private');
  } finally {
    db.cleanup({ boardIds: created.filter(Boolean) });
    if (prior) db.updateOne('tableVisibilityModeSettings', { _id: id }, { $set: { booleanValue: prior.booleanValue } });
    else db.deleteOne('tableVisibilityModeSettings', { _id: id });
  }
});
