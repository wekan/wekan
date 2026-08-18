const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const boards = read('models/boards.js');
const sidebar = read('client/components/sidebar/sidebar.js');
const sidebarTemplate = read('client/components/sidebar/sidebar.jade');
const details = read('client/components/cards/cardDetails.js');
const detailsTemplate = read('client/components/cards/cardDetails.jade');
const minicard = read('client/components/cards/minicard.js');
const minicardTemplate = read('client/components/cards/minicard.jade');

test('custom fields default on for cards and off for minicards', () => {
  const cardSetting = boards.slice(boards.indexOf('allowsCustomFields: {'));
  assert.match(cardSetting.slice(0, cardSetting.indexOf('},') + 2),
    /defaultValue: true/);
  const miniSetting = boards.slice(boards.indexOf('allowsCustomFieldsOnMinicard: {'));
  assert.match(miniSetting.slice(0, miniSetting.indexOf('},') + 2),
    /defaultValue: false/);
  assert.match(details, /board\?\.allowsCustomFields !== false/);
  assert.match(minicard, /board\?\.allowsCustomFieldsOnMinicard === true/);
});

test('card and minicard menus expose independent Custom Fields rows', () => {
  assert.match(sidebarTemplate, /js-field-has-custom-fields/);
  assert.match(sidebarTemplate, /js-field-has-custom-fields-on-minicard/);
  assert.match(sidebarTemplate, /\{\{_ 'custom-fields'\}\}/);
  assert.match(sidebar, /'click \.js-field-has-custom-fields'/);
  assert.match(sidebar, /\$set: \{ allowsCustomFields: !currentValue \}/);
  assert.match(sidebar, /'click \.js-field-has-custom-fields-on-minicard'/);
  assert.match(sidebar,
    /\$set: \{ allowsCustomFieldsOnMinicard: !currentValue \}/);
});

test('each card surface is gated only by its matching setting', () => {
  assert.match(detailsTemplate, /if canShowCustomFieldsOnCard[\s\S]*each customFieldsWD/);
  assert.match(minicardTemplate,
    /if showCustomFieldsOnMinicard[\s\S]*each customFieldsWD/);
});
