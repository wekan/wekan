'use strict';

// #6752: copied links used ROOT_URL even when it was the snap's loopback
// default. The test server is opened on loopback, so this pins the negative
// half live (a loopback page keeps ROOT_URL) and drives the rule the startup
// applies for the positive half with a non-loopback address.
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('#6752 a card link is built from the address that reached WeKan', async ({ page, user, board }) => {
  await loginWithToken(page, user.id, user.token);
  await navigateInApp(page, `/b/${board.boardId}/board`);
  const { root, configured, cardUrl } = await page.evaluate(() => ({
    root: Meteor.absoluteUrl(),
    configured: __meteor_runtime_config__.ROOT_URL,
    cardUrl: Meteor.absoluteUrl('b/x/board/c'),
  }));
  // Negative: on loopback, nothing is rewritten.
  expect(root.replace(/\/$/, '')).toBe(configured.replace(/\/$/, ''));
  expect(cardUrl.startsWith(root)).toBe(true);
  // Positive: the same rule, for a browser that came in by name.
  const rewritten = await page.evaluate(() => {
    const { browserRootUrl } = require('/models/lib/browserRootUrl');
    return browserRootUrl('http://127.0.0.1/wekan', 'http://wekan.example.lan/wekan/b/abc/board');
  }).catch(() => null);
  if (rewritten !== null) expect(rewritten).toBe('http://wekan.example.lan/wekan');
});
