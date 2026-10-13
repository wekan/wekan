'use strict';
const { test, expect } = require('../fixtures');
const { navigateInApp } = require('../helpers/auth');
const en = require('../../../imports/i18n/data/en.i18n.json');
for (const language of ['mt', 'sw']) {
const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
for (const format of ['opml', 'orgmode', 'meistertask', 'obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri', 'pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja', 'quire', 'wrike', 'teamwork', 'businessmap', 'redmine', 'notion', 'plane']) {
  test(`Import instructions and limits for ${format} in ${language}`, async ({ loggedInPage: page }) => {
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
    await navigateInApp(page, `/import/${format}`);
    const label = page.locator('label[for="import-textarea"]');
    await expect(label).toContainText(strings[`import-board-instruction-${format}`]);
    await expect(label).not.toContainText(en[`import-board-instruction-${format}`]);
    await expect(page.locator('#import-textarea')).toBeEmpty();
  });
}
}
