'use strict';
// Member menu / Support: a signed-out visitor of /support sees a Public page,
// and on a page that is not Public sees "only for logged-in users" - with the
// page's text never sent to their browser.
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test('a signed-out visitor sees a Public Support page and not one that is not Public', async ({ page }) => {
  const before = db.findOne('settings', {}, { supportPageEnabled: 1, supportPagePublic: 1, supportPageText: 1 }) || {};
  const text = `Support-${db.uid('text')}`;
  const set = $set => db.updateOne('settings', {}, { $set });
  try {
    set({ supportPageEnabled: true, supportPagePublic: true, supportPageText: text });
    await page.goto(`${BASE_URL}/support`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.support-page-content')).toContainText(text);
    expect(new URL(page.url()).pathname).toBe('/support');

    // Negative: not Public - the message, and the text is not in the browser.
    set({ supportPagePublic: false });
    await page.goto(`${BASE_URL}/support`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.support-page-content')).toBeVisible();
    await expect(page.locator('.support-page-content')).not.toContainText(text);
    await page.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.status().connected);
    // The client's copy of the settings document (Minimongo), once it arrived.
    await expect.poll(() => page.evaluate(() =>
      (Meteor.connection._mongo_livedata_collections?.settings?.find({}).fetch() || []).length)).toBeGreaterThan(0);
    const sent = await page.evaluate(() => Meteor.connection._mongo_livedata_collections.settings
      .find({}).fetch().map(d => d.supportPageText).filter(Boolean));
    expect(sent).toEqual([]);
    expect(await page.content()).not.toContain(text);
  } finally {
    set({
      supportPageEnabled: before.supportPageEnabled ?? false,
      supportPagePublic: before.supportPagePublic ?? false,
      supportPageText: before.supportPageText ?? '',
    });
  }
});
