'use strict';

// ImportBleed (GHSA-qp32-wqxw-wq3h): a real logged-out DDP connection must be
// rejected before importBoard can create anything in MongoDB.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('ImportBleed authentication', () => {
  test.use({ storageState: undefined });

  test('logged-out DDP import is rejected without creating a board', async ({ page }) => {
    const title = `ImportBleed-${Date.now()}`;
    const before = db.countDocuments('boards', { title });

    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'commit' });
    await waitForMeteor(page);
    expect(await page.evaluate(() => Meteor.userId())).toBeNull();

    const error = await page.evaluate(async boardTitle => {
      try {
        await Meteor.callAsync('importBoard', {
          title: boardTitle,
          archived: false,
          color: 'belize',
          permission: 'private',
          members: [], users: [], lists: [], swimlanes: [], cards: [],
          labels: [], comments: [], activities: [], customFields: [],
        }, {}, 'wekan', null);
        return null;
      } catch (err) {
        return { error: err.error, reason: err.reason, message: err.message };
      }
    }, title);

    expect(error).not.toBeNull();
    expect(error.error).toBe('error-notAuthorized');
    await expect.poll(() => db.countDocuments('boards', { title })).toBe(before);
  });
});
