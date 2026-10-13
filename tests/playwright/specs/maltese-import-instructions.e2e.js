'use strict';
const { test, expect } = require('../fixtures');
const { navigateInApp } = require('../helpers/auth');
const mt = require('../../../imports/i18n/data/mt.i18n.json');
const en = require('../../../imports/i18n/data/en.i18n.json');
for (const format of ['opml', 'orgmode', 'meistertask', 'obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri', 'pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja', 'quire', 'wrike', 'teamwork', 'businessmap', 'redmine', 'notion', 'plane']) {
  test(`Maltese import instructions and limits for ${format}`, async ({ loggedInPage: page }) => {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'mt'));
    await navigateInApp(page, `/import/${format}`);
    const label = page.locator('label[for="import-textarea"]');
    await expect(label).toContainText(mt[`import-board-instruction-${format}`]);
    await expect(label).not.toContainText(en[`import-board-instruction-${format}`]);
    await expect(page.locator('#import-textarea')).toBeEmpty();
  });
}
