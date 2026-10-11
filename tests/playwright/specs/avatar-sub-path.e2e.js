'use strict';
// UCS: after an upgrade, avatars were empty circles on WeKan's /wekan sub-path,
// because a stored /cdn/storage/avatars/<id> was rendered as is, outside WeKan.
// And lazily loaded code was fetched from ROOT_URL's host, which a browser that
// came in by another name could not resolve. models/lib/avatarDisplayUrl.js and
// models/lib/dynamicImportOrigin.js.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('a stored avatar URL is drawn under the path WeKan is served at now', async ({ loggedInPage, user }) => {
  const b = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Avatar card']] });
  // An avatar chosen while WeKan ran under an old host and /wekan prefix.
  db.updateOne('users', { _id: user.id },
    { $set: { 'profile.avatarUrl': 'https://old-name.example/wekan/cdn/storage/avatars/subPathAvatar1' } });
  try {
    await openBoard(loggedInPage, b.boardId, b.slug);
    const prefix = await loggedInPage.evaluate(() => __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '');
    const img = loggedInPage.locator('img.avatar-image[src*="subPathAvatar1"]').first();
    await expect(img).toBeAttached({ timeout: 15_000 });
    const src = await img.getAttribute('src');
    expect(src.startsWith(`${prefix}/cdn/storage/avatars/subPathAvatar1`)).toBe(true);
    // Negative: neither the old host nor the old prefix survives.
    expect(src).not.toContain('old-name.example');
    if (prefix !== '/wekan') expect(src).not.toContain('/wekan/');
  } finally {
    db.updateOne('users', { _id: user.id }, { $unset: { 'profile.avatarUrl': '' } });
    db.cleanup({ boardIds: [b.boardId] });
  }
});

test('lazily loaded code is fetched from the page origin, not ROOT_URL\'s host', async ({ loggedInPage }) => {
  await loggedInPage.goto('/');
  const setting = await loggedInPage.evaluate(() => {
    const p = __meteor_runtime_config__.PUBLIC_SETTINGS || {};
    return p.packages && p.packages['dynamic-import'] && p.packages['dynamic-import'].useLocationOrigin;
  });
  expect(setting).toBe(true);
});
