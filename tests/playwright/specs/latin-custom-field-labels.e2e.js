'use strict';
const { test, expect } = require('../fixtures');

test('Latin custom field form translates types and dropdown instructions', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    // Popup.open's handler takes its data context from `this`; called bare it
    // was undefined and createCustomFieldPopup.onCreated threw reading
    // data.type. Open it the way cardCustomFields.js does, with an empty
    // (new-field) context.
    Popup.open('createCustomField').call({}, { currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const pop = page.locator('.js-pop-over');
  await expect(pop.locator('.js-field-automatically-on-card')).toContainText('Adde campum chartis novis');
  await expect(pop.locator('.js-field-always-on-card')).toContainText('Adde campum omnibus chartis');
  await expect(pop.locator('option[value="text"]')).toHaveText('Textus');
  await expect(pop.locator('option[value="number"]')).toHaveText('Numerus');
  await expect(pop.locator('option[value="currency"]')).toHaveText('Moneta');
  await pop.locator('select.js-field-type').selectOption('dropdown');
  await expect(pop.locator('.js-dropdown-item.last')).toHaveAttribute('placeholder', 'Preme Enter ut plures optiones addas');
  await expect(pop.locator('.js-dropdown-item.last')).toHaveValue('');
  await pop.locator('select.js-field-type').selectOption('stringtemplate');
  const settings = pop.locator('.js-field-settings-stringtemplate');
  await expect(settings).toBeVisible();
  await expect(settings.locator('label').first()).toHaveText('Forma (utere %{value} ut signo substituendo)');
  await expect(settings.locator('label').last()).toHaveText('Separator (utere &#32; aut &nbsp; pro spatio)');
  await expect(pop.locator('.js-field-settings-dropdown')).toBeHidden();

});
