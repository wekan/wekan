'use strict';
const { test, expect } = require('../fixtures');

test('Latin font popup labels the default as no custom font', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    Popup.open('changeFont')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const form = page.locator('.js-pop-over form.change-font');
  await expect(form).toBeVisible();
  await expect(form.locator('label').first()).toHaveText('Forma litterarum');
  const defaultFont = form.locator('.js-ui-font-btn[data-font=""]');
  await expect(defaultFont).toHaveText('Praedefinitum (sine forma litterarum propria)');
  await expect(defaultFont).not.toContainText('Latine:');
  await expect(form.locator('.font-preview')).toHaveText('Vulpes fusca celeris super canem pigrum salit 0123456789');
  await expect(form.locator('label').filter({ hasText: 'Magnitudo litterarum' })).toBeVisible();
});


test('Latin preferences explain keyboard modes and multiple card windows', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    Popup.open('changeSettings')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const pop = page.locator('.js-pop-over');
  const enter = pop.locator('.js-toggle-submit-on-enter');
  await expect(enter).toContainText('Serva textum editorum premendo Enter');
  await expect(enter).toHaveAttribute('title', /Shift\+Enter novam lineam inserit/);
  await expect(enter).toHaveAttribute('title', /Si inactiva est, Ctrl\/Cmd\+Enter servat et Enter novam lineam inserit/);
  await expect(pop.locator('.js-toggle-open-many-cards-at-once')).toHaveAttribute('title', /inactiva est.*claudis eam quae aperta erat/);
});
