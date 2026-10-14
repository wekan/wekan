'use strict';
const { test, expect } = require('../fixtures');
const { navigateInApp } = require('../helpers/auth');
const en = require('../../../imports/i18n/data/en.i18n.json');
for (const language of ['ig', 'gd', 'ga', 'mg', 'ht', 'la', 'st', 'mt', 'sw', 'co']) {
const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
for (const format of [...(language === 'gd' ? ['todoist', 'planner', 'jira', 'excel'] : []),...(language === 'ga' ? ['todoist', 'planner', 'jira', 'excel'] : []),...(language === 'mg' ? ['todoist', 'planner', 'csv', 'jira', 'excel'] : []),...(language === 'ht' ? ['jira', 'excel', 'todoist', 'planner'] : []),...(language === 'la' ? ["trello", "kanboard", "deck", "openproject", "asana", "zenkit", "csv", "jira", "excel", "wekan", "todoist", "planner"] : []), ...(language === 'st' ? ['markdown', 'taskwarrior', 'focalboard', 'todoist', 'planner', 'jira', 'excel'] : []), ...(language === 'co' ? ['zenkit', 'jira', 'excel', 'kanboard', 'deck', 'openproject', 'focalboard', 'todoist', 'planner'] : []), 'opml', 'orgmode', 'meistertask', 'obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri', 'pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja', 'quire', 'wrike', 'teamwork', 'businessmap', 'redmine', 'notion', 'plane']) {
  if (language === 'la' && !["opml", "orgmode", "meistertask", "obsidian", "linear", "ticktick", "clickup", "nullboard", "kanri", "pivotal", "tasksorg", "monday", "trello", "superproductivity", "taiga", "vikunja", "quire", "wrike", "teamwork", "businessmap", "redmine", "notion", "plane", "kanboard", "deck", "openproject", "asana", "zenkit", "csv", "jira", "excel", "wekan", "todoist", "planner"].includes(format)) continue;
  if (language === 'ht' && !['jira', 'excel', 'todoist', 'planner','opml', 'orgmode', 'meistertask', 'obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri', 'pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja', 'quire', 'wrike', 'teamwork', 'businessmap', 'redmine', 'notion', 'plane'].includes(format)) continue;

  test(`Import instructions and limits for ${format} in ${language}`, async ({ loggedInPage: page }) => {
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
    await navigateInApp(page, `/import/${format}`);
    const label = page.locator('label[for="import-textarea"]');
    await expect(label).toContainText(strings[`import-board-instruction-${format}`]);
    await expect(label).not.toContainText(en[`import-board-instruction-${format}`]);
    if (['excel', 'planner', 'monday', 'wrike', 'teamwork', 'businessmap'].includes(format)) await expect(page.locator('#import-file')).toBeEmpty();
    else await expect(page.locator('#import-textarea')).toBeEmpty();
  });
}
}

test('Latin malformed JSON import reports the translated error and retains the input', async ({ loggedInPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/import/wekan');
  const input = page.locator('#import-textarea');
  await input.fill('{ invalid JSON');
  await input.locator('xpath=ancestor::form').locator('input[type="submit"]').click();
  await expect(page.locator('.warning')).toContainText('Textus tuus non est JSON validum');
  await expect(page.locator('.warning')).not.toContainText('Latine:');
  await expect(input).toHaveValue('{ invalid JSON');
});

test('Latin Trello import labels identify files and credential inputs', async ({ loggedInPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/import/trello');
  await expect(page.locator('label[for="import-zip-file"]')).toHaveText('Fasciculus .zip Trello');
  await expect(page.locator('label[for="trello-api-key"]')).toContainText('Clavis API Trello');
  await expect(page.locator('label[for="trello-api-token"]')).toContainText('Tessera API Trello');
  await expect(page.locator('#trello-api-token')).toHaveAttribute('type', 'password');
  await expect(page.locator('.js-trello-list-workspaces')).toHaveText('Enumera spatia laboris Trello');
});
